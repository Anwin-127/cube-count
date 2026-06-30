/**
 * Barrel export for the Puzzle Engine.
 *
 * Public API:
 *   createPuzzle()                — Generate a puzzle from a seed and config.
 *   generateSeed()                — Create a random seed value.
 *   countTotalCubes()             — Sum heights in a height map.
 *   findMaximumHeight()           — Find the tallest stack.
 *   validateHeightMap()           — Validate puzzle constraints.
 *   analyzeComplexity()           — Calculate complexity factors and score.
 *   analyzeOcclusion()            — Score isometric occlusion visibility.
 *   scoreReadability()            — Score visual readability quality.
 *   computeStructureSignature()   — Structural fingerprint for session dedup.
 *   isConnected()                 — Check shape connectivity.
 *   selectRecipe()                — Select a puzzle recipe for a difficulty.
 *   ShapeFamily                   — Shape family constants.
 *   HeightStrategy                — Height strategy constants.
 *   LandmarkType                  — Landmark type constants.
 *   countActiveCells()            — Count occupied cells in a shape mask.
 *   rotateMask90()                — Rotate a shape mask 90° clockwise.
 *   mirrorMask()                  — Mirror a shape mask horizontally.
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

export { analyzeOcclusion } from './occlusionAnalyzer';
export type { OcclusionAnalysis } from './occlusionAnalyzer';

export { scoreReadability } from './readabilityScorer';
export type { ReadabilityAnalysis } from './readabilityScorer';

export { computeStructureSignature } from './structureSignature';

export { isConnected } from './connectivityChecker';

export { selectRecipe, getRecipesForDifficulty } from './puzzleRecipes';
export type { PuzzleRecipe } from './puzzleRecipes';

export { ShapeFamily, countActiveCells, rotateMask90, mirrorMask } from './shapes';
export type { ShapeMask, ShapeResult } from './shapes';

export { HeightStrategy, LandmarkType } from './heightAssigner';
