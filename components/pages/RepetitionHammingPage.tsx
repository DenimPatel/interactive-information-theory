import React, { useMemo, useState } from 'react';
import LecturePage from '../shell/LecturePage';
import Quiz, { type QuizQuestion } from '../quiz/Quiz';
import Formula from '../ui/Formula';
import Slider from '../Slider';
import MetricRow from '../MetricRow';
import SegmentedControl from '../ui/SegmentedControl';
import Callout from '../ui/Callout';
import SeedControl from '../ui/SeedControl';
import { Plot, Axis, Curve, Marker, RuleY, Legend, seriesColor } from '../chart';
import { calculateEntropy } from '../../utils/informationTheory';
import { mulberry32 } from '../../utils/rng';

type CodeId = 'r3' | 'hamming';

const COLORS = {
  uncoded: seriesColor(2),
  r3: seriesColor(0),
  hamming: seriesColor(1),
};

const encodeR3 = (bits: string): string =>
  bits
    .split('')
    .map((bit) => bit.repeat(3))
    .join('');

const encodeHamming = (bits: string): string => {
  const d = bits.split('').map(Number);
  const p1 = d[0] ^ d[1] ^ d[3];
  const p2 = d[0] ^ d[2] ^ d[3];
  const p4 = d[1] ^ d[2] ^ d[3];
  return [p1, p2, d[0], p4, d[1], d[2], d[3]].join('');
};

interface R3Decode {
  decoded: string;
  ones: number[];
  failures: number[];
}

const decodeR3 = (received: string, original: string): R3Decode => {
  const decoded: string[] = [];
  const ones: number[] = [];
  const failures: number[] = [];
  for (let block = 0; block < original.length; block++) {
    const triple = received.slice(block * 3, block * 3 + 3).split('').map(Number);
    const count = triple.reduce((sum, value) => sum + value, 0);
    const bit = count >= 2 ? '1' : '0';
    ones.push(count);
    decoded.push(bit);
    if (bit !== original[block]) failures.push(block);
  }
  return { decoded: decoded.join(''), ones, failures };
};

interface HammingDecode {
  s1: number;
  s2: number;
  s4: number;
  syndrome: number;
  corrected: string;
  data: string;
}

const decodeHamming = (received: string): HammingDecode => {
  const r = received.split('').map(Number);
  const s1 = r[0] ^ r[2] ^ r[4] ^ r[6];
  const s2 = r[1] ^ r[2] ^ r[5] ^ r[6];
  const s4 = r[3] ^ r[4] ^ r[5] ^ r[6];
  const syndrome = s1 + 2 * s2 + 4 * s4;
  const corrected = [...r];
  if (syndrome > 0 && syndrome <= corrected.length) corrected[syndrome - 1] ^= 1;
  const data = [corrected[2], corrected[4], corrected[5], corrected[6]].join('');
  return { s1, s2, s4, syndrome, corrected: corrected.join(''), data };
};

const r3BlockError = (p: number): number => Math.min(1, Math.max(0, 3 * p * p - 2 * p * p * p));

const hammingBlockError = (p: number): number => {
  const q = 1 - p;
  return Math.min(1, Math.max(0, 1 - q ** 7 - 7 * p * q ** 6));
};

const shannonLimit = (rate: number): number => {
  let limit = 0;
  for (let k = 0; k <= 1000; k++) {
    const p = k / 1000;
    if (1 - calculateEntropy(p) >= rate) limit = p;
    else break;
  }
  return limit;
};

const QUESTIONS: QuizQuestion[] = [
  {
    id: 'hamming-rate',
    kind: 'numeric',
    prompt: 'What is the rate R = k/n of the (7,4) Hamming code? (3 decimal places.)',
    answer: 0.571,
    tolerance: 0.001,
    explanation: 'Four data bits travel in seven symbols, so R = 4/7 ≈ 0.571.',
  },
  {
    id: 'r3-corrects',
    kind: 'choice',
    prompt: 'How many flipped bits can a rate-1/3 repetition code correct inside one block?',
    options: [
      { label: 'None' },
      { label: 'Exactly one', correct: true },
      { label: 'Two' },
      { label: 'Any number, if the flips cancel' },
    ],
    explanation: 'Three copies let a majority vote override one bad copy, but two bad copies win the vote.',
  },
  {
    id: 'r3-failure',
    kind: 'numeric',
    prompt: 'For p = 0.1, what is the probability that a rate-1/3 repetition block fails? (3 decimal places.)',
    answer: 0.028,
    tolerance: 0.002,
    explanation: 'Failure needs two or three flips: 3p²(1 − p) + p³ = 0.027 + 0.001 = 0.028.',
  },
  {
    id: 'syndrome-zero',
    kind: 'choice',
    prompt: 'A (7,4) Hamming decoder computes syndrome 000. What does it conclude?',
    options: [
      { label: 'Bit 7 is wrong' },
      { label: 'No error was detected', correct: true },
      { label: 'Two errors occurred' },
      { label: 'The code word is uncorrectable' },
    ],
    explanation: 'Syndrome zero means the received word already satisfies every parity check.',
  },
];

const BitCell: React.FC<{
  value: string;
  active: boolean;
  color: string;
  onClick?: () => void;
  title?: string;
}> = ({ value, active, color, onClick, title }) => (
  <button
    type="button"
    title={title}
    disabled={!onClick}
    onClick={onClick}
    style={{
      width: 30,
      height: 34,
      marginRight: 3,
      fontFamily: 'monospace',
      fontSize: 16,
      cursor: onClick ? 'pointer' : 'default',
      background: active ? color : 'var(--color-surface)',
      color: active ? 'var(--color-bg)' : 'var(--color-text)',
      border: '1px solid var(--color-divider)',
      borderRadius: 'var(--radius-sm)',
    }}
  >
    {value}
  </button>
);

const RepetitionHammingPage: React.FC = () => {
  const [code, setCode] = useState<CodeId>('hamming');
  const [dataBits, setDataBits] = useState<string>('1011');
  const [flips, setFlips] = useState<boolean[]>(() => Array(7).fill(false));
  const [seed, setSeed] = useState<number>(20260911);
  const [pSim, setPSim] = useState<number>(0.1);

  const changeCode = (next: CodeId): void => {
    setCode(next);
    setDataBits(next === 'r3' ? '101' : '1011');
    setFlips(Array(next === 'r3' ? 9 : 7).fill(false));
  };

  const encoded = code === 'r3' ? encodeR3(dataBits) : encodeHamming(dataBits);
  const received = encoded
    .split('')
    .map((bit, index) => (flips[index] ? (bit === '0' ? '1' : '0') : bit))
    .join('');

  const r3Result = code === 'r3' ? decodeR3(received, dataBits) : null;
  const hamResult = code === 'hamming' ? decodeHamming(received) : null;
  const decodedBits = code === 'r3' ? r3Result?.decoded ?? '' : hamResult?.data ?? '';
  const success = decodedBits === dataBits;
  const flipCount = flips.filter(Boolean).length;

  const toggleData = (index: number): void => {
    setDataBits((prev) => prev.slice(0, index) + (prev[index] === '0' ? '1' : '0') + prev.slice(index + 1));
  };
  const toggleFlip = (index: number): void => {
    setFlips((prev) => prev.map((value, i) => (i === index ? !value : value)));
  };

  const berCurves = useMemo(() => {
    const uncoded: { x: number; y: number }[] = [];
    const r3: { x: number; y: number }[] = [];
    const hamming: { x: number; y: number }[] = [];
    for (let k = 0; k <= 100; k++) {
      const p = k / 100;
      uncoded.push({ x: p, y: Math.min(1, Math.max(0, p)) });
      r3.push({ x: p, y: r3BlockError(p) });
      hamming.push({ x: p, y: hammingBlockError(p) });
    }
    return { uncoded, r3, hamming };
  }, []);

  const capacityCurve = useMemo(() => {
    const points: { x: number; y: number }[] = [];
    for (let k = 0; k <= 100; k++) {
      const p = k / 100;
      points.push({ x: p, y: Math.max(0, 1 - calculateEntropy(p)) });
    }
    return points;
  }, []);

  const r3Limit = useMemo(() => shannonLimit(1 / 3), []);
  const hamLimit = useMemo(() => shannonLimit(4 / 7), []);

  const sim = useMemo(() => {
    const rng = mulberry32(seed);
    const blockError = (nBits: number, correctable: number): number => {
      let errors = 0;
      const trials = 4000;
      for (let trial = 0; trial < trials; trial++) {
        let count = 0;
        for (let bit = 0; bit < nBits; bit++) if (rng() < pSim) count += 1;
        if (count > correctable) errors += 1;
      }
      return errors / trials;
    };
    return {
      uncoded: blockError(1, 0),
      r3: blockError(3, 1),
      hamming: blockError(7, 1),
    };
  }, [seed, pSim]);

  return (
    <LecturePage slug="repetition-hamming" quiz={<Quiz slug="repetition-hamming" questions={QUESTIONS} />}>
      <p className="it-body-block" style={{ maxWidth: 680 }}>
        Coding beats noise by adding structured redundancy. Repetition simply repeats every bit;
        Hamming parity bits locate a single error so it can be undone. Encode a short message, then
        click the received bits to inject errors and watch the decoder react.
      </p>

      <SegmentedControl
        label="Code"
        name="repetition-hamming-code"
        value={code}
        onChange={changeCode}
        options={[
          { value: 'r3', label: 'Repetition (3,1)' },
          { value: 'hamming', label: 'Hamming (7,4)' },
        ]}
      />

      <div style={{ margin: 'var(--space-4) 0', maxWidth: 640 }}>
        <MetricRow label="Uncoded rate R = 1" value="1.000" />
        <MetricRow label="Repetition (3,1) rate R = 1/3" value="0.333" valueColor={COLORS.r3} />
        <MetricRow label="Hamming (7,4) rate R = 4/7" value="0.571" valueColor={COLORS.hamming} />
      </div>

      <h4>1. Message bits</h4>
      <p className="text-muted" style={{ maxWidth: 640 }}>Click a bit to toggle the data before encoding.</p>
      <div style={{ marginBottom: 'var(--space-4)' }}>
        {dataBits.split('').map((bit, index) => (
          <BitCell
            key={`data-${index}`}
            value={bit}
            active
            color="var(--color-accent-700)"
            onClick={() => toggleData(index)}
            title="Toggle this data bit"
          />
        ))}
      </div>

      <h4>2. Encoded code word</h4>
      <div style={{ marginBottom: 'var(--space-4)' }}>
        {encoded.split('').map((bit, index) => (
          <BitCell key={`enc-${index}`} value={bit} active={false} color="var(--color-accent-700)" />
        ))}
      </div>

      <h4>3. Received bits — click to flip</h4>
      <p className="text-muted" style={{ maxWidth: 640 }}>
        Highlighted cells are the errors you injected. {flipCount} bit{flipCount === 1 ? '' : 's'} flipped.
      </p>
      <div style={{ marginBottom: 'var(--space-5)' }}>
        {received.split('').map((bit, index) => (
          <BitCell
            key={`rec-${index}`}
            value={bit}
            active={flips[index]}
            color="var(--color-accent-2-700)"
            onClick={() => toggleFlip(index)}
            title="Toggle an error at this position"
          />
        ))}
      </div>

      <h4>4. Decoding</h4>
      <MetricRow label="Original message" value={dataBits} width={320} />
      <MetricRow label="Decoded message" value={decodedBits} valueColor={success ? 'var(--color-accent-700)' : 'var(--color-accent-2-700)'} width={320} />

      {hamResult ? (
        <div style={{ marginTop: 'var(--space-4)' }}>
          <table className="table" style={{ width: 'auto' }}>
            <thead>
              <tr><th>s₁</th><th>s₂</th><th>s₄</th><th>Syndrome</th><th>Corrected position</th></tr>
            </thead>
            <tbody>
              <tr>
                <td>{hamResult.s1}</td>
                <td>{hamResult.s2}</td>
                <td>{hamResult.s4}</td>
                <td style={{ color: 'var(--color-accent-700)' }}><b>{hamResult.syndrome === 0 ? '000 (no error)' : hamResult.syndrome}</b></td>
                <td>{hamResult.syndrome === 0 ? '—' : `bit ${hamResult.syndrome}`}</td>
              </tr>
            </tbody>
          </table>
          <p className="text-muted">
            Corrected word: <b style={{ fontFamily: 'monospace' }}>{hamResult.corrected}</b> — the syndrome names the column of the parity-check matrix, i.e. the error position.
          </p>
        </div>
      ) : null}

      {r3Result ? (
        <div style={{ marginTop: 'var(--space-4)' }}>
          <table className="table" style={{ width: 'auto' }}>
            <thead>
              <tr><th>Block</th><th>Received triple</th><th>Ones</th><th>Majority</th><th>Correct?</th></tr>
            </thead>
            <tbody>
              {r3Result.ones.map((count, block) => (
                <tr key={`blk-${block}`}>
                  <td>{block + 1}</td>
                  <td style={{ fontFamily: 'monospace' }}>{received.slice(block * 3, block * 3 + 3)}</td>
                  <td>{count}</td>
                  <td>{count >= 2 ? '1' : '0'}</td>
                  <td style={{ color: r3Result.failures.includes(block) ? 'var(--color-accent-2-700)' : 'var(--color-accent-700)' }}>
                    {r3Result.failures.includes(block) ? 'wrong' : 'yes'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {success ? (
        <Callout title="Decoded correctly">The {code === 'r3' ? 'majority vote' : 'syndrome decoder'} recovered every message bit.</Callout>
      ) : (
        <Callout title="Decoding failed" tone="warn">
          {flipCount} errors is beyond what this code can repair. {code === 'hamming'
            ? 'With two flips the syndrome points at a third, innocent bit and “corrects” it — the word lands on a different code word.'
            : 'Two flips inside one block outvote the surviving copy of the original bit.'}
        </Callout>
      )}

      <Formula
        tex="P_{\text{R3}} = 3p^2(1-p) + p^3"
        note="a repetition block fails when two or three of its three bits flip"
        label="Repetition block error probability"
      />

      <h4>Block error rate versus p</h4>
      <Plot
        xDomain={[0, 1]}
        yDomain={[0, 1]}
        title="Block error probability versus crossover p"
        desc="Uncoded transmission, rate-1/3 repetition and the (7,4) Hamming code; dots mark the current Monte Carlo estimate."
        caption={`Shannon limits: repetition (R = 1/3) is reliable while p < ${r3Limit.toFixed(3)}; the (7,4) code (R = 4/7) while p < ${hamLimit.toFixed(3)}.`}
        height={320}
      >
        <Axis orient="left" label="Block error probability" ticks={[0, 0.25, 0.5, 0.75, 1]} />
        <Axis orient="bottom" label="Crossover probability p" ticks={[0, 0.25, 0.5, 0.75, 1]} />
        <Curve points={berCurves.uncoded} color={COLORS.uncoded} dashed />
        <Curve points={berCurves.r3} color={COLORS.r3} />
        <Curve points={berCurves.hamming} color={COLORS.hamming} />
        <Marker x={pSim} y={sim.uncoded} color={COLORS.uncoded} radius={4} />
        <Marker x={pSim} y={sim.r3} color={COLORS.r3} radius={4} />
        <Marker x={pSim} y={sim.hamming} color={COLORS.hamming} radius={4} />
      </Plot>
      <Legend
        items={[
          { label: 'Uncoded (R = 1)', color: COLORS.uncoded, dashed: true },
          { label: 'Repetition (3,1), R = 1/3', color: COLORS.r3 },
          { label: 'Hamming (7,4), R = 4/7', color: COLORS.hamming },
        ]}
      />

      <Slider
        label="Monte Carlo crossover p"
        valueLabel={pSim.toFixed(2)}
        value={pSim}
        min={0}
        max={0.5}
        step={0.01}
        onChange={setPSim}
        accentColor="var(--color-accent-2)"
        valueColor="var(--color-accent-2-700)"
        style={{ maxWidth: 420, marginTop: 'var(--space-4)' }}
      />
      <SeedControl seed={seed} onNewSeed={setSeed} />

      <h4>Where the capacity sits</h4>
      <Plot
        xDomain={[0, 0.5]}
        yDomain={[0, 1]}
        title="BSC capacity and the two code rates"
        desc="The capacity curve C = 1 − h(p). A code can drive errors to zero only while its rate line stays below capacity."
        height={280}
      >
        <Axis orient="left" label="bits per use" ticks={[0, 0.25, 0.5, 0.75, 1]} />
        <Axis orient="bottom" label="crossover probability p" ticks={[0, 0.1, 0.2, 0.3, 0.4, 0.5]} />
        <RuleY y={1 / 3} color={COLORS.r3} label="R = 1/3" />
        <RuleY y={4 / 7} color={COLORS.hamming} label="R = 4/7" />
        <Curve points={capacityCurve} color="var(--color-neutral-700)" />
      </Plot>
      <Legend
        items={[
          { label: 'Capacity C(p) = 1 − h(p)', color: 'var(--color-neutral-700)' },
          { label: 'Repetition rate', color: COLORS.r3, dashed: true },
          { label: 'Hamming rate', color: COLORS.hamming, dashed: true },
        ]}
      />
    </LecturePage>
  );
};

export default RepetitionHammingPage;
