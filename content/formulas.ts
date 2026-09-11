/**
 * Every LaTeX formula the site ships, keyed by page slug and then by a named
 * slot. Keeping them in one plain-TS module makes the whole set testable in
 * Node (see `formulas.test.ts`), so a typo surfaces as a failing test rather
 * than a red `.katex-error` on a slide. LaTeX source is pure ASCII, preserving
 * the "entities, not literal Unicode" convention.
 */
export const FORMULAS = {
  'bent-coin': {
    tails: 'P(\\text{Tails}) = 1 - P(\\text{Heads})',
    selfInfo: 'I(\\text{event}) = -\\log_2 P(\\text{event}) \\text{ bits}',
    entropy: 'H(X) = -\\sum_i p_i \\log_2 p_i',
    coinEntropy:
      'H(\\text{coin}) = -P(H)\\log_2 P(H) - P(T)\\log_2 P(T)',
  },
  'relative-entropy': {
    definition: 'D_{KL}(P \\| Q) = \\sum_x P(x) \\log_2 \\frac{P(x)}{Q(x)}',
    normal:
      'D_{KL}(P \\| Q) = \\frac{1}{\\ln 2}\\left[\\ln\\frac{\\sigma_Q}{\\sigma_P} + \\frac{\\sigma_P^2 + (\\mu_P-\\mu_Q)^2}{2\\sigma_Q^2} - \\frac{1}{2}\\right]',
    nonNegative: 'D_{KL}(P \\| Q) \\ge 0',
    zeroIffEqual: 'D_{KL}(P \\| Q) = 0 \\iff P = Q',
  },
  'conditional-entropy': {
    definition: 'H(X \\mid Y) = -\\sum_{x,y} P(x,y) \\log_2 P(x \\mid y)',
    chainRule: 'H(X \\mid Y) = H(X,Y) - H(Y)',
    mutualInfo:
      'I(X;Y) = H(X) - H(X \\mid Y) = H(Y) - H(Y \\mid X)',
  },
  bsc: {
    mutualInfo: 'I(X;Y) = H(Y) - H_2(p)',
    capacity: 'C = 1 - H_2(p)',
    binaryEntropy: 'H_2(p) = -p\\log_2 p - (1-p)\\log_2(1-p)',
  },
  'noisy-channel-theorem': {
    achievable: 'R < C \\implies P_e \\to 0 \\text{ as } n \\to \\infty',
    converse: 'R > C \\implies P_e \\to 1 \\text{ as } n \\to \\infty',
  },
  'bayesian-inference': {
    bayes: 'P(H \\mid D) = \\frac{P(D \\mid H)\\,P(H)}{P(D)}',
    evidence: 'P(D) = \\sum_i P(D \\mid H_i) P(H_i)',
  },
  'monty-hall': {
    switch: 'P(\\text{switch wins}) = \\frac{2}{3}',
    stay: 'P(\\text{stay wins}) = \\frac{1}{3}',
  },
  huffman: {
    expectedLength: 'L = \\sum_i p_i \\ell_i',
    bounds: 'H(X) \\le L < H(X) + 1',
    kraft: '\\sum_i 2^{-\\ell_i} \\le 1',
  },
  'sampling-methods': {
    inversion: 'x = F^{-1}(u), \\quad u \\sim \\mathrm{Uniform}(0,1)',
    estimator: '\\hat{\\mu} = \\frac{1}{N} \\sum_{i=1}^{N} f(x_i)',
  },
} as const;

export const ALL_FORMULAS: string[] = Object.values(FORMULAS).flatMap((page) =>
  Object.values(page),
);
