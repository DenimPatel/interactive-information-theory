import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Slider from '../Slider';
import MetricRow from '../MetricRow';
import LecturePage from '../shell/LecturePage';
import Formula from '../ui/Formula';
import Quiz, { type QuizQuestion } from '../quiz/Quiz';
import { Axis, BarSeries, Curve, Legend, Plot } from '../chart';
import SeedControl from '../ui/SeedControl';
import SimControls from '../ui/SimControls';
import { useAnimationLoop } from '../../hooks/useAnimationLoop';
import { mulberry32, gaussian } from '../../utils/rng';
import { normalPDF } from '../../utils/informationTheory';
import { FORMULAS } from '../../content/formulas';

const F = FORMULAS['sampling-methods'];

const MH_MIN = -7;
const MH_MAX = 7;
const MH_BINS = 28;
const MH_CAP = 4000;
const targetPdf = (x: number): number =>
  0.5 * normalPDF(x, -2, 1) + 0.5 * normalPDF(x, 2, 1);

const QUESTIONS: QuizQuestion[] = [
  {
    id: 'entropy-bits',
    kind: 'numeric',
    prompt: 'What is the entropy of the distribution (P(A), P(B)) = (0.99, 0.01), in bits? (3 decimal places.)',
    answer: 0.081,
    tolerance: 0.005,
    unit: 'bits',
    explanation: 'H = −0.99 log₂0.99 − 0.01 log₂0.01 ≈ 0.081 bits — the target for inversion sampling.',
  },
  {
    id: 'resolve',
    kind: 'choice',
    prompt: 'When does the interval method decide the outcome?',
    options: [
      { label: 'After a fixed number of bits' },
      { label: 'As soon as the interval lies entirely inside one region', correct: true },
      { label: 'When the interval midpoint crosses 0.5' },
      { label: 'Only after the interval width reaches zero' },
    ],
    explanation: 'Once [L, H) no longer straddles the boundary, every point in it shares one outcome.',
  },
  {
    id: 'optimality',
    kind: 'choice',
    prompt: 'The expected number of bits used by inversion sampling approaches…',
    options: [
      { label: '1 bit, always' },
      { label: 'The entropy H(P)', correct: true },
      { label: 'The number of outcomes' },
      { label: 'Zero' },
    ],
    explanation: 'Inversion sampling is optimal: its expected cost tends to the source entropy.',
  },
];

const SamplingMethodsPage: React.FC = () => {
  const [probA, setProbAState] = useState<number>(0.99);
  const [bits, setBits] = useState<string>('');
  const [lower, setLower] = useState<number>(0);
  const [upper, setUpper] = useState<number>(1);
  const [outcome, setOutcome] = useState<'A' | 'B' | null>(null);
  const [active, setActive] = useState<boolean>(true);
  const [log, setLog] = useState<string[]>(['Initial interval: [0.000000, 1.000000)']);

  const probB = 1 - probA;

  const [seed, setSeed] = useState<number>(12345);
  const [mhSigma, setMhSigma] = useState<number>(0.6);
  const [mhSamples, setMhSamples] = useState<number[]>([]);
  const mhRef = useRef({ x: 0, rng: mulberry32(12345), accepted: 0, proposals: 0 });

  useEffect(() => {
    mhRef.current = { x: 0, rng: mulberry32(seed), accepted: 0, proposals: 0 };
    setMhSamples([]);
  }, [seed]);

  const mhStep = useCallback(() => {
    const chain = mhRef.current;
    const proposal = chain.x + mhSigma * gaussian(chain.rng);
    const ratio = targetPdf(proposal) / targetPdf(chain.x);
    chain.proposals += 1;
    if (chain.rng() < Math.min(1, ratio)) {
      chain.x = proposal;
      chain.accepted += 1;
    }
    setMhSamples((prev) => {
      const next = prev.length >= MH_CAP ? prev.slice(prev.length - (MH_CAP - 1)) : prev.slice();
      next.push(chain.x);
      return next;
    });
  }, [mhSigma]);

  const mhLoop = useAnimationLoop({ tick: mhStep, initialSpeed: 20 });

  const histogram = useMemo(() => {
    const counts = new Array<number>(MH_BINS).fill(0);
    const width = (MH_MAX - MH_MIN) / MH_BINS;
    mhSamples.forEach((x) => {
      if (x < MH_MIN || x >= MH_MAX) return;
      const index = Math.min(MH_BINS - 1, Math.floor((x - MH_MIN) / width));
      counts[index] += 1;
    });
    const bars = counts.map((count, i) => ({ x: MH_MIN + i * width, y: count, width: width * 0.92 }));
    const curve = [];
    for (let i = 0; i <= 140; i++) {
      const x = MH_MIN + ((MH_MAX - MH_MIN) * i) / 140;
      curve.push({ x, y: mhSamples.length * targetPdf(x) * width });
    }
    const maxY = Math.max(1, ...counts, ...curve.map((point) => point.y));
    return { bars, curve, maxY };
  }, [mhSamples]);

  const acceptance = mhRef.current.proposals > 0 ? mhRef.current.accepted / mhRef.current.proposals : 0;
  const runningMean = mhSamples.length > 0 ? mhSamples.reduce((sum, x) => sum + x, 0) / mhSamples.length : 0;

  const resetSampling = useCallback((newProbA?: number) => {
    const p = newProbA ?? probA;
    setBits('');
    setLower(0);
    setUpper(1);
    setOutcome(null);
    setActive(true);
    setLog([`P(A) = ${p.toFixed(3)}. Initial interval: [0.000000, 1.000000)`]);
  }, [probA]);

  const setProbA = (value: number) => {
    setProbAState(value);
    resetSampling(value);
  };

  const drawBit = (bit: '0' | '1') => {
    if (!active) return;
    const mid = lower + (upper - lower) / 2;
    const nl = bit === '0' ? lower : mid;
    const nu = bit === '0' ? mid : upper;

    let newOutcome: 'A' | 'B' | null = null;
    let stillActive = true;
    let note = '';
    if (nu <= probA) {
      newOutcome = 'A'; stillActive = false;
      note = ` Fully within [0, ${probA.toFixed(3)}). Outcome: A.`;
    } else if (nl >= probA) {
      newOutcome = 'B'; stillActive = false;
      note = ` Fully within [${probA.toFixed(3)}, 1). Outcome: B.`;
    } else {
      note = ' Still undetermined.';
    }

    setBits((prev) => prev + bit);
    setLower(nl);
    setUpper(nu);
    setOutcome(newOutcome);
    setActive(stillActive);
    setLog((prev) => [...prev, `Bit '${bit}' drawn. New interval: [${nl.toFixed(6)}, ${nu.toFixed(6)}).${note}`]);
  };

  return (
    <LecturePage slug="sampling-methods" quiz={<Quiz slug="sampling-methods" questions={QUESTIONS} />}>
      <p className="it-body-block">
        Generating outcome A or B with skewed probabilities using the fewest random bits on average.
      </p>
      <Formula tex={F.inversion} note="the inverse-CDF (inversion) method" label="Inversion sampling maps a uniform draw through the inverse CDF" />

      <table className="table" style={{ margin: 'var(--space-4) 0 var(--space-6) 0' }}>
        <thead><tr><th>Method</th><th>Expected Bits (P(A)=0.99)</th><th>Notes</th></tr></thead>
        <tbody>
          <tr><td><b>Inversion Sampling</b></td><td>~0.08 bits</td><td className="text-muted">Approaches the entropy limit — optimal.</td></tr>
          <tr><td><b>Huffman Coding</b></td><td>~1.01 bits</td><td className="text-muted">Not ideal for single-event, highly skewed generation.</td></tr>
          <tr><td><b>Fixed-Length Bits</b></td><td>≥7 bits</td><td className="text-muted">Wasteful; may need rejection sampling.</td></tr>
        </tbody>
      </table>

      <h4>Interactive Inversion Sampling</h4>
      <Formula tex={F.estimator} note="the Monte Carlo estimator this machinery serves" label="Monte Carlo estimator of a mean" />

      <Slider
        label="P(A)"
        valueLabel={<>{probA.toFixed(3)} &nbsp; P(B) = <b style={{ color: 'var(--color-accent-2-700)' }}>{probB.toFixed(3)}</b></>}
        value={probA} min={0.001} max={0.999} step={0.001} onChange={setProbA}
        style={{ maxWidth: 480, marginBottom: 'var(--space-4)' }}
      />

      <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-5)' }}>
        <button className="btn btn-primary" onClick={() => drawBit('0')} disabled={!active}>Draw 0</button>
        <button className="btn btn-secondary" onClick={() => drawBit('1')} disabled={!active}>Draw 1</button>
        <button className="btn btn-ghost" onClick={() => resetSampling()}>Reset</button>
      </div>

      <div className="text-muted" style={{ fontSize: 11, marginBottom: 4 }}>Target Regions</div>
      <div style={{ position: 'relative', height: 20, background: 'var(--color-surface)', borderRadius: 'var(--radius-sm)', overflow: 'hidden', marginBottom: 'var(--space-4)', maxWidth: 640 }}>
        <div style={{ position: 'absolute', top: 0, left: 0, height: '100%', background: 'var(--color-accent-200)', width: `${probA * 100}%` }} />
        <div style={{ position: 'absolute', top: 0, height: '100%', background: 'var(--color-accent-2-200)', left: `${probA * 100}%`, width: `${probB * 100}%` }} />
      </div>
      <div className="text-muted" style={{ fontSize: 11, marginBottom: 4 }}>Current Interval [L, H)</div>
      <div style={{ position: 'relative', height: 20, background: 'var(--color-surface)', borderRadius: 'var(--radius-sm)', overflow: 'hidden', marginBottom: 'var(--space-5)', maxWidth: 640 }}>
        <div style={{ position: 'absolute', top: 0, height: '100%', background: 'var(--color-accent-700)', left: `${lower * 100}%`, width: `${Math.max(0.002, upper - lower) * 100}%` }} />
      </div>

      <p>Bits drawn: <b style={{ color: 'var(--color-accent-700)' }}>{bits || '(none)'}</b> ({bits.length}) &nbsp; Interval: <b>[{lower.toFixed(6)}, {upper.toFixed(6)})</b></p>
      {outcome ? (
        <p style={{ fontSize: 18 }}>
          Outcome: <b style={{ color: outcome === 'A' ? 'var(--color-accent-700)' : 'var(--color-accent-2-700)' }}>{outcome}</b>
        </p>
      ) : null}
      <div style={{ background: 'var(--color-surface)', borderRadius: 'var(--radius-md)', padding: 'var(--space-3)', maxHeight: 140, overflowY: 'auto', fontSize: 12, maxWidth: 640, marginBottom: 'var(--space-6)' }}>
        {log.map((entry, index) => (
          <div key={index} className="text-muted" style={{ marginBottom: 4 }}>{entry}</div>
        ))}
      </div>

      <h4>Metropolis–Hastings</h4>
      <p className="it-body-block">
        Inversion needs the inverse CDF, which most targets do not have. The Metropolis–Hastings
        algorithm instead proposes a nearby point and accepts it with probability min(1, P(x′)/P(x)),
        so the chain spends time in each region in proportion to its target probability — no
        normalising constant required.
      </p>
      <Formula tex="a(x' \mid x) = \min\!\left(1, \frac{P(x')}{P(x)}\right)" note="the Metropolis acceptance probability" label="Metropolis acceptance probability" />

      <Slider
        label="Proposal step σ" valueLabel={mhSigma.toFixed(2)}
        value={mhSigma} min={0.05} max={3} step={0.05} onChange={setMhSigma}
        style={{ maxWidth: 420, marginBottom: 'var(--space-3)' }}
      />
      <SeedControl seed={seed} onNewSeed={setSeed} />
      <SimControls loop={mhLoop} runLabel="Run chain" onReset={() => { mhRef.current = { x: 0, rng: mulberry32(seed), accepted: 0, proposals: 0 }; setMhSamples([]); }} speedRange={[1, 200]} />

      <div style={{ display: 'flex', gap: 'var(--space-6)', flexWrap: 'wrap', marginBottom: 'var(--space-3)' }}>
        <MetricRow label="Samples" value={mhSamples.length} valueColor="var(--color-accent-700)" width={190} />
        <MetricRow label="Acceptance rate" value={`${(acceptance * 100).toFixed(1)}%`} valueColor="var(--color-accent-700)" width={190} />
        <MetricRow label="Running E[X]" value={runningMean.toFixed(3)} valueColor="var(--color-accent-2-700)" width={190} />
      </div>

      <Plot
        xDomain={[MH_MIN, MH_MAX]}
        yDomain={[0, histogram.maxY * 1.1]}
        title="Metropolis–Hastings samples against a bimodal target"
        desc="A histogram of the chain’s samples overlaid with the target density; with a suitable step size the two agree."
        height={280}
      >
        <Axis orient="left" label="count / density" />
        <Axis orient="bottom" label="x" />
        <BarSeries bars={histogram.bars} color="var(--color-accent-700)" opacity={0.5} />
        <Curve points={histogram.curve} color="var(--color-accent-2-700)" />
      </Plot>
      <Legend
        items={[
          { label: 'MH samples', color: 'var(--color-accent-700)' },
          { label: 'target density', color: 'var(--color-accent-2-700)' },
        ]}
      />
      <p className="text-muted" style={{ fontSize: 13, maxWidth: 640 }}>
        Too small a step and the chain crawls; too large a step and it is rejected too often. Both
        show up in the acceptance rate, which is a useful tuning signal.
      </p>

      <h4>Why Inversion Sampling Wins</h4>
      <p className="it-body-block">
        Starting from [0,1), each random bit halves the interval. As soon as it falls entirely inside
        [0, P(A)) or [P(A), 1), the outcome is decided. For skewed probabilities most trials resolve in
        very few bits, so the expected bit count approaches the true entropy of the distribution —
        unlike fixed-length sampling or naive Huffman-style codes, which can&rsquo;t capture very rare or
        very common outcomes efficiently.
      </p>
    </LecturePage>
  );
};

export default SamplingMethodsPage;
