import type { SeededRandom } from './random';
import type { HeightMap } from '../models/Puzzle';
import { generateShape, applyRandomTransform, countActiveCells } from './shapes';
import type { ShapeFamily } from './shapes';
import { assignHeights } from './heightAssigner';
import { isConnected } from './connectivityChecker';
import { selectRecipe } from './puzzleRecipes';
import type { PuzzleRecipe } from './puzzleRecipes';
import { Difficulty } from '../models/Difficulty';

/**
 * Configuration for height map generation.
 */
export interface HeightMapConfig {
  /** Number of rows and columns in the grid. */
  readonly boardSize: number;
  /** Maximum allowed stack height per cell (inclusive). */
  readonly maxHeight: number;
  /** Difficulty level — used by recipe selection. Defaults to MEDIUM. */
  readonly difficulty?: Difficulty;
  /** Recent recipe names to avoid for session variety. */
  readonly recentRecipeNames?: readonly string[];
}

/** Minimum number of active cells for a valid puzzle. */
const MIN_ACTIVE_CELLS = 5;

/**
 * Result of height map generation, including the recipe used
 * and whether the result passed internal quality checks.
 */
export interface HeightMapResult {
  readonly heightMap: HeightMap;
  readonly shapeFamily: ShapeFamily;
  readonly recipeName: string;
  readonly isValid: boolean;
}

/**
 * Generates a height map using the recipe-based pipeline.
 *
 * Pipeline:
 * 1. Select a puzzle recipe (shape + strategy + landmark) for the difficulty.
 * 2. Generate the shape mask for the recipe's shape family.
 * 3. Apply random rotation/mirror transforms if the recipe allows it.
 * 4. Validate the mask (connectivity, minimum cell count).
 * 5. Assign heights using the recipe's strategy and landmark.
 * 6. Apply post-generation refinement (smooth isolated spikes).
 *
 * Returns the height map, recipe information, and validity flag.
 * The caller (puzzleFactory) handles retry logic on invalid results.
 *
 * @param rng - Seeded random generator (state is advanced).
 * @param config - Board dimensions, height constraints, and difficulty context.
 */
export function generateHeightMap(
  rng: SeededRandom,
  config: HeightMapConfig,
): HeightMapResult {
  const { boardSize, maxHeight } = config;
  const difficulty = config.difficulty ?? Difficulty.MEDIUM;
  const recentRecipeNames = config.recentRecipeNames ?? [];

  // Step 1: Select a recipe from the catalog
  const recipe = selectRecipe(rng, difficulty, recentRecipeNames);

  return generateFromRecipe(rng, recipe, boardSize, maxHeight);
}

/**
 * Generates a height map from an explicitly provided recipe.
 * Separated from selectRecipe() so tests can exercise specific recipes.
 */
export function generateFromRecipe(
  rng: SeededRandom,
  recipe: PuzzleRecipe,
  boardSize: number,
  maxHeight: number,
): HeightMapResult {
  // Step 2: Generate the shape mask
  const { mask: rawMask, family } = generateShape(rng, boardSize, recipe.shapeFamily);

  // Step 3: Apply random transform if the recipe permits it
  const mask = recipe.allowTransforms
    ? applyRandomTransform(rawMask, rng)
    : rawMask;

  // Step 4: Validate the mask before expensive height assignment
  const activeCells = countActiveCells(mask);
  if (activeCells < MIN_ACTIVE_CELLS) {
    return { heightMap: emptyGrid(boardSize), shapeFamily: family, recipeName: recipe.name, isValid: false };
  }

  if (!isConnected(mask)) {
    return { heightMap: emptyGrid(boardSize), shapeFamily: family, recipeName: recipe.name, isValid: false };
  }

  // Step 5: Assign heights using the recipe's strategy and landmark
  const rawHeightMap = assignHeights(
    mask,
    rng,
    maxHeight,
    recipe.heightStrategy,
    recipe.landmark,
  );

  // Step 6: Refine — smooth any isolated spike (height >= 3 with no neighbours >= 2)
  const heightMap = refineSpikeHeights(rawHeightMap, mask, boardSize, maxHeight);

  return { heightMap, shapeFamily: family, recipeName: recipe.name, isValid: true };
}

/**
 * Post-processing refinement: reduces isolated spike cells.
 *
 * A spike is an active cell with height H where H >= 3 and none of its
 * 4-connected active neighbours has height >= H - 1. Such spikes look
 * unrealistic and are hard to read. They are lowered by 1.
 *
 * This is intentionally conservative: it only fires on significant spikes
 * and preserves the landmark cell (which is the tallest by design).
 */
function refineSpikeHeights(
  heights: number[][],
  mask: boolean[][],
  boardSize: number,
  maxHeight: number,
): number[][] {
  // Skip refinement when maxHeight <= 2 (spikes are less meaningful)
  if (maxHeight <= 2) return heights;

  const refined = heights.map((row) => [...row]);
  const directions: readonly [number, number][] = [[0, 1], [0, -1], [1, 0], [-1, 0]];

  for (let r = 0; r < boardSize; r++) {
    for (let c = 0; c < boardSize; c++) {
      if (!mask[r][c]) continue;
      const h = refined[r][c];
      if (h < 3) continue;

      const hasCompatibleNeighbour = directions.some(([dr, dc]) => {
        const nr = r + dr;
        const nc = c + dc;
        return (
          nr >= 0 &&
          nr < boardSize &&
          nc >= 0 &&
          nc < boardSize &&
          mask[nr][nc] &&
          refined[nr][nc] >= h - 1
        );
      });

      if (!hasCompatibleNeighbour) {
        refined[r][c] = Math.max(1, h - 1);
      }
    }
  }

  return refined;
}

/**
 * Creates an empty height map grid (all zeros).
 */
function emptyGrid(size: number): number[][] {
  return Array.from({ length: size }, () => Array(size).fill(0) as number[]);
}
