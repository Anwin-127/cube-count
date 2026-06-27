import { describe, it, expect } from 'vitest';
import {
  getDisplayTimeForRound,
  getElapsedSeconds,
  getRemainingSeconds,
  isTimerExpired,
} from '../TimerManager';
import { DisplayMode } from '../../models/DisplayMode';

describe('TimerManager', () => {
  describe('getDisplayTimeForRound', () => {
    it('returns fixed display time in FIXED mode', () => {
      expect(getDisplayTimeForRound(DisplayMode.FIXED, 10, 1)).toBe(10);
      expect(getDisplayTimeForRound(DisplayMode.FIXED, 10, 15)).toBe(10);
    });

    it('returns progressive display time for early rounds', () => {
      expect(getDisplayTimeForRound(DisplayMode.PROGRESSIVE, 10, 1)).toBe(10);
      expect(getDisplayTimeForRound(DisplayMode.PROGRESSIVE, 10, 5)).toBe(10);
    });

    it('returns shorter display time for later rounds', () => {
      const round6 = getDisplayTimeForRound(DisplayMode.PROGRESSIVE, 10, 6);
      const round1 = getDisplayTimeForRound(DisplayMode.PROGRESSIVE, 10, 1);
      expect(round6).toBeLessThanOrEqual(round1);
    });

    it('returns a valid time for very late rounds', () => {
      const time = getDisplayTimeForRound(DisplayMode.PROGRESSIVE, 10, 100);
      expect(time).toBeGreaterThan(0);
    });
  });

  describe('getElapsedSeconds', () => {
    it('returns 0 when start time is null', () => {
      expect(getElapsedSeconds(null, 1000)).toBe(0);
    });

    it('calculates elapsed time correctly', () => {
      const start = 10000;
      const now = 15000;
      expect(getElapsedSeconds(start, now)).toBe(5);
    });

    it('never returns negative values', () => {
      expect(getElapsedSeconds(5000, 3000)).toBe(0);
    });
  });

  describe('getRemainingSeconds', () => {
    it('returns full duration when start time is null', () => {
      expect(getRemainingSeconds(null, 10, 0)).toBe(10);
    });

    it('returns remaining time correctly', () => {
      const start = 10000;
      const now = 13000;
      expect(getRemainingSeconds(start, 10, now)).toBe(7);
    });

    it('returns 0 when time has expired', () => {
      const start = 10000;
      const now = 25000;
      expect(getRemainingSeconds(start, 10, now)).toBe(0);
    });

    it('never returns negative values', () => {
      expect(getRemainingSeconds(0, 5, 100000)).toBe(0);
    });
  });

  describe('isTimerExpired', () => {
    it('returns false when start time is null', () => {
      expect(isTimerExpired(null, 10, 1000)).toBe(false);
    });

    it('returns false before expiry', () => {
      expect(isTimerExpired(10000, 10, 15000)).toBe(false);
    });

    it('returns true at exactly the expiry moment', () => {
      expect(isTimerExpired(10000, 10, 20000)).toBe(true);
    });

    it('returns true after expiry', () => {
      expect(isTimerExpired(10000, 10, 25000)).toBe(true);
    });
  });
});
