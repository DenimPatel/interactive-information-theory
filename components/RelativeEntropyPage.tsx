import React, { useState, useMemo } from 'react';
import Card from './Card';
import ConceptExplainer from './ConceptExplainer';
import DistributionInput from './DistributionInput'; // For discrete distributions
import NormalDistributionInput from './NormalDistributionInput'; // For normal distributions
import NormalDistributionsChart from './NormalDistributionsChart'; // For visualizing normal distributions
import { calculateKLDivergence, calculateKLDivergenceTerm, calculateKLDivergenceNormal } from '../utils/informationTheory';
import type { KLMetrics, KLTerm } from '../types';

interface RelativeEntropyPageProps {
  onNavigateBack: () => void;
}

const RelativeEntropyPage: React.FC<RelativeEntropyPageProps> = ({ onNavigateBack }) => {
  // State for Discrete KL Divergence
  const [probP1, setProbP1] = useState<number>(0.5); // P(Outcome 1) for distribution P
  const [probQ1, setProbQ1] = useState<number>(0.5); // P(Outcome 1) for distribution Q

  // State for Normal KL Divergence
  const [meanP_norm, setMeanP_norm] = useState<number>(0);
  const [varianceP_norm, setVarianceP_norm] = useState<number>(1);
  const [meanQ_norm, setMeanQ_norm] = useState<number>(0);
  const [varianceQ_norm, setVarianceQ_norm] = useState<number>(1);


  const klMetricsDiscrete: KLMetrics = useMemo(() => {
    const P_probs = [probP1, 1 - probP1]; // P(Outcome 1), P(Outcome 0)
    const Q_probs = [probQ1, 1 - probQ1]; // Q(Outcome 1), Q(Outcome 0)

    const d_kl_P_Q = calculateKLDivergence(P_probs, Q_probs);
    const d_kl_Q_P = calculateKLDivergence(Q_probs, P_probs);

    const terms: KLTerm[] = [
      {
        outcome: "Outcome 1",
        p_val: P_probs[0],
        q_val: Q_probs[0],
        term_P_double_bar_Q: calculateKLDivergenceTerm(P_probs[0], Q_probs[0]),
        term_Q_double_bar_P: calculateKLDivergenceTerm(Q_probs[0], P_probs[0]),
      },
      {
        outcome: "Outcome 0",
        p_val: P_probs[1],
        q_val: Q_probs[1],
        term_P_double_bar_Q: calculateKLDivergenceTerm(P_probs[1], Q_probs[1]),
        term_Q_double_bar_P: calculateKLDivergenceTerm(Q_probs[1], P_probs[1]),
      }
    ];

    return { d_kl_P_Q, d_kl_Q_P, terms };
  }, [probP1, probQ1]);

  const klMetricsNormal = useMemo(() => {
    const d_kl_P_Q_normal = calculateKLDivergenceNormal(meanP_norm, varianceP_norm, meanQ_norm, varianceQ_norm);
    const d_kl_Q_P_normal = calculateKLDivergenceNormal(meanQ_norm, varianceQ_norm, meanP_norm, varianceP_norm);
    return { d_kl_P_Q_normal, d_kl_Q_P_normal };
  }, [meanP_norm, varianceP_norm, meanQ_norm, varianceQ_norm]);

  const formatKLValue = (value: number | string) => {
    if (typeof value === 'number') return value.toFixed(4);
    return value; // "Infinity", "Error", "Invalid variance" etc.
  };

  const formatTermValue = (value: number | string) => {
    if (typeof value === 'number') return value.toFixed(3);
    if (value === "Infinity") return <span className="text-red-500 font-semibold">Infinity</span>;
    return value;
  }


  const relativeEntropyExplanation = [
    "Relative entropy, also known as Kullback-Leibler (KL) divergence, measures the 'distance' or difference between two probability distributions. It quantifies how much one probability distribution P diverges from a second, reference probability distribution Q.",
    "Specifically, it's the measure of information lost when Q is used to approximate P. It is not a true metric (e.g., it's not symmetric: DKL(P||Q) ≠ DKL(Q||P)) but is fundamental in fields like statistics, machine learning, and information theory.",
  ];

  const discreteKLExplanation = [
    "For discrete probability distributions P and Q defined on the same probability space, Ξ, the KL divergence from Q to P is defined as:",
  ];

  const practicalExample = [
    <strong>Practical Example:</strong>,
    "Imagine you have a true (but unknown) distribution P for coin flips (e.g., a slightly bent coin). You create a model Q (e.g., assuming it's a fair coin). KL divergence DKL(P||Q) would tell you how 'bad' your fair coin model is at representing the true bent coin. A lower KL divergence means your model is a better approximation.",
    "It's often used in machine learning to measure the difference between the predicted probability distribution of a model and the true distribution of the data."
  ];

  const normalKLExplanation = [
    "For two univariate normal (Gaussian) distributions P ~ N(μP, σ²P) and Q ~ N(μQ, σ²Q), the KL divergence DKL(P || Q) has a closed-form solution. It measures how different distribution P is from Q, considering their means and variances.",
    "A larger difference in means or a mismatch in variances (especially if Q has smaller variance than P where P has density) will lead to a higher KL divergence.",
    "The formula to calculate this divergence in bits is:"
  ];
  const normalKLFormula = "[ ln(σQ/σP) + (σ²P + (μP - μQ)²) / (2σ²Q) - 1/2 ] / ln(2)";
  // Alternative presentation using variances directly for the log term:
  // const normalKLFormula = "[ 0.5 * ln(σ²Q/σ²P) + (σ²P + (μP - μQ)²) / (2σ²Q) - 0.5 ] / ln(2)";


  return (
    <main className="max-w-4xl mx-auto space-y-6 lg:space-y-8">
      <Card>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-sky-700">Relative Entropy (Kullback-Leibler Divergence)</h2>
          <button
            onClick={onNavigateBack}
            className="px-4 py-2 bg-sky-600 text-white text-sm font-medium rounded-md hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 transition-colors duration-150"
          >
            &larr; Back to Main Concepts
          </button>
        </div>

        <ConceptExplainer
          title="Understanding Relative Entropy"
          explanation={relativeEntropyExplanation}
        />

        <Card title="Interactive KL Divergence for Discrete Distributions" className="mt-6 bg-slate-50">
          <ConceptExplainer
            title="" // No title, just the formula and text
            explanation={discreteKLExplanation}
            formula="DKL(P || Q) = Σ P(x) log₂(P(x) / Q(x))"
          />
          <p className="text-sm text-slate-600 mb-4 mt-2">
            Adjust the probabilities for two distributions, P and Q, for a simple two-outcome scenario (e.g., Outcome 1 vs Outcome 0). Observe how the KL Divergence changes.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <DistributionInput
              label="Distribution P"
              prob={probP1}
              onProbChange={setProbP1}
              color="sky"
              outcome1Label="P(Outcome 1)"
              outcome0Label="P(Outcome 0)"
            />
            <DistributionInput
              label="Distribution Q"
              prob={probQ1}
              onProbChange={setProbQ1}
              color="emerald"
              outcome1Label="Q(Outcome 1)"
              outcome0Label="Q(Outcome 0)"
            />
          </div>

          <div className="space-y-4">
            <div>
              <h4 className="text-lg font-semibold text-slate-700">Calculated KL Divergences (Discrete):</h4>
              <p className="text-md text-slate-600">
                D<sub>KL</sub>(P || Q): <span className={`font-bold text-sky-600`}>{formatKLValue(klMetricsDiscrete.d_kl_P_Q)}</span> bits
              </p>
              <p className="text-md text-slate-600">
                D<sub>KL</sub>(Q || P): <span className={`font-bold text-emerald-600`}>{formatKLValue(klMetricsDiscrete.d_kl_Q_P)}</span> bits
              </p>
            </div>

            <div>
              <h4 className="text-lg font-semibold text-slate-700 mt-4 mb-2">Calculation Breakdown (Discrete):</h4>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 border border-slate-300">
                  <thead className="bg-slate-100">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Outcome</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">P(x)</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Q(x)</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">P(x) log₂(P(x)/Q(x))</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Q(x) log₂(Q(x)/P(x))</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-200">
                    {klMetricsDiscrete.terms.map(term => (
                      <tr key={term.outcome}>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-slate-700">{term.outcome}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-sky-700">{term.p_val.toFixed(2)}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-emerald-700">{term.q_val.toFixed(2)}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-slate-700">{formatTermValue(term.term_P_double_bar_Q)}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-slate-700">{formatTermValue(term.term_Q_double_bar_P)}</td>
                      </tr>
                    ))}
                    <tr className="bg-slate-50 font-semibold">
                      <td className="px-3 py-2 text-sm text-slate-800" colSpan={3}>Total (D<sub>KL</sub>):</td>
                      <td className="px-3 py-2 text-sm text-sky-700">{formatKLValue(klMetricsDiscrete.d_kl_P_Q)}</td>
                      <td className="px-3 py-2 text-sm text-emerald-700">{formatKLValue(klMetricsDiscrete.d_kl_Q_P)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            {(klMetricsDiscrete.d_kl_P_Q === "Infinity" || klMetricsDiscrete.d_kl_Q_P === "Infinity") && (
              <p className="text-xs text-red-600 mt-2">
                Note: KL Divergence is infinite if Q(x) = 0 for any outcome x where P(x) &gt; 0 (for D<sub>KL</sub>(P || Q)), or vice-versa. This implies that the approximating distribution assigns zero probability to an event that can actually occur.
              </p>
            )}
          </div>
        </Card>

        <Card title="Interactive KL Divergence for Normal Distributions" className="mt-8 bg-slate-50">
          <ConceptExplainer
            title="" // No title, just explanation and formula
            explanation={normalKLExplanation}
            formula={normalKLFormula}
          />
          <p className="text-sm text-slate-600 mb-4 mt-2">
            Adjust the mean (μ) and variance (σ²) for two Normal (Gaussian) distributions P and Q. Observe how the KL Divergence changes. Variances must be positive.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <NormalDistributionInput
              label="Distribution P ~ N(μP, σ²P)"
              mean={meanP_norm}
              onMeanChange={setMeanP_norm}
              variance={varianceP_norm}
              onVarianceChange={setVarianceP_norm}
              color="sky"
            />
            <NormalDistributionInput
              label="Distribution Q ~ N(μQ, σ²Q)"
              mean={meanQ_norm}
              onMeanChange={setMeanQ_norm}
              variance={varianceQ_norm}
              onVarianceChange={setVarianceQ_norm}
              color="emerald"
            />
          </div>
          <div>
            <h4 className="text-lg font-semibold text-slate-700">Calculated KL Divergences (Normal):</h4>
            <p className="text-md text-slate-600">
              D<sub>KL</sub>(P || Q): <span className={`font-bold ${klMetricsNormal.d_kl_P_Q_normal === "Invalid variance" ? 'text-red-600' : 'text-sky-600'}`}>{formatKLValue(klMetricsNormal.d_kl_P_Q_normal)}</span> bits
            </p>
            <p className="text-md text-slate-600">
              D<sub>KL</sub>(Q || P): <span className={`font-bold ${klMetricsNormal.d_kl_Q_P_normal === "Invalid variance" ? 'text-red-600' : 'text-emerald-600'}`}>{formatKLValue(klMetricsNormal.d_kl_Q_P_normal)}</span> bits
            </p>
            {(klMetricsNormal.d_kl_P_Q_normal === "Invalid variance" || klMetricsNormal.d_kl_Q_P_normal === "Invalid variance") && (
              <p className="text-xs text-red-600 mt-1">
                Note: Variance (σ²) must be greater than 0 for KL Divergence calculation between normal distributions.
              </p>
            )}
          </div>
          <NormalDistributionsChart
            meanP={meanP_norm}
            varianceP={varianceP_norm}
            meanQ={meanQ_norm}
            varianceQ={varianceQ_norm}
            colorP="#0ea5e9"      // sky-500 for P
            colorQ="#10b981"      // emerald-500 for Q
          />
        </Card>


        <ConceptExplainer
          title="Key Characteristics of KL Divergence"
          explanation={[
            <ul key="kl-char-list" className="list-disc list-inside space-y-1 text-sm sm:text-base">
              <li><strong>Non-negativity:</strong> D<sub>KL</sub>(P || Q) ≥ 0. It is zero if and only if P = Q almost everywhere.</li>
              <li><strong>Asymmetry:</strong> D<sub>KL</sub>(P || Q) ≠ D<sub>KL</sub>(Q || P) in general, as demonstrated above. This means it's not a true 'distance' metric like Euclidean distance.</li>
              <li><strong>Absolute Continuity:</strong> For discrete distributions, D<sub>KL</sub>(P || Q) is defined only if Q(x) = 0 implies P(x) = 0. For continuous distributions, P must be absolutely continuous with respect to Q. If Q assigns zero probability (or density) to a region where P assigns non-zero probability (or density), the KL divergence can be infinite.</li>
            </ul>
          ]}
        />

        <ConceptExplainer
          title="Why is KL Divergence useful?"
          explanation={practicalExample}
        />
      </Card>

    </main>
  );
};

export default RelativeEntropyPage;
