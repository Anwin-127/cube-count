import { describe, it, expect } from 'vitest';
import {
  getNextDifficultyLevel,
  DIFFICULTY_PROGRESSION_THRESHOLD,
  isLastRound,
} from '../RoundManager';
import { Difficulty } from '../../models/Difficulty';
import { GameMode } from '../../models/GameMode';
import type { GameConfig } from '../../models/GameConfig';
import { DisplayMode } from '../../models/DisplayMode';

const baseConfig: GameConfig = {
  gameMode: GameMode.PRACTICE,
  numberOfRounds: 10,
  displayTimeMode: DisplayMode.FIXED,
  initialDisplayTime: 10,
  maximumAnswerTime: 15,
  difficulty: Difficulty.EASY,
  maximumStackHeight: 2,
  enableEarlyProgression: false,
};

describe('getNextDifficultyLevel', () => {
  it('advances EASY → MEDIUM', () => {
    expect(getNextDifficultyLevel(Difficulty.EASY)).toBe(Difficulty.MEDIUM);
  });

  it('advances MEDIUM → HARD', () => {
    expect(getNextDifficultyLevel(Difficulty.MEDIUM)).toBe(Difficulty.HARD);
  });

  it('stays at HARD (already maximum)', () => {
    expect(getNextDifficultyLevel(Difficulty.HARD)).toBe(Difficulty.HARD);
  });
});

describe('DIFFICULTY_PROGRESSION_THRESHOLD', () => {
  it('is a positive integer', () => {
    expect(DIFFICULTY_PROGRESSION_THRESHOLD).toBeGreaterThan(0);
    expect(Number.isInteger(DIFFICULTY_PROGRESSION_THRESHOLD)).toBe(true);
  });

  it('equals 5 as specified', () => {
    expect(DIFFICULTY_PROGRESSION_THRESHOLD).toBe(5);
  });
});

describe('isLastRound (practice mode)', () => {
  it('returns false in PRACTICE mode regardless of round count', () => {
    const practiceConfig = { ...baseConfig, gameMode: GameMode.PRACTICE };
    expect(isLastRound(practiceConfig, 10)).toBe(false);
    expect(isLastRound(practiceConfig, 100)).toBe(false);
    expect(isLastRound(practiceConfig, 999)).toBe(false);
  });

  it('returns true in multiplayer when currentRound >= numberOfRounds', () => {
    const mpConfig = { ...baseConfig, gameMode: GameMode.LOCAL_MULTIPLAYER };
    expect(isLastRound(mpConfig, 10)).toBe(true);
    expect(isLastRound(mpConfig, 11)).toBe(true);
  });

  it('returns false in multiplayer when before the last round', () => {
    const mpConfig = { ...baseConfig, gameMode: GameMode.LOCAL_MULTIPLAYER };
    expect(isLastRound(mpConfig, 9)).toBe(false);
    expect(isLastRound(mpConfig, 1)).toBe(false);
  });
});
