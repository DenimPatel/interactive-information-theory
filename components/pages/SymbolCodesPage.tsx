import React, { useState } from 'react';
import LecturePage from '../shell/LecturePage';
import Formula from '../ui/Formula';
import Quiz, { type QuizQuestion } from '../quiz/Quiz';
import Slider from '../Slider';
import MetricRow from '../MetricRow';
import Callout from '../ui/Callout';

const ALPHABET = ['a', 'b', 'c', 'd'] as const;
type Letter = (typeof ALPHABET)[number];

const SEGMENT_COLORS = [
  'var(--color-accent-600)',
  'var(--color-accent-2-600)',
  'var(--color-accent-400)',
  'var(--color-neutral-500)',
];

const DEFAULT_CODES: Record<Letter, string> = { a: '0', b: '10', c: '110', d: '111' };
const DEFAULT_PROBS = [0.4, 0.3, 0.2, 0.1];

const QUESTIONS: QuizQuestion[] = [
  {
    id: 'kraft-value',
    kind: 'numeric',
    prompt: 'What is the Kraft sum for codeword lengths (1, 2, 3, 3)?',
    answer: 1,
    tolerance: 1e-6,
    explanation: '2^-1 + 2^-2 + 2^-3 + 2^-3 = 0.5 + 0.25 + 0.125 + 0.125 = 1.',
  },
  {
    id: 'kraft-condition',
    kind: 'choice',
    prompt: 'Given lengths satisfying the Kraft inequality, what is guaranteed?',
    options: [
      { label: 'The specific code you wrote is prefix-free' },
      { label: 'A prefix code with those lengths exists', correct: true },
      { label: 'The expected length is below the entropy' },
      { label: 'The code is optimal' },
    ],
    explanation:
      'Kraft is necessary and sufficient for the existence of a prefix code with those lengths, but a particular assignment can still violate prefix-freedom.',
  },
  {
    id: 'expected-length',
    kind: 'numeric',
    prompt: 'For probabilities (0.5, 0.25, 0.25) and lengths (1, 2, 2), what is the expected length L in bits?',
    answer: 1.5,
    tolerance: 1e-6,
    unit: 'bits',
    explanation: 'L = 0.5×1 + 0.25×2 + 0.25×2 = 1.5 bits.',
  },
  {
    id: 'prefix-free-pick',
    kind: 'choice',
    prompt: 'Which set of codewords is prefix-free?',
    options: [
      { label: '0, 01, 011, 0111' },
      { label: '0, 10, 110, 111', correct: true },
      { label: '00, 01, 10, 11' },
      { label: '1, 11, 111, 1111' },
    ],
    explanation:
      'In 0, 10, 110, 111 no codeword is the start of another, so a decoder can always tell where one ends.',
  },
];

const SymbolCodesPage: React.FC = () => {
  const [codes, setCodes] = useState<Record<Letter, string>>(DEFAULT_CODES);
  const [probs, setProbs] = useState<number[]>(DEFAULT_PROBS);

  const totalWeight = probs.reduce((sum, weight) => sum + Math.max(0, weight), 0);
  const normalized = probs.map((weight) =>
    totalWeight > 0 ? Math.max(0, weight) / totalWeight : 1 / probs.length,
  );

  const entries = ALPHABET.map((letter, index) => {
    const code = codes[letter];
    const length = code.length;
    return {
      letter,
      index,
      code,
      length,
      cost: 2 ** -length,
      probability: normalized[index],
    };
  });

  const kraft = entries.reduce((sum, entry) => sum + entry.cost, 0);
  const expectedLength = entries.reduce((sum, entry) => sum + entry.probability * entry.length, 0);

  let entropy = 0;
  for (const probability of normalized) {
    if (probability > 0) entropy -= probability * Math.log2(probability);
  }
  if (entropy < 1e-9) entropy = 0;

  const violations: { prefix: Letter; suffix: Letter; duplicate: boolean }[] = [];
  for (let i = 0; i < entries.length; i++) {
    for (let j = 0; j < entries.length; j++) {
      if (i === j) continue;
      const first = entries[i].code;
      const second = entries[j].code;
      if (first.length === 0 || second.length === 0) continue;
      if (first === second) {
        if (i < j) violations.push({ prefix: ALPHABET[i], suffix: ALPHABET[j], duplicate: true });
      } else if (second.startsWith(first)) {
        violations.push({ prefix: ALPHABET[i], suffix: ALPHABET[j], duplicate: false });
      }
    }
  }

  const emptyCodes = entries.filter((entry) => entry.length === 0).map((entry) => entry.letter);
  const isPrefixFree = violations.length === 0 && emptyCodes.length === 0;
  const kraftPass = kraft <= 1 + 1e-9;
  const lowerBoundOk = expectedLength >= entropy - 1e-9;
  const upperBoundOk = expectedLength < entropy + 1;

  const budgetMax = Math.max(1, kraft);
  let offset = 0;
  const segments = entries.map((entry) => {
    const segment = { ...entry, offset };
    offset += entry.cost;
    return segment;
  });

  const updateCode = (letter: Letter, raw: string): void => {
    const cleaned = raw.replace(/[^01]/g, '');
    setCodes((previous) => {
      const next = { ...previous };
      next[letter] = cleaned;
      return next;
    });
  };

  const updateProb = (index: number, value: number): void => {
    setProbs((previous) => previous.map((weight, i) => (i === index ? value : weight)));
  };

  return (
    <LecturePage slug="symbol-codes" quiz={<Quiz slug="symbol-codes" questions={QUESTIONS} />}>
      <p className="it-body-block">
        A symbol code assigns a binary codeword to each outcome. Prefix-free codes decode instantly,
        and the Kraft inequality bounds how short the codewords can collectively be.
      </p>
      <Formula tex="\sum_i 2^{-\ell_i} \le 1" note="the Kraft inequality" label="Kraft inequality for codeword lengths" />
      <Formula tex="L = \sum_i p_i \ell_i" note="average bits per symbol" label="Expected code length" />
      <Formula tex="H(X) \le L < H(X) + 1" note="the source-coding bound for an optimal prefix code" label="Entropy bounds the expected length" />

      <h4>Your Code</h4>
      <div style={{ display: 'flex', gap: 'var(--space-4)', flexWrap: 'wrap', marginBottom: 'var(--space-4)' }}>
        {ALPHABET.map((letter) => (
          <div className="field" key={letter} style={{ maxWidth: 120, flex: 1 }}>
            <label>{letter} codeword</label>
            <input
              className="input"
              value={codes[letter]}
              onChange={(event) => updateCode(letter, event.target.value)}
              aria-label={`Codeword for ${letter}`}
            />
          </div>
        ))}
      </div>
      <p className="text-muted" style={{ maxWidth: 640, marginBottom: 'var(--space-4)' }}>
        Codewords may contain only 0 and 1. Non-binary characters are ignored.
      </p>

      <h4>Symbol Probabilities</h4>
      <div style={{ display: 'flex', gap: 'var(--space-4)', flexWrap: 'wrap', marginBottom: 'var(--space-4)' }}>
        {ALPHABET.map((letter, index) => (
          <Slider
            key={letter}
            label={`Weight of ${letter}`}
            valueLabel={normalized[index].toFixed(3)}
            value={probs[index]}
            min={0}
            max={1}
            step={0.01}
            onChange={(value) => updateProb(index, value)}
            accentColor={SEGMENT_COLORS[index]}
            style={{ maxWidth: 200, flex: 1 }}
          />
        ))}
      </div>
      <p className="text-muted" style={{ marginBottom: 'var(--space-4)' }}>
        Weights are normalised automatically. Total weight: {totalWeight.toFixed(2)}.
      </p>

      <h4>Kraft Budget</h4>
      <div
        style={{
          position: 'relative',
          height: 24,
          background: 'var(--color-surface)',
          borderRadius: 'var(--radius-sm)',
          overflow: 'hidden',
          maxWidth: 640,
          marginBottom: 'var(--space-2)',
        }}
      >
        {segments.map((segment) =>
          segment.cost > 0 ? (
            <div
              key={segment.letter}
              style={{
                position: 'absolute',
                top: 0,
                height: '100%',
                left: `${(segment.offset / budgetMax) * 100}%`,
                width: `${(segment.cost / budgetMax) * 100}%`,
                background: SEGMENT_COLORS[segment.index],
              }}
            />
          ) : null,
        )}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: `${(1 / budgetMax) * 100}%`,
            width: 2,
            height: '100%',
            background: 'var(--color-text)',
          }}
        />
      </div>
      <p style={{ maxWidth: 640, marginBottom: 'var(--space-2)' }}>
        Kraft sum Σ 2^-l = <b style={{ color: kraftPass ? 'var(--color-accent-700)' : 'var(--color-accent-2-700)' }}>{kraft.toFixed(4)}</b>{' '}
        <span className={`tag ${kraftPass ? 'tag-accent' : 'tag-accent-2'}`}>{kraftPass ? 'within budget' : 'over budget'}</span>
      </p>
      <p className="text-muted" style={{ maxWidth: 640, marginBottom: 'var(--space-4)' }}>
        The black line marks the budget of 1; the coloured segments are each symbol&rsquo;s 2^-l contribution.
      </p>

      <h4>Prefix-Free Check</h4>
      {isPrefixFree ? (
        <Callout title="Prefix-free">
          No codeword is a prefix of another, so every encoded stream decodes uniquely as it is read.
        </Callout>
      ) : (
        <Callout title="Not prefix-free" tone="warn">
          {emptyCodes.length > 0 ? (
            <div>
              Empty codeword{emptyCodes.length > 1 ? 's' : ''} for {emptyCodes.join(', ')} — every codeword
              is then a prefix of the empty string.
            </div>
          ) : null}
          {violations.map((violation, index) => (
            <div key={index}>
              {violation.duplicate
                ? `${violation.prefix} and ${violation.suffix} share the same codeword "${codes[violation.suffix]}".`
                : `Codeword for ${violation.prefix} ("${codes[violation.prefix]}") is a prefix of ${violation.suffix} ("${codes[violation.suffix]}").`}
            </div>
          ))}
        </Callout>
      )}

      <h4>Cost and Bounds</h4>
      <div style={{ display: 'flex', gap: 'var(--space-8)', flexWrap: 'wrap', maxWidth: 720, margin: 'var(--space-3) 0 var(--space-4) 0' }}>
        <div style={{ minWidth: 220, flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <MetricRow label="Entropy H(X)" value={`${entropy.toFixed(4)} bits`} valueColor="var(--color-accent-700)" />
          <MetricRow label="Expected length L" value={`${expectedLength.toFixed(4)} bits`} valueColor="var(--color-accent-2-700)" />
          <MetricRow label="Lower bound H(X) ≤ L" value={lowerBoundOk ? 'holds' : 'violated'} valueColor={lowerBoundOk ? 'var(--color-accent-700)' : 'var(--color-accent-2-700)'} />
          <MetricRow label="Upper bound L < H(X) + 1" value={upperBoundOk ? 'holds' : 'violated'} valueColor={upperBoundOk ? 'var(--color-accent-700)' : 'var(--color-accent-2-700)'} />
        </div>
        <div style={{ minWidth: 320, flex: 2 }}>
          <table className="table">
            <thead>
              <tr>
                <th>Symbol</th>
                <th>P(x)</th>
                <th>Codeword</th>
                <th>Length l</th>
                <th>2^-l</th>
                <th>p·l</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={entry.letter}>
                  <td style={{ color: SEGMENT_COLORS[entry.index] }}>{entry.letter}</td>
                  <td>{entry.probability.toFixed(3)}</td>
                  <td style={{ color: 'var(--color-accent-2-700)' }}>{entry.code || '(empty)'}</td>
                  <td>{entry.length}</td>
                  <td>{entry.cost.toFixed(4)}</td>
                  <td>{(entry.probability * entry.length).toFixed(4)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <p className="text-muted" style={{ maxWidth: 640 }}>
        A prefix-free code always satisfies L ≥ H(X); an optimal one is also within one bit, L &lt; H(X) + 1.
        Kraft holds for the lengths even when the particular codewords you typed are not prefix-free.
      </p>
    </LecturePage>
  );
};

export default SymbolCodesPage;
