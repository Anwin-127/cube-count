# Changelog

All notable changes to Cube Count are documented here.

---

## [Unreleased]

---

## [1.1.0] — 2026-06-30 — Quality-Driven Puzzle Engine Redesign

### Philosophy Change

The fundamental objective of the Puzzle Engine has shifted:

- **Before:** Maximise complexity.
- **After:** Maximise gameplay quality.

Puzzles should be interesting, readable, fair, memorable, and fun to count.
Difficulty comes from counting speed and accuracy, not visual obstruction.

### New Modules

| Module | Description |
|--------|-------------|
| `src/puzzle/puzzleRecipes.ts` | 23 named puzzle blueprints (shape + strategy + landmark + transforms) |
| `src/puzzle/occlusionAnalyzer.ts` | Isometric occlusion scoring model |
| `src/puzzle/readabilityScorer.ts` | Positive readability quality signal (3-factor composite) |
| `src/puzzle/structureSignature.ts` | Structural fingerprint for visually-similar deduplication |

### Updated Modules

#### `src/puzzle/shapes.ts`
- Added 6 new shape families: `CORNER_TOWER`, `TWIN_TOWERS`, `RING`, `SKYLINE`, `PLATEAU`, `ZIGZAG`.
- Renamed `PYRAMID` to `CIRCLE` for accuracy (Euclidean distance, not Manhattan).
- `generateShape()` now takes an explicit `ShapeFamily` argument (caller-driven).
- Added `rotateMask90()`, `mirrorMask()`, `applyRandomTransform()` transform utilities.

#### `src/puzzle/heightAssigner.ts`
- Replaced single gradient strategy with 7 named `HeightStrategy` values.
- Added `LandmarkType` post-processing: enforces a memorable focal point after strategy runs.
- `assignHeights()` gains optional `strategy` and `landmark` parameters (backward-compatible defaults).

#### `src/puzzle/complexityAnalyzer.ts`
- Rebalanced weights: `heightVariation` 0.25 → 0.35, `cubeCount` 0.15 → 0.25, `hiddenRatio` 0.35 → 0.15.
- Complexity now reflects counting challenge rather than occlusion severity.

#### `src/puzzle/heightMapGenerator.ts`
- Fully recipe-driven: selects recipe, generates shape, applies transforms, assigns heights.
- Added `generateFromRecipe()` for testable recipe-specific generation.
- Added `refineSpikeHeights()` post-processing to smooth isolated extreme spikes.

#### `src/puzzle/puzzleValidator.ts`
- Added occlusion rejection gate (check 7): puzzles with `occlusionScore > 0.5` are rejected.

#### `src/puzzle/puzzleFactory.ts`
- Integrated occlusion and readability scoring into the acceptance pipeline.
- Tracks most-readable valid candidate as fallback when attempt budget is exhausted.
- All three quality scores stored in puzzle metadata.

#### `src/puzzle/index.ts`
- Exports all new public symbols: `analyzeOcclusion`, `scoreReadability`, `computeStructureSignature`, `selectRecipe`, `getRecipesForDifficulty`, `HeightStrategy`, `LandmarkType`, `rotateMask90`, `mirrorMask`.

#### `src/engine/RoundManager.ts`
- Introduced `SessionHistory` (immutable, three-field object).
- Three-layer session deduplication: exact hash + structure signature + recipe name.
- `generatePuzzleForRound()` now returns `{ puzzle, history }` instead of `{ puzzle, seedUsed, hash }`.
- Added `createSessionHistory()` and `recordPuzzleInHistory()` helpers.

#### `src/engine/index.ts`
- Exports `createSessionHistory`, `recordPuzzleInHistory`, `hashPuzzle`, `SessionHistory`.

#### `src/config/constants.ts`
- Added `OCCLUSION_REJECTION_THRESHOLD = 0.5`
- Added `READABILITY_SOFT_THRESHOLD = 0.35`
- Added `SIGNATURE_HISTORY_SIZE = 20`

#### `src/models/Puzzle.ts` (`PuzzleMetadata`)
- Added `recipeName: string`
- Added `occlusionScore: number`
- Added `readabilityScore: number`

#### `src/store/gameStore.ts`
- Replaced `puzzleHashHistory: string[]` with `sessionHistory: SessionHistory`.
- All three `generatePuzzleForRound()` call sites updated to the new API.
- Seeds are now read from `puzzle.metadata.seed` rather than a separate `seedUsed` field.

### New Tests

| File | Tests Added |
|------|-------------|
| `src/puzzle/__tests__/shapes.test.ts` | Updated for explicit family API; 6 new family tests; transform utility tests |
| `src/puzzle/__tests__/occlusionAnalyzer.test.ts` | NEW — 5 tests |
| `src/puzzle/__tests__/structureSignature.test.ts` | NEW — 7 tests |
| `src/engine/__tests__/RoundManager.test.ts` | Updated for `SessionHistory` API; 3 new metadata tests |

### Test Summary

- **Before:** 262 tests passing
- **After:** 300 tests passing
- **Added:** 38 new tests

### Documentation Updated

- `docs/PUZZLE_ENGINE.md` — Sections 45–57 added covering the full v1.1 redesign.
- `CHANGELOG.md` — This entry.

---

## [1.0.0] — 2026-06-26 — Initial Release

Initial implementation of the Cube Count game engine.

### Included

- Core puzzle generation pipeline (seed → shape → heights → validation).
- 7 shape families (RECTANGLE, L_SHAPE, CROSS, DIAMOND, CIRCLE, STAIRCASE, BLOB).
- Complexity analysis with weighted factors.
- Puzzle validation (dimensions, heights, connectivity).
- Game FSM with 10 states.
- Online multiplayer infrastructure (Firebase Realtime Database).
- Practice mode with difficulty progression.
- Local multiplayer support.
