
import React, { useState, useMemo, useCallback } from 'react';
import Card from './Card';
import ConceptExplainer from './ConceptExplainer';
import type { BayesianInferenceMetrics, BayesianPlotDataPoint } from '../types';
import BayesianProbabilityPlot from './BayesianProbabilityPlot';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Scatter, ReferenceLine } from 'recharts';
import Plot from 'react-plotly.js'; // For 3D/Heatmap plots
import { generateExponentialData, findMAPExponential, LogPriorUniformType } from '../utils/bayesianCurveFitting'; // New utility functions

interface BayesianInferencePageProps {
  onNavigateBack: () => void;
}

// Data point type for the curve fitting plot
interface CurveDataPoint {
  x: number;
  y_noisy: number;
  y_true?: number; // Optional true value if known
  y_fitted?: number; // Optional fitted value
}


const ParameterInput: React.FC<{
  id: string;
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step: number;
  description?: string;
}> = ({ id, label, value, onChange, min, max, step, description }) => (
  <div className="mb-4 p-3 bg-white rounded-md shadow border border-slate-200">
    <label htmlFor={id} className="block text-sm font-medium text-slate-700">
      {label}: <span className="font-bold text-sky-600">{value.toFixed(3)}</span>
    </label>
    {description && <p className="text-xs text-slate-500 mt-0.5 mb-1">{description}</p>}
    <div className="flex items-center space-x-2 mt-1">
      <input
        type="range"
        id={`${id}-slider`}
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-2/3 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-sky-600 hover:accent-sky-700"
        aria-label={`Adjust ${label}`}
      />
      <input
        type="number"
        id={id}
        min={min}
        max={max}
        step={step}
        value={value.toFixed(3)} // Display with precision
        onChange={(e) => {
          const numVal = parseFloat(e.target.value);
          if (!isNaN(numVal)) onChange(numVal);
        }}
        className="w-1/3 p-1.5 border border-slate-300 rounded-md shadow-sm text-sm focus:ring-sky-500 focus:border-sky-500"
      />
    </div>
    <div className="flex justify-between text-xs text-slate-500 mt-0.5">
      <span>{min}</span>
      <span>{max}</span>
    </div>
  </div>
);

const ResultDisplay: React.FC<{ label: string; value: string | number; className?: string; isPrimary?: boolean; description?: string }> = ({ label, value, className, isPrimary, description }) => (
  <div className={`py-2 px-3 rounded-md ${isPrimary ? 'bg-sky-100 border border-sky-300' : 'bg-slate-100'} ${className || ''}`}>
    <div className="flex justify-between items-center">
      <span className={`text-sm font-medium ${isPrimary ? 'text-sky-700' : 'text-slate-600'}`}>{label}:</span>
      <span className={`text-lg font-semibold ${isPrimary ? 'text-sky-600' : 'text-slate-800'}`}>
        {typeof value === 'number' ? value.toFixed(4) : value}
      </span>
    </div>
    {description && <p className="text-xs text-slate-500 mt-0.5">{description}</p>}
  </div>
);


const BayesianInferencePage: React.FC<BayesianInferencePageProps> = ({ onNavigateBack }) => {
  const [priorDisease, setPriorDisease] = useState<number>(0.01); // P(Disease)
  const [sensitivity, setSensitivity] = useState<number>(0.99);   // P(Positive Test | Disease)
  const [specificity, setSpecificity] = useState<number>(0.95);   // P(Negative Test | No Disease)

  // State for Exponential Curve Fitting Demo
  const [trueA, setTrueA] = useState<number>(2.0);
  const [trueB, setTrueB] = useState<number>(-0.5);
  const [numDataPoints, setNumDataPoints] = useState<number>(20);
  const [noiseStd, setNoiseStd] = useState<number>(0.3);
  const [generatedData, setGeneratedData] = useState<CurveDataPoint[] | null>(null);

  const [priorAMin, setPriorAMin] = useState<number>(0.1);
  const [priorAMax, setPriorAMax] = useState<number>(5.0);
  const [priorBMin, setPriorBMin] = useState<number>(-2.0);
  const [priorBMax, setPriorBMax] = useState<number>(-0.01);

  const [mapA, setMapA] = useState<number | null>(null);
  const [mapB, setMapB] = useState<number | null>(null);
  const [logPosteriorGrid, setLogPosteriorGrid] = useState<{ a_vals: number[], b_vals: number[], Z: number[][] } | null>(null);
  const [isFitting, setIsFitting] = useState<boolean>(false);
  const [xRangeMin, setXRangeMin] = useState<number>(0);
  const [xRangeMax, setXRangeMax] = useState<number>(5);


  const metrics: BayesianInferenceMetrics = useMemo(() => {
    const probNoDisease = 1 - priorDisease;
    const falsePositiveRate = 1 - specificity; // P(Positive Test | No Disease)

    const p_Pos_given_Disease_times_p_Disease = sensitivity * priorDisease;
    const p_Pos_given_NoDisease_times_p_NoDisease = falsePositiveRate * probNoDisease;

    const probPositiveTest = p_Pos_given_Disease_times_p_Disease + p_Pos_given_NoDisease_times_p_NoDisease;
    
    let posteriorDiseaseGivenPositive = 0;
    if (probPositiveTest > 0) { // Avoid division by zero
        posteriorDiseaseGivenPositive = p_Pos_given_Disease_times_p_Disease / probPositiveTest;
    }
    posteriorDiseaseGivenPositive = Math.max(0, Math.min(1, posteriorDiseaseGivenPositive));


    return {
      priorDisease,
      sensitivity,
      specificity,
      probNoDisease,
      falsePositiveRate,
      p_Pos_given_Disease_times_p_Disease,
      p_Pos_given_NoDisease_times_p_NoDisease,
      probPositiveTest,
      posteriorDiseaseGivenPositive,
    };
  }, [priorDisease, sensitivity, specificity]);

  const handleGenerateData = useCallback(() => {
    const data = generateExponentialData(trueA, trueB, numDataPoints, noiseStd, [xRangeMin, xRangeMax]);
    setGeneratedData(data.map(d => ({x: d.x, y_noisy: d.y_noisy, y_true: d.y_true})));
    setMapA(null); // Reset previous fit
    setMapB(null);
    setLogPosteriorGrid(null);
  }, [trueA, trueB, numDataPoints, noiseStd, xRangeMin, xRangeMax]);

  const handleFitModel = useCallback(async () => {
    if (!generatedData) return;
    setIsFitting(true);
    setMapA(null);
    setMapB(null);
    setLogPosteriorGrid(null);

    // Give browser time to update UI (show loading state)
    await new Promise(resolve => setTimeout(resolve, 50));


    const priorParams: LogPriorUniformType = {
        a_min: priorAMin, a_max: priorAMax,
        b_min: priorBMin, b_max: priorBMax,
    };
    const gridConfig = { a_steps: 30, b_steps: 30 };

    const { a_map, b_map, log_posterior_grid_values, a_grid_values, b_grid_values } = findMAPExponential(
        generatedData.map(d => ({x: d.x, y: d.y_noisy})), // Pass only x and noisy y for fitting
        noiseStd, // Assumed known for simplicity
        priorParams,
        gridConfig
    );
    setMapA(a_map);
    setMapB(b_map);
    if (log_posterior_grid_values && a_grid_values && b_grid_values) {
       setLogPosteriorGrid({a_vals: a_grid_values, b_vals: b_grid_values, Z: log_posterior_grid_values});
    }
    setIsFitting(false);
  }, [generatedData, noiseStd, priorAMin, priorAMax, priorBMin, priorBMax]);

  const chartData = useMemo(() => {
    const baseData = generatedData || [];
    if (mapA !== null && mapB !== null && generatedData) {
      // If fitted and data exists, augment with y_fitted
      return baseData.map(dp => ({
        ...dp,
        y_fitted: mapA * Math.exp(mapB * dp.x)
      }));
    }
    // Otherwise, return generatedData (which might be empty or contain y_true, y_noisy)
    return baseData;
  }, [generatedData, mapA, mapB]);


  const whatIsBayesianInference = [
    "Bayesian inference is a statistical method used to update the probability for a hypothesis as more evidence or information becomes available. It is a powerful way of reasoning under uncertainty.",
    "At its core, it's about starting with an initial belief (prior probability), and then modifying that belief in light of new data or observations (evidence) to arrive at an updated belief (posterior probability)."
  ];

  const bayesTheoremFormula = [
    "Bayes' Theorem provides the mathematical rule for performing this update:",
    <strong className="block text-center my-2 text-lg font-mono text-sky-700 bg-sky-50 p-2 rounded">
      P(H|E) = [ P(E|H) &times; P(H) ] / P(E)
    </strong>,
    "Where:",
    <ul className="list-disc list-inside ml-4 space-y-1 mt-2">
      <li><code className="font-semibold">P(H|E)</code>: Posterior probability – The probability of hypothesis H being true, given the evidence E. This is what we want to calculate.</li>
      <li><code className="font-semibold">P(E|H)</code>: Likelihood – The probability of observing evidence E if hypothesis H is true.</li>
      <li><code className="font-semibold">P(H)</code>: Prior probability – Our initial belief in hypothesis H before observing evidence E.</li>
      <li><code className="font-semibold">P(E)</code>: Marginal Likelihood (or Evidence) – The total probability of observing evidence E. This acts as a normalizing constant and can be calculated as: <code className="text-xs bg-slate-200 px-1 rounded">P(E) = P(E|H)P(H) + P(E|¬H)P(¬H)</code>, where ¬H is 'not H'.</li>
    </ul>
  ];

  const keyConcepts = [
    <strong key="kc-prior">Prior Belief (P(H)):</strong>,
    "This represents our initial degree of belief in a hypothesis before we consider new evidence. Priors can be based on previous studies, domain knowledge, or even a subjective assessment. The choice of prior can influence the posterior, especially with limited data.",
    <strong key="kc-likelihood">Likelihood (P(E|H)):</strong>,
    "This quantifies how well the observed evidence E is explained by the hypothesis H. It's the probability of seeing the data if the hypothesis were true. This is often derived from a model of how the data is generated under the hypothesis.",
    <strong key="kc-evidence">Marginal Likelihood / Evidence (P(E)):</strong>,
    "This is the overall probability of observing the evidence E, considering all possible hypotheses. It ensures that the posterior probabilities sum to 1 (or integrate to 1 for continuous variables). Calculating P(E) can sometimes be the most computationally challenging part of Bayesian inference.",
    <strong key="kc-posterior">Posterior Belief (P(H|E)):</strong>,
    "This is our updated degree of belief in the hypothesis H after we have observed and incorporated the evidence E. The posterior combines the prior belief with the information from the data (via the likelihood).",
  ];
  
  const iterativeNature = [
    "Bayesian inference is inherently iterative. The posterior probability calculated after one piece of evidence can serve as the prior probability for the next piece of evidence.",
    "This allows beliefs to be refined progressively as more data becomes available, making it a natural framework for learning from experience."
  ];

  const whyPowerful = [
    <ul className="list-disc list-inside space-y-1">
      <li><strong>Explicit Uncertainty Handling:</strong> It provides a full probability distribution for unknown parameters, rather than just point estimates.</li>
      <li><strong>Incorporation of Prior Knowledge:</strong> Allows for the formal integration of existing knowledge into the analysis.</li>
      <li><strong>Incremental Updates:</strong> Beliefs can be updated sequentially as new data arrives.</li>
      <li><strong>Intuitive Framework:</strong> Mirrors how humans often reason and learn – by updating beliefs based on new observations.</li>
      <li><strong>Foundation for Advanced Models:</strong> It's the basis for many sophisticated machine learning models, such as Naive Bayes classifiers, Bayesian networks, and Gaussian processes.</li>
    </ul>
  ];

  const relationToOtherConcepts = [
    "Bayesian inference is deeply connected to other concepts you might have explored:",
    <ul className="list-disc list-inside ml-4 space-y-1 mt-2">
      <li><strong>Conditional Probability:</strong> Bayes' Theorem is fundamentally derived from the definition of conditional probability.</li>
      <li><strong>Monty Hall Problem:</strong> The surprising solution to the Monty Hall problem can be elegantly explained using Bayesian updating. Your initial choice has a P(Car) = 1/3. When the host reveals a goat, this new evidence allows you to update the probability of the remaining closed door having the car.</li>
      <li><strong>Information Theory:</strong> Bayesian methods can be used to quantify the information gained from an experiment or observation, relating to concepts like mutual information.</li>
    </ul>
  ];

  const bayesianCurveFittingExplanation = [
    "Bayesian inference provides a robust framework for fitting models to data, such as an exponential curve to noisy observations. Instead of finding single 'best-fit' parameters, it aims to estimate the probability distribution of the parameters.",
    <React.Fragment key="bcf-problem">
      <h4 className="font-semibold mt-3 mb-1 text-md text-slate-700">Problem Setup: Exponential Model</h4>
      <p>Imagine we have data points (xᵢ, yᵢ) that we suspect follow an exponential model: <code className="font-mono bg-slate-100 text-xs px-1 rounded-sm">y = a * exp(b * x)</code>. Our observed yᵢ values include some noise: <code className="font-mono bg-slate-100 text-xs px-1 rounded-sm">yᵢ = a * exp(b * xᵢ) + εᵢ</code>, where εᵢ is typically assumed to be Gaussian noise, <code className="font-mono bg-slate-100 text-xs px-1 rounded-sm">εᵢ ~ N(0, σ²)</code>. We want to estimate 'a' and 'b' (and possibly 'σ', though 'σ' is fixed in the demo below for simplicity).</p>
    </React.Fragment>,
    <React.Fragment key="bcf-approach">
      <h4 className="font-semibold mt-3 mb-1 text-md text-slate-700">Bayesian Approach Overview:</h4>
      <ul className="list-disc list-inside ml-2 space-y-1 text-sm sm:text-base">
        <li>
          <strong>Priors (P(a), P(b)):</strong> We define prior distributions for our parameters 'a' and 'b' based on existing knowledge or assumptions (e.g., 'a' is likely positive, 'b' is likely negative for decay).
        </li>
        <li>
          <strong>Likelihood (P(Data | a, b, σ)):</strong> This describes how probable the observed data points (yᵢ) are, given specific values for 'a', 'b', and the noise level 'σ'.
        </li>
        <li>
          <strong>Posterior (P(a, b | Data, σ)):</strong> Using Bayes' Theorem, we combine the priors and the likelihood: <code className="font-mono bg-slate-100 text-xs px-1 rounded-sm">P(a, b | Data) ∝ P(Data | a, b, σ) * P(a) * P(b)</code>. The posterior distribution represents our updated beliefs about 'a' and 'b' after observing the data.
        </li>
      </ul>
    </React.Fragment>,
    <React.Fragment key="bcf-computation-intro">
      <h4 className="font-semibold mt-3 mb-1 text-md text-slate-700">Computational Methods:</h4>
      <p>The posterior distribution is often complex. Full Bayesian analysis uses methods like Markov Chain Monte Carlo (MCMC) to draw samples from this posterior, providing a rich understanding of parameter uncertainties and correlations. </p>
      <p><strong>The demo below uses a simplified approach:</strong> It performs a grid search to find the <strong>Maximum A Posteriori (MAP)</strong> estimate – the combination of 'a' and 'b' that maximizes the posterior probability. This gives single best-fit values rather than full distributions, but illustrates the core concepts of combining prior beliefs with data likelihood. The heatmap shows the (log) posterior surface over the searched grid.</p>
    </React.Fragment>
  ];

  const mapCalculationExplanation = (
    <div className="mt-3 p-3 bg-sky-50 border border-sky-200 rounded-md text-sm text-slate-700 space-y-2">
      <h5 className="text-md font-semibold text-sky-700">How MAP Estimates are Calculated in this Demo:</h5>
      <p>The 'MAP Estimate for a' and 'MAP Estimate for b' are the values of 'a' and 'b' that maximize the posterior probability density, P(a, b | Data). In this demonstration, these are found using a <strong>grid search</strong> method:</p>
      <ol className="list-decimal list-inside ml-4 space-y-1 text-xs">
        <li>A grid of possible 'a' and 'b' values is created within their specified prior ranges (defined under "Prior Specification").</li>
        <li>For each pair of (a, b) on this grid, the log-posterior probability is calculated. Working with log-probabilities is common for numerical stability and convenience:
          <br /><code className="text-sky-800 bg-sky-100 px-1 rounded">log P(a, b | Data) = log P(Data | a, b, σ) + log P(a) + log P(b)</code>
          <br />(The log of the evidence, <code className="text-sky-800 bg-sky-100 px-1 rounded">log P(Data)</code>, is a constant for all parameter values and doesn't affect the location of the maximum, so it's often omitted when finding the MAP.)
        </li>
        <li>
          The <code className="text-sky-800 bg-sky-100 px-1 rounded">log P(Data | a, b, σ)</code> is the log-likelihood of observing the noisy data points given the parameters 'a', 'b', and the (assumed known) noise standard deviation 'σ'. For Gaussian noise, this involves summing the squared differences between observed and predicted y-values.
        </li>
        <li>
          The <code className="text-sky-800 bg-sky-100 px-1 rounded">log P(a)</code> and <code className="text-sky-800 bg-sky-100 px-1 rounded">log P(b)</code> are the log-priors for 'a' and 'b'. Since uniform priors are used in this demo, these terms are constant (effectively 0 in log-space) if 'a' and 'b' are within their defined ranges, and -Infinity otherwise (making the posterior effectively zero outside the prior support).
        </li>
        <li>The pair (a, b) from the grid that yields the highest log-posterior probability is selected as the MAP estimate.</li>
        <li>The heatmap below visualizes this log-posterior surface, and the MAP estimate (marked by a red 'x') corresponds to the peak (brightest area) of this surface.</li>
      </ol>
      <p className="text-xs mt-2">This grid search provides a point estimate (the mode of the posterior). A full Bayesian analysis (e.g., using MCMC) would characterize the entire posterior distribution, providing a richer understanding of parameter uncertainties and correlations, rather than just its peak.</p>
    </div>
  );


  return (
    <main className="max-w-5xl mx-auto space-y-6 lg:space-y-8"> {/* Increased max-width for more space */}
      <Card>
        <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-200">
          <h2 className="text-3xl font-bold text-sky-700">Bayesian Inference & Bayes' Theorem</h2>
          <button
            onClick={onNavigateBack}
            className="px-4 py-2 bg-sky-600 text-white text-sm font-medium rounded-md hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 transition-colors duration-150"
            aria-label="Back to Main Concepts"
          >
            &larr; Back to Main Concepts
          </button>
        </div>

        <ConceptExplainer
          title="What is Bayesian Inference?"
          explanation={whatIsBayesianInference}
        />

        <ConceptExplainer
          title="Bayes' Theorem: The Engine of Update"
          explanation={bayesTheoremFormula}
        />

        <ConceptExplainer
          title="Key Concepts in Bayesian Inference"
          explanation={keyConcepts}
        />

        <Card title="Interactive Example: Medical Diagnosis" className="mt-6 bg-slate-50">
          <p className="text-sm text-slate-600 mb-4">
            Let's consider a scenario: A person tests positive for a relatively rare disease. How likely is it that they actually have the disease?
            Adjust the parameters below to see how the posterior probability P(Disease | Positive Test) changes.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
            <div>
              <h4 className="text-md font-semibold text-slate-700 mb-2">Input Parameters:</h4>
              <ParameterInput
                id="priorDisease"
                label="Prior P(Disease)"
                value={priorDisease}
                onChange={setPriorDisease}
                min={0.001} max={0.5} step={0.001}
                description="Initial probability of having the disease (prevalence)."
              />
              <ParameterInput
                id="sensitivity"
                label="Test Sensitivity P(+ | Disease)"
                value={sensitivity}
                onChange={setSensitivity}
                min={0.5} max={0.999} step={0.001}
                description="Prob. of a positive test if person has the disease."
              />
              <ParameterInput
                id="specificity"
                label="Test Specificity P(- | No Disease)"
                value={specificity}
                onChange={setSpecificity}
                min={0.5} max={0.999} step={0.001}
                description="Prob. of a negative test if person does NOT have the disease."
              />
            </div>
            <div>
              <h4 className="text-md font-semibold text-slate-700 mb-2">Calculated Values (Given a Positive Test):</h4>
              <div className="space-y-2">
                <ResultDisplay label="P(No Disease)" value={metrics.probNoDisease} description="1 - P(Disease)" />
                <ResultDisplay label="P(+ | No Disease)" value={metrics.falsePositiveRate} description="False Positive Rate (1 - Specificity)" />
                <h5 className="text-sm font-semibold text-slate-600 pt-2">Numerator for Posterior: P(+|Disease)P(Disease)</h5>
                <ResultDisplay label="Term" value={metrics.p_Pos_given_Disease_times_p_Disease} />
                <h5 className="text-sm font-semibold text-slate-600 pt-2">Denominator (Evidence P(+)):</h5>
                <ResultDisplay label="P(+|Disease)P(Disease)" value={metrics.p_Pos_given_Disease_times_p_Disease} description="Contribution from true positives" />
                <ResultDisplay label="P(+|No Disease)P(No Disease)" value={metrics.p_Pos_given_NoDisease_times_p_NoDisease} description="Contribution from false positives" />
                <ResultDisplay label="Total P(Positive Test)" value={metrics.probPositiveTest} description="Sum of above two terms" />
                <h5 className="text-sm font-semibold text-slate-600 pt-2">Posterior Probability:</h5>
                <ResultDisplay 
                    label="P(Disease | Positive Test)" 
                    value={metrics.posteriorDiseaseGivenPositive} 
                    isPrimary={true}
                    description="Updated probability of having the disease after a positive test."
                />
              </div>
            </div>
          </div>
          <div className="mt-4 p-3 bg-sky-50 border border-sky-200 rounded-md">
             <h5 className="text-md font-semibold text-sky-700 mb-1">Calculation Breakdown for P(Disease | Positive Test):</h5>
             <p className="text-xs text-slate-700 font-mono break-all">
                P(D|+) = [ P(+|D) &times; P(D) ] / [ P(+|D)P(D) + P(+|¬D)P(¬D) ]
             </p>
             <p className="text-xs text-slate-700 font-mono break-all mt-1">
                P(D|+) = [ {metrics.sensitivity.toFixed(3)} &times; {metrics.priorDisease.toFixed(3)} ] / [ ({metrics.sensitivity.toFixed(3)} &times; {metrics.priorDisease.toFixed(3)}) + ({metrics.falsePositiveRate.toFixed(3)} &times; {metrics.probNoDisease.toFixed(3)}) ]
             </p>
             <p className="text-xs text-slate-700 font-mono break-all mt-1">
                P(D|+) = [ {metrics.p_Pos_given_Disease_times_p_Disease.toFixed(5)} ] / [ {metrics.p_Pos_given_Disease_times_p_Disease.toFixed(5)} + {metrics.p_Pos_given_NoDisease_times_p_NoDisease.toFixed(5)} ]
             </p>
             <p className="text-xs text-slate-700 font-mono break-all mt-1">
                P(D|+) = {metrics.p_Pos_given_Disease_times_p_Disease.toFixed(5)} / {metrics.probPositiveTest.toFixed(5)} = <strong className="text-sky-700">{metrics.posteriorDiseaseGivenPositive.toFixed(4)}</strong>
             </p>
             <p className="text-sm text-slate-600 mt-3">
                Notice how a low prior probability (rare disease) can mean that even with a positive test from a seemingly accurate test, the chance of actually having the disease might be lower than you intuitively expect. This is known as the base rate fallacy.
             </p>
          </div>
          <BayesianProbabilityPlot
            currentPriorDisease={priorDisease}
            currentSensitivity={sensitivity}
            currentSpecificity={specificity}
          />
        </Card>

        <ConceptExplainer
          title="Application: Bayesian Exponential Curve Fitting"
          explanation={bayesianCurveFittingExplanation}
        />
        
        <Card title="Interactive Exponential Curve Fitting (MAP Demo)" className="mt-6 bg-slate-50">
            <p className="text-sm text-slate-600 mb-4">
                This demo fits an exponential model <code className="bg-slate-200 px-1 rounded text-xs">y = a * exp(b * x)</code> to generated noisy data.
                It finds the Maximum A Posteriori (MAP) estimates for 'a' and 'b' using a grid search.
                The noise level (σ) is assumed known from data generation.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
                {/* Column 1: Data Generation & Priors */}
                <div>
                    <h4 className="text-md font-semibold text-slate-700 mb-2">1. Data Generation Parameters:</h4>
                    <ParameterInput id="trueA" label="True 'a' (Amplitude)" value={trueA} onChange={setTrueA} min={0.1} max={10} step={0.1} />
                    <ParameterInput id="trueB" label="True 'b' (Rate)" value={trueB} onChange={setTrueB} min={-5} max={-0.01} step={0.01} />
                    <ParameterInput id="xRangeMin" label="X min" value={xRangeMin} onChange={setXRangeMin} min={0} max={10} step={0.1} />
                    <ParameterInput id="xRangeMax" label="X max" value={xRangeMax} onChange={setXRangeMax} min={0.1} max={20} step={0.1} />
                    <ParameterInput id="numPoints" label="Number of Data Points" value={numDataPoints} onChange={val => setNumDataPoints(Math.round(val))} min={5} max={100} step={1} />
                    <ParameterInput id="noiseStd" label="Noise Std. Dev (σ)" value={noiseStd} onChange={setNoiseStd} min={0.01} max={2} step={0.01} />
                    <button onClick={handleGenerateData} className="w-full px-4 py-2 bg-sky-600 text-white font-semibold rounded-md hover:bg-sky-700 transition-colors">
                        Generate/Reset Data
                    </button>

                    <h4 className="text-md font-semibold text-slate-700 mt-6 mb-2">2. Prior Specification (Uniform Priors):</h4>
                    <ParameterInput id="priorAMin" label="Prior Min for 'a'" value={priorAMin} onChange={setPriorAMin} min={0.01} max={trueA + 5} step={0.01} />
                    <ParameterInput id="priorAMax" label="Prior Max for 'a'" value={priorAMax} onChange={setPriorAMax} min={0.1} max={trueA + 10} step={0.1} />
                    <ParameterInput id="priorBMin" label="Prior Min for 'b'" value={priorBMin} onChange={setPriorBMin} min={trueB - 5} max={-0.001} step={0.01} />
                    <ParameterInput id="priorBMax" label="Prior Max for 'b'" value={priorBMax} onChange={setPriorBMax} min={trueB - 2} max={-0.001} step={0.001} />
                </div>

                {/* Column 2: Fitting & Results */}
                <div>
                    <h4 className="text-md font-semibold text-slate-700 mb-2">3. Fit Model & Results:</h4>
                    <button onClick={handleFitModel} disabled={!generatedData || isFitting} className="w-full px-4 py-2 mb-4 bg-emerald-600 text-white font-semibold rounded-md hover:bg-emerald-700 disabled:bg-slate-400 transition-colors">
                        {isFitting ? 'Fitting Model...' : 'Fit Model (Find MAP)'}
                    </button>

                    {mapA !== null && mapB !== null && (
                        <>
                            <div className="space-y-2 mb-4">
                                <ResultDisplay label="MAP Estimate for 'a'" value={mapA} isPrimary />
                                <ResultDisplay label="MAP Estimate for 'b'" value={mapB} isPrimary />
                            </div>
                            {mapCalculationExplanation}
                        </>
                    )}

                    <div className="h-72 sm:h-96 w-full bg-white p-2 rounded-md shadow mt-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={chartData} margin={{ top: 5, right: 20, left: -20, bottom: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                <XAxis type="number" dataKey="x" name="x" stroke="#64748b" tick={{ fontSize: 10 }} label={{ value: 'x', position: 'insideBottom', offset: -10, fill: '#475569', fontSize:12 }} domain={['dataMin', 'dataMax']}/>
                                <YAxis type="number" dataKey="y_noisy" name="y" stroke="#64748b" tick={{ fontSize: 10 }} label={{ value: 'y', angle: -90, position: 'insideLeft', offset:10, fill: '#475569', fontSize:12 }} domain={['auto', 'auto']}/>
                                <Tooltip contentStyle={{fontSize: '12px', borderRadius:'0.375rem'}}/>
                                <Legend wrapperStyle={{fontSize: '12px'}} iconSize={10} verticalAlign="top" height={30}/>
                                <Scatter name="Noisy Data" dataKey="y_noisy" fill="#8884d8" shape="circle" r={4} />
                                {generatedData && generatedData.some(d => d.y_true !== undefined) && (
                                    <Line type="monotone" dataKey="y_true" stroke="#ff7300" strokeWidth={2} name="True Curve" dot={false} />
                                )}
                                {mapA !== null && mapB !== null && (
                                    <Line type="monotone" dataKey="y_fitted" stroke="#387908" strokeWidth={2} name="MAP Fitted Curve" dot={false} />
                                )}
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
            {isFitting && <p className="text-center mt-4 text-sky-600">Performing grid search for MAP estimates, please wait...</p>}
            {logPosteriorGrid && mapA !== null && mapB !== null && (
                <div className="mt-6">
                    <h4 className="text-md font-semibold text-slate-700 mb-2">Log-Posterior Probability Surface (Heatmap):</h4>
                    <p className="text-xs text-slate-600 mb-2">
                        This heatmap shows the log of the posterior probability P(a, b | Data) across the grid of 'a' and 'b' values used in the search.
                        Brighter areas indicate higher probability. The red dot marks the MAP estimate (peak of this surface).
                    </p>
                    <div className="w-full h-[450px] lg:h-[500px] bg-white p-2 rounded-md shadow">
                         <Plot
                            data={[
                                {
                                    x: logPosteriorGrid.a_vals,
                                    y: logPosteriorGrid.b_vals,
                                    z: logPosteriorGrid.Z,
                                    type: 'heatmap',
                                    colorscale: 'Viridis',
                                    colorbar: {title: 'Log P(a,b|Data)'},
                                    hovertemplate: 'a: %{x:.3f}<br>b: %{y:.3f}<br>Log Posterior: %{z:.2f}<extra></extra>'
                                } as any, // Plotly type workaround
                                { // Scatter plot for the MAP estimate point
                                  x: [mapA],
                                  y: [mapB],
                                  type: 'scatter',
                                  mode: 'markers',
                                  marker: { color: 'red', size: 10, symbol: 'x' },
                                  name: 'MAP Estimate',
                                  hoverinfo: 'skip'
                                }
                            ]}
                            layout={{
                                autosize: true,
                                xaxis: { title: 'Parameter a (Amplitude)', automargin: true },
                                yaxis: { title: 'Parameter b (Rate)', automargin: true },
                                margin: { l: 60, r: 20, b: 50, t: 30 },
                            }}
                            useResizeHandler={true}
                            style={{ width: '100%', height: '100%' }}
                            config={{ responsive: true, displaylogo: false }}
                        />
                    </div>
                </div>
            )}
        </Card>


        <ConceptExplainer
          title="Iterative Nature of Bayesian Inference"
          explanation={iterativeNature}
        />
        
        <ConceptExplainer
          title="Why is Bayesian Inference Powerful?"
          explanation={whyPowerful}
        />

        <ConceptExplainer
          title="Relation to Other Concepts"
          explanation={relationToOtherConcepts}
        />
      </Card>
    </main>
  );
};

export default BayesianInferencePage;
