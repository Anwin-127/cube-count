import { describe, it, expect } from 'vitest';
import { isConnected } from '../connectivityChecker';

describe('isConnected', () => {
  it('returns true for a single active cell', () => {
    const mask = [
      [false, false, false],
      [false, true, false],
      [false, false, false],
    ];
    expect(isConnected(mask)).toBe(true);
  });

  it('returns true for a fully connected rectangle', () => {
    const mask = [
      [true, true, true],
      [true, true, true],
      [true, true, true],
    ];
    expect(isConnected(mask)).toBe(true);
  });

  it('returns true for an L-shaped connected region', () => {
    const mask = [
      [true, false, false],
      [true, false, false],
      [true, true, true],
    ];
    expect(isConnected(mask)).toBe(true);
  });

  it('returns false for two disconnected regions', () => {
    const mask = [
      [true, false, false],
      [false, false, false],
      [false, false, true],
    ];
    expect(isConnected(mask)).toBe(false);
  });

  it('returns false for diagonally adjacent cells (not connected)', () => {
    const mask = [
      [true, false, false],
      [false, true, false],
      [false, false, true],
    ];
    expect(isConnected(mask)).toBe(false);
  });

  it('returns false for no active cells', () => {
    const mask = [
      [false, false],
      [false, false],
    ];
    expect(isConnected(mask)).toBe(false);
  });

  it('returns true for a complex connected path', () => {
    const mask = [
      [true, true, false, false, false],
      [false, true, false, false, false],
      [false, true, true, true, false],
      [false, false, false, true, false],
      [false, false, false, true, true],
    ];
    expect(isConnected(mask)).toBe(true);
  });

  it('returns false for a nearly-connected path with a gap', () => {
    const mask = [
      [true, true, false, false, false],
      [false, false, false, false, false],
      [false, false, true, true, false],
      [false, false, false, true, false],
      [false, false, false, true, true],
    ];
    expect(isConnected(mask)).toBe(false);
  });
});
