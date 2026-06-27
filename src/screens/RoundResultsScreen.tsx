import { useGameStore } from '../store/gameStore';
import { GameMode } from '../models/GameMode';
import { Difficulty } from '../models/Difficulty';

/**
 * Round Results screen — displayed after every puzzle in practice mode.
 *
 * Shows:
 *   - Correct answer vs player's answer
 *   - Response time
 *   - Correct / Incorrect outcome
 *   - Difficulty advancement notification
 *   - Accumulated statistics (accuracy, streak, averages)
 *
 * Press Space or click "Next Puzzle" to continue.
 */
export function RoundResultsScreen() {
  const config = useGameStore((s) => s.config);
  const currentRound = useGameStore((s) => s.currentRound);
  const continueFromResults = useGameStore((s) => s.continueFromResults);
  const resetToHome = useGameStore((s) => s.resetToHome);
  const roundResults = useGameStore((s) => s.roundResults);
  const practiceStatistics = useGameStore((s) => s.practiceStatistics);
  const difficultyJustAdvanced = useGameStore((s) => s.difficultyJustAdvanced);

  const isPractice = config.gameMode === GameMode.PRACTICE;
  const latestResult = roundResults[roundResults.length - 1];
  const playerResult = latestResult?.playerResults[0];

  if (!latestResult || !playerResult) return null;

  const isCorrect = playerResult.isCorrect;
  const playerAnswer = playerResult.answer;
  const correctAnswer = latestResult.correctAnswer;
  const answerTime = playerResult.answerTime;

  return (
    <div className="flex flex-col min-h-screen bg-[#F7F7F7] px-6 py-12">
      <div className="flex-1 flex flex-col items-center justify-center gap-6 max-w-sm mx-auto w-full">

        {/* Outcome banner */}
        <div
          className={`w-full rounded-2xl border p-6 text-center ${
            isCorrect
              ? 'bg-green-50 border-green-200'
              : 'bg-red-50 border-red-200'
          }`}
        >
          <div className="text-3xl mb-2">
            {isCorrect ? '✓' : '✗'}
          </div>
          <p className={`text-sm font-semibold uppercase tracking-wide ${
            isCorrect ? 'text-green-600' : 'text-red-500'
          }`}>
            {isCorrect ? 'Correct!' : 'Incorrect'}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Round {currentRound}
          </p>
        </div>

        {/* Answer comparison */}
        <div className="w-full bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="grid grid-cols-2">
            <div className="p-5 border-r border-gray-100 text-center">
              <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">
                Correct Answer
              </p>
              <p className="text-4xl font-bold text-gray-900 tabular-nums">
                {correctAnswer}
              </p>
            </div>
            <div className="p-5 text-center">
              <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">
                Your Answer
              </p>
              <p className={`text-4xl font-bold tabular-nums ${
                isCorrect ? 'text-gray-900' : 'text-red-500'
              }`}>
                {playerAnswer}
              </p>
            </div>
          </div>
          <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between">
            <span className="text-xs text-gray-400">Response time</span>
            <span className="text-sm font-semibold text-gray-700 tabular-nums">
              {answerTime.toFixed(2)}s
            </span>
          </div>
        </div>

        {/* Difficulty advancement notice */}
        {difficultyJustAdvanced && (
          <div className="w-full bg-amber-50 border border-amber-200 rounded-xl px-5 py-3 text-center">
            <p className="text-xs font-semibold text-amber-700">
              Difficulty increased → {config.difficulty === Difficulty.MEDIUM ? 'Medium' : 'Hard'}
            </p>
            <p className="text-[10px] text-amber-600 mt-0.5">
              Every 5 correct answers, puzzles get harder
            </p>
          </div>
        )}

        {/* Practice statistics */}
        {isPractice && practiceStatistics && (
          <div className="w-full bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-3">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
              Session Stats
            </p>
            <div className="grid grid-cols-2 gap-3">
              <StatCell
                label="Accuracy"
                value={`${practiceStatistics.accuracyPercentage}%`}
              />
              <StatCell
                label="Solved"
                value={String(practiceStatistics.totalPuzzlesSolved)}
              />
              <StatCell
                label="Streak"
                value={String(practiceStatistics.currentStreak)}
                sub={`Best: ${practiceStatistics.bestStreak}`}
              />
              <StatCell
                label="Avg. Time"
                value={
                  practiceStatistics.averageResponseTime !== null
                    ? `${practiceStatistics.averageResponseTime.toFixed(1)}s`
                    : '—'
                }
              />
              <StatCell
                label="Correct"
                value={String(practiceStatistics.correctAnswers)}
                highlight="success"
              />
              <StatCell
                label="Incorrect"
                value={String(practiceStatistics.incorrectAnswers)}
                highlight={practiceStatistics.incorrectAnswers > 0 ? 'error' : undefined}
              />
            </div>
            {practiceStatistics.fastestCorrectAnswer !== null && (
              <div className="pt-2 border-t border-gray-100">
                <p className="text-[10px] text-gray-400 text-center">
                  Fastest correct answer:{' '}
                  <span className="font-semibold text-gray-600">
                    {practiceStatistics.fastestCorrectAnswer.toFixed(2)}s
                  </span>
                </p>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="w-full flex flex-col gap-3">
          <button
            onClick={continueFromResults}
            className="w-full bg-gray-900 text-white font-semibold py-3.5 rounded-xl hover:bg-gray-700 active:scale-95 transition-all duration-150"
          >
            Next Puzzle
          </button>
          <button
            onClick={resetToHome}
            className="w-full text-gray-400 font-medium py-2.5 rounded-xl hover:text-gray-600 transition-colors duration-150 text-sm"
          >
            Quit to Home
          </button>
        </div>

        <p className="text-[10px] text-gray-300">
          Press Space to continue
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// StatCell — a compact statistic display
// ---------------------------------------------------------------------------

function StatCell({
  label,
  value,
  sub,
  highlight,
}: {
  label: string;
  value: string;
  sub?: string;
  highlight?: 'success' | 'error';
}) {
  const valueColor =
    highlight === 'success'
      ? 'text-green-600'
      : highlight === 'error'
        ? 'text-red-500'
        : 'text-gray-900';

  return (
    <div className="bg-gray-50 rounded-xl p-3">
      <p className="text-[9px] text-gray-400 uppercase tracking-wider mb-1">
        {label}
      </p>
      <p className={`text-xl font-bold tabular-nums ${valueColor}`}>
        {value}
      </p>
      {sub && <p className="text-[10px] text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}
