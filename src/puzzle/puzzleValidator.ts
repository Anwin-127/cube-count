import type { HeightMap } from '../models/Puzzle';
import { isConnected } from './connectivityChecker';
import { analyzeOcclusion } from './occlusionAnalyzer';
import { OCCLUSION_REJECTION_THRESHOLD } from '../config/constants';

/**
 * Result of a puzzle validation check.
 */
export interface ValidationResult {
  readonly isValid: boolean;
  readonly errors: readonly string[];
}

/** Minimum number of active cells for a playable puzzle. */
const MIN_ACTIVE_CELLS = 5;

/**
 * Validates a height map against all puzzle constraints.
 *
 * Checks performed:
 * 1. Grid dimensions match expected board size.
 * 2. All heights are non-negative integers.
 * 3. No height exceeds the maximum allowed.
 * 4. The puzzle contains at least MIN_ACTIVE_CELLS occupied cells.
 * 5. The puzzle contains at least one cube.
 * 6. All occupied cells form a single connected region.
 * 7. Isometric occlusion score does not exceed OCCLUSION_REJECTION_THRESHOLD.
 *    Puzzles with excessive occlusion are unreadable and frustrating.
 *
 * @param heightMap - The grid to validate.
 * @param expectedSize - Expected number of rows and columns.
 * @param maxHeight - Maximum allowed stack height.
 * @returns A ValidationResult with any detected errors.
 */
export function validateHeightMap(
  heightMap: HeightMap,
  expectedSize: number,
  maxHeight: number,
): ValidationResult {
  const errors: string[] = [];

  // Check row count
  if (heightMap.length !== expectedSize) {
    errors.push(
      `Expected ${expectedSize} rows, got ${heightMap.length}`,
    );
  }

  // Check each row and cell
  let totalCubes = 0;
  let activeCells = 0;

  for (let r = 0; r < heightMap.length; r++) {
    const row = heightMap[r];

    if (row.length !== expectedSize) {
      errors.push(
        `Row ${r}: expected ${expectedSize} columns, got ${row.length}`,
      );
    }

    for (let c = 0; c < row.length; c++) {
      const h = row[c];

      if (!Number.isInteger(h)) {
        errors.push(`Cell [${r}][${c}]: height must be an integer, got ${h}`);
      }
      if (h < 0) {
        errors.push(`Cell [${r}][${c}]: height must be >= 0, got ${h}`);
      }
      if (h > maxHeight) {
        errors.push(
          `Cell [${r}][${c}]: height ${h} exceeds maximum ${maxHeight}`,
        );
      }

      totalCubes += h;
      if (h > 0) activeCells++;
    }
  }

  // Total cube check
  if (totalCubes === 0 && errors.length === 0) {
    errors.push('Puzzle must contain at least one cube');
  }

  // Minimum active cells check
  if (activeCells > 0 && activeCells < MIN_ACTIVE_CELLS && errors.length === 0) {
    errors.push(
      `Puzzle must have at least ${MIN_ACTIVE_CELLS} active cells, got ${activeCells}`,
    );
  }

  // Connectivity check (only if dimensions are correct and we have active cells)
  if (
    errors.length === 0 &&
    activeCells > 0 &&
    heightMap.length === expectedSize
  ) {
    const mask = heightMap.map((row) => row.map((h) => h > 0));
    if (!isConnected(mask)) {
      errors.push('All occupied cells must form a single connected region');
    }
  }

  // Occlusion check: reject puzzles where too many stacks are hidden
  if (errors.length === 0 && activeCells > 0) {
    const occlusion = analyzeOcclusion(heightMap, expectedSize);
    if (occlusion.score > OCCLUSION_REJECTION_THRESHOLD) {
      errors.push(
        `Occlusion score ${occlusion.score.toFixed(2)} exceeds threshold ${OCCLUSION_REJECTION_THRESHOLD}. ` +
          `${occlusion.occludedStackCount} stacks are hidden — puzzle is unreadable.`,
      );
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
