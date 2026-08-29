import React, { useMemo, useState } from 'react';
import { processHuffmanEncoding, layoutHuffmanTree } from '../utils/huffman';

const HuffmanEncodingPage: React.FC = () => {
  const [text, setText] = useState<string>('banana');

  const result = useMemo(() => processHuffmanEncoding(text), [text]);
  const layout = useMemo(() => layoutHuffmanTree(result.treeRoot), [result.treeRoot]);

  const stats = result.stats;
  const ratio = stats && stats.originalSizeBits > 0
    ? `${((stats.compressedSizeBits / stats.originalSizeBits) * 100).toFixed(1)}%`
    : '—';

  const display = (c: string) => (c === ' ' ? '␣' : c);

  return (
    <section>
      <div className="card-kicker">Applications</div>
      <h2>Huffman Encoding</h2>
      <p className="text-muted" style={{ maxWidth: 640 }}>
        A lossless compression algorithm assigning shorter prefix codes to more frequent characters (David
        Huffman, 1952).
      </p>

      <div className="field" style={{ maxWidth: 520, margin: 'var(--space-4) 0 var(--space-5) 0' }}>
        <label>Text to encode</label>
        <textarea className="input" rows={3} value={text} onChange={(e) => setText(e.target.value)} />
      </div>

      {result.treeRoot && (
        <>
          <h5>Tree</h5>
          <div style={{ overflowX: 'auto', marginBottom: 'var(--space-5)' }}>
            <svg width={layout.width} height={layout.height}>
              {layout.edges.map((e, i) => (
                <g key={i}>
                  <line x1={e.x1} y1={e.y1} x2={e.x2} y2={e.y2} stroke="var(--color-divider)" strokeWidth={1.5} />
                  <text x={e.lx} y={e.ly} fontSize={10} fill="var(--color-text)" opacity={0.6}>{e.label}</text>
                </g>
              ))}
              {layout.nodes.map(n => (
                <g key={n.id}>
                  <circle
                    cx={n.x} cy={n.y} r={18}
                    fill={n.char !== null ? 'var(--color-accent-100)' : 'var(--color-neutral-200)'}
                    stroke={n.char !== null ? 'var(--color-accent-700)' : 'var(--color-neutral-700)'}
                    strokeWidth={2}
                  />
                  <text
                    x={n.x} y={n.y + 4} fontSize={10} textAnchor="middle"
                    fill={n.char !== null ? 'var(--color-accent-700)' : 'var(--color-neutral-700)'}
                  >
                    {n.char !== null ? `${display(n.char)} ${n.freq}` : n.freq}
                  </text>
                </g>
              ))}
            </svg>
          </div>
        </>
      )}

      <div style={{ display: 'flex', gap: 'var(--space-8)', flexWrap: 'wrap', marginBottom: 'var(--space-5)' }}>
        <div>
          <h5 style={{ marginBottom: 'var(--space-2)' }}>Frequency Analysis</h5>
          <table className="table" style={{ width: 'auto' }}>
            <tbody>
              {result.frequencies.map(f => (
                <tr key={`freq-${f.char}`}>
                  <td style={{ color: 'var(--color-accent-700)' }}>{display(f.char)}</td>
                  <td>{f.freq}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div>
          <h5 style={{ marginBottom: 'var(--space-2)' }}>Huffman Codes</h5>
          <table className="table" style={{ width: 'auto' }}>
            <tbody>
              {result.codes.map(c => (
                <tr key={`code-${c.char}`}>
                  <td style={{ color: 'var(--color-accent-700)' }}>{display(c.char)}</td>
                  <td style={{ color: 'var(--color-accent-2-700)' }}>{c.code}</td>
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

      <div style={{ display: 'flex', gap: 'var(--space-6)', flexWrap: 'wrap', margin: 'var(--space-4) 0 var(--space-6) 0' }}>
        <div>Unique chars<br /><b>{stats?.uniqueChars ?? 0}</b></div>
        <div>Original bits<br /><b>{stats?.originalSizeBits ?? 0}</b></div>
        <div>Compressed bits<br /><b>{stats?.compressedSizeBits ?? 0}</b></div>
        <div>Ratio<br /><b style={{ color: 'var(--color-accent-700)' }}>{ratio}</b></div>
      </div>

      <h4>How It Works</h4>
      <ol style={{ maxWidth: 640, paddingLeft: 20 }}>
        <li>Calculate character frequencies.</li>
        <li>Create a leaf node per character in a priority queue by frequency.</li>
        <li>Repeatedly merge the two lowest-frequency nodes until one remains.</li>
        <li>Assign 0/1 for left/right branches; root-to-leaf path is each character&rsquo;s code.</li>
        <li>Replace each character in the text with its code.</li>
      </ol>
      <p className="text-muted" style={{ maxWidth: 640 }}>
        Codes are variable-length, prefix-free, lossless, and optimal for symbol-by-symbol encoding given a
        known frequency distribution.
      </p>
    </section>
  );
};

export default HuffmanEncodingPage;
