import { useGameStore } from '../store/gameStore';
import { Button } from '../components/Button';

/**
 * Final Results screen — displays the match winner and statistics.
 *
 * Placeholder implementation. The final version will show
 * winner announcement, total recorded times, accuracy, and
 * per-player statistics.
 */
export function FinalResultsScreen() {
  const goToSettings = useGameStore((s) => s.goToSettings);
  const resetToHome = useGameStore((s) => s.resetToHome);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-8">
      <h2 className="text-4xl font-bold text-gray-900">Final Results</h2>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 w-96 text-center">
        <p className="text-sm text-gray-500 uppercase tracking-wide mb-4">
          Winner
        </p>
        <p className="text-3xl font-bold text-gray-900">—</p>

        <div className="mt-8 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 rounded-xl bg-gray-50">
              <p className="text-xs text-gray-500">Player 1</p>
              <p className="text-lg font-bold text-gray-900 mt-1">— s</p>
              <p className="text-xs text-gray-400 mt-1">Total Time</p>
            </div>
            <div className="p-4 rounded-xl bg-gray-50">
              <p className="text-xs text-gray-500">Player 2</p>
              <p className="text-lg font-bold text-gray-900 mt-1">— s</p>
              <p className="text-xs text-gray-400 mt-1">Total Time</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <Button variant="secondary" onClick={resetToHome}>
          Main Menu
        </Button>
        <Button onClick={goToSettings}>
          Play Again
        </Button>
      </div>
    </div>
  );
}
