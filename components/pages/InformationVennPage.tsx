import React, { useState } from 'react';
import LecturePage from '../shell/LecturePage';
import Formula from '../ui/Formula';
import Quiz, { type QuizQuestion } from '../quiz/Quiz';
import NumberInput from '../ui/NumberInput';
import MetricRow from '../MetricRow';
import Callout from '../ui/Callout';
import { Plot, usePlot } from '../chart';

const QUESTIONS: QuizQuestion[] = [
  {
    id: 'independent',
    kind: 'choice',
    prompt: 'What does I(X;Y) = 0 mean?',
    options: [
      { label: 'X and Y are independent', correct: true },
      { label: 'X and Y are perfectly correlated' },
      { label: 'H(X) = 0' },
      { label: 'X determines Y exactly' },
    ],
    explanation: 'Mutual information is the information the variables share; zero shared information is exactly independence.',
  },
  {
    id: 'perfect',
    kind: 'numeric',
    prompt: 'For the joint table P(X=0,Y=0) = P(X=1,Y=1) = 0.5 (all other cells zero), what is I(X;Y) in bits?',
    answer: 1,
    tolerance: 1e-6,
    unit: 'bits',
    explanation: 'Y = X exactly, so H(X) = H(Y) = H(X,Y) = 1 bit and I(X;Y) = 1 + 1 − 1 = 1 bit.',
  },
  {
    id: 'chain',
    kind: 'choice',
    prompt: 'Which identity relates the joint entropy to mutual information?',
    options: [
      { label: 'H(X,Y) = H(X) + H(Y) − I(X;Y)', correct: true },
      { label: 'H(X,Y) = H(X) + H(Y) + I(X;Y)' },
      { label: 'H(X,Y) = I(X;Y) − H(X) − H(Y)' },
      { label: 'H(X,Y) = H(X|Y) + H(Y|X)' },
    ],
    explanation: 'The overlap is counted twice when adding the marginals, so it is subtracted once — the information diagram made algebraic.',
  },
  {
    id: 'conditional-zero',
    kind: 'choice',
    prompt: 'When is H(Y|X) = 0?',
    options: [
      { label: 'When X determines Y exactly', correct: true },
      { label: 'When X and Y are independent' },
      { label: 'When H(X) = H(Y)' },
      { label: 'Never' },
    ],
    explanation: 'Zero residual uncertainty means knowing X leaves no doubt about Y, i.e. Y is a function of X.',
  },
];

const binaryEntropy = (p: number): number => {
  if (p <= 0 || p >= 1) return 0;
  return -p * Math.log2(p) - (1 - p) * Math.log2(1 - p);
};

const jointEntropy = (probs: number[]): number =>
  probs.reduce((sum, p) => (p > 0 ? sum - p * Math.log2(p) : sum), 0);

const clampUnit = (value: number): number => Math.max(-1, Math.min(1, value));

/** Area of the lens where two circles of radii r1, r2 at centre distance d overlap. */
const circleOverlapArea = (d: number, r1: number, r2: number): number => {
  if (r1 <= 0 || r2 <= 0) return 0;
  if (d >= r1 + r2) return 0;
  if (d <= Math.abs(r1 - r2)) return Math.PI * Math.min(r1, r2) ** 2;
  const a = r1 * r1 * Math.acos(clampUnit((d * d + r1 * r1 - r2 * r2) / (2 * d * r1)));
  const b = r2 * r2 * Math.acos(clampUnit((d * d + r2 * r2 - r1 * r1) / (2 * d * r2)));
  const c = 0.5 * Math.sqrt(Math.max(0, (-d + r1 + r2) * (d + r1 - r2) * (d - r1 + r2) * (d + r1 + r2)));
  return a + b - c;
};

/** Centre distance whose lens area equals `target`; area decreases with d. */
const distanceForOverlap = (target: number, r1: number, r2: number): number => {
  const lo = Math.abs(r1 - r2);
  const hi = r1 + r2;
  if (target <= 0) return hi;
  if (target >= circleOverlapArea(lo, r1, r2)) return lo;
  let a = lo;
  let b = hi;
  for (let i = 0; i < 64; i += 1) {
    const mid = (a + b) / 2;
    if (circleOverlapArea(mid, r1, r2) > target) a = mid;
    else b = mid;
  }
  return (a + b) / 2;
};

interface VennProps {
  hx: number;
  hy: number;
  hxy: number;
  ixy: number;
}

const VennDiagram: React.FC<VennProps> = ({ hx, hy, hxy, ixy }) => {
  const plot = usePlot();
  const cx = plot.left + plot.innerWidth / 2;
  const cy = plot.top + plot.innerHeight / 2;

  if (!(hxy > 1e-12) || !(hx > 0) || !(hy > 0)) {
    return (
      <text x={cx} y={cy} textAnchor="middle" fontSize={13} fill="var(--color-neutral-700)">
        One of the variables is certain — there is no uncertainty area to draw.
      </text>
    );
  }

  const k = (plot.innerWidth * plot.innerHeight * 0.45) / hxy;
  let rX = Math.sqrt((hx * k) / Math.PI);
  let rY = Math.sqrt((hy * k) / Math.PI);
  const maxOverlap = Math.PI * Math.min(rX, rY) ** 2 * 0.999;
  const targetOverlap = Math.min(Math.max(0, ixy) * k, maxOverlap);
  let d = distanceForOverlap(targetOverlap, rX, rY);

  const halfWidth = d / 2 + Math.max(rX, rY);
  const halfHeight = Math.max(rX, rY);
  const scale = Math.min(
    1,
    (plot.innerWidth * 0.94) / (2 * Math.max(1e-6, halfWidth)),
    (plot.innerHeight * 0.94) / (2 * Math.max(1e-6, halfHeight)),
  );
  rX *= scale;
  rY *= scale;
  d *= scale;

  const leftCx = cx - d / 2;
  const rightCx = cx + d / 2;
  const lensX = d > 0 ? leftCx + (d * d + rX * rX - rY * rY) / (2 * d) : cx;

  const leftOnly = Math.max(0, hx - ixy);
  const rightOnly = Math.max(0, hy - ixy);

  return (
    <g>
      <circle cx={leftCx} cy={cy} r={rX} fill="var(--color-accent-600)" fillOpacity={0.32} stroke="var(--color-accent-700)" />
      <circle cx={rightCx} cy={cy} r={rY} fill="var(--color-accent-2-600)" fillOpacity={0.32} stroke="var(--color-accent-2-700)" />

      <text x={leftCx} y={cy - rX - 10} textAnchor="middle" fontSize={12} fill="var(--color-accent-700)">
        H(X)
      </text>
      <text x={rightCx} y={cy - rY - 10} textAnchor="middle" fontSize={12} fill="var(--color-accent-2-700)">
        H(Y)
      </text>
      <text x={leftCx - rX * 0.45} y={cy + 4} textAnchor="middle" fontSize={12} fill="var(--color-accent-700)">
        H(X|Y)
      </text>
      <text x={rightCx + rY * 0.45} y={cy + 4} textAnchor="middle" fontSize={12} fill="var(--color-accent-2-700)">
        H(Y|X)
      </text>
      <text x={lensX} y={cy + 4} textAnchor="middle" fontSize={12} fill="var(--color-text)">
        I(X;Y)
      </text>

      <text x={leftCx - rX * 0.45} y={cy + 18} textAnchor="middle" fontSize={10} fill="var(--color-neutral-700)">
        {leftOnly.toFixed(3)}
      </text>
      <text x={rightCx + rY * 0.45} y={cy + 18} textAnchor="middle" fontSize={10} fill="var(--color-neutral-700)">
        {rightOnly.toFixed(3)}
      </text>
      <text x={lensX} y={cy + 18} textAnchor="middle" fontSize={10} fill="var(--color-neutral-700)">
        {Math.max(0, ixy).toFixed(3)}
      </text>
    </g>
  );
};

const InformationVennPage: React.FC = () => {
  const [p00, setP00] = useState<number>(0.1);
  const [p01, setP01] = useState<number>(0.4);
  const [p10, setP10] = useState<number>(0.3);
  const [p11, setP11] = useState<number>(0.2);

  const totalWeight = p00 + p01 + p10 + p11;
  const normalise = (value: number): number => (totalWeight > 0 ? value / totalWeight : 0);

  const q00 = normalise(p00);
  const q01 = normalise(p01);
  const q10 = normalise(p10);
  const q11 = normalise(p11);

  const pX1 = q10 + q11;
  const pX0 = q00 + q01;
  const pY1 = q01 + q11;
  const pY0 = q00 + q10;

  const hX = binaryEntropy(pX1);
  const hY = binaryEntropy(pY1);
  const hXY = jointEntropy([q00, q01, q10, q11]);
  const hXgivenY = Math.max(0, hXY - hY);
  const hYgivenX = Math.max(0, hXY - hX);
  const iXY = Math.max(0, hX + hY - hXY);

  const independent = iXY < 1e-9;

  return (
    <LecturePage slug="information-venn" quiz={<Quiz slug="information-venn" questions={QUESTIONS} />}>
      <p className="it-body-block">
        Entropies behave like areas. Draw two overlapping regions for X and Y: the overlap is the mutual
        information, each crescent is a conditional entropy, and the union is the joint entropy.
      </p>
      <Formula
        tex="H(X,Y) = H(X) + H(Y) - I(X;Y)"
        note="the overlap is counted twice, so it is subtracted once"
        label="Decomposition of joint entropy"
      />

      <h4>Edit the joint distribution P(X,Y)</h4>
      <p className="text-muted" style={{ maxWidth: 620, marginBottom: 'var(--space-3)' }}>
        Enter non-negative weights; they are normalised to a probability table automatically.
      </p>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: 'var(--space-3)',
          maxWidth: 680,
          marginBottom: 'var(--space-4)',
        }}
      >
        <NumberInput label="P(X=0, Y=0)" value={p00} onChange={setP00} min={0} step={0.05} width={200} />
        <NumberInput label="P(X=0, Y=1)" value={p01} onChange={setP01} min={0} step={0.05} width={200} />
        <NumberInput label="P(X=1, Y=0)" value={p10} onChange={setP10} min={0} step={0.05} width={200} />
        <NumberInput label="P(X=1, Y=1)" value={p11} onChange={setP11} min={0} step={0.05} width={200} />
      </div>

      {totalWeight <= 0 ? (
        <Callout title="All weights are zero" tone="warn">
          Raise at least one cell so the table can be normalised.
        </Callout>
      ) : null}

      <div style={{ display: 'flex', gap: 'var(--space-8)', flexWrap: 'wrap', marginBottom: 'var(--space-5)' }}>
        <div>
          <h5 style={{ marginBottom: 'var(--space-2)' }}>Joint and marginal table</h5>
          <table className="table" style={{ width: 'auto' }}>
            <thead>
              <tr>
                <th>X \ Y</th>
                <th>Y=0</th>
                <th>Y=1</th>
                <th>P(X)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><b>X=0</b></td>
                <td>{q00.toFixed(3)}</td>
                <td>{q01.toFixed(3)}</td>
                <td>{pX0.toFixed(3)}</td>
              </tr>
              <tr>
                <td><b>X=1</b></td>
                <td>{q10.toFixed(3)}</td>
                <td>{q11.toFixed(3)}</td>
                <td>{pX1.toFixed(3)}</td>
              </tr>
              <tr>
                <td><b>P(Y)</b></td>
                <td><b>{pY0.toFixed(3)}</b></td>
                <td><b>{pY1.toFixed(3)}</b></td>
                <td><b>{(pX0 + pX1).toFixed(3)}</b></td>
              </tr>
            </tbody>
          </table>
        </div>
        <div>
          <h5 style={{ marginBottom: 'var(--space-2)' }}>Information quantities (bits)</h5>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 280 }}>
            <MetricRow label="H(X)" value={hX.toFixed(4)} valueColor="var(--color-accent-700)" />
            <MetricRow label="H(Y)" value={hY.toFixed(4)} valueColor="var(--color-accent-2-700)" />
            <MetricRow label="H(X|Y)" value={hXgivenY.toFixed(4)} valueColor="var(--color-accent-700)" />
            <MetricRow label="H(Y|X)" value={hYgivenX.toFixed(4)} valueColor="var(--color-accent-2-700)" />
            <MetricRow label="H(X,Y)" value={hXY.toFixed(4)} />
            <MetricRow label={<b>I(X;Y)</b>} value={iXY.toFixed(4)} valueColor="var(--color-text)" />
          </div>
        </div>
      </div>

      <Plot
        xDomain={[0, 1]}
        yDomain={[0, 1]}
        title="Area-proportional information diagram for X and Y"
        desc="Two overlapping regions whose areas equal H(X), H(Y) and I(X;Y); the crescents are the conditional entropies H(X|Y) and H(Y|X), and the union is H(X,Y)."
        height={340}
      >
        <VennDiagram hx={hX} hy={hY} hxy={hXY} ixy={iXY} />
      </Plot>

      {independent ? (
        <Callout title="Independence is the special case I(X;Y) = 0" tone="info">
          Here the regions only touch: X and Y share no information, so every conditional entropy equals its
          marginal — H(X|Y) = H(X) and H(Y|X) = H(Y).
        </Callout>
      ) : (
        <p className="text-muted" style={{ maxWidth: 660 }}>
          The overlap grows as X and Y constrain each other. When one variable becomes a deterministic
          function of the other, I(X;Y) reaches min(H(X), H(Y)) and the smaller region is swallowed entirely.
        </p>
      )}

      <h4 style={{ marginTop: 'var(--space-6)' }}>Why a Venn diagram works</h4>
      <p className="it-body-block">
        Entropy is additive over independent pieces just like area, so the identity
        H(X,Y) = H(X) + H(Y) − I(X;Y) is literally inclusion–exclusion. Reading the pieces off the picture:
        H(X|Y) is the part of X outside Y, H(Y|X) is the part of Y outside X, and I(X;Y) is the shared
        middle. Independence collapses that middle to zero.
      </p>
    </LecturePage>
  );
};

export default InformationVennPage;
