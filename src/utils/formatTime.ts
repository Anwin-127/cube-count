/**
 * Formats a time value in seconds to a display string.
 *
 * @param seconds - Time in seconds (may include fractional part).
 * @param precision - Number of decimal places. Defaults to 2.
 * @returns Formatted string, e.g. "4.62" or "10.00".
 */
export function formatTime(seconds: number, precision = 2): string {
  return seconds.toFixed(precision);
}

/**
 * Formats a time value with a "s" suffix for display.
 *
 * @param seconds - Time in seconds.
 * @returns Formatted string, e.g. "4.62s".
 */
export function formatTimeWithUnit(seconds: number): string {
  return `${formatTime(seconds)}s`;
}
