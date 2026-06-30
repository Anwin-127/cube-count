import { describe, it, expect } from 'vitest';
import { analyzeOcclusion } from '../occlusionAnalyzer';
import type { HeightMap } from '../../models/Puzzle';

describe('analyzeOcclusion', () => {
  it('returns zero score for a flat board', () => {
    // Flat board: all height 1, no stack is taller than any neighbour
    const heightMap: HeightMap = [
      [1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1],
    ];
    const result = analyzeOcclusion(heightMap, 5);
    expect(result.score).toBe(0);
    expect(result.occludedStackCount).toBe(0);
    expect(result.hiddenCubeCount).toBe(0);
  });

  it('returns zero score for an empty board', () => {
    const heightMap: HeightMap = [
      [0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0],
    ];
    const result = analyzeOcclusion(heightMap, 5);
    expect(result.score).toBe(0);
  });

  it('detects occlusion when a shorter stack is behind a taller one', () => {
    // Stack at (2,2) height 1, stack at (3,2) height 3 (in front of it)
    // Stack (2,2) is occluded by (3,2)
    const heightMap: HeightMap = [
      [0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0],
      [0, 0, 1, 0, 0],
      [0, 0, 3, 0, 0],
      [0, 0, 0, 0, 0],
    ];
    const result = analyzeOcclusion(heightMap, 5);
    expect(result.occludedStackCount).toBeGreaterThan(0);
    expect(result.hiddenCubeCount).toBeGreaterThan(0);
  });

  it('score is normalized to [0, 1]', () => {
    // Extreme case: front rows much taller than back rows
    const heightMap: HeightMap = [
      [1, 1, 1, 1, 1],
      [3, 3, 3, 3, 3],
      [3, 3, 3, 3, 3],
      [3, 3, 3, 3, 3],
      [3, 3, 3, 3, 3],
    ];
    const result = analyzeOcclusion(heightMap, 5);
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(1);
  });

  it('handles a single-cell board', () => {
    const heightMap: HeightMap = [[3]];
    const result = analyzeOcclusion(heightMap, 1);
    expect(result.score).toBe(0);
    expect(result.occludedStackCount).toBe(0);
  });
});
