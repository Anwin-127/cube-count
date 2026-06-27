import { describe, it, expect } from 'vitest';
import {
  gridToScreen,
  getCubeFaces,
  calculateCanvasSize,
  iterateCubesInDrawOrder,
} from '../isometric';
import type { RendererConfig } from '../types';

const config: RendererConfig = {
  tileWidth: 48,
  tileHeight: 24,
  cubeHeight: 24,
};

describe('isometric', () => {
  // ── gridToScreen ──────────────────────────────────────────────

  describe('gridToScreen', () => {
    it('maps (0,0,0) to the origin', () => {
      const result = gridToScreen(0, 0, 0, 100, 100, config);
      expect(result.x).toBe(100);
      expect(result.y).toBe(100);
    });

    it('moves right-down for increasing col', () => {
      const p0 = gridToScreen(0, 0, 0, 100, 100, config);
      const p1 = gridToScreen(1, 0, 0, 100, 100, config);
      expect(p1.x).toBeGreaterThan(p0.x);
      expect(p1.y).toBeGreaterThan(p0.y);
    });

    it('moves left-down for increasing row', () => {
      const p0 = gridToScreen(0, 0, 0, 100, 100, config);
      const p1 = gridToScreen(0, 1, 0, 100, 100, config);
      expect(p1.x).toBeLessThan(p0.x);
      expect(p1.y).toBeGreaterThan(p0.y);
    });

    it('moves up for increasing stack index', () => {
      const p0 = gridToScreen(0, 0, 0, 100, 100, config);
      const p1 = gridToScreen(0, 0, 1, 100, 100, config);
      expect(p1.x).toBe(p0.x);
      expect(p1.y).toBeLessThan(p0.y);
    });

    it('stacks at correct height intervals', () => {
      const p0 = gridToScreen(0, 0, 0, 100, 100, config);
      const p1 = gridToScreen(0, 0, 1, 100, 100, config);
      expect(p0.y - p1.y).toBe(config.cubeHeight);
    });

    it('diagonal (col, row) moves straight down', () => {
      const p = gridToScreen(2, 2, 0, 100, 100, config);
      expect(p.x).toBe(100);
      expect(p.y).toBe(148);
    });

    it('uses custom origin correctly', () => {
      const p = gridToScreen(0, 0, 0, 200, 300, config);
      expect(p.x).toBe(200);
      expect(p.y).toBe(300);
    });
  });

  // ── getCubeFaces ──────────────────────────────────────────────

  describe('getCubeFaces', () => {
    const center = { x: 100, y: 100 };

    it('returns three faces with 4 points each', () => {
      const faces = getCubeFaces(center, config);
      expect(faces.top.length).toBe(4);
      expect(faces.left.length).toBe(4);
      expect(faces.right.length).toBe(4);
    });

    it('top face is symmetric around center', () => {
      const faces = getCubeFaces(center, config);
      const [top, right, bottom, left] = faces.top;
      expect(top.x).toBe(center.x);
      expect(bottom.x).toBe(center.x);
      expect(left.x).toBe(center.x - config.tileWidth / 2);
      expect(right.x).toBe(center.x + config.tileWidth / 2);
    });

    it('left face extends downward from the left edge', () => {
      const faces = getCubeFaces(center, config);
      const [topLeft, , , bottomLeft] = faces.left;
      expect(topLeft.x).toBe(center.x - config.tileWidth / 2);
      expect(bottomLeft.y - topLeft.y).toBe(config.cubeHeight);
    });

    it('right face extends downward from the right edge', () => {
      const faces = getCubeFaces(center, config);
      const [topRight, bottomRight] = faces.right;
      expect(topRight.x).toBe(center.x + config.tileWidth / 2);
      expect(bottomRight.y - topRight.y).toBe(config.cubeHeight);
    });

    it('top face highest point is above the center', () => {
      const faces = getCubeFaces(center, config);
      const topPoint = faces.top[0];
      expect(topPoint.y).toBeLessThan(center.y);
      expect(topPoint.y).toBe(center.y - config.tileHeight / 2);
    });

    it('left and right faces share the bottom-center point', () => {
      const faces = getCubeFaces(center, config);
      // Left face bottom-right and right face bottom-left should be the same
      const leftBottomRight = faces.left[2];
      const rightBottomLeft = faces.right[2];
      expect(leftBottomRight.x).toBe(rightBottomLeft.x);
      expect(leftBottomRight.y).toBe(rightBottomLeft.y);
    });
  });

  // ── calculateCanvasSize ───────────────────────────────────────

  describe('calculateCanvasSize', () => {
    it('returns positive dimensions', () => {
      const size = calculateCanvasSize(5, 4, config);
      expect(size.width).toBeGreaterThan(0);
      expect(size.height).toBeGreaterThan(0);
    });

    it('grows with board size', () => {
      const small = calculateCanvasSize(3, 3, config);
      const large = calculateCanvasSize(5, 3, config);
      expect(large.width).toBeGreaterThan(small.width);
      expect(large.height).toBeGreaterThan(small.height);
    });

    it('grows with max height', () => {
      const low = calculateCanvasSize(5, 2, config);
      const high = calculateCanvasSize(5, 4, config);
      expect(high.height).toBeGreaterThan(low.height);
    });

    it('places origin centered horizontally', () => {
      const size = calculateCanvasSize(5, 3, config);
      expect(size.originX).toBe(size.width / 2);
    });

    it('places origin with enough room for stacked cubes above', () => {
      const size = calculateCanvasSize(5, 4, config);
      // Origin Y should be high enough that cubes at max height don't clip
      expect(size.originY).toBeGreaterThanOrEqual(4 * config.cubeHeight);
    });

    it('handles board size of 1', () => {
      const size = calculateCanvasSize(1, 1, config);
      expect(size.width).toBeGreaterThan(0);
      expect(size.height).toBeGreaterThan(0);
    });
  });

  // ── iterateCubesInDrawOrder ───────────────────────────────────

  describe('iterateCubesInDrawOrder', () => {
    it('yields nothing for an empty grid', () => {
      const cubes = [...iterateCubesInDrawOrder([[0, 0], [0, 0]])];
      expect(cubes.length).toBe(0);
    });

    it('yields one cube for a single height-1 cell', () => {
      const cubes = [...iterateCubesInDrawOrder([[1]])];
      expect(cubes.length).toBe(1);
      expect(cubes[0]).toEqual({ col: 0, row: 0, stackIndex: 0 });
    });

    it('yields correct count for a filled grid', () => {
      const heightMap = [
        [2, 1],
        [1, 3],
      ];
      const cubes = [...iterateCubesInDrawOrder(heightMap)];
      expect(cubes.length).toBe(2 + 1 + 1 + 3);
    });

    it('processes rows before columns (back-to-front)', () => {
      const heightMap = [
        [1, 1],
        [1, 1],
      ];
      const cubes = [...iterateCubesInDrawOrder(heightMap)];
      expect(cubes[0].row).toBe(0);
      expect(cubes[2].row).toBe(1);
    });

    it('processes stacks bottom-to-top', () => {
      const heightMap = [[3]];
      const cubes = [...iterateCubesInDrawOrder(heightMap)];
      expect(cubes[0].stackIndex).toBe(0);
      expect(cubes[1].stackIndex).toBe(1);
      expect(cubes[2].stackIndex).toBe(2);
    });

    it('handles sparse height maps', () => {
      const heightMap = [
        [0, 2, 0],
        [1, 0, 1],
        [0, 3, 0],
      ];
      const cubes = [...iterateCubesInDrawOrder(heightMap)];
      expect(cubes.length).toBe(2 + 1 + 1 + 3);
    });

    it('produces correct draw order for depth sorting', () => {
      // Back row should be drawn before front row
      const heightMap = [
        [1, 1],
        [1, 1],
      ];
      const cubes = [...iterateCubesInDrawOrder(heightMap)];

      // All row-0 cubes come before row-1 cubes
      const row0Indices = cubes
        .map((c, i) => ({ ...c, i }))
        .filter((c) => c.row === 0)
        .map((c) => c.i);
      const row1Indices = cubes
        .map((c, i) => ({ ...c, i }))
        .filter((c) => c.row === 1)
        .map((c) => c.i);

      for (const r0 of row0Indices) {
        for (const r1 of row1Indices) {
          expect(r0).toBeLessThan(r1);
        }
      }
    });

    it('draws lower stacks before higher stacks at the same position', () => {
      const heightMap = [[4]];
      const cubes = [...iterateCubesInDrawOrder(heightMap)];

      for (let i = 1; i < cubes.length; i++) {
        expect(cubes[i].stackIndex).toBeGreaterThan(cubes[i - 1].stackIndex);
      }
    });

    it('handles a realistic 5x5 puzzle', () => {
      const heightMap = [
        [0, 0, 1, 1, 0],
        [0, 2, 2, 2, 0],
        [1, 2, 3, 2, 1],
        [0, 2, 2, 2, 0],
        [0, 0, 1, 1, 0],
      ];
      const expectedTotal = 0+0+1+1+0 + 0+2+2+2+0 + 1+2+3+2+1 + 0+2+2+2+0 + 0+0+1+1+0;
      const cubes = [...iterateCubesInDrawOrder(heightMap)];
      expect(cubes.length).toBe(expectedTotal);
    });
  });

  // ── Responsive scaling calculations ───────────────────────────

  describe('responsive scaling', () => {
    it('natural scene fits within its own dimensions without clipping', () => {
      const size = calculateCanvasSize(5, 4, config);

      // All cubes at (row=0, col=4, stack=3) should have
      // their top face within the canvas bounds
      const extremePoint = gridToScreen(
        4, 0, 3,
        size.originX, size.originY,
        config,
      );
      const faces = getCubeFaces(extremePoint, config);
      const topVertex = faces.top[0]; // highest point

      expect(topVertex.y).toBeGreaterThan(0);
      expect(topVertex.x).toBeLessThan(size.width);
    });

    it('all cubes in a full board render within bounds', () => {
      const boardSize = 5;
      const maxHeight = 4;
      const size = calculateCanvasSize(boardSize, maxHeight, config);

      const heightMap = Array.from({ length: boardSize }, () =>
        Array.from({ length: boardSize }, () => maxHeight),
      );

      for (const { col, row, stackIndex } of iterateCubesInDrawOrder(heightMap)) {
        const center = gridToScreen(
          col, row, stackIndex,
          size.originX, size.originY,
          config,
        );
        const faces = getCubeFaces(center, config);

        // Check all vertices are within bounds (with small tolerance)
        for (const face of [faces.top, faces.left, faces.right]) {
          for (const point of face) {
            expect(point.x).toBeGreaterThanOrEqual(-1);
            expect(point.x).toBeLessThanOrEqual(size.width + 1);
            expect(point.y).toBeGreaterThanOrEqual(-1);
            expect(point.y).toBeLessThanOrEqual(size.height + 1);
          }
        }
      }
    });
  });
});
