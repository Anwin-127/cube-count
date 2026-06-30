import type { HeightMap } from '../models/Puzzle';

/**
 * Individual complexity factors, each normalized to [0, 1].
 */
export interface ComplexityFactors {
  /** Proportion of total possible cubes. */
  readonly cubeCountFactor: number;
  /** Height variation relative to the max possible. */
  readonly heightVariationFactor: number;
  /** Proportion of board cells occupied. */
  readonly densityFactor: number;
  /**
   * Ratio of hidden cubes to total cubes.
   *
   * Weight deliberately kept low (0.15) under the new philosophy:
   * difficulty should come from counting skill, not visual obstruction.
   */
  readonly hiddenRatioFactor: number;
}

/**
 * Complete analysis result for a puzzle.
 */
export interface ComplexityAnalysis {
  readonly factors: ComplexityFactors;
  /** Weighted composite score in [0, 1]. */
  readonly score: number;
  /** Estimated count of cubes hidden from the isometric viewpoint. */
  readonly hiddenCubeEstimate: number;
}

/**
 * Weights for each complexity factor.
 *
 * Redesigned under the new gameplay-quality philosophy:
 *
 *  heightVariation (0.35) — Primary driver of interesting, memorable puzzles.
 *                           Varied stacks force careful counting.
 *  cubeCount       (0.25) — More cubes mean more counting work.
 *  density         (0.25) — Denser layouts are harder to parse at speed.
 *  hiddenRatio     (0.15) — Reduced from 0.35: hidden cubes are no longer
 *                           the primary complexity objective. Fairness and
 *                           readability take priority.
 *
 * Sum = 1.0.
 */
const WEIGHTS = {
  heightVariation: 0.35,
  cubeCount: 0.25,
  density: 0.25,
  hiddenRatio: 0.15,
} as const;

/**
 * Analyzes a puzzle's complexity across multiple dimensions.
 *
 * Returns a normalized score in [0, 1] where:
 *   0 = trivially simple (few cubes, flat, sparse)
 *   1 = maximally complex (many cubes, varied heights, dense)
 *
 * @param heightMap - The puzzle grid.
 * @param boardSize - Grid dimensions.
 * @param maxHeight - Maximum possible stack height.
 * @returns Complete analysis with individual factors and composite score.
 */
export function analyzeComplexity(
  heightMap: HeightMap,
  boardSize: number,
  maxHeight: number,
): ComplexityAnalysis {
  const totalCells = boardSize * boardSize;
  const maxPossibleCubes = totalCells * maxHeight;

  let totalCubes = 0;
  let activeCells = 0;
  const heights: number[] = [];

  for (const row of heightMap) {
    for (const h of row) {
      totalCubes += h;
      if (h > 0) {
        activeCells++;
        heights.push(h);
      }
    }
  }

  // Cube count factor: ratio of actual cubes to maximum possible
  const cubeCountFactor =
    maxPossibleCubes > 0 ? totalCubes / maxPossibleCubes : 0;

  // Height variation factor: coefficient of variation (std dev / mean)
  // normalized against theoretical max variation
  const heightVariationFactor = calculateHeightVariation(heights, maxHeight);

  // Density factor: ratio of filled cells to total cells
  const densityFactor = totalCells > 0 ? activeCells / totalCells : 0;

  // Hidden cube estimate and ratio
  const hiddenCubeEstimate = estimateHiddenCubes(heightMap);
  const hiddenRatioFactor =
    totalCubes > 0 ? hiddenCubeEstimate / totalCubes : 0;

  const factors: ComplexityFactors = {
    cubeCountFactor,
    heightVariationFactor,
    densityFactor,
    hiddenRatioFactor,
  };

  // Weighted composite score
  const score =
    factors.heightVariationFactor * WEIGHTS.heightVariation +
    factors.cubeCountFactor * WEIGHTS.cubeCount +
    factors.densityFactor * WEIGHTS.density +
    factors.hiddenRatioFactor * WEIGHTS.hiddenRatio;

  return { factors, score, hiddenCubeEstimate };
}

/**
 * Calculates a normalized height variation factor.
 *
 * Uses the coefficient of variation (std_dev / mean),
 * capped at 1.0, to measure how varied the heights are.
 * More variation = harder to mentally sum.
 */
function calculateHeightVariation(
  heights: number[],
  maxHeight: number,
): number {
  if (heights.length < 2 || maxHeight <= 1) return 0;

  const mean = heights.reduce((sum, h) => sum + h, 0) / heights.length;
  if (mean === 0) return 0;

  const variance =
    heights.reduce((sum, h) => sum + (h - mean) ** 2, 0) / heights.length;
  const stdDev = Math.sqrt(variance);

  // Normalize: max theoretical std dev for uniform distribution over [1, maxHeight]
  // is approximately (maxHeight - 1) / (2 * sqrt(3))
  const maxTheoreticalStdDev = (maxHeight - 1) / (2 * Math.sqrt(3));

  return maxTheoreticalStdDev > 0
    ? Math.min(1, stdDev / maxTheoreticalStdDev)
    : 0;
}

/**
 * Estimates the number of cubes hidden from the standard isometric viewpoint.
 *
 * Conservative estimate: any cube below the top of its stack is "hidden"
 * from directly above, requiring mental inference by the player.
 */
function estimateHiddenCubes(heightMap: HeightMap): number {
  let hidden = 0;
  for (const row of heightMap) {
    for (const h of row) {
      if (h > 1) {
        hidden += h - 1;
      }
    }
  }
  return hidden;
}
