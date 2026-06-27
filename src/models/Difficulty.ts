/**
 * Puzzle difficulty levels.
 *
 * Difficulty affects puzzle complexity (stack heights, overlap, hidden cubes)
 * but never changes the board size, which remains fixed at 5×5.
 */
export const Difficulty = {
  EASY: 'EASY',
  MEDIUM: 'MEDIUM',
  HARD: 'HARD',
} as const;

export type Difficulty = (typeof Difficulty)[keyof typeof Difficulty];
