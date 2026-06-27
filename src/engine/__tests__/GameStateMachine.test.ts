import { describe, it, expect } from 'vitest';
import { canTransition, transition, getValidTransitions } from '../GameStateMachine';
import { GamePhase } from '../../models/GamePhase';

describe('GameStateMachine', () => {
  describe('canTransition', () => {
    it('allows HOME → SETTINGS', () => {
      expect(canTransition(GamePhase.HOME, GamePhase.SETTINGS)).toBe(true);
    });

    it('allows SETTINGS → HOME', () => {
      expect(canTransition(GamePhase.SETTINGS, GamePhase.HOME)).toBe(true);
    });

    it('allows SETTINGS → GENERATING_PUZZLE', () => {
      expect(canTransition(GamePhase.SETTINGS, GamePhase.GENERATING_PUZZLE)).toBe(true);
    });

    it('allows GENERATING_PUZZLE → DISPLAYING_PUZZLE', () => {
      expect(canTransition(GamePhase.GENERATING_PUZZLE, GamePhase.DISPLAYING_PUZZLE)).toBe(true);
    });

    it('allows DISPLAYING_PUZZLE → ANSWER_PHASE', () => {
      expect(canTransition(GamePhase.DISPLAYING_PUZZLE, GamePhase.ANSWER_PHASE)).toBe(true);
    });

    it('allows ANSWER_PHASE → VALIDATING', () => {
      expect(canTransition(GamePhase.ANSWER_PHASE, GamePhase.VALIDATING)).toBe(true);
    });

    it('allows VALIDATING → ROUND_RESULTS', () => {
      expect(canTransition(GamePhase.VALIDATING, GamePhase.ROUND_RESULTS)).toBe(true);
    });

    it('allows ROUND_RESULTS → GENERATING_PUZZLE', () => {
      expect(canTransition(GamePhase.ROUND_RESULTS, GamePhase.GENERATING_PUZZLE)).toBe(true);
    });

    it('allows ROUND_RESULTS → FINAL_RESULTS', () => {
      expect(canTransition(GamePhase.ROUND_RESULTS, GamePhase.FINAL_RESULTS)).toBe(true);
    });

    it('allows FINAL_RESULTS → HOME', () => {
      expect(canTransition(GamePhase.FINAL_RESULTS, GamePhase.HOME)).toBe(true);
    });

    it('allows FINAL_RESULTS → SETTINGS', () => {
      expect(canTransition(GamePhase.FINAL_RESULTS, GamePhase.SETTINGS)).toBe(true);
    });

    it('rejects HOME → ANSWER_PHASE', () => {
      expect(canTransition(GamePhase.HOME, GamePhase.ANSWER_PHASE)).toBe(false);
    });

    it('rejects ANSWER_PHASE → HOME', () => {
      expect(canTransition(GamePhase.ANSWER_PHASE, GamePhase.HOME)).toBe(false);
    });

    it('rejects DISPLAYING_PUZZLE → ROUND_RESULTS', () => {
      expect(canTransition(GamePhase.DISPLAYING_PUZZLE, GamePhase.ROUND_RESULTS)).toBe(false);
    });

    it('rejects GENERATING_PUZZLE → ANSWER_PHASE (skipping display)', () => {
      expect(canTransition(GamePhase.GENERATING_PUZZLE, GamePhase.ANSWER_PHASE)).toBe(false);
    });

    it('rejects self-transitions', () => {
      expect(canTransition(GamePhase.HOME, GamePhase.HOME)).toBe(false);
      expect(canTransition(GamePhase.ANSWER_PHASE, GamePhase.ANSWER_PHASE)).toBe(false);
    });
  });

  describe('transition', () => {
    it('returns the target phase on valid transition', () => {
      expect(transition(GamePhase.HOME, GamePhase.SETTINGS)).toBe(GamePhase.SETTINGS);
    });

    it('throws on invalid transition', () => {
      expect(() => transition(GamePhase.HOME, GamePhase.ANSWER_PHASE)).toThrow(
        'Invalid state transition',
      );
    });

    it('includes valid targets in the error message', () => {
      expect(() => transition(GamePhase.HOME, GamePhase.FINAL_RESULTS)).toThrow(
        'SETTINGS',
      );
    });
  });

  describe('getValidTransitions', () => {
    it('returns all valid targets for HOME', () => {
      expect(getValidTransitions(GamePhase.HOME)).toEqual([GamePhase.SETTINGS]);
    });

    it('returns multiple targets for ROUND_RESULTS', () => {
      const targets = getValidTransitions(GamePhase.ROUND_RESULTS);
      expect(targets).toContain(GamePhase.GENERATING_PUZZLE);
      expect(targets).toContain(GamePhase.FINAL_RESULTS);
    });

    it('returns multiple targets for FINAL_RESULTS', () => {
      const targets = getValidTransitions(GamePhase.FINAL_RESULTS);
      expect(targets).toContain(GamePhase.HOME);
      expect(targets).toContain(GamePhase.SETTINGS);
    });
  });

  describe('full game flow', () => {
    it('supports a complete multiplayer match flow', () => {
      let phase: GamePhase = GamePhase.HOME;
      phase = transition(phase, GamePhase.SETTINGS);
      phase = transition(phase, GamePhase.GENERATING_PUZZLE);
      phase = transition(phase, GamePhase.DISPLAYING_PUZZLE);
      phase = transition(phase, GamePhase.ANSWER_PHASE);
      phase = transition(phase, GamePhase.VALIDATING);
      phase = transition(phase, GamePhase.ROUND_RESULTS);
      phase = transition(phase, GamePhase.FINAL_RESULTS);
      phase = transition(phase, GamePhase.HOME);
      expect(phase).toBe(GamePhase.HOME);
    });

    it('supports round looping', () => {
      let phase: GamePhase = GamePhase.ROUND_RESULTS;
      phase = transition(phase, GamePhase.GENERATING_PUZZLE);
      phase = transition(phase, GamePhase.DISPLAYING_PUZZLE);
      phase = transition(phase, GamePhase.ANSWER_PHASE);
      phase = transition(phase, GamePhase.VALIDATING);
      phase = transition(phase, GamePhase.ROUND_RESULTS);
      expect(phase).toBe(GamePhase.ROUND_RESULTS);
    });
  });
});
