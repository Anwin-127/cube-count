/**
 * Barrel export for the Game Engine.
 *
 * Modules:
 *   GameStateMachine — FSM transition validation.
 *   TimerManager     — Timer calculations (elapsed, remaining, expired).
 *   AnswerManager    — Answer manipulation and round validation.
 *   RoundManager     — Round lifecycle and puzzle generation.
 *   StatisticsManager — Match and practice statistics accumulation.
 */

// FSM
export {
  canTransition,
  transition,
  getValidTransitions,
} from './GameStateMachine';

// Timers
export {
  getDisplayTimeForRound,
  getElapsedSeconds,
  getRemainingSeconds,
  isTimerExpired,
} from './TimerManager';
export type { TimerState } from './TimerManager';

// Answers
export {
  incrementAnswer,
  decrementAnswer,
  submitAnswer,
  lockAllUnsubmitted,
  allPlayersSubmitted,
  validateRound,
} from './AnswerManager';

// Rounds
export {
  generatePuzzleForRound,
  createSessionHistory,
  recordPuzzleInHistory,
  hashPuzzle,
  getDisplayTimeForCurrentRound,
  isLastRound,
  getPlayerCount,
  getNextDifficultyLevel,
  DIFFICULTY_PROGRESSION_THRESHOLD,
} from './RoundManager';
export type { SessionHistory } from './RoundManager';

// Statistics
export {
  createMatchStats,
  updateMatchStats,
  determineMatchWinner,
  createPracticeStats,
  updatePracticeStats,
} from './StatisticsManager';
