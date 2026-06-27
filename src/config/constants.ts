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
  [Difficulty.EASY]: 2,
  [Difficulty.MEDIUM]: 3,
  [Difficulty.HARD]: 4,
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
