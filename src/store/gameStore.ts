import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { GamePhase } from '../models/GamePhase';
import { GameMode } from '../models/GameMode';
import type { GameConfig } from '../models/GameConfig';
import type { PlayerState, PlayerId } from '../models/Player';
import { createInitialPlayerState } from '../models/Player';
import type { Puzzle } from '../models/Puzzle';
import type { RoundResult } from '../models/RoundResult';
import type { MatchStatistics, PracticeStatistics } from '../models/MatchStatistics';
import { DEFAULT_GAME_CONFIG } from '../config/gameConfig';
import {
  transition,
  generatePuzzleForRound,
  getDisplayTimeForCurrentRound,
  isLastRound,
  isTimerExpired,
  allPlayersSubmitted,
  lockAllUnsubmitted,
  validateRound,
  createMatchStats,
  updateMatchStats,
  createPracticeStats,
  updatePracticeStats,
  getElapsedSeconds,
  getNextDifficultyLevel,
  DIFFICULTY_PROGRESSION_THRESHOLD,
} from '../engine';
import * as AnswerManager from '../engine/AnswerManager';

// ---------------------------------------------------------------------------
// State shape
// ---------------------------------------------------------------------------

/**
 * The complete game state.
 * This is the single source of truth for the entire application.
 */
export interface GameState {
  /** Current phase of the FSM. */
  phase: GamePhase;
  /** Active game configuration (may mutate difficulty during practice). */
  config: GameConfig;
  /** 1-indexed current round number. 0 means no round started. */
  currentRound: number;
  /** The active puzzle for the current round. Null between rounds. */
  currentPuzzle: Puzzle | null;
  /** Player states for the current round. */
  players: PlayerState[];
  /** Results from all completed rounds in the current match. */
  roundResults: RoundResult[];
  /** Accumulated multiplayer statistics. Null outside a match. */
  matchStatistics: MatchStatistics | null;
  /** Accumulated practice mode statistics. Null outside practice. */
  practiceStatistics: PracticeStatistics | null;
  /** Timestamp when the display phase started. */
  displayStartTime: number | null;
  /** Timestamp when the answer phase started. */
  answerStartTime: number | null;
  /** Display duration for the current round (seconds). */
  currentDisplayDuration: number;
  /**
   * Difficulty progression level name that is shown to the player
   * when they advance. Reset each session.
   * Null when no progression happened in the latest round.
   */
  difficultyJustAdvanced: boolean;
}

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

export interface GameActions {
  // -- Configuration --
  updateConfig: (updates: Partial<GameConfig>) => void;

  // -- Game lifecycle --
  /** Start a new match/practice session from SETTINGS. */
  startMatch: () => void;
  /** Game loop tick. Handles timer-based automatic transitions. */
  tick: (now: number) => void;
  /** Continue from ROUND_RESULTS to next round or FINAL_RESULTS. */
  continueFromResults: () => void;
  /** Reset all state and return to HOME. */
  resetToHome: () => void;
  /** Navigate to SETTINGS from HOME or FINAL_RESULTS. */
  goToSettings: () => void;
  /** Navigate back to HOME from SETTINGS. */
  goToHome: () => void;

  // -- Player actions --
  incrementAnswer: (playerId: PlayerId, amount?: number) => void;
  decrementAnswer: (playerId: PlayerId) => void;
  submitAnswer: (playerId: PlayerId) => void;
}

// ---------------------------------------------------------------------------
// Store type
// ---------------------------------------------------------------------------

export type GameStore = GameState & GameActions;

// ---------------------------------------------------------------------------
// Initial state
// ---------------------------------------------------------------------------

function createInitialState(): GameState {
  return {
    phase: GamePhase.HOME,
    config: DEFAULT_GAME_CONFIG,
    currentRound: 0,
    currentPuzzle: null,
    players: [],
    roundResults: [],
    matchStatistics: null,
    practiceStatistics: null,
    displayStartTime: null,
    answerStartTime: null,
    currentDisplayDuration: DEFAULT_GAME_CONFIG.initialDisplayTime,
    difficultyJustAdvanced: false,
  };
}

// ---------------------------------------------------------------------------
// Store creation
// ---------------------------------------------------------------------------

export const useGameStore = create<GameStore>()(
  devtools(
    (set, get) => ({
      ...createInitialState(),

      // -- Configuration -----------------------------------------------------

      updateConfig: (updates) =>
        set(
          (state) => ({ config: { ...state.config, ...updates } }),
          false,
          'updateConfig',
        ),

      // -- Game lifecycle ----------------------------------------------------

      startMatch: () => {
        const { config, phase } = get();
        const newPhase = transition(phase, GamePhase.GENERATING_PUZZLE);

        // Create players
        const players: PlayerState[] =
          config.gameMode === GameMode.LOCAL_MULTIPLAYER
            ? [
                createInitialPlayerState('player1'),
                createInitialPlayerState('player2'),
              ]
            : [createInitialPlayerState('player1')];

        // Initialize statistics
        const isMultiplayer =
          config.gameMode === GameMode.LOCAL_MULTIPLAYER;
        const matchStatistics = isMultiplayer
          ? createMatchStats(
              players.map((p) => p.id),
              config.numberOfRounds,
            )
          : null;
        const practiceStatistics = !isMultiplayer
          ? createPracticeStats()
          : null;

        // Generate puzzle for round 1
        const puzzle = generatePuzzleForRound(config, 1);
        const displayDuration = getDisplayTimeForCurrentRound(config, 1);

        set(
          {
            phase: newPhase,
            currentRound: 1,
            currentPuzzle: puzzle,
            players,
            roundResults: [],
            matchStatistics,
            practiceStatistics,
            displayStartTime: null,
            answerStartTime: null,
            currentDisplayDuration: displayDuration,
            difficultyJustAdvanced: false,
          },
          false,
          'startMatch',
        );
      },

      tick: (now) => {
        const state = get();

        // GENERATING_PUZZLE → DISPLAYING_PUZZLE (auto: puzzle is ready)
        if (
          state.phase === GamePhase.GENERATING_PUZZLE &&
          state.currentPuzzle !== null
        ) {
          set(
            {
              phase: transition(
                state.phase,
                GamePhase.DISPLAYING_PUZZLE,
              ),
              displayStartTime: now,
            },
            false,
            'tick:startDisplay',
          );
          return;
        }

        // DISPLAYING_PUZZLE → ANSWER_PHASE (auto: display timer expired)
        if (
          state.phase === GamePhase.DISPLAYING_PUZZLE &&
          isTimerExpired(
            state.displayStartTime,
            state.currentDisplayDuration,
            now,
          )
        ) {
          set(
            {
              phase: transition(
                state.phase,
                GamePhase.ANSWER_PHASE,
              ),
              answerStartTime: now,
            },
            false,
            'tick:startAnswer',
          );
          return;
        }

        // ANSWER_PHASE → VALIDATING (auto: all submitted OR timer expired)
        if (state.phase === GamePhase.ANSWER_PHASE) {
          const timerExpired = isTimerExpired(
            state.answerStartTime,
            state.config.maximumAnswerTime,
            now,
          );
          const allSubmitted = allPlayersSubmitted(state.players);

          if (timerExpired || allSubmitted) {
            // Lock unsubmitted players on timeout
            const finalPlayers = timerExpired
              ? lockAllUnsubmitted(
                  state.players,
                  state.config.maximumAnswerTime,
                )
              : state.players;

            set(
              {
                phase: transition(
                  state.phase,
                  GamePhase.VALIDATING,
                ),
                players: finalPlayers,
              },
              false,
              timerExpired
                ? 'tick:answerTimeout'
                : 'tick:allSubmitted',
            );
            return;
          }
        }

        // VALIDATING → ROUND_RESULTS (auto: instant validation)
        if (state.phase === GamePhase.VALIDATING) {
          const correctAnswer = state.currentPuzzle?.totalCubes ?? 0;
          const roundResult = validateRound(
            state.players,
            correctAnswer,
            state.currentRound,
            state.config.maximumAnswerTime,
          );

          // Update statistics
          let { matchStatistics, practiceStatistics, config } = state;
          let difficultyJustAdvanced = false;

          if (matchStatistics) {
            matchStatistics = updateMatchStats(
              matchStatistics,
              roundResult,
            );
          }

          if (practiceStatistics) {
            const playerResult = roundResult.playerResults[0];
            if (playerResult) {
              practiceStatistics = updatePracticeStats(
                practiceStatistics,
                playerResult.isCorrect,
                playerResult.answerTime,
              );

              // ── Difficulty progression ─────────────────────────────────
              // Every DIFFICULTY_PROGRESSION_THRESHOLD correct answers,
              // advance difficulty (only in practice mode).
              const newCorrectCount = practiceStatistics.correctAnswers;
              const shouldAdvance =
                newCorrectCount > 0 &&
                newCorrectCount % DIFFICULTY_PROGRESSION_THRESHOLD === 0 &&
                playerResult.isCorrect;

              if (shouldAdvance) {
                const nextDifficulty = getNextDifficultyLevel(config.difficulty);
                if (nextDifficulty !== config.difficulty) {
                  config = { ...config, difficulty: nextDifficulty };
                  difficultyJustAdvanced = true;
                }
              }
            }
          }

          // Update player validation state
          const validatedPlayers = state.players.map((p) => {
            const result = roundResult.playerResults.find(
              (r) => r.playerId === p.id,
            );
            return result
              ? {
                  ...p,
                  isCorrect: result.isCorrect,
                  recordedTime: result.recordedTime,
                }
              : p;
          });

          set(
            {
              phase: transition(
                state.phase,
                GamePhase.ROUND_RESULTS,
              ),
              config,
              players: validatedPlayers,
              roundResults: [...state.roundResults, roundResult],
              matchStatistics,
              practiceStatistics,
              difficultyJustAdvanced,
            },
            false,
            'tick:validated',
          );
          return;
        }
      },

      continueFromResults: () => {
        const state = get();

        if (state.phase !== GamePhase.ROUND_RESULTS) return;

        // Check if this was the last round
        if (isLastRound(state.config, state.currentRound)) {
          set(
            {
              phase: transition(
                state.phase,
                GamePhase.FINAL_RESULTS,
              ),
            },
            false,
            'continueFromResults:final',
          );
          return;
        }

        // Start next round
        const nextRound = state.currentRound + 1;
        const puzzle = generatePuzzleForRound(state.config, nextRound);
        const displayDuration = getDisplayTimeForCurrentRound(
          state.config,
          nextRound,
        );

        const resetPlayers = state.players.map((p) =>
          createInitialPlayerState(p.id),
        );

        set(
          {
            phase: transition(
              state.phase,
              GamePhase.GENERATING_PUZZLE,
            ),
            currentRound: nextRound,
            currentPuzzle: puzzle,
            players: resetPlayers,
            displayStartTime: null,
            answerStartTime: null,
            currentDisplayDuration: displayDuration,
            difficultyJustAdvanced: false,
          },
          false,
          'continueFromResults:nextRound',
        );
      },

      resetToHome: () =>
        set(createInitialState(), false, 'resetToHome'),

      goToSettings: () => {
        const { phase } = get();
        set(
          { phase: transition(phase, GamePhase.SETTINGS) },
          false,
          'goToSettings',
        );
      },

      goToHome: () => {
        const { phase } = get();
        set(
          { phase: transition(phase, GamePhase.HOME) },
          false,
          'goToHome',
        );
      },

      // -- Player actions ----------------------------------------------------

      incrementAnswer: (playerId, amount = 1) => {
        const { phase, players } = get();
        if (phase !== GamePhase.ANSWER_PHASE) return;
        set(
          { players: AnswerManager.incrementAnswer(players, playerId, amount) },
          false,
          'incrementAnswer',
        );
      },

      decrementAnswer: (playerId) => {
        const { phase, players } = get();
        if (phase !== GamePhase.ANSWER_PHASE) return;
        set(
          { players: AnswerManager.decrementAnswer(players, playerId) },
          false,
          'decrementAnswer',
        );
      },

      submitAnswer: (playerId) => {
        const { phase, players, answerStartTime } = get();
        if (phase !== GamePhase.ANSWER_PHASE) return;
        const elapsed = getElapsedSeconds(answerStartTime, Date.now());
        set(
          {
            players: AnswerManager.submitAnswer(players, playerId, elapsed),
          },
          false,
          'submitAnswer',
        );
      },
    }),
    { name: 'CubeCount' },
  ),
);
