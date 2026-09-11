import { describe, it, expect } from 'vitest';
import {
  pLogP,
  calculateEntropy,
  calculateInformationContent,
  calculateKLDivergence,
  calculateKLDivergenceNormal,
  normalPDF,
  formatValue,
} from './informationTheory';

describe('pLogP', () => {
  it('treats 0 log 0 as 0', () => {
    expect(pLogP(0)).toBe(0);
  });

  it('treats 1 log 1 as 0', () => {
    expect(pLogP(1)).toBe(0);
  });

  it('is negative in the interior', () => {
    expect(pLogP(0.5)).toBeCloseTo(-0.5, 12);
  });
});

describe('calculateEntropy (bent coin)', () => {
  it('is zero for a deterministic coin', () => {
    expect(calculateEntropy(0)).toBe(0);
    expect(calculateEntropy(1)).toBe(0);
  });

  it('is one bit for a fair coin', () => {
    expect(calculateEntropy(0.5)).toBeCloseTo(1, 12);
  });

  it('is symmetric about 0.5', () => {
    for (const p of [0.1, 0.25, 0.37, 0.5, 0.63, 0.9]) {
      expect(calculateEntropy(p)).toBeCloseTo(calculateEntropy(1 - p), 12);
    }
  });

  it('is bounded by 1 bit', () => {
    for (let i = 0; i <= 100; i++) {
      const h = calculateEntropy(i / 100);
      expect(h).toBeGreaterThanOrEqual(0);
      expect(h).toBeLessThanOrEqual(1 + 1e-12);
    }
  });
});

describe('calculateInformationContent', () => {
  it('is zero for a certain event', () => {
    expect(calculateInformationContent(1)).toBe(0);
  });

  it('is one bit for probability one half', () => {
    expect(calculateInformationContent(0.5)).toBeCloseTo(1, 12);
  });

  it('is infinite for an impossible event', () => {
    expect(calculateInformationContent(0)).toBe(Infinity);
  });
});

describe('calculateKLDivergence', () => {
  it('is zero when the distributions match', () => {
    expect(calculateKLDivergence([0.5, 0.5], [0.5, 0.5])).toBeCloseTo(0, 12);
    expect(calculateKLDivergence([0.25, 0.75], [0.25, 0.75])).toBeCloseTo(0, 12);
  });

  it('is non-negative', () => {
    const P = [0.1, 0.2, 0.7];
    const Q = [0.3, 0.3, 0.4];
    expect(calculateKLDivergence(P, Q)).toBeGreaterThanOrEqual(0);
    expect(calculateKLDivergence(Q, P)).toBeGreaterThanOrEqual(0);
  });

  it('is infinite when Q has a zero where P is positive', () => {
    expect(calculateKLDivergence([0.5, 0.5], [1, 0])).toBe(Infinity);
  });

  it('ignores zero-probability P terms', () => {
    expect(calculateKLDivergence([1, 0], [0.5, 0.5])).toBeCloseTo(1, 12);
  });
});

describe('calculateKLDivergenceNormal', () => {
  it('is zero for identical normals', () => {
    expect(calculateKLDivergenceNormal(0, 1, 0, 1)).toBeCloseTo(0, 12);
  });

  it('is positive for different normals', () => {
    expect(calculateKLDivergenceNormal(0, 1, 1, 1)).toBeGreaterThan(0);
  });

  it('returns NaN for non-positive variance', () => {
    expect(calculateKLDivergenceNormal(0, 0, 0, 1)).toBeNaN();
  });
});

describe('normalPDF', () => {
  it('integrates to roughly one', () => {
    let area = 0;
    const dx = 1e-4;
    for (let x = -8; x <= 8; x += dx) area += normalPDF(x, 0, 1) * dx;
    expect(area).toBeCloseTo(1, 4);
  });
});

describe('formatValue', () => {
  it('formats finite values', () => {
    expect(formatValue(Math.PI)).toBe('3.142');
    expect(formatValue(Math.PI, 2)).toBe('3.14');
  });

  it('formats infinities and NaN', () => {
    expect(formatValue(Infinity)).toBe('∞');
    expect(formatValue(-Infinity)).toBe('∞');
    expect(formatValue(NaN)).toBe('—');
  });
});
