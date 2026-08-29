import React, { useMemo, useState } from 'react';
import Slider from './Slider';
import MetricRow from './MetricRow';
import { calculateEntropy, calculateInformationContent, formatValue } from '../utils/informationTheory';
import { buildSvgPath } from '../utils/svgPath';

const GEMS: { kicker: string; title: string; body: string }[] = [
  { kicker: 'Concept', title: 'Information as Surprise', body: 'Less likely events carry more information when they occur.' },
  { kicker: 'Concept', title: 'Entropy', body: 'The average amount of information produced by a source.' },
  { kicker: 'Concept', title: 'Mutual Information', body: 'Shared information between two variables.' },
  { kicker: 'Theorem', title: 'Source Coding', body: 'Sets the limit on lossless compression given entropy.' },
  { kicker: 'Theorem', title: 'Channel Coding', body: 'Sets the max reliable transmission rate over noise.' },
  { kicker: 'Applications', title: 'Everywhere', body: 'JPEG/MPEG, error correction, cryptography, ML feature selection.' },
];

const MainPage: React.FC = () => {
  const [pHeads, setPHeads] = useState<number>(0.5);
  const pTails = 1 - pHeads;
  const entropy = calculateEntropy(pHeads);
  const iHeads = calculateInformationContent(pHeads);
  const iTails = calculateInformationContent(pTails);

  const entropyChartPath = useMemo(() => {
    const points = [];
    for (let i = 0; i <= 50; i++) {
      const p = i / 50;
      points.push({ x: p, y: calculateEntropy(p) });
    }
    return buildSvgPath(points, 0, 1, 0, 1, 40, 480, 200, 20);
  }, []);
  const entropyDotX = 40 + pHeads * 440;
  const entropyDotY = 200 - entropy * 180;

  return (
    <section>
      <div className="card-kicker">Foundations</div>
      <h2>The Bent Coin</h2>
      <p className="text-muted" style={{ maxWidth: 600 }}>
        Probability, information content, and entropy, explored on a single biased coin.
      </p>

      <Slider
        label="Probability of Heads"
        valueLabel={pHeads.toFixed(2)}
        valueItalic
        value={pHeads}
        min={0}
        max={1}
        step={0.01}
        onChange={setPHeads}
        style={{ margin: 'var(--space-6) 0 var(--space-4) 0', maxWidth: 480 }}
      />

      <div style={{ display: 'flex', gap: 'var(--space-6)', flexWrap: 'wrap', marginBottom: 'var(--space-6)', maxWidth: 600 }}>
        <MetricRow label="P(Heads)" value={pHeads.toFixed(2)} valueColor="var(--color-accent-700)" width={220} />
        <MetricRow label="P(Tails)" value={pTails.toFixed(2)} valueColor="var(--color-accent-700)" width={220} />
        <MetricRow label="I(Heads)" value={`${formatValue(iHeads)} bits`} valueColor="var(--color-accent-700)" width={220} />
        <MetricRow label="I(Tails)" value={`${formatValue(iTails)} bits`} valueColor="var(--color-accent-700)" width={220} />
        <MetricRow label="Entropy H(Coin)" value={`${entropy.toFixed(3)} bits`} valueColor="var(--color-accent-2-700)" width={220} />
      </div>

      <h4>Entropy vs. P(Heads)</h4>
      <svg viewBox="0 0 520 220" style={{ width: '100%', maxWidth: 640, height: 'auto', display: 'block', marginBottom: 'var(--space-6)' }}>
        <line x1={40} y1={20} x2={40} y2={200} stroke="var(--color-divider)" />
        <line x1={40} y1={200} x2={500} y2={200} stroke="var(--color-divider)" />
        <text x={30} y={24} fontSize={10} fill="var(--color-text)" textAnchor="end" opacity={0.55}>1.0</text>
        <text x={30} y={200} fontSize={10} fill="var(--color-text)" textAnchor="end" opacity={0.55}>0.0</text>
        <text x={40} y={214} fontSize={10} fill="var(--color-text)" opacity={0.55}>0</text>
        <text x={480} y={214} fontSize={10} fill="var(--color-text)" opacity={0.55}>1</text>
        <text x={255} y={214} fontSize={10} fill="var(--color-text)" opacity={0.55} textAnchor="middle">P(Heads)</text>
        <path d={entropyChartPath} fill="none" stroke="var(--color-accent-700)" strokeWidth={2} />
        <circle cx={entropyDotX} cy={entropyDotY} r={5} fill="var(--color-accent-2-600)" stroke="var(--color-bg)" strokeWidth={2} />
      </svg>

      <h4>What is Probability?</h4>
      <p style={{ maxWidth: 640 }}>
        Probability measures the likelihood of an event occurring. For our bent coin, we can adjust P(Heads);
        P(Tails) is always 1 &minus; P(Heads). A fair coin has P(Heads) = 0.5.
      </p>
      <p style={{ fontStyle: 'italic', color: 'var(--color-accent-700)', marginBottom: 'var(--space-6)' }}>
        P(Tails) = 1 &minus; P(Heads)
      </p>

      <h4>What is Information Content?</h4>
      <p style={{ maxWidth: 640 }}>
        Information content (self-information) quantifies the &ldquo;surprise&rdquo; of an event &mdash; less likely
        events are more surprising and carry more information when they happen, measured in bits.
      </p>
      <p style={{ fontStyle: 'italic', color: 'var(--color-accent-700)', marginBottom: 'var(--space-6)' }}>
        I(event) = &minus;log&#8322;(P(event)) bits
      </p>

      <h4>What is Entropy?</h4>
      <p style={{ maxWidth: 640 }}>
        Entropy measures the average uncertainty of a random variable. It&rsquo;s maximized at P(Heads)=0.5
        (1 bit) and zero when the coin is fully biased.
      </p>
      <p style={{ fontStyle: 'italic', color: 'var(--color-accent-700)', marginBottom: 'var(--space-6)' }}>
        H(Coin) = &minus;P(H)log&#8322;P(H) &minus; P(T)log&#8322;P(T)
      </p>

      <h4>Key Gems of Information Theory</h4>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(180px,1fr))', gap: 'var(--space-3)', marginTop: 'var(--space-3)' }}>
        {GEMS.map(gem => (
          <div className="card elev-sm" key={gem.title}>
            <div className="card-kicker">{gem.kicker}</div>
            <div className="card-title">{gem.title}</div>
            <p className="card-body">{gem.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default MainPage;
