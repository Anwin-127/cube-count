import { InputAction } from './inputActions';
import type { KeyBindings } from '../config/keyBindings';

/**
 * Translates physical keyboard events into semantic game actions.
 *
 * This is the only module that touches raw keyboard events.
 * All other systems work exclusively with InputAction values.
 *
 * Responsibilities:
 *   - Listen to keydown events on the window
 *   - Map event.code to an InputAction via configurable key bindings
 *   - Invoke the registered action handler
 *
 * Non-responsibilities:
 *   - Does NOT modify game state directly
 *   - Does NOT know which game phase is active
 *   - Does NOT contain gameplay logic
 */
export class InputManager {
  private keyBindings: KeyBindings;
  private actionHandler: ((action: InputAction) => void) | null = null;
  private readonly boundHandleKeyDown: (event: KeyboardEvent) => void;
  private isActive = false;

  constructor(keyBindings: KeyBindings) {
    this.keyBindings = keyBindings;
    this.boundHandleKeyDown = this.handleKeyDown.bind(this);
  }

  /**
   * Registers a callback that receives InputActions when keys are pressed.
   * The consumer (typically a React hook) decides what to do with each action.
   */
  setActionHandler(handler: (action: InputAction) => void): void {
    this.actionHandler = handler;
  }

  /** Starts listening to keyboard events. */
  start(): void {
    if (this.isActive) return;
    window.addEventListener('keydown', this.boundHandleKeyDown);
    this.isActive = true;
  }

  /** Stops listening to keyboard events. Cleans up the event listener. */
  stop(): void {
    if (!this.isActive) return;
    window.removeEventListener('keydown', this.boundHandleKeyDown);
    this.isActive = false;
  }

  /** Replaces the current key bindings at runtime. */
  updateKeyBindings(bindings: KeyBindings): void {
    this.keyBindings = bindings;
  }

  private handleKeyDown(event: KeyboardEvent): void {
    // Ignore input if the user is typing in a text field
    const target = event.target as HTMLElement;
    if (
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.isContentEditable
    ) {
      return;
    }

    const action = this.keyBindings[event.code];

    if (action !== undefined && this.actionHandler) {
      event.preventDefault();
      this.actionHandler(action);
    }
  }
}
