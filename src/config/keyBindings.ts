import { InputAction } from '../input/inputActions';

/**
 * Maps physical keyboard event.code values to semantic InputActions.
 *
 * Uses event.code (layout-independent) rather than event.key
 * so controls work consistently regardless of keyboard layout.
 */
export type KeyBindings = Readonly<Record<string, InputAction>>;

/**
 * Default keyboard bindings.
 *
 * Player 1 (left side of keyboard):
 *   W = +10, A = +1, S = -1, Left Shift = Submit
 *
 * Player 2 (right side of keyboard):
 *   O = +10, L = +1, K = -1, Right Shift = Submit
 *
 * Shared:
 *   Space = Continue (advance past results)
 *
 * These defaults are configurable through GameConfig in future versions.
 */
export const DEFAULT_KEY_BINDINGS: KeyBindings = {
  KeyW: InputAction.PLAYER1_INCREMENT,
  KeyA: InputAction.PLAYER1_DECREMENT_TEN,
  KeyS: InputAction.PLAYER1_DECREMENT,
  KeyD: InputAction.PLAYER1_INCREMENT_TEN,
  ShiftLeft: InputAction.PLAYER1_SUBMIT,

  ArrowUp: InputAction.PLAYER2_INCREMENT,
  ArrowLeft: InputAction.PLAYER2_DECREMENT_TEN,
  ArrowDown: InputAction.PLAYER2_DECREMENT,
  ArrowRight: InputAction.PLAYER2_INCREMENT_TEN,
  ShiftRight: InputAction.PLAYER2_SUBMIT,

  Space: InputAction.CONTINUE,
};
