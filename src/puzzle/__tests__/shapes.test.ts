import { describe, it, expect } from 'vitest';
import { generateShape, countActiveCells, ShapeFamily } from '../shapes';
import type { ShapeMask } from '../shapes';
import { SeededRandom } from '../random';

describe('generateShape', () => {
  it('returns a mask and a shape family', () => {
    const rng = new SeededRandom(42);
    const result = generateShape(rng, 5);

    expect(result).toHaveProperty('mask');
    expect(result).toHaveProperty('family');
    expect(typeof result.family).toBe('string');
  });

  it('produces a mask of correct dimensions', () => {
    const rng = new SeededRandom(42);
    const { mask } = generateShape(rng, 5);

    expect(mask.length).toBe(5);
    for (const row of mask) {
      expect(row.length).toBe(5);
    }
  });

  it('is deterministic for the same seed', () => {
    const rng1 = new SeededRandom(100);
    const rng2 = new SeededRandom(100);

    const result1 = generateShape(rng1, 5);
    const result2 = generateShape(rng2, 5);

    expect(result1.mask).toEqual(result2.mask);
    expect(result1.family).toBe(result2.family);
  });

  it('produces different shapes for different seeds', () => {
    const results: ShapeMask[] = [];
    for (let seed = 1; seed <= 20; seed++) {
      const rng = new SeededRandom(seed);
      results.push(generateShape(rng, 5).mask);
    }

    // At least some shapes should be different
    const serialized = results.map((m) => JSON.stringify(m));
    const unique = new Set(serialized);
    expect(unique.size).toBeGreaterThan(1);
  });

  it('generates all shape families across many seeds', () => {
    const families = new Set<string>();

    for (let seed = 1; seed <= 200; seed++) {
      const rng = new SeededRandom(seed);
      const { family } = generateShape(rng, 5);
      families.add(family);
    }

    // All 7 families should be generated eventually
    const allFamilies = Object.values(ShapeFamily);
    for (const f of allFamilies) {
      expect(families.has(f)).toBe(true);
    }
  });

  it('produces masks with at least some active cells', () => {
    for (let seed = 1; seed <= 50; seed++) {
      const rng = new SeededRandom(seed);
      const { mask } = generateShape(rng, 5);
      const active = countActiveCells(mask);
      expect(active).toBeGreaterThan(0);
    }
  });

  it('mask values are booleans', () => {
    const rng = new SeededRandom(42);
    const { mask } = generateShape(rng, 5);

    for (const row of mask) {
      for (const cell of row) {
        expect(typeof cell).toBe('boolean');
      }
    }
  });
});

describe('countActiveCells', () => {
  it('counts cells correctly', () => {
    const mask: ShapeMask = [
      [true, false, true],
      [false, true, false],
      [true, false, true],
    ];
    expect(countActiveCells(mask)).toBe(5);
  });

  it('returns 0 for an empty mask', () => {
    const mask: ShapeMask = [
      [false, false],
      [false, false],
    ];
    expect(countActiveCells(mask)).toBe(0);
  });

  it('returns full count for a filled mask', () => {
    const mask: ShapeMask = [
      [true, true],
      [true, true],
    ];
    expect(countActiveCells(mask)).toBe(4);
  });
});
