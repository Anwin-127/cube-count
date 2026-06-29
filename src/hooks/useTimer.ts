import { useEffect, useRef, useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { GamePhase } from '../models/GamePhase';
import { TimeService } from '../online/TimeService';

/** Phases that run a live countdown timer. */
const TIMED_PHASES: readonly GamePhase[] = [
  GamePhase.ONLINE_COUNTDOWN,
  GamePhase.DISPLAYING_PUZZLE,
  GamePhase.ANSWER_PHASE,
];

/**
 * Returns the number of seconds remaining in the current timed phase.
 *
 * Updates on every animation frame while a timed phase is active.
 * Returns null when no timer is running (menus, results, etc.).
 *
 * Phases with timers:
 *   - ONLINE_COUNTDOWN  → counts down to displayStartTime
 *   - DISPLAYING_PUZZLE → counts down from currentDisplayDuration
 *   - ANSWER_PHASE      → counts down from config.maximumAnswerTime
 */
export function useTimer(): number | null {
  const [remaining, setRemaining] = useState<number | null>(null);
  const rafRef = useRef<number | null>(null);

  const phase = useGameStore((s) => s.phase);
  const displayStartTime = useGameStore((s) => s.displayStartTime);
  const answerStartTime = useGameStore((s) => s.answerStartTime);
  const displayDuration = useGameStore((s) => s.currentDisplayDuration);
  const maxAnswerTime = useGameStore((s) => s.config.maximumAnswerTime);

  useEffect(() => {
    // Cancel any previous rAF before starting
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    const isTimedPhase = TIMED_PHASES.includes(phase);

    const update = () => {
      if (!isTimedPhase) {
        // Clear the timer display (called from within the rAF callback)
        setRemaining(null);
        return;
      }

      const now = TimeService.getServerTime();
      let next: number | null = null;

      if (phase === GamePhase.ONLINE_COUNTDOWN && displayStartTime !== null) {
        const elapsed = (displayStartTime - now) / 1000;
        next = Math.max(0, elapsed);
      } else if (phase === GamePhase.DISPLAYING_PUZZLE && displayStartTime !== null) {
        const elapsed = (now - displayStartTime) / 1000;
        next = Math.max(0, displayDuration - elapsed);
      } else if (phase === GamePhase.ANSWER_PHASE && answerStartTime !== null) {
        const elapsed = (now - answerStartTime) / 1000;
        next = Math.max(0, maxAnswerTime - elapsed);
      }

      setRemaining(next);
      rafRef.current = requestAnimationFrame(update);
    };

    rafRef.current = requestAnimationFrame(update);

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [phase, displayStartTime, answerStartTime, displayDuration, maxAnswerTime]);

  return remaining;
}
