import { useGameStore } from '../store/gameStore';

export function SynchronizingScreen() {
  const players = useGameStore((s) => s.players);
  const p1 = players.find(p => p.id === 'player1');
  const p2 = players.find(p => p.id === 'player2');
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#F7F7F7] px-6 gap-8">
      <div className="text-center w-full max-w-sm">
        <h2 className="text-2xl font-bold uppercase tracking-widest mb-6">Synchronizing Match</h2>
        <div className="flex flex-col gap-4 text-left bg-white p-6 border-2 border-black shadow-[4px_4px_0px_0px_#000]">
           <p className="font-bold text-[#3E8B15]">✓ Connected</p>
           <p className="font-bold text-[#3E8B15]">✓ {p1?.displayName || 'Player 1'} Assigned</p>
           <p className="font-bold text-[#3E8B15]">✓ {p2?.displayName || 'Player 2'} Assigned</p>
           <p className="font-bold text-[#3E8B15]">✓ Puzzle Generated</p>
           <div className="mt-4 pt-4 border-t-2 border-black/10">
             <p className="animate-pulse font-bold text-[#555] uppercase tracking-widest text-sm">Waiting for other player...</p>
           </div>
        </div>
      </div>
    </div>
  );
}
