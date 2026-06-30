import type { HeightMap } from '../models/Puzzle';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * Per-cell occlusion breakdown for diagnostic use.
 */
export interface OcclusionAnalysis {
  /**
   * Normalized occlusion score in [0, 1].
   *  0 = perfectly visible, every stack contributes information.
   *  1 = maximally occluded, stacks cannot reasonably be inferred.
   */
  readonly score: number;
  /** Number of stacks that are partially or fully occluded. */
  readonly occludedStackCount: number;
  /** Estimated number of cubes hidden by taller front neighbours. */
  readonly hiddenCubeCount: number;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Analyzes isometric occlusion for a puzzle height map.
 *
 * Occlusion model:
 *   The fixed isometric camera views the board from the front-right-top.
 *   A stack at (r, c) is front-occluded if the stack immediately in front
 *   of it (r+1, c) — which is closer to the camera — is strictly taller.
 *   Likewise it may be side-occluded by the stack at (r, c-1) (to its right
 *   in isometric projection, i.e. the column closer to the viewer).
 *
 *   For each occluded stack the hidden cube count is the excess height of
 *   the taller front/side neighbour over the occluded stack, clamped to the
 *   occluded stack's own height (a stack cannot hide more cubes than it has).
 *
 *   The composite occlusion score is:
 *     hiddenCubes / max(1, totalCubes)
 *
 *   This is bounded in [0, 1] and penalises layouts where large numbers of
 *   cubes are inaccessible to the player's view.
 *
 * @param heightMap - The puzzle grid.
 * @param boardSize - Grid dimensions.
 * @returns OcclusionAnalysis with score, counts, and per-stack data.
 */
export function analyzeOcclusion(
  heightMap: HeightMap,
  boardSize: number,
): OcclusionAnalysis {
  let totalCubes = 0;
  let hiddenCubeCount = 0;
  let occludedStackCount = 0;

  for (let r = 0; r < boardSize; r++) {
    for (let c = 0; c < boardSize; c++) {
      const h = heightMap[r][c];
      if (h === 0) continue;

      totalCubes += h;

      // Tallest front neighbour: the cell in front of (r,c) in isometric view.
      // Front = row+1 (nearer row to the camera in front-right projection).
      const frontHeight = r + 1 < boardSize ? heightMap[r + 1][c] : 0;

      // Side neighbour: column to the right in isometric space (c-1 in grid coords).
      const sideHeight = c - 1 >= 0 ? heightMap[r][c - 1] : 0;

      // How many cubes are hidden by the tallest blocker
      const maxBlocker = Math.max(frontHeight, sideHeight);
      const occluded = Math.max(0, maxBlocker - h);

      if (occluded > 0) {
        // Clamp: can't hide more cubes than the stack has
        hiddenCubeCount += Math.min(occluded, h);
        occludedStackCount++;
      }
    }
  }

  const score = totalCubes > 0 ? hiddenCubeCount / totalCubes : 0;

  return {
    score: Math.min(1, score),
    occludedStackCount,
    hiddenCubeCount,
  };
}
