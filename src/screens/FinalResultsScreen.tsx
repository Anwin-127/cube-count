import { useGameStore } from '../store/gameStore';
import { determineMatchWinner } from '../engine/StatisticsManager';

export function FinalResultsScreen() {
  const config = useGameStore((s) => s.config);
  const players = useGameStore((s) => s.players);
  const matchStatistics = useGameStore((s) => s.matchStatistics);
  const continueFromFinalResults = useGameStore((s) => s.continueFromFinalResults);
  const resetToHome = useGameStore((s) => s.resetToHome);

  if (!matchStatistics) return null;

  const winnerId = determineMatchWinner(matchStatistics);
  const isDraw = winnerId === 'DRAW';
  const winnerName = winnerId === 'DRAW' ? '' : (players.find(p => p.id === winnerId)?.displayName || (winnerId === 'player1' ? 'Player 1' : 'Player 2'));

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#F7F7F7] px-6 py-12 gap-8">
      
      {/* Winner Banner */}
      <div
        className={`w-full max-w-lg border-2 p-8 text-center shadow-[6px_6px_0px_0px_#000] ${
          isDraw
            ? 'bg-white border-black text-black'
            : 'bg-[#B8FF2C] border-black text-black'
        }`}
      >
        <p className="text-[10px] text-gray-600 uppercase tracking-widest font-bold mb-2">
          Match Complete
        </p>
        <p className="text-5xl font-bold tracking-tight mb-2 uppercase">
          {isDraw ? 'It\'s a Draw!' : `${winnerName} Wins!`}
        </p>
        <p className="text-sm font-bold text-gray-800 uppercase tracking-widest">
          After {matchStatistics.completedRounds} rounds
        </p>
      </div>

      {/* Player Stats */}
      <div className="w-full max-w-lg geo-panel-light flex flex-col">
        <div className="grid grid-cols-2 divide-x-2 divide-black">
          {matchStatistics.playerStatistics.map((ps) => {
            const pState = players.find(p => p.id === ps.playerId);
            const displayName = pState?.displayName || (ps.playerId === 'player1' ? 'Player 1' : 'Player 2');
            return (
              <div key={ps.playerId} className="p-6 bg-white">
                <p className="text-sm font-bold text-black uppercase tracking-widest mb-6 text-center">
                  {displayName}
                </p>
                
                <div className="space-y-4">
                  <div className="text-center bg-[#F0F0F0] p-3 border-2 border-black shadow-[2px_2px_0px_0px_#000]">
                    <p className="text-[10px] text-gray-600 font-bold uppercase tracking-wider mb-1">
                      Round Wins
                    </p>
                    <p className="text-3xl font-bold text-black tabular-nums">
                      {ps.roundWins}
                    </p>
                  </div>
                  
                  <div className="text-center bg-[#F0F0F0] p-3 border-2 border-black shadow-[2px_2px_0px_0px_#000]">
                    <p className="text-[10px] text-gray-600 font-bold uppercase tracking-wider mb-1">
                      Correct Answers
                    </p>
                    <p className="text-3xl font-bold text-black tabular-nums">
                      {ps.correctAnswers}
                    </p>
                  </div>

                  <div className="text-center bg-black text-[#B8FF2C] p-3 border-2 border-black shadow-[2px_2px_0px_0px_#000]">
                    <p className="text-[10px] text-[#B8FF2C] font-bold uppercase tracking-wider mb-1 opacity-80">
                      Total Time
                    </p>
                    <p className="text-2xl font-bold tabular-nums">
                      {ps.totalRecordedTime.toFixed(1)}s
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Match Seed Display */}
      {config.puzzleSeed != null && (
        <div className="text-[10px] text-gray-500 font-mono tracking-widest text-center uppercase font-bold">
          Match Seed: {config.puzzleSeed}
        </div>
      )}

      {/* Actions */}
      <div className="w-full max-w-sm flex flex-col gap-4 mt-4">
        <button
          onClick={() => continueFromFinalResults(true)}
          className="geo-button w-full py-4 uppercase text-lg"
        >
          Replay Match
        </button>
        <button
          onClick={() => continueFromFinalResults(false)}
          className="geo-button-secondary w-full py-4 uppercase text-lg"
        >
          New Match
        </button>
        <button
          onClick={resetToHome}
          className="geo-button-secondary w-full py-3 uppercase text-sm mt-4"
        >
          Quit to Home
        </button>
      </div>

    </div>
  );
}
