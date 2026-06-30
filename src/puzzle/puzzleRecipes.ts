import type { SeededRandom } from './random';
import { ShapeFamily } from './shapes';
import { HeightStrategy, LandmarkType } from './heightAssigner';
import { Difficulty } from '../models/Difficulty';

// ---------------------------------------------------------------------------
// Recipe definition
// ---------------------------------------------------------------------------

/**
 * A puzzle recipe is a named blueprint that combines:
 *
 *  - Shape family      — the 2D footprint structure
 *  - Height strategy   — the height distribution character
 *  - Landmark type     — the memorable focal point
 *  - Transforms        — whether rotation/mirror variants are allowed
 *  - Difficulty tiers  — which difficulty levels this recipe suits
 *
 * Rather than constructing every puzzle from scratch through independent
 * random choices, the generator selects a recipe and then applies controlled
 * randomness within that recipe's parameters.
 *
 * This produces puzzles that feel handcrafted while maintaining variety.
 */
export interface PuzzleRecipe {
  /** Human-readable name for debugging and session deduplication. */
  readonly name: string;
  /** Shape footprint family (see ShapeFamily). */
  readonly shapeFamily: ShapeFamily;
  /** Height distribution strategy (see HeightStrategy). */
  readonly heightStrategy: HeightStrategy;
  /** Memorable focal point enforced after height assignment (see LandmarkType). */
  readonly landmark: LandmarkType;
  /** Whether random rotation / mirror transforms may be applied to the shape. */
  readonly allowTransforms: boolean;
  /** Difficulty tiers for which this recipe is appropriate. */
  readonly difficultyTiers: readonly Difficulty[];
}

// ---------------------------------------------------------------------------
// Recipe catalog
// ---------------------------------------------------------------------------

/**
 * The complete catalog of puzzle recipes.
 *
 * Each recipe targets a distinct visual identity. The catalog is organized
 * from simpler (Easy) to more complex (Impossible) recipes.
 *
 * Recipes are deliberately not exhaustive — leaving room for the height
 * strategy and RNG to introduce natural variation within each blueprint.
 */
const RECIPE_CATALOG: readonly PuzzleRecipe[] = [
  // ── Easy ─────────────────────────────────────────────────────────────────

  {
    name: 'Gentle Hill',
    shapeFamily: ShapeFamily.CIRCLE,
    heightStrategy: HeightStrategy.EDGE_GRADIENT,
    landmark: LandmarkType.CENTRAL_PEAK,
    allowTransforms: false,
    difficultyTiers: [Difficulty.EASY],
  },
  {
    name: 'Flat Plain',
    shapeFamily: ShapeFamily.RECTANGLE,
    heightStrategy: HeightStrategy.UNIFORM,
    landmark: LandmarkType.NONE,
    allowTransforms: false,
    difficultyTiers: [Difficulty.EASY],
  },
  {
    name: 'Corner Steps',
    shapeFamily: ShapeFamily.CORNER_TOWER,
    heightStrategy: HeightStrategy.CORNER_PEAK,
    landmark: LandmarkType.CORNER_TOWER,
    allowTransforms: true,
    difficultyTiers: [Difficulty.EASY],
  },

  // ── Easy / Medium ────────────────────────────────────────────────────────

  {
    name: 'Diamond Peak',
    shapeFamily: ShapeFamily.DIAMOND,
    heightStrategy: HeightStrategy.EDGE_GRADIENT,
    landmark: LandmarkType.CENTRAL_PEAK,
    allowTransforms: false,
    difficultyTiers: [Difficulty.EASY, Difficulty.MEDIUM],
  },
  {
    name: 'Grand Plateau',
    shapeFamily: ShapeFamily.PLATEAU,
    heightStrategy: HeightStrategy.UNIFORM,
    landmark: LandmarkType.CENTRAL_PEAK,
    allowTransforms: false,
    difficultyTiers: [Difficulty.EASY, Difficulty.MEDIUM],
  },
  {
    name: 'Lone Tower',
    shapeFamily: ShapeFamily.PLATEAU,
    heightStrategy: HeightStrategy.SPIKE,
    landmark: LandmarkType.NONE,
    allowTransforms: false,
    difficultyTiers: [Difficulty.EASY, Difficulty.MEDIUM, Difficulty.HARD, Difficulty.IMPOSSIBLE],
  },

  // ── Medium ───────────────────────────────────────────────────────────────

  {
    name: 'L-Shaped Block',
    shapeFamily: ShapeFamily.L_SHAPE,
    heightStrategy: HeightStrategy.EDGE_GRADIENT,
    landmark: LandmarkType.CORNER_TOWER,
    allowTransforms: true,
    difficultyTiers: [Difficulty.MEDIUM],
  },
  {
    name: 'City Skyline',
    shapeFamily: ShapeFamily.SKYLINE,
    heightStrategy: HeightStrategy.RANDOM_VARIED,
    landmark: LandmarkType.SKYLINE,
    allowTransforms: true,
    difficultyTiers: [Difficulty.MEDIUM],
  },
  {
    name: 'Twin Towers',
    shapeFamily: ShapeFamily.TWIN_TOWERS,
    heightStrategy: HeightStrategy.TWIN_PEAKS,
    landmark: LandmarkType.TWIN_TOWERS,
    allowTransforms: true,
    difficultyTiers: [Difficulty.MEDIUM],
  },
  {
    name: 'Hollow Ring',
    shapeFamily: ShapeFamily.RING,
    heightStrategy: HeightStrategy.UNIFORM,
    landmark: LandmarkType.PLATEAU,
    allowTransforms: false,
    difficultyTiers: [Difficulty.MEDIUM],
  },
  {
    name: 'Rising Staircase',
    shapeFamily: ShapeFamily.STAIRCASE,
    heightStrategy: HeightStrategy.STAIRCASE,
    landmark: LandmarkType.STAIRCASE,
    allowTransforms: true,
    difficultyTiers: [Difficulty.MEDIUM],
  },
  {
    name: 'Cross Roads',
    shapeFamily: ShapeFamily.CROSS,
    heightStrategy: HeightStrategy.TWIN_PEAKS,
    landmark: LandmarkType.TWIN_TOWERS,
    allowTransforms: true,
    difficultyTiers: [Difficulty.MEDIUM],
  },
  {
    name: 'Spike City',
    shapeFamily: ShapeFamily.BLOB,
    heightStrategy: HeightStrategy.SPIKE,
    landmark: LandmarkType.NONE,
    allowTransforms: false,
    difficultyTiers: [Difficulty.EASY, Difficulty.MEDIUM, Difficulty.HARD, Difficulty.IMPOSSIBLE],
  },
  {
    name: 'Twin Spikes',
    shapeFamily: ShapeFamily.TWIN_TOWERS,
    heightStrategy: HeightStrategy.SPIKE,
    landmark: LandmarkType.NONE,
    allowTransforms: true,
    difficultyTiers: [Difficulty.EASY, Difficulty.MEDIUM, Difficulty.HARD, Difficulty.IMPOSSIBLE],
  },

  // ── Medium / Hard ────────────────────────────────────────────────────────

  {
    name: 'Corner Fortress',
    shapeFamily: ShapeFamily.CORNER_TOWER,
    heightStrategy: HeightStrategy.CORNER_PEAK,
    landmark: LandmarkType.CORNER_TOWER,
    allowTransforms: true,
    difficultyTiers: [Difficulty.MEDIUM, Difficulty.HARD],
  },
  {
    name: 'Chaotic Skyline',
    shapeFamily: ShapeFamily.SKYLINE,
    heightStrategy: HeightStrategy.RANDOM_VARIED,
    landmark: LandmarkType.SKYLINE,
    allowTransforms: true,
    difficultyTiers: [Difficulty.MEDIUM, Difficulty.HARD],
  },

  // ── Hard ─────────────────────────────────────────────────────────────────

  {
    name: 'Fortress Wall',
    shapeFamily: ShapeFamily.RING,
    heightStrategy: HeightStrategy.INVERSE_GRADIENT,
    landmark: LandmarkType.NONE,
    allowTransforms: true,
    difficultyTiers: [Difficulty.HARD],
  },
  {
    name: 'Z-Formation',
    shapeFamily: ShapeFamily.ZIGZAG,
    heightStrategy: HeightStrategy.STAIRCASE,
    landmark: LandmarkType.STAIRCASE,
    allowTransforms: true,
    difficultyTiers: [Difficulty.HARD],
  },
  {
    name: 'Organic Cluster',
    shapeFamily: ShapeFamily.BLOB,
    heightStrategy: HeightStrategy.TWIN_PEAKS,
    landmark: LandmarkType.TWIN_TOWERS,
    allowTransforms: false,
    difficultyTiers: [Difficulty.HARD],
  },
  {
    name: 'Stepped Ridge',
    shapeFamily: ShapeFamily.RECTANGLE,
    heightStrategy: HeightStrategy.STAIRCASE,
    landmark: LandmarkType.STAIRCASE,
    allowTransforms: true,
    difficultyTiers: [Difficulty.HARD],
  },
  {
    name: 'Needle',
    shapeFamily: ShapeFamily.CROSS,
    heightStrategy: HeightStrategy.SPIKE,
    landmark: LandmarkType.NONE,
    allowTransforms: false,
    difficultyTiers: [Difficulty.EASY, Difficulty.MEDIUM, Difficulty.HARD, Difficulty.IMPOSSIBLE],
  },

  // ── Hard / Impossible ───────────────────────────────────────────────────

  {
    name: 'Twin Fortress',
    shapeFamily: ShapeFamily.TWIN_TOWERS,
    heightStrategy: HeightStrategy.TWIN_PEAKS,
    landmark: LandmarkType.TWIN_TOWERS,
    allowTransforms: true,
    difficultyTiers: [Difficulty.HARD, Difficulty.IMPOSSIBLE],
  },
  {
    name: 'Moat',
    shapeFamily: ShapeFamily.RING,
    heightStrategy: HeightStrategy.INVERSE_GRADIENT,
    landmark: LandmarkType.CORNER_TOWER,
    allowTransforms: true,
    difficultyTiers: [Difficulty.HARD, Difficulty.IMPOSSIBLE],
  },

  // ── Impossible ───────────────────────────────────────────────────────────

  {
    name: 'Chaos Blob',
    shapeFamily: ShapeFamily.BLOB,
    heightStrategy: HeightStrategy.RANDOM_VARIED,
    landmark: LandmarkType.CENTRAL_PEAK,
    allowTransforms: false,
    difficultyTiers: [Difficulty.IMPOSSIBLE],
  },
  {
    name: 'Corner Assault',
    shapeFamily: ShapeFamily.CORNER_TOWER,
    heightStrategy: HeightStrategy.CORNER_PEAK,
    landmark: LandmarkType.CORNER_TOWER,
    allowTransforms: true,
    difficultyTiers: [Difficulty.IMPOSSIBLE],
  },
  {
    name: 'Jagged Staircase',
    shapeFamily: ShapeFamily.STAIRCASE,
    heightStrategy: HeightStrategy.RANDOM_VARIED,
    landmark: LandmarkType.TWIN_TOWERS,
    allowTransforms: true,
    difficultyTiers: [Difficulty.IMPOSSIBLE],
  },
  {
    name: 'Inverse Hill',
    shapeFamily: ShapeFamily.CIRCLE,
    heightStrategy: HeightStrategy.INVERSE_GRADIENT,
    landmark: LandmarkType.NONE,
    allowTransforms: false,
    difficultyTiers: [Difficulty.IMPOSSIBLE],
  },
  {
    name: 'Chaos Spikes',
    shapeFamily: ShapeFamily.BLOB,
    heightStrategy: HeightStrategy.SPIKE,
    landmark: LandmarkType.NONE,
    allowTransforms: true,
    difficultyTiers: [Difficulty.EASY, Difficulty.MEDIUM, Difficulty.HARD, Difficulty.IMPOSSIBLE],
  },

  // ── Custom (all recipes available) ──────────────────────────────────────

  {
    name: 'Freeform',
    shapeFamily: ShapeFamily.BLOB,
    heightStrategy: HeightStrategy.RANDOM_VARIED,
    landmark: LandmarkType.NONE,
    allowTransforms: false,
    difficultyTiers: [Difficulty.CUSTOM],
  },
];

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Selects a puzzle recipe appropriate for the given difficulty.
 *
 * If `recentRecipeNames` is provided, the selector first tries to find a
 * recipe that has not been recently used, promoting session variety.
 * If all eligible recipes are "recent" (unlikely), falls back to the full set.
 *
 * @param rng - Seeded random generator for deterministic selection.
 * @param difficulty - Current difficulty level.
 * @param recentRecipeNames - Names of recently generated recipes to avoid.
 * @returns A recipe from the catalog.
 */
export function selectRecipe(
  rng: SeededRandom,
  difficulty: Difficulty,
  recentRecipeNames: readonly string[] = [],
): PuzzleRecipe {
  const eligible = RECIPE_CATALOG.filter((r) => {
    // CUSTOM difficulty can use any recipe
    if (difficulty === Difficulty.CUSTOM) return true;
    return r.difficultyTiers.includes(difficulty);
  });

  // Prefer recipes not recently used to maximise session variety
  const fresh = eligible.filter((r) => !recentRecipeNames.includes(r.name));
  const pool = fresh.length > 0 ? fresh : eligible;

  return pool[rng.nextInt(0, pool.length - 1)];
}

/**
 * Returns the subset of recipes available for a given difficulty.
 * Useful for testing and diagnostic tooling.
 */
export function getRecipesForDifficulty(difficulty: Difficulty): readonly PuzzleRecipe[] {
  if (difficulty === Difficulty.CUSTOM) return RECIPE_CATALOG;
  return RECIPE_CATALOG.filter((r) => r.difficultyTiers.includes(difficulty));
}
