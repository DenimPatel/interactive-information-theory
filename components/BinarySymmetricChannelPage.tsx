import React, { useMemo, useState } from 'react';
import Slider from './Slider';
import { calculateEntropy } from '../utils/informationTheory';
import { buildSvgPath } from '../utils/svgPath';

const BinarySymmetricChannelPage: React.FC = () => {
  const [p, setP] = useState<number>(0.1); // crossover probability
  const [q, setQ] = useState<number>(0.5); // P(X=0)

  const probX1 = 1 - q;
  const hX = calculateEntropy(q);
  const probY0 = (1 - p) * q + p * probX1;
  const hY = calculateEntropy(probY0);
  const hYX = calculateEntropy(p);
  const iXY = Math.max(0, hY - hYX);
  const capacity = Math.max(0, 1 - hYX);

  const miPath = useMemo(() => {
    const points = [];
    for (let i = 0; i <= 50; i++) {
      const qi = i / 50;
      const y0 = (1 - p) * qi + p * (1 - qi);
      const hy = calculateEntropy(y0);
      points.push({ x: qi, y: Math.max(0, hy - hYX) });
    }
    return buildSvgPath(points, 0, 1, 0, 1, 40, 500, 200, 20);
  }, [p, hYX]);
  const dotX = 40 + q * 460;
  const dotY = 200 - iXY * 180;
  const capacityY = 200 - capacity * 180;

  return (
    <section>
      <div className="card-kicker">Foundations</div>
      <h2>BSC &amp; Mutual Information</h2>
      <p className="text-muted" style={{ maxWidth: 640 }}>
        A Binary Symmetric Channel flips a transmitted bit with crossover probability p, independent of past
        transmissions.
      </p>
      <p style={{ fontStyle: 'italic', color: 'var(--color-accent-700)', margin: 'var(--space-3) 0 var(--space-6) 0' }}>
        I(X;Y) = H(Y) &minus; H(Y|X) &nbsp;&middot;&nbsp; Capacity C = 1 &minus; H(p)
      </p>

      <div style={{ display: 'flex', gap: 'var(--space-6)', flexWrap: 'wrap', marginBottom: 'var(--space-5)' }}>
        <Slider
          label="Crossover Probability (p)" valueLabel={p.toFixed(2)} valueColor="var(--color-accent-2-700)" accentColor="var(--color-accent-2)"
          value={p} min={0} max={1} step={0.01} onChange={setP}
          style={{ maxWidth: 300, flex: 1 }}
        />
        <Slider
          label="Input Distribution P(X=0)" valueLabel={q.toFixed(2)}
          value={q} min={0} max={1} step={0.01} onChange={setQ}
          style={{ maxWidth: 300, flex: 1 }}
        />
      </div>

      <div style={{ display: 'flex', gap: 'var(--space-6)', flexWrap: 'wrap', marginBottom: 'var(--space-5)' }}>
        <div>H(X)<br /><b style={{ color: 'var(--color-accent-700)' }}>{hX.toFixed(4)}</b></div>
        <div>H(Y)<br /><b style={{ color: 'var(--color-accent-700)' }}>{hY.toFixed(4)}</b></div>
        <div>H(Y|X)<br /><b style={{ color: 'var(--color-accent-700)' }}>{hYX.toFixed(4)}</b></div>
        <div>I(X;Y)<br /><b style={{ color: 'var(--color-accent-2-700)' }}>{iXY.toFixed(4)}</b></div>
        <div>Capacity C<br /><b style={{ color: 'var(--color-accent-2-700)' }}>{capacity.toFixed(4)}</b></div>
      </div>

      <h5>Mutual Information vs. P(X=0)</h5>
      <svg viewBox="0 0 520 220" style={{ width: '100%', maxWidth: 640, height: 'auto', display: 'block', marginBottom: 'var(--space-6)' }}>
        <line x1={40} y1={20} x2={40} y2={200} stroke="var(--color-divider)" />
        <line x1={40} y1={200} x2={500} y2={200} stroke="var(--color-divider)" />
        <text x={30} y={24} fontSize={10} fill="var(--color-text)" opacity={0.55} textAnchor="end">1.0</text>
        <text x={30} y={200} fontSize={10} fill="var(--color-text)" opacity={0.55} textAnchor="end">0.0</text>
        <text x={40} y={214} fontSize={10} fill="var(--color-text)" opacity={0.55}>0</text>
        <text x={480} y={214} fontSize={10} fill="var(--color-text)" opacity={0.55}>1</text>
        <text x={260} y={214} fontSize={10} fill="var(--color-text)" opacity={0.55} textAnchor="middle">P(X=0)</text>
        <line x1={40} y1={capacityY} x2={500} y2={capacityY} stroke="var(--color-neutral-500)" strokeWidth={1} strokeDasharray="4 4" />
        <path d={miPath} fill="none" stroke="var(--color-accent-700)" strokeWidth={2} />
        <circle cx={dotX} cy={dotY} r={5} fill="var(--color-accent-2-600)" stroke="var(--color-bg)" strokeWidth={2} />
      </svg>

      <h4>Channel Capacity</h4>
      <p style={{ maxWidth: 640 }}>
        Capacity is the maximum mutual information over all input distributions p(x) &mdash; for a BSC, achieved
        when input bits are equally likely (P(X=0)=0.5). It ranges from 1 bit (perfect channel) down to 0 bits
        (fully random channel, p=0.5).
      </p>
    </section>
  );
};

export default BinarySymmetricChannelPage;
