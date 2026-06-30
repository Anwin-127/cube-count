import type { HeightMap } from '../models/Puzzle';

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Computes a structural signature for a puzzle height map.
 *
 * Purpose:
 *   The exact-hash deduplication in RoundManager catches perfectly repeated
 *   puzzles, but two puzzles with the same silhouette and heights offset by
 *   ±1 will hash differently yet look visually identical to a player.
 *
 *   The structural signature quantises heights into three qualitative buckets:
 *     0 = empty cell
 *     L = low stack  (1 .. floor(maxHeight / 2))
 *     H = high stack (ceil(maxHeight / 2) .. maxHeight)
 *
 *   Puzzles sharing a signature are considered visually similar.
 *   The session history tracks signatures so that structurally similar
 *   puzzles are avoided even when their exact heights differ.
 *
 * @param heightMap - The puzzle grid.
 * @param maxHeight - Maximum possible stack height (controls bucket boundaries).
 * @returns A compact string encoding the qualitative shape of the puzzle.
 */
export function computeStructureSignature(
  heightMap: HeightMap,
  maxHeight: number,
): string {
  const lowBoundary = Math.floor(maxHeight / 2);

  return heightMap
    .map((row) =>
      row
        .map((h) => {
          if (h === 0) return '0';
          if (h <= lowBoundary) return 'L';
          return 'H';
        })
        .join(''),
    )
    .join('|');
}
