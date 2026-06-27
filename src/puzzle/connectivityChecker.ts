import type { ShapeMask } from './shapes';

/**
 * Checks whether all active cells in a shape mask form a single
 * connected region using 4-directional adjacency (up/down/left/right).
 *
 * Uses breadth-first search from the first active cell.
 * If BFS visits all active cells, the shape is connected.
 *
 * @param mask - A 2D boolean grid.
 * @returns `true` if all active cells are reachable from any single active cell.
 */
export function isConnected(mask: ShapeMask): boolean {
  const size = mask.length;

  // Find the first active cell
  let startR = -1;
  let startC = -1;
  let totalActive = 0;

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (mask[r][c]) {
        totalActive++;
        if (startR === -1) {
          startR = r;
          startC = c;
        }
      }
    }
  }

  // No active cells or single cell → trivially connected
  if (totalActive <= 1) return totalActive === 1;

  // BFS from the first active cell
  const visited: boolean[][] = Array.from({ length: size }, () =>
    Array(size).fill(false) as boolean[],
  );
  const queue: [number, number][] = [[startR, startC]];
  visited[startR][startC] = true;
  let visitedCount = 1;

  const directions: readonly [number, number][] = [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
  ];

  while (queue.length > 0) {
    const [r, c] = queue.shift()!;
    for (const [dr, dc] of directions) {
      const nr = r + dr;
      const nc = c + dc;
      if (
        nr >= 0 &&
        nr < size &&
        nc >= 0 &&
        nc < size &&
        mask[nr][nc] &&
        !visited[nr][nc]
      ) {
        visited[nr][nc] = true;
        visitedCount++;
        queue.push([nr, nc]);
      }
    }
  }

  return visitedCount === totalActive;
}
