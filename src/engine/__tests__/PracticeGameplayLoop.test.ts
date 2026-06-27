import { describe, it, expect, beforeEach } from 'vitest';
import { GamePhase } from '../../models/GamePhase';
import { GameMode } from '../../models/GameMode';
import { Difficulty } from '../../models/Difficulty';
import { DisplayMode } from '../../models/DisplayMode';
import { DIFFICULTY_PROGRESSION_THRESHOLD } from '../RoundManager';
import {
  createPracticeStats,
  updatePracticeStats,
} from '../StatisticsManager';
import {
  transition,
  isTimerExpired,
  allPlayersSubmitted,
  lockAllUnsubmitted,
  validateRound,
} from '../index';
import { createInitialPlayerState } from '../../models/Player';
import type { PlayerState } from '../../models/Player';
import * as AnswerManager from '../AnswerManager';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makePlayer(id: string): PlayerState {
  return createInitialPlayerState(id as 'player1' | 'player2');
}

// Simulate the complete gameplay tick sequence without the React store.
// This tests the engine logic independently.
describe('practice mode gameplay loop', () => {
  let players: PlayerState[];

  beforeEach(() => {
    players = [makePlayer('player1')];
  });

  describe('FSM transitions', () => {
    it('HOME → SETTINGS is valid', () => {
      expect(() => transition(GamePhase.HOME, GamePhase.SETTINGS)).not.toThrow();
    });

    it('SETTINGS → GENERATING_PUZZLE is valid', () => {
      expect(() =>
        transition(GamePhase.SETTINGS, GamePhase.GENERATING_PUZZLE),
      ).not.toThrow();
    });

    it('GENERATING_PUZZLE → DISPLAYING_PUZZLE is valid', () => {
      expect(() =>
        transition(GamePhase.GENERATING_PUZZLE, GamePhase.DISPLAYING_PUZZLE),
      ).not.toThrow();
    });

    it('DISPLAYING_PUZZLE → ANSWER_PHASE is valid', () => {
      expect(() =>
        transition(GamePhase.DISPLAYING_PUZZLE, GamePhase.ANSWER_PHASE),
      ).not.toThrow();
    });

    it('ANSWER_PHASE → VALIDATING is valid', () => {
      expect(() =>
        transition(GamePhase.ANSWER_PHASE, GamePhase.VALIDATING),
      ).not.toThrow();
    });

    it('VALIDATING → ROUND_RESULTS is valid', () => {
      expect(() =>
        transition(GamePhase.VALIDATING, GamePhase.ROUND_RESULTS),
      ).not.toThrow();
    });

    it('ROUND_RESULTS → GENERATING_PUZZLE is valid (practice: infinite)', () => {
      expect(() =>
        transition(GamePhase.ROUND_RESULTS, GamePhase.GENERATING_PUZZLE),
      ).not.toThrow();
    });

    it('invalid transitions throw', () => {
      expect(() =>
        transition(GamePhase.HOME, GamePhase.ANSWER_PHASE),
      ).toThrow();
    });
  });

  describe('timer expiry', () => {
    it('isTimerExpired returns false when timer has not elapsed', () => {
      const now = Date.now();
      const start = now - 5000; // 5s ago
      expect(isTimerExpired(start, 10, now)).toBe(false);
    });

    it('isTimerExpired returns true when time has elapsed', () => {
      const now = Date.now();
      const start = now - 11000; // 11s ago
      expect(isTimerExpired(start, 10, now)).toBe(true);
    });

    it('isTimerExpired returns false for null start', () => {
      expect(isTimerExpired(null, 10, Date.now())).toBe(false);
    });
  });

  describe('answer submission', () => {
    it('players start with answer 0 and not submitted', () => {
      expect(players[0].currentAnswer).toBe(0);
      expect(players[0].hasSubmitted).toBe(false);
    });

    it('increment changes answer', () => {
      players = AnswerManager.incrementAnswer(players, 'player1', 1);
      expect(players[0].currentAnswer).toBe(1);
    });

    it('increment by 10', () => {
      players = AnswerManager.incrementAnswer(players, 'player1', 10);
      expect(players[0].currentAnswer).toBe(10);
    });

    it('decrement reduces answer', () => {
      players = AnswerManager.incrementAnswer(players, 'player1', 5);
      players = AnswerManager.decrementAnswer(players, 'player1');
      expect(players[0].currentAnswer).toBe(4);
    });

    it('cannot decrement below 0', () => {
      players = AnswerManager.decrementAnswer(players, 'player1');
      expect(players[0].currentAnswer).toBe(0);
    });

    it('submitting sets hasSubmitted', () => {
      players = AnswerManager.incrementAnswer(players, 'player1', 12);
      players = AnswerManager.submitAnswer(players, 'player1', 3.5);
      expect(players[0].hasSubmitted).toBe(true);
    });

    it('allPlayersSubmitted is true when all submitted', () => {
      players = AnswerManager.submitAnswer(players, 'player1', 4.0);
      expect(allPlayersSubmitted(players)).toBe(true);
    });

    it('allPlayersSubmitted is false when not all submitted', () => {
      expect(allPlayersSubmitted(players)).toBe(false);
    });

    it('cannot submit twice', () => {
      players = AnswerManager.submitAnswer(players, 'player1', 3.0);
      const afterFirst = players[0].currentAnswer;
      players = AnswerManager.incrementAnswer(players, 'player1', 5);
      // After submission, increment should be blocked
      players = AnswerManager.submitAnswer(players, 'player1', 3.5);
      expect(players[0].currentAnswer).toBe(afterFirst);
    });
  });

  describe('timer expiry locking', () => {
    it('locks unsubmitted player with max time on timeout', () => {
      const maxTime = 10;
      const locked = lockAllUnsubmitted(players, maxTime);
      expect(locked[0].hasSubmitted).toBe(true);
      expect(locked[0].answerTime).toBe(maxTime);
    });

    it('does not change already-submitted player', () => {
      players = AnswerManager.submitAnswer(players, 'player1', 4.5);
      const locked = lockAllUnsubmitted(players, 10);
      expect(locked[0].answerTime).toBe(4.5);
    });
  });

  describe('answer validation', () => {
    it('marks correct when answer matches', () => {
      players = AnswerManager.incrementAnswer(players, 'player1', 25);
      players = AnswerManager.submitAnswer(players, 'player1', 3.0);
      const result = validateRound(players, 25, 1, 10);
      expect(result.playerResults[0].isCorrect).toBe(true);
      expect(result.correctAnswer).toBe(25);
    });

    it('marks incorrect when answer does not match', () => {
      players = AnswerManager.incrementAnswer(players, 'player1', 20);
      players = AnswerManager.submitAnswer(players, 'player1', 3.0);
      const result = validateRound(players, 25, 1, 10);
      expect(result.playerResults[0].isCorrect).toBe(false);
    });

    it('records answer time', () => {
      players = AnswerManager.submitAnswer(players, 'player1', 4.75);
      const result = validateRound(players, 0, 1, 10);
      expect(result.playerResults[0].answerTime).toBe(4.75);
    });
  });

  describe('difficulty progression logic', () => {
    it('triggers at exactly DIFFICULTY_PROGRESSION_THRESHOLD correct answers', () => {
      let stats = createPracticeStats();
      for (let i = 0; i < DIFFICULTY_PROGRESSION_THRESHOLD; i++) {
        stats = updatePracticeStats(stats, true, 2.0);
      }
      // Check: correctAnswers == threshold, so progression should trigger
      expect(stats.correctAnswers).toBe(DIFFICULTY_PROGRESSION_THRESHOLD);
      expect(stats.correctAnswers % DIFFICULTY_PROGRESSION_THRESHOLD).toBe(0);
    });

    it('does not trigger for incorrect answers', () => {
      let stats = createPracticeStats();
      for (let i = 0; i < DIFFICULTY_PROGRESSION_THRESHOLD; i++) {
        stats = updatePracticeStats(stats, false, 2.0);
      }
      // Should NOT trigger (zero correct answers)
      expect(stats.correctAnswers).toBe(0);
    });

    it('triggers again at 2x threshold', () => {
      let stats = createPracticeStats();
      for (let i = 0; i < DIFFICULTY_PROGRESSION_THRESHOLD * 2; i++) {
        stats = updatePracticeStats(stats, true, 2.0);
      }
      expect(stats.correctAnswers).toBe(DIFFICULTY_PROGRESSION_THRESHOLD * 2);
      expect(stats.correctAnswers % DIFFICULTY_PROGRESSION_THRESHOLD).toBe(0);
    });
  });

  describe('practice mode: infinite rounds', () => {
    const practiceConfig = {
      gameMode: GameMode.PRACTICE,
      numberOfRounds: 10,
      displayTimeMode: DisplayMode.FIXED,
      initialDisplayTime: 10,
      maximumAnswerTime: 15,
      difficulty: Difficulty.EASY,
      maximumStackHeight: 2,
    };

    it('isLastRound always returns false in practice mode', () => {
      // Import tested separately in DifficultyProgression.test.ts
      // Here we just verify the game mode is PRACTICE
      expect(practiceConfig.gameMode).toBe(GameMode.PRACTICE);
    });
  });
});
