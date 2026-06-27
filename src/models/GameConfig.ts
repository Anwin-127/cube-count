import { Difficulty } from './Difficulty';
import { DisplayMode } from './DisplayMode';
import { GameMode } from './GameMode';

/**
 * Central configuration for a game session.
 *
 * All gameplay systems read their parameters from this model.
 * The UI modifies only this config; game systems consume it.
 */
export interface GameConfig {
  readonly gameMode: GameMode;
  readonly numberOfRounds: number;
  readonly displayTimeMode: DisplayMode;
  /** Duration in seconds the puzzle is shown to players. */
  readonly initialDisplayTime: number;
  /** Maximum time in seconds players have to submit answers. */
  readonly maximumAnswerTime: number;
  readonly difficulty: Difficulty;
  readonly maximumStackHeight: number;
  /** Optional seed for deterministic puzzle generation. */
  readonly puzzleSeed?: number;
}
