import { describe, it, expect } from 'vitest';
import { SeededRandom, generateSeed } from '../random';

describe('SeededRandom', () => {
  describe('determinism', () => {
    it('produces the same sequence for the same seed', () => {
      const rng1 = new SeededRandom(42);
      const rng2 = new SeededRandom(42);

      const sequence1 = Array.from({ length: 100 }, () => rng1.next());
      const sequence2 = Array.from({ length: 100 }, () => rng2.next());

      expect(sequence1).toEqual(sequence2);
    });

    it('produces different sequences for different seeds', () => {
      const rng1 = new SeededRandom(42);
      const rng2 = new SeededRandom(43);

      const sequence1 = Array.from({ length: 20 }, () => rng1.next());
      const sequence2 = Array.from({ length: 20 }, () => rng2.next());

      expect(sequence1).not.toEqual(sequence2);
    });

    it('handles seed of 0 without producing degenerate output', () => {
      const rng = new SeededRandom(0);
      const values = Array.from({ length: 10 }, () => rng.next());

      // All values should be in [0, 1) and not all identical
      for (const v of values) {
        expect(v).toBeGreaterThanOrEqual(0);
        expect(v).toBeLessThan(1);
      }

      const uniqueValues = new Set(values);
      expect(uniqueValues.size).toBeGreaterThan(1);
    });

    it('handles negative seeds', () => {
      const rng = new SeededRandom(-12345);
      const values = Array.from({ length: 10 }, () => rng.next());

      for (const v of values) {
        expect(v).toBeGreaterThanOrEqual(0);
        expect(v).toBeLessThan(1);
      }
    });
  });

  describe('next()', () => {
    it('returns values in [0, 1)', () => {
      const rng = new SeededRandom(12345);

      for (let i = 0; i < 1000; i++) {
        const value = rng.next();
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThan(1);
      }
    });
  });

  describe('nextInt()', () => {
    it('returns integers within the specified range (inclusive)', () => {
      const rng = new SeededRandom(99);

      for (let i = 0; i < 500; i++) {
        const value = rng.nextInt(0, 4);
        expect(Number.isInteger(value)).toBe(true);
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThanOrEqual(4);
      }
    });

    it('returns the only possible value when min equals max', () => {
      const rng = new SeededRandom(42);

      for (let i = 0; i < 10; i++) {
        expect(rng.nextInt(3, 3)).toBe(3);
      }
    });

    it('produces a reasonable distribution across the range', () => {
      const rng = new SeededRandom(7777);
      const counts: Record<number, number> = { 0: 0, 1: 0, 2: 0, 3: 0 };
      const iterations = 4000;

      for (let i = 0; i < iterations; i++) {
        const value = rng.nextInt(0, 3);
        counts[value]++;
      }

      // Each value should appear roughly 25% of the time (±10%)
      for (let v = 0; v <= 3; v++) {
        const proportion = counts[v] / iterations;
        expect(proportion).toBeGreaterThan(0.15);
        expect(proportion).toBeLessThan(0.35);
      }
    });
  });
});

describe('generateSeed', () => {
  it('returns a positive integer', () => {
    const seed = generateSeed();
    expect(seed).toBeGreaterThan(0);
    expect(Number.isInteger(seed)).toBe(true);
  });

  it('returns values within the 31-bit range', () => {
    for (let i = 0; i < 100; i++) {
      const seed = generateSeed();
      expect(seed).toBeGreaterThan(0);
      expect(seed).toBeLessThan(2147483647);
    }
  });
});
