/**
 * Deterministic seeded pseudo-random number generator.
 *
 * Uses the Mulberry32 algorithm — a fast 32-bit PRNG with
 * good statistical distribution properties.
 *
 * Given the same seed, this generator will always produce
 * the exact same sequence of numbers, which is essential
 * for reproducible puzzle generation.
 *
 * @see https://gist.github.com/tommyettinger/46a874533244883189143505d203312c
 */
export class SeededRandom {
  private state: number;

  constructor(seed: number) {
    // Ensure the state is a 32-bit integer.
    // Use a fallback of 1 if seed coerces to 0 (degenerate state).
    this.state = seed | 0;
    if (this.state === 0) {
      this.state = 1;
    }
  }

  /**
   * Returns the next pseudo-random float in the range [0, 1).
   *
   * Each call advances the internal state deterministically.
   */
  next(): number {
    this.state = (this.state + 0x6d2b79f5) | 0;
    let t = Math.imul(this.state ^ (this.state >>> 15), 1 | this.state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /**
   * Returns a pseudo-random integer in the range [min, max] (inclusive).
   */
  nextInt(min: number, max: number): number {
    return min + Math.floor(this.next() * (max - min + 1));
  }
}

/**
 * Generates a seed suitable for puzzle generation.
 *
 * Uses Math.random() for entropy. The returned value is
 * a positive 31-bit integer (1 to 2^31 - 1).
 */
export function generateSeed(): number {
  return Math.floor(Math.random() * 2147483646) + 1;
}
