import { Difficulty } from './Difficulty';

/**
 * A height map represents the puzzle board as a 2D grid of stack heights.
 *
 * Each number represents the number of cubes stacked at that position.
 * The board is always BOARD_SIZE × BOARD_SIZE (5×5 for Version 1).
 *
 * Marked as readonly to enforce immutability after generation.
 */
export type HeightMap = readonly (readonly number[])[];

/**
 * Metadata attached to every generated puzzle.
 * Useful for debugging, replay, and future statistics.
 */
export interface PuzzleMetadata {
  readonly seed: number;
  readonly difficulty: Difficulty;
  /** The shape family used to generate the puzzle footprint. */
  readonly shapeFamily: string;
  /** Normalized complexity score in [0, 1]. Higher = harder. */
  readonly complexityScore: number;
  /** Estimated number of cubes not directly visible from the isometric viewpoint. */
  readonly hiddenCubeEstimate: number;
  /** Number of generation attempts before a valid puzzle was produced. */
  readonly generationAttempts: number;
  readonly generationTimestamp: number;
}

/**
 * An immutable puzzle object produced by the Puzzle Generator.
 *
 * Once created, no property should ever be modified.
 * The game engine reads this data; the renderer visualizes it.
 */
export interface Puzzle {
  readonly heightMap: HeightMap;
  readonly totalCubes: number;
  readonly maximumHeight: number;
  readonly boardSize: number;
  readonly metadata: PuzzleMetadata;
}
