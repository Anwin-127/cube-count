import { describe, it, expect } from 'vitest';
import { generateHeightMap } from '../heightMapGenerator';
import { SeededRandom } from '../random';

describe('generateHeightMap (shape-based)', () => {
  const defaultConfig = { boardSize: 5, maxHeight: 3 };

  it('returns a HeightMapResult with heightMap, shapeFamily, and validity', () => {
    const rng = new SeededRandom(42);
    const result = generateHeightMap(rng, defaultConfig);

    expect(result).toHaveProperty('heightMap');
    expect(result).toHaveProperty('shapeFamily');
    expect(result).toHaveProperty('isValid');
  });

  it('generates a grid of the correct dimensions', () => {
    const rng = new SeededRandom(42);
    const result = generateHeightMap(rng, defaultConfig);

    expect(result.heightMap.length).toBe(5);
    for (const row of result.heightMap) {
      expect(row.length).toBe(5);
    }
  });

  it('generates heights within [0, maxHeight]', () => {
    const rng = new SeededRandom(12345);
    const result = generateHeightMap(rng, defaultConfig);

    for (const row of result.heightMap) {
      for (const height of row) {
        expect(height).toBeGreaterThanOrEqual(0);
        expect(height).toBeLessThanOrEqual(3);
      }
    }
  });

  it('is deterministic for the same seed', () => {
    const rng1 = new SeededRandom(42);
    const rng2 = new SeededRandom(42);

    const result1 = generateHeightMap(rng1, defaultConfig);
    const result2 = generateHeightMap(rng2, defaultConfig);

    expect(result1.heightMap).toEqual(result2.heightMap);
    expect(result1.shapeFamily).toBe(result2.shapeFamily);
  });

  it('produces a recognized shape family', () => {
    const rng = new SeededRandom(42);
    const result = generateHeightMap(rng, defaultConfig);

    const validFamilies = [
      'RECTANGLE', 'L_SHAPE', 'CROSS', 'DIAMOND',
      'PYRAMID', 'STAIRCASE', 'BLOB',
    ];
    expect(validFamilies).toContain(result.shapeFamily);
  });

  it('active cells have height >= 1 when valid', () => {
    // Run multiple seeds to get valid results
    for (let seed = 1; seed <= 50; seed++) {
      const rng = new SeededRandom(seed);
      const result = generateHeightMap(rng, defaultConfig);
      if (!result.isValid) continue;

      for (const row of result.heightMap) {
        for (const height of row) {
          // Cells are either 0 (inactive) or >= 1 (active)
          expect(height === 0 || height >= 1).toBe(true);
        }
      }
    }
  });

  it('generates valid puzzles for most seeds', () => {
    let validCount = 0;
    const totalAttempts = 100;

    for (let seed = 1; seed <= totalAttempts; seed++) {
      const rng = new SeededRandom(seed);
      const result = generateHeightMap(rng, defaultConfig);
      if (result.isValid) validCount++;
    }

    // At least 60% of attempts should produce valid puzzles
    expect(validCount / totalAttempts).toBeGreaterThan(0.6);
  });
});
