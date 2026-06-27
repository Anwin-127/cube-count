import type { HeightMap } from '../models/Puzzle';

/**
 * Calculates the total number of cubes in a height map.
 *
 * Each cell value represents the number of stacked cubes at that position.
 * The total is the sum of all cell values across the entire grid.
 */
export function countTotalCubes(heightMap: HeightMap): number {
  let total = 0;
  for (const row of heightMap) {
    for (const height of row) {
      total += height;
    }
  }
  return total;
}

/**
 * Finds the tallest stack in the height map.
 *
 * Returns 0 if the height map is empty or all cells are zero.
 */
export function findMaximumHeight(heightMap: HeightMap): number {
  let max = 0;
  for (const row of heightMap) {
    for (const height of row) {
      if (height > max) {
        max = height;
      }
    }
  }
  return max;
}
