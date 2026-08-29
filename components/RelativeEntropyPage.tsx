import React, { useMemo, useState } from 'react';
import Slider from './Slider';
import {
  calculateKLDivergence,
  calculateKLDivergenceTerm,
  calculateKLDivergenceNormal,
  normalPDF,
  formatValue,
} from '../utils/informationTheory';
import { buildSvgPath } from '../utils/svgPath';

const RelativeEntropyPage: React.FC = () => {
  // Discrete distributions
  const [p1, setP1] = useState<number>(0.5); // P(Outcome 1)
  const [q1, setQ1] = useState<number>(0.5); // Q(Outcome 1)

  // Normal distributions
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

  const pdfPaths = useMemo(() => {
    const xMin = -10, xMax = 10;
    const pointsP = [], pointsQ = [];
    let maxPdf = 0.05;
    for (let i = 0; i <= 60; i++) {
      const x = xMin + ((xMax - xMin) * i) / 60;
      const yP = normalPDF(x, meanP, varP);
      const yQ = normalPDF(x, meanQ, varQ);
      pointsP.push({ x, y: yP });
      pointsQ.push({ x, y: yQ });
      maxPdf = Math.max(maxPdf, yP, yQ);
    }
    return {
      pathP: buildSvgPath(pointsP, xMin, xMax, 0, maxPdf * 1.1, 20, 500, 170, 15),
      pathQ: buildSvgPath(pointsQ, xMin, xMax, 0, maxPdf * 1.1, 20, 500, 170, 15),
    };
  }, [meanP, varP, meanQ, varQ]);

  return (
    <section>
      <div className="card-kicker">Foundations</div>
      <h2>Relative Entropy (KL Divergence)</h2>
      <p className="text-muted" style={{ maxWidth: 640 }}>
        How much one distribution P diverges from a reference distribution Q &mdash; the information lost when
        Q approximates P. Not symmetric.
      </p>
      <p style={{ fontStyle: 'italic', color: 'var(--color-accent-700)', margin: 'var(--space-3) 0 var(--space-6) 0' }}>
        D<sub>KL</sub>(P || Q) = &Sigma; P(x) log&#8322;(P(x)/Q(x))
      </p>

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
        <div>D<sub>KL</sub>(P||Q) = <b style={{ color: 'var(--color-accent-700)' }}>{formatValue(dPQ, 4)}</b> bits</div>
        <div>D<sub>KL</sub>(Q||P) = <b style={{ color: 'var(--color-accent-2-700)' }}>{formatValue(dQP, 4)}</b> bits</div>
      </div>
      <table className="table" style={{ marginBottom: 'var(--space-6)' }}>
        <thead><tr><th>Outcome</th><th>P(x)</th><th>Q(x)</th><th>P log&#8322;(P/Q)</th><th>Q log&#8322;(Q/P)</th></tr></thead>
        <tbody>
          {klTerms.map(t => (
            <tr key={t.outcome}>
              <td>{t.outcome}</td>
              <td>{t.p.toFixed(2)}</td>
              <td>{t.q.toFixed(2)}</td>
              <td>{formatValue(t.tpq)}</td>
              <td>{formatValue(t.tqp)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h4>Normal Distributions</h4>
      <p style={{ fontStyle: 'italic', color: 'var(--color-accent-700)', margin: 'var(--space-3) 0 var(--space-4) 0', fontSize: 14 }}>
        [ ln(&sigma;Q/&sigma;P) + (&sigma;&sup2;P + (&mu;P&minus;&mu;Q)&sup2;)/(2&sigma;&sup2;Q) &minus; &frac12; ] / ln(2)
      </p>
      <div style={{ display: 'flex', gap: 'var(--space-6)', flexWrap: 'wrap', marginBottom: 'var(--space-4)' }}>
        <div style={{ maxWidth: 320, flex: 1 }}>
          <Slider label="Mean &mu;P" valueLabel={meanP.toFixed(1)} value={meanP} min={-5} max={5} step={0.1} onChange={setMeanP} />
          <Slider label="Variance &sigma;&sup2;P" valueLabel={varP.toFixed(1)} value={varP} min={0.1} max={5} step={0.1} onChange={setVarP} style={{ marginTop: 'var(--space-2)' }} />
        </div>
        <div style={{ maxWidth: 320, flex: 1 }}>
          <Slider label="Mean &mu;Q" valueLabel={meanQ.toFixed(1)} valueColor="var(--color-accent-2-700)" accentColor="var(--color-accent-2)" value={meanQ} min={-5} max={5} step={0.1} onChange={setMeanQ} />
          <Slider label="Variance &sigma;&sup2;Q" valueLabel={varQ.toFixed(1)} valueColor="var(--color-accent-2-700)" accentColor="var(--color-accent-2)" value={varQ} min={0.1} max={5} step={0.1} onChange={setVarQ} style={{ marginTop: 'var(--space-2)' }} />
        </div>
      </div>
      <div style={{ display: 'flex', gap: 'var(--space-6)', marginBottom: 'var(--space-4)' }}>
        <div>D<sub>KL</sub>(P||Q) = <b style={{ color: 'var(--color-accent-700)' }}>{formatValue(dNormalPQ, 4)}</b> bits</div>
        <div>D<sub>KL</sub>(Q||P) = <b style={{ color: 'var(--color-accent-2-700)' }}>{formatValue(dNormalQP, 4)}</b> bits</div>
      </div>
      <svg viewBox="0 0 520 200" style={{ width: '100%', maxWidth: 640, height: 'auto', display: 'block', marginBottom: 'var(--space-6)' }}>
        <line x1={20} y1={170} x2={500} y2={170} stroke="var(--color-divider)" />
        <path d={pdfPaths.pathP} fill="none" stroke="var(--color-accent-700)" strokeWidth={2} />
        <path d={pdfPaths.pathQ} fill="none" stroke="var(--color-accent-2-700)" strokeWidth={2} />
      </svg>

      <h4>Key Characteristics &amp; Why It&rsquo;s Useful</h4>
      <ul style={{ maxWidth: 640, paddingLeft: 20 }}>
        <li><b>Non-negativity:</b> D<sub>KL</sub>(P||Q) &ge; 0, zero only if P = Q.</li>
        <li><b>Asymmetry:</b> D<sub>KL</sub>(P||Q) &ne; D<sub>KL</sub>(Q||P) &mdash; not a true distance metric.</li>
        <li><b>Support:</b> infinite if Q assigns zero probability where P does not.</li>
      </ul>
      <p style={{ maxWidth: 640 }}>
        In machine learning, KL divergence measures how far a model&rsquo;s predicted distribution is from the true
        data distribution &mdash; lower is a better approximation.
      </p>
    </section>
  );
};

export default RelativeEntropyPage;
