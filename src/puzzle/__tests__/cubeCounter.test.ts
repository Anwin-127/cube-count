import { describe, it, expect } from 'vitest';
import { countTotalCubes, findMaximumHeight } from '../cubeCounter';

describe('countTotalCubes', () => {
  it('returns 0 for an all-zero grid', () => {
    const heightMap = [
      [0, 0, 0],
      [0, 0, 0],
      [0, 0, 0],
    ];
    expect(countTotalCubes(heightMap)).toBe(0);
  });

  it('counts a single cube', () => {
    const heightMap = [
      [0, 0, 0],
      [0, 1, 0],
      [0, 0, 0],
    ];
    expect(countTotalCubes(heightMap)).toBe(1);
  });

  it('sums all heights across the grid', () => {
    const heightMap = [
      [1, 2, 3],
      [4, 5, 6],
      [7, 8, 9],
    ];
    // 1+2+3 + 4+5+6 + 7+8+9 = 45
    expect(countTotalCubes(heightMap)).toBe(45);
  });

  it('handles a 5×5 grid correctly', () => {
    const heightMap = [
      [1, 0, 2, 0, 1],
      [0, 3, 0, 3, 0],
      [2, 0, 4, 0, 2],
      [0, 3, 0, 3, 0],
      [1, 0, 2, 0, 1],
    ];
    // Sum: 1+2+1 + 3+3 + 2+4+2 + 3+3 + 1+2+1 = 28
    expect(countTotalCubes(heightMap)).toBe(28);
  });

  it('handles an empty grid', () => {
    expect(countTotalCubes([])).toBe(0);
  });
});

describe('findMaximumHeight', () => {
  it('returns 0 for an all-zero grid', () => {
    const heightMap = [
      [0, 0],
      [0, 0],
    ];
    expect(findMaximumHeight(heightMap)).toBe(0);
  });

  it('finds the single tallest stack', () => {
    const heightMap = [
      [1, 2, 1],
      [1, 1, 1],
      [1, 1, 3],
    ];
    expect(findMaximumHeight(heightMap)).toBe(3);
  });

  it('returns the correct max for a uniform grid', () => {
    const heightMap = [
      [2, 2, 2],
      [2, 2, 2],
      [2, 2, 2],
    ];
    expect(findMaximumHeight(heightMap)).toBe(2);
  });

  it('handles an empty grid', () => {
    expect(findMaximumHeight([])).toBe(0);
  });
});
