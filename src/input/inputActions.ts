/**
 * Semantic input actions that the game engine understands.
 *
 * The Input Manager translates physical keyboard events into these actions.
 * No other module should reference physical key codes.
 */
export const InputAction = {
  PLAYER1_INCREMENT: 'PLAYER1_INCREMENT',
  PLAYER1_INCREMENT_TEN: 'PLAYER1_INCREMENT_TEN',
  PLAYER1_DECREMENT: 'PLAYER1_DECREMENT',
  PLAYER1_SUBMIT: 'PLAYER1_SUBMIT',

  PLAYER2_INCREMENT: 'PLAYER2_INCREMENT',
  PLAYER2_INCREMENT_TEN: 'PLAYER2_INCREMENT_TEN',
  PLAYER2_DECREMENT: 'PLAYER2_DECREMENT',
  PLAYER2_SUBMIT: 'PLAYER2_SUBMIT',

  /** Advance past results screens. */
  CONTINUE: 'CONTINUE',
} as const;

export type InputAction = (typeof InputAction)[keyof typeof InputAction];
