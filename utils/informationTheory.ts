// Helper to handle log(0) scenarios for entropy calculation
export const pLogP = (p: number): number => {
  if (p <= 0 || p >= 1) return 0;
  return p * Math.log2(p);
};

export const calculateInformationContent = (probability: number): number => {
  if (probability <= 0) return Infinity;
  if (probability >= 1) return 0;
  return -Math.log2(probability);
};

export const calculateEntropy = (pHeads: number): number => {
  const entropy = -(pLogP(pHeads) + pLogP(1 - pHeads));
  // Due to potential floating point inaccuracies, clamp to 0 if very close
  return entropy < 1e-9 ? 0 : entropy;
};

/**
 * Calculates a single term of the KL Divergence: p * log2(p/q).
 * Handles edge cases for p=0 or q=0.
 */
export const calculateKLDivergenceTerm = (p: number, q: number): number => {
  if (p <= 0) return 0; // 0 * log(0/q) is 0
  if (q <= 0) return Infinity;
  return p * Math.log2(p / q);
};

/**
 * Calculates the Kullback-Leibler (KL) divergence between two discrete probability distributions P and Q.
 * D_KL(P || Q) = Σ P(x) * log2(P(x) / Q(x))
 */
export const calculateKLDivergence = (P: number[], Q: number[]): number => {
  let divergence = 0;
  for (let i = 0; i < P.length; i++) {
    const term = calculateKLDivergenceTerm(P[i], Q[i]);
    if (term === Infinity) return Infinity;
    divergence += term;
  }
  // Handle potential -0 result from floating point arithmetic
  return Object.is(divergence, -0) ? 0 : divergence;
};

/**
 * Calculates the KL divergence between two univariate normal distributions P ~ N(muP, varP) and Q ~ N(muQ, varQ).
 * D_KL(P || Q) = [ 0.5 * ln(varQ / varP) + (varP + (muP - muQ)^2) / (2 * varQ) - 0.5 ] / ln(2)
 * Returns NaN if either variance is not positive.
 */
export const calculateKLDivergenceNormal = (muP: number, varP: number, muQ: number, varQ: number): number => {
  if (varP <= 0 || varQ <= 0) return NaN;
  const nats = 0.5 * Math.log(varQ / varP) + (varP + (muP - muQ) ** 2) / (2 * varQ) - 0.5;
  return nats / Math.LN2; // nats -> bits
};

/**
 * Probability Density Function for a normal distribution.
 */
export const normalPDF = (x: number, mean: number, variance: number): number => {
  if (variance <= 0) return 0;
  const stdDev = Math.sqrt(variance);
  const coefficient = 1 / (stdDev * Math.sqrt(2 * Math.PI));
  const exponent = -((x - mean) ** 2) / (2 * variance);
  return coefficient * Math.exp(exponent);
};

/**
 * Formats a numeric value for display: infinities as "∞", NaN as "—",
 * otherwise fixed to `digits` decimal places (default 3).
 */
export const formatValue = (value: number, digits = 3): string => {
  if (value === Infinity || value === -Infinity) return '∞';
  if (typeof value !== 'number' || isNaN(value)) return '—';
  return value.toFixed(digits);
};
