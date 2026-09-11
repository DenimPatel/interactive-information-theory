import React, { useEffect, useMemo, useState } from 'react';
import LecturePage from '../shell/LecturePage';
import Formula from '../ui/Formula';
import Quiz, { type QuizQuestion } from '../quiz/Quiz';
import Toggle from '../ui/Toggle';
import MetricRow from '../MetricRow';
import SimControls from '../ui/SimControls';
import Callout from '../ui/Callout';
import { useAnimationLoop } from '../../hooks/useAnimationLoop';

interface ArithmeticStep {
  symbol: string;
  lo: number;
  hi: number;
  rangeLo: number;
  rangeHi: number;
  probability: number;
}

interface ArithmeticTrace {
  alphabet: string[];
  steps: ArithmeticStep[];
}

interface Encoded {
  bits: string;
  value: number;
  length: number;
}

const MAX_LENGTH = 6;

const buildTrace = (text: string, adaptive: boolean): ArithmeticTrace => {
  const alphabet = Array.from(new Set(text)).sort();
  if (text.length === 0 || alphabet.length === 0) return { alphabet, steps: [] };

  const fixedCounts = new Map<string, number>();
  for (const ch of text) fixedCounts.set(ch, (fixedCounts.get(ch) ?? 0) + 1);
  const adaptiveCounts = new Map<string, number>();
  for (const ch of alphabet) adaptiveCounts.set(ch, 1);

  const steps: ArithmeticStep[] = [];
  let lo = 0;
  let hi = 1;
  for (const ch of text) {
    const counts = adaptive ? adaptiveCounts : fixedCounts;
    const total = alphabet.reduce((sum, c) => sum + (counts.get(c) ?? 0), 0);
    let cumulative = 0;
    let rangeLo = 0;
    let rangeHi = 1;
    let probability = 1 / alphabet.length;
    for (const c of alphabet) {
      const p = total > 0 ? (counts.get(c) ?? 0) / total : 1 / alphabet.length;
      if (c === ch) {
        rangeLo = cumulative;
        probability = p;
      }
      cumulative += p;
      if (c === ch) rangeHi = cumulative;
    }
    const width = hi - lo;
    const nextLo = lo + width * rangeLo;
    const nextHi = lo + width * rangeHi;
    steps.push({ symbol: ch, lo: nextLo, hi: nextHi, rangeLo, rangeHi, probability });
    lo = nextLo;
    hi = nextHi;
    if (adaptive) adaptiveCounts.set(ch, (adaptiveCounts.get(ch) ?? 0) + 1);
  }
  return { alphabet, steps };
};

const shortestBinary = (lo: number, hi: number): Encoded | null => {
  if (!(hi > lo)) return null;
  for (let k = 1; k <= 48; k += 1) {
    const scale = 2 ** k;
    const m = Math.floor(lo * scale) + 1;
    if (m / scale < hi) {
      return { bits: m.toString(2).padStart(k, '0'), value: m / scale, length: k };
    }
  }
  return null;
};

const decodeBits = (
  value: number,
  alphabet: string[],
  fixedCounts: Map<string, number>,
  adaptive: boolean,
  symbolCount: number,
): string => {
  if (alphabet.length === 0 || symbolCount <= 0) return '';
  const counts = new Map<string, number>();
  for (const ch of alphabet) {
    counts.set(ch, adaptive ? 1 : (fixedCounts.get(ch) ?? 0));
  }
  let lo = 0;
  let hi = 1;
  let out = '';
  for (let i = 0; i < symbolCount; i += 1) {
    const span = hi - lo;
    if (!(span > 0)) {
      out += alphabet[0];
      continue;
    }
    const total = alphabet.reduce((sum, c) => sum + (counts.get(c) ?? 0), 0);
    const target = Math.min(0.999999999, Math.max(0, (value - lo) / span));
    let cumulative = 0;
    let chosen = alphabet[alphabet.length - 1];
    let rangeLo = 0;
    let rangeHi = 1;
    for (let j = 0; j < alphabet.length; j += 1) {
      const c = alphabet[j];
      const p = total > 0 ? (counts.get(c) ?? 0) / total : 1 / alphabet.length;
      if (j === alphabet.length - 1 || target < cumulative + p) {
        chosen = c;
        rangeLo = cumulative;
        rangeHi = cumulative + p;
        break;
      }
      cumulative += p;
    }
    out += chosen;
    const nextLo = lo + span * rangeLo;
    const nextHi = lo + span * rangeHi;
    lo = nextLo;
    hi = nextHi;
    if (adaptive) counts.set(chosen, (counts.get(chosen) ?? 0) + 1);
  }
  return out;
};

const QUESTIONS: QuizQuestion[] = [
  {
    id: 'width',
    kind: 'numeric',
    prompt: 'With known P(A) = P(B) = 0.5, encoding the two-symbol string “AB” from [0,1) leaves an interval of what width?',
    answer: 0.25,
    tolerance: 1e-6,
    unit: 'of [0,1)',
    explanation: 'Each symbol multiplies the width by its probability: 1 × 0.5 × 0.5 = 0.25.',
  },
  {
    id: 'adaptive-update',
    kind: 'choice',
    prompt: 'In the adaptive Laplace (add-1) model, what happens to a symbol’s probability after it is seen?',
    options: [
      { label: 'It increases, because its count rises while unseen symbols keep their +1 baseline', correct: true },
      { label: 'It stays fixed, since the model is known in advance' },
      { label: 'It drops to zero once the symbol is exhausted' },
      { label: 'It resets on every step' },
    ],
    explanation: 'Counts start at one for every symbol and increment as symbols arrive, so recent symbols gain probability mass.',
  },
  {
    id: 'representation',
    kind: 'choice',
    prompt: 'Arithmetic coding represents an entire message as…',
    options: [
      { label: 'One binary fraction inside a narrowing interval', correct: true },
      { label: 'A fixed-length block code per symbol' },
      { label: 'A balanced binary tree' },
      { label: 'A dictionary of repeated phrases' },
    ],
    explanation: 'The message is mapped to a single number whose interval the decoder follows symbol by symbol.',
  },
  {
    id: 'length',
    kind: 'choice',
    prompt: 'Why must the decoder know the message length or an explicit end symbol?',
    options: [
      { label: 'The final interval alone does not say how many symbols were encoded', correct: true },
      { label: 'The interval cannot be computed without it' },
      { label: 'Otherwise the binary fraction is undefined' },
      { label: 'It changes the source entropy' },
    ],
    explanation: 'Any point inside the final interval decodes to a prefix of the message; the length (or a terminator) fixes where to stop.',
  },
];

const pct = (value: number): number => Math.max(0, Math.min(100, value * 100));

const ArithmeticCodingPage: React.FC = () => {
  const [text, setText] = useState<string>('abac');
  const [adaptive, setAdaptive] = useState<boolean>(false);
  const [step, setStep] = useState<number>(0);

  const trace = useMemo(() => buildTrace(text, adaptive), [text, adaptive]);
  const total = trace.steps.length;

  const loop = useAnimationLoop({
    tick: () => setStep((current) => (current < total ? current + 1 : current)),
    onReset: () => setStep(0),
    initialSpeed: 2,
  });

  useEffect(() => {
    setStep(0);
  }, [trace]);

  useEffect(() => {
    if (total > 0 && step >= total && loop.running) loop.pause();
  }, [step, total, loop.running, loop.pause]);

  const current = step > 0 && step <= total ? trace.steps[step - 1] : null;
  const currentLo = current ? current.lo : 0;
  const currentHi = current ? current.hi : 1;
  const parent = step > 1 ? trace.steps[step - 2] : null;
  const parentLo = parent ? parent.lo : 0;
  const parentHi = parent ? parent.hi : 1;

  const finalStep = total > 0 ? trace.steps[total - 1] : null;
  const encoded = finalStep ? shortestBinary(finalStep.lo, finalStep.hi) : null;

  const fixedCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const ch of text) counts.set(ch, (counts.get(ch) ?? 0) + 1);
    return counts;
  }, [text]);

  const decoded = encoded
    ? decodeBits(encoded.value, trace.alphabet, fixedCounts, adaptive, text.length)
    : '';
  const matches = text.length > 0 && decoded === text;

  const updateText = (value: string): void => {
    setText(value.slice(0, MAX_LENGTH));
  };

  return (
    <LecturePage slug="arithmetic-coding" quiz={<Quiz slug="arithmetic-coding" questions={QUESTIONS} />}>
      <p className="it-body-block">
        Arithmetic coding turns a whole message into a single number: each symbol subdivides the current
        interval of [0,1) in proportion to its probability, and any point in the final interval names the
        message.
      </p>
      <Formula
        tex="I(s_1 \ldots s_n) = [L, H) \subset [0,1), \qquad H - L = \prod_{i} p(s_i)"
        note="the interval narrows by the probability of each symbol"
        label="Arithmetic coding interval"
      />

      <h4>Encode a short string</h4>
      <div className="field" style={{ maxWidth: 420, margin: 'var(--space-4) 0 var(--space-3) 0' }}>
        <label>Message (up to {MAX_LENGTH} symbols)</label>
        <input
          className="input"
          type="text"
          value={text}
          maxLength={MAX_LENGTH}
          onChange={(event) => updateText(event.target.value)}
        />
      </div>

      <div style={{ display: 'flex', gap: 'var(--space-5)', alignItems: 'center', flexWrap: 'wrap', marginBottom: 'var(--space-3)' }}>
        <Toggle label="Adaptive Laplace (add-1) model" checked={adaptive} onChange={setAdaptive} />
        <span className="text-muted" style={{ fontSize: 12 }}>
          {adaptive
            ? 'Probabilities update from counts of symbols seen so far, each starting at 1.'
            : 'Probabilities are fixed to the symbol frequencies of the whole message.'}
        </span>
      </div>

      {trace.alphabet.length === 0 ? (
        <Callout title="Waiting for input" tone="info">
          Type a non-empty message to see the interval narrow. Only up to {MAX_LENGTH} symbols are kept so the
          binary fraction stays short.
        </Callout>
      ) : (
        <>
          <SimControls loop={loop} runLabel="Run" speedRange={[1, 10]} />

          <div className="text-muted" style={{ fontSize: 11, margin: 'var(--space-4) 0 4px 0' }}>
            Interval [0,1) with the current sub-interval highlighted
          </div>
          <div
            style={{
              position: 'relative',
              height: 28,
              background: 'var(--color-surface)',
              border: '1px solid var(--color-divider)',
              borderRadius: 'var(--radius-sm)',
              overflow: 'hidden',
              maxWidth: 680,
              marginBottom: 4,
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: 0,
                height: '100%',
                left: `${pct(parentLo)}%`,
                width: `${pct(parentHi - parentLo)}%`,
                background: 'var(--color-accent-100)',
              }}
            />
            <div
              style={{
                position: 'absolute',
                top: 0,
                height: '100%',
                left: `${pct(currentLo)}%`,
                width: `${pct(currentHi - currentLo)}%`,
                minWidth: 2,
                background: 'var(--color-accent-700)',
              }}
            />
          </div>
          <div className="text-muted" style={{ display: 'flex', justifyContent: 'space-between', maxWidth: 680, fontSize: 11 }}>
            <span>0</span>
            <span>1</span>
          </div>

          <div style={{ display: 'flex', gap: 'var(--space-8)', flexWrap: 'wrap', margin: 'var(--space-4) 0' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 240 }}>
              <MetricRow label="Symbols encoded" value={`${step} / ${total}`} />
              <MetricRow label="Current interval" value={`[${currentLo.toFixed(6)}, ${currentHi.toFixed(6)})`} valueColor="var(--color-accent-700)" />
              <MetricRow label="Width" value={Math.max(0, currentHi - currentLo).toExponential(3)} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 260 }}>
              <MetricRow label="Final interval" value={finalStep ? `[${finalStep.lo.toFixed(6)}, ${finalStep.hi.toFixed(6)})` : '—'} />
              <MetricRow label="Binary fraction" value={encoded ? encoded.bits : '—'} valueColor="var(--color-accent-2-700)" />
              <MetricRow label="Bits emitted" value={encoded ? `${encoded.length}` : '—'} />
              <MetricRow label="Code value" value={encoded ? encoded.value.toFixed(6) : '—'} />
            </div>
          </div>

          <h5>Subdivision log</h5>
          <div style={{ maxHeight: 200, overflowY: 'auto', marginBottom: 'var(--space-5)' }}>
            <table className="table" style={{ width: 'auto', minWidth: 520 }}>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Symbol</th>
                  <th>p(symbol)</th>
                  <th>Sub-range of parent</th>
                  <th>New interval</th>
                  <th>Width</th>
                </tr>
              </thead>
              <tbody>
                {trace.steps.slice(0, step).map((entry, index) => (
                  <tr key={index}>
                    <td>{index + 1}</td>
                    <td>{entry.symbol}</td>
                    <td>{entry.probability.toFixed(4)}</td>
                    <td>[{entry.rangeLo.toFixed(4)}, {entry.rangeHi.toFixed(4)})</td>
                    <td>[{entry.lo.toFixed(6)}, {entry.hi.toFixed(6)})</td>
                    <td>{Math.max(0, entry.hi - entry.lo).toExponential(3)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h5>Decode the emitted bits</h5>
          <p className="it-body-block" style={{ marginBottom: 'var(--space-2)' }}>
            The shortest binary fraction inside the final interval is{' '}
            <b style={{ color: 'var(--color-accent-2-700)' }}>{encoded ? encoded.bits : '—'}</b>. Feeding it
            back through the same model with the known length {text.length} recovers:
          </p>
          <p>
            Decoded: <b style={{ color: 'var(--color-accent-700)' }}>{decoded || '(none)'}</b>{' '}
            <span className="tag tag-accent">{matches ? 'exact match' : 'mismatch'}</span>
          </p>
        </>
      )}

      <h4 style={{ marginTop: 'var(--space-6)' }}>Fixed versus adaptive</h4>
      <p className="it-body-block">
        With a fixed distribution the subdivision points never move. The adaptive model re-estimates them
        after every symbol, so probabilities track the message as it unfolds — the same machinery as an
        adaptive arithmetic coder, and the reason no distribution has to be sent in advance.
      </p>
    </LecturePage>
  );
};

export default ArithmeticCodingPage;
