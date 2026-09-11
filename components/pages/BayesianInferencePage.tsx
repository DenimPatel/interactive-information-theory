import React, { useMemo, useState } from 'react';
import Slider from '../Slider';
import MetricRow from '../MetricRow';
import LecturePage from '../shell/LecturePage';
import Formula from '../ui/Formula';
import Quiz, { type QuizQuestion } from '../quiz/Quiz';
import { Axis, Curve, Marker, Plot } from '../chart';
import { FORMULAS } from '../../content/formulas';

const F = FORMULAS['bayesian-inference'];

const QUESTIONS: QuizQuestion[] = [
  {
    id: 'base-rate',
    kind: 'numeric',
    prompt:
      'With a 1% prior, 99% sensitivity and 95% specificity, what is P(Disease | Positive)? (3 decimal places.)',
    answer: 0.1667,
    tolerance: 0.005,
    explanation:
      'The false positives from the large healthy group dominate: 0.0099 / (0.0099 + 0.0495) ≈ 0.167.',
  },
  {
    id: 'prior-up',
    kind: 'choice',
    prompt: 'If the prior P(Disease) rises (all else equal), what happens to the posterior after a positive test?',
    options: [
      { label: 'It rises', correct: true },
      { label: 'It falls' },
      { label: 'It is unchanged' },
      { label: 'It becomes 1' },
    ],
    explanation: 'A stronger prior shifts the balance toward disease; Bayes’ rule moves with it.',
  },
  {
    id: 'evidence',
    kind: 'choice',
    prompt: 'In Bayes’ rule, what does P(D) in the denominator represent?',
    options: [
      { label: 'The prior on the hypothesis' },
      { label: 'The likelihood of the data' },
      { label: 'The total probability of the evidence', correct: true },
      { label: 'The posterior' },
    ],
    explanation:
      'P(D) = Σ P(D|Hᵢ)P(Hᵢ) normalises the numerator over all hypotheses.',
  },
];

const BayesianInferencePage: React.FC = () => {
  const [prior, setPrior] = useState<number>(0.01);
  const [sensitivity, setSensitivity] = useState<number>(0.99);
  const [specificity, setSpecificity] = useState<number>(0.95);

  const probNoDisease = 1 - prior;
  const fpr = 1 - specificity;
  const num = sensitivity * prior;
  const term2 = fpr * probNoDisease;
  const evidence = num + term2;
  const posterior = evidence > 0 ? num / evidence : 0;

  const curve = useMemo(() => {
    const points = [];
    for (let i = 0; i <= 50; i++) {
      const pr = (0.5 * i) / 50;
      const n = sensitivity * pr;
      const t2 = fpr * (1 - pr);
      const ev = n + t2;
      points.push({ x: pr, y: ev > 0 ? n / ev : 0 });
    }
    return points;
  }, [sensitivity, fpr]);

  return (
    <LecturePage slug="bayesian-inference" quiz={<Quiz slug="bayesian-inference" questions={QUESTIONS} />}>
      <p className="it-body-block">
        Bayesian inference updates a prior belief with new evidence to produce a posterior belief.
      </p>
      <Formula tex={F.bayes} note="prior × likelihood, normalised by the evidence" label="Bayes' theorem" />
      <Formula tex={F.evidence} note="the evidence, summed over hypotheses" label="P of the data as a sum over hypotheses" />

      <h4>Medical Diagnosis Example</h4>
      <p className="it-body-block">
        A person tests positive for a rare disease. How likely is it they actually have it?
      </p>
      <div style={{ display: 'flex', gap: 'var(--space-8)', flexWrap: 'wrap', margin: 'var(--space-4) 0 var(--space-5) 0' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', minWidth: 260, flex: 1 }}>
          <Slider label="Prior P(Disease)" valueLabel={prior.toFixed(3)} value={prior} min={0.001} max={0.5} step={0.001} onChange={setPrior} />
          <Slider label="Sensitivity P(+|Disease)" valueLabel={sensitivity.toFixed(3)} value={sensitivity} min={0.5} max={0.999} step={0.001} onChange={setSensitivity} />
          <Slider label="Specificity P(−|No Disease)" valueLabel={specificity.toFixed(3)} value={specificity} min={0.5} max={0.999} step={0.001} onChange={setSpecificity} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 260 }}>
          <MetricRow label="P(No Disease)" value={probNoDisease.toFixed(4)} />
          <MetricRow label="False Positive Rate" value={fpr.toFixed(4)} />
          <MetricRow label="P(+|D)·P(D)" value={num.toFixed(5)} />
          <MetricRow label="P(+|¬D)·P(¬D)" value={term2.toFixed(5)} />
          <MetricRow label="Total P(Positive)" value={evidence.toFixed(5)} />
          <div style={{ marginTop: 6 }}>
            <MetricRow label={<b>P(Disease|Positive)</b>} value={posterior.toFixed(4)} valueColor="var(--color-accent-2-700)" />
          </div>
        </div>
      </div>

      <Plot
        xDomain={[0, 0.5]}
        yDomain={[0, 1]}
        title="Posterior probability of disease versus the prior"
        desc="As the prior rises from zero, the posterior after a positive test rises monotonically. For a rare disease the posterior can be far below one."
        height={280}
      >
        <Axis orient="left" label="P(Disease | +)" ticks={[0, 0.25, 0.5, 0.75, 1]} />
        <Axis orient="bottom" label="Prior P(Disease)" ticks={[0, 0.1, 0.2, 0.3, 0.4, 0.5]} />
        <Curve points={curve} />
        <Marker x={prior} y={posterior} label={posterior.toFixed(3)} />
      </Plot>

      <p className="it-body-block">
        A low prior (rare disease) can mean the chance of truly having it — even after a positive test —
        is lower than intuition suggests. This is the base rate fallacy.
      </p>

      <h4 style={{ marginTop: 'var(--space-6)' }}>Why It&rsquo;s Powerful &amp; How It Relates</h4>
      <ul style={{ maxWidth: 640, paddingLeft: 20 }}>
        <li>Handles uncertainty with full distributions, not just point estimates.</li>
        <li>Formally incorporates prior knowledge; updates incrementally as data arrives.</li>
        <li>Underlies Naive Bayes, Bayesian networks, and Gaussian processes.</li>
        <li><b>Monty Hall:</b> the host&rsquo;s reveal is Bayesian evidence updating your door&rsquo;s probability.</li>
      </ul>
    </LecturePage>
  );
};

export default BayesianInferencePage;
