import type { SeededRandom } from './random';
import type { HeightMap } from '../models/Puzzle';
import { generateShape, countActiveCells } from './shapes';
import type { ShapeFamily } from './shapes';
import { assignHeights } from './heightAssigner';
import { isConnected } from './connectivityChecker';

/**
 * Configuration for height map generation.
 */
export interface HeightMapConfig {
  /** Number of rows and columns in the grid. */
  readonly boardSize: number;
  /** Maximum allowed stack height per cell (inclusive). */
  readonly maxHeight: number;
}

/** Minimum number of active cells for a valid puzzle. */
const MIN_ACTIVE_CELLS = 5;

/**
 * Result of height map generation, including the shape family
 * used and whether the result passed internal quality checks.
 */
export interface HeightMapResult {
  readonly heightMap: HeightMap;
  readonly shapeFamily: ShapeFamily;
  readonly isValid: boolean;
}

/**
 * Generates a height map using shape-based generation.
 *
 * Pipeline:
 * 1. Randomly select and generate a shape family → boolean mask.
 * 2. Validate the mask (connectivity, minimum cell count).
 * 3. Assign heights using edge-distance gradient + perturbation.
 *
 * Returns the height map, shape family, and validity flag.
 * The caller (puzzleFactory) handles retry logic on invalid results.
 *
 * @param rng - Seeded random generator (state is advanced).
 * @param config - Board dimensions and height constraints.
 */
export function generateHeightMap(
  rng: SeededRandom,
  config: HeightMapConfig,
): HeightMapResult {
  const { boardSize, maxHeight } = config;

  // Step 1: Generate a shape
  const { mask, family } = generateShape(rng, boardSize);

  // Step 2: Quick quality checks before expensive height assignment
  const activeCells = countActiveCells(mask);
  if (activeCells < MIN_ACTIVE_CELLS) {
    return { heightMap: emptyGrid(boardSize), shapeFamily: family, isValid: false };
  }

  if (!isConnected(mask)) {
    return { heightMap: emptyGrid(boardSize), shapeFamily: family, isValid: false };
  }

  // Step 3: Assign heights
  const heightMap = assignHeights(mask, rng, maxHeight);

  return { heightMap, shapeFamily: family, isValid: true };
}

/**
 * Creates an empty height map grid (all zeros).
 */
function emptyGrid(size: number): number[][] {
  return Array.from({ length: size }, () => Array(size).fill(0) as number[]);
}
