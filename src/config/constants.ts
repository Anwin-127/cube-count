import { Difficulty } from '../models/Difficulty';

/**
 * Application-wide constants.
 *
 * These values are structural constraints that never change during gameplay.
 * Gameplay-variable settings belong in GameConfig instead.
 */

/** The puzzle board is always a square grid of this size. */
export const BOARD_SIZE = 5;

/** The minimum value a player's answer counter can hold. */
export const MIN_ANSWER_VALUE = 0;

/** Supported round counts for game configuration. */
export const SUPPORTED_ROUND_COUNTS = [5, 10, 20] as const;

/** Default maximum stack height per difficulty level. */
export const DIFFICULTY_MAX_HEIGHTS: Record<Difficulty, number> = {
  [Difficulty.EASY]: 1,
  [Difficulty.MEDIUM]: 2,
  [Difficulty.HARD]: 3,
  [Difficulty.IMPOSSIBLE]: 3,
  [Difficulty.CUSTOM]: 3,
};

/** Complexity ranges per difficulty [min, max]. */
export const DIFFICULTY_TARGET_COMPLEXITY: Record<Difficulty, [number, number]> = {
  [Difficulty.EASY]: [0.15, 0.30],
  [Difficulty.MEDIUM]: [0.35, 0.50],
  [Difficulty.HARD]: [0.55, 0.70],
  [Difficulty.IMPOSSIBLE]: [0.75, 0.90],
  [Difficulty.CUSTOM]: [0, 1],
};

/**
 * Progressive display time schedule.
 * Maps a round-range ceiling to the display duration in seconds.
 *
 * Example: rounds 1–5 get 10s, rounds 6–10 get 8s, etc.
 */
export const PROGRESSIVE_DISPLAY_SCHEDULE: readonly { maxRound: number; displayTime: number }[] = [
  { maxRound: 5, displayTime: 10 },
  { maxRound: 10, displayTime: 8 },
  { maxRound: 15, displayTime: 6 },
  { maxRound: 20, displayTime: 5 },
];
