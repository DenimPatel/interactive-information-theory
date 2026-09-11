import React, { useMemo, useState } from 'react';
import LecturePage from '../shell/LecturePage';
import Formula from '../ui/Formula';
import Quiz, { type QuizQuestion } from '../quiz/Quiz';
import Slider from '../Slider';
import MetricRow from '../MetricRow';
import SeedControl from '../ui/SeedControl';
import Callout from '../ui/Callout';
import { Axis, BarSeries, Curve, Legend, Marker, Plot, RuleY, seriesColor } from '../chart';
import { calculateEntropy } from '../../utils/informationTheory';
import { mulberry32, sampleCategorical, shuffle, type Rng } from '../../utils/rng';

const N_MIN = 10;
const N_MAX = 100;
const MC_CAP = 3000;

const clamp01 = (value: number): number => Math.max(0, Math.min(1, value));

const randomWord = (rng: Rng, heads: number, N: number): string => {
  const bits = new Array<number>(N).fill(0);
  for (let i = 0; i < heads; i++) bits[i] = 1;
  return shuffle(rng, bits).join('');
};

interface Shell {
  heads: number;
  count: number;
  probability: number;
  logProbability: number;
}

const QUESTIONS: QuizQuestion[] = [
  {
    id: 'below-rate',
    kind: 'choice',
    prompt: 'If the chosen rate satisfies R < H(p), what happens to P(error) as the block length N grows?',
    options: [
      { label: 'It tends to 0' },
      { label: 'It tends to 1', correct: true },
      { label: 'It stays exactly 0.5' },
      { label: 'It depends only on the seed' },
    ],
    explanation:
      'Below the entropy the codebook reaches only a vanishing share of the typical set, so almost all entropy remains uncovered.',
  },
  {
    id: 'above-rate',
    kind: 'choice',
    prompt: 'If R > H(p), what does the source coding theorem guarantee for large N?',
    options: [
      { label: 'P(error) can be made arbitrarily small', correct: true },
      { label: 'P(error) tends to 1' },
      { label: 'Only a fixed P(error) of 0.5 is achievable' },
      { label: 'No codewords exist' },
    ],
    explanation:
      'Just above the entropy, 2^{NR} codewords outnumber the 2^{NH(p)} typical sequences, so the codebook covers almost all of the typical mass.',
  },
  {
    id: 'threshold',
    kind: 'numeric',
    prompt: 'For a fair bent coin with p = 0.5, at what rate R (in bits per symbol) is the sharp threshold located?',
    answer: 1,
    tolerance: 1e-6,
    unit: 'bits',
    explanation: 'The threshold is the entropy H(0.5) = 1 bit per symbol.',
  },
  {
    id: 'skewed-entropy',
    kind: 'numeric',
    prompt: 'For p = 0.1, what is H(p) in bits? (3 decimal places.)',
    answer: 0.469,
    tolerance: 0.005,
    unit: 'bits',
    explanation: 'H(0.1) = -0.1 log2 0.1 - 0.9 log2 0.9 ≈ 0.469 bits.',
  },
];

const SourceCodingTheoremPage: React.FC = () => {
  const [N, setN] = useState<number>(40);
  const [p, setP] = useState<number>(0.3);
  const [R, setR] = useState<number>(0.8);
  const [seed, setSeed] = useState<number>(314159);

  const entropy = calculateEntropy(p);
  const allCount = 2 ** N;

  const shells = useMemo(() => {
    const log2p = Math.log2(p);
    const log2q = Math.log2(1 - p);
    const list: Shell[] = [];
    let log2Count = 0;
    for (let heads = 0; heads <= N; heads++) {
      if (heads > 0) log2Count += Math.log2(N - heads + 1) - Math.log2(heads);
      const logProbability = log2Count + heads * log2p + (N - heads) * log2q;
      list.push({
        heads,
        count: 2 ** log2Count,
        probability: 2 ** logProbability,
        logProbability,
      });
    }
    return list;
  }, [N, p]);

  // The typical set: about 2^{N H(p)} blocks whose per-block probability is
  // closest to the typical value 2^{-N H(p)}. Shells are added outward from
  // that typical probability until the set reaches the 2^{N H(p)} budget.
  const topSet = useMemo(() => {
    const log2K = Math.min(N, N * entropy);
    const K = 2 ** log2K;
    const log2Target = -N * entropy;
    const ordered = [...shells].sort(
      (a, b) => Math.abs(a.logProbability - log2Target) - Math.abs(b.logProbability - log2Target),
    );
    const included: { shell: Shell; amount: number }[] = [];
    let accumulated = 0;
    let typicalMass = 0;
    for (const shell of ordered) {
      if (accumulated >= K - 1e-9) break;
      const amount = Math.min(shell.count, K - accumulated);
      included.push({ shell, amount });
      accumulated += amount;
      typicalMass += amount * shell.probability;
    }
    return { included, K, typicalMass: Math.min(1, typicalMass) };
  }, [shells, N, entropy]);

  const codeCountFor = (rate: number): number =>
    Math.min(allCount, Math.max(1, Math.round(2 ** (N * rate))));

  const codebookSize = codeCountFor(R);
  const distinctSize = Math.min(codebookSize, topSet.K);
  const maxShellMass = useMemo(
    () => Math.max(1e-12, ...shells.map((shell) => shell.count * shell.probability)),
    [shells],
  );

  const sampled = useMemo(() => {
    const included = topSet.included;
    if (included.length === 0) return { covered: 0, words: [] as string[] };
    const rng = mulberry32(seed);
    const logK = Math.log2(topSet.K);
    const logs = included.map((item) => Math.log2(item.amount) - logK);
    const maxLog = Math.max(...logs);
    const weights = logs.map((value) => 2 ** (value - maxLog));
    const draws = Math.max(1, Math.min(Math.floor(distinctSize), MC_CAP));
    let total = 0;
    const words: string[] = [];
    for (let i = 0; i < draws; i++) {
      const index = sampleCategorical(rng, weights);
      total += included[index].shell.probability;
      if (N <= 20 && words.length < 8) {
        words.push(randomWord(rng, included[index].shell.heads, N));
      }
    }
    const mean = draws > 0 ? total / draws : 0;
    return { covered: clamp01(Math.min(topSet.typicalMass, distinctSize * mean)), words };
  }, [topSet, seed, distinctSize, N]);

  const error = clamp01(1 - sampled.covered);

  const errorCurve = useMemo(() => {
    const points: { x: number; y: number }[] = [];
    const size = topSet.K;
    for (let i = 0; i <= 100; i++) {
      const rate = i / 100;
      const count = Math.min(codeCountFor(rate), size);
      const covered = size > 0 ? (count / size) * topSet.typicalMass : 0;
      points.push({ x: rate, y: clamp01(1 - covered) });
    }
    return points;
  }, [topSet, N, entropy]);

  const rateCurve = useMemo(() => errorCurve.map((point) => ({ x: point.y, y: point.x })), [errorCurve]);

  const shellBars = shells.map((shell) => ({
    x: shell.heads / N,
    y: shell.count * shell.probability,
    width: (1 / N) * 0.9,
  }));

  const typicalBars = topSet.included.map((item) => ({
    x: item.shell.heads / N,
    y: item.shell.count * item.shell.probability,
    width: (1 / N) * 0.9,
  }));

  return (
    <LecturePage slug="source-coding-theorem" quiz={<Quiz slug="source-coding-theorem" questions={QUESTIONS} />}>
      <p className="it-body-block">
        The source coding theorem is a lottery. Draw 2^(N·R) codewords at random from the typical set —
        the roughly 2^(N·H(p)) blocks whose probability is closest to the typical value 2^(-N·H(p))
        inside the full 2^N space. An outcome is encodable when its block is in the chosen codebook.
      </p>
      <Formula
        tex="R > H(X) \implies P(\text{error}) \to 0 \text{ as } N \to \infty"
        note="reliable compression is possible just above the entropy"
        label="Achievability of the source coding theorem"
      />
      <Formula
        tex="P(\text{error}) = 1 - \sum_{x^N \in \mathcal{C}} P(x^N)"
        note="the uncovered probability mass is exactly the error"
        label="Probability of error for a random codebook"
      />

      <div style={{ display: 'flex', gap: 'var(--space-6)', flexWrap: 'wrap', marginBottom: 'var(--space-4)' }}>
        <Slider
          label="Block length (N)"
          valueLabel={N}
          value={N}
          min={N_MIN}
          max={N_MAX}
          step={1}
          onChange={setN}
          style={{ maxWidth: 280, flex: 1 }}
        />
        <Slider
          label="P(heads) = p"
          valueLabel={p.toFixed(2)}
          valueColor="var(--color-accent-2-700)"
          accentColor="var(--color-accent-2)"
          value={p}
          min={0.05}
          max={0.95}
          step={0.01}
          onChange={setP}
          style={{ maxWidth: 280, flex: 1 }}
        />
        <Slider
          label="Rate R"
          valueLabel={R.toFixed(2)}
          valueColor="var(--color-neutral-700)"
          accentColor="var(--color-neutral-600)"
          value={R}
          min={0}
          max={1}
          step={0.01}
          onChange={setR}
          style={{ maxWidth: 280, flex: 1 }}
        />
      </div>

      <div style={{ display: 'flex', gap: 'var(--space-8)', flexWrap: 'wrap', maxWidth: 760, marginBottom: 'var(--space-4)' }}>
        <div style={{ minWidth: 220, flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <MetricRow label="Entropy H(p)" value={`${entropy.toFixed(4)} bits`} valueColor="var(--color-accent-700)" />
          <MetricRow label="Full space 2^N" value={`2^${N}`} />
          <MetricRow label="Typical set size" value={`≈ 2^${(N * entropy).toFixed(2)}`} />
          <MetricRow label="Typical mass" value={topSet.typicalMass.toFixed(4)} />
        </div>
        <div style={{ minWidth: 220, flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <MetricRow label="Codewords 2^{NR}" value={`2^${(N * R).toFixed(2)}`} valueColor="var(--color-accent-700)" />
          <MetricRow
            label="Distinct codewords"
            value={distinctSize >= 1e6 ? `≈ 2^${Math.log2(distinctSize).toFixed(2)}` : Math.round(distinctSize).toLocaleString()}
          />
          <MetricRow label="Covered probability mass" value={sampled.covered.toFixed(4)} valueColor="var(--color-accent-700)" />
          <MetricRow label="P(error)" value={error.toFixed(4)} valueColor="var(--color-accent-2-700)" />
        </div>
      </div>

      <Callout
        title={R > entropy ? 'Achievable regime' : R < entropy ? 'Impossible regime' : 'Threshold'}
        tone={R >= entropy ? 'info' : 'warn'}
      >
        {R > entropy
          ? `R = ${R.toFixed(2)} exceeds H(p) = ${entropy.toFixed(3)}: 2^(NR) codewords outnumber the 2^(N·H(p)) typical sequences.`
          : R < entropy
            ? `R = ${R.toFixed(2)} is below H(p) = ${entropy.toFixed(3)}: the codebook covers only 2^(N(R-H)) of the typical set, so P(error) stays near 1.`
            : `R equals H(p) = ${entropy.toFixed(3)}: the boundary case, where the error can be driven to zero only as N grows.`}
      </Callout>

      <div className="text-muted" style={{ fontSize: 11, marginBottom: 4 }}>
        Current codebook coverage
      </div>
      <div
        style={{
          display: 'flex',
          height: 22,
          maxWidth: 640,
          borderRadius: 'var(--radius-sm)',
          overflow: 'hidden',
          marginBottom: 'var(--space-4)',
        }}
      >
        <div style={{ width: `${sampled.covered * 100}%`, background: 'var(--color-accent-600)' }} />
        <div style={{ width: `${error * 100}%`, background: 'var(--color-accent-2-600)' }} />
      </div>

      <h4>Error Probability versus Rate</h4>
      <Plot
        xDomain={[0, 1]}
        yDomain={[0, 1]}
        title="Error probability versus rate"
        desc="Expected uncovered probability mass as the rate R is swept from 0 to 1. The dashed vertical rule at R = H(p) marks the threshold above which the curve collapses toward zero."
        height={300}
      >
        <Axis orient="left" label="P(error)" />
        <Axis orient="bottom" label="rate R (bits/symbol)" />
        <RuleY y={0} label="zero error" color="var(--color-neutral-500)" />
        <Curve points={[{ x: entropy, y: 0 }, { x: entropy, y: 1 }]} color={seriesColor(2)} dashed width={1.5} />
        <Curve points={errorCurve} color={seriesColor(0)} />
        <Marker x={R} y={error} color={seriesColor(1)} label={`P(error) = ${error.toFixed(3)}`} />
      </Plot>
      <Legend
        items={[
          { label: 'expected P(error) versus R', color: seriesColor(0) },
          { label: `threshold R = H(p) = ${entropy.toFixed(3)}`, color: seriesColor(2), dashed: true },
          { label: 'current seeded codebook', color: seriesColor(1) },
        ]}
      />

      <h4>Rate versus Error Probability</h4>
      <p className="it-body-block">
        The same trade-off read the other way: the rate that can be sustained against a given error
        probability. The dashed rule at H(p) is the hard floor — below it no rate achieves small error.
      </p>
      <Plot
        xDomain={[0, 1]}
        yDomain={[0, 1]}
        title="Achievable rate versus error probability"
        desc="Rate R on the vertical axis against the error probability it produces. The horizontal rule at H(p) marks the entropy threshold."
        height={300}
      >
        <Axis orient="left" label="rate R (bits/symbol)" />
        <Axis orient="bottom" label="P(error)" />
        <RuleY y={entropy} label={`H(p) = ${entropy.toFixed(3)}`} color={seriesColor(2)} />
        <Curve points={rateCurve} color={seriesColor(1)} />
        <Marker x={error} y={R} color={seriesColor(0)} />
      </Plot>

      <h4>The Typical Set and the Codebook</h4>
      <p className="it-body-block">
        Grouped by the number of heads, the bars show the full outcome space; the highlighted shells are
        the typical set. Changing the seed redraws which typical blocks become codewords.
      </p>
      <Plot
        xDomain={[0, 1]}
        yDomain={[0, maxShellMass * 1.15]}
        title="Outcome space grouped into binomial shells"
        desc="Probability mass of each shell s (x axis is the empirical frequency s/N). Highlighted bars are the typical set that the random codebook draws from; the rest of the 2^N space is never encoded."
        height={300}
      >
        <Axis orient="left" label="shell probability mass" />
        <Axis orient="bottom" label="empirical frequency s/N" />
        <BarSeries bars={shellBars} color={seriesColor(2)} opacity={0.35} />
        <BarSeries bars={typicalBars} color={seriesColor(0)} opacity={0.9} />
      </Plot>
      <Legend
        items={[
          { label: 'typical set (≈ 2^(N·H(p)) blocks)', color: seriesColor(0) },
          { label: 'rest of the 2^N space', color: seriesColor(2) },
        ]}
      />
      <SeedControl seed={seed} onNewSeed={setSeed} />
      {sampled.words.length > 0 ? (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)', margin: 'var(--space-3) 0' }}>
          {sampled.words.map((word, index) => (
            <span className="tag tag-accent" key={`${word}-${index}`}>
              {word}
            </span>
          ))}
        </div>
      ) : null}
      <p className="text-muted" style={{ maxWidth: 640 }}>
        {sampled.words.length > 0 ? `Showing ${sampled.words.length} sampled codewords. ` : ''}
        The codebook is drawn without replacement from the typical set, so P(error) never drops below the
        non-typical mass of {((1 - topSet.typicalMass) * 100).toFixed(2)}%.
      </p>
    </LecturePage>
  );
};

export default SourceCodingTheoremPage;
