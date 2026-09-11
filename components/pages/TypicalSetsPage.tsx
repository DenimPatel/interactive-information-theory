import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import LecturePage from '../shell/LecturePage';
import Formula from '../ui/Formula';
import Quiz, { type QuizQuestion } from '../quiz/Quiz';
import Slider from '../Slider';
import MetricRow from '../MetricRow';
import SeedControl from '../ui/SeedControl';
import SimControls from '../ui/SimControls';
import { Axis, BarSeries, Curve, Legend, Marker, Plot, RuleY, seriesColor } from '../chart';
import { calculateEntropy } from '../../utils/informationTheory';
import { mulberry32, type Rng } from '../../utils/rng';
import { useAnimationLoop } from '../../hooks/useAnimationLoop';

const N_MAX = 20;
const BINS = 32;
const MAX_SAMPLES = 4000;
const CHUNK = 40;

const log2 = (x: number): number => Math.log(x) / Math.LN2;

// Smallest number of sequence outcomes (as a set of binomial shells) whose total
// probability reaches 1 - delta, returned in bits.
const essentialBits = (N: number, p: number, delta: number): number => {
  const q = 1 - p;
  const groups: { prob: number; count: number }[] = [];
  let coefficient = 1;
  for (let heads = 0; heads <= N; heads++) {
    if (heads > 0) coefficient = (coefficient * (N - heads + 1)) / heads;
    groups.push({ prob: coefficient * p ** heads * q ** (N - heads), count: coefficient });
  }
  groups.sort((a, b) => b.prob - a.prob);
  const target = Math.max(0, 1 - delta);
  let accumulated = 0;
  let count = 0;
  for (const group of groups) {
    if (accumulated >= target - 1e-9) break;
    accumulated += group.prob;
    count += group.count;
  }
  return count > 0 ? Math.log2(count) : 0;
};

const QUESTIONS: QuizQuestion[] = [
  {
    id: 'aep-claim',
    kind: 'choice',
    prompt: 'The asymptotic equipartition property says that for large N the typical set…',
    options: [
      { label: 'Contains most of the sequences but little of the probability' },
      { label: 'Contains a vanishing fraction of the sequences but almost all the probability', correct: true },
      { label: 'Is exactly the whole space of 2^N sequences' },
      { label: 'Always contains exactly 2^{N H(p)} sequences' },
    ],
    explanation:
      'Typical sequences number about 2^{N H(p)}, a vanishing fraction of 2^N, yet their total probability tends to 1.',
  },
  {
    id: 'fair-entropy',
    kind: 'numeric',
    prompt: 'For a fair bent coin with p = 0.5, what is H(p) in bits?',
    answer: 1,
    tolerance: 1e-6,
    unit: 'bits',
    explanation: 'A fair coin carries one full bit of uncertainty, so its typical set exponent is N.',
  },
  {
    id: 'normalized-info',
    kind: 'choice',
    prompt: 'For a typical long block x^N, how does -(1/N) log2 P(x^N) behave?',
    options: [
      { label: 'It grows without bound' },
      { label: 'It converges to H(p)', correct: true },
      { label: 'It converges to 0' },
      { label: 'It oscillates between 0 and N' },
    ],
    explanation:
      'Typical sequences all have roughly the same probability, 2^{-N H(p)}, which is exactly the AEP.',
  },
  {
    id: 'essential-delta',
    kind: 'choice',
    prompt: 'As delta → 1, the essential bit content H_delta(X) for a block of length N approaches…',
    options: [
      { label: 'N, the full space exponent' },
      { label: 'N H(p)', correct: true },
      { label: '0' },
      { label: 'H(p) / N' },
    ],
    explanation:
      'Allowing almost all the probability to be missed only requires the high-probability typical shell, whose exponent is N H(p).',
  },
];

const TypicalSetsPage: React.FC = () => {
  const [N, setN] = useState<number>(12);
  const [p, setP] = useState<number>(0.3);
  const [delta, setDelta] = useState<number>(0.1);
  const [seed, setSeed] = useState<number>(20240911);
  const [samples, setSamples] = useState<number[]>([]);

  const rngRef = useRef<Rng>(mulberry32(seed));
  const samplesRef = useRef<number[]>([]);

  const entropy = calculateEntropy(p);
  const q = 1 - p;
  const log2p = log2(p);
  const log2q = log2(q);

  const resetSamples = useCallback(() => {
    rngRef.current = mulberry32(seed);
    samplesRef.current = [];
    setSamples([]);
  }, [seed]);

  useEffect(() => {
    resetSamples();
  }, [resetSamples, N, p]);

  const tick = useCallback(() => {
    const collected = samplesRef.current;
    if (collected.length >= MAX_SAMPLES) return;
    const rng = rngRef.current;
    for (let i = 0; i < CHUNK && collected.length < MAX_SAMPLES; i++) {
      let heads = 0;
      for (let k = 0; k < N; k++) {
        if (rng() < p) heads += 1;
      }
      collected.push(-(heads * log2p + (N - heads) * log2q) / N);
    }
    setSamples(collected.slice());
  }, [N, p, log2p, log2q]);

  const loop = useAnimationLoop({ tick, onReset: resetSamples, initialSpeed: 8 });

  const histogram = useMemo(() => {
    const maxInfo = Math.max(-log2p, -log2q);
    const binWidth = maxInfo > 0 ? maxInfo / BINS : 1;
    const counts = new Array<number>(BINS).fill(0);
    for (const value of samples) {
      const index = Math.min(BINS - 1, Math.max(0, Math.floor(value / binWidth)));
      counts[index] += 1;
    }
    const total = samples.length;
    const bars = counts.map((count, index) => ({
      x: index * binWidth,
      y: total > 0 ? count / total : 0,
      width: binWidth * 0.92,
    }));
    let maxFraction = 0;
    for (const bar of bars) maxFraction = Math.max(maxFraction, bar.y);
    const mean = total > 0 ? samples.reduce((sum, value) => sum + value, 0) / total : 0;
    return { bars, maxInfo, maxFraction, mean, total };
  }, [samples, log2p, log2q]);

  const sizeCurves = useMemo(() => {
    const full: { x: number; y: number }[] = [];
    const typical: { x: number; y: number }[] = [];
    for (let n = 1; n <= N_MAX; n++) {
      full.push({ x: n, y: n });
      typical.push({ x: n, y: n * entropy });
    }
    return { full, typical };
  }, [entropy]);

  const essentialCurve = useMemo(() => {
    const points: { x: number; y: number }[] = [];
    for (let i = 0; i <= 50; i++) {
      const d = i / 50;
      points.push({ x: d, y: essentialBits(N, p, d) });
    }
    return points;
  }, [N, p]);

  const essentialNow = essentialBits(N, p, delta);
  const typicalExponent = N * entropy;
  const meanLabel = histogram.total > 0 ? histogram.mean.toFixed(3) : '—';

  return (
    <LecturePage slug="typical-sets" quiz={<Quiz slug="typical-sets" questions={QUESTIONS} />}>
      <p className="it-body-block">
        For N independent bent-coin bits there are 2^N possible blocks, but as N grows almost all the
        probability concentrates on a tiny typical set of about 2^(N·H(p)) blocks — the asymptotic
        equipartition property.
      </p>
      <Formula
        tex="\left|A_{\epsilon}^{(N)}\right| \doteq 2^{N H(p)}"
        note="the typical set is exponentially smaller than the full space"
        label="Size of the typical set"
      />
      <Formula
        tex="-\frac{1}{N}\log_2 P(x^N) \to H(p)"
        note="every typical sequence has roughly the same probability"
        label="The asymptotic equipartition property"
      />

      <div style={{ display: 'flex', gap: 'var(--space-6)', flexWrap: 'wrap', marginBottom: 'var(--space-4)' }}>
        <Slider
          label="Block length (N)"
          valueLabel={N}
          value={N}
          min={1}
          max={N_MAX}
          step={1}
          onChange={setN}
          style={{ maxWidth: 300, flex: 1 }}
        />
        <Slider
          label="P(heads) = p"
          valueLabel={p.toFixed(2)}
          valueColor="var(--color-accent-2-700)"
          accentColor="var(--color-accent-2)"
          value={p}
          min={0.01}
          max={0.99}
          step={0.01}
          onChange={setP}
          style={{ maxWidth: 300, flex: 1 }}
        />
        <Slider
          label="Failure allowance (delta)"
          valueLabel={delta.toFixed(2)}
          valueColor="var(--color-neutral-700)"
          accentColor="var(--color-neutral-600)"
          value={delta}
          min={0}
          max={0.99}
          step={0.01}
          onChange={setDelta}
          style={{ maxWidth: 300, flex: 1 }}
        />
      </div>

      <div style={{ display: 'flex', gap: 'var(--space-8)', flexWrap: 'wrap', maxWidth: 720, marginBottom: 'var(--space-4)' }}>
        <div style={{ minWidth: 220, flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <MetricRow label="Entropy H(p)" value={`${entropy.toFixed(4)} bits`} valueColor="var(--color-accent-700)" />
          <MetricRow label="Full space" value={`2^${N}`} />
          <MetricRow label="Typical set" value={`≈ 2^${typicalExponent.toFixed(2)}`} valueColor="var(--color-accent-2-700)" />
        </div>
        <div style={{ minWidth: 220, flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <MetricRow label="Essential bit content H_delta" value={`${essentialNow.toFixed(3)} bits`} valueColor="var(--color-neutral-700)" />
          <MetricRow label="Blocks sampled" value={`${histogram.total} / ${MAX_SAMPLES}`} />
          <MetricRow label="Mean empirical entropy" value={meanLabel} valueColor="var(--color-accent-700)" />
        </div>
      </div>

      <Plot
        xDomain={[1, N_MAX]}
        yDomain={[0, N_MAX]}
        title="Full space versus typical set"
        desc="Both axes measure bits (log base two of the count). The solid line is the full space N; the dashed line is the typical-set exponent N times H(p)."
        height={300}
      >
        <Axis orient="left" label="bits (log2 count)" />
        <Axis orient="bottom" label="block length N" />
        <Curve points={sizeCurves.full} color={seriesColor(0)} />
        <Curve points={sizeCurves.typical} color={seriesColor(1)} dashed />
        <Marker x={N} y={N} color={seriesColor(0)} label={`2^${N}`} />
        <Marker x={N} y={typicalExponent} color={seriesColor(1)} label={`2^${typicalExponent.toFixed(1)}`} />
      </Plot>
      <Legend
        items={[
          { label: 'Full space (exponent N)', color: seriesColor(0) },
          { label: 'Typical set (exponent N H(p))', color: seriesColor(1), dashed: true },
        ]}
      />

      <h4>Sampling the AEP</h4>
      <p className="it-body-block">
        Resample blocks of N bits with the same bent coin and histogram the empirical entropy
        -(1/N) log2 P(block). As N grows the distribution concentrates on H(p).
      </p>
      <SeedControl seed={seed} onNewSeed={setSeed} />
      <SimControls loop={loop} runLabel="Sample" onReset={resetSamples} speedRange={[1, 30]} />

      <Plot
        xDomain={[0, Math.max(0.001, histogram.maxInfo)]}
        yDomain={[0, Math.max(0.02, histogram.maxFraction * 1.15, entropy * 1.05)]}
        title="Empirical entropy of sampled blocks"
        desc="Histogram of normalized self-information across sampled N-bit blocks. The dashed rule marks the true entropy H(p) that the distribution concentrates on."
        height={300}
      >
        <Axis orient="left" label="fraction of blocks" />
        <Axis orient="bottom" label="-(1/N) log2 P(block) (bits)" />
        <BarSeries bars={histogram.bars} color={seriesColor(0)} />
        <RuleY y={entropy} label={`H(p) = ${entropy.toFixed(3)}`} color={seriesColor(2)} />
      </Plot>

      <h4>Essential Bit Content</h4>
      <p className="it-body-block">
        H_delta(X) is the log2 of the smallest number of block outcomes needed to cover probability
        1 - delta. It sits between N H(p) and N: as delta grows, only the typical shell is required.
      </p>
      <Plot
        xDomain={[0, 1]}
        yDomain={[0, N]}
        title="Essential bit content versus delta"
        desc="The curve falls from N (delta = 0, the whole space) toward the typical-set exponent N H(p) as the allowed failure probability delta increases."
        height={300}
      >
        <Axis orient="left" label="H_delta (bits)" />
        <Axis orient="bottom" label="delta (allowed failure probability)" />
        <RuleY y={typicalExponent} label={`N H(p) = ${typicalExponent.toFixed(2)}`} color={seriesColor(1)} />
        <Curve points={essentialCurve} color={seriesColor(2)} />
        <Marker x={delta} y={essentialNow} color={seriesColor(2)} label={`${essentialNow.toFixed(2)}`} />
      </Plot>
    </LecturePage>
  );
};

export default TypicalSetsPage;
