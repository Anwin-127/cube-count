import { ref, onValue, onDisconnect, set, serverTimestamp } from 'firebase/database';
import { db, isFirebaseConfigured } from './FirebaseService';

export class PresenceService {
  /**
   * Starts tracking presence for a player in a room.
   * Returns a cleanup function.
   */
  static trackPresence(roomId: string, playerUid: string): () => void {
    if (!isFirebaseConfigured() || !db) return () => {};
    const database = db;

    // Reference to this client's connection state
    const connectedRef = ref(database, '.info/connected');
    
    // Reference to the player's presence node in the room
    const playerPresenceRef = ref(database, `rooms/${roomId}/presence/${playerUid}`);

    const unsubscribe = onValue(connectedRef, (snap) => {
      if (snap.val() === true) {
        // We're connected (or reconnected)!
        // Set up the onDisconnect hook
        // When this client disconnects, Firebase will automatically set this node
        onDisconnect(playerPresenceRef).set({
          status: 'offline',
          lastSeen: serverTimestamp()
        }).then(() => {
          // If we are playing, also mark us as disconnected in the match state
          const disconnectRef = ref(database, `rooms/${roomId}/matchState/disconnectedPlayerUid`);
          onDisconnect(disconnectRef).set(playerUid);
          const disconnectTimeRef = ref(database, `rooms/${roomId}/matchState/disconnectTimestamp`);
          onDisconnect(disconnectTimeRef).set(serverTimestamp());

          // Once the onDisconnect hook is established, set ourselves as online
          set(playerPresenceRef, {
            status: 'online',
            lastSeen: serverTimestamp()
          });
        });
      }
    });

    return () => {
      unsubscribe();
      // Cancel the onDisconnect event because we are cleaning up intentionally
      onDisconnect(playerPresenceRef).cancel();
      const disconnectRef = ref(database, `rooms/${roomId}/matchState/disconnectedPlayerUid`);
      onDisconnect(disconnectRef).cancel();
      const disconnectTimeRef = ref(database, `rooms/${roomId}/matchState/disconnectTimestamp`);
      onDisconnect(disconnectTimeRef).cancel();

      // Optionally mark offline immediately
      set(playerPresenceRef, {
        status: 'offline',
        lastSeen: serverTimestamp()
      });
    };
  }
}
