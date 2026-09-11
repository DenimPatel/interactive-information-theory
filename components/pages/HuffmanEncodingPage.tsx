import React, { useMemo, useState } from 'react';
import LecturePage from '../shell/LecturePage';
import Formula from '../ui/Formula';
import Quiz, { type QuizQuestion } from '../quiz/Quiz';
import { processHuffmanEncoding, layoutHuffmanTree } from '../../utils/huffman';
import { FORMULAS } from '../../content/formulas';

const F = FORMULAS.huffman;

const QUESTIONS: QuizQuestion[] = [
  {
    id: 'prefix-free',
    kind: 'choice',
    prompt: 'What makes a symbol code uniquely decodable?',
    options: [
      { label: 'All codewords have equal length' },
      { label: 'No codeword is a prefix of another', correct: true },
      { label: 'Every codeword contains a 1' },
      { label: 'The code is sorted by frequency' },
    ],
    explanation: 'Prefix-freedom lets the decoder recognise a complete codeword as soon as it arrives.',
  },
  {
    id: 'expected-length',
    kind: 'numeric',
    prompt:
      'For probabilities (0.5, 0.25, 0.25), a Huffman code gives lengths (1, 2, 2). What is the expected length L?',
    answer: 1.5,
    tolerance: 1e-6,
    unit: 'bits',
    explanation: 'L = 0.5×1 + 0.25×2 + 0.25×2 = 1.5 bits.',
  },
  {
    id: 'bounds',
    kind: 'choice',
    prompt: 'For an optimal prefix code, how does the expected length L compare with H(X)?',
    options: [
      { label: 'L = H(X) exactly, always' },
      { label: 'H(X) ≤ L < H(X) + 1', correct: true },
      { label: 'L can be far below H(X)' },
      { label: 'L is always an integer multiple of H(X)' },
    ],
    explanation: 'Shannon’s source-coding bound: an optimal symbol code is within one bit of the entropy.',
  },
];

const HuffmanEncodingPage: React.FC = () => {
  const [text, setText] = useState<string>('banana');

  const result = useMemo(() => processHuffmanEncoding(text), [text]);
  const layout = useMemo(() => layoutHuffmanTree(result.treeRoot), [result.treeRoot]);

  const entropy = useMemo(() => {
    const total = result.frequencies.reduce((sum, item) => sum + item.freq, 0);
    if (total === 0) return 0;
    return result.frequencies.reduce((sum, item) => {
      const p = item.freq / total;
      return sum - p * Math.log2(p);
    }, 0);
  }, [result.frequencies]);

  const stats = result.stats;
  const ratio = stats && stats.originalSizeBits > 0
    ? `${((stats.compressedSizeBits / stats.originalSizeBits) * 100).toFixed(1)}%`
    : '—';

  const display = (c: string) => (c === ' ' ? '␣' : c);

  return (
    <LecturePage slug="huffman" quiz={<Quiz slug="huffman" questions={QUESTIONS} />}>
      <p className="it-body-block">
        A lossless compression algorithm assigning shorter prefix codes to more frequent characters
        (David Huffman, 1952).
      </p>

      <div className="field" style={{ maxWidth: 520, margin: 'var(--space-4) 0 var(--space-5) 0' }}>
        <label>Text to encode</label>
        <textarea className="input" rows={3} value={text} onChange={(event) => setText(event.target.value)} />
      </div>

      {result.treeRoot ? (
        <>
          <h5>Tree</h5>
          <div style={{ overflowX: 'auto', marginBottom: 'var(--space-5)' }}>
            <svg width={layout.width} height={layout.height}>
              {layout.edges.map((edge, index) => (
                <g key={index}>
                  <line x1={edge.x1} y1={edge.y1} x2={edge.x2} y2={edge.y2} stroke="var(--color-divider)" strokeWidth={1.5} />
                  <text x={edge.lx} y={edge.ly} fontSize={10} fill="var(--color-text)" opacity={0.6}>{edge.label}</text>
                </g>
              ))}
              {layout.nodes.map((node) => (
                <g key={node.id}>
                  <circle
                    cx={node.x} cy={node.y} r={18}
                    fill={node.char !== null ? 'var(--color-accent-100)' : 'var(--color-neutral-200)'}
                    stroke={node.char !== null ? 'var(--color-accent-700)' : 'var(--color-neutral-700)'}
                    strokeWidth={2}
                  />
                  <text
                    x={node.x} y={node.y + 4} fontSize={10} textAnchor="middle"
                    fill={node.char !== null ? 'var(--color-accent-700)' : 'var(--color-neutral-700)'}
                  >
                    {node.char !== null ? `${display(node.char)} ${node.freq}` : node.freq}
                  </text>
                </g>
              ))}
            </svg>
          </div>
        </>
      ) : null}

      <div style={{ display: 'flex', gap: 'var(--space-8)', flexWrap: 'wrap', marginBottom: 'var(--space-5)' }}>
        <div>
          <h5 style={{ marginBottom: 'var(--space-2)' }}>Frequency Analysis</h5>
          <table className="table" style={{ width: 'auto' }}>
            <tbody>
              {result.frequencies.map((item) => (
                <tr key={`freq-${item.char}`}>
                  <td style={{ color: 'var(--color-accent-700)' }}>{display(item.char)}</td>
                  <td>{item.freq}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div>
          <h5 style={{ marginBottom: 'var(--space-2)' }}>Huffman Codes</h5>
          <table className="table" style={{ width: 'auto' }}>
            <tbody>
              {result.codes.map((item) => (
                <tr key={`code-${item.char}`}>
                  <td style={{ color: 'var(--color-accent-700)' }}>{display(item.char)}</td>
                  <td style={{ color: 'var(--color-accent-2-700)' }}>{item.code}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <h5>Encoded Output</h5>
      <p style={{ maxWidth: 640, wordBreak: 'break-all', color: 'var(--color-accent-2-700)', fontStyle: 'italic' }}>
        {result.encodedString || '(none)'}
      </p>

      <div style={{ display: 'flex', gap: 'var(--space-6)', flexWrap: 'wrap', margin: 'var(--space-4) 0 var(--space-4) 0' }}>
        <div>Unique chars<br /><b>{stats?.uniqueChars ?? 0}</b></div>
        <div>Original bits<br /><b>{stats?.originalSizeBits ?? 0}</b></div>
        <div>Compressed bits<br /><b>{stats?.compressedSizeBits ?? 0}</b></div>
        <div>Ratio<br /><b style={{ color: 'var(--color-accent-700)' }}>{ratio}</b></div>
        <div>Entropy H(X)<br /><b style={{ color: 'var(--color-accent-700)' }}>{entropy.toFixed(3)}</b></div>
        <div>Expected length L<br /><b style={{ color: 'var(--color-accent-2-700)' }}>{stats ? stats.averageCodeLength.toFixed(3) : '—'}</b></div>
      </div>

      <Formula tex={F.expectedLength} note="average bits per symbol" label="Expected code length" />
      <Formula tex={F.bounds} note="Shannon’s source-coding bound for an optimal prefix code" label="Entropy lower-bounds the expected length" />
      <Formula tex={F.kraft} note="the Kraft inequality every prefix code satisfies" label="Kraft inequality" />

      <h4>How It Works</h4>
      <ol style={{ maxWidth: 640, paddingLeft: 20 }}>
        <li>Calculate character frequencies.</li>
        <li>Create a leaf node per character in a priority queue by frequency.</li>
        <li>Repeatedly merge the two lowest-frequency nodes until one remains.</li>
        <li>Assign 0/1 for left/right branches; the root-to-leaf path is each character&rsquo;s code.</li>
        <li>Replace each character in the text with its code.</li>
      </ol>
      <p className="text-muted" style={{ maxWidth: 640 }}>
        Codes are variable-length, prefix-free, lossless, and optimal for symbol-by-symbol encoding
        given a known frequency distribution.
      </p>
    </LecturePage>
  );
};

export default HuffmanEncodingPage;
