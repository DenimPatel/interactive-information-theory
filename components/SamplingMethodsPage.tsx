import React, { useCallback, useState } from 'react';
import Slider from './Slider';

const SamplingMethodsPage: React.FC = () => {
  const [probA, setProbAState] = useState<number>(0.99);
  const [bits, setBits] = useState<string>('');
  const [lower, setLower] = useState<number>(0);
  const [upper, setUpper] = useState<number>(1);
  const [outcome, setOutcome] = useState<'A' | 'B' | null>(null);
  const [active, setActive] = useState<boolean>(true);
  const [log, setLog] = useState<string[]>(['Initial interval: [0.000000, 1.000000)']);

  const probB = 1 - probA;

  const resetSampling = useCallback((newProbA?: number) => {
    const p = newProbA ?? probA;
    setBits('');
    setLower(0);
    setUpper(1);
    setOutcome(null);
    setActive(true);
    setLog([`P(A) = ${p.toFixed(3)}. Initial interval: [0.000000, 1.000000)`]);
  }, [probA]);

  const setProbA = (value: number) => {
    setProbAState(value);
    resetSampling(value);
  };

  const drawBit = (bit: '0' | '1') => {
    if (!active) return;
    const mid = lower + (upper - lower) / 2;
    let nl = lower, nu = upper;
    if (bit === '0') nu = mid; else nl = mid;

    let newOutcome: 'A' | 'B' | null = null;
    let stillActive = true;
    let note = '';
    if (nu <= probA) {
      newOutcome = 'A'; stillActive = false;
      note = ` Fully within [0, ${probA.toFixed(3)}). Outcome: A.`;
    } else if (nl >= probA) {
      newOutcome = 'B'; stillActive = false;
      note = ` Fully within [${probA.toFixed(3)}, 1). Outcome: B.`;
    } else {
      note = ' Still undetermined.';
    }

    setBits(prev => prev + bit);
    setLower(nl);
    setUpper(nu);
    setOutcome(newOutcome);
    setActive(stillActive);
    setLog(prev => [...prev, `Bit '${bit}' drawn. New interval: [${nl.toFixed(6)}, ${nu.toFixed(6)}).${note}`]);
  };

  return (
    <section>
      <div className="card-kicker">Applications</div>
      <h2>Efficient Random Variable Generation</h2>
      <p className="text-muted" style={{ maxWidth: 660 }}>
        Generating outcome A or B with skewed probabilities using the fewest random bits on average.
      </p>

      <table className="table" style={{ margin: 'var(--space-4) 0 var(--space-6) 0' }}>
        <thead><tr><th>Method</th><th>Expected Bits (P(A)=0.99)</th><th>Notes</th></tr></thead>
        <tbody>
          <tr><td><b>Inversion Sampling</b></td><td>~0.08 bits</td><td className="text-muted">Approaches the entropy limit &mdash; optimal.</td></tr>
          <tr><td><b>Huffman Coding</b></td><td>~1.01 bits</td><td className="text-muted">Not ideal for single-event, highly skewed generation.</td></tr>
          <tr><td><b>Fixed-Length Bits</b></td><td>&ge;7 bits</td><td className="text-muted">Wasteful; may need rejection sampling.</td></tr>
        </tbody>
      </table>

      <h4>Interactive Inversion Sampling</h4>
      <p style={{ fontStyle: 'italic', color: 'var(--color-accent-700)', margin: 'var(--space-3) 0 var(--space-4) 0', fontSize: 14 }}>
        Expected bits &asymp; H(P(A), P(B))
      </p>

      <Slider
        label="P(A)"
        valueLabel={<>{probA.toFixed(3)} &nbsp; P(B) = <b style={{ color: 'var(--color-accent-2-700)' }}>{probB.toFixed(3)}</b></>}
        value={probA} min={0.001} max={0.999} step={0.001} onChange={setProbA}
        style={{ maxWidth: 480, marginBottom: 'var(--space-4)' }}
      />

      <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-5)' }}>
        <button className="btn btn-primary" onClick={() => drawBit('0')} disabled={!active}>Draw 0</button>
        <button className="btn btn-secondary" onClick={() => drawBit('1')} disabled={!active}>Draw 1</button>
        <button className="btn btn-ghost" onClick={() => resetSampling()}>Reset</button>
      </div>

      <div className="text-muted" style={{ fontSize: 11, marginBottom: 4 }}>Target Regions</div>
      <div style={{ position: 'relative', height: 20, background: 'var(--color-surface)', borderRadius: 'var(--radius-sm)', overflow: 'hidden', marginBottom: 'var(--space-4)', maxWidth: 640 }}>
        <div style={{ position: 'absolute', top: 0, left: 0, height: '100%', background: 'var(--color-accent-200)', width: `${probA * 100}%` }} />
        <div style={{ position: 'absolute', top: 0, height: '100%', background: 'var(--color-accent-2-200)', left: `${probA * 100}%`, width: `${probB * 100}%` }} />
      </div>
      <div className="text-muted" style={{ fontSize: 11, marginBottom: 4 }}>Current Interval [L, H)</div>
      <div style={{ position: 'relative', height: 20, background: 'var(--color-surface)', borderRadius: 'var(--radius-sm)', overflow: 'hidden', marginBottom: 'var(--space-5)', maxWidth: 640 }}>
        <div style={{ position: 'absolute', top: 0, height: '100%', background: 'var(--color-accent-700)', left: `${lower * 100}%`, width: `${Math.max(0.002, upper - lower) * 100}%` }} />
      </div>

      <p>Bits drawn: <b style={{ color: 'var(--color-accent-700)' }}>{bits || '(none)'}</b> ({bits.length}) &nbsp; Interval: <b>[{lower.toFixed(6)}, {upper.toFixed(6)})</b></p>
      {outcome && (
        <p style={{ fontSize: 18 }}>
          Outcome: <b style={{ color: outcome === 'A' ? 'var(--color-accent-700)' : 'var(--color-accent-2-700)' }}>{outcome}</b>
        </p>
      )}
      <div style={{ background: 'var(--color-surface)', borderRadius: 'var(--radius-md)', padding: 'var(--space-3)', maxHeight: 140, overflowY: 'auto', fontSize: 12, maxWidth: 640, marginBottom: 'var(--space-6)' }}>
        {log.map((entry, i) => (
          <div key={i} className="text-muted" style={{ marginBottom: 4 }}>{entry}</div>
        ))}
      </div>

      <h4>Why Inversion Sampling Wins</h4>
      <p style={{ maxWidth: 660 }}>
        Starting from [0,1), each random bit halves the interval. As soon as it falls entirely inside [0, P(A))
        or [P(A), 1), the outcome is decided. For skewed probabilities most trials resolve in very few bits, so
        the expected bit count approaches the true entropy of the distribution &mdash; unlike fixed-length
        sampling or naive Huffman-style codes, which can&rsquo;t capture very rare or very common outcomes
        efficiently.
      </p>
    </section>
  );
};

export default SamplingMethodsPage;
