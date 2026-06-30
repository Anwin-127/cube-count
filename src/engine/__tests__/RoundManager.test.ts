import { describe, it, expect } from 'vitest';
import {
  generatePuzzleForRound,
  createSessionHistory,
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
  maximumStackHeight: 3,
};

describe('RoundManager', () => {
  describe('generatePuzzleForRound', () => {
    it('generates a valid puzzle', () => {
      const history = createSessionHistory();
      const { puzzle } = generatePuzzleForRound(mockConfig, 1, history);
      expect(puzzle.totalCubes).toBeGreaterThan(0);
      expect(puzzle.heightMap.length).toBe(5); // BOARD_SIZE
    });

    it('returns an updated session history', () => {
      const history = createSessionHistory();
      const { history: updated } = generatePuzzleForRound(mockConfig, 1, history);
      expect(updated.exactHashes.length).toBe(1);
      expect(updated.signatures.length).toBe(1);
      expect(updated.recentRecipeNames.length).toBe(1);
    });

    it('generates deterministic puzzles with a fixed seed', () => {
      const config: GameConfig = { ...mockConfig, puzzleSeed: 42 };
      const history = createSessionHistory();
      const puzzle1 = generatePuzzleForRound(config, 1, history).puzzle;
      const puzzle2 = generatePuzzleForRound(config, 1, history).puzzle;
      expect(puzzle1.heightMap).toEqual(puzzle2.heightMap);
    });

    it('generates different puzzles for different random seeds', () => {
      // In local mode, each call generates a fresh random seed so puzzles differ
      const history = createSessionHistory();
      const puzzle1 = generatePuzzleForRound(mockConfig, 1, history).puzzle;
      const puzzle2 = generatePuzzleForRound(mockConfig, 1, history).puzzle;
      // With different random seeds, puzzles should almost always differ
      // (extremely unlikely to collide across two independent RNG seeds)
      expect(puzzle1.metadata.seed).not.toEqual(puzzle2.metadata.seed);
    });

    it('records the recipe name in metadata', () => {
      const history = createSessionHistory();
      const { puzzle } = generatePuzzleForRound(mockConfig, 1, history);
      expect(typeof puzzle.metadata.recipeName).toBe('string');
      expect(puzzle.metadata.recipeName.length).toBeGreaterThan(0);
    });

    it('records readability and occlusion scores in metadata', () => {
      const history = createSessionHistory();
      const { puzzle } = generatePuzzleForRound(mockConfig, 1, history);
      expect(puzzle.metadata.readabilityScore).toBeGreaterThanOrEqual(0);
      expect(puzzle.metadata.readabilityScore).toBeLessThanOrEqual(1);
      expect(puzzle.metadata.occlusionScore).toBeGreaterThanOrEqual(0);
      expect(puzzle.metadata.occlusionScore).toBeLessThanOrEqual(1);
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
