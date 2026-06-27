/**
 * Supported game modes for Cube Count.
 */
export const GameMode = {
  /** Single player, unlimited rounds, personal statistics. */
  PRACTICE: 'PRACTICE',
  /** Two players, shared screen, competitive scoring. */
  LOCAL_MULTIPLAYER: 'LOCAL_MULTIPLAYER',
} as const;

export type GameMode = (typeof GameMode)[keyof typeof GameMode];
