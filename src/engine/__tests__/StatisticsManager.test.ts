import { describe, it, expect } from 'vitest';
import {
  createMatchStats,
  updateMatchStats,
  determineMatchWinner,
  createPracticeStats,
  updatePracticeStats,
} from '../StatisticsManager';
import type { RoundResult } from '../../models/RoundResult';

function makeRoundResult(overrides: Partial<RoundResult> = {}): RoundResult {
  return {
    roundNumber: 1,
    correctAnswer: 15,
    playerResults: [
      { playerId: 'player1', answer: 15, isCorrect: true, answerTime: 3.0, recordedTime: 3.0 },
      { playerId: 'player2', answer: 10, isCorrect: false, answerTime: 4.0, recordedTime: 10.0 },
    ],
    winnerId: 'player1',
    ...overrides,
  };
}

describe('StatisticsManager', () => {
  describe('Match Statistics', () => {
    it('creates initial stats with player entries', () => {
      const stats = createMatchStats(['player1', 'player2'], 5);
      expect(stats.totalRounds).toBe(5);
      expect(stats.completedRounds).toBe(0);
      expect(stats.playerStatistics.length).toBe(2);
      expect(stats.playerStatistics[0].correctAnswers).toBe(0);
    });

    it('updates stats after a round', () => {
      const stats = createMatchStats(['player1', 'player2'], 5);
      const result = makeRoundResult();
      const updated = updateMatchStats(stats, result);

      expect(updated.completedRounds).toBe(1);

      const p1 = updated.playerStatistics.find((ps) => ps.playerId === 'player1')!;
      expect(p1.correctAnswers).toBe(1);
      expect(p1.incorrectAnswers).toBe(0);
      expect(p1.totalRecordedTime).toBe(3.0);
      expect(p1.fastestCorrectAnswer).toBe(3.0);

      const p2 = updated.playerStatistics.find((ps) => ps.playerId === 'player2')!;
      expect(p2.correctAnswers).toBe(0);
      expect(p2.incorrectAnswers).toBe(1);
      expect(p2.totalRecordedTime).toBe(10.0);
      expect(p2.fastestCorrectAnswer).toBeNull();
    });

    it('accumulates stats across multiple rounds', () => {
      let stats = createMatchStats(['player1', 'player2'], 5);
      stats = updateMatchStats(stats, makeRoundResult());
      stats = updateMatchStats(
        stats,
        makeRoundResult({
          roundNumber: 2,
          playerResults: [
            { playerId: 'player1', answer: 20, isCorrect: true, answerTime: 2.0, recordedTime: 2.0 },
            { playerId: 'player2', answer: 20, isCorrect: true, answerTime: 5.0, recordedTime: 5.0 },
          ],
        }),
      );

      expect(stats.completedRounds).toBe(2);

      const p1 = stats.playerStatistics.find((ps) => ps.playerId === 'player1')!;
      expect(p1.correctAnswers).toBe(2);
      expect(p1.totalRecordedTime).toBe(5.0);
      expect(p1.fastestCorrectAnswer).toBe(2.0);

      const p2 = stats.playerStatistics.find((ps) => ps.playerId === 'player2')!;
      expect(p2.correctAnswers).toBe(1);
      expect(p2.fastestCorrectAnswer).toBe(5.0);
    });
  });

  describe('determineMatchWinner', () => {
    it('selects the player with most correct answers', () => {
      let stats = createMatchStats(['player1', 'player2'], 3);
      stats = updateMatchStats(stats, makeRoundResult()); // p1 correct
      stats = updateMatchStats(
        stats,
        makeRoundResult({
          roundNumber: 2,
          playerResults: [
            { playerId: 'player1', answer: 20, isCorrect: true, answerTime: 3.0, recordedTime: 3.0 },
            { playerId: 'player2', answer: 10, isCorrect: false, answerTime: 4.0, recordedTime: 10.0 },
          ],
        }),
      );

      expect(determineMatchWinner(stats)).toBe('player1');
    });

    it('uses total recorded time as tiebreaker', () => {
      let stats = createMatchStats(['player1', 'player2'], 2);
      stats = updateMatchStats(
        stats,
        makeRoundResult({
          playerResults: [
            { playerId: 'player1', answer: 15, isCorrect: true, answerTime: 5.0, recordedTime: 5.0 },
            { playerId: 'player2', answer: 15, isCorrect: true, answerTime: 3.0, recordedTime: 3.0 },
          ],
        }),
      );

      expect(determineMatchWinner(stats)).toBe('player2');
    });

    it('returns DRAW when completely tied', () => {
      let stats = createMatchStats(['player1', 'player2'], 1);
      stats = updateMatchStats(
        stats,
        makeRoundResult({
          playerResults: [
            { playerId: 'player1', answer: 15, isCorrect: true, answerTime: 3.0, recordedTime: 3.0 },
            { playerId: 'player2', answer: 15, isCorrect: true, answerTime: 3.0, recordedTime: 3.0 },
          ],
        }),
      );

      expect(determineMatchWinner(stats)).toBe('DRAW');
    });

    it('returns DRAW for empty stats', () => {
      const stats = createMatchStats([], 0);
      expect(determineMatchWinner(stats)).toBe('DRAW');
    });
  });

  describe('Practice Statistics', () => {
    it('creates initial practice stats', () => {
      const stats = createPracticeStats();
      expect(stats.totalPuzzlesSolved).toBe(0);
      expect(stats.correctAnswers).toBe(0);
      expect(stats.currentStreak).toBe(0);
    });

    it('updates after a correct answer', () => {
      const stats = updatePracticeStats(createPracticeStats(), true, 3.5);
      expect(stats.totalPuzzlesSolved).toBe(1);
      expect(stats.correctAnswers).toBe(1);
      expect(stats.accuracyPercentage).toBe(100);
      expect(stats.fastestCorrectAnswer).toBe(3.5);
      expect(stats.currentStreak).toBe(1);
      expect(stats.bestStreak).toBe(1);
    });

    it('updates after an incorrect answer', () => {
      const stats = updatePracticeStats(createPracticeStats(), false, 5.0);
      expect(stats.totalPuzzlesSolved).toBe(1);
      expect(stats.incorrectAnswers).toBe(1);
      expect(stats.accuracyPercentage).toBe(0);
      expect(stats.currentStreak).toBe(0);
    });

    it('tracks streaks correctly', () => {
      let stats = createPracticeStats();
      stats = updatePracticeStats(stats, true, 3.0);
      stats = updatePracticeStats(stats, true, 2.5);
      stats = updatePracticeStats(stats, true, 4.0);
      expect(stats.currentStreak).toBe(3);
      expect(stats.bestStreak).toBe(3);

      stats = updatePracticeStats(stats, false, 5.0);
      expect(stats.currentStreak).toBe(0);
      expect(stats.bestStreak).toBe(3);

      stats = updatePracticeStats(stats, true, 2.0);
      expect(stats.currentStreak).toBe(1);
      expect(stats.bestStreak).toBe(3);
    });

    it('tracks fastest correct answer', () => {
      let stats = createPracticeStats();
      stats = updatePracticeStats(stats, true, 5.0);
      expect(stats.fastestCorrectAnswer).toBe(5.0);

      stats = updatePracticeStats(stats, true, 3.0);
      expect(stats.fastestCorrectAnswer).toBe(3.0);

      stats = updatePracticeStats(stats, true, 4.0);
      expect(stats.fastestCorrectAnswer).toBe(3.0);
    });

    it('calculates average response time', () => {
      let stats = createPracticeStats();
      stats = updatePracticeStats(stats, true, 4.0);
      expect(stats.averageResponseTime).toBe(4.0);

      stats = updatePracticeStats(stats, true, 6.0);
      expect(stats.averageResponseTime).toBe(5.0);
    });
  });
});
