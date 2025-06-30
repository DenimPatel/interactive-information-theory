// Helper to handle log(0) scenarios for entropy calculation
export const pLogP = (p: number): number => {
  if (p === 0 || p === 1) {
    return 0;
  }
  return p * Math.log2(p);
};

export const calculateInformationContent = (probability: number): number | string => {
  if (probability === 0) {
    return "Infinity";
  }
  if (probability === 1) {
    return 0;
  }
  // Ensure probability is not negative or greater than 1, though UI should prevent this
  if (probability < 0 || probability > 1) return NaN; 
  return -Math.log2(probability);
};

export const calculateEntropy = (pHeads: number): number => {
  if (pHeads < 0 || pHeads > 1) return NaN; // Invalid probability

  const pTails = 1 - pHeads;
  
  const entropy = -(pLogP(pHeads) + pLogP(pTails));
  // Due to potential floating point inaccuracies, clamp to 0 if very close
  return entropy < 1e-9 ? 0 : entropy; 
};

/**
 * Calculates a single term of the KL Divergence: p * log2(p/q).
 * Handles edge cases for p=0 or q=0.
 * @param p_val Probability from distribution P for a specific outcome.
 * @param q_val Probability from distribution Q for the same outcome.
 * @returns The value of the term, or "Infinity" if p_val > 0 and q_val = 0.
 */
export const calculateKLDivergenceTerm = (p_val: number, q_val: number): number | string => {
  if (p_val < 0 || p_val > 1 || q_val < 0 || q_val > 1) {
    return "Invalid"; // Should not happen with UI controls
  }
  if (p_val === 0) {
    return 0; // 0 * log(0/q) is 0
  }
  if (q_val === 0) {
    // p_val > 0 and q_val = 0, results in infinity
    return "Infinity"; 
  }
  return p_val * Math.log2(p_val / q_val);
};

/**
 * Calculates the Kullback-Leibler (KL) divergence between two discrete probability distributions P and Q.
 * D_KL(P || Q) = Σ P(x) * log2(P(x) / Q(x))
 * @param P_probs Array of probabilities for distribution P.
 * @param Q_probs Array of probabilities for distribution Q.
 * @returns The KL divergence value, or "Infinity" if Q(x)=0 for some P(x)>0.
 */
export const calculateKLDivergence = (P_probs: number[], Q_probs: number[]): number | string => {
  if (P_probs.length !== Q_probs.length) {
    console.error("Distributions must have the same number of outcomes.");
    return "Error"; // Or throw new Error
  }

  let divergence = 0;
  for (let i = 0; i < P_probs.length; i++) {
    const p_i = P_probs[i];
    const q_i = Q_probs[i];

    const term = calculateKLDivergenceTerm(p_i, q_i);

    if (term === "Infinity") {
      return "Infinity";
    }
    if (typeof term === 'number') {
      divergence += term;
    } else {
      // Handle "Invalid" or other string cases if necessary, though unlikely with current term logic
      console.warn("Invalid term in KL divergence calculation:", term);
    }
  }
  // Handle potential -0 result from floating point arithmetic
  return divergence === -0 ? 0 : divergence;
};

/**
 * Calculates the KL divergence between two univariate normal distributions P ~ N(μP, varP) and Q ~ N(μQ, varQ).
 * D_KL(P || Q) = [ 0.5 * ln(varQ / varP) + (varP + (μP - μQ)^2) / (2 * varQ) - 0.5 ] / ln(2)
 * @param muP Mean of distribution P.
 * @param varP Variance of distribution P.
 * @param muQ Mean of distribution Q.
 * @param varQ Variance of distribution Q.
 * @returns The KL divergence in bits, or string "Invalid variance" if varP or varQ <= 0.
 */
export const calculateKLDivergenceNormal = (muP: number, varP: number, muQ: number, varQ: number): number | string => {
  if (varP <= 0 || varQ <= 0) {
    return "Invalid variance";
  }

  const term1 = 0.5 * Math.log(varQ / varP); // ln(sqrt(varQ)/sqrt(varP)) = 0.5 * ln(varQ/varP)
  const term2 = (varP + (muP - muQ)**2) / (2 * varQ);
  const term3 = -0.5;

  const klDivergenceNats = term1 + term2 + term3;
  
  // Convert nats to bits
  const klDivergenceBits = klDivergenceNats / Math.LN2; // Math.LN2 is ln(2)

  return klDivergenceBits;
};

/**
 * Calculates the Probability Density Function (PDF) for a normal distribution.
 * pdf(x, μ, σ²) = (1 / (σ * sqrt(2π))) * exp(-((x - μ)² / (2σ²)))
 * @param x The point at which to evaluate the PDF.
 * @param mean The mean (μ) of the normal distribution.
 * @param variance The variance (σ²) of the normal distribution.
 * @returns The PDF value at x, or 0 if variance is not positive.
 */
export const normalPDF = (x: number, mean: number, variance: number): number => {
  if (variance <= 0) {
    return 0; // PDF is undefined or 0 for non-positive variance
  }
  const stdDev = Math.sqrt(variance);
  const coefficient = 1 / (stdDev * Math.sqrt(2 * Math.PI));
  const exponent = -((x - mean) ** 2) / (2 * variance);
  return coefficient * Math.exp(exponent);
};
