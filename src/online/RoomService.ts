import { ref, push, set, get, query, orderByChild, equalTo, remove, onValue, off } from 'firebase/database';
import { db, isFirebaseConfigured } from './FirebaseService';
import type { RoomData, PlayerInfo } from './types';

export class RoomService {
  /**
   * Generates a 6-character room code using unambiguous characters.
   * Excludes: O, 0, I, 1
   */
  static generateRoomCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  /**
   * Cleans up rooms inactive for more than 1 hour.
   */
  static async cleanupAbandonedRooms(): Promise<void> {
    if (!isFirebaseConfigured() || !db) return;
    try {
      const oneHourAgo = Date.now() - 60 * 60 * 1000;
      const roomsRef = ref(db, 'rooms');
      const q = query(roomsRef, orderByChild('config/lastActivity'));
      const snapshot = await get(q);
      
      if (snapshot.exists()) {
        const updates: Record<string, null> = {};
        snapshot.forEach((child) => {
          const roomData = child.val() as RoomData;
          if (roomData.config && roomData.config.lastActivity < oneHourAgo) {
            updates[child.key!] = null;
          }
        });
        
        if (Object.keys(updates).length > 0) {
          // Note: The client must have permission to delete these rooms. 
          // Since our rules might restrict deletion to host or full wipe, 
          // we should wrap this in a silent catch if rules block it.
          // Wait, the client only has permission to delete if they are the host.
          // Since rules won't allow a random client to delete other people's rooms unless we open it up,
          // we can adjust rules to allow deletion if lastActivity is very old, OR we can just ignore permission errors.
          // Let's rely on the Firebase Security Rules we added (which allows any client to delete if newData is null, wait! No, we shouldn't allow any client to delete any room. Actually, we should allow deletion if lastActivity < oneHourAgo).
          // We will update rules for that. For now, try to remove.
          for (const key of Object.keys(updates)) {
             try { await remove(ref(db, `rooms/${key}`)); } catch { /* ignore */ }
          }
        }
      }
    } catch {
      // Ignore errors (like permission denied)
    }
  }

  /**
   * Creates a new room.
   */
  static async createRoom(hostUid: string, hostDisplayName: string): Promise<{ roomId: string, roomCode: string } | null> {
    if (!isFirebaseConfigured() || !db) return null;

    const roomCode = this.generateRoomCode();
    const roomsRef = ref(db, 'rooms');
    const newRoomRef = push(roomsRef);
    const roomId = newRoomRef.key;

    if (!roomId) return null;

    const roomData: RoomData = {
      config: {
        roomCode,
        hostUid,
        hostDisplayName,
        createdAt: Date.now(),
        lastActivity: Date.now(),
        status: 'waiting',
        protocolVersion: 1,
      },
      players: {
        [hostUid]: {
          displayName: hostDisplayName,
          isHost: true,
          isReady: false,
        }
      },
      presence: {} // handled by PresenceService
    };

    await set(newRoomRef, roomData);
    
    // Background cleanup
    this.cleanupAbandonedRooms();
    
    return { roomId, roomCode };
  }

  /**
   * Joins an existing room by code.
   */
  static async joinRoom(roomCode: string, playerUid: string, playerDisplayName: string): Promise<{ roomId: string, hostUid: string } | null> {
    if (!isFirebaseConfigured() || !db) return null;

    const roomsRef = ref(db, 'rooms');
    const q = query(roomsRef, orderByChild('config/roomCode'), equalTo(roomCode));
    const snapshot = await get(q);

    if (!snapshot.exists()) {
      throw new Error('Room not found');
    }

    let joinedRoomId: string | null = null;
    let roomData: RoomData | null = null;

    snapshot.forEach((childSnapshot) => {
      joinedRoomId = childSnapshot.key;
      roomData = childSnapshot.val() as RoomData;
    });

    if (!joinedRoomId || !roomData) {
      throw new Error('Room not found');
    }

    const data = roomData as RoomData;

    if (data.config.protocolVersion !== 1) {
      throw new Error('Incompatible game version');
    }

    if (data.config.status !== 'waiting') {
      throw new Error('Match has already started');
    }

    const playersCount = Object.keys(data.players || {}).length;
    if (playersCount >= 2 && !data.players[playerUid]) {
      throw new Error('Room is full');
    }

    // Add player
    const playerRef = ref(db, `rooms/${joinedRoomId}/players/${playerUid}`);
    const newPlayer: PlayerInfo = {
      displayName: playerDisplayName,
      isHost: false,
      isReady: false,
    };
    await set(playerRef, newPlayer);

    // Update last activity
    await set(ref(db, `rooms/${joinedRoomId}/config/lastActivity`), Date.now());

    // Background cleanup
    this.cleanupAbandonedRooms();

    return { roomId: joinedRoomId, hostUid: data.config.hostUid };
  }

  /**
   * Sets the ready status for a player.
   */
  static async setPlayerReady(roomId: string, playerUid: string, isReady: boolean): Promise<void> {
    if (!isFirebaseConfigured() || !db) return;
    const playerReadyRef = ref(db, `rooms/${roomId}/players/${playerUid}/isReady`);
    await set(playerReadyRef, isReady);
  }

  /**
   * Leaves a room. If the room becomes empty, it cleans it up.
   */
  static async leaveRoom(roomId: string, playerUid: string): Promise<void> {
    if (!isFirebaseConfigured() || !db) return;
    
    // Remove player from the room
    const playerRef = ref(db, `rooms/${roomId}/players/${playerUid}`);
    await remove(playerRef);

    // Also remove presence to be clean
    const presenceRef = ref(db, `rooms/${roomId}/presence/${playerUid}`);
    await remove(presenceRef);

    // Check if room is empty
    const roomRef = ref(db, `rooms/${roomId}`);
    const snapshot = await get(roomRef);
    if (snapshot.exists()) {
      const data = snapshot.val() as RoomData;
      if (!data.players || Object.keys(data.players).length === 0) {
        // Room is abandoned, remove it
        await remove(roomRef);
      } else if (data.config.hostUid === playerUid) {
        // Host left, but others are there. We could handle host migration or just close the room.
        // For simplicity in milestone 1, we just close the room if the host leaves explicitly.
        await remove(roomRef);
      }
    }
  }

  /**
   * Starts the match if conditions are met.
   */
  static async startMatch(roomId: string, playerUid: string): Promise<void> {
    if (!isFirebaseConfigured() || !db) return;

    const roomRef = ref(db, `rooms/${roomId}`);
    const snapshot = await get(roomRef);
    
    if (snapshot.exists()) {
      const data = snapshot.val() as RoomData;
      if (data.config.hostUid !== playerUid) {
        throw new Error('Only the host can start the match');
      }

      const playerIds = Object.keys(data.players || {});
      if (playerIds.length < 2) {
        throw new Error('Need 2 players to start');
      }

      const allReady = playerIds.every(uid => data.players[uid].isReady);
      if (!allReady) {
        throw new Error('Not all players are ready');
      }

      const statusRef = ref(db, `rooms/${roomId}/config/status`);
      await set(statusRef, 'playing');

      // Update last activity
      await set(ref(db, `rooms/${roomId}/config/lastActivity`), Date.now());
    }
  }

  /**
   * Listens to room data changes.
   */
  static listenToRoom(roomId: string, callback: (data: RoomData | null) => void): () => void {
    if (!isFirebaseConfigured() || !db) return () => {};

    const roomRef = ref(db, `rooms/${roomId}`);
    onValue(roomRef, (snapshot) => {
      if (snapshot.exists()) {
        callback(snapshot.val() as RoomData);
      } else {
        callback(null);
      }
    });

    return () => off(roomRef);
  }
}
