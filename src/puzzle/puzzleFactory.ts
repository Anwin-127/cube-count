import { SeededRandom } from './random';
import { generateHeightMap } from './heightMapGenerator';
import { countTotalCubes, findMaximumHeight } from './cubeCounter';
import { validateHeightMap } from './puzzleValidator';
import { analyzeComplexity } from './complexityAnalyzer';
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
}

/**
 * Maximum number of generation attempts before giving up.
 *
 * Shape generation may produce invalid results (disconnected, too small).
 * Each retry uses a different effective seed to advance the RNG state.
 */
const MAX_GENERATION_ATTEMPTS = 20;

/**
 * Creates a complete, immutable Puzzle object from a generation config.
 *
 * Pipeline:
 * 1. Seed a PRNG with the given seed.
 * 2. Generate a shape-based height map (with retry on invalid shapes).
 * 3. Validate the result.
 * 4. Analyze complexity (score + hidden cube estimate).
 * 5. Create metadata with shape family and generation stats.
 * 6. Deep-freeze and return the puzzle.
 *
 * The puzzle is deeply frozen: neither the puzzle object, nor its
 * height map rows, nor its metadata can be modified after creation.
 *
 * @throws Error if a valid puzzle cannot be generated within MAX_GENERATION_ATTEMPTS.
 */
export function createPuzzle(config: PuzzleGenerationConfig): Puzzle {
  for (let attempt = 0; attempt < MAX_GENERATION_ATTEMPTS; attempt++) {
    const effectiveSeed = config.seed + attempt;
    const rng = new SeededRandom(effectiveSeed);

    // Step 1: Shape-based height map generation
    const result = generateHeightMap(rng, {
      boardSize: BOARD_SIZE,
      maxHeight: config.maxHeight,
    });

    // Skip invalid shapes (disconnected, too small)
    if (!result.isValid) continue;

    // Step 2: Validate the height map
    const validation = validateHeightMap(
      result.heightMap,
      BOARD_SIZE,
      config.maxHeight,
    );
    if (!validation.isValid) continue;

    // Step 3: Calculate metrics
    const totalCubes = countTotalCubes(result.heightMap);
    const maximumHeight = findMaximumHeight(result.heightMap);

    // Step 4: Analyze complexity
    const analysis = analyzeComplexity(
      result.heightMap,
      BOARD_SIZE,
      config.maxHeight,
    );

    // Step 5: Build metadata
    const metadata: PuzzleMetadata = Object.freeze({
      seed: config.seed,
      difficulty: config.difficulty,
      shapeFamily: result.shapeFamily,
      complexityScore: Math.round(analysis.score * 1000) / 1000,
      hiddenCubeEstimate: analysis.hiddenCubeEstimate,
      generationAttempts: attempt + 1,
      generationTimestamp: Date.now(),
    });

    // Step 6: Deep freeze and return
    const frozenHeightMap = Object.freeze(
      result.heightMap.map((row) => Object.freeze([...row])),
    );

    return Object.freeze({
      heightMap: frozenHeightMap,
      totalCubes,
      maximumHeight,
      boardSize: BOARD_SIZE,
      metadata,
    });
  }

  throw new Error(
    `Failed to generate a valid puzzle after ${MAX_GENERATION_ATTEMPTS} attempts ` +
      `(seed: ${config.seed}, maxHeight: ${config.maxHeight})`,
  );
}
