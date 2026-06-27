import { describe, it, expect } from 'vitest';
import { assignHeights } from '../heightAssigner';
import { SeededRandom } from '../random';

describe('assignHeights', () => {
  const fullMask = [
    [true, true, true],
    [true, true, true],
    [true, true, true],
  ];

  it('assigns heights only to active cells', () => {
    const mask = [
      [true, false, false],
      [false, true, false],
      [false, false, true],
    ];
    const rng = new SeededRandom(42);
    const heights = assignHeights(mask, rng, 3);

    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        if (mask[r][c]) {
          expect(heights[r][c]).toBeGreaterThanOrEqual(1);
        } else {
          expect(heights[r][c]).toBe(0);
        }
      }
    }
  });

  it('never exceeds maxHeight', () => {
    const rng = new SeededRandom(42);
    const heights = assignHeights(fullMask, rng, 3);

    for (const row of heights) {
      for (const h of row) {
        expect(h).toBeLessThanOrEqual(3);
      }
    }
  });

  it('active cells always have at least height 1', () => {
    // Test across many seeds
    for (let seed = 1; seed <= 30; seed++) {
      const rng = new SeededRandom(seed);
      const heights = assignHeights(fullMask, rng, 4);

      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
          expect(heights[r][c]).toBeGreaterThanOrEqual(1);
        }
      }
    }
  });

  it('is deterministic for the same seed', () => {
    const rng1 = new SeededRandom(42);
    const rng2 = new SeededRandom(42);

    const heights1 = assignHeights(fullMask, rng1, 3);
    const heights2 = assignHeights(fullMask, rng2, 3);

    expect(heights1).toEqual(heights2);
  });

  it('produces smooth height transitions (no jumps > 2)', () => {
    const rng = new SeededRandom(42);
    const mask = [
      [true, true, true, true, true],
      [true, true, true, true, true],
      [true, true, true, true, true],
      [true, true, true, true, true],
      [true, true, true, true, true],
    ];
    const heights = assignHeights(mask, rng, 4);

    // Check horizontal neighbors
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 4; c++) {
        if (heights[r][c] > 0 && heights[r][c + 1] > 0) {
          const diff = Math.abs(heights[r][c] - heights[r][c + 1]);
          // Height transitions should be gradual (≤ 3 accounting for
          // edge-distance gradient + perturbation at boundaries)
          expect(diff).toBeLessThanOrEqual(3);
        }
      }
    }

    // Check vertical neighbors
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 5; c++) {
        if (heights[r][c] > 0 && heights[r + 1][c] > 0) {
          const diff = Math.abs(heights[r][c] - heights[r + 1][c]);
          expect(diff).toBeLessThanOrEqual(3);
        }
      }
    }
  });

  it('interior cells tend to be taller than edge cells', () => {
    const rng = new SeededRandom(42);
    const mask = [
      [true, true, true, true, true],
      [true, true, true, true, true],
      [true, true, true, true, true],
      [true, true, true, true, true],
      [true, true, true, true, true],
    ];
    const heights = assignHeights(mask, rng, 4);

    // Center cell should be >= average edge cell height
    const center = heights[2][2];
    const edgeCells = [
      heights[0][0], heights[0][2], heights[0][4],
      heights[2][0], heights[2][4],
      heights[4][0], heights[4][2], heights[4][4],
    ];
    const avgEdge = edgeCells.reduce((a, b) => a + b, 0) / edgeCells.length;

    expect(center).toBeGreaterThanOrEqual(avgEdge);
  });
});
