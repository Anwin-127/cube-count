import { DisplayMode } from '../models/DisplayMode';
import { PROGRESSIVE_DISPLAY_SCHEDULE } from '../config/constants';

/**
 * Timer state tracked by the game store.
 * Timestamps are absolute (Date.now()) values.
 */
export interface TimerState {
  readonly displayStartTime: number | null;
  readonly answerStartTime: number | null;
}

/**
 * Returns the display time in seconds for a given round.
 *
 * In FIXED mode, returns the configured display time.
 * In PROGRESSIVE mode, the time decreases according to
 * the progressive schedule defined in constants.
 */
export function getDisplayTimeForRound(
  displayMode: DisplayMode,
  initialDisplayTime: number,
  round: number,
): number {
  if (displayMode === DisplayMode.FIXED) {
    return initialDisplayTime;
  }

  // Progressive: find the matching bracket
  for (const bracket of PROGRESSIVE_DISPLAY_SCHEDULE) {
    if (round <= bracket.maxRound) {
      return bracket.displayTime;
    }
  }

  // Beyond all brackets: use the last bracket's value
  const lastBracket =
    PROGRESSIVE_DISPLAY_SCHEDULE[PROGRESSIVE_DISPLAY_SCHEDULE.length - 1];
  return lastBracket?.displayTime ?? initialDisplayTime;
}

/**
 * Calculates the elapsed time in seconds since a timer started.
 * Returns 0 if the timer hasn't started.
 */
export function getElapsedSeconds(
  startTime: number | null,
  now: number,
): number {
  if (startTime === null) return 0;
  return Math.max(0, (now - startTime) / 1000);
}

/**
 * Calculates the remaining time in seconds on a timer.
 * Returns 0 if expired, the full duration if not started.
 */
export function getRemainingSeconds(
  startTime: number | null,
  duration: number,
  now: number,
): number {
  if (startTime === null) return duration;
  return Math.max(0, duration - getElapsedSeconds(startTime, now));
}

/**
 * Checks whether a timer has expired.
 */
export function isTimerExpired(
  startTime: number | null,
  duration: number,
  now: number,
): boolean {
  if (startTime === null) return false;
  return getElapsedSeconds(startTime, now) >= duration;
}
