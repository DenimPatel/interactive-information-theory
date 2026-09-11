import { describe, it, expect } from 'vitest';
import { linearScale, niceTicks } from './scales';

describe('linearScale', () => {
  it('maps the domain endpoints onto the range endpoints', () => {
    const s = linearScale([0, 1], [40, 480]);
    expect(s(0)).toBe(40);
    expect(s(1)).toBe(480);
    expect(s(0.5)).toBe(260);
  });

  it('inverts exactly', () => {
    const s = linearScale([0, 1], [40, 480]);
    for (const v of [0, 0.1, 0.5, 0.9, 1]) {
      expect(s.invert(s(v))).toBeCloseTo(v, 12);
    }
  });

  it('handles a descending range (y axis)', () => {
    const s = linearScale([0, 1], [200, 20]);
    expect(s(0)).toBe(200);
    expect(s(1)).toBe(20);
  });

  it('does not produce NaN for a degenerate domain', () => {
    const s = linearScale([2, 2], [0, 100]);
    expect(s(2)).toBe(0);
  });
});

describe('niceTicks', () => {
  it('produces ascending ticks within the range', () => {
    for (const [min, max, count] of [
      [0, 1, 5],
      [0, 7, 5],
      [-3, 3, 4],
      [0, 0.04, 5],
      [12, 97, 6],
    ]) {
      const ticks = niceTicks(min, max, count);
      expect(ticks.length).toBeGreaterThan(0);
      for (const t of ticks) {
        expect(t).toBeGreaterThanOrEqual(min - 1e-9);
        expect(t).toBeLessThanOrEqual(max + 1e-9);
      }
      for (let i = 1; i < ticks.length; i++) {
        expect(ticks[i]).toBeGreaterThan(ticks[i - 1]);
      }
      expect(ticks.length).toBeLessThanOrEqual(count + 3);
    }
  });

  it('uses a 1/2/5 step grid', () => {
    const ticks = niceTicks(0, 1, 5);
    const step = ticks[1] - ticks[0];
    const mantissa = step / 10 ** Math.floor(Math.log10(step));
    expect([1, 2, 5]).toContain(Math.round(mantissa));
  });

  it('includes zero when the range spans it', () => {
    expect(niceTicks(-2, 2, 4)).toContain(0);
  });

  it('handles degenerate and invalid ranges', () => {
    expect(niceTicks(3, 3)).toEqual([3]);
    expect(niceTicks(1, NaN)).toEqual([]);
    expect(niceTicks(5, 1)).toEqual([]);
  });
});
