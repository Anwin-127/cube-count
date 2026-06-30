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
  [Difficulty.EASY]:       2,
  [Difficulty.MEDIUM]:     4,
  [Difficulty.HARD]:       6,
  [Difficulty.IMPOSSIBLE]: 8,
  [Difficulty.CUSTOM]:     6,
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

/**
 * Maximum isometric occlusion score before a puzzle is rejected by the factory.
 * Prevents puzzles where important stacks are completely hidden behind taller ones.
 * Range: 0 (no occlusion) → 1 (fully occluded). Tuned for readability.
 */
export const OCCLUSION_REJECTION_THRESHOLD = 0.5;

/**
 * Minimum readability score a puzzle should achieve before it is preferred.
 * Puzzles below this threshold are only used as a last resort.
 * Range: 0 (unreadable) → 1 (perfectly clear). Tuned for visual quality.
 */
export const READABILITY_SOFT_THRESHOLD = 0.35;

/**
 * Number of recent puzzle structure signatures retained per session.
 * Signatures capture the qualitative shape of a puzzle (not exact heights),
 * so this prevents visually similar layouts from appearing close together.
 */
export const SIGNATURE_HISTORY_SIZE = 20;
