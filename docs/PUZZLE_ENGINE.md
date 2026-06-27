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

