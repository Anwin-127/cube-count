import { describe, it, expect } from 'vitest';
import { analyzeComplexity } from '../complexityAnalyzer';

describe('analyzeComplexity', () => {
  describe('score normalization', () => {
    it('returns a score between 0 and 1', () => {
      const heightMap = [
        [1, 2, 3],
        [2, 3, 2],
        [1, 2, 1],
      ];
      const result = analyzeComplexity(heightMap, 3, 3);
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(1);
    });

    it('returns a low score for a minimal puzzle', () => {
      const heightMap = [
        [0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0],
        [0, 0, 1, 0, 0],
        [0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0],
      ];
      const result = analyzeComplexity(heightMap, 5, 4);
      expect(result.score).toBeLessThan(0.15);
    });

    it('returns a higher score for a complex puzzle', () => {
      const heightMap = [
        [3, 2, 3, 2, 3],
        [2, 4, 3, 4, 2],
        [3, 3, 4, 3, 3],
        [2, 4, 3, 4, 2],
        [3, 2, 3, 2, 3],
      ];
      const result = analyzeComplexity(heightMap, 5, 4);
      expect(result.score).toBeGreaterThan(0.4);
    });
  });

  describe('complexity factors', () => {
    it('returns all four factors', () => {
      const heightMap = [[1, 2], [2, 1]];
      const result = analyzeComplexity(heightMap, 2, 3);

      expect(result.factors).toHaveProperty('cubeCountFactor');
      expect(result.factors).toHaveProperty('heightVariationFactor');
      expect(result.factors).toHaveProperty('densityFactor');
      expect(result.factors).toHaveProperty('hiddenRatioFactor');
    });

    it('cubeCountFactor scales with total cubes', () => {
      const sparse = [[1, 0], [0, 1]];
      const dense = [[3, 3], [3, 3]];

      const sparseResult = analyzeComplexity(sparse, 2, 3);
      const denseResult = analyzeComplexity(dense, 2, 3);

      expect(denseResult.factors.cubeCountFactor).toBeGreaterThan(
        sparseResult.factors.cubeCountFactor,
      );
    });

    it('densityFactor scales with occupied cells', () => {
      const sparse = [
        [0, 0, 0],
        [0, 1, 0],
        [0, 0, 0],
      ];
      const full = [
        [1, 1, 1],
        [1, 1, 1],
        [1, 1, 1],
      ];

      const sparseResult = analyzeComplexity(sparse, 3, 3);
      const fullResult = analyzeComplexity(full, 3, 3);

      expect(fullResult.factors.densityFactor).toBeGreaterThan(
        sparseResult.factors.densityFactor,
      );
    });

    it('heightVariationFactor increases with varied heights', () => {
      const uniform = [
        [2, 2, 2],
        [2, 2, 2],
        [2, 2, 2],
      ];
      const varied = [
        [1, 3, 1],
        [3, 1, 3],
        [1, 3, 1],
      ];

      const uniformResult = analyzeComplexity(uniform, 3, 3);
      const variedResult = analyzeComplexity(varied, 3, 3);

      expect(variedResult.factors.heightVariationFactor).toBeGreaterThan(
        uniformResult.factors.heightVariationFactor,
      );
    });
  });

  describe('hidden cube estimate', () => {
    it('returns 0 hidden cubes for a flat puzzle', () => {
      const heightMap = [
        [1, 1, 1],
        [1, 1, 1],
        [1, 1, 1],
      ];
      const result = analyzeComplexity(heightMap, 3, 3);
      expect(result.hiddenCubeEstimate).toBe(0);
    });

    it('counts hidden cubes below each stack top', () => {
      const heightMap = [
        [3, 0, 0],
        [0, 2, 0],
        [0, 0, 1],
      ];
      // Stack of 3: 2 hidden. Stack of 2: 1 hidden. Stack of 1: 0 hidden.
      const result = analyzeComplexity(heightMap, 3, 3);
      expect(result.hiddenCubeEstimate).toBe(3);
    });

    it('hiddenRatioFactor increases with taller stacks', () => {
      const flat = [
        [1, 1, 1],
        [1, 1, 1],
        [1, 1, 1],
      ];
      const tall = [
        [4, 4, 4],
        [4, 4, 4],
        [4, 4, 4],
      ];

      const flatResult = analyzeComplexity(flat, 3, 4);
      const tallResult = analyzeComplexity(tall, 3, 4);

      expect(tallResult.factors.hiddenRatioFactor).toBeGreaterThan(
        flatResult.factors.hiddenRatioFactor,
      );
    });
  });

  describe('edge cases', () => {
    it('handles an empty grid without errors', () => {
      const heightMap = [
        [0, 0],
        [0, 0],
      ];
      const result = analyzeComplexity(heightMap, 2, 3);
      expect(result.score).toBe(0);
      expect(result.hiddenCubeEstimate).toBe(0);
    });

    it('handles maxHeight of 1', () => {
      const heightMap = [
        [1, 0, 1],
        [0, 1, 0],
        [1, 0, 1],
      ];
      const result = analyzeComplexity(heightMap, 3, 1);
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(1);
    });
  });
});
