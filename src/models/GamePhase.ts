/**
 * Represents the current phase of the game application.
 *
 * The application exists in exactly one phase at any time.
 * Phase transitions are managed exclusively by the game store.
 */
export const GamePhase = {
  /** Main menu screen. No game logic runs. */
  HOME: 'HOME',
  /** Players configure game settings before starting. */
  SETTINGS: 'SETTINGS',
  /** Puzzle generator is creating the next puzzle. */
  GENERATING_PUZZLE: 'GENERATING_PUZZLE',
  /** Puzzle is visible on screen. Players may only observe. */
  DISPLAYING_PUZZLE: 'DISPLAYING_PUZZLE',
  /** Puzzle is hidden. Players submit their answers. */
  ANSWER_PHASE: 'ANSWER_PHASE',
  /** Answers are being validated against the correct count. */
  VALIDATING: 'VALIDATING',
  /** Round results are displayed. Players review before continuing. */
  ROUND_RESULTS: 'ROUND_RESULTS',
  /** Final match results are displayed after all rounds complete. */
  FINAL_RESULTS: 'FINAL_RESULTS',
} as const;

export type GamePhase = (typeof GamePhase)[keyof typeof GamePhase];
