import { useEffect, useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { OnlineGameplayService } from '../online/OnlineGameplayService';

export function ReconnectOverlay() {
  const onlineDisconnectedUid = useGameStore((s) => s.onlineDisconnectedUid);
  const activeRoomId = useGameStore((s) => s.activeRoomId);
  const playerUid = useGameStore((s) => s.playerUid);
  const onlineHostUid = useGameStore((s) => s.onlineHostUid);

  const [timeLeft, setTimeLeft] = useState(30);

  useEffect(() => {
    if (!onlineDisconnectedUid) {
      if (timeLeft < 30) {
        // Just reconnected, show toast then hide
        const t = setTimeout(() => setTimeLeft(30), 3000);
        return () => clearTimeout(t);
      }
      return;
    }

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          // If we are the host, end the match
          if (activeRoomId && playerUid === onlineHostUid) {
            OnlineGameplayService.endMatch(activeRoomId);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [onlineDisconnectedUid, activeRoomId, playerUid, onlineHostUid]);

  if (!onlineDisconnectedUid && timeLeft === 30) return null;

  // Show a resumed toast briefly if they reconnected
  if (!onlineDisconnectedUid && timeLeft < 30) {
    return (
      <div className="absolute top-8 left-1/2 -translate-x-1/2 z-50 bg-black text-[#B8FF2C] font-bold px-6 py-3 rounded uppercase tracking-widest text-sm shadow-[4px_4px_0px_0px_#B8FF2C] animate-pulse">
        Player Reconnected. Match Resumed!
      </div>
    );
  }

  const progressPercent = (timeLeft / 30) * 100;

  return (
    <div className="absolute inset-0 z-50 bg-black/80 flex flex-col items-center justify-center text-white p-6 text-center backdrop-blur-sm transition-opacity duration-300">
      <div className="bg-red-600 text-white font-bold px-4 py-2 uppercase tracking-widest text-sm rounded mb-4 animate-[pulse_1s_ease-in-out_infinite]">
        Connection Lost
      </div>
      <h2 className="text-3xl font-bold uppercase tracking-tight mb-2">Player Disconnected</h2>
      <p className="text-gray-300 font-mono mb-8">Waiting for them to reconnect...</p>
      
      <div className="relative w-48 h-48 flex items-center justify-center">
        <svg className="absolute inset-0 w-full h-full -rotate-90">
          <circle cx="96" cy="96" r="88" fill="none" stroke="#333" strokeWidth="8" />
          <circle 
            cx="96" cy="96" r="88" fill="none" stroke="#B8FF2C" strokeWidth="8" 
            strokeDasharray={2 * Math.PI * 88}
            strokeDashoffset={2 * Math.PI * 88 * (1 - progressPercent / 100)}
            className="transition-all duration-1000 ease-linear"
          />
        </svg>
        <div className="text-6xl font-mono font-bold tabular-nums">
          {timeLeft}
        </div>
      </div>
      
      <p className="mt-8 text-sm text-gray-400 max-w-sm">
        The match has been paused. If the player does not return before the timer expires, the match will be aborted.
      </p>
    </div>
  );
}
