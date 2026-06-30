import type { HeightMap } from '../models/Puzzle';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * Readability analysis result for a generated puzzle.
 *
 * A highly readable puzzle:
 *  - Has clearly distinguishable stack heights (neighbours differ visibly).
 *  - Has an interesting silhouette from multiple viewing axes.
 *  - Avoids large uniform regions that look monotonous.
 *  - Keeps the height distribution balanced (not all max, not all min).
 */
export interface ReadabilityAnalysis {
  /**
   * Normalized readability score in [0, 1].
   *  0 = very hard to parse (uniform, monotonous, or erratic).
   *  1 = immediately readable (clear structure, varied heights, good silhouette).
   */
  readonly score: number;
  /** Proportion of neighbouring stack pairs that have distinguishable heights. */
  readonly distinctNeighbourRatio: number;
  /** Silhouette interest: normalized variation in column and row height sums. */
  readonly silhouetteVariance: number;
  /** Height balance: how evenly the height values are spread across [1, maxHeight]. */
  readonly heightBalance: number;
}

// ---------------------------------------------------------------------------
// Weights
// ---------------------------------------------------------------------------

const WEIGHTS = {
  distinctNeighbours: 0.40,
  silhouette: 0.35,
  heightBalance: 0.25,
} as const;

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Scores a puzzle on how readable it is from the isometric viewpoint.
 *
 * This is a *positive* quality signal — unlike occlusion (which is penalised),
 * readability is *rewarded*. The factory uses this score to prefer
 * more readable candidates among those that pass all hard gates.
 *
 * @param heightMap - The puzzle grid.
 * @param boardSize - Grid dimensions.
 * @param maxHeight - Maximum allowed stack height for normalization.
 * @returns ReadabilityAnalysis with composite score and factor breakdown.
 */
export function scoreReadability(
  heightMap: HeightMap,
  boardSize: number,
  maxHeight: number,
): ReadabilityAnalysis {
  const distinctNeighbourRatio = calculateDistinctNeighbourRatio(heightMap, boardSize);
  const silhouetteVariance = calculateSilhouetteVariance(heightMap, boardSize);
  const heightBalance = calculateHeightBalance(heightMap, boardSize, maxHeight);

  const score =
    distinctNeighbourRatio * WEIGHTS.distinctNeighbours +
    silhouetteVariance * WEIGHTS.silhouette +
    heightBalance * WEIGHTS.heightBalance;

  return {
    score: Math.min(1, Math.max(0, score)),
    distinctNeighbourRatio,
    silhouetteVariance,
    heightBalance,
  };
}

// ---------------------------------------------------------------------------
// Factor calculations
// ---------------------------------------------------------------------------

/**
 * Proportion of 4-connected active neighbour pairs whose heights differ by
 * at least 1. When most neighbours have different heights, the eye can
 * easily count and separate the stacks.
 */
function calculateDistinctNeighbourRatio(
  heightMap: HeightMap,
  boardSize: number,
): number {
  const directions: readonly [number, number][] = [[0, 1], [1, 0]];
  let total = 0;
  let distinct = 0;

  for (let r = 0; r < boardSize; r++) {
    for (let c = 0; c < boardSize; c++) {
      const h = heightMap[r][c];
      if (h === 0) continue;

      for (const [dr, dc] of directions) {
        const nr = r + dr;
        const nc = c + dc;
        if (nr >= boardSize || nc >= boardSize) continue;
        const nh = heightMap[nr][nc];
        if (nh === 0) continue;

        total++;
        if (h !== nh) distinct++;
      }
    }
  }

  return total > 0 ? distinct / total : 0;
}

/**
 * Measures how interesting the puzzle silhouette is by computing the
 * coefficient of variation (CV) of both row-sum and column-sum profiles.
 *
 * A flat layout has CV ≈ 0 (boring silhouette).
 * A varied skyline has high CV (recognisable silhouette).
 *
 * The two CVs are averaged and normalized to [0, 1].
 */
function calculateSilhouetteVariance(
  heightMap: HeightMap,
  boardSize: number,
): number {
  const rowSums = Array(boardSize).fill(0) as number[];
  const colSums = Array(boardSize).fill(0) as number[];

  for (let r = 0; r < boardSize; r++) {
    for (let c = 0; c < boardSize; c++) {
      rowSums[r] += heightMap[r][c];
      colSums[c] += heightMap[r][c];
    }
  }

  const rowCV = coefficientOfVariation(rowSums);
  const colCV = coefficientOfVariation(colSums);

  // Normalize: a CV of 1.0+ is considered maximally varied
  const avgCV = (rowCV + colCV) / 2;
  return Math.min(1, avgCV);
}

/**
 * Returns the coefficient of variation (std_dev / mean) for an array.
 * Returns 0 if mean is 0.
 */
function coefficientOfVariation(values: number[]): number {
  const n = values.length;
  if (n === 0) return 0;

  const mean = values.reduce((s, v) => s + v, 0) / n;
  if (mean === 0) return 0;

  const variance = values.reduce((s, v) => s + (v - mean) ** 2, 0) / n;
  return Math.sqrt(variance) / mean;
}

/**
 * Measures how well-balanced the height distribution is.
 *
 * A perfectly balanced puzzle uses all heights from 1 to maxHeight roughly
 * equally. A puzzle where all active cells have the same height has low
 * balance (not interesting). A puzzle where all cells have the max height
 * is also unbalanced (nothing to compare against).
 *
 * Uses entropy of the height frequency distribution, normalized to [0, 1].
 */
function calculateHeightBalance(
  heightMap: HeightMap,
  boardSize: number,
  maxHeight: number,
): number {
  if (maxHeight <= 1) {
    // With only one possible height, balance is trivially perfect
    return 1;
  }

  const freq = Array(maxHeight + 1).fill(0) as number[];
  let activeCells = 0;

  for (let r = 0; r < boardSize; r++) {
    for (let c = 0; c < boardSize; c++) {
      const h = heightMap[r][c];
      if (h > 0) {
        freq[h]++;
        activeCells++;
      }
    }
  }

  if (activeCells === 0) return 0;

  // Shannon entropy of the height distribution
  let entropy = 0;
  for (let h = 1; h <= maxHeight; h++) {
    const p = freq[h] / activeCells;
    if (p > 0) entropy -= p * Math.log2(p);
  }

  // Normalize by max possible entropy (uniform distribution over maxHeight values)
  const maxEntropy = Math.log2(maxHeight);
  return maxEntropy > 0 ? entropy / maxEntropy : 1;
}
