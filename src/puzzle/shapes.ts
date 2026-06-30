import type { SeededRandom } from './random';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * Shape families define the 2D footprint of a puzzle.
 * Heights are assigned separately by the height assigner.
 *
 * Original families: RECTANGLE, L_SHAPE, CROSS, DIAMOND, CIRCLE, STAIRCASE, BLOB
 * New families:      CORNER_TOWER, TWIN_TOWERS, RING, SKYLINE, PLATEAU, ZIGZAG
 */
export const ShapeFamily = {
  RECTANGLE: 'RECTANGLE',
  L_SHAPE: 'L_SHAPE',
  CROSS: 'CROSS',
  DIAMOND: 'DIAMOND',
  /** Circular footprint using Euclidean distance (renamed from PYRAMID). */
  CIRCLE: 'CIRCLE',
  STAIRCASE: 'STAIRCASE',
  BLOB: 'BLOB',
  /** Corner cluster: active cells radiate outward from one board corner. */
  CORNER_TOWER: 'CORNER_TOWER',
  /** Two compact blobs connected by a narrow bridge. */
  TWIN_TOWERS: 'TWIN_TOWERS',
  /** Hollow frame: border cells active, interior empty. */
  RING: 'RING',
  /** Column-based silhouette: each column has a random height from the bottom. */
  SKYLINE: 'SKYLINE',
  /** Dense rectangle covering most of the board. */
  PLATEAU: 'PLATEAU',
  /** Z/S shaped diagonal band with horizontal bars. */
  ZIGZAG: 'ZIGZAG',
} as const;

export type ShapeFamily = (typeof ShapeFamily)[keyof typeof ShapeFamily];

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

/**
 * Rotates a square mask 90° clockwise.
 * Used to produce visual variants of a shape without creating new generators.
 */
export function rotateMask90(mask: ShapeMask): ShapeMask {
  const size = mask.length;
  const rotated = createEmptyMask(size);
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      rotated[c][size - 1 - r] = mask[r][c];
    }
  }
  return rotated;
}

/**
 * Mirrors a mask horizontally (left ↔ right).
 * Combined with rotateMask90, produces all 8 dihedral orientations.
 */
export function mirrorMask(mask: ShapeMask): ShapeMask {
  return mask.map((row) => [...row].reverse());
}

/**
 * Applies 0–3 clockwise 90° rotations and optionally mirrors the mask.
 * The combination is chosen deterministically from the RNG.
 * This gives up to 8 visual variants of any shape template.
 */
export function applyRandomTransform(mask: ShapeMask, rng: SeededRandom): ShapeMask {
  const rotations = rng.nextInt(0, 3);
  let result = mask;
  for (let i = 0; i < rotations; i++) {
    result = rotateMask90(result);
  }
  if (rng.nextInt(0, 1) === 1) {
    result = mirrorMask(result);
  }
  return result;
}

// ---------------------------------------------------------------------------
// Shape generators — original families
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

  const arm1Len = rng.nextInt(2, size - 1);
  const arm1Width = rng.nextInt(1, 2);
  const arm2Len = rng.nextInt(2, size - 1);
  const arm2Width = rng.nextInt(1, 2);

  const corner = rng.nextInt(0, 3);
  let originR: number, originC: number;

  switch (corner) {
    case 0:
      originR = rng.nextInt(0, Math.max(0, size - arm2Len));
      originC = rng.nextInt(0, Math.max(0, size - arm1Len));
      break;
    case 1:
      originR = rng.nextInt(0, Math.max(0, size - arm2Len));
      originC = rng.nextInt(arm1Len - 1, size - 1);
      break;
    case 2:
      originR = rng.nextInt(arm2Len - 1, size - 1);
      originC = rng.nextInt(0, Math.max(0, size - arm1Len));
      break;
    default:
      originR = rng.nextInt(arm2Len - 1, size - 1);
      originC = rng.nextInt(arm1Len - 1, size - 1);
      break;
  }

  const hDir = corner === 1 || corner === 3 ? -1 : 1;
  for (let i = 0; i < arm1Len; i++) {
    for (let w = 0; w < arm1Width; w++) {
      const r = clamp(originR + w, 0, size - 1);
      const c = clamp(originC + i * hDir, 0, size - 1);
      mask[r][c] = true;
    }
  }

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

  for (let c = centerC - armLength; c <= centerC + armLength; c++) {
    for (let w = 0; w < armWidth; w++) {
      const r = centerR - Math.floor(armWidth / 2) + w;
      if (r >= 0 && r < size && c >= 0 && c < size) {
        mask[r][c] = true;
      }
    }
  }

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
 * Circular footprint: cells within a Euclidean distance radius from center.
 * Named CIRCLE to distinguish from DIAMOND (Manhattan distance).
 */
function generateCircle(rng: SeededRandom, size: number): ShapeMask {
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
 * Diagonal band stepping across the board — creates a staircase footprint.
 */
function generateStaircase(rng: SeededRandom, size: number): ShapeMask {
  const mask = createEmptyMask(size);
  const bandWidth = rng.nextInt(1, 3);
  const direction = rng.nextInt(0, 1);
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
// Shape generators — new families
// ---------------------------------------------------------------------------

/**
 * Corner tower: active cells radiate outward from one board corner
 * using Manhattan distance, creating a triangular cluster.
 *
 * Always connected (all cells within Manhattan distance are adjacent).
 */
function generateCornerTower(rng: SeededRandom, size: number): ShapeMask {
  const mask = createEmptyMask(size);
  const corner = rng.nextInt(0, 3);
  const spread = rng.nextInt(2, Math.min(size - 1, 4));

  let cornerR: number, cornerC: number;
  switch (corner) {
    case 0:
      cornerR = 0;
      cornerC = 0;
      break;
    case 1:
      cornerR = 0;
      cornerC = size - 1;
      break;
    case 2:
      cornerR = size - 1;
      cornerC = 0;
      break;
    default:
      cornerR = size - 1;
      cornerC = size - 1;
      break;
  }

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (Math.abs(r - cornerR) + Math.abs(c - cornerC) <= spread) {
        mask[r][c] = true;
      }
    }
  }
  return mask;
}

/**
 * Twin towers: two compact Manhattan-distance blobs joined by a
 * straight-line bridge, guaranteeing connectivity.
 *
 * The two towers are positioned in opposite quadrants of the board.
 */
function generateTwinTowers(rng: SeededRandom, size: number): ShapeMask {
  const mask = createEmptyMask(size);

  // Place towers in opposite quadrants
  const t1r = rng.nextInt(0, 1);
  const t1c = rng.nextInt(0, 1);
  const t2r = rng.nextInt(size - 2, size - 1);
  const t2c = rng.nextInt(size - 2, size - 1);
  const radius = 1;

  // Fill blob around each tower
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const d1 = Math.abs(r - t1r) + Math.abs(c - t1c);
      const d2 = Math.abs(r - t2r) + Math.abs(c - t2c);
      if (d1 <= radius || d2 <= radius) {
        mask[r][c] = true;
      }
    }
  }

  // Connect with a Manhattan path bridge (guarantees connectivity)
  let pr = t1r;
  let pc = t1c;
  while (pr !== t2r || pc !== t2c) {
    mask[pr][pc] = true;
    if (pr < t2r) pr++;
    else if (pr > t2r) pr--;
    else if (pc < t2c) pc++;
    else if (pc > t2c) pc--;
  }
  mask[t2r][t2c] = true;

  return mask;
}

/**
 * Hollow ring: border of a sub-rectangle is active; interior is empty.
 *
 * With margin=0 this is the full board border (always connected).
 * With margin=1 it is a ring inset by one cell.
 */
function generateRing(rng: SeededRandom, size: number): ShapeMask {
  const mask = createEmptyMask(size);
  const margin = rng.nextInt(0, 1);

  for (let r = margin; r < size - margin; r++) {
    for (let c = margin; c < size - margin; c++) {
      const onBorder =
        r === margin ||
        r === size - 1 - margin ||
        c === margin ||
        c === size - 1 - margin;
      if (onBorder) {
        mask[r][c] = true;
      }
    }
  }
  return mask;
}

/**
 * Skyline: each column has a random height activated from the bottom up.
 * The bottom row is always fully active, guaranteeing 4-connectivity.
 *
 * This produces the distinctive silhouette of a city skyline when viewed
 * from the side, making it visually recognizable from the isometric angle.
 */
function generateSkyline(rng: SeededRandom, size: number): ShapeMask {
  const mask = createEmptyMask(size);

  for (let c = 0; c < size; c++) {
    // Each column is at least 1 tall (bottom row is always active)
    const height = rng.nextInt(1, size - 1);
    for (let r = size - height; r < size; r++) {
      mask[r][c] = true;
    }
  }
  return mask;
}

/**
 * Plateau: a dense rectangle covering most of the board with optional
 * corner trimming for visual interest.
 *
 * Always connected (it is a rectangle or near-rectangle).
 */
function generatePlateau(rng: SeededRandom, size: number): ShapeMask {
  const mask = createEmptyMask(size);
  const margin = rng.nextInt(0, 1);

  for (let r = margin; r < size - margin; r++) {
    for (let c = margin; c < size - margin; c++) {
      mask[r][c] = true;
    }
  }
  return mask;
}

/**
 * Zigzag / Z-shape: top horizontal bar + diagonal + bottom horizontal bar.
 *
 * The three sections overlap so the shape is always connected.
 * Random orientation (S vs Z) is controlled by the caller via applyRandomTransform.
 */
function generateZigzag(rng: SeededRandom, size: number): ShapeMask {
  const mask = createEmptyMask(size);
  const barWidth = rng.nextInt(1, 2);
  const topRight = rng.nextInt(0, 1) === 1; // S-shape vs Z-shape

  // Top horizontal bar
  for (let r = 0; r < barWidth; r++) {
    for (let c = 0; c < size; c++) {
      mask[r][c] = true;
    }
  }

  // Diagonal connecting the two bars
  for (let i = 0; i < size; i++) {
    const r = i;
    const c = topRight ? size - 1 - i : i;
    if (r >= 0 && r < size && c >= 0 && c < size) {
      mask[r][c] = true;
    }
  }

  // Bottom horizontal bar
  for (let r = size - barWidth; r < size; r++) {
    for (let c = 0; c < size; c++) {
      mask[r][c] = true;
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
  [ShapeFamily.CIRCLE]: generateCircle,
  [ShapeFamily.STAIRCASE]: generateStaircase,
  [ShapeFamily.BLOB]: generateBlob,
  [ShapeFamily.CORNER_TOWER]: generateCornerTower,
  [ShapeFamily.TWIN_TOWERS]: generateTwinTowers,
  [ShapeFamily.RING]: generateRing,
  [ShapeFamily.SKYLINE]: generateSkyline,
  [ShapeFamily.PLATEAU]: generatePlateau,
  [ShapeFamily.ZIGZAG]: generateZigzag,
};

/**
 * Generates a shape mask for the given family.
 *
 * The family is supplied by the caller (typically from a puzzle recipe).
 * Transforms (rotate/mirror) are applied separately via applyRandomTransform
 * if the recipe allows it.
 *
 * @param rng - Seeded random generator (state is advanced).
 * @param boardSize - Board dimensions (square grid).
 * @param family - Which shape family to generate.
 * @returns A shape mask for the given family.
 */
export function generateShape(
  rng: SeededRandom,
  boardSize: number,
  family: ShapeFamily,
): ShapeResult {
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
