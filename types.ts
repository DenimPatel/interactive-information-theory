

export interface InfoMetrics {
  pHeads: number;
  pTails: number;
  iHeads: number | string; // Can be "Infinity"
  iTails: number | string; // Can be "Infinity"
  entropy: number;
}

export interface ChartDataPoint {
  pHeads: number;
  entropy: number;
}

export interface KLTerm {
  outcome: string;
  p_val: number;
  q_val: number;
  term_P_double_bar_Q: number | string;
  term_Q_double_bar_P: number | string;
}

export interface KLMetrics {
  d_kl_P_Q: number | string;
  d_kl_Q_P: number | string;
  terms: KLTerm[];
}

// --- Huffman Encoding Types ---

// Represents a node in the Huffman tree
export interface HuffmanNode {
  char: string | null; // Character (for leaf nodes)
  freq: number; // Frequency
  id: string; // Unique ID for React keys if rendering tree
  left: HuffmanNode | null;
  right: HuffmanNode | null;
}

// Represents a character and its frequency
export interface HuffmanFrequency {
  char: string;
  freq: number;
}

// Represents a character and its Huffman code
export interface HuffmanCode {
  char: string;
  code: string;
}

// Statistics about the compression
export interface HuffmanStats {
  originalSizeBits: number;
  compressedSizeBits: number;
  compressionRatio: number; // e.g., 0.6 for 60%
  averageCodeLength: number;
  uniqueChars: number;
}

// Bundles all results from the Huffman encoding process
export interface HuffmanResult {
  frequencies: HuffmanFrequency[];
  codes: HuffmanCode[];
  encodedString: string;
  stats: HuffmanStats | null;
  treeRoot: HuffmanNode | null; // Optional: for potential future visualization
}

// --- Binary Symmetric Channel Metrics ---
export interface BSCMetrics {
  p_crossover: number; // Crossover probability p
  q_probX0: number;    // Input probability P(X=0)

  probX0: number;      // P(X=0)
  probX1: number;      // P(X=1)
  H_X: number;         // Entropy of input X H(X)

  probY0: number;      // Output probability P(Y=0)
  probY1: number;      // Output probability P(Y=1)
  H_Y: number;         // Entropy of output Y H(Y)

  H_Y_given_X: number; // Conditional entropy H(Y|X), which is H(p_crossover) for BSC
  I_X_Y: number;       // Mutual Information I(X;Y)
  
  capacity: number;    // Channel Capacity C = 1 - H(p_crossover)
}

// --- Mutual Information vs P(X=0) Chart ---
export interface MutualInfoChartDataPoint {
  qProbX0: number; // P(X=0)
  mutualInformation: number; // I(X;Y)
}

// --- Conditional Entropy Page Metrics ---
export interface ConditionalEntropyMetrics {
  pSunny: number; pRainy: number;
  pSunglassesGivenSunny: number; pNoSunglassesGivenSunny: number;
  pSunglassesGivenRainy: number; pNoSunglassesGivenRainy: number;
  pSunny_Yes: number; pSunny_No: number; pRainy_Yes: number; pRainy_No: number;
  pSunglassesYes: number; pSunglassesNo: number;
  H_X: number; H_Y: number;
  H_Y_given_Sunny: number; H_Y_given_Rainy: number; H_Y_given_X: number;
  H_X_Y: number; I_X_Y: number;
}

// --- Bayesian Inference Page Metrics ---
export interface BayesianInferenceMetrics {
  priorDisease: number;       // P(Disease)
  sensitivity: number;      // P(Positive Test | Disease)
  specificity: number;      // P(Negative Test | No Disease)

  probNoDisease: number;    // P(No Disease) = 1 - P(Disease)
  falsePositiveRate: number;// P(Positive Test | No Disease) = 1 - specificity
  
  // Numerator term for P(Disease | Positive Test)
  p_Pos_given_Disease_times_p_Disease: number; // P(Positive Test | Disease) * P(Disease)
  
  // Terms for P(Positive Test) - the evidence/marginal likelihood
  p_Pos_given_NoDisease_times_p_NoDisease: number; // P(Positive Test | No Disease) * P(No Disease)
  
  probPositiveTest: number; // P(Positive Test)
  
  posteriorDiseaseGivenPositive: number; // P(Disease | Positive Test)
}

// --- Bayesian Probability Plot Data Point ---
export interface BayesianPlotDataPoint {
  variableValue: number; // Value of the x-axis variable (prior, sensitivity, or specificity)
  posterior: number;   // Calculated P(Disease | Positive Test)
}

// --- Bayesian Curve Fitting Demo Types ---
export interface CurveDataPoint {
  x: number;
  y_noisy: number;
  y_true?: number;
  y_fitted?: number;
}
