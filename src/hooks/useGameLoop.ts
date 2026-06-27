import { useEffect, useRef } from 'react';
import { useGameStore } from '../store/gameStore';
import { GamePhase } from '../models/GamePhase';

/** Phases that require the game loop to run. */
const ACTIVE_PHASES: readonly GamePhase[] = [
  GamePhase.GENERATING_PUZZLE,
  GamePhase.DISPLAYING_PUZZLE,
  GamePhase.ANSWER_PHASE,
  GamePhase.VALIDATING,
];

/**
 * Drives the game engine tick on a requestAnimationFrame loop.
 *
 * Active during GENERATING_PUZZLE, DISPLAYING_PUZZLE, ANSWER_PHASE,
 * and VALIDATING. Pauses automatically during all other phases so the
 * loop produces zero overhead when the player is on menus or results.
 *
 * This hook should be mounted once at the application root so the
 * loop runs regardless of which screen is visible.
 */
export function useGameLoop(): void {
  const rafRef = useRef<number | null>(null);
  const phase = useGameStore((s) => s.phase);
  const phaseRef = useRef<GamePhase>(phase);

  // Keep phaseRef in sync (outside render body)
  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  useEffect(() => {
    const isActive = ACTIVE_PHASES.includes(phase);

    if (!isActive) {
      // Cancel any running loop when we leave an active phase
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      return;
    }

    const tick = () => {
      // Only tick if we're still in an active phase
      if (!ACTIVE_PHASES.includes(phaseRef.current)) {
        rafRef.current = null;
        return;
      }

      useGameStore.getState().tick(Date.now());
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [phase]);
}
