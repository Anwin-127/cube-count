import { describe, it, expect, beforeEach } from 'vitest';

import { GameMode } from '../../models/GameMode';
import { Difficulty } from '../../models/Difficulty';
import { DisplayMode } from '../../models/DisplayMode';
import {
  createMatchStats,
  updateMatchStats,
  determineMatchWinner,
} from '../StatisticsManager';
import {
  isLastRound,
} from '../RoundManager';
import {
  validateRound,
  submitAnswer,
  incrementAnswer,
} from '../AnswerManager';
import { createInitialPlayerState } from '../../models/Player';
import type { PlayerState } from '../../models/Player';

describe('multiplayer match logic', () => {
  let players: PlayerState[];

  beforeEach(() => {
    players = [
      createInitialPlayerState('player1'),
      createInitialPlayerState('player2'),
    ];
  });

  describe('answer submission and validation', () => {
    it('round ends and calculates correct winner based on speed', () => {
      // Both correct, P2 faster
      players = incrementAnswer(players, 'player1', 10);
      players = incrementAnswer(players, 'player2', 10);
      
      players = submitAnswer(players, 'player1', 5.0);
      players = submitAnswer(players, 'player2', 3.0);
      
      const result = validateRound(players, 10, 1, 15);
      
      expect(result.playerResults[0].isCorrect).toBe(true);
      expect(result.playerResults[1].isCorrect).toBe(true);
      expect(result.winnerId).toBe('player2');
    });

    it('correct player beats incorrect player regardless of time', () => {
      // P1 incorrect but fast, P2 correct but slow
      players = incrementAnswer(players, 'player1', 5);
      players = incrementAnswer(players, 'player2', 10);
      
      players = submitAnswer(players, 'player1', 2.0);
      players = submitAnswer(players, 'player2', 12.0);
      
      const result = validateRound(players, 10, 1, 15);
      
      expect(result.winnerId).toBe('player2');
    });

    it('draw if both incorrect', () => {
      players = incrementAnswer(players, 'player1', 5);
      players = incrementAnswer(players, 'player2', 12);
      
      players = submitAnswer(players, 'player1', 2.0);
      players = submitAnswer(players, 'player2', 3.0);
      
      const result = validateRound(players, 10, 1, 15);
      
      expect(result.winnerId).toBe(null);
    });

    it('draw if exactly same time', () => {
      players = incrementAnswer(players, 'player1', 10);
      players = incrementAnswer(players, 'player2', 10);
      
      players = submitAnswer(players, 'player1', 5.0);
      players = submitAnswer(players, 'player2', 5.0);
      
      const result = validateRound(players, 10, 1, 15);
      
      expect(result.winnerId).toBe(null);
    });
  });

  describe('match statistics and sudden death', () => {
    const config = {
      gameMode: GameMode.LOCAL_MULTIPLAYER,
      numberOfRounds: 3,
      displayTimeMode: DisplayMode.FIXED,
      initialDisplayTime: 10,
      maximumAnswerTime: 15,
      difficulty: Difficulty.EASY,
      maximumStackHeight: 2,
    };

    it('determines winner correctly at end of match', () => {
      let stats = createMatchStats(['player1', 'player2'], 3);
      
      // Round 1: P1 wins
      stats = updateMatchStats(stats, {
        roundNumber: 1, correctAnswer: 5, winnerId: 'player1',
        playerResults: [
          { playerId: 'player1', answer: 5, isCorrect: true, answerTime: 3.0, recordedTime: 3.0 },
          { playerId: 'player2', answer: 4, isCorrect: false, answerTime: 5.0, recordedTime: 15.0 },
        ]
      });

      // Round 2: P1 wins
      stats = updateMatchStats(stats, {
        roundNumber: 2, correctAnswer: 5, winnerId: 'player1',
        playerResults: [
          { playerId: 'player1', answer: 5, isCorrect: true, answerTime: 2.0, recordedTime: 2.0 },
          { playerId: 'player2', answer: 4, isCorrect: false, answerTime: 5.0, recordedTime: 15.0 },
        ]
      });

      // Round 3: P2 wins
      stats = updateMatchStats(stats, {
        roundNumber: 3, correctAnswer: 5, winnerId: 'player2',
        playerResults: [
          { playerId: 'player1', answer: 4, isCorrect: false, answerTime: 3.0, recordedTime: 15.0 },
          { playerId: 'player2', answer: 5, isCorrect: true, answerTime: 4.0, recordedTime: 4.0 },
        ]
      });

      expect(isLastRound(config, 3, stats)).toBe(true);
      expect(determineMatchWinner(stats)).toBe('player1'); // P1 has 2 correct answers vs P2's 1
      
      const p1Stats = stats.playerStatistics.find(p => p.playerId === 'player1')!;
      expect(p1Stats.roundWins).toBe(2);
      expect(p1Stats.averageResponseTime).toBe(6.67); // (3+2+15)/3 = 6.67
    });

    it('triggers sudden death on absolute tie', () => {
      let stats = createMatchStats(['player1', 'player2'], 2);
      
      // Both completely tie the whole match
      stats = updateMatchStats(stats, {
        roundNumber: 1, correctAnswer: 5, winnerId: null,
        playerResults: [
          { playerId: 'player1', answer: 5, isCorrect: true, answerTime: 3.0, recordedTime: 3.0 },
          { playerId: 'player2', answer: 5, isCorrect: true, answerTime: 3.0, recordedTime: 3.0 },
        ]
      });

      stats = updateMatchStats(stats, {
        roundNumber: 2, correctAnswer: 5, winnerId: null,
        playerResults: [
          { playerId: 'player1', answer: 5, isCorrect: true, answerTime: 4.0, recordedTime: 4.0 },
          { playerId: 'player2', answer: 5, isCorrect: true, answerTime: 4.0, recordedTime: 4.0 },
        ]
      });

      // Tie check
      expect(determineMatchWinner(stats)).toBe('DRAW');
      // Should NOT be the last round because it's a draw and we entered sudden death
      expect(isLastRound({ ...config, numberOfRounds: 2 }, 2, stats)).toBe(false);
    });

    it('resolves sudden death when tie is broken', () => {
      let stats = createMatchStats(['player1', 'player2'], 2);
      
      // Initial 2 rounds are a tie (both correct, exact same time)
      stats = updateMatchStats(stats, {
        roundNumber: 1, correctAnswer: 5, winnerId: null,
        playerResults: [
          { playerId: 'player1', answer: 5, isCorrect: true, answerTime: 3.0, recordedTime: 3.0 },
          { playerId: 'player2', answer: 5, isCorrect: true, answerTime: 3.0, recordedTime: 3.0 },
        ]
      });
      stats = updateMatchStats(stats, {
        roundNumber: 2, correctAnswer: 5, winnerId: null,
        playerResults: [
          { playerId: 'player1', answer: 5, isCorrect: true, answerTime: 4.0, recordedTime: 4.0 },
          { playerId: 'player2', answer: 5, isCorrect: true, answerTime: 4.0, recordedTime: 4.0 },
        ]
      });

      // Round 3 (Sudden Death): P1 wins by speed
      stats = updateMatchStats(stats, {
        roundNumber: 3, correctAnswer: 5, winnerId: 'player1',
        playerResults: [
          { playerId: 'player1', answer: 5, isCorrect: true, answerTime: 2.0, recordedTime: 2.0 },
          { playerId: 'player2', answer: 5, isCorrect: true, answerTime: 4.0, recordedTime: 4.0 },
        ]
      });

      // Tie is broken. determineMatchWinner should return player1
      expect(determineMatchWinner(stats)).toBe('player1');
      // Now it IS the last round (match over)
      expect(isLastRound({ ...config, numberOfRounds: 2 }, 3, stats)).toBe(true);
    });
  });
});
