/**
 * Identifies a player in the game.
 * Version 1 supports exactly two local players.
 */
export type PlayerId = 'player1' | 'player2';

/**
 * Represents the current state of a single player during a round.
 *
 * Each player has independent answer tracking, submission state, and timing.
 */
export interface PlayerState {
  readonly id: PlayerId;
  currentAnswer: number;
  hasSubmitted: boolean;
  /** Time in seconds when the player submitted. Null if not yet submitted. */
  answerTime: number | null;
  /** Whether the submitted answer was correct. Null until validated. */
  isCorrect: boolean | null;
  /** The time recorded for scoring. Null until validated. */
  recordedTime: number | null;
}

/**
 * Creates the initial state for a player at the start of a round.
 */
export function createInitialPlayerState(id: PlayerId): PlayerState {
  return {
    id,
    currentAnswer: 0,
    hasSubmitted: false,
    answerTime: null,
    isCorrect: null,
    recordedTime: null,
  };
}
