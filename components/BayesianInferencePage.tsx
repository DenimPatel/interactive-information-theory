import React, { useMemo, useState } from 'react';
import Slider from './Slider';
import MetricRow from './MetricRow';
import { buildSvgPath } from '../utils/svgPath';

const BayesianInferencePage: React.FC = () => {
  const [prior, setPrior] = useState<number>(0.01); // P(Disease)
  const [sensitivity, setSensitivity] = useState<number>(0.99); // P(+|Disease)
  const [specificity, setSpecificity] = useState<number>(0.95); // P(-|No Disease)

  const probNoDisease = 1 - prior;
  const fpr = 1 - specificity;
  const num = sensitivity * prior;
  const term2 = fpr * probNoDisease;
  const evidence = num + term2;
  const posterior = evidence > 0 ? num / evidence : 0;

  const plotPath = useMemo(() => {
    const points = [];
    for (let i = 0; i <= 40; i++) {
      const pr = (0.5 * i) / 40;
      const n = sensitivity * pr;
      const t2 = fpr * (1 - pr);
      const ev = n + t2;
      points.push({ x: pr, y: ev > 0 ? n / ev : 0 });
    }
    return buildSvgPath(points, 0, 0.5, 0, 1, 30, 500, 150, 10);
  }, [sensitivity, fpr]);
  const plotDotX = 30 + (prior / 0.5) * 470;
  const plotDotY = 150 - posterior * 140;

  return (
    <section>
      <div className="card-kicker">Foundations</div>
      <h2>Bayesian Inference &amp; Bayes&rsquo; Theorem</h2>
      <p className="text-muted" style={{ maxWidth: 640 }}>
        Bayesian inference updates a prior belief with new evidence to produce a posterior belief.
      </p>
      <p style={{ fontStyle: 'italic', color: 'var(--color-accent-700)', margin: 'var(--space-3) 0 var(--space-2) 0' }}>
        P(H|E) = P(E|H) &times; P(H) / P(E)
      </p>
      <p className="text-muted" style={{ fontSize: 13, maxWidth: 640, marginBottom: 'var(--space-6)' }}>
        P(H): prior &middot; P(E|H): likelihood &middot; P(E)=P(E|H)P(H)+P(E|&not;H)P(&not;H) &middot; P(H|E): posterior.
      </p>

      <h4>Medical Diagnosis Example</h4>
      <p className="text-muted" style={{ maxWidth: 640 }}>
        A person tests positive for a rare disease. How likely is it they actually have it?
      </p>
      <div style={{ display: 'flex', gap: 'var(--space-8)', flexWrap: 'wrap', margin: 'var(--space-4) 0 var(--space-5) 0' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', minWidth: 260, flex: 1 }}>
          <Slider label="Prior P(Disease)" valueLabel={prior.toFixed(3)} value={prior} min={0.001} max={0.5} step={0.001} onChange={setPrior} />
          <Slider label="Sensitivity P(+|Disease)" valueLabel={sensitivity.toFixed(3)} value={sensitivity} min={0.5} max={0.999} step={0.001} onChange={setSensitivity} />
          <Slider label="Specificity P(&minus;|No Disease)" valueLabel={specificity.toFixed(3)} value={specificity} min={0.5} max={0.999} step={0.001} onChange={setSpecificity} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 260 }}>
          <MetricRow label="P(No Disease)" value={probNoDisease.toFixed(4)} />
          <MetricRow label="False Positive Rate" value={fpr.toFixed(4)} />
          <MetricRow label="P(+|D)&middot;P(D)" value={num.toFixed(5)} />
          <MetricRow label="P(+|&not;D)&middot;P(&not;D)" value={term2.toFixed(5)} />
          <MetricRow label="Total P(Positive)" value={evidence.toFixed(5)} />
          <div style={{ marginTop: 6 }}>
            <MetricRow label={<b>P(Disease|Positive)</b>} value={posterior.toFixed(4)} valueColor="var(--color-accent-2-700)" />
          </div>
        </div>
      </div>
      <p className="text-muted" style={{ maxWidth: 640 }}>
        A low prior (rare disease) can mean the chance of truly having it &mdash; even after a positive test &mdash;
        is lower than intuition suggests. This is the base rate fallacy.
      </p>
      <svg viewBox="0 0 520 180" style={{ width: '100%', maxWidth: 640, height: 'auto', display: 'block', marginTop: 'var(--space-4)' }}>
        <line x1={30} y1={10} x2={30} y2={150} stroke="var(--color-divider)" />
        <line x1={30} y1={150} x2={500} y2={150} stroke="var(--color-divider)" />
        <text x={24} y={14} fontSize={10} fill="var(--color-text)" opacity={0.55} textAnchor="end">1.0</text>
        <text x={24} y={150} fontSize={10} fill="var(--color-text)" opacity={0.55} textAnchor="end">0.0</text>
        <text x={265} y={168} fontSize={10} fill="var(--color-text)" opacity={0.55} textAnchor="middle">Prior P(Disease), sweeping 0&ndash;0.5</text>
        <path d={plotPath} fill="none" stroke="var(--color-accent-700)" strokeWidth={2} />
        <circle cx={plotDotX} cy={plotDotY} r={5} fill="var(--color-accent-2-600)" stroke="var(--color-bg)" strokeWidth={2} />
      </svg>

      <h4 style={{ marginTop: 'var(--space-6)' }}>Why It&rsquo;s Powerful &amp; How It Relates</h4>
      <ul style={{ maxWidth: 640, paddingLeft: 20 }}>
        <li>Handles uncertainty with full distributions, not just point estimates.</li>
        <li>Formally incorporates prior knowledge; updates incrementally as data arrives.</li>
        <li>Underlies Naive Bayes, Bayesian networks, and Gaussian processes.</li>
        <li><b>Monty Hall:</b> the host&rsquo;s reveal is Bayesian evidence updating your door&rsquo;s probability.</li>
      </ul>
    </section>
  );
};

export default BayesianInferencePage;
