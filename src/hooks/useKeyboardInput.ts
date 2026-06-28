import { useEffect, useRef } from 'react';
import { InputManager } from '../input/InputManager';
import { InputAction } from '../input/inputActions';
import { DEFAULT_KEY_BINDINGS } from '../config/keyBindings';
import { useGameStore } from '../store/gameStore';
import { GamePhase } from '../models/GamePhase';

/**
 * React hook that initializes the Input Manager and routes
 * keyboard actions to the appropriate Zustand store actions.
 *
 * This hook is the bridge between the InputManager class
 * and the reactive Zustand store. It should be mounted once
 * at the application root.
 *
 * The action handler reads the current phase from the store
 * at call time (not capture time) to ensure it always has
 * the latest state without re-creating the handler.
 */
export function useKeyboardInput(): void {
  const inputManagerRef = useRef<InputManager | null>(null);

  useEffect(() => {
    const inputManager = new InputManager(DEFAULT_KEY_BINDINGS);
    inputManagerRef.current = inputManager;

    inputManager.setActionHandler((action: InputAction) => {
      const store = useGameStore.getState();

      // Player input is only accepted during the answer phase
      if (store.phase === GamePhase.ANSWER_PHASE) {
        switch (action) {
          case InputAction.PLAYER1_INCREMENT:
            store.incrementAnswer('player1', 1);
            break;
          case InputAction.PLAYER1_INCREMENT_TEN:
            store.incrementAnswer('player1', 10);
            break;
          case InputAction.PLAYER1_DECREMENT:
            store.decrementAnswer('player1', 1);
            break;
          case InputAction.PLAYER1_DECREMENT_TEN:
            store.decrementAnswer('player1', 10);
            break;
          case InputAction.PLAYER1_SUBMIT:
            store.submitAnswer('player1');
            break;
          case InputAction.PLAYER2_INCREMENT:
            store.incrementAnswer('player2', 1);
            break;
          case InputAction.PLAYER2_INCREMENT_TEN:
            store.incrementAnswer('player2', 10);
            break;
          case InputAction.PLAYER2_DECREMENT:
            store.decrementAnswer('player2', 1);
            break;
          case InputAction.PLAYER2_DECREMENT_TEN:
            store.decrementAnswer('player2', 10);
            break;
          case InputAction.PLAYER2_SUBMIT:
            store.submitAnswer('player2');
            break;
          default:
            break;
        }
      }

      // Continue action works in round results
      if (action === InputAction.CONTINUE) {
        if (store.phase === GamePhase.ROUND_RESULTS) {
          store.continueFromResults();
        }
        if (store.phase === GamePhase.FINAL_RESULTS) {
          store.resetToHome();
        }
      }
    });

    inputManager.start();

    return () => {
      inputManager.stop();
    };
  }, []);
}
