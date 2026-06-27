import type { PlayerId } from './Player';

/**
 * Result for a single player in a completed round.
 */
export interface PlayerRoundResult {
  readonly playerId: PlayerId;
  readonly answer: number;
  readonly isCorrect: boolean;
  /** Actual time in seconds when the player submitted. */
  readonly answerTime: number;
  /** Recorded time for scoring: actual time if correct, max time if incorrect. */
  readonly recordedTime: number;
}

/**
 * Complete result data for a single completed round.
 */
export interface RoundResult {
  readonly roundNumber: number;
  readonly correctAnswer: number;
  readonly playerResults: readonly PlayerRoundResult[];
  /** The player who won this round, or null for a draw / single-player. */
  readonly winnerId: PlayerId | null;
}
