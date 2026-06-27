import { Difficulty } from '../models/Difficulty';
import { DisplayMode } from '../models/DisplayMode';
import { GameMode } from '../models/GameMode';
import type { GameConfig } from '../models/GameConfig';

/**
 * Default game configuration.
 *
 * Used as the starting values in the Settings screen.
 * Players may modify these before starting a match.
 */
export const DEFAULT_GAME_CONFIG: GameConfig = {
  gameMode: GameMode.LOCAL_MULTIPLAYER,
  numberOfRounds: 10,
  displayTimeMode: DisplayMode.FIXED,
  initialDisplayTime: 10,
  maximumAnswerTime: 10,
  difficulty: Difficulty.MEDIUM,
  maximumStackHeight: 3,
};
