import type { SeededRandom } from './random';
import type { ShapeMask } from './shapes';

// ---------------------------------------------------------------------------
// Height Strategy
// ---------------------------------------------------------------------------

/**
 * Named height assignment strategies.
 *
 * Each strategy produces a distinct qualitative height distribution,
 * giving puzzles unique silhouettes and memorability.
 */
export const HeightStrategy = {
  /** Low edges, high interior (classic hill shape). */
  EDGE_GRADIENT: 'EDGE_GRADIENT',
  /** High edges, low interior (moat / fortress wall). */
  INVERSE_GRADIENT: 'INVERSE_GRADIENT',
  /** One corner is tallest; heights fade diagonally across the board. */
  CORNER_PEAK: 'CORNER_PEAK',
  /** Two distant active cells reach maximum height; others fade between them. */
  TWIN_PEAKS: 'TWIN_PEAKS',
  /** Heights increase monotonically along one axis (left→right or top→bottom). */
  STAIRCASE: 'STAIRCASE',
  /** Most cells share a common base height; one landmark is noticeably taller. */
  UNIFORM: 'UNIFORM',
  /** Each active cell is assigned a random height in [1, maxHeight]. */
  RANDOM_VARIED: 'RANDOM_VARIED',
  /**
   * Most cells stay at height 1; 1–3 randomly chosen cells spike to maxHeight.
   * Creates genuine "tower in a field" layouts with dramatic height contrast.
   */
  SPIKE: 'SPIKE',
} as const;

export type HeightStrategy = (typeof HeightStrategy)[keyof typeof HeightStrategy];

// ---------------------------------------------------------------------------
// Landmark Type
// ---------------------------------------------------------------------------

/**
 * Landmark focal points that make puzzles memorable.
 *
 * After the primary height strategy runs, landmark enforcement is applied
 * as a post-processing step to guarantee a recognisable focal point.
 */
export const LandmarkType = {
  /** No enforced focal point — the strategy result stands as-is. */
  NONE: 'NONE',
  /** The active cell nearest to a board corner reaches maximum height. */
  CORNER_TOWER: 'CORNER_TOWER',
  /** The active cell nearest to the board centre reaches maximum height. */
  CENTRAL_PEAK: 'CENTRAL_PEAK',
  /** The two most distant active cells both reach maximum height. */
  TWIN_TOWERS: 'TWIN_TOWERS',
  /** A landmark cell reaches maximum height; surrounding cells stay lower. */
  PLATEAU: 'PLATEAU',
  /** Heights must strictly increase along one axis — no post-processing needed. */
  STAIRCASE: 'STAIRCASE',
  /** The tallest column is emphasized; its cells reach maximum height. */
  SKYLINE: 'SKYLINE',
} as const;

export type LandmarkType = (typeof LandmarkType)[keyof typeof LandmarkType];

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Assigns stack heights to active cells in a shape mask.
 *
 * The strategy controls the overall height distribution character.
 * The landmark enforces a memorable focal point as a post-processing step.
 *
 * @param mask - Boolean grid indicating which cells are active.
 * @param rng - Seeded RNG (state is advanced).
 * @param maxHeight - Maximum allowed stack height.
 * @param strategy - Height distribution strategy.
 * @param landmark - Focal point to enforce after strategy assignment.
 * @returns A 2D grid of integer heights. Inactive cells are 0.
 */
export function assignHeights(
  mask: ShapeMask,
  rng: SeededRandom,
  maxHeight: number,
  strategy: HeightStrategy = HeightStrategy.EDGE_GRADIENT,
  landmark: LandmarkType = LandmarkType.NONE,
): number[][] {
  const size = mask.length;
  const heights: number[][] = Array.from({ length: size }, () =>
    Array(size).fill(0) as number[],
  );

  // Apply the selected height distribution strategy
  switch (strategy) {
    case HeightStrategy.EDGE_GRADIENT:
      applyEdgeGradient(heights, mask, rng, maxHeight, size, false);
      break;
    case HeightStrategy.INVERSE_GRADIENT:
      applyEdgeGradient(heights, mask, rng, maxHeight, size, true);
      break;
    case HeightStrategy.CORNER_PEAK:
      applyCornerPeak(heights, mask, rng, maxHeight, size);
      break;
    case HeightStrategy.TWIN_PEAKS:
      applyTwinPeaks(heights, mask, rng, maxHeight, size);
      break;
    case HeightStrategy.STAIRCASE:
      applyStaircase(heights, mask, rng, maxHeight, size);
      break;
    case HeightStrategy.UNIFORM:
      applyUniform(heights, mask, rng, maxHeight);
      break;
    case HeightStrategy.RANDOM_VARIED:
      applyRandomVaried(heights, mask, rng, maxHeight);
      break;
    case HeightStrategy.SPIKE:
      applySpike(heights, mask, rng, maxHeight);
      break;
  }

  // Enforce the landmark focal point
  if (landmark !== LandmarkType.NONE) {
    enforceLandmark(heights, mask, landmark, maxHeight, rng, size);
  }

  return heights;
}

// ---------------------------------------------------------------------------
// Strategy implementations
// ---------------------------------------------------------------------------

/**
 * Edge-distance gradient (EDGE_GRADIENT / INVERSE_GRADIENT).
 *
 * 1. BFS from every boundary cell of the shape to calculate inward distance.
 * 2. Normalize distances and scale to the height range.
 * 3. Add ±1 perturbation.
 * 4. If inverted: edge cells get maxHeight, interior gets lower values.
 */
function applyEdgeGradient(
  heights: number[][],
  mask: ShapeMask,
  rng: SeededRandom,
  maxHeight: number,
  size: number,
  invert: boolean,
): void {
  const edgeDist = calculateEdgeDistances(mask, size);

  let maxDist = 0;
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (edgeDist[r][c] > maxDist) maxDist = edgeDist[r][c];
    }
  }

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (!mask[r][c]) continue;

      const normalized = maxDist > 0 ? edgeDist[r][c] / maxDist : 0;
      const gradient = invert ? 1 - normalized : normalized;
      const baseHeight = 1 + Math.round(gradient * (maxHeight - 1));
      const perturbation = rng.nextInt(-1, 1);
      heights[r][c] = Math.max(1, Math.min(maxHeight, baseHeight + perturbation));
    }
  }
}

/**
 * Corner peak: heights decrease as Manhattan distance from a chosen corner
 * increases. The corner cell is always the tallest.
 */
function applyCornerPeak(
  heights: number[][],
  mask: ShapeMask,
  rng: SeededRandom,
  maxHeight: number,
  size: number,
): void {
  const corner = rng.nextInt(0, 3);
  const cornerR = corner < 2 ? 0 : size - 1;
  const cornerC = corner % 2 === 0 ? 0 : size - 1;
  const maxPossibleDist = (size - 1) * 2;

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (!mask[r][c]) continue;

      const dist = Math.abs(r - cornerR) + Math.abs(c - cornerC);
      const normalized = maxPossibleDist > 0 ? dist / maxPossibleDist : 0;
      const baseHeight = maxHeight - Math.round(normalized * (maxHeight - 1));
      const perturbation = rng.nextInt(-1, 1);
      heights[r][c] = Math.max(1, Math.min(maxHeight, baseHeight + perturbation));
    }
  }
}

/**
 * Twin peaks: find the two most distant active cells; each becomes a peak
 * at maxHeight. Other cells fade based on their distance to the nearer peak.
 */
function applyTwinPeaks(
  heights: number[][],
  mask: ShapeMask,
  rng: SeededRandom,
  maxHeight: number,
  size: number,
): void {
  const active = collectActiveCells(mask, size);
  if (active.length < 2) {
    applyEdgeGradient(heights, mask, rng, maxHeight, size, false);
    return;
  }

  const [peak1, peak2] = findMostDistantPair(active);
  const maxPossibleDist = (size - 1) * 2;

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (!mask[r][c]) continue;

      const d1 = Math.abs(r - peak1[0]) + Math.abs(c - peak1[1]);
      const d2 = Math.abs(r - peak2[0]) + Math.abs(c - peak2[1]);
      const minDist = Math.min(d1, d2);
      const normalized = maxPossibleDist > 0 ? minDist / maxPossibleDist : 0;
      const baseHeight = maxHeight - Math.round(normalized * (maxHeight - 1));
      const perturbation = rng.nextInt(-1, 1);
      heights[r][c] = Math.max(1, Math.min(maxHeight, baseHeight + perturbation));
    }
  }
}

/**
 * Staircase: heights increase linearly along a randomly chosen axis
 * (column-wise or row-wise). Optional reverse direction.
 */
function applyStaircase(
  heights: number[][],
  mask: ShapeMask,
  rng: SeededRandom,
  maxHeight: number,
  size: number,
): void {
  const useColumn = rng.nextInt(0, 1) === 0;
  const reverse = rng.nextInt(0, 1) === 1;

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (!mask[r][c]) continue;

      const axis = useColumn ? c : r;
      const normalized = (size - 1) > 0 ? axis / (size - 1) : 0;
      const gradient = reverse ? 1 - normalized : normalized;
      const baseHeight = 1 + Math.round(gradient * (maxHeight - 1));
      const perturbation = rng.nextInt(-1, 0); // slight perturbation downward only
      heights[r][c] = Math.max(1, Math.min(maxHeight, baseHeight + perturbation));
    }
  }
}

/**
 * Uniform: all active cells share a common base height in the lower-to-mid
 * range, with a ±1 perturbation for visual texture.
 */
function applyUniform(
  heights: number[][],
  mask: ShapeMask,
  rng: SeededRandom,
  maxHeight: number,
): void {
  const baseHeight = Math.max(1, Math.round(maxHeight * 0.5));
  const size = mask.length;

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (!mask[r][c]) continue;
      const perturbation = rng.nextInt(-1, 1);
      heights[r][c] = Math.max(1, Math.min(maxHeight, baseHeight + perturbation));
    }
  }
}

/**
 * Spike: most cells stay at height 1; a small number of randomly chosen
 * active cells rise dramatically to maxHeight (or near it).
 *
 * This is the strategy that produces genuine "tower" layouts:
 * isolated tall stacks surrounded by flat single-cube surroundings.
 *
 * Number of spike towers: 1 for small maxHeight, up to 3 for tall maxHeight.
 */
function applySpike(
  heights: number[][],
  mask: ShapeMask,
  rng: SeededRandom,
  maxHeight: number,
): void {
  const size = mask.length;
  const active = collectActiveCells(mask, size);
  if (active.length === 0) return;

  // All cells start at height 1
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (mask[r][c]) heights[r][c] = 1;
    }
  }

  // Choose 1–3 random non-adjacent spike positions
  const maxSpikes = Math.min(3, Math.max(1, Math.floor(maxHeight / 2)));
  const shuffled = [...active].sort(() => rng.nextInt(0, 1) === 0 ? -1 : 1);
  const spikeCells: [number, number][] = [];

  for (const candidate of shuffled) {
    if (spikeCells.length >= maxSpikes) break;

    // Reject if too close to an existing spike (min distance = 3)
    // Distance < 3 rejects adjacent (1), diagonal (2), and 1-cell straight gaps (2).
    const tooClose = spikeCells.some(
      ([sr, sc]) =>
        Math.abs(candidate[0] - sr) + Math.abs(candidate[1] - sc) < 3,
    );
    if (!tooClose) spikeCells.push(candidate);
  }

  // Set each spike cell to maxHeight or maxHeight-1 (for visual variety)
  for (const [r, c] of spikeCells) {
    heights[r][c] = maxHeight - rng.nextInt(0, 1);
  }
}

/**
 * Random varied: each active cell independently gets a random height in
 * [1, maxHeight]. Produces unpredictable, chaotic-looking puzzles.
 */
function applyRandomVaried(
  heights: number[][],
  mask: ShapeMask,
  rng: SeededRandom,
  maxHeight: number,
): void {
  const size = mask.length;
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (!mask[r][c]) continue;
      heights[r][c] = rng.nextInt(1, maxHeight);
    }
  }
}

// ---------------------------------------------------------------------------
// Landmark enforcement
// ---------------------------------------------------------------------------

/**
 * Post-processing step that guarantees a recognisable focal point.
 * Applied after the primary height strategy has run.
 */
function enforceLandmark(
  heights: number[][],
  mask: ShapeMask,
  landmark: LandmarkType,
  maxHeight: number,
  rng: SeededRandom,
  size: number,
): void {
  const active = collectActiveCells(mask, size);
  if (active.length === 0) return;

  switch (landmark) {
    case LandmarkType.CORNER_TOWER: {
      // The active cell closest to any corner reaches maxHeight
      const corners: [number, number][] = [
        [0, 0], [0, size - 1], [size - 1, 0], [size - 1, size - 1],
      ];
      let best: [number, number] = active[0];
      let bestDist = Infinity;
      for (const [cr, cc] of corners) {
        for (const [ar, ac] of active) {
          const d = Math.abs(ar - cr) + Math.abs(ac - cc);
          if (d < bestDist) { bestDist = d; best = [ar, ac]; }
        }
      }
      heights[best[0]][best[1]] = maxHeight;
      break;
    }

    case LandmarkType.CENTRAL_PEAK: {
      // The active cell closest to the board centre reaches maxHeight
      const cr = Math.floor(size / 2);
      const cc = Math.floor(size / 2);
      const nearest = findNearestActive(active, cr, cc);
      heights[nearest[0]][nearest[1]] = maxHeight;
      break;
    }

    case LandmarkType.TWIN_TOWERS: {
      // The two most distant active cells both reach maxHeight
      const [p1, p2] = findMostDistantPair(active);
      heights[p1[0]][p1[1]] = maxHeight;
      heights[p2[0]][p2[1]] = maxHeight;
      break;
    }

    case LandmarkType.PLATEAU: {
      // One random active cell reaches maxHeight (the landmark atop the plateau)
      const pick = active[rng.nextInt(0, active.length - 1)];
      heights[pick[0]][pick[1]] = maxHeight;
      break;
    }

    case LandmarkType.SKYLINE: {
      // Find the column with the most active cells and set its topmost cell to maxHeight
      const colCounts = Array(size).fill(0);
      for (const [r, c] of active) {
        void r;
        colCounts[c]++;
      }
      const tallestCol = colCounts.indexOf(Math.max(...colCounts));
      const colCells = active.filter(([, c]) => c === tallestCol);
      if (colCells.length > 0) {
        const topCell = colCells.reduce((a, b) => (a[0] < b[0] ? a : b));
        heights[topCell[0]][topCell[1]] = maxHeight;
      }
      break;
    }

    case LandmarkType.STAIRCASE:
    case LandmarkType.NONE:
    default:
      // No post-processing needed
      break;
  }
}

// ---------------------------------------------------------------------------
// Private helpers
// ---------------------------------------------------------------------------

/**
 * Calculates the minimum distance from each active cell to the
 * nearest shape edge using BFS from all boundary cells.
 */
function calculateEdgeDistances(mask: ShapeMask, size: number): number[][] {
  const dist: number[][] = Array.from({ length: size }, () =>
    Array(size).fill(0) as number[],
  );

  const directions: readonly [number, number][] = [
    [-1, 0], [1, 0], [0, -1], [0, 1],
  ];

  const queue: [number, number][] = [];

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (!mask[r][c]) continue;

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

/** Collects coordinates of all active (true) cells in the mask. */
function collectActiveCells(mask: ShapeMask, size: number): [number, number][] {
  const cells: [number, number][] = [];
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (mask[r][c]) cells.push([r, c]);
    }
  }
  return cells;
}

/** Returns the active cell with the smallest Manhattan distance to (targetR, targetC). */
function findNearestActive(
  active: [number, number][],
  targetR: number,
  targetC: number,
): [number, number] {
  let best = active[0];
  let bestDist = Infinity;
  for (const [r, c] of active) {
    const d = Math.abs(r - targetR) + Math.abs(c - targetC);
    if (d < bestDist) { bestDist = d; best = [r, c]; }
  }
  return best;
}

/**
 * Finds the pair of active cells with the maximum Manhattan distance between them.
 * O(n²) — fine for 5×5 boards (≤ 25 cells, ≤ 300 comparisons).
 */
function findMostDistantPair(
  active: [number, number][],
): [[number, number], [number, number]] {
  let maxDist = 0;
  let bestI = 0;
  let bestJ = Math.min(1, active.length - 1);

  for (let i = 0; i < active.length; i++) {
    for (let j = i + 1; j < active.length; j++) {
      const d = Math.abs(active[i][0] - active[j][0]) + Math.abs(active[i][1] - active[j][1]);
      if (d > maxDist) { maxDist = d; bestI = i; bestJ = j; }
    }
  }

  return [active[bestI], active[bestJ]];
}
