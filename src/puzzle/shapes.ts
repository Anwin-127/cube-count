import type { SeededRandom } from './random';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * Shape families define the 2D footprint of a puzzle.
 * Heights are assigned separately by the height assigner.
 */
export const ShapeFamily = {
  RECTANGLE: 'RECTANGLE',
  L_SHAPE: 'L_SHAPE',
  CROSS: 'CROSS',
  DIAMOND: 'DIAMOND',
  PYRAMID: 'PYRAMID',
  STAIRCASE: 'STAIRCASE',
  BLOB: 'BLOB',
} as const;

export type ShapeFamily = (typeof ShapeFamily)[keyof typeof ShapeFamily];

/** All available shape families, used for random selection. */
const ALL_FAMILIES = Object.values(ShapeFamily);

/**
 * A 2D boolean grid. `true` = cell is part of the shape.
 * Always square (boardSize × boardSize).
 */
export type ShapeMask = boolean[][];

/**
 * Result of a shape generation operation.
 */
export interface ShapeResult {
  readonly mask: ShapeMask;
  readonly family: ShapeFamily;
}

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

function createEmptyMask(size: number): ShapeMask {
  return Array.from({ length: size }, () => Array(size).fill(false) as boolean[]);
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

// ---------------------------------------------------------------------------
// Shape generators
// ---------------------------------------------------------------------------

/**
 * Filled rectangle at a random position.
 * Width and height are at least 2 and at most boardSize - 1.
 */
function generateRectangle(rng: SeededRandom, size: number): ShapeMask {
  const mask = createEmptyMask(size);
  const w = rng.nextInt(2, size - 1);
  const h = rng.nextInt(2, size - 1);
  const startR = rng.nextInt(0, size - h);
  const startC = rng.nextInt(0, size - w);

  for (let r = startR; r < startR + h; r++) {
    for (let c = startC; c < startC + w; c++) {
      mask[r][c] = true;
    }
  }
  return mask;
}

/**
 * Two rectangles joined at a corner forming an L shape.
 */
function generateLShape(rng: SeededRandom, size: number): ShapeMask {
  const mask = createEmptyMask(size);

  // First arm (horizontal)
  const arm1Len = rng.nextInt(2, size - 1);
  const arm1Width = rng.nextInt(1, 2);
  // Second arm (vertical)
  const arm2Len = rng.nextInt(2, size - 1);
  const arm2Width = rng.nextInt(1, 2);

  // Choose which corner the L originates from
  const corner = rng.nextInt(0, 3);
  let originR: number, originC: number;

  switch (corner) {
    case 0: // top-left
      originR = rng.nextInt(0, Math.max(0, size - arm2Len));
      originC = rng.nextInt(0, Math.max(0, size - arm1Len));
      break;
    case 1: // top-right
      originR = rng.nextInt(0, Math.max(0, size - arm2Len));
      originC = rng.nextInt(arm1Len - 1, size - 1);
      break;
    case 2: // bottom-left
      originR = rng.nextInt(arm2Len - 1, size - 1);
      originC = rng.nextInt(0, Math.max(0, size - arm1Len));
      break;
    default: // bottom-right
      originR = rng.nextInt(arm2Len - 1, size - 1);
      originC = rng.nextInt(arm1Len - 1, size - 1);
      break;
  }

  // Draw horizontal arm
  const hDir = corner === 1 || corner === 3 ? -1 : 1;
  for (let i = 0; i < arm1Len; i++) {
    for (let w = 0; w < arm1Width; w++) {
      const r = clamp(originR + w, 0, size - 1);
      const c = clamp(originC + i * hDir, 0, size - 1);
      mask[r][c] = true;
    }
  }

  // Draw vertical arm
  const vDir = corner >= 2 ? -1 : 1;
  for (let i = 0; i < arm2Len; i++) {
    for (let w = 0; w < arm2Width; w++) {
      const r = clamp(originR + i * vDir, 0, size - 1);
      const c = clamp(originC + w, 0, size - 1);
      mask[r][c] = true;
    }
  }

  return mask;
}

/**
 * Plus/cross shape with configurable arm length and width.
 */
function generateCross(rng: SeededRandom, size: number): ShapeMask {
  const mask = createEmptyMask(size);
  const armWidth = rng.nextInt(1, 2);
  const centerR = rng.nextInt(2, size - 3);
  const centerC = rng.nextInt(2, size - 3);
  const maxReach = Math.min(centerR, centerC, size - 1 - centerR, size - 1 - centerC);
  const armLength = rng.nextInt(1, Math.max(1, maxReach));

  // Horizontal bar
  for (let c = centerC - armLength; c <= centerC + armLength; c++) {
    for (let w = 0; w < armWidth; w++) {
      const r = centerR - Math.floor(armWidth / 2) + w;
      if (r >= 0 && r < size && c >= 0 && c < size) {
        mask[r][c] = true;
      }
    }
  }

  // Vertical bar
  for (let r = centerR - armLength; r <= centerR + armLength; r++) {
    for (let w = 0; w < armWidth; w++) {
      const c = centerC - Math.floor(armWidth / 2) + w;
      if (r >= 0 && r < size && c >= 0 && c < size) {
        mask[r][c] = true;
      }
    }
  }

  return mask;
}

/**
 * Diamond shape: cells within a Manhattan distance radius from center.
 */
function generateDiamond(rng: SeededRandom, size: number): ShapeMask {
  const mask = createEmptyMask(size);
  const radius = rng.nextInt(1, Math.floor(size / 2));
  const centerR = rng.nextInt(radius, size - 1 - radius);
  const centerC = rng.nextInt(radius, size - 1 - radius);

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (Math.abs(r - centerR) + Math.abs(c - centerC) <= radius) {
        mask[r][c] = true;
      }
    }
  }
  return mask;
}

/**
 * Circular/round shape: cells within a Euclidean distance radius from center.
 * Differentiated from Diamond by using Euclidean rather than Manhattan distance.
 */
function generatePyramid(rng: SeededRandom, size: number): ShapeMask {
  const mask = createEmptyMask(size);
  const radius = rng.nextInt(1, Math.floor(size / 2)) + 0.5;
  const centerR = clamp(rng.nextInt(2, size - 3), 1, size - 2);
  const centerC = clamp(rng.nextInt(2, size - 3), 1, size - 2);

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const dist = Math.sqrt((r - centerR) ** 2 + (c - centerC) ** 2);
      if (dist <= radius) {
        mask[r][c] = true;
      }
    }
  }
  return mask;
}

/**
 * Diagonal band stepping across the board.
 * Creates a staircase-like pattern.
 */
function generateStaircase(rng: SeededRandom, size: number): ShapeMask {
  const mask = createEmptyMask(size);
  const bandWidth = rng.nextInt(1, 3);
  const direction = rng.nextInt(0, 1); // 0 = top-left→bottom-right, 1 = top-right→bottom-left
  const stepSize = rng.nextInt(1, 2);

  for (let r = 0; r < size; r++) {
    const baseCol =
      direction === 0
        ? Math.floor(r / stepSize)
        : size - 1 - Math.floor(r / stepSize);

    for (let w = 0; w < bandWidth; w++) {
      const c = direction === 0 ? baseCol + w : baseCol - w;
      if (c >= 0 && c < size) {
        mask[r][c] = true;
      }
    }
  }
  return mask;
}

/**
 * Random-walk connected region (organic/irregular shape).
 * Guarantees connectivity by construction.
 */
function generateBlob(rng: SeededRandom, size: number): ShapeMask {
  const mask = createEmptyMask(size);
  const targetCells = rng.nextInt(
    Math.max(5, Math.floor(size * size * 0.25)),
    Math.floor(size * size * 0.6),
  );

  // Start near center
  let r = rng.nextInt(1, size - 2);
  let c = rng.nextInt(1, size - 2);
  mask[r][c] = true;
  let count = 1;

  const directions: readonly [number, number][] = [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
  ];

  while (count < targetCells) {
    const [dr, dc] = directions[rng.nextInt(0, 3)];
    const nr = r + dr;
    const nc = c + dc;

    if (nr >= 0 && nr < size && nc >= 0 && nc < size) {
      if (!mask[nr][nc]) {
        mask[nr][nc] = true;
        count++;
      }
      r = nr;
      c = nc;
    }
  }

  return mask;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/** Dispatcher mapping for shape families to their generators. */
const GENERATORS: Record<ShapeFamily, (rng: SeededRandom, size: number) => ShapeMask> = {
  [ShapeFamily.RECTANGLE]: generateRectangle,
  [ShapeFamily.L_SHAPE]: generateLShape,
  [ShapeFamily.CROSS]: generateCross,
  [ShapeFamily.DIAMOND]: generateDiamond,
  [ShapeFamily.PYRAMID]: generatePyramid,
  [ShapeFamily.STAIRCASE]: generateStaircase,
  [ShapeFamily.BLOB]: generateBlob,
};

/**
 * Generates a shape using a randomly selected shape family.
 *
 * The family selection is deterministic for a given RNG state.
 * Each generator produces a connected 2D boolean mask.
 *
 * @param rng - Seeded random generator (state is advanced).
 * @param boardSize - Board dimensions (square grid).
 * @returns A shape mask and the family that produced it.
 */
export function generateShape(rng: SeededRandom, boardSize: number): ShapeResult {
  const family = ALL_FAMILIES[rng.nextInt(0, ALL_FAMILIES.length - 1)];
  const generator = GENERATORS[family];
  const mask = generator(rng, boardSize);

  return { mask, family };
}

/**
 * Counts the number of active (true) cells in a shape mask.
 */
export function countActiveCells(mask: ShapeMask): number {
  let count = 0;
  for (const row of mask) {
    for (const cell of row) {
      if (cell) count++;
    }
  }
  return count;
}
