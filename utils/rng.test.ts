import { describe, it, expect } from 'vitest';
import { mulberry32, gaussian, sampleCategorical, shuffle } from './rng';

describe('mulberry32', () => {
  it('is deterministic for a given seed', () => {
    const a = mulberry32(42);
    const b = mulberry32(42);
    for (let i = 0; i < 50; i++) expect(a()).toBe(b());
  });

  it('differs across seeds', () => {
    const a = mulberry32(1);
    const b = mulberry32(2);
    const drawsA = Array.from({ length: 20 }, () => a());
    const drawsB = Array.from({ length: 20 }, () => b());
    expect(drawsA).not.toEqual(drawsB);
  });

  it('stays in [0, 1)', () => {
    const rng = mulberry32(7);
    for (let i = 0; i < 2000; i++) {
      const value = rng();
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });
});

describe('gaussian', () => {
  it('has roughly zero mean and unit variance', () => {
    const rng = mulberry32(123);
    const samples = Array.from({ length: 20000 }, () => gaussian(rng));
    const mean = samples.reduce((s, x) => s + x, 0) / samples.length;
    const variance = samples.reduce((s, x) => s + (x - mean) ** 2, 0) / samples.length;
    expect(Math.abs(mean)).toBeLessThan(0.05);
    expect(Math.abs(variance - 1)).toBeLessThan(0.05);
  });
});

describe('sampleCategorical', () => {
  it('respects zero-weight categories', () => {
    const rng = mulberry32(9);
    for (let i = 0; i < 500; i++) expect(sampleCategorical(rng, [0, 1, 0])).toBe(1);
  });

  it('returns a valid index for all-zero weights', () => {
    expect(sampleCategorical(mulberry32(1), [0, 0, 0])).toBe(0);
  });

  it('matches the expected frequency approximately', () => {
    const rng = mulberry32(5);
    const counts = [0, 0];
    for (let i = 0; i < 10000; i++) counts[sampleCategorical(rng, [0.25, 0.75])]++;
    expect(counts[1] / 10000).toBeGreaterThan(0.72);
    expect(counts[1] / 10000).toBeLessThan(0.78);
  });
});

describe('shuffle', () => {
  it('preserves the multiset and does not mutate the input', () => {
    const input = [1, 2, 3, 4, 5];
    const output = shuffle(mulberry32(3), input);
    expect(input).toEqual([1, 2, 3, 4, 5]);
    expect([...output].sort((a, b) => a - b)).toEqual([1, 2, 3, 4, 5]);
  });

  it('is deterministic for a given seed', () => {
    expect(shuffle(mulberry32(11), [1, 2, 3, 4, 5, 6])).toEqual(
      shuffle(mulberry32(11), [1, 2, 3, 4, 5, 6]),
    );
  });
});
