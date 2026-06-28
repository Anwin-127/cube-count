import { useState, useCallback } from 'react';
import { useGameStore } from '../store/gameStore';
import { GamePhase } from '../models/GamePhase';
import { GameMode } from '../models/GameMode';
import { PuzzleCanvas } from '../components/PuzzleCanvas';
import { DebugOverlay } from '../components/DebugOverlay';
import { useDebugOverlay } from '../hooks/useDebugOverlay';
import { useTimer } from '../hooks/useTimer';
import type { RenderInfo } from '../renderer/types';

export function GameplayScreen() {
  const phase = useGameStore((s) => s.phase);
  const config = useGameStore((s) => s.config);
  const players = useGameStore((s) => s.players);
  const puzzle = useGameStore((s) => s.currentPuzzle);
  const currentRound = useGameStore((s) => s.currentRound);
  const incrementAnswer = useGameStore((s) => s.incrementAnswer);
  const decrementAnswer = useGameStore((s) => s.decrementAnswer);
  const submitAnswer = useGameStore((s) => s.submitAnswer);
  const practiceStatistics = useGameStore((s) => s.practiceStatistics);

  const showDebug = useDebugOverlay();
  const [renderInfo, setRenderInfo] = useState<RenderInfo | null>(null);
  const handleRenderInfo = useCallback((info: RenderInfo) => setRenderInfo(info), []);

  const timeRemaining = useTimer();
  const isPractice = config.gameMode === GameMode.PRACTICE;
  const player1 = players[0];
  const player2 = players[1];

  const visiblePuzzle = phase === GamePhase.DISPLAYING_PUZZLE ? puzzle : null;
  const isAnswerPhase = phase === GamePhase.ANSWER_PHASE;
  const isDisplayPhase = phase === GamePhase.DISPLAYING_PUZZLE;
  
  const p1Submitted = player1?.hasSubmitted ?? false;
  const p2Submitted = player2?.hasSubmitted ?? false;

  return (
    <div className="flex flex-col min-h-screen bg-[#F7F7F7]">
      {/* ── Top bar ─────────────────────────────────────────────── */}
      <header className="flex items-center justify-between px-8 pt-6 pb-2">
        <div className="text-sm font-bold text-black uppercase tracking-wider flex flex-col">
          <span>{isPractice ? 'Practice Mode' : 'Match'}</span>
          <span className="text-black">
            {isPractice
              ? `Solved ${practiceStatistics?.totalPuzzlesSolved ?? 0}`
              : `Round ${currentRound} / ${config.numberOfRounds}`}
          </span>
        </div>
        
        <TimerBadge
          seconds={timeRemaining}
          phase={phase}
          maxAnswerTime={config.maximumAnswerTime}
          maxDisplayTime={config.initialDisplayTime}
        />
        
        <div className="text-sm font-bold text-black uppercase tracking-wider text-right flex flex-col">
          <span>Difficulty</span>
          <span className="text-black">{config.difficulty}</span>
        </div>
      </header>

      {/* ── Main Content Area ───────────────────────────────────── */}
      <div className="flex-1 flex flex-col lg:flex-row items-center justify-center px-6 py-4 gap-12 overflow-hidden">
        
        {/* Player 1 Panel (Multiplayer left side) */}
        {!isPractice && player1 && (
          <div className="w-full max-w-[280px]">
            <AnswerPanel
              title="Player 1"
              answer={player1.currentAnswer}
              submitted={p1Submitted}
              isActive={isAnswerPhase}
              recordedTime={player1.answerTime}
              onIncrement={() => incrementAnswer('player1', 1)}
              onIncrementTen={() => incrementAnswer('player1', 10)}
              onDecrement={() => decrementAnswer('player1')}
              onDecrementTen={() => decrementAnswer('player1', 10)}
              onSubmit={() => submitAnswer('player1')}
              keys={{
                up: { key: 'W', label: '+1' },
                left: { key: 'A', label: '-10' },
                down: { key: 'S', label: '-1' },
                right: { key: 'D', label: '+10' },
                submit: { key: 'LShift', label: 'Submit' },
              }}
            />
          </div>
        )}

        {/* Puzzle canvas area */}
        <div
          className="relative w-full border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-white max-h-full"
          style={{ maxWidth: 600, aspectRatio: '4 / 3' }}
        >
          {/* Loading state */}
          {phase === GamePhase.GENERATING_PUZZLE && (
            <div className="absolute inset-0 flex items-center justify-center z-10 bg-white">
              <div className="text-center text-black font-bold uppercase tracking-widest text-xl animate-pulse">
                Generating...
              </div>
            </div>
          )}

          {/* Answer phase overlay */}
          {isAnswerPhase && (
            <div className="absolute inset-0 flex items-center justify-center z-10 bg-white/95 backdrop-blur-sm transition-opacity duration-150">
              <p className="text-3xl font-bold text-black uppercase tracking-widest select-none">
                How many cubes?
              </p>
            </div>
          )}

          {/* Validating overlay */}
          {phase === GamePhase.VALIDATING && (
            <div className="absolute inset-0 flex items-center justify-center z-10 bg-white/95">
              <p className="text-black font-bold uppercase tracking-widest animate-pulse">Checking…</p>
            </div>
          )}

          <PuzzleCanvas
            puzzle={visiblePuzzle}
            className="w-full h-full bg-white"
            onRenderInfo={handleRenderInfo}
          />

          {/* Timer countdown ring during display phase */}
          {isDisplayPhase && timeRemaining !== null && (
            <TimerRing
              remaining={timeRemaining}
              total={config.initialDisplayTime}
            />
          )}

          {/* Debug overlay */}
          {showDebug && (
            <DebugOverlay puzzle={puzzle} renderInfo={renderInfo} />
          )}
        </div>

        {/* Right Panel: Player 1 (Practice) or Player 2 (Multiplayer) */}
        <div className="w-full max-w-[280px]">
          {isPractice && player1 && (
            <AnswerPanel
              title="Practice"
              answer={player1.currentAnswer}
              submitted={p1Submitted}
              isActive={isAnswerPhase}
              recordedTime={player1.answerTime}
              onIncrement={() => incrementAnswer('player1', 1)}
              onIncrementTen={() => incrementAnswer('player1', 10)}
              onDecrement={() => decrementAnswer('player1')}
              onDecrementTen={() => decrementAnswer('player1', 10)}
              onSubmit={() => submitAnswer('player1')}
              keys={{
                up: { key: 'W', label: '+1' },
                left: { key: 'A', label: '-10' },
                down: { key: 'S', label: '-1' },
                right: { key: 'D', label: '+10' },
                submit: { key: 'LShift', label: 'Submit' },
              }}
            />
          )}
          {!isPractice && player2 && (
            <AnswerPanel
              title="Player 2"
              answer={player2.currentAnswer}
              submitted={p2Submitted}
              isActive={isAnswerPhase}
              recordedTime={player2.answerTime}
              onIncrement={() => incrementAnswer('player2', 1)}
              onIncrementTen={() => incrementAnswer('player2', 10)}
              onDecrement={() => decrementAnswer('player2')}
              onDecrementTen={() => decrementAnswer('player2', 10)}
              onSubmit={() => submitAnswer('player2')}
              keys={{
                up: { key: '↑', label: '+1' },
                left: { key: '←', label: '-10' },
                down: { key: '↓', label: '-1' },
                right: { key: '→', label: '+10' },
                submit: { key: 'RShift', label: 'Submit' },
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// TimerBadge
// ---------------------------------------------------------------------------

function TimerBadge({ seconds, phase, maxAnswerTime, maxDisplayTime }: {
  seconds: number | null; phase: GamePhase; maxAnswerTime: number; maxDisplayTime: number;
}) {
  if (seconds === null) return <div className="w-24" />;

  const isDisplaying = phase === GamePhase.DISPLAYING_PUZZLE;
  const isAnswer = phase === GamePhase.ANSWER_PHASE;
  const max = isDisplaying ? maxDisplayTime : maxAnswerTime;
  const urgency = seconds / max;
  const isUrgent = urgency <= 0.25 && isAnswer;

  return (
    <div
      className={`text-center min-w-24 transition-colors duration-150 ${
        isUrgent ? 'text-[#F59E0B]' : 'text-black'
      }`}
    >
      <div className={`text-4xl font-bold tabular-nums ${isUrgent ? 'animate-[pulse_0.5s_ease-in-out_infinite] scale-110' : ''} transition-transform`}>
        {seconds.toFixed(1)}
      </div>
      <div className={`text-[10px] font-bold uppercase tracking-widest mt-1 ${isUrgent ? 'text-[#F59E0B]' : 'text-gray-500'}`}>
        {isDisplaying ? 'memorise' : 'answer'}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// TimerRing
// ---------------------------------------------------------------------------

function TimerRing({ remaining, total }: { remaining: number; total: number }) {
  const progress = Math.max(0, Math.min(1, remaining / total));
  const radius = 16;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - progress);

  return (
    <div className="absolute top-4 right-4 pointer-events-none" aria-hidden="true">
      <svg width={40} height={40} className="rotate-[-90deg]">
        <circle cx={20} cy={20} r={radius} fill="none" stroke="#EEEEEE" strokeWidth={4} />
        <circle
          cx={20}
          cy={20}
          r={radius}
          fill="none"
          stroke="black"
          strokeWidth={4}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="square"
          style={{ transition: 'stroke-dashoffset 0.1s linear' }}
        />
      </svg>
    </div>
  );
}

// ---------------------------------------------------------------------------
// AnswerPanel
// ---------------------------------------------------------------------------

interface AnswerPanelProps {
  title: string;
  answer: number;
  submitted: boolean;
  isActive: boolean;
  recordedTime?: number | null;
  onIncrement: () => void;
  onIncrementTen: () => void;
  onDecrement: () => void;
  onDecrementTen: () => void;
  onSubmit: () => void;
  keys: {
    up: { key: string; label: string };
    left: { key: string; label: string };
    down: { key: string; label: string };
    right: { key: string; label: string };
    submit: { key: string; label: string };
  };
}

function AnswerPanel({
  title,
  answer,
  submitted,
  isActive,
  recordedTime,
  onIncrement,
  onIncrementTen,
  onDecrement,
  onDecrementTen,
  onSubmit,
  keys,
}: AnswerPanelProps) {
  const disabled = !isActive || submitted;

  return (
    <div
      className={`geo-panel-light p-6 transition-opacity duration-150 ${
        isActive ? 'opacity-100' : 'opacity-50'
      }`}
    >
      {submitted ? (
        <div className="flex flex-col items-center justify-center py-4 h-[300px]">
          <p className="text-sm font-bold text-[#555] uppercase tracking-wider mb-2">
            {title} Answer
          </p>
          <p className="text-6xl font-bold text-black tabular-nums mb-6">
            {answer}
          </p>
          <div className="bg-black text-[#B8FF2C] font-bold uppercase tracking-wider text-sm px-4 py-2 border-2 border-black shadow-[4px_4px_0px_0px_#B8FF2C]">
            Locked: {recordedTime?.toFixed(2)}s
          </div>
        </div>
      ) : (
        <div className="flex flex-col justify-between h-[300px]">
          {/* Answer display */}
          <div className="text-center mb-2">
            <p className="text-sm font-bold text-[#555] uppercase tracking-wider mb-1">
              {title}
            </p>
            <p
              className={`text-6xl font-bold tabular-nums ${
                isActive ? 'text-black' : 'text-[#888]'
              }`}
            >
              {answer}
            </p>
          </div>

          {/* Directional Control Buttons */}
          <div className="flex flex-col items-center w-full">
            <div className="grid grid-cols-3 grid-rows-3 gap-2 items-center justify-items-center w-full max-w-[200px]">
              {/* Row 1: Up */}
              <div />
              <button
                onClick={onIncrement}
                disabled={disabled}
                className="geo-button-secondary w-full h-12 flex flex-col items-center justify-center relative group"
              >
                <span className="text-[10px] text-[#555] font-bold absolute top-0.5">{keys.up.label}</span>
                <span className="text-sm font-bold text-black mt-2">{keys.up.key}</span>
              </button>
              <div />
              
              {/* Row 2: Left, Empty, Right */}
              <button
                onClick={() => { if (answer > 0) onDecrementTen(); }}
                disabled={disabled || answer < 10}
                className="geo-button-secondary w-full h-12 flex flex-col items-center justify-center relative group"
              >
                <span className="text-[10px] text-[#555] font-bold absolute top-0.5">{keys.left.label}</span>
                <span className="text-sm font-bold text-black mt-2">{keys.left.key}</span>
              </button>
              <div />
              <button
                onClick={onIncrementTen}
                disabled={disabled}
                className="geo-button-secondary w-full h-12 flex flex-col items-center justify-center relative group"
              >
                <span className="text-[10px] text-[#555] font-bold absolute top-0.5">{keys.right.label}</span>
                <span className="text-sm font-bold text-black mt-2">{keys.right.key}</span>
              </button>

              {/* Row 3: Down */}
              <div />
              <button
                onClick={() => { if (answer > 0) onDecrement(); }}
                disabled={disabled || answer <= 0}
                className="geo-button-secondary w-full h-12 flex flex-col items-center justify-center relative group"
              >
                <span className="text-[10px] text-[#555] font-bold absolute top-0.5">{keys.down.label}</span>
                <span className="text-sm font-bold text-black mt-2">{keys.down.key}</span>
              </button>
              <div />
            </div>

            <button
              onClick={onSubmit}
              disabled={disabled}
              className="geo-button w-full h-10 flex items-center justify-center mt-3 gap-2"
            >
              <kbd className="bg-black text-[#B8FF2C] px-1.5 py-0.5 rounded-sm text-xs font-bold leading-none">{keys.submit.key}</kbd>
              <span className="text-xs font-bold uppercase tracking-wider">{keys.submit.label}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
