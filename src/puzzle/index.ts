/**
 * Barrel export for the Puzzle Engine.
 *
 * Public API:
 *   createPuzzle()        — Generate a puzzle from a seed and config.
 *   generateSeed()        — Create a random seed value.
 *   countTotalCubes()     — Sum heights in a height map.
 *   findMaximumHeight()   — Find the tallest stack.
 *   validateHeightMap()   — Validate puzzle constraints.
 *   analyzeComplexity()   — Calculate complexity factors and score.
 *   isConnected()         — Check shape connectivity.
 *   ShapeFamily           — Shape family constants.
 *   countActiveCells()    — Count occupied cells in a shape mask.
 *
 * Internal modules (random, heightMapGenerator, heightAssigner, shapes)
 * are implementation details. Consumers should use createPuzzle() as
 * the primary entry point.
 */

export { createPuzzle } from './puzzleFactory';
export type { PuzzleGenerationConfig } from './puzzleFactory';

export { generateSeed } from './random';

export { countTotalCubes, findMaximumHeight } from './cubeCounter';

export { validateHeightMap } from './puzzleValidator';
export type { ValidationResult } from './puzzleValidator';

export { analyzeComplexity } from './complexityAnalyzer';
export type { ComplexityAnalysis, ComplexityFactors } from './complexityAnalyzer';

export { isConnected } from './connectivityChecker';

export { ShapeFamily, countActiveCells } from './shapes';
export type { ShapeMask, ShapeResult } from './shapes';
