import { describe, it, expect } from 'vitest';
import { createPracticeStats, updatePracticeStats } from '../StatisticsManager';

describe('practice statistics', () => {
  describe('createPracticeStats', () => {
    it('returns zeroed initial statistics', () => {
      const stats = createPracticeStats();
      expect(stats.totalPuzzlesSolved).toBe(0);
      expect(stats.correctAnswers).toBe(0);
      expect(stats.incorrectAnswers).toBe(0);
      expect(stats.accuracyPercentage).toBe(0);
      expect(stats.currentStreak).toBe(0);
      expect(stats.bestStreak).toBe(0);
      expect(stats.fastestCorrectAnswer).toBeNull();
      expect(stats.averageResponseTime).toBeNull();
    });
  });

  describe('updatePracticeStats — correct answers', () => {
    it('increments correct answers and total solved', () => {
      const stats = updatePracticeStats(createPracticeStats(), true, 3.5);
      expect(stats.totalPuzzlesSolved).toBe(1);
      expect(stats.correctAnswers).toBe(1);
      expect(stats.incorrectAnswers).toBe(0);
    });

    it('calculates 100% accuracy after one correct answer', () => {
      const stats = updatePracticeStats(createPracticeStats(), true, 3.5);
      expect(stats.accuracyPercentage).toBe(100);
    });

    it('records fastest correct answer on first correct', () => {
      const stats = updatePracticeStats(createPracticeStats(), true, 4.0);
      expect(stats.fastestCorrectAnswer).toBe(4.0);
    });

    it('updates fastest correct answer when faster', () => {
      const stats = updatePracticeStats(
        updatePracticeStats(createPracticeStats(), true, 5.0),
        true,
        3.0,
      );
      expect(stats.fastestCorrectAnswer).toBe(3.0);
    });

    it('does not update fastest when slower', () => {
      const stats = updatePracticeStats(
        updatePracticeStats(createPracticeStats(), true, 3.0),
        true,
        5.0,
      );
      expect(stats.fastestCorrectAnswer).toBe(3.0);
    });

    it('builds a streak on consecutive correct answers', () => {
      let stats = createPracticeStats();
      stats = updatePracticeStats(stats, true, 2.0);
      stats = updatePracticeStats(stats, true, 2.0);
      stats = updatePracticeStats(stats, true, 2.0);
      expect(stats.currentStreak).toBe(3);
      expect(stats.bestStreak).toBe(3);
    });

    it('resets streak on incorrect answer', () => {
      let stats = createPracticeStats();
      stats = updatePracticeStats(stats, true, 2.0);
      stats = updatePracticeStats(stats, true, 2.0);
      stats = updatePracticeStats(stats, false, 8.0);
      expect(stats.currentStreak).toBe(0);
    });

    it('preserves best streak after reset', () => {
      let stats = createPracticeStats();
      stats = updatePracticeStats(stats, true, 2.0);
      stats = updatePracticeStats(stats, true, 2.0);
      stats = updatePracticeStats(stats, true, 2.0); // streak = 3
      stats = updatePracticeStats(stats, false, 8.0); // streak reset
      stats = updatePracticeStats(stats, true, 2.0); // streak = 1
      expect(stats.currentStreak).toBe(1);
      expect(stats.bestStreak).toBe(3);
    });
  });

  describe('updatePracticeStats — incorrect answers', () => {
    it('increments incorrect answers', () => {
      const stats = updatePracticeStats(createPracticeStats(), false, 8.0);
      expect(stats.incorrectAnswers).toBe(1);
      expect(stats.correctAnswers).toBe(0);
    });

    it('calculates 0% accuracy after incorrect answer', () => {
      const stats = updatePracticeStats(createPracticeStats(), false, 8.0);
      expect(stats.accuracyPercentage).toBe(0);
    });

    it('does not update fastest correct answer for incorrect', () => {
      const stats = updatePracticeStats(createPracticeStats(), false, 2.0);
      expect(stats.fastestCorrectAnswer).toBeNull();
    });
  });

  describe('updatePracticeStats — accuracy calculations', () => {
    it('calculates 50% accuracy with one correct one incorrect', () => {
      let stats = createPracticeStats();
      stats = updatePracticeStats(stats, true, 3.0);
      stats = updatePracticeStats(stats, false, 5.0);
      expect(stats.accuracyPercentage).toBe(50);
    });

    it('rounds accuracy to nearest integer', () => {
      let stats = createPracticeStats();
      stats = updatePracticeStats(stats, true, 1.0);
      stats = updatePracticeStats(stats, false, 1.0);
      stats = updatePracticeStats(stats, false, 1.0); // 1/3 = 33.33%
      expect(stats.accuracyPercentage).toBe(33);
    });
  });

  describe('updatePracticeStats — average response time', () => {
    it('sets average on first answer', () => {
      const stats = updatePracticeStats(createPracticeStats(), true, 4.0);
      expect(stats.averageResponseTime).toBe(4.0);
    });

    it('calculates running average correctly', () => {
      let stats = createPracticeStats();
      stats = updatePracticeStats(stats, true, 2.0);
      stats = updatePracticeStats(stats, false, 4.0);
      // (2.0 + 4.0) / 2 = 3.0
      expect(stats.averageResponseTime).toBe(3.0);
    });

    it('rounds average to 2 decimal places', () => {
      let stats = createPracticeStats();
      stats = updatePracticeStats(stats, true, 1.0);
      stats = updatePracticeStats(stats, true, 2.0);
      stats = updatePracticeStats(stats, true, 3.0);
      // (1+2+3)/3 = 2.00
      expect(stats.averageResponseTime).toBe(2.0);
    });
  });

  describe('full practice session simulation', () => {
    it('simulates 10 correct answers tracking difficulty threshold', () => {
      let stats = createPracticeStats();
      for (let i = 0; i < 10; i++) {
        stats = updatePracticeStats(stats, true, 2.5);
      }
      expect(stats.totalPuzzlesSolved).toBe(10);
      expect(stats.correctAnswers).toBe(10);
      expect(stats.accuracyPercentage).toBe(100);
      expect(stats.currentStreak).toBe(10);
      expect(stats.bestStreak).toBe(10);

      // Should have triggered difficulty progression twice (at 5 and 10)
      // This confirms the data is in place for the store to check
      expect(stats.correctAnswers % 5).toBe(0);
    });

    it('simulates mixed session', () => {
      let stats = createPracticeStats();
      const sequence = [true, true, false, true, true, true, false, true];
      sequence.forEach((correct, i) => {
        stats = updatePracticeStats(stats, correct, i % 3 + 1.5);
      });
      expect(stats.totalPuzzlesSolved).toBe(8);
      expect(stats.correctAnswers).toBe(6);
      expect(stats.incorrectAnswers).toBe(2);
      expect(stats.accuracyPercentage).toBe(75);
      expect(stats.currentStreak).toBe(1); // ends with true
      expect(stats.bestStreak).toBe(3);   // true×3 after second false
    });
  });
});
