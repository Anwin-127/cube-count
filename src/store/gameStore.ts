import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { GamePhase } from '../models/GamePhase';
import { GameMode } from '../models/GameMode';
import { Difficulty } from '../models/Difficulty';
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
  createSessionHistory,
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
import type { SessionHistory } from '../engine';
import { DIFFICULTY_MAX_HEIGHTS } from '../config/constants';
import * as AnswerManager from '../engine/AnswerManager';
import { TimeService } from '../online/TimeService';

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
  /** Timestamp when the validating phase started. */
  validatingStartTime: number | null;
  /** Display duration for the current round (seconds). */
  currentDisplayDuration: number;
  /**
   * Difficulty progression level name that is shown to the player
   * when they advance. Reset each session.
   * Null when no progression happened in the latest round.
   */
  difficultyJustAdvanced: boolean;
  /** Session deduplication history (exact hashes, signatures, recipe names). */
  sessionHistory: SessionHistory;
  /** The player's display name for online play. */
  displayName: string | null;
  /** The player's Firebase UID. */
  playerUid: string | null;
  /** The current active online room ID. */
  activeRoomId: string | null;
  /** The current active online room code. */
  activeRoomCode: string | null;
  /** Host UID for online match. */
  onlineHostUid: string | null;
  /** Guest UID for online match. */
  onlineGuestUid: string | null;
  /** Disconnected Player UID. */
  onlineDisconnectedUid: string | null;
  /** Track which UIDs have clicked Continue in the current online results screen. */
  onlineContinueReady: Record<string, boolean> | null;
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
  /** Continue from FINAL_RESULTS (start new match with same or new seed). */
  continueFromFinalResults: (replaySameSeed: boolean) => void;
  /** Reset all state and return to HOME. */
  resetToHome: () => void;
  /** Navigate to SETTINGS from HOME or FINAL_RESULTS. */
  goToSettings: () => void;
  /** Navigate back to HOME from SETTINGS. */
  goToHome: () => void;
  /** Navigate to ONLINE_MENU from HOME. */
  goToOnlineMenu: () => void;
  /** Navigate to WAITING_ROOM. */
  goToWaitingRoom: () => void;
  /** Set online identity. */
  setOnlineIdentity: (uid: string, name: string) => void;
  /** Set active room. */
  setActiveRoom: (roomId: string, code: string, hostUid: string, guestUid?: string) => void;
  /** Set player names for online mode. */
  setPlayerNames: (p1Name: string, p2Name: string) => void;
  /** Clear active room. */
  clearActiveRoom: () => void;
  
  // -- Online Actions --
  /** Apply round information from Firebase. */
  startOnlineRound: (roundNumber: number, seed: number, difficulty: string, displayStartTime: number | null) => void;
  /** Apply player submission from Firebase. */
  applyOnlineSubmission: (playerId: string, answer: number, elapsed: number) => void;

  // -- Player actions --
  incrementAnswer: (playerId: PlayerId, amount?: number) => void;
  decrementAnswer: (playerId: PlayerId, amount?: number) => void;
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
    validatingStartTime: null,
    currentDisplayDuration: DEFAULT_GAME_CONFIG.initialDisplayTime,
    difficultyJustAdvanced: false,
    sessionHistory: createSessionHistory(),
    displayName: null,
    playerUid: null,
    activeRoomId: null,
    activeRoomCode: null,
    onlineHostUid: null,
    onlineGuestUid: null,
    onlineDisconnectedUid: null,
    onlineContinueReady: null,
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
        const { config, phase, sessionHistory } = get();
        const newPhase = transition(phase, GamePhase.GENERATING_PUZZLE);

        const activeConfig = { ...config };

        // Create players
        const players: PlayerState[] =
          activeConfig.gameMode === GameMode.LOCAL_MULTIPLAYER
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
              activeConfig.numberOfRounds,
            )
          : null;
        const practiceStatistics = !isMultiplayer
          ? createPracticeStats()
          : null;

        // Generate puzzle for round 1, using fresh session history
        const freshHistory = createSessionHistory();
        const { puzzle, history: newHistory } = generatePuzzleForRound(activeConfig, 1, freshHistory);
        const displayDuration = getDisplayTimeForCurrentRound(activeConfig, 1);
        const seed = puzzle.metadata.seed;

        if (matchStatistics) {
          matchStatistics.seedsUsed = [seed];
        }
        if (practiceStatistics) {
          practiceStatistics.seedsUsed = [seed];
        }

        set(
          {
            phase: newPhase,
            config: activeConfig,
            currentRound: 1,
            currentPuzzle: puzzle,
            players,
            roundResults: [],
            matchStatistics,
            practiceStatistics,
            displayStartTime: null,
            answerStartTime: null,
            validatingStartTime: null,
            currentDisplayDuration: displayDuration,
            difficultyJustAdvanced: false,
            sessionHistory: newHistory,
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
          // If we are waiting for an online countdown, we DO NOT transition here automatically.
          if (state.config.gameMode === GameMode.ONLINE_MULTIPLAYER) {
            return;
          }
          
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

        // ONLINE_COUNTDOWN → DISPLAYING_PUZZLE (auto: timer reached)
        if (state.phase === GamePhase.ONLINE_COUNTDOWN) {
           if (now >= state.displayStartTime!) {
              set(
                { phase: transition(state.phase, GamePhase.DISPLAYING_PUZZLE) },
                false,
                'tick:startDisplayOnline'
              );
           }
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
            // Auto-broadcast the local player's answer on timeout in online mode.
            // This ensures the remote client knows what the player's counter was at 
            // when time ran out, avoiding a state mismatch during evaluation.
            if (timerExpired && state.config.gameMode === GameMode.ONLINE_MULTIPLAYER && state.activeRoomId && state.playerUid) {
               const localPlayerId = state.playerUid === state.onlineHostUid ? 'player1' : 
                                     state.playerUid === state.onlineGuestUid ? 'player2' : null;
               if (localPlayerId) {
                 const localPlayer = state.players.find(p => p.id === localPlayerId);
                 if (localPlayer && !localPlayer.hasSubmitted) {
                    import('../online/OnlineGameplayService').then(m => {
                      m.OnlineGameplayService.submitAnswer(
                        state.activeRoomId!, 
                        state.playerUid!, 
                        localPlayer.currentAnswer, 
                        state.config.maximumAnswerTime, 
                        state.currentRound
                      );
                    });
                 }
               }
            }

            set(
              {
                phase: transition(
                  state.phase,
                  GamePhase.VALIDATING,
                ),
                validatingStartTime: now,
              },
              false,
              timerExpired
                ? 'tick:answerTimeout'
                : 'tick:allSubmitted',
            );
            return;
          }
        }

        // VALIDATING → ROUND_RESULTS (auto: instant validation, or delayed for online)
        if (state.phase === GamePhase.VALIDATING) {
          const isOnline = state.config.gameMode === GameMode.ONLINE_MULTIPLAYER;
          const delayMs = isOnline ? 1500 : 0;

          if (now >= state.validatingStartTime! + delayMs) {
            // Lock unsubmitted players now that the buffer is complete
            const finalPlayers = lockAllUnsubmitted(state.players, state.config.maximumAnswerTime);

            const correctAnswer = state.currentPuzzle?.totalCubes ?? 0;
            const roundResult = validateRound(
              finalPlayers,
              correctAnswer,
              state.currentRound,
              state.config.maximumAnswerTime,
            );

            if (import.meta.env.DEV && state.config.gameMode === GameMode.ONLINE_MULTIPLAYER) {
              console.log('[Sync] Round Validated:', roundResult);
            }

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
                  const newDisplayTime = nextDifficulty === Difficulty.EASY ? 5 : nextDifficulty === Difficulty.MEDIUM ? 3 : 2;
                  config = { ...config, difficulty: nextDifficulty, initialDisplayTime: Math.min(config.initialDisplayTime, newDisplayTime) };
                  difficultyJustAdvanced = true;
                }
              }
            }
          }

          // Update player validation state
          const validatedPlayers = finalPlayers.map((p) => {
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
        }
      },

      continueFromResults: () => {
        const state = get();

        if (state.phase !== GamePhase.ROUND_RESULTS) return;

        // Check if this was the last round
        if (isLastRound(state.config, state.currentRound, state.matchStatistics)) {
          // If online and host, we could trigger endMatch here
          if (state.config.gameMode === GameMode.ONLINE_MULTIPLAYER && state.activeRoomId && state.playerUid === state.onlineHostUid) {
             import('../online/OnlineGameplayService').then(m => {
               m.OnlineGameplayService.endMatch(state.activeRoomId!);
             });
          }
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

        const nextRound = state.currentRound + 1;

        if (state.config.gameMode === GameMode.ONLINE_MULTIPLAYER && state.activeRoomId && state.playerUid) {
          import('../online/OnlineGameplayService').then(m => {
             m.OnlineGameplayService.setContinueReady(state.activeRoomId!, state.playerUid!);
          });
          // Do not transition FSM locally. Wait for sync state change.
          return;
        }

        // --- Local Gameplay Logic ---
        const { puzzle, history: newHistory } = generatePuzzleForRound(
          state.config,
          nextRound,
          state.sessionHistory,
        );
        const displayDuration = getDisplayTimeForCurrentRound(
          state.config,
          nextRound,
        );
        const seed = puzzle.metadata.seed;

        let matchStatistics = state.matchStatistics;
        if (matchStatistics) {
           matchStatistics = { ...matchStatistics, seedsUsed: [...matchStatistics.seedsUsed, seed] };
        }
        let practiceStatistics = state.practiceStatistics;
        if (practiceStatistics) {
           practiceStatistics = { ...practiceStatistics, seedsUsed: [...practiceStatistics.seedsUsed, seed] };
        }

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
            validatingStartTime: null,
            currentDisplayDuration: displayDuration,
            difficultyJustAdvanced: false,
            sessionHistory: newHistory,
            matchStatistics,
            practiceStatistics,
          },
          false,
          'continueFromResults:nextRound',
        );
      },

      continueFromFinalResults: (replaySameSeed: boolean) => {
        const state = get();
        if (state.phase !== GamePhase.FINAL_RESULTS) return;
        
        const newConfig = { ...state.config };
        if (replaySameSeed) {
           if (state.matchStatistics && state.matchStatistics.seedsUsed.length > 0) {
             newConfig.replaySeeds = [...state.matchStatistics.seedsUsed];
           } else if (state.practiceStatistics && state.practiceStatistics.seedsUsed.length > 0) {
             newConfig.replaySeeds = [...state.practiceStatistics.seedsUsed];
           }
        } else {
           newConfig.replaySeeds = undefined;
        }
        
        set({ config: newConfig }, false, 'continueFromFinalResults:setConfig');
        
        if (state.config.gameMode === GameMode.ONLINE_MULTIPLAYER) {
          get().goToWaitingRoom();
        } else {
          get().startMatch();
        }
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

      goToOnlineMenu: () => {
        const { phase, config } = get();
        set(
          { phase: transition(phase, GamePhase.ONLINE_MENU), config: { ...config, gameMode: GameMode.ONLINE_MULTIPLAYER } },
          false,
          'goToOnlineMenu',
        );
      },

      goToWaitingRoom: () => {
        const { phase, config } = get();
        set(
          { phase: transition(phase, GamePhase.WAITING_ROOM), config: { ...config, gameMode: GameMode.ONLINE_MULTIPLAYER } },
          false,
          'goToWaitingRoom',
        );
      },

      setOnlineIdentity: (uid, name) => {
        set({ playerUid: uid, displayName: name }, false, 'setOnlineIdentity');
      },

      setActiveRoom: (roomId, code, hostUid, guestUid) => {
        const config = get().config;
        set({ activeRoomId: roomId, activeRoomCode: code, onlineHostUid: hostUid, onlineGuestUid: guestUid || null, config: { ...config, gameMode: GameMode.ONLINE_MULTIPLAYER } }, false, 'setActiveRoom');
      },

      setPlayerNames: (p1Name, p2Name) => {
        const state = get();
        const updatedPlayers = state.players.map(p => {
           if (p.id === 'player1') return { ...p, displayName: p1Name };
           if (p.id === 'player2') return { ...p, displayName: p2Name };
           return p;
        });
        set({ players: updatedPlayers }, false, 'setPlayerNames');
      },

      clearActiveRoom: () => {
        set({ activeRoomId: null, activeRoomCode: null, onlineHostUid: null, onlineGuestUid: null }, false, 'clearActiveRoom');
      },

      startOnlineRound: (roundNumber, seed, difficultyStr, displayStart) => {
        const state = get();
        const difficulty = difficultyStr as Difficulty;
        
        const config = { ...state.config, difficulty };
        
        // Ensure players are reset, and always force 2 players for online mode
        const resetPlayers = state.players.length === 2 
           ? state.players.map((p) => createInitialPlayerState(p.id))
           : [createInitialPlayerState('player1'), createInitialPlayerState('player2')];

        // Restore display names if we had them
        const p1Name = state.players.find(p => p.id === 'player1')?.displayName;
        const p2Name = state.players.find(p => p.id === 'player2')?.displayName;
        if (p1Name) resetPlayers[0].displayName = p1Name;
        if (p2Name) resetPlayers[1].displayName = p2Name;

        const { puzzle, history: newHistory } = generatePuzzleForRound(
          { ...config, puzzleSeed: seed },
          roundNumber,
          state.sessionHistory,
        );
        
        // Calculate display duration from the synced deadline and start time, 
        // or just use the config default if not provided yet.
        const displayDuration = getDisplayTimeForCurrentRound(config, roundNumber);
        
        // Wait for countdown phase to transition to DISPLAYING_PUZZLE natively
        let phase: GamePhase = GamePhase.GENERATING_PUZZLE;
        if (displayStart) {
           phase = GamePhase.DISPLAYING_PUZZLE;
        }

        let matchStatistics = state.matchStatistics;
        if (!matchStatistics && roundNumber === 1) {
           matchStatistics = createMatchStats(['player1', 'player2'], config.numberOfRounds);
           matchStatistics.seedsUsed = [seed];
        } else if (matchStatistics && roundNumber > 1) {
           matchStatistics = { ...matchStatistics, seedsUsed: [...matchStatistics.seedsUsed, seed] };
        } else if (roundNumber === 1 && matchStatistics) {
           matchStatistics.seedsUsed = [seed];
        }

        set(
          {
            phase,
            config,
            currentRound: roundNumber,
            currentPuzzle: puzzle,
            players: resetPlayers,
            matchStatistics,
            displayStartTime: displayStart,
            answerStartTime: null,
            validatingStartTime: null,
            currentDisplayDuration: displayDuration,
            difficultyJustAdvanced: false,
            sessionHistory: newHistory,
          },
          false,
          'startOnlineRound',
        );
      },

      applyOnlineSubmission: (playerId, answer, elapsed) => {
        const { phase, players, validatingStartTime } = get();
        // Even if local phase is VALIDATING or ROUND_RESULTS, we might receive a late submission
        // But let's apply it if the player hasn't submitted yet.
        const player = players.find(p => p.id === playerId);
        if (player && !player.hasSubmitted) {
           const updatedPlayers = players.map(p => {
             if (p.id === playerId) {
               return { ...p, currentAnswer: answer, hasSubmitted: true, answerTime: elapsed };
             }
             return p;
           });
           
           set(
             { 
               players: updatedPlayers,
               // Automatically advance if everyone has submitted (and we are in ANSWER_PHASE)
               phase: (phase === GamePhase.ANSWER_PHASE && AnswerManager.allPlayersSubmitted(updatedPlayers))
                 ? transition(phase, GamePhase.VALIDATING)
                 : phase,
               validatingStartTime: (phase === GamePhase.ANSWER_PHASE && AnswerManager.allPlayersSubmitted(updatedPlayers))
                 ? TimeService.getServerTime()
                 : validatingStartTime,
             }, 
             false, 
             'applyOnlineSubmission'
           );
        }
      },

      // -- Player actions ----------------------------------------------------

      incrementAnswer: (playerId, amount = 1) => {
        const { phase, players, config, playerUid, onlineHostUid, onlineGuestUid } = get();
        if (phase !== GamePhase.ANSWER_PHASE) return;
        
        if (config.gameMode === GameMode.ONLINE_MULTIPLAYER && playerUid) {
           const isLocalPlayer = (playerUid === onlineHostUid && playerId === 'player1') || 
                                 (playerUid === onlineGuestUid && playerId === 'player2');
           if (!isLocalPlayer) return;
        }

        set(
          { players: AnswerManager.incrementAnswer(players, playerId, amount) },
          false,
          'incrementAnswer',
        );
      },

      decrementAnswer: (playerId, amount = 1) => {
        const { phase, players, config, playerUid, onlineHostUid, onlineGuestUid } = get();
        if (phase !== GamePhase.ANSWER_PHASE) return;
        
        if (config.gameMode === GameMode.ONLINE_MULTIPLAYER && playerUid) {
           const isLocalPlayer = (playerUid === onlineHostUid && playerId === 'player1') || 
                                 (playerUid === onlineGuestUid && playerId === 'player2');
           if (!isLocalPlayer) return;
        }
        set(
          { players: AnswerManager.decrementAnswer(players, playerId, amount) },
          false,
          'decrementAnswer',
        );
      },

      submitAnswer: (playerId) => {
        const state = get();
        const { phase, players, answerStartTime, config, activeRoomId, playerUid, currentRound, onlineHostUid, onlineGuestUid } = state;
        if (phase !== GamePhase.ANSWER_PHASE) return;
        const elapsed = getElapsedSeconds(answerStartTime, TimeService.getServerTime());
        
        const nextPlayers = AnswerManager.submitAnswer(players, playerId, elapsed);

        if (config.gameMode === GameMode.ONLINE_MULTIPLAYER && activeRoomId && playerUid) {
          const isLocalPlayer = (playerUid === onlineHostUid && playerId === 'player1') || 
                                (playerUid === onlineGuestUid && playerId === 'player2');
          
          if (isLocalPlayer) {
             const answer = nextPlayers.find(p => p.id === playerId)?.currentAnswer ?? 0;
             import('../online/OnlineGameplayService').then(m => {
               m.OnlineGameplayService.submitAnswer(activeRoomId, playerUid, answer, elapsed, currentRound);
             });
          }
        }

        set(
          {
            players: nextPlayers,
            // Automatically advance if everyone has submitted
            phase: AnswerManager.allPlayersSubmitted(nextPlayers)
              ? transition(phase, GamePhase.VALIDATING)
              : phase,
          },
          false,
          'submitAnswer',
        );
      },
    }),
    { name: 'CubeCount' },
  ),
);
