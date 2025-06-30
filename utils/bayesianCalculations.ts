
/**
 * Calculates the posterior probability P(Hypothesis | Evidence), 
 * specifically P(Disease | Positive Test) for the medical diagnosis example.
 * 
 * @param priorDisease P(Disease) - The prior probability of having the disease.
 * @param sensitivity P(Positive Test | Disease) - The probability of a positive test if the person has the disease.
 * @param specificity P(Negative Test | No Disease) - The probability of a negative test if the person does NOT have the disease.
 * @returns The posterior probability P(Disease | Positive Test).
 */
export const calculatePosteriorForPlot = (
  priorDisease: number,
  sensitivity: number,
  specificity: number
): number => {
  // Validate inputs to prevent NaN or Infinity propagation, though UI should also constrain.
  // Basic check: probabilities should be in [0, 1].
  // More specific ranges (e.g., prior 0.001-0.5) are handled by UI.
  if (priorDisease < 0 || priorDisease > 1 ||
      sensitivity < 0 || sensitivity > 1 ||
      specificity < 0 || specificity > 1) {
    // This case should ideally not be reached if UI constraints are effective.
    // Return a value that indicates error or an impossible scenario if needed,
    // or rely on downstream clamping. For now, proceed and let clamping handle it.
  }

  const probNoDisease = 1 - priorDisease;
  const falsePositiveRate = 1 - specificity; // P(Positive Test | No Disease)

  // P(Positive Test | Disease) * P(Disease)
  const p_Pos_given_Disease_times_p_Disease = sensitivity * priorDisease;
  
  // P(Positive Test | No Disease) * P(No Disease)
  const p_Pos_given_NoDisease_times_p_NoDisease = falsePositiveRate * probNoDisease;

  // P(Positive Test) = P(Positive Test | Disease)P(Disease) + P(Positive Test | No Disease)P(No Disease)
  const probPositiveTest = p_Pos_given_Disease_times_p_Disease + p_Pos_given_NoDisease_times_p_NoDisease;
  
  let posterior = 0;
  if (probPositiveTest > 0) { // Avoid division by zero
    posterior = p_Pos_given_Disease_times_p_Disease / probPositiveTest;
  } else if (p_Pos_given_Disease_times_p_Disease === 0 && probPositiveTest === 0) {
    // If both numerator and denominator are zero, it's ambiguous.
    // This could happen if P(Disease)=0, or Sensitivity=0.
    // If P(Disease)=0, then P(Disease | Positive Test) should be 0.
    // If Sensitivity=0 but P(Disease)>0, then P(Positive Test | Disease)P(Disease) = 0.
    // If P(Positive Test | No Disease)P(No Disease) is also 0 (e.g. Specificity=1 and P(No Disease)=0),
    // this edge case can be tricky. Often, P(H|E) is considered 0 if P(H)=0.
    posterior = 0;
  }
  
  // Clamp posterior to be within [0,1] due to potential floating point inaccuracies.
  return Math.max(0, Math.min(1, posterior));
};
