import React, { useMemo, useState } from 'react';
import Slider from '../Slider';
import LecturePage from '../shell/LecturePage';
import Formula from '../ui/Formula';
import Quiz, { type QuizQuestion } from '../quiz/Quiz';
import { Axis, Curve, Legend, Plot } from '../chart';
import {
  calculateKLDivergence,
  calculateKLDivergenceTerm,
  calculateKLDivergenceNormal,
  normalPDF,
  formatValue,
} from '../../utils/informationTheory';
import { FORMULAS } from '../../content/formulas';

const F = FORMULAS['relative-entropy'];

const QUESTIONS: QuizQuestion[] = [
  {
    id: 'self-zero',
    kind: 'numeric',
    prompt: 'What is D_KL(P ‖ P), in bits?',
    answer: 0,
    tolerance: 1e-9,
    unit: 'bits',
    explanation: 'A distribution contains exactly its own information — the divergence from itself is zero.',
  },
  {
    id: 'asymmetry',
    kind: 'choice',
    prompt: 'Which property does KL divergence NOT have?',
    options: [
      { label: 'Non-negativity' },
      { label: 'Symmetry', correct: true },
      { label: 'Zero when the distributions match' },
      { label: 'It can be infinite' },
    ],
    explanation: 'D_KL(P‖Q) ≠ D_KL(Q‖P) in general, so it is a divergence, not a distance.',
  },
  {
    id: 'infinite',
    kind: 'choice',
    prompt: 'When is D_KL(P ‖ Q) infinite?',
    options: [
      { label: 'When P and Q have different means' },
      { label: 'When Q(x) = 0 for some x with P(x) > 0', correct: true },
      { label: 'Whenever P ≠ Q' },
      { label: 'Never' },
    ],
    explanation: 'You cannot represent an event Q claims is impossible; the penalty is infinite.',
  },
];

const RelativeEntropyPage: React.FC = () => {
  const [p1, setP1] = useState<number>(0.5);
  const [q1, setQ1] = useState<number>(0.5);

  const [meanP, setMeanP] = useState<number>(0);
  const [varP, setVarP] = useState<number>(1);
  const [meanQ, setMeanQ] = useState<number>(0);
  const [varQ, setVarQ] = useState<number>(1);

  const P = [p1, 1 - p1];
  const Q = [q1, 1 - q1];
  const dPQ = calculateKLDivergence(P, Q);
  const dQP = calculateKLDivergence(Q, P);

  const klTerms = [
    { outcome: 'Outcome 1', p: P[0], q: Q[0], tpq: calculateKLDivergenceTerm(P[0], Q[0]), tqp: calculateKLDivergenceTerm(Q[0], P[0]) },
    { outcome: 'Outcome 0', p: P[1], q: Q[1], tpq: calculateKLDivergenceTerm(P[1], Q[1]), tqp: calculateKLDivergenceTerm(Q[1], P[1]) },
  ];

  const dNormalPQ = calculateKLDivergenceNormal(meanP, varP, meanQ, varQ);
  const dNormalQP = calculateKLDivergenceNormal(meanQ, varQ, meanP, varP);

  const { pointsP, pointsQ, maxPdf } = useMemo(() => {
    const xMin = -10;
    const xMax = 10;
    const pPoints = [];
    const qPoints = [];
    let max = 0.05;
    for (let i = 0; i <= 120; i++) {
      const x = xMin + ((xMax - xMin) * i) / 120;
      const yP = normalPDF(x, meanP, varP);
      const yQ = normalPDF(x, meanQ, varQ);
      pPoints.push({ x, y: yP });
      qPoints.push({ x, y: yQ });
      max = Math.max(max, yP, yQ);
    }
    return { pointsP: pPoints, pointsQ: qPoints, maxPdf: max };
  }, [meanP, varP, meanQ, varQ]);

  return (
    <LecturePage slug="relative-entropy" quiz={<Quiz slug="relative-entropy" questions={QUESTIONS} />}>
      <p className="it-body-block">
        How much one distribution P diverges from a reference distribution Q — the information lost when
        Q approximates P. Not symmetric.
      </p>
      <Formula tex={F.definition} note="the Kullback–Leibler divergence, in bits" label="KL divergence of P from Q" />

      <h4>Discrete Distributions</h4>
      <div style={{ display: 'flex', gap: 'var(--space-6)', flexWrap: 'wrap', marginBottom: 'var(--space-4)' }}>
        <Slider
          label="Distribution P"
          valueLabel={p1.toFixed(2)}
          value={p1} min={0} max={1} step={0.01} onChange={setP1}
          style={{ maxWidth: 320, flex: 1 }}
        />
        <Slider
          label="Distribution Q"
          valueLabel={q1.toFixed(2)}
          valueColor="var(--color-accent-2-700)"
          accentColor="var(--color-accent-2)"
          value={q1} min={0} max={1} step={0.01} onChange={setQ1}
          style={{ maxWidth: 320, flex: 1 }}
        />
      </div>
      <div style={{ display: 'flex', gap: 'var(--space-6)', marginBottom: 'var(--space-4)' }}>
        <div>D<sub>KL</sub>(P‖Q) = <b style={{ color: 'var(--color-accent-700)' }}>{formatValue(dPQ, 4)}</b> bits</div>
        <div>D<sub>KL</sub>(Q‖P) = <b style={{ color: 'var(--color-accent-2-700)' }}>{formatValue(dQP, 4)}</b> bits</div>
      </div>
      <table className="table" style={{ marginBottom: 'var(--space-6)' }}>
        <thead><tr><th>Outcome</th><th>P(x)</th><th>Q(x)</th><th>P log₂(P/Q)</th><th>Q log₂(Q/P)</th></tr></thead>
        <tbody>
          {klTerms.map((term) => (
            <tr key={term.outcome}>
              <td>{term.outcome}</td>
              <td>{term.p.toFixed(2)}</td>
              <td>{term.q.toFixed(2)}</td>
              <td>{formatValue(term.tpq)}</td>
              <td>{formatValue(term.tqp)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h4>Normal Distributions</h4>
      <Formula tex={F.normal} note="in bits, for univariate Gaussians" label="KL divergence between two normal distributions" />
      <div style={{ display: 'flex', gap: 'var(--space-6)', flexWrap: 'wrap', marginBottom: 'var(--space-4)' }}>
        <div style={{ maxWidth: 320, flex: 1 }}>
          <Slider label="Mean μP" valueLabel={meanP.toFixed(1)} value={meanP} min={-5} max={5} step={0.1} onChange={setMeanP} />
          <Slider label="Variance σ²P" valueLabel={varP.toFixed(1)} value={varP} min={0.1} max={5} step={0.1} onChange={setVarP} style={{ marginTop: 'var(--space-2)' }} />
        </div>
        <div style={{ maxWidth: 320, flex: 1 }}>
          <Slider label="Mean μQ" valueLabel={meanQ.toFixed(1)} valueColor="var(--color-accent-2-700)" accentColor="var(--color-accent-2)" value={meanQ} min={-5} max={5} step={0.1} onChange={setMeanQ} />
          <Slider label="Variance σ²Q" valueLabel={varQ.toFixed(1)} valueColor="var(--color-accent-2-700)" accentColor="var(--color-accent-2)" value={varQ} min={0.1} max={5} step={0.1} onChange={setVarQ} style={{ marginTop: 'var(--space-2)' }} />
        </div>
      </div>
      <div style={{ display: 'flex', gap: 'var(--space-6)', marginBottom: 'var(--space-4)' }}>
        <div>D<sub>KL</sub>(P‖Q) = <b style={{ color: 'var(--color-accent-700)' }}>{formatValue(dNormalPQ, 4)}</b> bits</div>
        <div>D<sub>KL</sub>(Q‖P) = <b style={{ color: 'var(--color-accent-2-700)' }}>{formatValue(dNormalQP, 4)}</b> bits</div>
      </div>

      <Plot
        xDomain={[-10, 10]}
        yDomain={[0, maxPdf * 1.1]}
        title="Two normal densities, P and Q"
        desc="Curves for the P and Q normal distributions; the KL divergence measures the shaded information gap between them."
        height={260}
      >
        <Axis orient="left" label="density" />
        <Axis orient="bottom" label="x" />
        <Curve points={pointsP} color="var(--color-accent-700)" />
        <Curve points={pointsQ} color="var(--color-accent-2-700)" dashed />
      </Plot>
      <Legend
        items={[
          { label: 'P', color: 'var(--color-accent-700)' },
          { label: 'Q', color: 'var(--color-accent-2-700)', dashed: true },
        ]}
      />

      <h4>Key Characteristics &amp; Why It&rsquo;s Useful</h4>
      <ul style={{ maxWidth: 640, paddingLeft: 20 }}>
        <li><b>Non-negativity:</b> D<sub>KL</sub>(P‖Q) ≥ 0, zero only if P = Q.</li>
        <li><b>Asymmetry:</b> D<sub>KL</sub>(P‖Q) ≠ D<sub>KL</sub>(Q‖P) — not a true distance metric.</li>
        <li><b>Support:</b> infinite if Q assigns zero probability where P does not.</li>
      </ul>
      <Formula tex={F.nonNegative} note="Gibbs' inequality" label="KL divergence is non-negative" />
      <p className="it-body-block">
        In machine learning, KL divergence measures how far a model&rsquo;s predicted distribution is from
        the true data distribution — lower is a better approximation.
      </p>
    </LecturePage>
  );
};

export default RelativeEntropyPage;
