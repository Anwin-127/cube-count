import { useGameStore } from '../store/gameStore';
import { GamePhase } from '../models/GamePhase';
import { GameMode } from '../models/GameMode';

/**
 * Development-only Game Playground.
 *
 * Allows developers to simulate an entire match by manually
 * advancing through game states. Displays full engine state
 * including phase, players, timers, puzzle, and statistics.
 *
 * This screen bypasses the game loop and provides manual
 * controls for every engine action.
 */
export function GamePlayground() {
  const state = useGameStore();

  const handleAdvanceTimers = () => {
    // Advance time by the display/answer duration to trigger expiry
    const now = Date.now();
    if (state.phase === GamePhase.DISPLAYING_PUZZLE) {
      // Fast-forward display timer
      useGameStore.setState({
        displayStartTime: now - state.currentDisplayDuration * 1000 - 100,
      });
    } else if (state.phase === GamePhase.ANSWER_PHASE) {
      // Fast-forward answer timer
      useGameStore.setState({
        answerStartTime: now - state.config.maximumAnswerTime * 1000 - 100,
      });
    }
    state.tick(Date.now());
  };

  const handleMockSubmit = (playerId: 'player1' | 'player2', answer: number) => {
    // Set answer then submit
    const diff = answer - (state.players.find((p) => p.id === playerId)?.currentAnswer ?? 0);
    if (diff > 0) state.incrementAnswer(playerId, diff);
    state.submitAnswer(playerId);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              🎮 Game Playground
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Full match simulation for debugging the Game Engine
            </p>
          </div>
          <a
            href="#"
            className="text-sm text-gray-500 hover:text-gray-800 transition-colors"
            onClick={(e) => {
              e.preventDefault();
              state.resetToHome();
              window.location.hash = '';
              window.location.reload();
            }}
          >
            ← Back to Home
          </a>
        </div>

        <div className="grid grid-cols-3 gap-6">
          {/* Column 1: Controls */}
          <div className="space-y-4">
            <Panel title="Controls">
              <div className="space-y-2">
                <ControlButton
                  label="Start Match (Multiplayer)"
                  disabled={
                    state.phase !== GamePhase.HOME &&
                    state.phase !== GamePhase.SETTINGS
                  }
                  onClick={() => {
                    state.updateConfig({ gameMode: GameMode.LOCAL_MULTIPLAYER, numberOfRounds: 3 });
                    state.resetToHome();
                    state.goToSettings();
                    state.startMatch();
                  }}
                />
                <ControlButton
                  label="Start Match (Practice)"
                  disabled={
                    state.phase !== GamePhase.HOME &&
                    state.phase !== GamePhase.SETTINGS
                  }
                  onClick={() => {
                    state.updateConfig({ gameMode: GameMode.PRACTICE, numberOfRounds: 5 });
                    state.resetToHome();
                    state.goToSettings();
                    state.startMatch();
                  }}
                />
                <ControlButton
                  label="Advance Timers (→ next phase)"
                  disabled={
                    state.phase !== GamePhase.DISPLAYING_PUZZLE &&
                    state.phase !== GamePhase.ANSWER_PHASE
                  }
                  onClick={handleAdvanceTimers}
                />
                <ControlButton
                  label="Tick (process transitions)"
                  onClick={() => state.tick(Date.now())}
                />
                <ControlButton
                  label="Continue from Results"
                  disabled={state.phase !== GamePhase.ROUND_RESULTS}
                  onClick={state.continueFromResults}
                />
                <ControlButton
                  label="Reset to Home"
                  onClick={state.resetToHome}
                  variant="danger"
                />
              </div>
            </Panel>

            <Panel title="Mock Answers">
              {state.players.map((p) => (
                <div key={p.id} className="mb-3 last:mb-0">
                  <p className="text-xs font-medium text-gray-700 mb-1">
                    {p.id} (current: {p.currentAnswer})
                    {p.hasSubmitted && ' ✓ submitted'}
                  </p>
                  <div className="flex gap-1">
                    <ControlButton
                      label="+1"
                      small
                      disabled={p.hasSubmitted || state.phase !== GamePhase.ANSWER_PHASE}
                      onClick={() => state.incrementAnswer(p.id)}
                    />
                    <ControlButton
                      label="+5"
                      small
                      disabled={p.hasSubmitted || state.phase !== GamePhase.ANSWER_PHASE}
                      onClick={() => state.incrementAnswer(p.id, 5)}
                    />
                    <ControlButton
                      label="-1"
                      small
                      disabled={p.hasSubmitted || state.phase !== GamePhase.ANSWER_PHASE}
                      onClick={() => state.decrementAnswer(p.id)}
                    />
                    <ControlButton
                      label="Submit"
                      small
                      disabled={p.hasSubmitted || state.phase !== GamePhase.ANSWER_PHASE}
                      onClick={() => state.submitAnswer(p.id)}
                    />
                  </div>
                  {state.currentPuzzle && state.phase === GamePhase.ANSWER_PHASE && !p.hasSubmitted && (
                    <button
                      className="mt-1 text-xs text-green-600 hover:text-green-800 cursor-pointer"
                      onClick={() => handleMockSubmit(p.id, state.currentPuzzle!.totalCubes)}
                    >
                      Submit correct answer ({state.currentPuzzle.totalCubes})
                    </button>
                  )}
                </div>
              ))}
              {state.players.length === 0 && (
                <p className="text-xs text-gray-400">No players (start a match first)</p>
              )}
            </Panel>
          </div>

          {/* Column 2: State */}
          <div className="space-y-4">
            <Panel title="Engine State">
              <StateRow label="Phase" value={state.phase} highlight />
              <StateRow label="Round" value={`${state.currentRound} / ${state.config.numberOfRounds}`} />
              <StateRow label="Mode" value={state.config.gameMode} />
              <StateRow label="Difficulty" value={state.config.difficulty} />
              <StateRow label="Display Duration" value={`${state.currentDisplayDuration}s`} />
              <StateRow label="Max Answer Time" value={`${state.config.maximumAnswerTime}s`} />
            </Panel>

            <Panel title="Current Puzzle">
              {state.currentPuzzle ? (
                <>
                  <StateRow label="Total Cubes" value={state.currentPuzzle.totalCubes} />
                  <StateRow label="Max Height" value={state.currentPuzzle.maximumHeight} />
                  <StateRow label="Shape" value={state.currentPuzzle.metadata.shapeFamily} />
                  <StateRow label="Complexity" value={state.currentPuzzle.metadata.complexityScore.toFixed(3)} />
                  <StateRow label="Hidden Cubes" value={state.currentPuzzle.metadata.hiddenCubeEstimate} />
                  <div className="mt-2">
                    <p className="text-xs text-gray-500 mb-1">Height Map</p>
                    <div className="grid gap-0.5" style={{ gridTemplateColumns: `repeat(${state.currentPuzzle.boardSize}, 1fr)` }}>
                      {state.currentPuzzle.heightMap.flatMap((row, r) =>
                        row.map((h, c) => (
                          <div
                            key={`${r}-${c}`}
                            className="w-8 h-8 text-xs flex items-center justify-center rounded font-mono"
                            style={{
                              backgroundColor: h > 0 ? `rgba(34,197,94,${h / 4})` : '#f3f4f6',
                              color: h > 0 ? '#111' : '#ccc',
                            }}
                          >
                            {h}
                          </div>
                        )),
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-xs text-gray-400">No puzzle generated</p>
              )}
            </Panel>

            <Panel title="Players">
              {state.players.map((p) => (
                <div key={p.id} className="mb-2 p-2 bg-gray-50 rounded-lg text-xs">
                  <p className="font-medium text-gray-800">{p.id}</p>
                  <div className="grid grid-cols-2 gap-1 mt-1 text-gray-600">
                    <span>Answer: {p.currentAnswer}</span>
                    <span>Submitted: {p.hasSubmitted ? '✓' : '✗'}</span>
                    <span>Time: {p.answerTime?.toFixed(2) ?? '—'}s</span>
                    <span>Correct: {p.isCorrect === null ? '—' : p.isCorrect ? '✓' : '✗'}</span>
                  </div>
                </div>
              ))}
            </Panel>
          </div>

          {/* Column 3: Results & Stats */}
          <div className="space-y-4">
            <Panel title="Round Results">
              {state.roundResults.length > 0 ? (
                state.roundResults.map((rr) => (
                  <div key={rr.roundNumber} className="mb-2 p-2 bg-gray-50 rounded-lg text-xs">
                    <p className="font-medium text-gray-800">
                      Round {rr.roundNumber} — Answer: {rr.correctAnswer}
                      {rr.winnerId && ` — Winner: ${rr.winnerId}`}
                    </p>
                    {rr.playerResults.map((pr) => (
                      <p key={pr.playerId} className="text-gray-600 ml-2">
                        {pr.playerId}: {pr.answer} {pr.isCorrect ? '✓' : '✗'} ({pr.answerTime.toFixed(2)}s)
                      </p>
                    ))}
                  </div>
                ))
              ) : (
                <p className="text-xs text-gray-400">No rounds completed</p>
              )}
            </Panel>

            {state.matchStatistics && (
              <Panel title="Match Statistics">
                <StateRow label="Completed" value={`${state.matchStatistics.completedRounds} / ${state.matchStatistics.totalRounds}`} />
                {state.matchStatistics.playerStatistics.map((ps) => (
                  <div key={ps.playerId} className="mt-2 p-2 bg-gray-50 rounded-lg text-xs">
                    <p className="font-medium text-gray-800">{ps.playerId}</p>
                    <div className="grid grid-cols-2 gap-1 mt-1 text-gray-600">
                      <span>Correct: {ps.correctAnswers}</span>
                      <span>Incorrect: {ps.incorrectAnswers}</span>
                      <span>Total Time: {ps.totalRecordedTime.toFixed(2)}s</span>
                      <span>Fastest: {ps.fastestCorrectAnswer?.toFixed(2) ?? '—'}s</span>
                    </div>
                  </div>
                ))}
              </Panel>
            )}

            {state.practiceStatistics && (
              <Panel title="Practice Statistics">
                <StateRow label="Puzzles" value={state.practiceStatistics.totalPuzzlesSolved} />
                <StateRow label="Correct" value={state.practiceStatistics.correctAnswers} />
                <StateRow label="Accuracy" value={`${state.practiceStatistics.accuracyPercentage}%`} />
                <StateRow label="Streak" value={`${state.practiceStatistics.currentStreak} (best: ${state.practiceStatistics.bestStreak})`} />
                <StateRow label="Avg Time" value={state.practiceStatistics.averageResponseTime?.toFixed(2) ?? '—'} />
                <StateRow label="Fastest" value={state.practiceStatistics.fastestCorrectAnswer?.toFixed(2) ?? '—'} />
              </Panel>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
      <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">
        {title}
      </h3>
      {children}
    </div>
  );
}

function StateRow({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string | number;
  highlight?: boolean;
}) {
  return (
    <div className="flex justify-between text-xs mb-1">
      <span className="text-gray-500">{label}</span>
      <span className={`font-mono ${highlight ? 'font-bold text-blue-600' : 'text-gray-800'}`}>
        {value}
      </span>
    </div>
  );
}

function ControlButton({
  label,
  onClick,
  disabled,
  small,
  variant,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  small?: boolean;
  variant?: 'danger';
}) {
  const base = small
    ? 'px-2 py-1 text-xs rounded'
    : 'w-full px-3 py-2 text-xs rounded-lg';

  const color =
    variant === 'danger'
      ? 'bg-red-50 text-red-700 hover:bg-red-100 border-red-200'
      : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border-gray-200';

  return (
    <button
      className={`${base} ${color} border font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer`}
      onClick={onClick}
      disabled={disabled}
    >
      {label}
    </button>
  );
}
