import type { GameConfig } from '../models/GameConfig';
import type { Puzzle } from '../models/Puzzle';
import { GameMode } from '../models/GameMode';
import { Difficulty } from '../models/Difficulty';
import { createPuzzle, generateSeed } from '../puzzle';
import { DIFFICULTY_MAX_HEIGHTS } from '../config/constants';
import { getDisplayTimeForRound } from './TimerManager';
import type { MatchStatistics } from '../models/MatchStatistics';
import { determineMatchWinner } from './StatisticsManager';

/**
 * Number of correct answers required to advance to the next
 * difficulty level in practice mode.
 */
export const DIFFICULTY_PROGRESSION_THRESHOLD = 5;

/**
 * Generates a puzzle for the current round using the game config.
 *
 * If the config specifies a `puzzleSeed`, that seed is used
 * (offset by round number for variety). Otherwise, a random
 * seed is generated.
 */
export function generatePuzzleForRound(
  config: GameConfig,
  round: number,
): Puzzle {
  const seed = config.puzzleSeed != null
    ? config.puzzleSeed + round
    : generateSeed();

  const isEarlyRound = round <= 5;
  const maxHeight = isEarlyRound ? 1 : DIFFICULTY_MAX_HEIGHTS[config.difficulty];

  return createPuzzle({
    seed,
    difficulty: config.difficulty,
    maxHeight,
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
