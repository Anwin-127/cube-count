import { describe, it, expect } from 'vitest';
import {
  incrementAnswer,
  decrementAnswer,
  submitAnswer,
  lockAllUnsubmitted,
  allPlayersSubmitted,
  validateRound,
} from '../AnswerManager';
import { createInitialPlayerState } from '../../models/Player';
import type { PlayerState } from '../../models/Player';

function twoPlayers(): PlayerState[] {
  return [createInitialPlayerState('player1'), createInitialPlayerState('player2')];
}

describe('AnswerManager', () => {
  describe('incrementAnswer', () => {
    it('increases a player answer by the given amount', () => {
      const players = twoPlayers();
      const result = incrementAnswer(players, 'player1', 5);
      expect(result.find((p) => p.id === 'player1')!.currentAnswer).toBe(5);
      expect(result.find((p) => p.id === 'player2')!.currentAnswer).toBe(0);
    });

    it('does not modify a submitted player', () => {
      const players = twoPlayers();
      players[0] = { ...players[0], hasSubmitted: true };
      const result = incrementAnswer(players, 'player1', 10);
      expect(result.find((p) => p.id === 'player1')!.currentAnswer).toBe(0);
    });

    it('defaults to increment by 1', () => {
      const players = twoPlayers();
      const result = incrementAnswer(players, 'player1');
      expect(result.find((p) => p.id === 'player1')!.currentAnswer).toBe(1);
    });
  });

  describe('decrementAnswer', () => {
    it('decreases a player answer by 1', () => {
      let players = twoPlayers();
      players = incrementAnswer(players, 'player1', 5);
      const result = decrementAnswer(players, 'player1');
      expect(result.find((p) => p.id === 'player1')!.currentAnswer).toBe(4);
    });

    it('clamps to 0', () => {
      const players = twoPlayers();
      const result = decrementAnswer(players, 'player1');
      expect(result.find((p) => p.id === 'player1')!.currentAnswer).toBe(0);
    });

    it('does not modify a submitted player', () => {
      let players = twoPlayers();
      players = incrementAnswer(players, 'player1', 5);
      players[0] = { ...players[0], hasSubmitted: true };
      const result = decrementAnswer(players, 'player1');
      expect(result.find((p) => p.id === 'player1')!.currentAnswer).toBe(5);
    });
  });

  describe('submitAnswer', () => {
    it('marks the player as submitted with the elapsed time', () => {
      const players = twoPlayers();
      const result = submitAnswer(players, 'player1', 3.5);
      const p1 = result.find((p) => p.id === 'player1')!;
      expect(p1.hasSubmitted).toBe(true);
      expect(p1.answerTime).toBe(3.5);
    });

    it('does not re-submit an already submitted player', () => {
      let players = twoPlayers();
      players = submitAnswer(players, 'player1', 3.0);
      const result = submitAnswer(players, 'player1', 5.0);
      expect(result.find((p) => p.id === 'player1')!.answerTime).toBe(3.0);
    });
  });

  describe('lockAllUnsubmitted', () => {
    it('locks unsubmitted players with the maximum answer time', () => {
      let players = twoPlayers();
      players = submitAnswer(players, 'player1', 3.0);
      const result = lockAllUnsubmitted(players, 10);
      expect(result.find((p) => p.id === 'player1')!.answerTime).toBe(3.0);
      expect(result.find((p) => p.id === 'player2')!.hasSubmitted).toBe(true);
      expect(result.find((p) => p.id === 'player2')!.answerTime).toBe(10);
    });

    it('does not affect already submitted players', () => {
      let players = twoPlayers();
      players = submitAnswer(players, 'player1', 2.0);
      players = submitAnswer(players, 'player2', 4.0);
      const result = lockAllUnsubmitted(players, 10);
      expect(result.find((p) => p.id === 'player1')!.answerTime).toBe(2.0);
      expect(result.find((p) => p.id === 'player2')!.answerTime).toBe(4.0);
    });
  });

  describe('allPlayersSubmitted', () => {
    it('returns false when no players submitted', () => {
      expect(allPlayersSubmitted(twoPlayers())).toBe(false);
    });

    it('returns false when only one player submitted', () => {
      let players = twoPlayers();
      players = submitAnswer(players, 'player1', 3.0);
      expect(allPlayersSubmitted(players)).toBe(false);
    });

    it('returns true when all players submitted', () => {
      let players = twoPlayers();
      players = submitAnswer(players, 'player1', 3.0);
      players = submitAnswer(players, 'player2', 4.0);
      expect(allPlayersSubmitted(players)).toBe(true);
    });

    it('returns false for empty player list', () => {
      expect(allPlayersSubmitted([])).toBe(false);
    });
  });

  describe('validateRound', () => {
    it('marks correct and incorrect answers', () => {
      let players = twoPlayers();
      players = incrementAnswer(players, 'player1', 15);
      players = incrementAnswer(players, 'player2', 10);
      players = submitAnswer(players, 'player1', 3.0);
      players = submitAnswer(players, 'player2', 4.0);

      const result = validateRound(players, 15, 1, 10);

      expect(result.correctAnswer).toBe(15);
      expect(result.roundNumber).toBe(1);
      expect(result.playerResults.find((r) => r.playerId === 'player1')!.isCorrect).toBe(true);
      expect(result.playerResults.find((r) => r.playerId === 'player2')!.isCorrect).toBe(false);
    });

    it('assigns the winner as the correct player with fastest time', () => {
      let players = twoPlayers();
      players = incrementAnswer(players, 'player1', 15);
      players = incrementAnswer(players, 'player2', 15);
      players = submitAnswer(players, 'player1', 5.0);
      players = submitAnswer(players, 'player2', 3.0);

      const result = validateRound(players, 15, 1, 10);
      expect(result.winnerId).toBe('player2');
    });

    it('declares no winner when no one is correct', () => {
      let players = twoPlayers();
      players = incrementAnswer(players, 'player1', 10);
      players = incrementAnswer(players, 'player2', 12);
      players = submitAnswer(players, 'player1', 3.0);
      players = submitAnswer(players, 'player2', 4.0);

      const result = validateRound(players, 15, 1, 10);
      expect(result.winnerId).toBeNull();
    });

    it('declares no winner when both correct with identical time', () => {
      let players = twoPlayers();
      players = incrementAnswer(players, 'player1', 15);
      players = incrementAnswer(players, 'player2', 15);
      players = submitAnswer(players, 'player1', 4.0);
      players = submitAnswer(players, 'player2', 4.0);

      const result = validateRound(players, 15, 1, 10);
      expect(result.winnerId).toBeNull();
    });

    it('records max answer time for incorrect players', () => {
      let players = twoPlayers();
      players = incrementAnswer(players, 'player1', 15);
      players = incrementAnswer(players, 'player2', 10);
      players = submitAnswer(players, 'player1', 3.0);
      players = submitAnswer(players, 'player2', 4.0);

      const result = validateRound(players, 15, 1, 10);
      expect(result.playerResults.find((r) => r.playerId === 'player1')!.recordedTime).toBe(3.0);
      expect(result.playerResults.find((r) => r.playerId === 'player2')!.recordedTime).toBe(10);
    });

    it('handles single player (practice mode)', () => {
      let players = [createInitialPlayerState('player1')];
      players = incrementAnswer(players, 'player1', 20);
      players = submitAnswer(players, 'player1', 5.0);

      const result = validateRound(players, 20, 1, 10);
      expect(result.playerResults.length).toBe(1);
      expect(result.playerResults[0].isCorrect).toBe(true);
      expect(result.winnerId).toBe('player1');
    });
  });
});
