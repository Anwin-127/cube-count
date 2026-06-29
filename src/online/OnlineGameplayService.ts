import { ref, set, update, onValue, off } from 'firebase/database';
import { db, isFirebaseConfigured } from './FirebaseService';
import { TimeService } from './TimeService';
import { useGameStore } from '../store/gameStore';
import type { MatchState, OnlinePlayerSubmission, RoundInfo } from './types';
import { generateSeed } from '../puzzle';
import { GameMode } from '../models/GameMode';
import { GamePhase } from '../models/GamePhase';

export class OnlineGameplayService {
  /**
   * Starts match synchronization. (Host only)
   */
  static async startMatchSync(roomId: string, difficulty: string): Promise<void> {
    if (!isFirebaseConfigured() || !db) return;
    if (import.meta.env.DEV) console.log('[Sync] Match Started');

    const puzzleSeed = generateSeed();
    const roundInfo: RoundInfo = {
      roundNumber: 1,
      puzzleSeed,
      difficulty,
      displayStartTime: null, // Set after countdown
      answerDeadline: null,
    };

    const updates = {
      [`rooms/${roomId}/config/status`]: 'synchronizing',
      [`rooms/${roomId}/matchState/syncState`]: 'synchronizing',
      [`rooms/${roomId}/matchState/currentRoundInfo`]: roundInfo,
      [`rooms/${roomId}/matchState/clientsReady`]: null,
      [`rooms/${roomId}/matchState/countdownStartTime`]: null,
      [`rooms/${roomId}/matchState/submissions`]: null,
    };
    
    if (import.meta.env.DEV) console.log('[Sync] Synchronizing Started');

    await update(ref(db), updates);
  }

  static async reportClientReady(roomId: string, uid: string): Promise<void> {
    if (!isFirebaseConfigured() || !db) return;
    if (import.meta.env.DEV) console.log('[Sync] Synchronization Complete for client:', uid);
    await set(ref(db, `rooms/${roomId}/matchState/clientsReady/${uid}`), true);
  }

  static async setContinueReady(roomId: string, uid: string): Promise<void> {
    if (!isFirebaseConfigured() || !db) return;
    if (import.meta.env.DEV) console.log('[Sync] Continue Ready for client:', uid);
    await set(ref(db, `rooms/${roomId}/matchState/continueReady/${uid}`), true);
  }

  static async startCountdown(roomId: string): Promise<void> {
    if (!isFirebaseConfigured() || !db) return;
    if (import.meta.env.DEV) console.log('[Sync] Countdown Started');
    const countdownStartTime = TimeService.getServerTime() + 1000;
    const displayStartTime = countdownStartTime + 5000; // 5 second countdown

    const updates = {
      [`rooms/${roomId}/config/status`]: 'playing',
      [`rooms/${roomId}/matchState/syncState`]: 'countdown',
      [`rooms/${roomId}/matchState/countdownStartTime`]: countdownStartTime,
      [`rooms/${roomId}/matchState/currentRoundInfo/displayStartTime`]: displayStartTime,
    };
    
    if (import.meta.env.DEV) console.log('[Sync] Countdown Started');

    await update(ref(db), updates);
  }

  /**
   * Starts a new round after round 1. (Host only)
   */
  static async startRound(roomId: string, roundNumber: number, difficulty: string): Promise<void> {
    if (!isFirebaseConfigured() || !db) return;
    if (import.meta.env.DEV) console.log('[Sync] Round Started:', roundNumber);

    const puzzleSeed = generateSeed();

    const roundInfo: RoundInfo = {
      roundNumber,
      puzzleSeed,
      difficulty,
      displayStartTime: null, // Will be set by startCountdown after sync
      answerDeadline: null,
    };

    const updates = {
      [`rooms/${roomId}/matchState/syncState`]: 'synchronizing',
      [`rooms/${roomId}/matchState/currentRoundInfo`]: roundInfo,
      [`rooms/${roomId}/matchState/submissions`]: null,
      [`rooms/${roomId}/matchState/continueReady`]: null,
      [`rooms/${roomId}/matchState/clientsReady`]: null,
      [`rooms/${roomId}/matchState/countdownStartTime`]: null,
    };

    if (import.meta.env.DEV) console.log('[Sync] Synchronizing Started');

    await update(ref(db), updates);
  }

  /**
   * Submits an answer for the current player.
   */
  static async submitAnswer(roomId: string, playerUid: string, answer: number, elapsedTime: number, roundNumber: number): Promise<void> {
    if (!isFirebaseConfigured() || !db) return;
    if (import.meta.env.DEV) console.log('[Sync] Player Submitted:', { playerUid, answer, elapsedTime });

    const submission: OnlinePlayerSubmission = {
      answer,
      elapsedTime,
      timestamp: TimeService.getServerTime(),
      roundNumber,
    };

    const submissionRef = ref(db, `rooms/${roomId}/matchState/submissions/${playerUid}`);
    await set(submissionRef, submission);
  }

  /**
   * Ends the match prematurely due to disconnect or completion. (Host only)
   */
  static async endMatch(roomId: string): Promise<void> {
    if (!isFirebaseConfigured() || !db) return;
    const matchEndedRef = ref(db, `rooms/${roomId}/matchState/matchEnded`);
    await set(matchEndedRef, true);
  }

  /**
   * Listens to match state changes and dispatches them to the local store.
   */
  static listenToMatchState(roomId: string): () => void {
    if (!isFirebaseConfigured() || !db) return () => {};

    const stateRef = ref(db, `rooms/${roomId}/matchState`);
    onValue(stateRef, (snapshot) => {
      const state = snapshot.val() as MatchState | null;
      if (!state) return;

      const store = useGameStore.getState();

      // Ensure we only process if we are actually in the online mode
      if (store.config.gameMode !== GameMode.ONLINE_MULTIPLAYER) return;

      if (state.matchEnded) {
        // Handle match end — let the local game engine finish naturally
      }

      // ── continueReady check ──────────────────────────────────────────────
      // This must be evaluated BEFORE syncState routing, regardless of the
      // current syncState. The results screen can be present while syncState
      // is still 'countdown' from the previous round's startup sequence.
      if (state.continueReady) {
        // Always sync the ready-state to the store for UI feedback
        useGameStore.setState({ onlineContinueReady: state.continueReady });

        // Host: trigger next round once both players have clicked Continue
        if (store.playerUid === store.onlineHostUid && store.onlineGuestUid) {
          const hostReady = state.continueReady[store.onlineHostUid!] === true;
          const guestReady = state.continueReady[store.onlineGuestUid!] === true;

          if (hostReady && guestReady && state.currentRoundInfo) {
            // Idempotency: only start the next round if we are still on the
            // current round in the local store (prevents double-firing).
            if (store.currentRound === state.currentRoundInfo.roundNumber) {
              if (import.meta.env.DEV) console.log('[Sync] Both players ready — starting round', state.currentRoundInfo.roundNumber + 1);
              OnlineGameplayService.startRound(
                roomId,
                state.currentRoundInfo.roundNumber + 1,
                store.config.difficulty,
              );
              // Prevent synchronous re-entrant snapshot from corrupting state
              return;
            }
          }
        }
      } else {
        // Clear stale continueReady state when Firebase clears it
        useGameStore.setState({ onlineContinueReady: null });
      }

      // ── syncState routing ────────────────────────────────────────────────
      if (state.syncState === 'synchronizing') {
         if (store.phase !== GamePhase.ONLINE_SYNCHRONIZING && state.currentRoundInfo) {
             store.startOnlineRound(
               state.currentRoundInfo.roundNumber,
               state.currentRoundInfo.puzzleSeed,
               state.currentRoundInfo.difficulty,
               null
             );
             useGameStore.setState({ phase: GamePhase.ONLINE_SYNCHRONIZING });
             // Wait briefly so UI shows the synchronizing screen, then report ready
             setTimeout(() => {
                OnlineGameplayService.reportClientReady(roomId, store.playerUid!);
             }, 800);
         }

         // If host, check if all clients are ready then start countdown
         if (store.playerUid === store.onlineHostUid) {
            if (state.clientsReady && Object.keys(state.clientsReady).length === 2) {
               // Only trigger countdown if not already triggered (Firebase strips nulls → undefined)
               if (!state.countdownStartTime) {
                 OnlineGameplayService.startCountdown(roomId);
                 // Prevent synchronous re-entrant snapshot from corrupting state
                 return;
               }
            }
         }
      } else if (state.syncState === 'countdown') {
         // Only apply the countdown transition if the client has not yet advanced past it.
         // If the player is on ROUND_RESULTS or later, they must have completed this round
         // already — do not regress their phase back to ONLINE_COUNTDOWN.
         const isBeforeCountdown = (
           store.phase === GamePhase.ONLINE_SYNCHRONIZING ||
           store.phase === GamePhase.GENERATING_PUZZLE
         );
         if (isBeforeCountdown && state.currentRoundInfo) {
             useGameStore.setState({
               phase: GamePhase.ONLINE_COUNTDOWN,
               displayStartTime: state.currentRoundInfo.displayStartTime
             });
         }
      }

      // ── Sync Submissions ─────────────────────────────────────────────────
      if (state.submissions) {
        Object.entries(state.submissions).forEach(([uid, sub]) => {
          if (sub.roundNumber === store.currentRound) {
             const playerId = uid === store.onlineHostUid ? 'player1' : 'player2';
             const player = store.players.find(p => p.id === playerId);
             if (player && !player.hasSubmitted) {
               if (import.meta.env.DEV) console.log('[Sync] Submission Received:', { uid, answer: sub.answer, elapsedTime: sub.elapsedTime });
             }
             store.applyOnlineSubmission(playerId, sub.answer, sub.elapsedTime);
          }
        });
      }

      // ── Disconnects ───────────────────────────────────────────────────────
      if (state.disconnectedPlayerUid) {
        useGameStore.setState({ onlineDisconnectedUid: state.disconnectedPlayerUid });
      } else {
        useGameStore.setState({ onlineDisconnectedUid: null });
      }

    });

    return () => off(stateRef);
  }
}
