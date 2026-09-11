import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Slider from '../Slider';
import MetricRow from '../MetricRow';
import LecturePage from '../shell/LecturePage';
import Formula from '../ui/Formula';
import Quiz, { type QuizQuestion } from '../quiz/Quiz';
import { Axis, Curve, Heatmap, Legend, Marker, Plot, RuleY, usePlot } from '../chart';
import SegmentedControl from '../ui/SegmentedControl';
import SimControls from '../ui/SimControls';
import SeedControl from '../ui/SeedControl';
import { useAnimationLoop } from '../../hooks/useAnimationLoop';
import { mulberry32, gaussian, type Rng } from '../../utils/rng';

const QUESTIONS: QuizQuestion[] = [
  {
    id: 'e-xy',
    kind: 'numeric',
    prompt: 'If X and Y are standard normal with correlation ρ = 0.8, what is E[XY]?',
    answer: 0.8,
    tolerance: 1e-6,
    explanation: 'For standardised variables E[XY] = Cov(X, Y) = ρ.',
  },
  {
    id: 'slice',
    kind: 'choice',
    prompt: 'What makes slice sampling attractive?',
    options: [
      { label: 'It samples exactly from the target in one draw' },
      { label: 'It adapts its step to the local level set, so it needs no proposal scale tuned to the target width', correct: true },
      { label: 'It avoids evaluating the density' },
      { label: 'It always accepts every proposal' },
    ],
    explanation: 'Slice sampling draws uniformly from the region under the density at the current height, so the effective step grows and shrinks with the target.',
  },
  {
    id: 'cftp',
    kind: 'choice',
    prompt: 'Coupling from the past returns a sample that is…',
    options: [
      { label: 'Approximately stationary after a burn-in' },
      { label: 'Exactly distributed according to the target once the coupled chains have coalesced', correct: true },
      { label: 'The most recent state of a single chain' },
      { label: 'Biased toward the starting point' },
    ],
    explanation: 'If monotone chains started at all states at time −T have coalesced by time 0, their shared value is independent of the past and therefore exact.',
  },
  {
    id: 'overrelax',
    kind: 'choice',
    prompt: 'Over-relaxation reduces autocorrelation by…',
    options: [
      { label: 'Rejecting every other proposal' },
      { label: 'Reflecting past the conditional mean so successive states are negatively correlated', correct: true },
      { label: 'Increasing the target variance' },
      { label: 'Averaging two independent chains' },
    ],
    explanation: 'Proposing x′ = μ + α(x − μ) + noise with α near 1 flips the state to the far side of the conditional, which decorrelates the chain faster than Gibbs.',
  },
];

type Method = 'slice' | 'hmc' | 'overrelax' | 'cftp';

const METHOD_OPTIONS: { value: Method; label: string }[] = [
  { value: 'slice', label: 'Slice' },
  { value: 'hmc', label: 'HMC' },
  { value: 'overrelax', label: 'Over-relax' },
  { value: 'cftp', label: 'Exact (CFTP)' },
];

const DOMAIN = 3.4;
const GRID = 46;
const MAX_SAMPLES = 300;
const CFTP_MAX_SWEEPS = 1024;
const CFTP_BOUND = 8;
const CFTP_EPS = 1e-3;

interface SamplePoint {
  x: number;
  y: number;
}

interface Snapshot {
  samples: SamplePoint[];
  trajectory: SamplePoint[];
  current: SamplePoint;
  count: number;
  estimate: number;
  error: number;
  acceptRate: number;
  sweeps: number;
  errors: number[];
}

interface SimState {
  current: SamplePoint;
  samples: SamplePoint[];
  trajectory: SamplePoint[];
  sumXY: number;
  count: number;
  accepted: number;
  tried: number;
  sweeps: number;
  errors: number[];
}

const START: SamplePoint = { x: -2.6, y: 2.6 };

const initialSnapshot = (): Snapshot => ({
  samples: [],
  trajectory: [],
  current: { ...START },
  count: 0,
  estimate: 0,
  error: 0,
  acceptRate: 0,
  sweeps: 0,
  errors: [],
});

const createSimState = (): SimState => ({
  current: { ...START },
  samples: [],
  trajectory: [],
  sumXY: 0,
  count: 0,
  accepted: 0,
  tried: 0,
  sweeps: 0,
  errors: [],
});

const oneMinusRhoSq = (rho: number): number => Math.max(1e-9, 1 - rho * rho);

const targetPDF = (x: number, y: number, rho: number): number => {
  const det = oneMinusRhoSq(rho);
  const q = (x * x - 2 * rho * x * y + y * y) / (2 * det);
  return Math.exp(-q) / (2 * Math.PI * Math.sqrt(det));
};

const logConditional = (value: number, other: number, rho: number): number => {
  const det = oneMinusRhoSq(rho);
  const mean = rho * other;
  return -((value - mean) * (value - mean)) / (2 * det);
};

const sliceSample = (rng: Rng, logf: (value: number) => number, x0: number, w: number): number => {
  const logY = logf(x0) + Math.log(Math.max(1e-12, rng()));
  let left = x0 - rng() * w;
  let right = left + w;
  let steps = 0;
  while (steps < 60 && logf(left) > logY) {
    left -= w;
    steps += 1;
  }
  while (steps < 120 && logf(right) > logY) {
    right += w;
    steps += 1;
  }
  for (let i = 0; i < 200; i += 1) {
    const candidate = left + rng() * (right - left);
    if (logY < logf(candidate)) return candidate;
    if (candidate < x0) left = candidate;
    else right = candidate;
  }
  return x0;
};

const potential = (x: number, y: number, rho: number): number =>
  (x * x - 2 * rho * x * y + y * y) / (2 * oneMinusRhoSq(rho));

const gradient = (x: number, y: number, rho: number): [number, number] => {
  const inv = 1 / oneMinusRhoSq(rho);
  return [(x - rho * y) * inv, (y - rho * x) * inv];
};

const cftp = (rng: Rng, rho: number): { x: number; y: number; sweeps: number } => {
  const s = Math.sqrt(oneMinusRhoSq(rho));
  let total = 0;
  for (let horizon = 1; horizon <= CFTP_MAX_SWEEPS; horizon *= 2) {
    const zx: number[] = [];
    const zy: number[] = [];
    for (let t = 0; t < horizon; t += 1) {
      zx.push(gaussian(rng));
      zy.push(gaussian(rng));
    }
    let loX = -CFTP_BOUND;
    let loY = -CFTP_BOUND;
    let hiX = CFTP_BOUND;
    let hiY = CFTP_BOUND;
    for (let t = 0; t < horizon; t += 1) {
      loX = rho * loY + s * zx[t];
      hiX = rho * hiY + s * zx[t];
      loY = rho * loX + s * zy[t];
      hiY = rho * hiX + s * zy[t];
    }
    total = horizon;
    if (Math.abs(loX - hiX) < CFTP_EPS && Math.abs(loY - hiY) < CFTP_EPS) {
      return { x: (loX + hiX) / 2, y: (loY + hiY) / 2, sweeps: total };
    }
  }
  const x = gaussian(rng);
  return { x, y: rho * x + s * gaussian(rng), sweeps: total };
};

const Scatter: React.FC<{ points: SamplePoint[]; color: string; radius?: number; opacity?: number }> = ({
  points,
  color,
  radius = 1.9,
  opacity = 0.5,
}) => {
  const plot = usePlot();
  return (
    <g>
      {points.map((point, index) => {
        const px = plot.x(point.x);
        const py = plot.y(point.y);
        if (!Number.isFinite(px) || !Number.isFinite(py)) return null;
        return <circle key={index} cx={px} cy={py} r={radius} fill={color} opacity={opacity} />;
      })}
    </g>
  );
};

const AdvancedMonteCarloPage: React.FC = () => {
  const [rho, setRho] = useState<number>(0.8);
  const [method, setMethod] = useState<Method>('slice');
  const [seed, setSeed] = useState<number>(12345);
  const [snap, setSnap] = useState<Snapshot>(initialSnapshot);

  const stateRef = useRef<SimState>(createSimState());
  const rngRef = useRef<Rng>(mulberry32(seed));

  const resetSim = useCallback(() => {
    rngRef.current = mulberry32(seed);
    stateRef.current = createSimState();
    setSnap(initialSnapshot());
  }, [seed]);

  useEffect(() => {
    resetSim();
  }, [resetSim, method, rho]);

  const tick = (_dt: number): void => {
    const st = stateRef.current;
    const rng = rngRef.current;
    let sample: SamplePoint = { ...st.current };
    let trajectory: SamplePoint[] = [];
    let accepted = true;

    if (method === 'slice') {
      const w = 0.8;
      const y0 = st.current.y;
      const x1 = sliceSample(rng, (value) => logConditional(value, y0, rho), st.current.x, w);
      const y1 = sliceSample(rng, (value) => logConditional(value, x1, rho), y0, w);
      sample = { x: x1, y: y1 };
      st.current = sample;
    } else if (method === 'hmc') {
      const eps = 0.12;
      const L = 15;
      let x = st.current.x;
      let y = st.current.y;
      let px = gaussian(rng);
      let py = gaussian(rng);
      const g0 = gradient(x, y, rho);
      const h0 = potential(x, y, rho) + 0.5 * (px * px + py * py);
      px -= 0.5 * eps * g0[0];
      py -= 0.5 * eps * g0[1];
      trajectory.push({ x, y });
      for (let l = 0; l < L; l += 1) {
        x += eps * px;
        y += eps * py;
        trajectory.push({ x, y });
        if (l < L - 1) {
          const g = gradient(x, y, rho);
          px -= eps * g[0];
          py -= eps * g[1];
        }
      }
      const gEnd = gradient(x, y, rho);
      px -= 0.5 * eps * gEnd[0];
      py -= 0.5 * eps * gEnd[1];
      const h1 = potential(x, y, rho) + 0.5 * (px * px + py * py);
      const logAccept = h0 - h1;
      accepted = logAccept >= 0 || rng() < Math.exp(logAccept);
      st.tried += 1;
      if (accepted) {
        st.accepted += 1;
        st.current = { x, y };
        sample = { x, y };
      } else {
        sample = { ...st.current };
      }
    } else if (method === 'overrelax') {
      const alpha = 0.985;
      const s = Math.sqrt(oneMinusRhoSq(rho));
      const scale = Math.sqrt(1 - alpha * alpha) * s;
      let x = st.current.x;
      let y = st.current.y;
      const meanX = rho * y;
      x = meanX + alpha * (x - meanX) + scale * gaussian(rng);
      const meanY = rho * x;
      y = meanY + alpha * (y - meanY) + scale * gaussian(rng);
      sample = { x, y };
      st.current = sample;
    } else {
      const result = cftp(rng, rho);
      sample = { x: result.x, y: result.y };
      st.current = sample;
      st.sweeps = result.sweeps;
    }

    st.sumXY += sample.x * sample.y;
    st.count += 1;
    st.samples.push(sample);
    if (st.samples.length > MAX_SAMPLES) st.samples.shift();
    st.trajectory = trajectory;
    const estimate = st.sumXY / Math.max(1, st.count);
    const error = Math.abs(estimate - rho);
    st.errors.push(error);
    if (st.errors.length > MAX_SAMPLES) st.errors.shift();

    setSnap({
      samples: st.samples.slice(),
      trajectory: trajectory.slice(),
      current: sample,
      count: st.count,
      estimate,
      error,
      acceptRate: st.tried > 0 ? st.accepted / st.tried : 0,
      sweeps: st.sweeps,
      errors: st.errors.slice(),
    });
  };

  const loop = useAnimationLoop({ tick, onReset: resetSim, initialSpeed: 8 });

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

  const traceX = useMemo(
    () => snap.samples.map((point, index) => ({ x: index, y: point.x })),
    [snap.samples],
  );

  const traceY = useMemo(
    () => snap.samples.map((point, index) => ({ x: index, y: point.y })),
    [snap.samples],
  );

  const maxError = useMemo(() => {
    let max = 1e-3;
    for (const value of snap.errors) {
      if (Number.isFinite(value)) max = Math.max(max, value);
    }
    return max;
  }, [snap.errors]);

  const errorCurve = useMemo(
    () => snap.errors.map((value, index) => ({ x: index, y: value })),
    [snap.errors],
  );

  const trajectoryAccepted =
    snap.trajectory.length > 1 &&
    snap.trajectory[snap.trajectory.length - 1].x === snap.current.x &&
    snap.trajectory[snap.trajectory.length - 1].y === snap.current.y;

  const methodNote =
    method === 'hmc'
      ? 'Leapfrog paths use 15 steps of size 0.12; a dashed path marks a rejected proposal.'
      : method === 'cftp'
        ? 'Each draw runs monotone coupled chains from the past until they coalesce.'
        : method === 'overrelax'
          ? 'Each sweep over-relaxes one coordinate conditionally, with α = 0.985.'
          : 'Each sweep slices the conditional density of x given y, then y given x.';

  return (
    <LecturePage slug="advanced-monte-carlo" quiz={<Quiz slug="advanced-monte-carlo" questions={QUESTIONS} />}>
      <p className="it-body-block">
        One correlated target, four ways to sample it. Compare a slice sampler, Hamiltonian Monte Carlo
        with leapfrog trajectories, over-relaxation, and exact coupling from the past on the same
        bivariate normal density.
      </p>

      <Formula
        tex="p(x,y) \propto \exp\!\left(-\frac{x^{2} - 2\rho xy + y^{2}}{2(1-\rho^{2})}\right)"
        note="the correlated standard-normal target; here E[X]=E[Y]=0 and E[XY]=ρ"
        label="Target density"
      />

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-6)', marginBottom: 'var(--space-4)' }}>
        <Slider
          label="Correlation ρ"
          valueLabel={rho.toFixed(2)}
          value={rho}
          min={-0.95}
          max={0.95}
          step={0.01}
          onChange={setRho}
          style={{ maxWidth: 320, flex: 1 }}
        />
        <div style={{ minWidth: 220 }}>
          <div className="it-controls-label" style={{ marginBottom: 5 }}>Method</div>
          <SegmentedControl
            name="mc-method"
            value={method}
            onChange={(value: Method) => setMethod(value)}
            options={METHOD_OPTIONS}
          />
        </div>
      </div>

      <p className="text-muted" style={{ marginTop: 0, marginBottom: 'var(--space-4)' }}>{methodNote}</p>

      <SimControls loop={loop} runLabel="Run" speedRange={[1, 60]} />
      <SeedControl seed={seed} onNewSeed={setSeed} />

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-8)', margin: 'var(--space-5) 0' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 260 }}>
          <MetricRow label="Samples drawn" value={snap.count} />
          <MetricRow
            label="Running E[XY]"
            value={snap.count > 0 ? snap.estimate.toFixed(4) : '—'}
            valueColor="var(--color-accent-2-700)"
          />
          <MetricRow label="True E[XY] = ρ" value={rho.toFixed(4)} />
          <MetricRow
            label="Absolute error"
            value={snap.count > 0 ? snap.error.toFixed(4) : '—'}
            valueColor="var(--color-accent-700)"
          />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 260 }}>
          <MetricRow label="Current x" value={snap.current.x.toFixed(3)} />
          <MetricRow label="Current y" value={snap.current.y.toFixed(3)} />
          {method === 'hmc' ? (
            <MetricRow label="HMC acceptance rate" value={`${(snap.acceptRate * 100).toFixed(1)}%`} />
          ) : null}
          {method === 'cftp' ? <MetricRow label="CFTP sweeps" value={snap.sweeps} /> : null}
        </div>
      </div>

      <Plot
        xDomain={[-DOMAIN, DOMAIN]}
        yDomain={[-DOMAIN, DOMAIN]}
        title="Target density with samples overlaid"
        desc="Shaded correlated Gaussian density with the most recent Markov chain states plotted as dots; Hamiltonian paths are drawn as lines."
        height={420}
      >
        <Axis orient="left" label="y" />
        <Axis orient="bottom" label="x" />
        <Heatmap data={heat} />
        {snap.trajectory.length > 1 ? (
          <Curve
            points={snap.trajectory}
            color="var(--color-accent-2-700)"
            dashed={!trajectoryAccepted}
            width={2}
          />
        ) : null}
        <Scatter points={snap.samples} color="var(--color-neutral-700)" />
        <Marker x={snap.current.x} y={snap.current.y} color="var(--color-accent-700)" radius={4} />
      </Plot>
      <Legend
        items={[
          { label: 'Target density', color: 'var(--color-accent-700)' },
          { label: 'Chain samples', color: 'var(--color-neutral-700)' },
          { label: 'Current state', color: 'var(--color-accent-700)' },
          ...(method === 'hmc' ? [{ label: 'Leapfrog path', color: 'var(--color-accent-2-700)' }] : []),
        ]}
      />

      <Plot
        xDomain={[0, MAX_SAMPLES]}
        yDomain={[-DOMAIN, DOMAIN]}
        title="Chain trace of the two coordinates"
        desc="The sampled x and y coordinates plotted against draw index; a well-mixing chain fills the band evenly."
        height={240}
      >
        <Axis orient="left" label="value" />
        <Axis orient="bottom" label="draw" />
        <RuleY y={0} />
        <Curve points={traceX} color="var(--color-accent-700)" />
        <Curve points={traceY} color="var(--color-accent-2-700)" dashed />
      </Plot>
      <Legend
        items={[
          { label: 'x', color: 'var(--color-accent-700)' },
          { label: 'y', color: 'var(--color-accent-2-700)', dashed: true },
        ]}
      />

      <Plot
        xDomain={[0, MAX_SAMPLES]}
        yDomain={[0, maxError]}
        title="Running estimate error"
        desc="Absolute error of the running estimate of E[XY] against the true value ρ, falling as more draws accumulate."
        height={220}
      >
        <Axis orient="left" label="|error|" />
        <Axis orient="bottom" label="draw" />
        <Curve points={errorCurve} color="var(--color-accent-700)" />
      </Plot>

      <h4>What Each Method Is Doing</h4>
      <Formula
        tex="x' = \mu + \alpha\,(x-\mu) + \sqrt{1-\alpha^{2}}\,\sigma z"
        note="over-relaxation reflects past the conditional mean for α near 1"
        label="Over-relaxed update"
      />
      <Formula
        tex="\min\!\left(1,\; e^{-\Delta H}\right),\qquad H(q,p)=U(q)+\tfrac{1}{2}p^{\top}p"
        note="Hamiltonian Monte Carlo: leapfrog the dynamics, then accept by the energy change"
        label="HMC acceptance"
      />
      <Formula
        tex="\Pr(X_{-T}\in A)\ \xrightarrow[T\to\infty]{}\ \pi(A)"
        note="coupling from the past: run monotone chains backwards until they coalesce, then read the shared value"
        label="Exact sampling"
      />
    </LecturePage>
  );
};

export default AdvancedMonteCarloPage;
