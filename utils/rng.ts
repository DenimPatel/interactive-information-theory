export type Rng = () => number;

/**
 * mulberry32 — a fast, seedable 32-bit PRNG. Returns a function producing
 * uniform floats in [0, 1). Every stochastic page carries a seed so demos,
 * screenshots and quiz answers are reproducible.
 */
export const mulberry32 = (seed: number): Rng => {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

/** Box–Muller transform: standard normal samples from two uniforms. */
export const gaussian = (rng: Rng): number => {
  let u = 0;
  let v = 0;
  while (u === 0) u = rng();
  while (v === 0) v = rng();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
};

/** Draws a category index from an unnormalised weight vector. */
export const sampleCategorical = (rng: Rng, weights: number[]): number => {
  const total = weights.reduce((sum, w) => sum + Math.max(0, w), 0);
  if (total <= 0) return 0;
  let threshold = rng() * total;
  for (let i = 0; i < weights.length; i++) {
    threshold -= Math.max(0, weights[i]);
    if (threshold <= 0) return i;
  }
  return weights.length - 1;
};

/** Fisher–Yates shuffle; returns a new array. */
export const shuffle = <T>(rng: Rng, items: readonly T[]): T[] => {
  const copy = items.slice();
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};
