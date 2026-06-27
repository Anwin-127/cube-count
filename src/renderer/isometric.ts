import type { RendererConfig } from './types';
import { DEFAULT_RENDERER_CONFIG } from './types';

/**
 * A 2D screen coordinate.
 */
export interface Point {
  readonly x: number;
  readonly y: number;
}

/**
 * The three visible faces of an isometric cube.
 * Each face is a polygon defined by 4 vertices in drawing order.
 */
export interface CubeFaces {
  readonly top: readonly [Point, Point, Point, Point];
  readonly left: readonly [Point, Point, Point, Point];
  readonly right: readonly [Point, Point, Point, Point];
}

/**
 * Converts grid coordinates (col, row) with a stack index
 * to the center screen position of that cube's top face.
 *
 * Stack index is 0-based (0 = ground level).
 */
export function gridToScreen(
  col: number,
  row: number,
  stackIndex: number,
  originX: number,
  originY: number,
  config: RendererConfig = DEFAULT_RENDERER_CONFIG,
): Point {
  const { tileWidth, tileHeight, cubeHeight } = config;
  return {
    x: originX + (col - row) * (tileWidth / 2),
    y: originY + (col + row) * (tileHeight / 2) - stackIndex * cubeHeight,
  };
}

/**
 * Returns the four vertices for each visible face of a cube
 * at the given screen center position.
 *
 * Vertex order is clockwise starting from the topmost point,
 * suitable for SVG polygon or Canvas path drawing.
 */
export function getCubeFaces(
  center: Point,
  config: RendererConfig = DEFAULT_RENDERER_CONFIG,
): CubeFaces {
  const hw = config.tileWidth / 2;  // half width
  const hh = config.tileHeight / 2; // half height
  const ch = config.cubeHeight;      // cube body height

  // Key vertices
  const top = { x: center.x, y: center.y - hh };
  const right = { x: center.x + hw, y: center.y };
  const bottom = { x: center.x, y: center.y + hh };
  const left = { x: center.x - hw, y: center.y };
  const bottomLeft = { x: center.x - hw, y: center.y + ch };
  const bottomCenter = { x: center.x, y: center.y + hh + ch };
  const bottomRight = { x: center.x + hw, y: center.y + ch };

  return {
    top: [top, right, bottom, left],
    left: [left, bottom, bottomCenter, bottomLeft],
    right: [right, bottomRight, bottomCenter, bottom],
  };
}

/**
 * Calculates the canvas dimensions needed to render a
 * board of the given size with the given config.
 *
 * Returns dimensions with padding for the full isometric view
 * including the tallest possible stacks.
 */
export function calculateCanvasSize(
  boardSize: number,
  maxHeight: number,
  config: RendererConfig = DEFAULT_RENDERER_CONFIG,
): { width: number; height: number; originX: number; originY: number } {
  const { tileWidth, tileHeight, cubeHeight } = config;
  const padding = 20;

  // The isometric grid spans:
  // Horizontal: boardSize * tileWidth (half left, half right of center)
  // Vertical: boardSize * tileHeight + maxHeight * cubeHeight
  const width = boardSize * tileWidth + padding * 2;
  const height =
    boardSize * tileHeight + maxHeight * cubeHeight + padding * 2;

  // Origin is the top-center of the grid: first cell (0,0) maps here.
  const originX = width / 2;
  const originY = padding + maxHeight * cubeHeight;

  return { width, height, originX, originY };
}

/**
 * Returns an iterator of (col, row, stackIndex) tuples
 * in correct back-to-front drawing order for the painter's algorithm.
 *
 * Order: row 0→N, col 0→N, stack 0→height (back-to-front, bottom-to-top).
 */
export function* iterateCubesInDrawOrder(
  heightMap: readonly (readonly number[])[],
): Generator<{ col: number; row: number; stackIndex: number }> {
  const rows = heightMap.length;
  for (let row = 0; row < rows; row++) {
    const cols = heightMap[row].length;
    for (let col = 0; col < cols; col++) {
      const height = heightMap[row][col];
      for (let s = 0; s < height; s++) {
        yield { col, row, stackIndex: s };
      }
    }
  }
}
