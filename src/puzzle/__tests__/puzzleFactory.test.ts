import { describe, it, expect } from 'vitest';
import { createPuzzle } from '../puzzleFactory';
import { isConnected } from '../connectivityChecker';
import { Difficulty } from '../../models/Difficulty';
import { BOARD_SIZE } from '../../config/constants';

describe('createPuzzle', () => {
  const defaultConfig = {
    seed: 42,
    difficulty: Difficulty.MEDIUM,
    maxHeight: 3,
  };

  describe('determinism', () => {
    it('produces the same puzzle for the same seed', () => {
      const puzzle1 = createPuzzle(defaultConfig);
      const puzzle2 = createPuzzle(defaultConfig);

      expect(puzzle1.heightMap).toEqual(puzzle2.heightMap);
      expect(puzzle1.totalCubes).toBe(puzzle2.totalCubes);
      expect(puzzle1.maximumHeight).toBe(puzzle2.maximumHeight);
      expect(puzzle1.metadata.shapeFamily).toBe(puzzle2.metadata.shapeFamily);
    });

    it('produces different puzzles for different seeds', () => {
      const puzzle1 = createPuzzle({ ...defaultConfig, seed: 42 });
      const puzzle2 = createPuzzle({ ...defaultConfig, seed: 43 });

      expect(puzzle1.heightMap).not.toEqual(puzzle2.heightMap);
    });
  });

  describe('puzzle structure', () => {
    it('creates a 5×5 height map', () => {
      const puzzle = createPuzzle(defaultConfig);

      expect(puzzle.heightMap.length).toBe(BOARD_SIZE);
      for (const row of puzzle.heightMap) {
        expect(row.length).toBe(BOARD_SIZE);
      }
    });

    it('sets the board size correctly', () => {
      const puzzle = createPuzzle(defaultConfig);
      expect(puzzle.boardSize).toBe(BOARD_SIZE);
    });

    it('calculates totalCubes correctly', () => {
      const puzzle = createPuzzle(defaultConfig);

      let expectedTotal = 0;
      for (const row of puzzle.heightMap) {
        for (const h of row) {
          expectedTotal += h;
        }
      }

      expect(puzzle.totalCubes).toBe(expectedTotal);
      expect(puzzle.totalCubes).toBeGreaterThan(0);
    });

    it('finds the maximum height correctly', () => {
      const puzzle = createPuzzle(defaultConfig);

      let expectedMax = 0;
      for (const row of puzzle.heightMap) {
        for (const h of row) {
          if (h > expectedMax) expectedMax = h;
        }
      }

      expect(puzzle.maximumHeight).toBe(expectedMax);
    });

    it('respects the maxHeight constraint', () => {
      const puzzle = createPuzzle(defaultConfig);

      for (const row of puzzle.heightMap) {
        for (const h of row) {
          expect(h).toBeLessThanOrEqual(defaultConfig.maxHeight);
          expect(h).toBeGreaterThanOrEqual(0);
        }
      }
    });
  });

  describe('shape-based generation', () => {
    it('produces a connected puzzle', () => {
      const puzzle = createPuzzle(defaultConfig);
      const mask = puzzle.heightMap.map((row) => row.map((h) => h > 0));
      expect(isConnected(mask)).toBe(true);
    });

    it('has at least 5 active cells', () => {
      const puzzle = createPuzzle(defaultConfig);
      let activeCells = 0;
      for (const row of puzzle.heightMap) {
        for (const h of row) {
          if (h > 0) activeCells++;
        }
      }
      expect(activeCells).toBeGreaterThanOrEqual(5);
    });

    it('produces connected puzzles across many seeds', () => {
      for (let seed = 1; seed <= 50; seed++) {
        const puzzle = createPuzzle({ ...defaultConfig, seed });
        const mask = puzzle.heightMap.map((row) => row.map((h) => h > 0));
        expect(isConnected(mask)).toBe(true);
      }
    });
  });

  describe('metadata', () => {
    it('records the original seed in metadata', () => {
      const puzzle = createPuzzle(defaultConfig);
      expect(puzzle.metadata.seed).toBe(42);
    });

    it('records the difficulty in metadata', () => {
      const puzzle = createPuzzle(defaultConfig);
      expect(puzzle.metadata.difficulty).toBe(Difficulty.MEDIUM);
    });

    it('includes a shape family', () => {
      const puzzle = createPuzzle(defaultConfig);
      expect(typeof puzzle.metadata.shapeFamily).toBe('string');
      expect(puzzle.metadata.shapeFamily.length).toBeGreaterThan(0);
    });

    it('includes a normalized complexity score', () => {
      const puzzle = createPuzzle(defaultConfig);
      expect(puzzle.metadata.complexityScore).toBeGreaterThanOrEqual(0);
      expect(puzzle.metadata.complexityScore).toBeLessThanOrEqual(1);
    });

    it('includes a hidden cube estimate', () => {
      const puzzle = createPuzzle(defaultConfig);
      expect(puzzle.metadata.hiddenCubeEstimate).toBeGreaterThanOrEqual(0);
      expect(puzzle.metadata.hiddenCubeEstimate).toBeLessThanOrEqual(
        puzzle.totalCubes,
      );
    });

    it('records generation attempts', () => {
      const puzzle = createPuzzle(defaultConfig);
      expect(puzzle.metadata.generationAttempts).toBeGreaterThanOrEqual(1);
    });

    it('includes a generation timestamp', () => {
      const before = Date.now();
      const puzzle = createPuzzle(defaultConfig);
      const after = Date.now();

      expect(puzzle.metadata.generationTimestamp).toBeGreaterThanOrEqual(
        before,
      );
      expect(puzzle.metadata.generationTimestamp).toBeLessThanOrEqual(after);
    });
  });

  describe('immutability', () => {
    it('returns a frozen puzzle object', () => {
      const puzzle = createPuzzle(defaultConfig);
      expect(Object.isFrozen(puzzle)).toBe(true);
    });

    it('returns frozen height map rows', () => {
      const puzzle = createPuzzle(defaultConfig);
      for (const row of puzzle.heightMap) {
        expect(Object.isFrozen(row)).toBe(true);
      }
    });

    it('returns frozen metadata', () => {
      const puzzle = createPuzzle(defaultConfig);
      expect(Object.isFrozen(puzzle.metadata)).toBe(true);
    });
  });

  describe('difficulty variations', () => {
    it('generates puzzles with maxHeight 2 for EASY', () => {
      const puzzle = createPuzzle({
        seed: 42,
        difficulty: Difficulty.EASY,
        maxHeight: 2,
      });

      for (const row of puzzle.heightMap) {
        for (const h of row) {
          expect(h).toBeLessThanOrEqual(2);
        }
      }
    });

    it('generates puzzles with maxHeight 4 for HARD', () => {
      const puzzle = createPuzzle({
        seed: 42,
        difficulty: Difficulty.HARD,
        maxHeight: 4,
      });

      for (const row of puzzle.heightMap) {
        for (const h of row) {
          expect(h).toBeLessThanOrEqual(4);
        }
      }
    });
  });
});
