import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Slider from '../Slider';
import MetricRow from '../MetricRow';
import LecturePage from '../shell/LecturePage';
import Formula from '../ui/Formula';
import Callout from '../ui/Callout';
import Quiz, { type QuizQuestion } from '../quiz/Quiz';
import { Axis, Curve, Heatmap, Legend, Marker, Plot, RuleY } from '../chart';
import SimControls from '../ui/SimControls';
import { useAnimationLoop } from '../../hooks/useAnimationLoop';

const QUESTIONS: QuizQuestion[] = [
  {
    id: 'mean-field',
    kind: 'choice',
    prompt: 'A mean-field (factorised) variational approximation assumes that…',
    options: [
      { label: 'The data are Gaussian' },
      { label: 'The latent variables are independent under Q, so posterior correlations are discarded', correct: true },
      { label: 'The likelihood is exact' },
      { label: 'The prior is uniform' },
    ],
    explanation: 'Writing Q(z) = ∏ qᵢ(zᵢ) rules out any dependence between coordinates; it is the price of an easy optimisation.',
  },
  {
    id: 'opt-var',
    kind: 'numeric',
    prompt:
      'P is a standard bivariate normal with correlation ρ = 0.8. What variance does the optimal factorised Q assign to each coordinate?',
    answer: 0.36,
    tolerance: 0.005,
    explanation: 'The coordinate-optimal precision is Λᵢᵢ = 1/(1 − ρ²), so vᵢ = 1 − ρ² = 0.36, far below P’s marginal variance of 1.',
  },
  {
    id: 'underestimate',
    kind: 'choice',
    prompt: 'Why does minimising KL(Q‖P) tend to make Q too narrow?',
    options: [
      { label: 'Because Q is constrained to have zero mean' },
      { label: 'Because placing mass where P is near zero is heavily penalised, so Q hugs a high-density region', correct: true },
      { label: 'Because the bound is exact' },
      { label: 'Because KL is symmetric' },
    ],
    explanation: 'KL(Q‖P) is mode-seeking: it punishes Q mass in P’s tails, so Q underestimates spread rather than overestimate it.',
  },
  {
    id: 'elbo',
    kind: 'choice',
    prompt: 'The free-energy bound (ELBO) satisfies…',
    options: [
      { label: 'ELBO ≥ log Z always' },
      { label: 'ELBO ≤ log Z, with equality when Q = P', correct: true },
      { label: 'ELBO = log Z regardless of Q' },
      { label: 'ELBO is unbounded above' },
    ],
    explanation: 'Since log Z − ELBO = KL(Q‖P) ≥ 0, the bound tightens as Q approaches the true posterior.',
  },
];

const DOMAIN = 3.4;
const GRID = 46;
const MAX_ITER = 80;
const P_VAR = 1;

interface Point {
  x: number;
  y: number;
}

interface HistoryPoint {
  iter: number;
  kl: number;
  bound: number;
}

interface VarState {
  m1: number;
  m2: number;
  v1: number;
  v2: number;
  iter: number;
  history: HistoryPoint[];
}

interface Snapshot {
  m1: number;
  m2: number;
  v1: number;
  v2: number;
  iter: number;
  kl: number;
  history: HistoryPoint[];
}

const oneMinusRhoSq = (rho: number): number => Math.max(1e-6, 1 - rho * rho);

const targetPDF = (x: number, y: number, rho: number): number => {
  const det = oneMinusRhoSq(rho);
  const q = (x * x - 2 * rho * x * y + y * y) / (2 * det);
  return Math.exp(-q) / (2 * Math.PI * Math.sqrt(det));
};

const klBits = (rho: number, m1: number, m2: number, v1: number, v2: number): number => {
  const detP = oneMinusRhoSq(rho);
  const q1 = Math.max(1e-6, v1);
  const q2 = Math.max(1e-6, v2);
  const trace = (q1 + q2) / detP;
  const quadratic = (m1 * m1 - 2 * rho * m1 * m2 + m2 * m2) / detP;
  const logdet = Math.log(detP / (q1 * q2));
  const nats = 0.5 * (trace + quadratic - 2 + logdet);
  return Math.max(0, nats / Math.LN2);
};

const ellipsePoints = (
  mx: number,
  my: number,
  cov: [number, number, number],
  scale: number,
  segments = 96,
): Point[] => {
  const [a, b, c] = cov;
  const trace = a + c;
  const half = (a - c) / 2;
  const disc = Math.sqrt(Math.max(0, half * half + b * b));
  const l1 = Math.max(1e-9, trace / 2 + disc);
  const l2 = Math.max(1e-9, trace / 2 - disc);
  let v1x = b;
  let v1y = l1 - a;
  let norm = Math.hypot(v1x, v1y);
  if (norm < 1e-9) {
    v1x = 1;
    v1y = 0;
    norm = 1;
  }
  v1x /= norm;
  v1y /= norm;
  const v2x = -v1y;
  const v2y = v1x;
  const r1 = Math.sqrt(l1) * scale;
  const r2 = Math.sqrt(l2) * scale;
  const points: Point[] = [];
  for (let i = 0; i <= segments; i += 1) {
    const t = (2 * Math.PI * i) / segments;
    points.push({
      x: mx + v1x * r1 * Math.cos(t) + v2x * r2 * Math.sin(t),
      y: my + v1y * r1 * Math.cos(t) + v2y * r2 * Math.sin(t),
    });
  }
  return points;
};

const createVarState = (rho: number): VarState => {
  const m1 = 1.4;
  const m2 = -1.2;
  const v1 = 2;
  const v2 = 1.5;
  const kl = klBits(rho, m1, m2, v1, v2);
  return { m1, m2, v1, v2, iter: 0, history: [{ iter: 0, kl, bound: -kl }] };
};

const snapshotOf = (state: VarState): Snapshot => {
  const last = state.history[state.history.length - 1];
  return {
    m1: state.m1,
    m2: state.m2,
    v1: state.v1,
    v2: state.v2,
    iter: state.iter,
    kl: last ? last.kl : 0,
    history: state.history.slice(),
  };
};

const VariationalMethodsPage: React.FC = () => {
  const [rho, setRho] = useState<number>(0.8);
  const stateRef = useRef<VarState>(createVarState(rho));
  const [snap, setSnap] = useState<Snapshot>(() => snapshotOf(stateRef.current));

  const resetSim = useCallback(() => {
    stateRef.current = createVarState(rho);
    setSnap(snapshotOf(stateRef.current));
  }, [rho]);

  useEffect(() => {
    resetSim();
  }, [resetSim]);

  const tick = (_dt: number): void => {
    const st = stateRef.current;
    if (st.history.length >= MAX_ITER) return;
    const vOpt = oneMinusRhoSq(rho);
    st.m1 = rho * st.m2;
    st.v1 = vOpt;
    st.m2 = rho * st.m1;
    st.v2 = vOpt;
    st.iter += 1;
    const kl = klBits(rho, st.m1, st.m2, st.v1, st.v2);
    st.history.push({ iter: st.iter, kl, bound: -kl });
    setSnap(snapshotOf(st));
  };

  const loop = useAnimationLoop({ tick, onReset: resetSim, initialSpeed: 3 });

  const heat = useMemo(() => {
    const rows: number[][] = [];
    for (let r = 0; r < GRID; r += 1) {
      const y = DOMAIN - (2 * DOMAIN * r) / (GRID - 1);
      const row: number[] = [];
      for (let c = 0; c < GRID; c += 1) {
        const x = -DOMAIN + (2 * DOMAIN * c) / (GRID - 1);
        row.push(targetPDF(x, y, rho));
      }
      rows.push(row);
    }
    return rows;
  }, [rho]);

  const pEllipse = useMemo(() => ellipsePoints(0, 0, [P_VAR, rho, P_VAR], 2), [rho]);
  const qEllipse = useMemo(
    () => ellipsePoints(snap.m1, snap.m2, [snap.v1, 0, snap.v2], 2),
    [snap.m1, snap.m2, snap.v1, snap.v2],
  );

  const maxAbs = useMemo(() => {
    let max = 1e-6;
    for (const entry of snap.history) {
      max = Math.max(max, Math.abs(entry.kl), Math.abs(entry.bound));
    }
    return max;
  }, [snap.history]);

  const klCurve = useMemo(() => snap.history.map((entry) => ({ x: entry.iter, y: entry.kl })), [snap.history]);
  const boundCurve = useMemo(
    () => snap.history.map((entry) => ({ x: entry.iter, y: entry.bound })),
    [snap.history],
  );

  const varianceGap = Math.max(0, P_VAR - snap.v1);

  return (
    <LecturePage slug="variational-methods" quiz={<Quiz slug="variational-methods" questions={QUESTIONS} />}>
      <p className="it-body-block">
        Variational inference turns Bayes&rsquo; rule into an optimisation: pick the member of a tractable
        family that is closest to the true posterior. A factorised (mean-field) family is easy to fit but
        cannot represent correlation — and it pays for that with the classic variance underestimate.
      </p>

      <Formula
        tex="Q(z) = \prod_{i} q_i(z_i)"
        note="the mean-field family: every coordinate is independent under the approximation"
        label="Factorised approximate posterior"
      />
      <Formula
        tex="\mathrm{KL}(Q \,\|\, P) = \mathbb{E}_Q[\log Q - \log P] \ge 0"
        note="the objective minimised by coordinate ascent; it equals zero only when Q = P"
        label="Variational objective"
      />

      <Slider
        label="True correlation ρ of P"
        valueLabel={rho.toFixed(2)}
        value={rho}
        min={-0.95}
        max={0.95}
        step={0.01}
        onChange={setRho}
        style={{ maxWidth: 420, marginBottom: 'var(--space-4)' }}
      />

      <SimControls loop={loop} runLabel="Run mean-field" speedRange={[1, 30]} />

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-8)', margin: 'var(--space-5) 0' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 280 }}>
          <MetricRow label="Iteration" value={snap.iter} />
          <MetricRow label="KL(Q‖P)" value={`${snap.kl.toFixed(4)} bits`} valueColor="var(--color-accent-700)" />
          <MetricRow label="Free-energy bound (−KL)" value={`${(-snap.kl).toFixed(4)} bits`} valueColor="var(--color-accent-2-700)" />
          <MetricRow label="Means (m₁, m₂)" value={`(${snap.m1.toFixed(3)}, ${snap.m2.toFixed(3)})`} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 280 }}>
          <MetricRow label="P marginal variance" value={P_VAR.toFixed(4)} valueColor="var(--color-accent-700)" />
          <MetricRow label="Q variance v₁" value={snap.v1.toFixed(4)} valueColor="var(--color-accent-2-700)" />
          <MetricRow label="Q variance v₂" value={snap.v2.toFixed(4)} valueColor="var(--color-accent-2-700)" />
          <MetricRow label="Variance underestimate" value={varianceGap.toFixed(4)} valueColor="var(--color-neutral-700)" />
        </div>
      </div>

      <Plot
        xDomain={[-DOMAIN, DOMAIN]}
        yDomain={[-DOMAIN, DOMAIN]}
        title="True correlated Gaussian P and the fitted factorised Q"
        desc="Shaded density of P with its tilted covariance ellipse; Q is the axis-aligned ellipse, narrower than P because mean-field ignores the correlation."
        height={420}
      >
        <Axis orient="left" label="y" />
        <Axis orient="bottom" label="x" />
        <Heatmap data={heat} />
        <Curve points={pEllipse} color="var(--color-accent-700)" width={2} />
        <Curve points={qEllipse} color="var(--color-accent-2-700)" width={2} dashed />
        <Marker x={0} y={0} color="var(--color-accent-700)" radius={4} />
        <Marker x={snap.m1} y={snap.m2} color="var(--color-accent-2-700)" radius={4} />
      </Plot>
      <Legend
        items={[
          { label: 'P covariance ellipse', color: 'var(--color-accent-700)' },
          { label: 'Q covariance ellipse', color: 'var(--color-accent-2-700)', dashed: true },
        ]}
      />

      <Plot
        xDomain={[0, MAX_ITER]}
        yDomain={[-maxAbs, maxAbs]}
        title="Free energy over coordinate-ascent iterations"
        desc="KL(Q‖P) falls toward its floor while the free-energy bound rises toward log Z = 0; the gap to zero is the residual approximation error."
        height={260}
      >
        <Axis orient="left" label="bits" />
        <Axis orient="bottom" label="iteration" />
        <RuleY y={0} label="log Z = 0" />
        <Curve points={klCurve} color="var(--color-accent-700)" />
        <Curve points={boundCurve} color="var(--color-accent-2-700)" dashed />
      </Plot>
      <Legend
        items={[
          { label: 'KL(Q‖P)', color: 'var(--color-accent-700)' },
          { label: 'Free-energy bound', color: 'var(--color-accent-2-700)', dashed: true },
        ]}
      />

      <h4>Coordinate Ascent</h4>
      <Formula
        tex="m_i = \mu_i - \frac{1}{\Lambda_{ii}}\sum_{j \neq i} \Lambda_{ij}\,(m_j - \mu_j), \qquad v_i = \Lambda_{ii}^{-1}"
        note="with precision Λ = Σ⁻¹, each coordinate has a closed-form optimal update"
        label="Mean-field Gaussian updates"
      />
      <Formula
        tex="m_i = \rho\, m_j, \qquad v_i = 1-\rho^{2}"
        note="for the standard bivariate case, so Q’s variance is 1 − ρ² while P’s marginal variance stays 1"
        label="Bivariate special case"
      />
      <Formula
        tex="\mathrm{ELBO}(Q) = -\mathrm{KL}(Q \,\|\, P) \le \log Z"
        note="the bound tightens from below as coordinate ascent proceeds"
        label="Evidence lower bound"
      />

      <Callout title="The mean-field failure mode" tone="warn">
        <p style={{ margin: 0 }}>
          Minimising KL(Q‖P) is mode-seeking: Q avoids mass where P is nearly zero, so it fits a narrow
          high-density ridge instead of spreading out. For ρ = 0.8 the fitted variance is 1 − ρ² = 0.36,
          less than half of P&rsquo;s true marginal variance of 1. The approximation error (the residual KL)
          does not vanish no matter how long you optimise.
        </p>
      </Callout>
    </LecturePage>
  );
};

export default VariationalMethodsPage;
