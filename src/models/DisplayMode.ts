/**
 * Controls how the puzzle display duration behaves across rounds.
 */
export const DisplayMode = {
  /** Display time remains constant for every round. */
  FIXED: 'FIXED',
  /** Display time decreases as round numbers increase. */
  PROGRESSIVE: 'PROGRESSIVE',
} as const;

export type DisplayMode = (typeof DisplayMode)[keyof typeof DisplayMode];
