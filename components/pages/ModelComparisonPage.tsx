import React, { useMemo, useState } from 'react';
import LecturePage from '../shell/LecturePage';
import Formula from '../ui/Formula';
import Quiz, { type QuizQuestion } from '../quiz/Quiz';
import Slider from '../Slider';
import MetricRow from '../MetricRow';
import Callout from '../ui/Callout';
import SeedControl from '../ui/SeedControl';
import { Axis, BarSeries, Curve, Legend, Marker, Plot } from '../chart';
import { gaussian, mulberry32 } from '../../utils/rng';
import { formatValue } from '../../utils/informationTheory';

type Mat = number[][];
type Vec = number[];

const TRUE_COEFFS = [0, -0.4, 1.6];
const TRUE_ORDER = 2;
const MAX_ORDER = 8;
const SIGMA_PRIOR = 3;

const truePoly = (x: number): number =>
  TRUE_COEFFS.reduce((sum, coefficient, power) => sum + coefficient * x ** power, 0);

// Cholesky of a symmetric positive-definite matrix: A = L Lᵀ, log det A = 2 Σ log Lᵢᵢ.
const cholesky = (matrix: Mat): { L: Mat; logDet: number } | null => {
  const k = matrix.length;
  const L: Mat = Array.from({ length: k }, () => new Array<number>(k).fill(0));
  let logDet = 0;
  for (let i = 0; i < k; i += 1) {
    for (let j = 0; j <= i; j += 1) {
      let sum = matrix[i][j];
      for (let l = 0; l < j; l += 1) sum -= L[i][l] * L[j][l];
      if (i === j) {
        if (!(sum > 0)) return null;
        const root = Math.sqrt(sum);
        L[i][j] = root;
        logDet += Math.log(root);
      } else {
        L[i][j] = sum / L[j][j];
      }
    }
  }
  return { L, logDet: 2 * logDet };
};

const cholSolve = (L: Mat, b: Vec): Vec => {
  const k = b.length;
  const y = new Array<number>(k).fill(0);
  for (let i = 0; i < k; i += 1) {
    let sum = b[i];
    for (let j = 0; j < i; j += 1) sum -= L[i][j] * y[j];
    y[i] = sum / L[i][i];
  }
  const x = new Array<number>(k).fill(0);
  for (let i = k - 1; i >= 0; i -= 1) {
    let sum = y[i];
    for (let j = i + 1; j < k; j += 1) sum -= L[j][i] * x[j];
    x[i] = sum / L[i][i];
  }
  return x;
};

const safeCholesky = (matrix: Mat): { L: Mat; logDet: number } => {
  const working = matrix.map((row) => row.slice());
  let chol = cholesky(working);
  let jitter = 0;
  while (!chol && jitter < 10) {
    jitter += 1;
    const scale = Math.max(1, working[0][0]) * 1e-9 * jitter;
    for (let i = 0; i < working.length; i += 1) working[i][i] += scale;
    chol = cholesky(working);
  }
  if (!chol) {
    for (let i = 0; i < working.length; i += 1) working[i][i] += 1;
    chol = cholesky(working);
  }
  return chol ?? { L: working, logDet: 0 };
};

interface FitResult {
  order: number;
  params: number;
  weights: Vec;
  stds: Vec;
  rms: number;
  logLikelihood: number;
  logEvidence: number;
}

const fitModel = (
  xs: number[],
  ys: number[],
  order: number,
  sigma: number,
  sigmaPrior: number,
): FitResult => {
  const n = xs.length;
  const k = order + 1;
  const phi: Mat = xs.map((x) => Array.from({ length: k }, (_, power) => x ** power));
  const varObs = Math.max(sigma * sigma, 1e-12);
  const varPrior = Math.max(sigmaPrior * sigmaPrior, 1e-12);

  const A: Mat = Array.from({ length: k }, () => new Array<number>(k).fill(0));
  for (let a = 0; a < k; a += 1) {
    for (let b = 0; b < k; b += 1) {
      let sum = 0;
      for (let i = 0; i < n; i += 1) sum += phi[i][a] * phi[i][b];
      A[a][b] = sum / varObs + (a === b ? 1 / varPrior : 0);
    }
  }
  const rhs: Vec = new Array<number>(k).fill(0);
  for (let a = 0; a < k; a += 1) {
    let sum = 0;
    for (let i = 0; i < n; i += 1) sum += phi[i][a] * ys[i];
    rhs[a] = sum / varObs;
  }

  const chol = safeCholesky(A);
  const weights = cholSolve(chol.L, rhs);
  let rss = 0;
  for (let i = 0; i < n; i += 1) {
    let fitted = 0;
    for (let j = 0; j < k; j += 1) fitted += weights[j] * phi[i][j];
    const residual = ys[i] - fitted;
    rss += residual * residual;
  }
  let weightNorm = 0;
  for (const weight of weights) weightNorm += weight * weight;

  const quadratic = rss / (2 * varObs) + weightNorm / (2 * varPrior);
  const logLikelihood = (-n / 2) * Math.log(2 * Math.PI * varObs) - rss / (2 * varObs);
  const logEvidence =
    (-n / 2) * Math.log(2 * Math.PI * varObs) - (k / 2) * Math.log(varPrior) - quadratic - 0.5 * chol.logDet;

  const stds: number[] = [];
  for (let j = 0; j < k; j += 1) {
    const unit = new Array<number>(k).fill(0);
    unit[j] = 1;
    const column = cholSolve(chol.L, unit);
    stds.push(Math.sqrt(Math.max(0, column[j])));
  }

  return {
    order,
    params: k,
    weights,
    stds,
    rms: Math.sqrt(rss / Math.max(1, n)),
    logLikelihood,
    logEvidence,
  };
};

const makeData = (seed: number, sigma: number, n = 30): { xs: number[]; ys: number[] } => {
  const rng = mulberry32(seed);
  const xs: number[] = [];
  const ys: number[] = [];
  for (let i = 0; i < n; i += 1) {
    const x = -1 + (2 * (i + 0.5)) / n;
    xs.push(x);
    ys.push(truePoly(x) + sigma * gaussian(rng));
  }
  return { xs, ys };
};

const GRID = Array.from({ length: 121 }, (_, i) => -1 + (2 * i) / 120);

const QUESTIONS: QuizQuestion[] = [
  {
    id: 'best-order',
    kind: 'choice',
    prompt: 'The data were generated by a quadratic (order 2). Which polynomial order does the Bayesian evidence favour?',
    options: [
      { label: 'Order 0' },
      { label: 'Order 2', correct: true },
      { label: 'Order 8' },
      { label: 'Every order equally' },
    ],
    explanation:
      'The evidence balances the fit against the prior volume. Extra parameters beyond the truth raise the fit only slightly while shrinking the Occam factor.',
  },
  {
    id: 'param-count',
    kind: 'numeric',
    prompt: 'How many free parameters does a degree-5 polynomial regression have (including the constant)?',
    answer: 6,
    tolerance: 1e-9,
    unit: 'parameters',
    explanation: 'Powers 0 through 5 give coefficients w₀…w₅, so k = 6.',
  },
  {
    id: 'laplace',
    kind: 'choice',
    prompt: 'The Laplace approximation to the evidence amounts to…',
    options: [
      { label: 'Sampling the prior' },
      { label: 'Approximating the posterior by a Gaussian at its mode', correct: true },
      { label: 'Ignoring the prior' },
      { label: 'Fitting the data by least squares only' },
    ],
    explanation:
      'It expands the log posterior to second order at the MAP estimate, giving a Gaussian with covariance A⁻¹.',
  },
  {
    id: 'occam',
    kind: 'choice',
    prompt: 'In the evidence, the term −½ log det A acts as…',
    options: [
      { label: 'A data-fit reward' },
      { label: 'A complexity penalty for parameters the data do not pin down', correct: true },
      { label: 'A normalising constant shared by all orders' },
      { label: 'A noise estimate' },
    ],
    explanation:
      'Large posterior uncertainty (small det A) is penalised, which is Occam’s razor emerging automatically.',
  },
];

const ModelComparisonPage: React.FC = () => {
  const [seed, setSeed] = useState<number>(20240517);
  const [sigma, setSigma] = useState<number>(0.18);
  const [selectedOrder, setSelectedOrder] = useState<number>(TRUE_ORDER);

  const data = useMemo(() => makeData(seed, sigma), [seed, sigma]);
  const fits = useMemo(
    () => Array.from({ length: MAX_ORDER + 1 }, (_, order) => fitModel(data.xs, data.ys, order, sigma, SIGMA_PRIOR)),
    [data, sigma],
  );

  const bestOrder = fits.reduce((best, fit) => (fit.logEvidence > fits[best].logEvidence ? fit.order : best), 0);
  const selected = fits[selectedOrder];
  const bestEvidence = fits[bestOrder].logEvidence;

  const fitCurve = useMemo(
    () => GRID.map((x) => ({ x, y: selected.weights.reduce((sum, weight, power) => sum + weight * x ** power, 0) })),
    [selected],
  );
  const trueCurve = useMemo(() => GRID.map((x) => ({ x, y: truePoly(x) })), []);

  const dataYDomain = useMemo(() => {
    const values = [...data.ys, ...fitCurve.map((point) => point.y), ...trueCurve.map((point) => point.y)];
    const low = Math.min(...values);
    const high = Math.max(...values);
    const pad = Math.max(0.2, (high - low) * 0.12);
    return [low - pad, high + pad] as [number, number];
  }, [data.ys, fitCurve, trueCurve]);

  const evidenceBounds = useMemo(() => {
    const values = fits.map((fit) => fit.logEvidence);
    const low = Math.min(...values);
    const high = Math.max(...values);
    return { low: low - 1, high: high + 1, baseline: low - 1 };
  }, [fits]);

  return (
    <LecturePage slug="model-comparison" quiz={<Quiz slug="model-comparison" questions={QUESTIONS} />}>
      <p className="it-body-block">
        More parameters always fit the training data at least as well. Bayesian model comparison asks a
        sharper question: which model would have predicted these data best on average, before seeing
        them? The answer automatically applies Occam&rsquo;s razor.
      </p>
      <Formula
        tex="P(D \mid M) = \int P(D \mid w, M)\, P(w \mid M)\, dw"
        note="the evidence or marginal likelihood: average the fit over the prior"
        label="Marginal likelihood of a model"
      />
      <Formula
        tex="\log P(D \mid M) \approx \log P(D \mid \hat{w}) + \log P(\hat{w}) + \tfrac{k}{2}\log 2\pi - \tfrac{1}{2}\log\det A"
        note="Laplace approximation at the posterior mode, with A the Hessian of -log posterior"
        label="Laplace approximation to the log evidence"
      />
      <Formula
        tex="A = \tfrac{1}{\sigma^2}\Phi^\top\Phi + \tfrac{1}{\sigma_p^2} I"
        note="for Gaussian noise of known variance σ² and a Gaussian prior of variance σ_p² on the coefficients"
        label="Hessian of the negative log posterior"
      />

      <h4>Noisy data from a known polynomial</h4>
      <p className="it-body-block">
        The truth is a quadratic; the noise level is yours to set. Fitting orders 0–8, the evidence peaks
        at the true complexity rather than at the best raw fit.
      </p>
      <div style={{ display: 'flex', gap: 'var(--space-6)', flexWrap: 'wrap', marginBottom: 'var(--space-4)' }}>
        <Slider
          label="Noise σ"
          valueLabel={sigma.toFixed(2)}
          value={sigma}
          min={0.05}
          max={0.4}
          step={0.01}
          onChange={setSigma}
          style={{ maxWidth: 300, flex: 1 }}
        />
        <Slider
          label="Displayed polynomial order"
          valueLabel={selectedOrder}
          value={selectedOrder}
          min={0}
          max={MAX_ORDER}
          step={1}
          onChange={(value) => setSelectedOrder(Math.round(value))}
          style={{ maxWidth: 300, flex: 1 }}
        />
      </div>
      <SeedControl seed={seed} onNewSeed={setSeed} />

      <Plot
        xDomain={[-1.05, 1.05]}
        yDomain={dataYDomain}
        title="Data with the selected least-squares fit"
        desc="Circles are noisy samples of a quadratic. The solid curve is the fit for the selected polynomial order and the dashed curve is the true quadratic."
        height={320}
      >
        <Axis orient="left" label="y" />
        <Axis orient="bottom" label="x" ticks={[-1, -0.5, 0, 0.5, 1]} />
        {data.xs.map((x, index) => (
          <Marker key={index} x={x} y={data.ys[index]} radius={3.5} />
        ))}
        <Curve points={fitCurve} color="var(--color-accent-700)" />
        <Curve points={trueCurve} color="var(--color-accent-2-700)" dashed />
      </Plot>
      <Legend
        items={[
          { label: 'Noisy data', color: 'var(--color-accent-2-600)' },
          { label: `Order-${selectedOrder} fit`, color: 'var(--color-accent-700)' },
          { label: `True order ${TRUE_ORDER}`, color: 'var(--color-accent-2-700)', dashed: true },
        ]}
      />

      <div style={{ display: 'flex', gap: 'var(--space-8)', flexWrap: 'wrap', margin: 'var(--space-4) 0' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 240 }}>
          <MetricRow label="Parameters k" value={selected.params} />
          <MetricRow label="RMS residual" value={formatValue(selected.rms, 4)} />
          <MetricRow label="Log likelihood" value={formatValue(selected.logLikelihood, 1)} />
          <MetricRow
            label={<b>Log evidence</b>}
            value={formatValue(selected.logEvidence, 1)}
            valueColor="var(--color-accent-700)"
          />
          <MetricRow
            label="Relative to best"
            value={formatValue(selected.logEvidence - bestEvidence, 1)}
            valueColor={selected.order === bestOrder ? 'var(--color-accent-700)' : 'var(--color-accent-2-700)'}
          />
        </div>
        <div>
          <div className="text-muted" style={{ fontSize: 12, marginBottom: 4 }}>
            Posterior coefficients w | D (mean ± sd)
          </div>
          <table className="table" style={{ width: 'auto' }}>
            <thead>
              <tr><th>Power</th><th>Mean</th><th>Std</th></tr>
            </thead>
            <tbody>
              {selected.weights.map((weight, power) => (
                <tr key={power}>
                  <td>{power}</td>
                  <td>{formatValue(weight, 3)}</td>
                  <td className="text-muted">± {formatValue(selected.stds[power], 3)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <h4>Evidence versus polynomial order</h4>
      <Plot
        xDomain={[-0.6, MAX_ORDER + 0.6]}
        yDomain={[evidenceBounds.low, evidenceBounds.high]}
        title="Log evidence against polynomial order"
        desc="Each bar is the Laplace-approximated marginal likelihood of one polynomial order, plotted on a log scale; it peaks at the true complexity and falls for both underfitting and overfitting."
        height={300}
      >
        <Axis orient="left" label="log evidence" />
        <Axis orient="bottom" label="polynomial order" ticks={[0, 1, 2, 3, 4, 5, 6, 7, 8]} />
        <BarSeries
          bars={fits.map((fit) => ({ x: fit.order, y: fit.logEvidence, width: 0.7 }))}
          baseline={evidenceBounds.baseline}
          color="var(--color-accent-700)"
          opacity={0.55}
        />
        <Marker x={bestOrder} y={fits[bestOrder].logEvidence} label={`best: order ${bestOrder}`} labelDy={-12} />
      </Plot>

      <Callout title="Occam’s razor, for free" tone="info">
        Low orders are punished by a poor fit; high orders are punished by the Occam factor −½ log det A,
        which is small exactly when the data leave the extra parameters poorly determined. Maximising the
        evidence picks the model that neither under- nor over-explains.
      </Callout>

      <table className="table" style={{ marginTop: 'var(--space-4)' }}>
        <thead>
          <tr><th>Order</th><th>Params</th><th>RMS</th><th>Log evidence</th><th>Δ best</th></tr>
        </thead>
        <tbody>
          {fits.map((fit) => (
            <tr key={fit.order} style={fit.order === bestOrder ? { color: 'var(--color-accent-700)' } : undefined}>
              <td>{fit.order}</td>
              <td>{fit.params}</td>
              <td>{formatValue(fit.rms, 4)}</td>
              <td>{formatValue(fit.logEvidence, 1)}</td>
              <td>{formatValue(fit.logEvidence - bestEvidence, 1)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </LecturePage>
  );
};

export default ModelComparisonPage;
