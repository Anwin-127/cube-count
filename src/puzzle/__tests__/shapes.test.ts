import { describe, it, expect } from 'vitest';
import {
  generateShape,
  countActiveCells,
  ShapeFamily,
  rotateMask90,
  mirrorMask,
  applyRandomTransform,
} from '../shapes';
import type { ShapeMask } from '../shapes';
import { SeededRandom } from '../random';

// All families must now be passed explicitly to generateShape()
const ALL_FAMILIES = Object.values(ShapeFamily);

describe('generateShape', () => {
  it('returns a mask and a shape family', () => {
    const rng = new SeededRandom(42);
    const result = generateShape(rng, 5, ShapeFamily.RECTANGLE);

    expect(result).toHaveProperty('mask');
    expect(result).toHaveProperty('family');
    expect(typeof result.family).toBe('string');
  });

  it('produces a mask of correct dimensions', () => {
    const rng = new SeededRandom(42);
    const { mask } = generateShape(rng, 5, ShapeFamily.CIRCLE);

    expect(mask.length).toBe(5);
    for (const row of mask) {
      expect(row.length).toBe(5);
    }
  });

  it('is deterministic for the same seed and family', () => {
    const rng1 = new SeededRandom(100);
    const rng2 = new SeededRandom(100);

    const result1 = generateShape(rng1, 5, ShapeFamily.DIAMOND);
    const result2 = generateShape(rng2, 5, ShapeFamily.DIAMOND);

    expect(result1.mask).toEqual(result2.mask);
    expect(result1.family).toBe(result2.family);
  });

  it('produces different shapes for different seeds within the same family', () => {
    const results: ShapeMask[] = [];
    for (let seed = 1; seed <= 20; seed++) {
      const rng = new SeededRandom(seed);
      results.push(generateShape(rng, 5, ShapeFamily.BLOB).mask);
    }

    const serialized = results.map((m) => JSON.stringify(m));
    const unique = new Set(serialized);
    expect(unique.size).toBeGreaterThan(1);
  });

  it('generates all shape families', () => {
    // Every family in the enum must have a working generator
    for (const family of ALL_FAMILIES) {
      const rng = new SeededRandom(42);
      const result = generateShape(rng, 5, family);
      expect(result.family).toBe(family);
      expect(result.mask.length).toBe(5);
    }
  });

  it('produces masks with at least some active cells for every family', () => {
    // Run each family across multiple seeds
    for (const family of ALL_FAMILIES) {
      let anyActive = false;
      for (let seed = 1; seed <= 10; seed++) {
        const rng = new SeededRandom(seed);
        const { mask } = generateShape(rng, 5, family);
        if (countActiveCells(mask) > 0) {
          anyActive = true;
          break;
        }
      }
      expect(anyActive).toBe(true);
    }
  });

  it('mask values are booleans', () => {
    const rng = new SeededRandom(42);
    const { mask } = generateShape(rng, 5, ShapeFamily.CROSS);

    for (const row of mask) {
      for (const cell of row) {
        expect(typeof cell).toBe('boolean');
      }
    }
  });
});

describe('rotateMask90', () => {
  it('rotates a 3×3 mask correctly', () => {
    const mask: ShapeMask = [
      [true,  false, false],
      [false, false, false],
      [false, false, false],
    ];
    const rotated = rotateMask90(mask);
    // Top-left cell (0,0) should move to (0,2)
    expect(rotated[0][2]).toBe(true);
    expect(rotated[0][0]).toBe(false);
  });

  it('returns same dimensions', () => {
    const rng = new SeededRandom(7);
    const { mask } = generateShape(rng, 5, ShapeFamily.RECTANGLE);
    const rotated = rotateMask90(mask);
    expect(rotated.length).toBe(5);
    for (const row of rotated) {
      expect(row.length).toBe(5);
    }
  });

  it('four rotations return the original mask', () => {
    const rng = new SeededRandom(13);
    const { mask } = generateShape(rng, 5, ShapeFamily.CORNER_TOWER);
    const back = rotateMask90(rotateMask90(rotateMask90(rotateMask90(mask))));
    expect(back).toEqual(mask);
  });
});

describe('mirrorMask', () => {
  it('mirrors a mask horizontally', () => {
    const mask: ShapeMask = [
      [true,  false, false],
      [false, false, false],
      [false, false, false],
    ];
    const mirrored = mirrorMask(mask);
    expect(mirrored[0][0]).toBe(false);
    expect(mirrored[0][2]).toBe(true);
  });

  it('double mirror returns the original', () => {
    const rng = new SeededRandom(99);
    const { mask } = generateShape(rng, 5, ShapeFamily.L_SHAPE);
    expect(mirrorMask(mirrorMask(mask))).toEqual(mask);
  });
});

describe('applyRandomTransform', () => {
  it('returns a mask of the same dimensions', () => {
    const rng1 = new SeededRandom(55);
    const { mask } = generateShape(rng1, 5, ShapeFamily.DIAMOND);
    const rng2 = new SeededRandom(77);
    const transformed = applyRandomTransform(mask, rng2);
    expect(transformed.length).toBe(5);
    for (const row of transformed) {
      expect(row.length).toBe(5);
    }
  });

  it('preserves the number of active cells', () => {
    const rng1 = new SeededRandom(33);
    const { mask } = generateShape(rng1, 5, ShapeFamily.RING);
    const activeBefore = countActiveCells(mask);
    const rng2 = new SeededRandom(44);
    const transformed = applyRandomTransform(mask, rng2);
    expect(countActiveCells(transformed)).toBe(activeBefore);
  });
});

describe('New shape families', () => {
  const families: ShapeFamily[] = [
    ShapeFamily.CORNER_TOWER,
    ShapeFamily.TWIN_TOWERS,
    ShapeFamily.RING,
    ShapeFamily.SKYLINE,
    ShapeFamily.PLATEAU,
    ShapeFamily.ZIGZAG,
  ];

  for (const family of families) {
    it(`${family} generates a non-empty mask`, () => {
      for (let seed = 1; seed <= 5; seed++) {
        const rng = new SeededRandom(seed);
        const { mask } = generateShape(rng, 5, family);
        expect(countActiveCells(mask)).toBeGreaterThan(0);
        expect(mask.length).toBe(5);
      }
    });
  }
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
