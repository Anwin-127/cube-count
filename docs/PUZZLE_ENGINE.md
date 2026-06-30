# PUZZLE_ENGINE.md

> Project: Cube Count
>
> Version: 1.0
>
> Status: Draft
>
> Last Updated: 2026-06-26
>
> Related Documents:
>
> - PROJECT_SPEC.md
> - GAME_RULES.md
> - TECHNICAL_ARCHITECTURE.md

---

# 1. Purpose

This document defines how puzzles are generated, validated, and evaluated.

The Puzzle Engine is responsible for producing deterministic, visually balanced, and fair puzzles.

Every puzzle shown to players must originate from this system.

---

# 2. Responsibilities

The Puzzle Engine is responsible for:

- Seed generation
- Height map generation
- Puzzle validation
- Difficulty balancing
- Complexity scoring
- Cube counting
- Metadata generation

The Puzzle Engine should never interact with:

- UI
- Rendering
- Player Input
- Timers
- Scoring

---

# 3. Puzzle Philosophy

A puzzle should feel intentionally designed rather than randomly generated.

Players should think:

"I could have counted that if I paid more attention."

They should never think:

"That puzzle was impossible."

The challenge comes from observation, not randomness.

---

# 4. Puzzle Representation

Internally, every puzzle is represented as a Height Map.

Example

2 1 0 3 1

0 2 1 1 0

1 3 2 0 2

0 1 1 2 1

2 0 3 1 0

Each number represents the height of one stack.

The renderer converts this data into cubes.

---

# 5. Puzzle Metadata

Every generated puzzle should contain metadata.

Example

Puzzle

Seed

Difficulty

Total Cubes

Maximum Height

Complexity Score

Hidden Cube Count

Generation Timestamp

Metadata is useful for debugging and future replay functionality.

---

# 6. Puzzle Seed

Every puzzle is generated from a deterministic seed.

Example

Seed

48392174

Using the same:

Seed

Configuration

Difficulty

must always generate the exact same puzzle.

---

# 7. Deterministic Generation

The Puzzle Engine must behave deterministically.

Given identical inputs:

Seed

Difficulty

Configuration

↓

Always produce identical output.

Random behaviour without a seed is not allowed.

---

# 8. Height Map Rules

The board is always:

5 × 5

Each cell stores one integer.

Example

0

↓

No cubes

1

↓

One cube

2

↓

Two cubes

Maximum height depends on GameConfig.

---

# 9. Height Constraints

Every generated value must satisfy:

Minimum

0

Maximum

Configured Maximum Stack Height

Negative heights are never allowed.

Floating cubes are impossible.

---

# 10. Connected Structures

Generated puzzles should appear connected whenever possible.

Avoid isolated single stacks unless intentionally generated for easier difficulty.

Connected structures are easier for players to reason about and produce more visually satisfying puzzles.

---

# 11. Difficulty Levels

Supported values:

Easy

Medium

Hard

Difficulty should influence:

- Stack heights
- Height variation
- Hidden cubes
- Overlap
- Complexity

Difficulty must never increase board size.

---

# 12. Puzzle Complexity

Puzzle complexity should not depend only on cube count.

Complexity should also consider:

- Number of stacks
- Height variation
- Occlusion
- Symmetry
- Density

Two puzzles with identical cube counts may have very different complexity.

---

# 13. Cube Count

The total cube count is calculated as:

Sum of every height value.

Example

2 1 0

3 1 2

1 2 1

↓

13 Cubes

This value becomes the correct answer.

It is calculated once during generation and never changes.

---

# 14. Puzzle Validation

Every generated puzzle should pass validation before it can be displayed.

Validation should verify:

- Valid board size
- Valid heights
- Valid metadata
- Valid cube count
- Valid complexity
- No impossible values

Invalid puzzles should be discarded and regenerated.

---

# 15. Puzzle Lifecycle

Generate Seed

↓

Generate Height Map

↓

Validate Puzzle

↓

Calculate Metadata

↓

Return Immutable Puzzle

The puzzle must never change after creation.

---

# 16. Complexity Score

Every generated puzzle should receive a Complexity Score.

The score ranges from:

0

↓

100

The score represents how mentally challenging a puzzle is expected to be.

The score should be calculated using multiple factors rather than cube count alone.

---

# 17. Complexity Factors

The following factors contribute to the final Complexity Score.

- Total cube count
- Maximum stack height
- Height variation
- Number of hidden cubes
- Stack density
- Visual overlap
- Shape irregularity
- Connectedness
- Symmetry

Each factor contributes a weighted value.

The final score determines the estimated puzzle difficulty.

---

# 18. Difficulty Classification

Difficulty labels are derived from the Complexity Score.

Suggested ranges:

Easy

0–20

Medium

21–45

Hard

46–70

Expert (Future)

71–100

The generator should target a score range rather than selecting a fixed difficulty label.

---

# 19. Hidden Cubes

Hidden cubes increase puzzle difficulty.

A hidden cube is any cube that is partially or completely obscured by surrounding stacks from the fixed camera angle.

Example

Visible Cubes

18

Hidden Cubes

9

Total Cubes

27

The Puzzle Engine should estimate the number of hidden cubes for every generated puzzle.

---

# 20. Stack Density

Stack Density measures how closely cube stacks are packed together.

Dense structures generally produce:

- More overlap
- More hidden cubes
- Greater counting difficulty

Sparse structures are generally easier to count.

---

# 21. Height Variation

Height Variation measures the difference between neighboring stacks.

Example

1 1 1

1 1 1

1 1 1

↓

Low Variation

Example

0 4 1

3 0 2

1 5 0

↓

High Variation

Higher variation generally increases puzzle complexity.

---

# 22. Shape Quality

Generated puzzles should appear intentional.

Avoid:

- Random isolated columns
- Perfectly flat boards
- Excessively chaotic layouts
- Unrealistic patterns

Prefer:

- Connected groups
- Recognizable shapes
- Natural height transitions
- Balanced structures

Good puzzle aesthetics are considered part of gameplay quality.

---

# 23. Symmetry

Perfect symmetry usually makes puzzles easier.

Perfect asymmetry can make puzzles unnecessarily confusing.

The Puzzle Engine should aim for balanced asymmetry.

This creates visually interesting puzzles without feeling unfair.

---

# 24. Connectivity

Neighboring stacks should generally connect.

Large disconnected regions should be avoided unless intentionally generated for low-complexity puzzles.

Connectivity improves both appearance and playability.

---

# 25. Puzzle Validation Rules

Every puzzle must satisfy all validation checks before being accepted.

Checks include:

✓ Valid dimensions

✓ Valid stack heights

✓ Valid metadata

✓ Valid cube count

✓ Valid complexity score

✓ Valid seed

✓ Valid connectivity

✓ Valid rendering data

Failed puzzles are discarded.

A new puzzle is generated automatically.

---

# 26. Puzzle Metadata

Every generated puzzle should include:

Seed

Board Size

Height Map

Total Cubes

Maximum Height

Complexity Score

Difficulty Label

Hidden Cube Estimate

Generation Time

Puzzle Identifier

Metadata should remain immutable after generation.

---

# 27. Puzzle Identifier

Each puzzle should have a unique identifier.

Example

PUZ-00012847

The identifier is useful for:

- Debugging
- Replay
- Future sharing
- Statistics

The identifier should not replace the deterministic seed.

---

# 28. Generator Pipeline

The Puzzle Engine should follow this pipeline.

Generate Seed

↓

Generate Height Map

↓

Calculate Cube Count

↓

Estimate Hidden Cubes

↓

Calculate Complexity Score

↓

Validate Puzzle

↓

Generate Metadata

↓

Return Immutable Puzzle

Every generated puzzle follows this pipeline.

---

# 29. Failure Recovery

If a generated puzzle fails validation:

Discard Puzzle

↓

Generate New Seed

↓

Restart Generation

The player should never receive an invalid puzzle.

---

# 30. Deterministic Behaviour

Given the same:

Seed

Configuration

Difficulty

the Puzzle Engine must always produce the exact same puzzle.

No non-deterministic behavior is allowed.

This guarantees:

- Fairness
- Debugging
- Replay support
- Future online compatibility

---

# 31. Shape-Based Generation

The Puzzle Engine should not generate every cell independently.

Instead, puzzle generation should occur in two stages.

Stage 1

Generate the overall shape.

↓

Stage 2

Assign stack heights.

This approach produces puzzles that feel intentionally designed instead of completely random.

---

# 32. Shape Templates

The generator should internally create recognizable structures.

Examples include:

- Rectangle
- Staircase
- Pyramid
- L Shape
- Cross
- Diamond
- Ring
- Zigzag
- Random Connected Blob

The player should never know which template was used.

Templates simply provide a foundation for puzzle generation.

---

# 33. Height Assignment

Once a valid shape has been generated, stack heights are assigned.

Height assignment depends on:

- Difficulty
- Complexity Target
- Maximum Stack Height

Neighboring stacks should generally have similar heights.

Large height differences should remain uncommon.

This creates more natural-looking structures.

---

# 34. Shape Refinement

After assigning heights, the Puzzle Engine should refine the puzzle.

Possible refinements include:

- Smooth height transitions
- Remove isolated columns
- Improve connectivity
- Increase visual balance
- Reduce unrealistic formations

The goal is to make every generated puzzle appear intentional.

---

# 35. Puzzle Evaluation

Before accepting a puzzle, the engine evaluates its quality.

Evaluation criteria include:

- Connectivity
- Complexity Score
- Hidden Cube Estimate
- Shape Balance
- Density
- Height Variation
- Rendering Quality

Only puzzles meeting the required quality threshold should be accepted.

---

# 36. Puzzle Rejection

A generated puzzle should be rejected if it:

- Is too easy
- Is too difficult
- Contains disconnected regions
- Produces unrealistic structures
- Falls outside the target complexity range
- Violates configuration rules

Rejected puzzles are regenerated automatically.

---

# 37. Deterministic Pipeline

Every generated puzzle should follow the same deterministic pipeline.

Configuration

↓

Seed

↓

Shape Generation

↓

Height Assignment

↓

Shape Refinement

↓

Complexity Analysis

↓

Validation

↓

Metadata Generation

↓

Immutable Puzzle

Every stage should be deterministic.

---

# 38. Immutable Puzzle Object

Once generation is complete, the Puzzle Engine returns an immutable puzzle object.

The object contains:

- Puzzle Identifier
- Seed
- Height Map
- Total Cube Count
- Complexity Score
- Hidden Cube Estimate
- Difficulty
- Metadata

The Game Engine should never modify this object.

---

# 39. Puzzle Engine Responsibilities

The Puzzle Engine owns:

✓ Seed Generation

✓ Shape Generation

✓ Height Assignment

✓ Complexity Analysis

✓ Puzzle Validation

✓ Metadata Generation

The Puzzle Engine must never:

✗ Render graphics

✗ Read keyboard input

✗ Manage timers

✗ Calculate scores

✗ Manage players

---

# 40. Extensibility

The Puzzle Engine should support future expansion.

Possible additions include:

- New shape generators
- Alternative complexity algorithms
- Daily challenge generation
- User-created puzzles
- Puzzle import/export
- Seasonal puzzle themes
- AI-assisted puzzle balancing

These additions should require minimal changes to the existing architecture.

---

# 41. Testing Requirements

The Puzzle Engine should be independently testable.

Unit tests should verify:

- Deterministic generation
- Correct cube count
- Valid height maps
- Correct metadata
- Complexity calculations
- Validation logic

The Puzzle Engine should not depend on rendering or UI for testing.

---

# 42. Performance Goals

Puzzle generation should be fast enough that players never notice delays.

Target generation time:

- Average: < 20 milliseconds
- Maximum: < 100 milliseconds

Generation should occur before rendering begins.

---

# 43. Debug Mode

The Puzzle Engine should support a debug mode.

Debug information may include:

- Seed
- Height Map
- Total Cube Count
- Complexity Score
- Hidden Cube Estimate
- Shape Template
- Generation Time

This information should only be visible in development mode.

---

# 44. Final Statement

The Puzzle Engine is the foundation of Cube Count.

Its purpose is not simply to generate random cube layouts, but to produce fair, visually pleasing, deterministic puzzles that reward observation and spatial reasoning.

Every generated puzzle should feel handcrafted, even though it is procedurally generated.

---

# 45. Version 1.1 — Quality-Driven Redesign

Version 1.1 changes the fundamental objective of the Puzzle Engine.

Previous objective:

> Maximize complexity.

New objective:

> Maximize gameplay quality.

A high-quality puzzle is:

- **Interesting** — the layout has a recognizable character.
- **Readable** — the player can clearly see each stack.
- **Fair** — hidden cubes do not make counting impossible.
- **Memorable** — the player can reconstruct the image mentally.
- **Fun to count** — the challenge comes from speed and accuracy, not ambiguity.

Difficulty should come from counting speed, not visual obstruction.

---

# 46. Puzzle Recipes

Rather than selecting shape, height strategy, and transformations through independent random choices, version 1.1 introduces **puzzle recipes**.

A puzzle recipe is a named blueprint that combines:

| Field            | Description                                      |
|------------------|--------------------------------------------------|
| `name`           | Human-readable name used for deduplication       |
| `shapeFamily`    | The 2D footprint generator to use               |
| `heightStrategy` | The height distribution character               |
| `landmark`       | The memorable focal point to enforce            |
| `allowTransforms`| Whether rotation/mirror variants are allowed    |
| `difficultyTiers`| Which difficulty levels this recipe suits        |

Recipes are defined in `src/puzzle/puzzleRecipes.ts`.

The catalog contains 23 recipes spanning all four difficulty tiers (Easy → Impossible).

`selectRecipe()` picks from recently unused recipes first, maximising session variety.

---

# 47. Shape Families (v1.1)

Version 1.1 adds 6 new shape families on top of the 7 original ones.

**Original families:**

| Family      | Description                                  |
|-------------|----------------------------------------------|
| RECTANGLE   | Filled rectangle at a random position        |
| L_SHAPE     | Two rectangles joined at a corner            |
| CROSS       | Plus/cross with configurable arm length      |
| DIAMOND     | Manhattan-distance radius from center        |
| CIRCLE      | Euclidean-distance radius from center        |
| STAIRCASE   | Diagonal band stepping across the board      |
| BLOB        | Random-walk connected region                 |

**New families:**

| Family       | Description                                     |
|--------------|-------------------------------------------------|
| CORNER_TOWER | Cells radiate from one board corner             |
| TWIN_TOWERS  | Two compact blobs joined by a bridge            |
| RING         | Hollow border frame (active edges only)         |
| SKYLINE      | Column-based silhouette from the bottom up      |
| PLATEAU      | Dense rectangle covering most of the board      |
| ZIGZAG       | Z/S shaped diagonal band with horizontal bars   |

All families guarantee 4-connectivity by construction (or via bridge insertion for TWIN_TOWERS).

**Transform utilities** (`src/puzzle/shapes.ts`):

- `rotateMask90()` — rotates a mask 90° clockwise.
- `mirrorMask()` — mirrors a mask horizontally.
- `applyRandomTransform()` — applies 0–3 rotations and optional mirror, giving up to 8 orientations. Controlled by the recipe's `allowTransforms` flag.

---

# 48. Height Strategies (v1.1)

Version 1.1 replaces the single gradient strategy with 7 named height strategies.

| Strategy       | Character                                             |
|----------------|-------------------------------------------------------|
| EDGE_GRADIENT  | High interior, low edges (classic hill)               |
| INVERSE_GRADIENT | Low interior, high edges (fortress wall / moat)    |
| CORNER_PEAK    | One corner is tallest; heights fade diagonally        |
| TWIN_PEAKS     | Two distant cells reach max; others fade between      |
| STAIRCASE      | Heights increase monotonically along one axis         |
| UNIFORM        | All cells share a base height ± 1 perturbation        |
| RANDOM_VARIED  | Each cell independently gets a random height          |

Each strategy produces a distinct silhouette and qualitative character that makes puzzles recognisable and memorable.

---

# 49. Landmark Enforcement

After the height strategy runs, a landmark post-processing step guarantees a memorable focal point.

| Landmark      | Effect                                                           |
|---------------|------------------------------------------------------------------|
| NONE          | No post-processing; strategy result stands as-is                |
| CORNER_TOWER  | Active cell nearest to a board corner reaches max height        |
| CENTRAL_PEAK  | Active cell nearest to the board centre reaches max height      |
| TWIN_TOWERS   | Two most distant active cells both reach max height             |
| PLATEAU       | One random active cell reaches max height (atop the plateau)    |
| STAIRCASE     | No additional post-processing needed                            |
| SKYLINE       | Tallest column's topmost cell reaches max height                |

Landmark enforcement never reduces heights — it only raises the designated focal cell to max height.

---

# 50. Occlusion Analysis

**Module:** `src/puzzle/occlusionAnalyzer.ts`

The occlusion analyzer models the fixed isometric camera's view.

**Model:**

A stack at `(r, c)` is occluded if:
- The stack at `(r+1, c)` (nearer row) is strictly taller — **front occlusion**.
- The stack at `(r, c-1)` (nearer column) is strictly taller — **side occlusion**.

Hidden cube count = excess height of the taller blocker, clamped to the occluded stack's own height.

Occlusion score = `hiddenCubes / totalCubes` ∈ [0, 1].

**Gate:**

Puzzles with `occlusionScore > OCCLUSION_REJECTION_THRESHOLD` (default: `0.5`) are rejected by the validator. This prevents layouts where more than half the cube volume is invisible.

---

# 51. Readability Scoring

**Module:** `src/puzzle/readabilityScorer.ts`

Readability is a positive quality signal. Unlike occlusion (a hard gate), readability is used to prefer better candidates when multiple valid puzzles are available.

The score is a weighted composite of three factors:

| Factor                  | Weight | Description                                                |
|-------------------------|--------|------------------------------------------------------------|
| Distinct Neighbour Ratio | 40%   | Proportion of 4-connected pairs with different heights     |
| Silhouette Variance      | 35%   | Variation in row/column height sums (CV of profiles)       |
| Height Balance           | 25%   | Shannon entropy of the height frequency distribution       |

Score range: [0, 1]. Higher = more readable.

Puzzles with `readabilityScore < READABILITY_SOFT_THRESHOLD` (default: `0.35`) are deprioritised but not rejected — they are only accepted as a last resort after the attempt budget is exhausted.

---

# 52. Structure Signatures

**Module:** `src/puzzle/structureSignature.ts`

Exact-hash deduplication catches perfectly repeated puzzles. Structure signatures extend this to visually similar puzzles.

A signature quantises each cell into three buckets:

- `0` — empty cell (height = 0).
- `L` — low stack (height ≤ floor(maxHeight / 2)).
- `H` — high stack (height > floor(maxHeight / 2)).

Two puzzles with the same shape but heights offset by ±1 will produce the same signature.

`RoundManager` stores up to `SIGNATURE_HISTORY_SIZE` (default: 20) signatures per session and avoids regenerating puzzles with matching signatures.

---

# 53. Session Deduplication (Three Layers)

Version 1.1 introduces three-layer session deduplication in `RoundManager`.

| Layer            | Storage key      | Detects                          |
|------------------|------------------|----------------------------------|
| Exact hash       | `exactHashes`    | Identical height maps            |
| Structure sig    | `signatures`     | Visually similar layouts         |
| Recipe name      | `recentRecipeNames` | Same blueprint used recently  |

The `SessionHistory` object encapsulates all three tracking lists. It is immutable — `recordPuzzleInHistory()` returns a new updated copy rather than mutating state.

The recipe name list is also passed to `createPuzzle()` via `recentRecipeNames`, allowing `selectRecipe()` to exclude recently-used blueprints before choosing the next one.

---

# 54. Updated Generation Pipeline (v1.1)

```
Configuration + Difficulty
         │
         ▼
   selectRecipe()           ← picks from unused recipes first
         │
         ▼
   generateShape()          ← recipe's shapeFamily
         │
         ▼
   applyRandomTransform()   ← only if recipe.allowTransforms
         │
         ▼
   validateMask()           ← connectivity, min cells
         │
         ▼
   assignHeights()          ← recipe's heightStrategy + landmark
         │
         ▼
   refineSpikeHeights()     ← smooths isolated extreme spikes
         │
         ▼
   validateHeightMap()      ← dimensions, heights, connectivity,
         │                     occlusion gate
         ▼
   analyzeComplexity()      ← check vs. difficulty target range
         │
         ▼
   analyzeOcclusion()       ← record score in metadata
   scoreReadability()       ← record score; prefer readable candidates
         │
         ▼
  Immutable Puzzle Object
```

The factory tracks the most readable valid candidate as a fallback, so even if no puzzle passes all soft thresholds within the attempt budget, the best available puzzle is returned rather than throwing.

---

# 55. Updated Complexity Weights (v1.1)

Under the quality-driven philosophy, hidden cubes are no longer the primary complexity driver.

| Factor          | v1.0 Weight | v1.1 Weight | Change         |
|-----------------|-------------|-------------|----------------|
| heightVariation | 0.25        | 0.35        | ↑ Primary driver |
| cubeCount       | 0.15        | 0.25        | ↑ Counts matter |
| density         | 0.25        | 0.25        | Unchanged       |
| hiddenRatio     | 0.35        | 0.15        | ↓ Deprioritised |

Complexity now reflects counting difficulty (varied heights, more cubes) rather than visual obstruction.

---

# 56. Updated Puzzle Metadata (v1.1)

The `PuzzleMetadata` type gains three new fields:

| Field            | Type   | Description                                          |
|------------------|--------|------------------------------------------------------|
| `recipeName`     | string | Name of the recipe that produced this puzzle         |
| `occlusionScore` | number | Isometric occlusion score [0, 1]                    |
| `readabilityScore` | number | Readability quality score [0, 1]                  |

These fields are available on every generated puzzle and are logged in DEV mode for diagnostics.

---

# 57. Module Map (v1.1)

```
src/puzzle/
├── index.ts                ← Public barrel export
├── random.ts               ← SeededRandom (LCG, unchanged)
├── shapes.ts               ← Shape generators + transform utilities [UPDATED]
├── heightAssigner.ts       ← Height strategies + landmark enforcement [UPDATED]
├── puzzleRecipes.ts        ← Recipe catalog + selectRecipe() [NEW]
├── heightMapGenerator.ts   ← Recipe-based generation pipeline [UPDATED]
├── occlusionAnalyzer.ts    ← Isometric occlusion scoring [NEW]
├── readabilityScorer.ts    ← Readability quality scoring [NEW]
├── structureSignature.ts   ← Structural fingerprint for dedup [NEW]
├── complexityAnalyzer.ts   ← Rebalanced weights [UPDATED]
├── puzzleValidator.ts      ← Occlusion rejection gate added [UPDATED]
├── puzzleFactory.ts        ← Quality gates + best-candidate tracking [UPDATED]
├── connectivityChecker.ts  ← BFS connectivity (unchanged)
└── cubeCounter.ts          ← Cube counting (unchanged)

src/engine/
└── RoundManager.ts         ← Three-layer session deduplication [UPDATED]

src/config/
└── constants.ts            ← OCCLUSION_REJECTION_THRESHOLD,
                               READABILITY_SOFT_THRESHOLD,
                               SIGNATURE_HISTORY_SIZE [UPDATED]

src/models/
└── Puzzle.ts               ← PuzzleMetadata: +recipeName,
                               +occlusionScore, +readabilityScore [UPDATED]
```

