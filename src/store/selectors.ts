import { useGameStore } from './gameStore';
import type { GameState } from './gameStore';

/**
 * Memoized selectors for reading specific slices of game state.
 *
 * Using granular selectors prevents unnecessary React re-renders
 * when unrelated parts of the state change.
 *
 * Usage:
 *   const phase = useGameStore(selectPhase);
 *   const config = useGameStore(selectConfig);
 */

// -- Core state selectors --

export const selectPhase = (state: GameState) => state.phase;
export const selectConfig = (state: GameState) => state.config;
export const selectCurrentRound = (state: GameState) => state.currentRound;
export const selectCurrentPuzzle = (state: GameState) => state.currentPuzzle;
export const selectPlayers = (state: GameState) => state.players;
export const selectRoundResults = (state: GameState) => state.roundResults;

// -- Timer selectors --

export const selectDisplayStartTime = (state: GameState) =>
  state.displayStartTime;
export const selectAnswerStartTime = (state: GameState) =>
  state.answerStartTime;
export const selectCurrentDisplayDuration = (state: GameState) =>
  state.currentDisplayDuration;

// -- Statistics selectors --

export const selectMatchStatistics = (state: GameState) =>
  state.matchStatistics;
export const selectPracticeStatistics = (state: GameState) =>
  state.practiceStatistics;

// -- Derived selectors --

/**
 * Returns the player state for a specific player.
 * Returns undefined if the player is not in the current game.
 */
export function createPlayerSelector(playerId: string) {
  return (state: GameState) =>
    state.players.find((p) => p.id === playerId);
}

/**
 * Convenience re-export to access the full store.
 * Prefer granular selectors over this for performance.
 */
export { useGameStore };
