import { GamePhase } from '../models/GamePhase';

/**
 * Defines the valid transitions for each game phase.
 *
 * This is the canonical source of truth for the game FSM.
 * No state transition should ever bypass this map.
 *
 * Diagram:
 *
 *  HOME ──→ SETTINGS ──→ GENERATING_PUZZLE ──→ DISPLAYING_PUZZLE
 *   ↑          ↑                ↑                     │
 *   │          │                │                     ▼
 *   │          │                │               ANSWER_PHASE
 *   │          │                │                     │
 *   │          │                │                     ▼
 *   │          │                │                VALIDATING
 *   │          │                │                     │
 *   │          │                │                     ▼
 *   │          │                └──────────── ROUND_RESULTS
 *   │          │                                      │
 *   │          └──────────────────────────── FINAL_RESULTS
 *   │                                                 │
 *   └─────────────────────────────────────────────────┘
 */
const VALID_TRANSITIONS: Record<GamePhase, readonly GamePhase[]> = {
  [GamePhase.HOME]: [GamePhase.SETTINGS],
  [GamePhase.SETTINGS]: [GamePhase.HOME, GamePhase.GENERATING_PUZZLE],
  [GamePhase.GENERATING_PUZZLE]: [GamePhase.DISPLAYING_PUZZLE],
  [GamePhase.DISPLAYING_PUZZLE]: [GamePhase.ANSWER_PHASE],
  [GamePhase.ANSWER_PHASE]: [GamePhase.VALIDATING],
  [GamePhase.VALIDATING]: [GamePhase.ROUND_RESULTS],
  [GamePhase.ROUND_RESULTS]: [
    GamePhase.GENERATING_PUZZLE,
    GamePhase.FINAL_RESULTS,
  ],
  [GamePhase.FINAL_RESULTS]: [GamePhase.HOME, GamePhase.SETTINGS],
};

/**
 * Checks whether a transition from one phase to another is valid.
 */
export function canTransition(from: GamePhase, to: GamePhase): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

/**
 * Attempts a phase transition. Returns the new phase if valid.
 *
 * @throws Error if the transition is not allowed.
 */
export function transition(from: GamePhase, to: GamePhase): GamePhase {
  if (!canTransition(from, to)) {
    throw new Error(
      `Invalid state transition: ${from} → ${to}. ` +
        `Valid targets from ${from}: [${VALID_TRANSITIONS[from]?.join(', ') ?? 'none'}]`,
    );
  }
  return to;
}

/**
 * Returns all valid target phases from the given phase.
 */
export function getValidTransitions(from: GamePhase): readonly GamePhase[] {
  return VALID_TRANSITIONS[from] ?? [];
}
