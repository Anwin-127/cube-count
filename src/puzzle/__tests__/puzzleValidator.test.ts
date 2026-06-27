import { describe, it, expect } from 'vitest';
import { validateHeightMap } from '../puzzleValidator';

describe('validateHeightMap', () => {
  describe('valid puzzles', () => {
    it('accepts a valid 5×5 height map', () => {
      const heightMap = [
        [0, 1, 2, 1, 0],
        [0, 3, 3, 3, 0],
        [0, 2, 3, 2, 0],
        [0, 3, 3, 3, 0],
        [0, 1, 2, 1, 0],
      ];

      const result = validateHeightMap(heightMap, 5, 3);
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('accepts a connected L-shaped puzzle', () => {
      const heightMap = [
        [1, 0, 0],
        [1, 0, 0],
        [1, 1, 1],
      ];

      const result = validateHeightMap(heightMap, 3, 3);
      expect(result.isValid).toBe(true);
    });
  });

  describe('dimension errors', () => {
    it('rejects a grid with wrong row count', () => {
      const heightMap = [
        [1, 1, 1],
        [1, 1, 1],
      ];

      const result = validateHeightMap(heightMap, 3, 3);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Expected 3 rows, got 2');
    });

    it('rejects a row with wrong column count', () => {
      const heightMap = [
        [1, 1, 1],
        [1, 1],
        [1, 1, 1],
      ];

      const result = validateHeightMap(heightMap, 3, 3);
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.includes('expected 3 columns'))).toBe(
        true,
      );
    });
  });

  describe('height errors', () => {
    it('rejects negative heights', () => {
      const heightMap = [
        [1, -1, 1, 1, 1],
        [1, 1, 1, 1, 1],
        [1, 1, 1, 1, 1],
        [1, 1, 1, 1, 1],
        [1, 1, 1, 1, 1],
      ];

      const result = validateHeightMap(heightMap, 5, 3);
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.includes('height must be >= 0'))).toBe(
        true,
      );
    });

    it('rejects heights exceeding maxHeight', () => {
      const heightMap = [
        [1, 1, 1, 1, 1],
        [1, 5, 1, 1, 1],
        [1, 1, 1, 1, 1],
        [1, 1, 1, 1, 1],
        [1, 1, 1, 1, 1],
      ];

      const result = validateHeightMap(heightMap, 5, 3);
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.includes('exceeds maximum'))).toBe(
        true,
      );
    });

    it('rejects non-integer heights', () => {
      const heightMap = [
        [1, 1.5, 1, 1, 1],
        [1, 1, 1, 1, 1],
        [1, 1, 1, 1, 1],
        [1, 1, 1, 1, 1],
        [1, 1, 1, 1, 1],
      ];

      const result = validateHeightMap(heightMap, 5, 3);
      expect(result.isValid).toBe(false);
      expect(
        result.errors.some((e) => e.includes('must be an integer')),
      ).toBe(true);
    });
  });

  describe('total cube errors', () => {
    it('rejects an all-zero grid', () => {
      const heightMap = [
        [0, 0, 0],
        [0, 0, 0],
        [0, 0, 0],
      ];

      const result = validateHeightMap(heightMap, 3, 3);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'Puzzle must contain at least one cube',
      );
    });
  });

  describe('minimum active cells', () => {
    it('rejects a puzzle with too few active cells', () => {
      const heightMap = [
        [0, 0, 0, 0, 0],
        [0, 1, 1, 0, 0],
        [0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0],
      ];

      const result = validateHeightMap(heightMap, 5, 3);
      expect(result.isValid).toBe(false);
      expect(
        result.errors.some((e) => e.includes('at least')),
      ).toBe(true);
    });
  });

  describe('connectivity', () => {
    it('rejects a disconnected puzzle', () => {
      const heightMap = [
        [1, 1, 0, 0, 0],
        [1, 0, 0, 0, 0],
        [0, 0, 0, 0, 0],
        [0, 0, 0, 0, 1],
        [0, 0, 0, 1, 1],
      ];

      const result = validateHeightMap(heightMap, 5, 3);
      expect(result.isValid).toBe(false);
      expect(
        result.errors.some((e) => e.includes('connected')),
      ).toBe(true);
    });

    it('accepts a connected cross shape', () => {
      const heightMap = [
        [0, 0, 1, 0, 0],
        [0, 0, 1, 0, 0],
        [1, 1, 1, 1, 1],
        [0, 0, 1, 0, 0],
        [0, 0, 1, 0, 0],
      ];

      const result = validateHeightMap(heightMap, 5, 3);
      expect(result.isValid).toBe(true);
    });
  });

  describe('multiple errors', () => {
    it('reports all errors at once', () => {
      const heightMap = [
        [1, -1],
        [5, 1],
      ];

      const result = validateHeightMap(heightMap, 3, 3);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThanOrEqual(2);
    });
  });
});
