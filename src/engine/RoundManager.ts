import type { GameConfig } from '../models/GameConfig';
import type { Puzzle } from '../models/Puzzle';
import { GameMode } from '../models/GameMode';
import { Difficulty } from '../models/Difficulty';
import { createPuzzle, generateSeed } from '../puzzle';
import { DIFFICULTY_MAX_HEIGHTS, DIFFICULTY_TARGET_COMPLEXITY } from '../config/constants';
import { getDisplayTimeForRound } from './TimerManager';
import type { MatchStatistics } from '../models/MatchStatistics';
import { determineMatchWinner } from './StatisticsManager';

/**
 * Number of correct answers required to advance to the next
 * difficulty level in practice mode.
 */
export const DIFFICULTY_PROGRESSION_THRESHOLD = 5;

/**
 * Hashes a height map for history tracking to prevent duplicate puzzles.
 */
export function hashPuzzle(heightMap: readonly (readonly number[])[]): string {
  return heightMap.map((row) => row.join('')).join('');
}

/**
 * Generates a puzzle for the current round using the game config.
 *
 * Checks history to avoid repeating structurally identical puzzles.
 * If config.replaySeeds is provided, it perfectly reproduces the sequence
 * and ignores history.
 */
export function generatePuzzleForRound(
  config: GameConfig,
  round: number,
  puzzleHashHistory: string[] = [],
): { puzzle: Puzzle; seedUsed: number; hash: string } {
  // If replaying a match, strictly use the recorded seed sequence
  if (config.replaySeeds && config.replaySeeds.length >= round) {
    const seed = config.replaySeeds[round - 1];
    const puzzle = createPuzzleForConfig(config, round, seed);
    return { puzzle, seedUsed: seed, hash: hashPuzzle(puzzle.heightMap) };
  }

  // Otherwise, generate a unique puzzle not in recent history
  let attempts = 0;
  while (attempts < 30) {
    const seed = generateSeed();
    const puzzle = createPuzzleForConfig(config, round, seed);
    const hash = hashPuzzle(puzzle.heightMap);
    
    if (!puzzleHashHistory.includes(hash)) {
      return { puzzle, seedUsed: seed, hash };
    }
    attempts++;
  }

  // Fallback if we can't find a unique one
  const fallbackSeed = generateSeed();
  const fallbackPuzzle = createPuzzleForConfig(config, round, fallbackSeed);
  return {
    puzzle: fallbackPuzzle,
    seedUsed: fallbackSeed,
    hash: hashPuzzle(fallbackPuzzle.heightMap),
  };
}

function createPuzzleForConfig(config: GameConfig, round: number, seed: number): Puzzle {
  const isEarlyRound = config.enableEarlyProgression && round <= 5;
  const maxHeight = isEarlyRound
    ? 1
    : (config.maximumStackHeight ?? DIFFICULTY_MAX_HEIGHTS[config.difficulty]);

  const defaultComplexity = DIFFICULTY_TARGET_COMPLEXITY[config.difficulty] || DIFFICULTY_TARGET_COMPLEXITY[Difficulty.MEDIUM];
  const targetComplexity = isEarlyRound ? DIFFICULTY_TARGET_COMPLEXITY[Difficulty.EASY] : defaultComplexity;

  const complexityRange = config.difficulty === Difficulty.CUSTOM && config.customComplexity !== undefined
    ? [Math.max(0, config.customComplexity - 0.1), Math.min(1, config.customComplexity + 0.1)] as [number, number]
    : targetComplexity;

  return createPuzzle({
    seed,
    difficulty: config.difficulty,
    maxHeight,
    targetComplexityRange: complexityRange,
  });
}

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
    case Difficulty.EASY:   return Difficulty.MEDIUM;
    case Difficulty.MEDIUM: return Difficulty.HARD;
    case Difficulty.HARD:   return Difficulty.HARD; // already max
  }
}
