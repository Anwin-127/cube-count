import { useEffect, useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { RoomService } from '../online/RoomService';
import { PresenceService } from '../online/PresenceService';
import type { RoomData } from '../online/types';

export function WaitingRoomScreen() {
  const goToHome = useGameStore((s) => s.goToHome);
  const activeRoomId = useGameStore((s) => s.activeRoomId);
  const activeRoomCode = useGameStore((s) => s.activeRoomCode);
  const playerUid = useGameStore((s) => s.playerUid);
  const clearActiveRoom = useGameStore((s) => s.clearActiveRoom);

  const [roomData, setRoomData] = useState<RoomData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    if (!activeRoomId || !playerUid) return;

    // Track presence
    const cleanupPresence = PresenceService.trackPresence(activeRoomId, playerUid);

    // Listen to room data
    const unsubscribe = RoomService.listenToRoom(activeRoomId, (data) => {
      if (!data) {
        // Room was deleted or we were kicked
        clearActiveRoom();
        goToHome();
      } else {
        setRoomData(data);
        const playerEntries = Object.entries(data.players || {});
        const hostEntry = playerEntries.find(([, p]) => p.isHost);
        const guestEntry = playerEntries.find(([, p]) => !p.isHost);

        if (hostEntry && guestEntry) {
          const [hostUid] = hostEntry;
          const [guestUid] = guestEntry;
          const hostP = hostEntry[1];
          const guestP = guestEntry[1];
          useGameStore.getState().setPlayerNames(hostP.displayName, guestP.displayName);
          // Ensure both clients have the correct host/guest UIDs in the store.
          // The Host never knew the Guest's UID until they joined.
          const store = useGameStore.getState();
          if (store.onlineGuestUid !== guestUid) {
            useGameStore.setState({ onlineHostUid: hostUid, onlineGuestUid: guestUid });
          }
        }
      }
    });

    return () => {
      unsubscribe();
      cleanupPresence();
    };
  }, [activeRoomId, playerUid, clearActiveRoom, goToHome]);

  const handleLeaveRoom = async () => {
    if (activeRoomId && playerUid) {
      await RoomService.leaveRoom(activeRoomId, playerUid);
    }
    clearActiveRoom();
    goToHome();
  };

  const handleToggleReady = async () => {
    if (activeRoomId && playerUid && roomData) {
      const currentReady = roomData.players[playerUid]?.isReady || false;
      await RoomService.setPlayerReady(activeRoomId, playerUid, !currentReady);
    }
  };

  const handleStartMatch = async () => {
    if (activeRoomId && playerUid) {
      try {
        const config = useGameStore.getState().config;
        await import('../online/OnlineGameplayService').then(m => {
          m.OnlineGameplayService.startMatchSync(activeRoomId, config.difficulty);
        });
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('An unknown error occurred');
        }
      }
    }
  };

  if (!roomData) {
    return <div className="min-h-screen flex items-center justify-center">Loading Room...</div>;
  }

  const players = Object.values(roomData.players || {});
  const host = players.find((p) => p.isHost);
  const guest = players.find((p) => !p.isHost);
  const amIHost = roomData.config.hostUid === playerUid;
  const amIReady = roomData.players[playerUid || '']?.isReady || false;

  const allReady = players.length === 2 && players.every(p => p.isReady);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 gap-8">
      <div className="text-center w-full max-w-xs flex flex-col items-center">
        <h2 className="text-sm font-bold text-gray-500 tracking-widest uppercase mb-2">Room Code</h2>
        <div className="text-6xl font-mono font-bold tracking-widest flex items-center justify-center">
          {activeRoomCode}
        </div>
        
        <div className="flex flex-col gap-3 w-full mt-6">
          <button 
            onClick={() => {
              navigator.clipboard.writeText(activeRoomCode || '');
              setCopiedCode(true);
              setTimeout(() => setCopiedCode(false), 2000);
            }}
            className="geo-button-secondary w-full"
          >
            {copiedCode ? '✅ CODE COPIED!' : 'COPY CODE'}
          </button>
          
          <button 
            onClick={() => {
              navigator.clipboard.writeText(`${window.location.origin}/play/${activeRoomCode}`);
              setCopiedLink(true);
              setTimeout(() => setCopiedLink(false), 2000);
            }}
            className="geo-button-secondary w-full"
          >
            {copiedLink ? '✅ LINK COPIED!' : 'COPY INVITE LINK'}
          </button>
        </div>
      </div>

      <div className="w-full max-w-md flex flex-col gap-4 border-2 border-gray-100 rounded-xl p-6">
        <div className="flex justify-between items-center py-2 border-b border-gray-100">
          <div className="flex flex-col">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Host</span>
            <span className="text-xl font-bold">{host?.displayName || '...'}</span>
          </div>
          <div className={`px-3 py-1 text-xs font-bold uppercase rounded-full transition-colors duration-300 ${host?.isReady ? 'bg-primary text-black scale-105' : 'bg-gray-200 text-gray-500'}`}>
            {host?.isReady ? 'READY' : 'NOT READY'}
          </div>
        </div>

        <div className="flex justify-between items-center py-2">
          <div className="flex flex-col">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Player 2</span>
            <span className={`text-xl font-bold transition-opacity duration-300 ${!guest ? 'opacity-50 animate-pulse' : 'opacity-100'}`}>
              {guest?.displayName || 'Waiting...'}
            </span>
          </div>
          {guest && (
            <div className={`px-3 py-1 text-xs font-bold uppercase rounded-full transition-colors duration-300 ${guest.isReady ? 'bg-primary text-black scale-105' : 'bg-gray-200 text-gray-500'}`}>
              {guest.isReady ? 'READY' : 'NOT READY'}
            </div>
          )}
        </div>
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}

      <div className="flex flex-col gap-4 w-full max-w-xs mt-4">
        <button onClick={handleToggleReady} className="geo-button w-full">
          {amIReady ? 'CANCEL READY' : 'READY UP'}
        </button>

        {amIHost && (
          <button 
            onClick={handleStartMatch} 
            disabled={!allReady}
            className={`geo-button w-full ${!allReady ? 'opacity-50 cursor-not-allowed' : 'bg-black text-white hover:bg-gray-800'}`}
          >
            START MATCH
          </button>
        )}

        <button onClick={handleLeaveRoom} className="geo-button-secondary w-full">
          LEAVE ROOM
        </button>
      </div>
    </div>
  );
}
