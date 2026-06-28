import type { PlayerId } from './Player';

/**
 * Accumulated statistics for a single player across a multiplayer match.
 */
export interface PlayerStatistics {
  readonly playerId: PlayerId;
  correctAnswers: number;
  incorrectAnswers: number;
  totalRecordedTime: number;
  fastestCorrectAnswer: number | null;
  averageResponseTime: number | null;
  roundWins: number;
}

/**
 * Match-level statistics for local multiplayer mode.
 */
export interface MatchStatistics {
  totalRounds: number;
  completedRounds: number;
  playerStatistics: PlayerStatistics[];
}

/**
 * Session statistics for practice mode.
 * Tracks personal performance across unlimited rounds.
 */
export interface PracticeStatistics {
  totalPuzzlesSolved: number;
  correctAnswers: number;
  incorrectAnswers: number;
  accuracyPercentage: number;
  fastestCorrectAnswer: number | null;
  averageResponseTime: number | null;
  currentStreak: number;
  bestStreak: number;
}

/**
 * Creates empty match statistics for a new multiplayer game.
 */
export function createInitialMatchStatistics(): MatchStatistics {
  return {
    totalRounds: 0,
    completedRounds: 0,
    playerStatistics: [],
  };
}

/**
 * Creates empty practice statistics for a new practice session.
 */
export function createInitialPracticeStatistics(): PracticeStatistics {
  return {
    totalPuzzlesSolved: 0,
    correctAnswers: 0,
    incorrectAnswers: 0,
    accuracyPercentage: 0,
    fastestCorrectAnswer: null,
    averageResponseTime: null,
    currentStreak: 0,
    bestStreak: 0,
  };
}
