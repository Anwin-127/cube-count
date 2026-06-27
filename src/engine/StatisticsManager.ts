import type { PlayerId } from '../models/Player';
import type { RoundResult } from '../models/RoundResult';
import type {
  MatchStatistics,
  PlayerStatistics,
  PracticeStatistics,
} from '../models/MatchStatistics';
import {
  createInitialMatchStatistics,
  createInitialPracticeStatistics,
} from '../models/MatchStatistics';

// ---------------------------------------------------------------------------
// Match statistics (multiplayer)
// ---------------------------------------------------------------------------

/**
 * Creates initial match statistics for the given players.
 */
export function createMatchStats(
  playerIds: readonly PlayerId[],
  totalRounds: number,
): MatchStatistics {
  const base = createInitialMatchStatistics();
  return {
    ...base,
    totalRounds,
    playerStatistics: playerIds.map((id) => ({
      playerId: id,
      correctAnswers: 0,
      incorrectAnswers: 0,
      totalRecordedTime: 0,
      fastestCorrectAnswer: null,
    })),
  };
}

/**
 * Updates match statistics with the results of a completed round.
 */
export function updateMatchStats(
  stats: MatchStatistics,
  roundResult: RoundResult,
): MatchStatistics {
  const updatedPlayerStats = stats.playerStatistics.map((ps) => {
    const result = roundResult.playerResults.find(
      (r) => r.playerId === ps.playerId,
    );
    if (!result) return ps;

    return updatePlayerStats(ps, result.isCorrect, result.recordedTime);
  });

  return {
    ...stats,
    completedRounds: stats.completedRounds + 1,
    playerStatistics: updatedPlayerStats,
  };
}

/**
 * Determines the match winner based on accumulated statistics.
 *
 * Scoring priority:
 * 1. Most correct answers
 * 2. If tied: lowest total recorded time
 * 3. If still tied: draw
 */
export function determineMatchWinner(
  stats: MatchStatistics,
): PlayerId | 'DRAW' {
  if (stats.playerStatistics.length === 0) return 'DRAW';
  if (stats.playerStatistics.length === 1) {
    return stats.playerStatistics[0].playerId;
  }

  const sorted = [...stats.playerStatistics].sort((a, b) => {
    // Most correct answers first
    if (b.correctAnswers !== a.correctAnswers) {
      return b.correctAnswers - a.correctAnswers;
    }
    // Lowest recorded time first
    return a.totalRecordedTime - b.totalRecordedTime;
  });

  // Check for draw
  if (
    sorted[0].correctAnswers === sorted[1].correctAnswers &&
    sorted[0].totalRecordedTime === sorted[1].totalRecordedTime
  ) {
    return 'DRAW';
  }

  return sorted[0].playerId;
}

function updatePlayerStats(
  ps: PlayerStatistics,
  isCorrect: boolean,
  recordedTime: number,
): PlayerStatistics {
  const correctAnswers = ps.correctAnswers + (isCorrect ? 1 : 0);
  const incorrectAnswers = ps.incorrectAnswers + (isCorrect ? 0 : 1);
  const totalRecordedTime = ps.totalRecordedTime + recordedTime;

  let fastestCorrectAnswer = ps.fastestCorrectAnswer;
  if (isCorrect) {
    fastestCorrectAnswer =
      fastestCorrectAnswer === null
        ? recordedTime
        : Math.min(fastestCorrectAnswer, recordedTime);
  }

  return {
    ...ps,
    correctAnswers,
    incorrectAnswers,
    totalRecordedTime,
    fastestCorrectAnswer,
  };
}

// ---------------------------------------------------------------------------
// Practice statistics (single player)
// ---------------------------------------------------------------------------

/**
 * Creates initial practice statistics.
 */
export function createPracticeStats(): PracticeStatistics {
  return createInitialPracticeStatistics();
}

/**
 * Updates practice statistics with the result of a completed round.
 */
export function updatePracticeStats(
  stats: PracticeStatistics,
  isCorrect: boolean,
  answerTime: number,
): PracticeStatistics {
  const totalPuzzlesSolved = stats.totalPuzzlesSolved + 1;
  const correctAnswers = stats.correctAnswers + (isCorrect ? 1 : 0);
  const incorrectAnswers = stats.incorrectAnswers + (isCorrect ? 0 : 1);
  const accuracyPercentage =
    totalPuzzlesSolved > 0
      ? Math.round((correctAnswers / totalPuzzlesSolved) * 100)
      : 0;

  // Fastest correct answer
  let fastestCorrectAnswer = stats.fastestCorrectAnswer;
  if (isCorrect) {
    fastestCorrectAnswer =
      fastestCorrectAnswer === null
        ? answerTime
        : Math.min(fastestCorrectAnswer, answerTime);
  }

  // Average response time (running average)
  const previousTotal =
    (stats.averageResponseTime ?? 0) * stats.totalPuzzlesSolved;
  const averageResponseTime =
    Math.round(((previousTotal + answerTime) / totalPuzzlesSolved) * 100) / 100;

  // Streak
  const currentStreak = isCorrect ? stats.currentStreak + 1 : 0;
  const bestStreak = Math.max(stats.bestStreak, currentStreak);

  return {
    totalPuzzlesSolved,
    correctAnswers,
    incorrectAnswers,
    accuracyPercentage,
    fastestCorrectAnswer,
    averageResponseTime,
    currentStreak,
    bestStreak,
  };
}
