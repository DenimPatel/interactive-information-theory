import React, { useState } from 'react';
import Slider from '../Slider';
import MetricRow from '../MetricRow';
import LecturePage from '../shell/LecturePage';
import Formula from '../ui/Formula';
import Quiz, { type QuizQuestion } from '../quiz/Quiz';
import { Axis, Curve, Marker, Plot } from '../chart';
import { calculateEntropy, formatValue } from '../../utils/informationTheory';
import { FORMULAS } from '../../content/formulas';

const F = FORMULAS['noisy-channel-theorem'];

const SYNDROME_TABLE = [
  { syndrome: '000', pos: 'No error', bit: '—' },
  { syndrome: '001', pos: '4th bit', bit: 'p₂' },
  { syndrome: '010', pos: '2nd bit', bit: 'p₁' },
  { syndrome: '011', pos: '6th bit', bit: 'd₂' },
  { syndrome: '100', pos: '1st bit', bit: 'p₀' },
  { syndrome: '101', pos: '5th bit', bit: 'd₁' },
  { syndrome: '110', pos: '3rd bit', bit: 'd₀' },
  { syndrome: '111', pos: '7th bit', bit: 'd₃' },
];

const QUESTIONS: QuizQuestion[] = [
  {
    id: 'below-capacity',
    kind: 'choice',
    prompt: 'What does the noisy channel coding theorem guarantee when R < C?',
    options: [
      { label: 'Errors can be made arbitrarily small with long enough codes', correct: true },
      { label: 'Every code achieves zero errors' },
      { label: 'The rate can be increased without limit' },
      { label: 'Errors necessarily grow with block length' },
    ],
    explanation: 'Below capacity there exists a sequence of codes whose error probability tends to zero.',
  },
  {
    id: 'hamming-rate',
    kind: 'numeric',
    prompt: 'What is the rate R = k/n of the (7,4) Hamming code? (3 decimal places.)',
    answer: 0.571,
    tolerance: 0.001,
    explanation: 'Four data bits in seven transmitted symbols: k/n = 4/7 ≈ 0.571.',
  },
  {
    id: 'above-capacity',
    kind: 'choice',
    prompt: 'What happens when R > C?',
    options: [
      { label: 'Error probability can still be driven to zero with clever coding' },
      { label: 'Error probability is bounded away from zero for any code', correct: true },
      { label: 'The channel becomes noiseless' },
      { label: 'Capacity increases to match R' },
    ],
    explanation: 'The converse to the coding theorem: above capacity, reliable communication is impossible.',
  },
  {
    id: 'random-coding',
    kind: 'choice',
    prompt: 'In the random-coding argument, why does the error probability vanish when R < C?',
    options: [
      { label: 'A particular clever code is constructed by hand' },
      { label: 'A random codebook’s typical decoding balls are, with high probability, disjoint', correct: true },
      { label: 'Noise is switched off for long blocks' },
      { label: 'The decoder guesses at random' },
    ],
    explanation: 'The union of about 2^{NR} typical output sets each of size 2^{N H(p)} fits inside the 2^N outputs exactly when R < 1 − H(p) = C.',
  },
];

const NoisyChannelTheoremPage: React.FC = () => {
  const [p, setP] = useState(0.1);
  const [rate, setRate] = useState(0.5);
  const [N, setN] = useState(20);

  const h2 = calculateEntropy(p);
  const capacity = Math.max(0, 1 - h2);
  const codewords = 2 ** (N * rate);
  const unionFraction = 2 ** (N * (rate + h2 - 1));
  const errorBound = rate < capacity ? Math.min(1, 2 ** (-N * (capacity - rate))) : 1;

  const errorCurve = React.useMemo(() => {
    const points = [];
    for (let i = 0; i <= 100; i++) {
      const r = i / 100;
      points.push({ x: r, y: r < capacity ? Math.min(1, 2 ** (-N * (capacity - r))) : 1 });
    }
    return points;
  }, [capacity, N]);

  return (
    <LecturePage slug="noisy-channel-theorem" quiz={<Quiz slug="noisy-channel-theorem" questions={QUESTIONS} />}>
      <p className="it-body-block" style={{ maxWidth: 680 }}>
        Published in 1948: below channel capacity C, codes exist making the error probability arbitrarily
        small; above C, errors cannot be made arbitrarily small.
      </p>
      <Formula tex={F.achievable} note="the achievability (direct) part" label="If rate is below capacity the error probability goes to zero" />
      <Formula tex={F.converse} note="the converse part" label="If rate is above capacity the error probability is bounded away from zero" />

      <h4>Random Coding &amp; Sphere Packing</h4>
      <p className="it-body-block">
        Pick a codebook at random — that is, choose about M = 2<sup>NR</sup> codewords. Around each
        codeword sit the outputs it typically turns into: about 2<sup>N H(p)</sup> of them on a BSC(p).
        If those typical sets do not overlap, joint-typicality decoding is error-free. The whole output
        space holds 2<sup>N</sup> blocks, so the sets fit exactly when
      </p>
      <Formula tex="M \cdot 2^{N H(p)} < 2^{N} \;\Longleftrightarrow\; R < 1 - H(p) = C" note="the sphere-packing condition" label="Random coding fits when R is below capacity" />
      <p className="it-body-block">
        A random code has the union bound P(error) ≤ 2<sup>−N(C−R)</sup>: below capacity it falls
        exponentially with block length, and above capacity no code can help.
      </p>

      <div style={{ display: 'flex', gap: 'var(--space-4)', flexWrap: 'wrap', margin: 'var(--space-3) 0' }}>
        <Slider label="Crossover p" valueLabel={p.toFixed(2)} value={p} min={0} max={0.5} step={0.01} onChange={setP} style={{ maxWidth: 260, flex: 1 }} />
        <Slider label="Rate R" valueLabel={rate.toFixed(2)} value={rate} min={0.05} max={1} step={0.01} onChange={setRate} style={{ maxWidth: 260, flex: 1 }} />
        <Slider label="Block length N" valueLabel={String(Math.round(N))} value={N} min={2} max={60} step={1} onChange={setN} style={{ maxWidth: 260, flex: 1 }} />
      </div>

      <div style={{ display: 'flex', gap: 'var(--space-6)', flexWrap: 'wrap', marginBottom: 'var(--space-4)' }}>
        <MetricRow label="Capacity C" value={`${capacity.toFixed(3)} bits`} valueColor="var(--color-accent-2-700)" width={210} />
        <MetricRow label="Codewords M" value={formatValue(Math.log10(codewords), 2) + ' digits'} width={210} />
        <MetricRow label="Typical-set fraction used" value={formatValue(unionFraction, 4)} width={210} />
        <MetricRow label="P(error) bound" value={formatValue(errorBound, 4)} valueColor="var(--color-accent-700)" width={210} />
      </div>

      <Plot
        xDomain={[0, 1]}
        yDomain={[0, 1]}
        title="Random-coding error bound versus rate"
        desc="Below capacity the union bound falls exponentially with block length; at or above capacity it sits at one. The dashed line marks capacity."
        height={300}
      >
        <Axis orient="left" label="P(error) bound" ticks={[0, 0.25, 0.5, 0.75, 1]} />
        <Axis orient="bottom" label="Rate R" ticks={[0, 0.25, 0.5, 0.75, 1]} />
        <Curve points={errorCurve} />
        <Marker x={rate} y={errorBound} label={`P≤${errorBound.toFixed(2)}`} />
      </Plot>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 'var(--space-3)', marginBottom: 'var(--space-6)' }}>
        <div className="card elev-sm">
          <div className="card-title">Channel Capacity (C)</div>
          <p className="card-body">Max reliable transmission rate — the maximum mutual information over all input distributions.</p>
        </div>
        <div className="card elev-sm">
          <div className="card-title">Transmission Rate (R)</div>
          <p className="card-body">Information bits sent per channel use: R = k/n for k data bits in n symbols.</p>
        </div>
        <div className="card elev-sm">
          <div className="card-title">Error Probability (Pₑ)</div>
          <p className="card-body">Likelihood the decoded message differs from what was sent.</p>
        </div>
      </div>

      <h4>Example: The (7,4) Hamming Code</h4>
      <p className="it-body-block">
        Takes k = 4 data bits, adds 3 parity bits, for a 7-bit codeword — rate R = 4/7 ≈ 0.571. It corrects
        any single-bit error in the codeword.
      </p>
      <table className="table" style={{ maxWidth: 420, marginTop: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
        <thead><tr><th>Syndrome</th><th>Error Position</th><th>Bit</th></tr></thead>
        <tbody>
          {SYNDROME_TABLE.map((row) => (
            <tr key={row.syndrome}>
              <td>{row.syndrome}</td>
              <td>{row.pos}</td>
              <td style={{ color: 'var(--color-accent-700)' }}><b>{row.bit}</b></td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="text-muted" style={{ maxWidth: 660, marginBottom: 'var(--space-6)' }}>
        With p = 0.05 crossover, C ≈ 0.714 &gt; R (0.571) — the code cuts block-error probability from
        ~18.6% (uncoded) to ~4.4%. With p = 0.15, C ≈ 0.390 &lt; R — this code cannot make errors
        arbitrarily rare on so noisy a channel.
      </p>

      <h4>A Simple Analogy</h4>
      <p className="it-body-block">
        Shouting across a noisy room: capacity is the clarity limit set by the room&rsquo;s noise; rate is
        how fast you speak; coding is choosing your words carefully. Speak below capacity and clever
        phrasing makes you understood almost perfectly — speak faster than capacity and no phrasing saves
        you.
      </p>
    </LecturePage>
  );
};

export default NoisyChannelTheoremPage;
