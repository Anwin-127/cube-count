import { SeededRandom } from './random';
import { generateHeightMap } from './heightMapGenerator';
import { countTotalCubes, findMaximumHeight } from './cubeCounter';
import { validateHeightMap } from './puzzleValidator';
import { analyzeComplexity } from './complexityAnalyzer';
import { analyzeOcclusion } from './occlusionAnalyzer';
import { scoreReadability } from './readabilityScorer';
import type { Puzzle, PuzzleMetadata } from '../models/Puzzle';
import type { Difficulty } from '../models/Difficulty';
import { BOARD_SIZE } from '../config/constants';

/**
 * Configuration required to generate a puzzle.
 */
export interface PuzzleGenerationConfig {
  /** Seed for deterministic generation. Same seed → same puzzle. */
  readonly seed: number;
  /** Difficulty level — stored in metadata and influences height range. */
  readonly difficulty: Difficulty;
  /** Maximum stack height per cell (inclusive). */
  readonly maxHeight: number;
  /** Target complexity range [min, max]. */
  readonly targetComplexityRange?: [number, number];
  /** Recent recipe names to avoid for session variety. */
  readonly recentRecipeNames?: readonly string[];
}

/**
 * Maximum number of generation attempts before giving up.
 *
 * Each retry uses a different effective seed to advance the RNG state.
 * The factory tracks the best readable candidate seen so far as a fallback.
 */
const MAX_GENERATION_ATTEMPTS = 50;

/**
 * Creates a complete, immutable Puzzle object from a generation config.
 *
 * Pipeline:
 * 1. Seed a PRNG with the given seed.
 * 2. Select a puzzle recipe (shape + strategy + landmark).
 * 3. Generate a shape-based height map via the recipe (with retry on invalid shapes).
 * 4. Validate the result (dimensions, heights, connectivity, occlusion gate).
 * 5. Analyze complexity to verify the difficulty target is met.
 * 6. Analyze occlusion and readability for quality scoring.
 * 7. Accept the first puzzle that passes all gates AND has good readability.
 *    Track the most readable valid puzzle as a fallback if we exhaust attempts.
 * 8. Create metadata with recipe info and quality scores.
 * 9. Deep-freeze and return the puzzle.
 *
 * The puzzle is deeply frozen: neither the puzzle object, nor its
 * height map rows, nor its metadata can be modified after creation.
 *
 * @throws Error if a valid puzzle cannot be generated within MAX_GENERATION_ATTEMPTS.
 */
export function createPuzzle(config: PuzzleGenerationConfig): Puzzle {
  /**
   * bestCandidate tracks the highest-quality valid puzzle seen so far.
   * It is used as a fallback when no puzzle passes all quality thresholds
   * within the attempt budget.
   */
  let bestCandidate: Puzzle | null = null;
  let bestCandidateReadability = -Infinity;

  /** Tracks the closest-to-target puzzle when complexity filtering is active. */
  let closestFallback: Puzzle | null = null;
  let closestDifference = Infinity;

  for (let attempt = 0; attempt < MAX_GENERATION_ATTEMPTS; attempt++) {
    const effectiveSeed = config.seed + attempt;
    const rng = new SeededRandom(effectiveSeed);

    // Step 1: Recipe-based height map generation
    const result = generateHeightMap(rng, {
      boardSize: BOARD_SIZE,
      maxHeight: config.maxHeight,
      difficulty: config.difficulty,
      recentRecipeNames: config.recentRecipeNames ?? [],
    });

    if (!result.isValid) continue;

    // Step 2: Validate (dimensions, heights, connectivity, occlusion)
    const validation = validateHeightMap(
      result.heightMap,
      BOARD_SIZE,
      config.maxHeight,
    );
    if (!validation.isValid) continue;

    // Step 3: Calculate core metrics
    const totalCubes = countTotalCubes(result.heightMap);
    const maximumHeight = findMaximumHeight(result.heightMap);

    // Step 4: Analyze complexity for difficulty filtering
    const analysis = analyzeComplexity(
      result.heightMap,
      BOARD_SIZE,
      config.maxHeight,
    );

    // Step 5: Analyze occlusion and readability
    const occlusion = analyzeOcclusion(result.heightMap, BOARD_SIZE);
    const readability = scoreReadability(
      result.heightMap,
      BOARD_SIZE,
      config.maxHeight,
    );

    // Build the puzzle object (used for both acceptance and fallback tracking)
    const candidate = buildPuzzleObject(
      result,
      config,
      effectiveSeed,
      totalCubes,
      maximumHeight,
      analysis,
      occlusion.score,
      readability.score,
      attempt,
    );

    // Track the best valid puzzle by readability for use as a final fallback
    if (readability.score > bestCandidateReadability) {
      bestCandidateReadability = readability.score;
      bestCandidate = candidate;
    }

    // Apply complexity filter if a target range was specified
    if (config.targetComplexityRange) {
      const [minRange, maxRange] = config.targetComplexityRange;
      const score = analysis.score;

      if (score < minRange || score > maxRange) {
        const diff = score < minRange ? minRange - score : score - maxRange;
        if (diff < closestDifference) {
          closestDifference = diff;
          closestFallback = candidate;
        }
        continue;
      }
    }

    // Puzzle passes all gates — accept it
    return candidate;
  }

  // Return the best candidate we found, preferring one that met the complexity
  // target (closestFallback) over one that didn't (bestCandidate).
  if (closestFallback) return closestFallback;
  if (bestCandidate) return bestCandidate;

  throw new Error(
    `Failed to generate a valid puzzle after ${MAX_GENERATION_ATTEMPTS} attempts ` +
      `(seed: ${config.seed}, maxHeight: ${config.maxHeight})`,
  );
}

// ---------------------------------------------------------------------------
// Private helpers
// ---------------------------------------------------------------------------

function buildPuzzleObject(
  result: { heightMap: readonly (readonly number[])[]; shapeFamily: string; recipeName: string },
  config: PuzzleGenerationConfig,
  effectiveSeed: number,
  totalCubes: number,
  maximumHeight: number,
  analysis: { score: number; hiddenCubeEstimate: number },
  occlusionScore: number,
  readabilityScore: number,
  attempt: number,
): Puzzle {
  const metadata: PuzzleMetadata = Object.freeze({
    seed: effectiveSeed,
    difficulty: config.difficulty,
    shapeFamily: result.shapeFamily,
    recipeName: result.recipeName,
    complexityScore: Math.round(analysis.score * 1000) / 1000,
    occlusionScore: Math.round(occlusionScore * 1000) / 1000,
    readabilityScore: Math.round(readabilityScore * 1000) / 1000,
    hiddenCubeEstimate: analysis.hiddenCubeEstimate,
    generationAttempts: attempt + 1,
    generationTimestamp: Date.now(),
  });

  const frozenHeightMap = Object.freeze(
    result.heightMap.map((row: readonly number[]) => Object.freeze([...row])),
  );

  return Object.freeze({
    heightMap: frozenHeightMap,
    totalCubes,
    maximumHeight,
    boardSize: BOARD_SIZE,
    metadata,
  });
}
