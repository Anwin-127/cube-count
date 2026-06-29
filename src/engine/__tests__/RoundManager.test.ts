import { describe, it, expect } from 'vitest';
import {
  generatePuzzleForRound,
  getDisplayTimeForCurrentRound,
  isLastRound,
  getPlayerCount,
} from '../RoundManager';
import { DEFAULT_GAME_CONFIG } from '../../config/gameConfig';
import { GameMode } from '../../models/GameMode';
import { DisplayMode } from '../../models/DisplayMode';
import type { GameConfig } from '../../models/GameConfig';

const multiplayerConfig: GameConfig = {
  ...DEFAULT_GAME_CONFIG,
  gameMode: GameMode.LOCAL_MULTIPLAYER,
  numberOfRounds: 5,
};

const practiceConfig: GameConfig = {
  ...DEFAULT_GAME_CONFIG,
  gameMode: GameMode.PRACTICE,
  numberOfRounds: 5,
};

const mockConfig: GameConfig = {
  ...DEFAULT_GAME_CONFIG,
  maximumStackHeight: 5,
};

describe('RoundManager', () => {
  describe('generatePuzzleForRound', () => {
    it('generates a valid puzzle', () => {
      const puzzle = generatePuzzleForRound(mockConfig, 1, []).puzzle;
      expect(puzzle.totalCubes).toBeGreaterThan(0);
      expect(puzzle.heightMap.length).toBe(mockConfig.maximumStackHeight);
    });

    it('generates deterministic puzzles with a fixed seed', () => {
      const config: GameConfig = { ...mockConfig, puzzleSeed: 42 };
      const puzzle1 = generatePuzzleForRound(config, 1, []).puzzle;
      const puzzle2 = generatePuzzleForRound(config, 1, []).puzzle;
      expect(puzzle1.heightMap).toEqual(puzzle2.heightMap);
    });

    it('generates different puzzles for different rounds with a fixed seed', () => {
      const config: GameConfig = { ...mockConfig, puzzleSeed: 42 };
      const puzzle1 = generatePuzzleForRound(config, 1, []).puzzle;
      const puzzle2 = generatePuzzleForRound(config, 2, []).puzzle;
      expect(puzzle1.heightMap).not.toEqual(puzzle2.heightMap);
    });
  });

  describe('getDisplayTimeForCurrentRound', () => {
    it('returns fixed time in FIXED mode', () => {
      const config: GameConfig = {
        ...multiplayerConfig,
        displayTimeMode: DisplayMode.FIXED,
        initialDisplayTime: 10,
      };
      expect(getDisplayTimeForCurrentRound(config, 1)).toBe(10);
      expect(getDisplayTimeForCurrentRound(config, 15)).toBe(10);
    });

    it('returns decreasing time in PROGRESSIVE mode', () => {
      const config: GameConfig = {
        ...multiplayerConfig,
        displayTimeMode: DisplayMode.PROGRESSIVE,
        initialDisplayTime: 10,
      };
      const round1 = getDisplayTimeForCurrentRound(config, 1);
      const round10 = getDisplayTimeForCurrentRound(config, 10);
      expect(round10).toBeLessThanOrEqual(round1);
    });
  });

  describe('isLastRound', () => {
    it('returns true when current round equals total rounds', () => {
      expect(isLastRound(multiplayerConfig, 5)).toBe(true);
    });

    it('returns true when current round exceeds total rounds', () => {
      expect(isLastRound(multiplayerConfig, 6)).toBe(true);
    });

    it('returns false before the last round', () => {
      expect(isLastRound(multiplayerConfig, 4)).toBe(false);
    });

    it('always returns false in practice mode', () => {
      expect(isLastRound(practiceConfig, 1)).toBe(false);
      expect(isLastRound(practiceConfig, 100)).toBe(false);
    });
  });

  describe('getPlayerCount', () => {
    it('returns 2 for multiplayer', () => {
      expect(getPlayerCount(multiplayerConfig)).toBe(2);
    });

    it('returns 1 for practice', () => {
      expect(getPlayerCount(practiceConfig)).toBe(1);
    });
  });
});
