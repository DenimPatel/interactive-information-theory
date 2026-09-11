import React, { useMemo, useState } from 'react';
import LecturePage from '../shell/LecturePage';
import Formula from '../ui/Formula';
import { Math as MathTex } from '../math/Math';
import Quiz, { type QuizQuestion } from '../quiz/Quiz';
import Toggle from '../ui/Toggle';
import SegmentedControl from '../ui/SegmentedControl';
import Callout from '../ui/Callout';
import { Axis, Curve, Legend, Plot } from '../chart';

const QUESTIONS: QuizQuestion[] = [
  {
    id: 'syndrome-purpose',
    kind: 'choice',
    prompt: 'What does the transmitted syndrome let the receiver determine?',
    options: [
      { label: 'The sender’s identity' },
      { label: 'Which single bit differs between the message and the side information', correct: true },
      { label: 'The channel capacity' },
      { label: 'Nothing — it is redundant' },
    ],
    explanation:
      'The syndrome Hx combined with the side information y gives He, and the columns of H are distinct, so the error pattern is identified exactly.',
  },
  {
    id: 'candidate-count',
    kind: 'numeric',
    prompt:
      'A 3-bit message is corrupted by at most one bit flip. Without side information, how many messages are still consistent with the received copy?',
    answer: 4,
    tolerance: 1e-9,
    unit: 'messages',
    explanation:
      'The received word could have come from itself (no error) or from flipping any one of its three bits — four candidates.',
  },
  {
    id: 'syndrome-bits',
    kind: 'numeric',
    prompt: 'How many syndrome bits are needed to identify any single-bit error among three message bits?',
    answer: 2,
    tolerance: 1e-9,
    unit: 'bits',
    explanation: 'There are four error patterns (none plus three single flips), and 2 bits distinguish four states.',
  },
  {
    id: 'why-side-info',
    kind: 'choice',
    prompt: 'Why can a tiny syndrome buy error-free communication here?',
    options: [
      { label: 'It adds redundancy to every message bit' },
      { label: 'It restricts the message to a coset of only four possibilities', correct: true },
      { label: 'It slows the channel down' },
      { label: 'It makes the channel noiseless' },
    ],
    explanation:
      'Side information already pins the message to a small coset; the syndrome merely says which member of the coset was sent.',
  },
];

// Parity-check matrix H for GF(2)^3: columns (1,0), (0,1), (1,1) are distinct,
// so the syndrome of any unit error identifies its position.
const syndromeOf = (bits: number[]): [number, number] => [bits[0] ^ bits[2], bits[1] ^ bits[2]];

const decodeError = (s: [number, number]): number[] => {
  if (s[0] === 0 && s[1] === 0) return [0, 0, 0];
  if (s[0] === 1 && s[1] === 0) return [1, 0, 0];
  if (s[0] === 0 && s[1] === 1) return [0, 1, 0];
  return [0, 0, 1];
};

const withFlip = (bits: number[], index: number): number[] => {
  if (index < 0) return bits.slice();
  const out = bits.slice();
  out[index] ^= 1;
  return out;
};

type NoiseChoice = 'none' | '0' | '1' | '2';

const CodingGemPage: React.FC = () => {
  const [message, setMessage] = useState<number[]>([1, 0, 1]);
  const [noise, setNoise] = useState<NoiseChoice>('0');
  const [useSideInfo, setUseSideInfo] = useState<boolean>(true);

  const errorIndex = noise === 'none' ? -1 : Number(noise);
  const received = withFlip(message, errorIndex);
  const syndrome = syndromeOf(message);
  const receivedSyndrome = syndromeOf(received);
  const decodedError = decodeError([syndrome[0] ^ receivedSyndrome[0], syndrome[1] ^ receivedSyndrome[1]]);
  const recovered = withFlip(received, decodedError.findIndex((value) => value === 1));

  const sideInfoCorrect = recovered.every((value, index) => value === message[index]);
  const naiveCorrect = received.every((value, index) => value === message[index]);

  const candidates = useMemo(() => {
    const list: number[][] = [received.slice()];
    for (let index = 0; index < 3; index += 1) list.push(withFlip(received, index));
    return list;
  }, [received]);

  const curves = useMemo(() => {
    const noInfo: { x: number; y: number }[] = [];
    const info: { x: number; y: number }[] = [];
    for (let i = 0; i <= 100; i += 1) {
      const p = i / 100;
      const clean = (1 - p) ** 3;
      const atMostOne = clean + 3 * p * (1 - p) ** 2;
      noInfo.push({ x: p, y: clean });
      info.push({ x: p, y: atMostOne });
    }
    return { noInfo, info };
  }, []);

  const toggleMessage = (index: number) => (checked: boolean) => {
    setMessage((prev) => prev.map((bit, i) => (i === index ? (checked ? 1 : 0) : bit)));
  };

  return (
    <LecturePage slug="coding-gem" quiz={<Quiz slug="coding-gem" questions={QUESTIONS} />}>
      <p className="it-body-block">
        MacKay&rsquo;s gem: the sender and receiver already share a little side information. A noisy
        channel would leave the receiver guessing, but a tiny syndrome — a few parity bits — combines
        with the side information to pin the message down exactly.
      </p>

      <Callout title="The setting" tone="info">
        Alice wants Bob to learn a 3-bit message <b>x</b>. Bob already holds a noisy copy <b>y</b> of
        it (his side information), differing in at most one bit, but Bob cannot tell where. Alice adds a
        2-bit syndrome <MathTex tex="\mathbf{s} = H\mathbf{x}" /> so that Bob can recover{' '}
        <b>x</b> with certainty.
      </Callout>

      <h4>Choose the message, then the noise</h4>
      <div style={{ display: 'flex', gap: 'var(--space-6)', flexWrap: 'wrap', margin: 'var(--space-4) 0' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          <div className="text-muted" style={{ fontSize: 12 }}>Message bits x</div>
          {message.map((bit, index) => (
            <Toggle
              key={index}
              label={`x${index + 1} = ${bit}`}
              checked={bit === 1}
              onChange={toggleMessage(index)}
            />
          ))}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <SegmentedControl<NoiseChoice>
            label="Channel noise (which bit of Bob’s copy flips)"
            name="coding-gem-noise"
            value={noise}
            onChange={setNoise}
            options={[
              { value: 'none', label: 'none' },
              { value: '0', label: 'bit 1' },
              { value: '1', label: 'bit 2' },
              { value: '2', label: 'bit 3' },
            ]}
          />
          <Toggle
            label="Alice also sends the syndrome (side information used)"
            checked={useSideInfo}
            onChange={setUseSideInfo}
          />
        </div>
      </div>

      <div style={{ display: 'flex', gap: 'var(--space-8)', flexWrap: 'wrap', margin: 'var(--space-4) 0' }}>
        <div>
          <div className="text-muted" style={{ fontSize: 12 }}>Message x</div>
          <b style={{ fontFamily: 'monospace', fontSize: 18 }}>{message.join(' ')}</b>
        </div>
        <div>
          <div className="text-muted" style={{ fontSize: 12 }}>Bob’s side info y</div>
          <b style={{ fontFamily: 'monospace', fontSize: 18, color: 'var(--color-accent-2-700)' }}>{received.join(' ')}</b>
        </div>
        {useSideInfo ? (
          <>
            <div>
              <div className="text-muted" style={{ fontSize: 12 }}>Syndrome s = Hx</div>
              <b style={{ fontFamily: 'monospace', fontSize: 18 }}>{syndrome.join(' ')}</b>
            </div>
            <div>
              <div className="text-muted" style={{ fontSize: 12 }}>Recovered error e</div>
              <b style={{ fontFamily: 'monospace', fontSize: 18 }}>{decodedError.join(' ')}</b>
            </div>
            <div>
              <div className="text-muted" style={{ fontSize: 12 }}>Bob recovers x̂ = y ⊕ e</div>
              <b style={{ fontFamily: 'monospace', fontSize: 18, color: sideInfoCorrect ? 'var(--color-accent-700)' : 'var(--color-accent-2-700)' }}>
                {recovered.join(' ')}
              </b>
            </div>
          </>
        ) : null}
      </div>

      <p style={{ fontSize: 16 }}>
        {useSideInfo ? (
          <span style={{ color: 'var(--color-accent-700)' }}>
            <b>Decoded exactly.</b> The syndrome resolves which bit of Bob&rsquo;s copy is wrong.
          </span>
        ) : naiveCorrect ? (
          <span style={{ color: 'var(--color-accent-700)' }}>
            <b>Correct by luck:</b> the channel happened to leave the copy untouched.
          </span>
        ) : (
          <span style={{ color: 'var(--color-accent-2-700)' }}>
            <b>Ambiguous:</b> without the syndrome Bob cannot tell which bit flipped.
          </span>
        )}
      </p>

      {!useSideInfo && !naiveCorrect ? (
        <div style={{ marginBottom: 'var(--space-4)' }}>
          <div className="text-muted" style={{ fontSize: 12, marginBottom: 4 }}>
            Messages still consistent with y (a coset of four):
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
            {candidates.map((candidate, index) => (
              <span key={index} className="tag tag-neutral" style={{ fontFamily: 'monospace' }}>
                {candidate.join('')}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      <h4>Error probability with and without side information</h4>
      <p className="it-body-block">
        Let each of the three message bits flip independently with probability p. Using the corrupted
        copy alone, Bob is correct only when no bit flips. With the syndrome, Bob is correct whenever the
        copy has at most one error — the syndrome resolves that single error.
      </p>
      <Plot
        xDomain={[0, 1]}
        yDomain={[0, 1]}
        title="Probability the receiver recovers the message exactly"
        desc="The lower curve is decoding from the corrupted copy alone, which fails as soon as any bit flips. The upper curve uses the transmitted syndrome and tolerates a single flipped bit."
        height={280}
      >
        <Axis orient="left" label="P(exact recovery)" ticks={[0, 0.25, 0.5, 0.75, 1]} />
        <Axis orient="bottom" label="per-bit flip probability p" ticks={[0, 0.25, 0.5, 0.75, 1]} />
        <Curve points={curves.info} color="var(--color-accent-700)" />
        <Curve points={curves.noInfo} color="var(--color-accent-2-700)" dashed />
      </Plot>
      <Legend
        items={[
          { label: 'With syndrome (side information)', color: 'var(--color-accent-700)' },
          { label: 'Copy alone', color: 'var(--color-accent-2-700)', dashed: true },
        ]}
      />

      <h4>Why it works</h4>
      <Formula
        tex="\mathbf{y} + \{\mathbf{0}, \mathbf{e}_1, \mathbf{e}_2, \mathbf{e}_3\}"
        note="the four candidates the side information leaves, a coset of the error patterns"
        label="Candidate messages form a coset"
      />
      <p className="it-body-block">
        Bob&rsquo;s copy already confines the message to that coset — four candidates differing in one
        bit. A 2-bit syndrome is enough to say which member of the coset was sent, because{' '}
        <MathTex tex="H\mathbf{e}" /> takes four distinct values on those four patterns. A little side
        information plus a little parity turns detection into correction.
      </p>
    </LecturePage>
  );
};

export default CodingGemPage;
