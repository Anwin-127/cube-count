import { useState, useCallback } from 'react';
import { useGameStore } from '../store/gameStore';
import { GamePhase } from '../models/GamePhase';
import { GameMode } from '../models/GameMode';
import { PuzzleCanvas } from '../components/PuzzleCanvas';
import { DebugOverlay } from '../components/DebugOverlay';
import { useDebugOverlay } from '../hooks/useDebugOverlay';
import { useTimer } from '../hooks/useTimer';
import type { RenderInfo } from '../renderer/types';

/**
 * Gameplay screen — the core playing experience.
 *
 * Handles all active gameplay phases:
 *   - GENERATING_PUZZLE: brief loading state
 *   - DISPLAYING_PUZZLE: isometric puzzle is shown with countdown
 *   - ANSWER_PHASE:      puzzle hidden, player enters answer
 *   - VALIDATING:        brief transition
 *
 * The puzzle canvas is always mounted but receives a null puzzle
 * when the puzzle should not be visible.
 */
export function GameplayScreen() {
  const phase = useGameStore((s) => s.phase);
  const config = useGameStore((s) => s.config);
  const players = useGameStore((s) => s.players);
  const puzzle = useGameStore((s) => s.currentPuzzle);
  const currentRound = useGameStore((s) => s.currentRound);
  const incrementAnswer = useGameStore((s) => s.incrementAnswer);
  const decrementAnswer = useGameStore((s) => s.decrementAnswer);
  const submitAnswer = useGameStore((s) => s.submitAnswer);

  const showDebug = useDebugOverlay();
  const [renderInfo, setRenderInfo] = useState<RenderInfo | null>(null);
  const handleRenderInfo = useCallback((info: RenderInfo) => setRenderInfo(info), []);

  const timeRemaining = useTimer();
  const isPractice = config.gameMode === GameMode.PRACTICE;
  const player = players[0]; // Practice mode: only player1

  // During DISPLAYING_PUZZLE the puzzle is visible
  const visiblePuzzle = phase === GamePhase.DISPLAYING_PUZZLE ? puzzle : null;

  const isAnswerPhase = phase === GamePhase.ANSWER_PHASE;
  const isDisplayPhase = phase === GamePhase.DISPLAYING_PUZZLE;
  const submitted = player?.hasSubmitted ?? false;

  return (
    <div className="flex flex-col min-h-screen bg-[#F7F7F7]">
      {/* ── Top bar ─────────────────────────────────────────────── */}
      <header className="flex items-center justify-between px-6 pt-6 pb-2">
        <div className="text-xs font-medium text-gray-400 uppercase tracking-wider">
          {isPractice ? 'Practice' : 'Round'} {currentRound}
        </div>
        <TimerBadge
          seconds={timeRemaining}
          phase={phase}
          maxAnswerTime={config.maximumAnswerTime}
          maxDisplayTime={config.initialDisplayTime}
        />
        <div className="text-xs font-medium text-gray-400 uppercase tracking-wider">
          {config.difficulty}
        </div>
      </header>

      {/* ── Puzzle canvas area ──────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center px-6 py-4">
        <div
          className="relative w-full"
          style={{ maxWidth: 520, aspectRatio: '4 / 3' }}
        >
          {/* Loading state */}
          {phase === GamePhase.GENERATING_PUZZLE && (
            <div className="absolute inset-0 flex items-center justify-center z-10 rounded-2xl bg-white">
              <div className="text-center">
                <div className="w-8 h-8 border-2 border-gray-200 border-t-gray-600 rounded-full animate-spin mx-auto mb-3" />
                <p className="text-gray-400 text-sm">Generating puzzle…</p>
              </div>
            </div>
          )}

          {/* Answer phase overlay */}
          {isAnswerPhase && (
            <div className="absolute inset-0 flex items-center justify-center z-10 rounded-2xl bg-white/95 backdrop-blur-sm transition-opacity duration-300">
              <p className="text-2xl font-bold text-gray-300 select-none">
                How many cubes?
              </p>
            </div>
          )}

          {/* Validating overlay */}
          {phase === GamePhase.VALIDATING && (
            <div className="absolute inset-0 flex items-center justify-center z-10 rounded-2xl bg-white/95">
              <p className="text-gray-400 text-sm">Checking…</p>
            </div>
          )}

          <PuzzleCanvas
            puzzle={visiblePuzzle}
            className="w-full h-full rounded-2xl overflow-hidden bg-white"
            onRenderInfo={handleRenderInfo}
          />

          {/* Timer countdown ring during display phase */}
          {isDisplayPhase && timeRemaining !== null && (
            <TimerRing
              remaining={timeRemaining}
              total={config.initialDisplayTime}
            />
          )}

          {/* Debug overlay — dev only, F2 toggled */}
          {showDebug && (
            <DebugOverlay puzzle={puzzle} renderInfo={renderInfo} />
          )}
        </div>
      </div>

      {/* ── Answer panel ────────────────────────────────────────── */}
      {player && (
        <div className="px-6 pb-8">
          <AnswerPanel
            answer={player.currentAnswer}
            submitted={submitted}
            isActive={isAnswerPhase}
            onIncrement={() => incrementAnswer('player1', 1)}
            onIncrementTen={() => incrementAnswer('player1', 10)}
            onDecrement={() => decrementAnswer('player1')}
            onSubmit={() => submitAnswer('player1')}
          />
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// TimerBadge — displays phase-appropriate countdown
// ---------------------------------------------------------------------------

interface TimerBadgeProps {
  seconds: number | null;
  phase: GamePhase;
  maxAnswerTime: number;
  maxDisplayTime: number;
}

function TimerBadge({ seconds, phase, maxAnswerTime, maxDisplayTime }: TimerBadgeProps) {
  if (seconds === null) return <div className="w-20" />;

  const isDisplaying = phase === GamePhase.DISPLAYING_PUZZLE;
  const isAnswer = phase === GamePhase.ANSWER_PHASE;
  const max = isDisplaying ? maxDisplayTime : maxAnswerTime;
  const urgency = seconds / max;
  const isUrgent = urgency < 0.25 && isAnswer;

  return (
    <div
      className={`text-center min-w-20 transition-colors duration-300 ${
        isUrgent ? 'text-red-500' : isAnswer ? 'text-gray-900' : 'text-gray-400'
      }`}
    >
      <div className={`text-2xl font-bold tabular-nums ${isUrgent ? 'animate-pulse' : ''}`}>
        {seconds.toFixed(1)}
      </div>
      <div className="text-[9px] uppercase tracking-widest text-gray-400 mt-0.5">
        {isDisplaying ? 'memorise' : 'answer'}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// TimerRing — circular progress indicator on puzzle canvas edge
// ---------------------------------------------------------------------------

function TimerRing({ remaining, total }: { remaining: number; total: number }) {
  const progress = Math.max(0, Math.min(1, remaining / total));
  const radius = 16;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - progress);

  return (
    <div className="absolute top-3 right-3 pointer-events-none" aria-hidden="true">
      <svg width={40} height={40} className="rotate-[-90deg]">
        <circle
          cx={20}
          cy={20}
          r={radius}
          fill="none"
          stroke="rgba(0,0,0,0.08)"
          strokeWidth={3}
        />
        <circle
          cx={20}
          cy={20}
          r={radius}
          fill="none"
          stroke="rgba(0,0,0,0.5)"
          strokeWidth={3}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.1s linear' }}
        />
      </svg>
    </div>
  );
}

// ---------------------------------------------------------------------------
// AnswerPanel — the player's input interface during ANSWER_PHASE
// ---------------------------------------------------------------------------

interface AnswerPanelProps {
  answer: number;
  submitted: boolean;
  isActive: boolean;
  onIncrement: () => void;
  onIncrementTen: () => void;
  onDecrement: () => void;
  onSubmit: () => void;
}

function AnswerPanel({
  answer,
  submitted,
  isActive,
  onIncrement,
  onIncrementTen,
  onDecrement,
  onSubmit,
}: AnswerPanelProps) {
  const disabled = !isActive || submitted;

  return (
    <div
      className={`bg-white rounded-2xl border border-gray-200 shadow-sm p-6 transition-opacity duration-300 ${
        isActive ? 'opacity-100' : 'opacity-50'
      }`}
    >
      {submitted ? (
        /* Submitted state */
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">
              Your Answer
            </p>
            <p className="text-5xl font-bold text-gray-900 tabular-nums">
              {answer}
            </p>
          </div>
          <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-4 py-2">
            <span className="text-green-600 text-sm font-medium">Submitted ✓</span>
          </div>
        </div>
      ) : (
        /* Input state */
        <div className="space-y-4">
          {/* Answer display */}
          <div className="text-center">
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">
              Your Answer
            </p>
            <p
              className={`text-6xl font-bold tabular-nums transition-colors duration-150 ${
                isActive ? 'text-gray-900' : 'text-gray-300'
              }`}
            >
              {answer}
            </p>
          </div>

          {/* Control buttons */}
          <div className="grid grid-cols-4 gap-2">
            <AnswerButton
              onClick={onDecrementSafe.bind(null, onDecrement, answer)}
              disabled={disabled || answer <= 0}
              variant="secondary"
            >
              −1
            </AnswerButton>
            <AnswerButton
              onClick={onIncrement}
              disabled={disabled}
              variant="secondary"
            >
              +1
            </AnswerButton>
            <AnswerButton
              onClick={onIncrementTen}
              disabled={disabled}
              variant="secondary"
            >
              +10
            </AnswerButton>
            <AnswerButton
              onClick={onSubmit}
              disabled={disabled}
              variant="primary"
            >
              Submit
            </AnswerButton>
          </div>

          {/* Key hint */}
          <p className="text-center text-[10px] text-gray-300">
            A +1 · W +10 · S −1 · Shift submit
          </p>
        </div>
      )}
    </div>
  );
}

function onDecrementSafe(onDecrement: () => void, answer: number) {
  if (answer > 0) onDecrement();
}

interface AnswerButtonProps {
  onClick: () => void;
  disabled: boolean;
  variant: 'primary' | 'secondary';
  children: React.ReactNode;
}

function AnswerButton({ onClick, disabled, variant, children }: AnswerButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`py-3 rounded-xl font-semibold text-sm transition-all duration-100 active:scale-95
        ${variant === 'primary'
          ? 'bg-gray-900 text-white hover:bg-gray-700 disabled:bg-gray-200 disabled:text-gray-400'
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-40'
        }
        disabled:cursor-not-allowed disabled:active:scale-100`}
    >
      {children}
    </button>
  );
}
