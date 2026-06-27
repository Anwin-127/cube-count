import type { PlayerState, PlayerId } from '../models/Player';
import type { RoundResult, PlayerRoundResult } from '../models/RoundResult';
import { MIN_ANSWER_VALUE } from '../config/constants';

/**
 * Increments a player's answer by the given amount.
 * Returns a new players array with the updated player.
 * No-op if the player has already submitted.
 */
export function incrementAnswer(
  players: readonly PlayerState[],
  playerId: PlayerId,
  amount: number = 1,
): PlayerState[] {
  return players.map((p) =>
    p.id === playerId && !p.hasSubmitted
      ? { ...p, currentAnswer: p.currentAnswer + amount }
      : { ...p },
  );
}

/**
 * Decrements a player's answer by 1, clamped to MIN_ANSWER_VALUE.
 * No-op if the player has already submitted.
 */
export function decrementAnswer(
  players: readonly PlayerState[],
  playerId: PlayerId,
): PlayerState[] {
  return players.map((p) =>
    p.id === playerId && !p.hasSubmitted
      ? {
          ...p,
          currentAnswer: Math.max(MIN_ANSWER_VALUE, p.currentAnswer - 1),
        }
      : { ...p },
  );
}

/**
 * Submits a player's answer and records the submission time.
 * No-op if the player has already submitted.
 *
 * @param elapsedSeconds - Seconds elapsed since the answer phase started.
 */
export function submitAnswer(
  players: readonly PlayerState[],
  playerId: PlayerId,
  elapsedSeconds: number,
): PlayerState[] {
  return players.map((p) =>
    p.id === playerId && !p.hasSubmitted
      ? { ...p, hasSubmitted: true, answerTime: elapsedSeconds }
      : { ...p },
  );
}

/**
 * Locks all unsubmitted players' answers (timeout).
 * Sets their answer time to the maximum allowed time.
 */
export function lockAllUnsubmitted(
  players: readonly PlayerState[],
  maximumAnswerTime: number,
): PlayerState[] {
  return players.map((p) =>
    !p.hasSubmitted
      ? { ...p, hasSubmitted: true, answerTime: maximumAnswerTime }
      : { ...p },
  );
}

/**
 * Checks whether all players have submitted their answers.
 */
export function allPlayersSubmitted(
  players: readonly PlayerState[],
): boolean {
  return players.length > 0 && players.every((p) => p.hasSubmitted);
}

/**
 * Validates all player answers against the correct answer and
 * produces a RoundResult.
 *
 * Rules:
 * - A player is correct if their answer exactly matches the correct answer.
 * - The round winner is the correct player with the fastest submission time.
 * - If multiple players are correct with identical times, no winner is declared.
 * - If no player is correct, no winner is declared.
 */
export function validateRound(
  players: readonly PlayerState[],
  correctAnswer: number,
  roundNumber: number,
  maximumAnswerTime: number,
): RoundResult {
  const playerResults: PlayerRoundResult[] = players.map((p) => {
    const isCorrect = p.currentAnswer === correctAnswer;
    const answerTime = p.answerTime ?? maximumAnswerTime;
    const recordedTime = isCorrect ? answerTime : maximumAnswerTime;

    return {
      playerId: p.id,
      answer: p.currentAnswer,
      isCorrect,
      answerTime,
      recordedTime,
    };
  });

  // Determine the round winner
  const correctPlayers = playerResults.filter((r) => r.isCorrect);
  let winnerId: PlayerId | null = null;

  if (correctPlayers.length === 1) {
    winnerId = correctPlayers[0].playerId;
  } else if (correctPlayers.length > 1) {
    // Multiple correct: fastest time wins
    const sorted = [...correctPlayers].sort(
      (a, b) => a.answerTime - b.answerTime,
    );
    if (sorted[0].answerTime < sorted[1].answerTime) {
      winnerId = sorted[0].playerId;
    }
    // Equal times: no winner (draw for this round)
  }

  return {
    roundNumber,
    correctAnswer,
    playerResults,
    winnerId,
  };
}
