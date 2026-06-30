import type { GameConfig } from '../models/GameConfig';
import type { Puzzle } from '../models/Puzzle';
import { GameMode } from '../models/GameMode';
import { Difficulty } from '../models/Difficulty';
import { createPuzzle, generateSeed } from '../puzzle';
import { computeStructureSignature } from '../puzzle/structureSignature';
import { DIFFICULTY_MAX_HEIGHTS, DIFFICULTY_TARGET_COMPLEXITY, SIGNATURE_HISTORY_SIZE } from '../config/constants';
import { getDisplayTimeForRound } from './TimerManager';
import type { MatchStatistics } from '../models/MatchStatistics';
import { determineMatchWinner } from './StatisticsManager';

/**
 * Number of correct answers required to advance to the next
 * difficulty level in practice mode.
 */
export const DIFFICULTY_PROGRESSION_THRESHOLD = 5;

/**
 * Hashes a height map for exact-match history tracking.
 *
 * Used alongside structure signatures to provide two layers of deduplication:
 *  - Exact hash: catches perfectly repeated height maps.
 *  - Structure signature: catches visually similar layouts with ±1 heights.
 */
export function hashPuzzle(heightMap: readonly (readonly number[])[]): string {
  return heightMap.map((row) => row.join('')).join('');
}

/**
 * Session deduplication context.
 *
 * Tracks the exact and structural fingerprints of recently generated puzzles,
 * plus which recipes have been used, to prevent repetition within a match.
 */
export interface SessionHistory {
  /** Exact height-map hashes. Prevents perfectly repeated puzzles. */
  readonly exactHashes: string[];
  /**
   * Structural signatures (quantised silhouettes). Prevents visually
   * similar puzzles even when exact heights differ slightly.
   */
  readonly signatures: string[];
  /** Names of recently used puzzle recipes. Promotes structural variety. */
  readonly recentRecipeNames: string[];
}

/**
 * Creates an empty session history object.
 */
export function createSessionHistory(): SessionHistory {
  return { exactHashes: [], signatures: [], recentRecipeNames: [] };
}

/**
 * Returns an updated session history after a puzzle was accepted.
 *
 * Maintains a sliding window of SIGNATURE_HISTORY_SIZE entries across all
 * three tracking lists. Immutable — returns a new history object.
 */
export function recordPuzzleInHistory(
  history: SessionHistory,
  puzzle: Puzzle,
  maxHeight: number,
): SessionHistory {
  const hash = hashPuzzle(puzzle.heightMap);
  const sig = computeStructureSignature(puzzle.heightMap, maxHeight);
  const recipeName = puzzle.metadata.recipeName;

  const cap = SIGNATURE_HISTORY_SIZE;

  return {
    exactHashes: [...history.exactHashes, hash].slice(-cap),
    signatures: [...history.signatures, sig].slice(-cap),
    recentRecipeNames: [...history.recentRecipeNames, recipeName].slice(-cap),
  };
}

/**
 * Checks whether a candidate puzzle has already appeared in this session.
 *
 * A puzzle is considered a duplicate if either its exact hash or its
 * structural signature appears in the history.
 */
function isDuplicate(
  puzzle: Puzzle,
  history: SessionHistory,
  maxHeight: number,
): boolean {
  const hash = hashPuzzle(puzzle.heightMap);
  if (history.exactHashes.includes(hash)) return true;

  const sig = computeStructureSignature(puzzle.heightMap, maxHeight);
  return history.signatures.includes(sig);
}

/**
 * Generates a puzzle for the current round using the game config.
 *
 * Deduplication strategy (layered):
 *  1. Exact hash — prevents repeated height maps.
 *  2. Structure signature — prevents visually similar height maps.
 *  3. Recipe history — passed to createPuzzle() to avoid re-using the
 *     same recipe blueprint back-to-back.
 *
 * If config.replaySeeds is provided, seeds are replayed exactly and
 * history is not consulted (deterministic replay takes precedence).
 */
export function generatePuzzleForRound(
  config: GameConfig,
  round: number,
  history: SessionHistory = createSessionHistory(),
): { puzzle: Puzzle; history: SessionHistory } {
  const maxHeight = resolveMaxHeight(config, round);

  // Replay mode: reproduce the exact recorded seed sequence
  if (config.replaySeeds && config.replaySeeds.length >= round) {
    const seed = config.replaySeeds[round - 1];
    const puzzle = createPuzzleForConfig(config, round, seed, history);
    logDeterministicVerification('Replay', round, seed, config.difficulty, puzzle);
    const updatedHistory = recordPuzzleInHistory(history, puzzle, maxHeight);
    return { puzzle, history: updatedHistory };
  }

  // Online multiplayer: a synchronized seed is always provided
  if (config.puzzleSeed !== undefined) {
    const puzzle = createPuzzleForConfig(config, round, config.puzzleSeed, history);
    logDeterministicVerification('Online', round, config.puzzleSeed, config.difficulty, puzzle);
    const updatedHistory = recordPuzzleInHistory(history, puzzle, maxHeight);
    return { puzzle, history: updatedHistory };
  }

  // Enforce engine contract for online multiplayer
  if (config.gameMode === GameMode.ONLINE_MULTIPLAYER) {
    console.error(
      `[Deterministic Validation Error] Missing puzzleSeed for Online Multiplayer round ${round}`,
    );
    throw new Error(
      'Deterministic puzzle generation failed: Online Multiplayer requires a synchronized puzzleSeed.',
    );
  }

  // Local generation: try to find a puzzle not already in history
  let attempts = 0;
  while (attempts < 30) {
    const seed = generateSeed();
    const puzzle = createPuzzleForConfig(config, round, seed, history);

    if (!isDuplicate(puzzle, history, maxHeight)) {
      logDeterministicVerification('Random', round, seed, config.difficulty, puzzle);
      const updatedHistory = recordPuzzleInHistory(history, puzzle, maxHeight);
      return { puzzle, history: updatedHistory };
    }
    attempts++;
  }

  // Fallback: accept whatever the next seed produces
  const fallbackSeed = generateSeed();
  const fallbackPuzzle = createPuzzleForConfig(config, round, fallbackSeed, history);
  logDeterministicVerification('Random (Fallback)', round, fallbackSeed, config.difficulty, fallbackPuzzle);
  const updatedHistory = recordPuzzleInHistory(history, fallbackPuzzle, maxHeight);
  return { puzzle: fallbackPuzzle, history: updatedHistory };
}

// ---------------------------------------------------------------------------
// Private helpers
// ---------------------------------------------------------------------------

function resolveMaxHeight(config: GameConfig, round: number): number {
  const fullMax = config.maximumStackHeight ?? DIFFICULTY_MAX_HEIGHTS[config.difficulty];

  if (!config.enableEarlyProgression || round > 5) {
    return fullMax;
  }

  // Gradual ramp for rounds 1–5: start at half height, reach full by round 5.
  // This retains the "easing in" intent without forcing all stacks to height 1.
  if (round <= 2) return Math.max(2, Math.floor(fullMax / 2));
  if (round <= 4) return Math.max(2, Math.ceil(fullMax * 0.7));
  return fullMax;
}

function createPuzzleForConfig(
  config: GameConfig,
  round: number,
  seed: number,
  history: SessionHistory,
): Puzzle {
  const maxHeight = resolveMaxHeight(config, round);
  const isEarlyRound = config.enableEarlyProgression && round <= 5;

  const defaultComplexity =
    DIFFICULTY_TARGET_COMPLEXITY[config.difficulty] ||
    DIFFICULTY_TARGET_COMPLEXITY[Difficulty.MEDIUM];
  const targetComplexity = isEarlyRound
    ? DIFFICULTY_TARGET_COMPLEXITY[Difficulty.EASY]
    : defaultComplexity;

  const complexityRange =
    config.difficulty === Difficulty.CUSTOM && config.customComplexity !== undefined
      ? ([
          Math.max(0, config.customComplexity - 0.1),
          Math.min(1, config.customComplexity + 0.1),
        ] as [number, number])
      : targetComplexity;

  return createPuzzle({
    seed,
    difficulty: config.difficulty,
    maxHeight,
    targetComplexityRange: complexityRange,
    recentRecipeNames: history.recentRecipeNames,
  });
}

function logDeterministicVerification(
  source: string,
  round: number,
  seed: number,
  difficulty: string,
  puzzle: Puzzle,
): void {
  if (import.meta.env.DEV) {
    console.log('[Deterministic Verification]');
    console.log(`Generation Source: ${source}`);
    console.log(`Round: ${round}`);
    console.log(`Seed: ${seed}`);
    console.log(`Difficulty: ${difficulty}`);
    console.log(`Recipe: ${puzzle.metadata.recipeName}`);
    console.log(`Puzzle Hash: ${hashPuzzle(puzzle.heightMap)}`);
    console.log(`Readability: ${puzzle.metadata.readabilityScore.toFixed(3)}`);
    console.log(`Occlusion: ${puzzle.metadata.occlusionScore.toFixed(3)}`);
  }
}

// ---------------------------------------------------------------------------
// Round / match management (unchanged public API)
// ---------------------------------------------------------------------------

/**
 * Returns the display duration in seconds for a specific round.
 */
export function getDisplayTimeForCurrentRound(
  config: GameConfig,
  round: number,
): number {
  return getDisplayTimeForRound(
    config.displayTimeMode,
    config.initialDisplayTime,
    round,
  );
}

/**
 * Checks whether the current round is the last round of the match.
 *
 * Practice mode never ends — always returns false.
 */
export function isLastRound(
  config: GameConfig,
  currentRound: number,
  stats?: MatchStatistics | null,
): boolean {
  if (config.gameMode === GameMode.PRACTICE) return false;
  if (currentRound < config.numberOfRounds) return false;

  if (stats && currentRound >= config.numberOfRounds) {
    const winner = determineMatchWinner(stats);
    if (winner === 'DRAW') {
      return false; // Sudden death
    }
  }

  return true;
}

/**
 * Returns the number of players for the given game mode.
 */
export function getPlayerCount(config: GameConfig): number {
  return config.gameMode === GameMode.LOCAL_MULTIPLAYER ? 2 : 1;
}

/**
 * Returns the next difficulty level in the progression order,
 * or the current level if already at maximum.
 *
 * Order: EASY → MEDIUM → HARD
 */
export function getNextDifficultyLevel(current: Difficulty): Difficulty {
  switch (current) {
    case Difficulty.EASY:
      return Difficulty.MEDIUM;
    case Difficulty.MEDIUM:
      return Difficulty.HARD;
    case Difficulty.HARD:
      return Difficulty.HARD; // already max
    default:
      return current;
  }
}
