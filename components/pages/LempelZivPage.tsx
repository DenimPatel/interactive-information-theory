import React, { useEffect, useMemo, useState } from 'react';
import LecturePage from '../shell/LecturePage';
import Formula from '../ui/Formula';
import Quiz, { type QuizQuestion } from '../quiz/Quiz';
import MetricRow from '../MetricRow';
import SimControls from '../ui/SimControls';
import Callout from '../ui/Callout';
import { Axis, Curve, Legend, Plot } from '../chart';
import { useAnimationLoop } from '../../hooks/useAnimationLoop';

interface LzPhrase {
  index: number;
  char: string;
  entry: string;
  start: number;
  end: number;
  dictSize: number;
  terminal: boolean;
}

const displayChar = (ch: string): string => (ch === ' ' ? '␣' : ch === '' ? '∎' : ch);

const buildPhrases = (text: string): LzPhrase[] => {
  const dict = new Map<string, number>();
  const phrases: LzPhrase[] = [];
  let i = 0;
  while (i < text.length) {
    let match = '';
    let j = i;
    while (j < text.length) {
      const candidate = text.slice(i, j + 1);
      if (dict.has(candidate)) {
        match = candidate;
        j += 1;
      } else {
        break;
      }
    }
    const nextIndex = j;
    if (nextIndex >= text.length) {
      phrases.push({
        index: dict.get(match) ?? 0,
        char: '',
        entry: match,
        start: i,
        end: text.length,
        dictSize: dict.size,
        terminal: true,
      });
      break;
    }
    const char = text[nextIndex];
    const entry = match + char;
    const index = match === '' ? 0 : dict.get(match) ?? 0;
    dict.set(entry, dict.size + 1);
    phrases.push({ index, char, entry, start: i, end: nextIndex + 1, dictSize: dict.size, terminal: false });
    i = nextIndex + 1;
  }
  return phrases;
};

const empiricalEntropy = (text: string): number => {
  if (text.length === 0) return 0;
  const counts = new Map<string, number>();
  for (const ch of text) counts.set(ch, (counts.get(ch) ?? 0) + 1);
  let entropy = 0;
  for (const count of counts.values()) {
    const p = count / text.length;
    if (p > 0) entropy -= p * Math.log2(p);
  }
  return entropy;
};

const QUESTIONS: QuizQuestion[] = [
  {
    id: 'phrase-form',
    kind: 'choice',
    prompt: 'What does each LZ78 phrase emit?',
    options: [
      { label: 'A dictionary index plus the next character', correct: true },
      { label: 'A full Huffman codeword' },
      { label: 'The length and offset of the longest match' },
      { label: 'A single fixed-length byte' },
    ],
    explanation: 'Every phrase is (index of the longest known prefix, the character that follows it), and the pair becomes a new dictionary entry.',
  },
  {
    id: 'abababa',
    kind: 'numeric',
    prompt: 'For the input “abababa”, how many LZ78 phrases are emitted?',
    answer: 4,
    tolerance: 1e-6,
    unit: 'phrases',
    explanation: 'The parse is (0,a), (0,b), (1,b) → “ab”, (3,a) → “aba”: four phrases.',
  },
  {
    id: 'no-prior',
    kind: 'choice',
    prompt: 'Why does Lempel–Ziv need no prior symbol distribution?',
    options: [
      { label: 'It builds its dictionary from the input itself', correct: true },
      { label: 'It ignores probabilities entirely' },
      { label: 'It assumes all symbols are equally likely' },
      { label: 'It is told the entropy in advance' },
    ],
    explanation: 'The dictionary is learned online, so the code adapts to whatever repetition the source happens to contain.',
  },
  {
    id: 'lower-bound',
    kind: 'choice',
    prompt: 'For a long input, the compressed size of a good LZ scheme approaches…',
    options: [
      { label: 'The source entropy (the information-theoretic lower bound)', correct: true },
      { label: 'The number of distinct symbols' },
      { label: 'Zero bits' },
      { label: 'The length of the input in characters' },
    ],
    explanation: 'As the dictionary captures longer and longer repeated phrases, the rate per symbol tends to the source entropy.',
  },
];

const LempelZivPage: React.FC = () => {
  const [text, setText] = useState<string>('abracadabra');
  const [step, setStep] = useState<number>(0);

  const phrases = useMemo(() => buildPhrases(text), [text]);
  const total = phrases.length;

  const loop = useAnimationLoop({
    tick: () => setStep((current) => (current < total ? current + 1 : current)),
    onReset: () => setStep(0),
    initialSpeed: 2,
  });

  useEffect(() => {
    setStep(0);
  }, [phrases]);

  useEffect(() => {
    if (total > 0 && step >= total && loop.running) loop.pause();
  }, [step, total, loop.running, loop.pause]);

  const alphabet = useMemo(() => Array.from(new Set(text)), [text]);
  const n = text.length;
  const entropy = useMemo(() => empiricalEntropy(text), [text]);
  const entropyBound = entropy * n;
  const symbolBits = alphabet.length <= 1 ? 0 : Math.ceil(Math.log2(alphabet.length));

  const visible = phrases.slice(0, step);
  const phraseBits = (phrase: LzPhrase): number =>
    (phrase.terminal ? 0 : symbolBits) + (phrase.index > 0 ? Math.ceil(Math.log2(phrase.index + 1)) : 0);

  const cumulativeBits: number[] = [0];
  for (const phrase of visible) {
    cumulativeBits.push(cumulativeBits[cumulativeBits.length - 1] + phraseBits(phrase));
  }
  const compressedBits = cumulativeBits[cumulativeBits.length - 1];
  const compressedPoints = cumulativeBits.map((bits, k) => ({
    x: k === 0 ? 0 : phrases[k - 1].end,
    y: bits,
  }));
  const entropyPoints = compressedPoints.map((point) => ({ x: point.x, y: entropy * point.x }));
  const yMax = Math.max(1, compressedBits, entropyBound);

  const ratio = entropyBound > 0 ? compressedBits / entropyBound : null;

  return (
    <LecturePage slug="lempel-ziv" quiz={<Quiz slug="lempel-ziv" questions={QUESTIONS} />}>
      <p className="it-body-block">
        Lempel–Ziv compresses by replacing repeated substrings with references to a dictionary it builds on
        the fly. No symbol distribution is needed: the input teaches the encoder its own structure.
      </p>
      <Formula
        tex="(\text{index of longest match},\ \text{next character})"
        note="the LZ78 phrase, added to the dictionary as a new entry"
        label="Lempel–Ziv phrase"
      />

      <h4>Build the dictionary</h4>
      <div className="field" style={{ maxWidth: 520, margin: 'var(--space-4) 0 var(--space-3) 0' }}>
        <label>Input string</label>
        <textarea className="input" rows={2} value={text} onChange={(event) => setText(event.target.value)} />
      </div>

      {total === 0 ? (
        <Callout title="Waiting for input" tone="info">
          Type a non-empty string to watch the greedy parser consume it one phrase at a time.
        </Callout>
      ) : (
        <>
          <SimControls loop={loop} runLabel="Run" speedRange={[1, 10]} />

          <h5 style={{ marginTop: 'var(--space-5)' }}>Emitted phrases</h5>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, maxWidth: 680, marginBottom: 'var(--space-4)' }}>
            {visible.map((phrase, index) => (
              <span className="tag tag-neutral" key={index}>
                {index + 1}. ({phrase.index}, {displayChar(phrase.char)})
              </span>
            ))}
            {visible.length === 0 ? <span className="text-muted">Press Step or Run to emit the first phrase.</span> : null}
          </div>

          <div style={{ display: 'flex', gap: 'var(--space-8)', flexWrap: 'wrap', marginBottom: 'var(--space-5)' }}>
            <div>
              <h5 style={{ marginBottom: 'var(--space-2)' }}>Growing dictionary</h5>
              <div style={{ maxHeight: 220, overflowY: 'auto' }}>
                <table className="table" style={{ width: 'auto', minWidth: 220 }}>
                  <thead>
                    <tr>
                      <th>Index</th>
                      <th>Entry</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visible.map((phrase, index) =>
                      phrase.terminal ? null : (
                        <tr key={`dict-${index}`}>
                          <td>{phrase.dictSize}</td>
                          <td style={{ color: 'var(--color-accent-700)' }}>{displayChar(phrase.entry) || '␣'}</td>
                        </tr>
                      ),
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 260 }}>
              <MetricRow label="Phrases (tokens)" value={`${visible.length} / ${total}`} />
              <MetricRow label="Compressed bits (estimate)" value={`${compressedBits.toFixed(0)}`} valueColor="var(--color-accent-700)" />
              <MetricRow label="Source entropy lower bound" value={`${entropyBound.toFixed(2)}`} valueColor="var(--color-accent-2-700)" />
              <MetricRow label="Entropy per symbol" value={`${entropy.toFixed(3)} bits`} />
              <MetricRow label="Original symbols" value={n} />
              <MetricRow
                label="Compressed ÷ bound"
                value={ratio === null ? '—' : `${ratio.toFixed(2)}×`}
              />
            </div>
          </div>

          <Plot
            xDomain={[0, Math.max(1, n)]}
            yDomain={[0, yMax]}
            title="Compressed bits versus the entropy lower bound"
            desc="The solid step curve is the cumulative estimated compressed size as phrases are emitted; the dashed line is the source entropy times the symbols consumed so far."
            height={280}
          >
            <Axis orient="left" label="bits" />
            <Axis orient="bottom" label="symbols consumed" />
            <Curve points={entropyPoints} color="var(--color-accent-2-700)" dashed />
            <Curve points={compressedPoints} color="var(--color-accent-700)" />
          </Plot>
          <Legend
            items={[
              { label: 'Estimated compressed bits', color: 'var(--color-accent-700)' },
              { label: 'Entropy lower bound', color: 'var(--color-accent-2-700)', dashed: true },
            ]}
          />

          <p className="text-muted" style={{ maxWidth: 660 }}>
            The token count is exact; bit costs assume each index needs ⌈log₂(index+1)⌉ bits and each literal
            character needs ⌈log₂|alphabet|⌉ bits, so early phrases are cheap and later references pricey.
          </p>
        </>
      )}

      <h4 style={{ marginTop: 'var(--space-6)' }}>Reading the build</h4>
      <p className="it-body-block">
        At each step the parser finds the longest prefix of what remains that already exists in the
        dictionary, emits its index together with the following character, and stores that pair as the next
        entry. Repeated structure therefore costs a short reference instead of fresh characters — the
        dictionary is the compressed representation, learned directly from the data.
      </p>
    </LecturePage>
  );
};

export default LempelZivPage;
