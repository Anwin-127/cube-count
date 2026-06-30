import { describe, it, expect } from 'vitest';
import { computeStructureSignature } from '../structureSignature';
import type { HeightMap } from '../../models/Puzzle';

describe('computeStructureSignature', () => {
  it('returns the same signature for identical height maps', () => {
    const map: HeightMap = [
      [1, 2, 0],
      [0, 3, 1],
      [2, 0, 2],
    ];
    const sig1 = computeStructureSignature(map, 3);
    const sig2 = computeStructureSignature(map, 3);
    expect(sig1).toBe(sig2);
  });

  it('maps empty cells to "0"', () => {
    const map: HeightMap = [
      [0, 0],
      [0, 0],
    ];
    const sig = computeStructureSignature(map, 4);
    expect(sig).toBe('00|00');
  });

  it('maps heights above the low boundary to "H"', () => {
    // maxHeight=4, boundary=floor(4/2)=2 → heights 1-2 are L, 3-4 are H
    const map: HeightMap = [
      [4, 0],
      [0, 4],
    ];
    const sig = computeStructureSignature(map, 4);
    expect(sig).toBe('H0|0H');
  });

  it('maps low heights to "L"', () => {
    // maxHeight=4, boundary=2 → 1-2 are L
    const map: HeightMap = [
      [1, 2],
      [2, 1],
    ];
    const sig = computeStructureSignature(map, 4);
    expect(sig).toBe('LL|LL');
  });

  it('treats maps with ±1 height differences as the same signature', () => {
    const map1: HeightMap = [
      [2, 1, 0],
      [0, 2, 1],
    ];
    const map2: HeightMap = [
      [2, 2, 0],  // 1→2 difference: both map to 'L' for maxHeight=4
      [0, 2, 2],
    ];
    const sig1 = computeStructureSignature(map1, 4);
    const sig2 = computeStructureSignature(map2, 4);
    // Both have the same qualitative L/H pattern
    expect(sig1).toBe(sig2);
  });

  it('produces different signatures for visually different maps', () => {
    const map1: HeightMap = [
      [3, 3, 3],
      [3, 3, 3],
      [3, 3, 3],
    ];
    const map2: HeightMap = [
      [0, 0, 1],
      [0, 1, 0],
      [1, 0, 0],
    ];
    const sig1 = computeStructureSignature(map1, 3);
    const sig2 = computeStructureSignature(map2, 3);
    expect(sig1).not.toBe(sig2);
  });

  it('separates rows with "|"', () => {
    const map: HeightMap = [[1], [2]];
    const sig = computeStructureSignature(map, 4);
    expect(sig).toContain('|');
    const rows = sig.split('|');
    expect(rows.length).toBe(2);
  });
});
