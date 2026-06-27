import type { SeededRandom } from './random';
import type { ShapeMask } from './shapes';

/**
 * Assigns stack heights to active cells in a shape mask.
 *
 * Strategy: Edge-distance gradient with random perturbation.
 *
 * 1. Calculate each active cell's distance to the nearest
 *    shape edge (using BFS from boundary cells).
 * 2. Normalize distances: edge cells get lower heights,
 *    interior cells get higher heights.
 * 3. Add random perturbation (±1) for visual variety.
 * 4. Clamp all heights to [1, maxHeight].
 *
 * This produces smooth, natural-looking height gradients
 * that avoid unrealistic discontinuities.
 *
 * @param mask - Boolean grid indicating which cells are active.
 * @param rng - Seeded RNG for perturbation (state is advanced).
 * @param maxHeight - Maximum allowed stack height.
 * @returns A 2D grid of integer heights. Inactive cells are 0.
 */
export function assignHeights(
  mask: ShapeMask,
  rng: SeededRandom,
  maxHeight: number,
): number[][] {
  const size = mask.length;
  const heights: number[][] = Array.from({ length: size }, () =>
    Array(size).fill(0) as number[],
  );

  // Step 1: Calculate edge distances via BFS
  const edgeDist = calculateEdgeDistances(mask, size);

  // Step 2: Find the maximum edge distance for normalization
  let maxDist = 0;
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (edgeDist[r][c] > maxDist) {
        maxDist = edgeDist[r][c];
      }
    }
  }

  // Step 3: Assign heights based on normalized edge distance
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (!mask[r][c]) continue;

      // Normalize to [0, 1] range
      const normalized = maxDist > 0 ? edgeDist[r][c] / maxDist : 0;

      // Scale to height range: edge cells get base of 1, interior scales up
      const baseHeight = 1 + Math.round(normalized * (maxHeight - 1));

      // Add random perturbation for variety
      const perturbation = rng.nextInt(-1, 1);

      // Clamp to valid range: active cells always have at least 1 cube
      heights[r][c] = Math.max(1, Math.min(maxHeight, baseHeight + perturbation));
    }
  }

  return heights;
}

/**
 * Calculates the minimum distance from each active cell to the
 * nearest shape edge using BFS from all boundary cells.
 *
 * A cell is a "boundary cell" if it is active AND is adjacent
 * to an inactive cell or a board edge.
 *
 * Interior cells get distances >= 2, deep interior cells get higher values.
 */
function calculateEdgeDistances(mask: ShapeMask, size: number): number[][] {
  const dist: number[][] = Array.from({ length: size }, () =>
    Array(size).fill(0) as number[],
  );

  const directions: readonly [number, number][] = [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
  ];

  // Initialize: edge cells of the shape start at distance 1
  const queue: [number, number][] = [];

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (!mask[r][c]) continue;

      // Check if this cell borders an empty cell or the board edge
      const isEdge =
        r === 0 ||
        r === size - 1 ||
        c === 0 ||
        c === size - 1 ||
        directions.some(([dr, dc]) => {
          const nr = r + dr;
          const nc = c + dc;
          return nr < 0 || nr >= size || nc < 0 || nc >= size || !mask[nr][nc];
        });

      if (isEdge) {
        dist[r][c] = 1;
        queue.push([r, c]);
      }
    }
  }

  // BFS inward: assign increasing distances to interior cells
  let head = 0;
  while (head < queue.length) {
    const [r, c] = queue[head++];
    for (const [dr, dc] of directions) {
      const nr = r + dr;
      const nc = c + dc;
      if (
        nr >= 0 &&
        nr < size &&
        nc >= 0 &&
        nc < size &&
        mask[nr][nc] &&
        dist[nr][nc] === 0
      ) {
        dist[nr][nc] = dist[r][c] + 1;
        queue.push([nr, nc]);
      }
    }
  }

  return dist;
}
