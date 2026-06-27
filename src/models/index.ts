/**
 * Barrel export for all shared models.
 *
 * Allows clean imports:
 *   import { GamePhase, Difficulty } from '../models';
 *   import type { Puzzle, GameConfig } from '../models';
 */

// Const objects (runtime values + types)
export { GamePhase } from './GamePhase';
export { GameMode } from './GameMode';
export { Difficulty } from './Difficulty';
export { DisplayMode } from './DisplayMode';

// Re-export types
export type { GamePhase as GamePhaseType } from './GamePhase';
export type { GameMode as GameModeType } from './GameMode';
export type { Difficulty as DifficultyType } from './Difficulty';
export type { DisplayMode as DisplayModeType } from './DisplayMode';

export type { GameConfig } from './GameConfig';
export type { Puzzle, HeightMap, PuzzleMetadata } from './Puzzle';
export type { PlayerState, PlayerId } from './Player';
export { createInitialPlayerState } from './Player';
export type { RoundResult, PlayerRoundResult } from './RoundResult';
export type {
  MatchStatistics,
  PlayerStatistics,
  PracticeStatistics,
} from './MatchStatistics';
export {
  createInitialMatchStatistics,
  createInitialPracticeStatistics,
} from './MatchStatistics';
