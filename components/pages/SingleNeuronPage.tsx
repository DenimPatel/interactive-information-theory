import React, { useMemo, useState } from 'react';
import Slider from '../Slider';
import MetricRow from '../MetricRow';
import LecturePage from '../shell/LecturePage';
import Formula from '../ui/Formula';
import Quiz, { type QuizQuestion } from '../quiz/Quiz';
import { Axis, Curve, Heatmap, Legend, Marker, Plot } from '../chart';
import SeedControl from '../ui/SeedControl';
import Callout from '../ui/Callout';
import { gaussian, mulberry32, type Rng } from '../../utils/rng';

interface XY {
  x: number;
  y: number;
}

interface LabelledPoint extends XY {
  label: 1 | -1;
}

interface Boundary {
  w1: number;
  w2: number;
  b: number;
  converged: boolean;
}

const NMAX = 12;

const QUESTIONS: QuizQuestion[] = [
  {
    id: 'four-points',
    kind: 'numeric',
    prompt:
      'With N = 4 points in general position in 2-D, how many of the 2⁴ = 16 labellings are linearly separable?',
    answer: 14,
    tolerance: 0.5,
    unit: 'labellings',
    explanation:
      'Cover’s count is 2·(C(3,0)+C(3,1)+C(3,2)) = 2·(1+3+3) = 14. Only the two “alternating” labellings of four points in convex position fail.',
  },
  {
    id: 'cover-formula',
    kind: 'choice',
    prompt: 'The number of linearly separable dichotomies of N points in general position in d dimensions is…',
    options: [
      { label: '2ᴺ' },
      { label: '2·Σ_{k=0}^{d} C(N−1, k)', correct: true },
      { label: 'Nᵈ' },
      { label: '2N' },
    ],
    explanation:
      'Cover’s theorem. Writing the sum to N−1 instead of d gives 2ᴺ, i.e. every labelling, which only holds when the neuron can shatter the points.',
  },
  {
    id: 'vc-dim',
    kind: 'choice',
    prompt: 'A linear boundary in d dimensions (with a bias term) can realise every labelling of how many points?',
    options: [
      { label: 'At most d + 1', correct: true },
      { label: 'At most d' },
      { label: 'At most 2d' },
      { label: 'Any number' },
    ],
    explanation:
      'The VC dimension of an affine hyperplane in d dimensions is d + 1. Beyond that, only a fraction of labellings are separable.',
  },
  {
    id: 'total-dichotomies',
    kind: 'numeric',
    prompt: 'How many distinct dichotomies (labellings) exist for N = 6 points?',
    answer: 64,
    tolerance: 0.5,
    unit: 'labellings',
    explanation: 'Each of the 6 points gets one of two labels: 2⁶ = 64.',
  },
];

const binomial = (n: number, k: number): number => {
  if (k < 0 || k > n) return 0;
  let result = 1;
  for (let i = 0; i < k; i++) result = (result * (n - i)) / (i + 1);
  return Math.round(result);
};

const coverCount = (n: number, d: number): number => {
  let sum = 0;
  for (let k = 0; k <= Math.min(d, n - 1); k++) sum += binomial(n - 1, k);
  return 2 * sum;
};

const generatePoints = (rng: Rng, n: number): XY[] => {
  const points: XY[] = [];
  let guard = 0;
  while (points.length < n && guard < 20000) {
    guard += 1;
    const x = 2 * rng() - 1;
    const y = 2 * rng() - 1;
    if (points.some((p) => Math.hypot(p.x - x, p.y - y) < 0.07)) continue;
    let generalPosition = true;
    for (let i = 0; i < points.length && generalPosition; i++) {
      for (let j = i + 1; j < points.length; j++) {
        const a = points[i];
        const b = points[j];
        const area = Math.abs((b.x - a.x) * (y - a.y) - (b.y - a.y) * (x - a.x));
        if (area < 0.015) {
          generalPosition = false;
          break;
        }
      }
    }
    if (generalPosition) points.push({ x, y });
  }
  return points;
};

const cross = (o: XY, a: XY, b: XY): number => (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);

const convexHull = (points: XY[]): XY[] => {
  if (points.length <= 1) return points.slice();
  const sorted = [...points].sort((a, b) => a.x - b.x || a.y - b.y);
  const lower: XY[] = [];
  for (const point of sorted) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], point) <= 1e-12) {
      lower.pop();
    }
    lower.push(point);
  }
  const upper: XY[] = [];
  for (let i = sorted.length - 1; i >= 0; i--) {
    const point = sorted[i];
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], point) <= 1e-12) {
      upper.pop();
    }
    upper.push(point);
  }
  lower.pop();
  upper.pop();
  return lower.concat(upper);
};

const projection = (hull: XY[], ax: number, ay: number): [number, number] => {
  let min = Infinity;
  let max = -Infinity;
  for (const point of hull) {
    const value = point.x * ax + point.y * ay;
    min = Math.min(min, value);
    max = Math.max(max, value);
  }
  return [min, max];
};

const separatedByAxis = (a: XY[], b: XY[], ax: number, ay: number): boolean => {
  const [amin, amax] = projection(a, ax, ay);
  const [bmin, bmax] = projection(b, ax, ay);
  return amax < bmin - 1e-9 || bmax < amin - 1e-9;
};

const hullsSeparable = (a: XY[], b: XY[]): boolean => {
  if (a.length === 0 || b.length === 0) return true;
  const axes: [number, number][] = [];
  const addAxes = (hull: XY[]) => {
    if (hull.length < 2) return;
    for (let i = 0; i < hull.length; i++) {
      const p = hull[i];
      const q = hull[(i + 1) % hull.length];
      axes.push([-(q.y - p.y), q.x - p.x]);
    }
  };
  addAxes(a);
  addAxes(b);
  if (axes.length === 0) return true;
  return axes.some(([ax, ay]) => separatedByAxis(a, b, ax, ay));
};

const isSeparable = (points: LabelledPoint[]): boolean => {
  const positive = points.filter((p) => p.label === 1).map(({ x, y }) => ({ x, y }));
  const negative = points.filter((p) => p.label === -1).map(({ x, y }) => ({ x, y }));
  if (positive.length === 0 || negative.length === 0) return true;
  return hullsSeparable(convexHull(positive), convexHull(negative));
};

const countSeparable = (points: XY[]): number => {
  const n = points.length;
  const total = 1 << n;
  const work: LabelledPoint[] = points.map((p) => ({ x: p.x, y: p.y, label: 1 }));
  let count = 0;
  for (let mask = 0; mask < total; mask++) {
    for (let i = 0; i < n; i++) work[i].label = (mask >> i) & 1 ? 1 : -1;
    if (isSeparable(work)) count += 1;
  }
  return count;
};

const trainPerceptron = (points: LabelledPoint[], epochs: number): Boundary => {
  let w1 = 0;
  let w2 = 0;
  let b = 0;
  let converged = false;
  for (let epoch = 0; epoch < epochs; epoch++) {
    let updates = 0;
    for (const point of points) {
      if (point.label * (w1 * point.x + w2 * point.y + b) <= 0) {
        w1 += point.label * point.x;
        w2 += point.label * point.y;
        b += point.label;
        updates += 1;
      }
    }
    if (updates === 0) {
      converged = true;
      break;
    }
  }
  return { w1, w2, b, converged };
};

const clipLine = (
  w1: number,
  w2: number,
  b: number,
  xr: [number, number],
  yr: [number, number],
): XY[] => {
  const candidates: XY[] = [];
  const eps = 1e-9;
  if (Math.abs(w2) > eps) {
    for (const x of xr) {
      const y = -(w1 * x + b) / w2;
      if (y >= yr[0] - 1e-9 && y <= yr[1] + 1e-9) candidates.push({ x, y });
    }
  }
  if (Math.abs(w1) > eps) {
    for (const y of yr) {
      const x = -(w2 * y + b) / w1;
      if (x >= xr[0] - 1e-9 && x <= xr[1] + 1e-9) candidates.push({ x, y });
    }
  }
  if (candidates.length < 2) return [];
  let bestPair: XY[] = [];
  let bestDistance = -1;
  for (let i = 0; i < candidates.length; i++) {
    for (let j = i + 1; j < candidates.length; j++) {
      const distance = Math.hypot(candidates[i].x - candidates[j].x, candidates[i].y - candidates[j].y);
      if (distance > bestDistance) {
        bestDistance = distance;
        bestPair = [candidates[i], candidates[j]];
      }
    }
  }
  return bestPair;
};

const sampleConsistent = (points: LabelledPoint[], rng: Rng, limit: number): Boundary[] => {
  const found: Boundary[] = [];
  let guard = 0;
  while (found.length < limit && guard < 8000) {
    guard += 1;
    const w1 = gaussian(rng);
    const w2 = gaussian(rng);
    const b = gaussian(rng) * 0.6;
    if (points.every((p) => p.label * (w1 * p.x + w2 * p.y + b) > 0)) {
      found.push({ w1, w2, b, converged: true });
    }
  }
  return found;
};

const buildPosterior = (points: LabelledPoint[]): number[][] => {
  const thetaCount = 64;
  const offsetCount = 64;
  const bMax = 2.5;
  const sigma = 1.5;
  const data: number[][] = [];
  for (let rowIndex = 0; rowIndex < offsetCount; rowIndex++) {
    const b = bMax - (2 * bMax * rowIndex) / (offsetCount - 1);
    const row: number[] = [];
    for (let colIndex = 0; colIndex < thetaCount; colIndex++) {
      const theta = (2 * Math.PI * colIndex) / thetaCount;
      const nx = Math.cos(theta);
      const ny = Math.sin(theta);
      let minPositive = Infinity;
      let maxNegative = -Infinity;
      for (const p of points) {
        const value = nx * p.x + ny * p.y;
        if (p.label === 1) minPositive = Math.min(minPositive, value);
        else maxNegative = Math.max(maxNegative, value);
      }
      const consistent = maxNegative < b && b < minPositive;
      row.push(consistent ? Math.exp(-(b * b) / (2 * sigma * sigma)) : 0);
    }
    data.push(row);
  }
  return data;
};

const SingleNeuronPage: React.FC = () => {
  const [seed, setSeed] = useState<number>(20240517);
  const [n, setN] = useState<number>(8);

  const instance = useMemo(() => {
    const rng = mulberry32(seed);
    const points: LabelledPoint[] = generatePoints(rng, n).map((p) => ({
      x: p.x,
      y: p.y,
      label: (rng() < 0.5 ? 1 : -1) as 1 | -1,
    }));
    const separable = isSeparable(points);
    const separableCount = countSeparable(points);
    const cover = coverCount(n, 2);
    const samples = separable ? sampleConsistent(points, mulberry32(seed ^ 0x9e3779b9), 12) : [];
    const boundary = trainPerceptron(points, 400);
    const posterior = buildPosterior(points);
    return { points, separable, separableCount, cover, samples, boundary, posterior };
  }, [seed, n]);

  const countCurve = useMemo(() => {
    const empirical: XY[] = [];
    const theoretical: XY[] = [];
    const total: XY[] = [];
    for (let k = 3; k <= NMAX; k++) {
      const points = generatePoints(mulberry32(seed + k * 1013), k);
      empirical.push({ x: k, y: countSeparable(points) });
      theoretical.push({ x: k, y: coverCount(k, 2) });
      total.push({ x: k, y: 2 ** k });
    }
    return { empirical, theoretical, total };
  }, [seed]);

  const bounds = useMemo(() => {
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;
    for (const p of instance.points) {
      minX = Math.min(minX, p.x);
      maxX = Math.max(maxX, p.x);
      minY = Math.min(minY, p.y);
      maxY = Math.max(maxY, p.y);
    }
    const padX = Math.max(0.2, (maxX - minX) * 0.15);
    const padY = Math.max(0.2, (maxY - minY) * 0.15);
    return {
      xr: [minX - padX, maxX + padX] as [number, number],
      yr: [minY - padY, maxY + padY] as [number, number],
    };
  }, [instance]);

  const boundaryPoints = useMemo(() => {
    const { w1, w2, b } = instance.boundary;
    if (Math.hypot(w1, w2) < 1e-9) return [];
    return clipLine(w1, w2, b, bounds.xr, bounds.yr);
  }, [instance, bounds]);

  const sampleLines = useMemo(
    () => instance.samples.map((s) => clipLine(s.w1, s.w2, s.b, bounds.xr, bounds.yr)).filter((line) => line.length === 2),
    [instance, bounds],
  );

  const totalLabellings = 2 ** n;
  const fraction = totalLabellings > 0 ? instance.separableCount / totalLabellings : 0;
  const allMax = 2 ** NMAX;

  return (
    <LecturePage slug="single-neuron" quiz={<Quiz slug="single-neuron" questions={QUESTIONS} />}>
      <p className="it-body-block">
        A single neuron is a linear threshold: it splits the input space with a hyperplane. Its capacity
        is the number of labellings of N points it can realise — and it drops off a cliff once N grows
        beyond roughly twice the input dimension.
      </p>
      <Formula
        tex="C(N,d) = 2\sum_{k=0}^{d} \binom{N-1}{k}"
        note="Cover's theorem: linearly separable dichotomies of N points in general position in d dimensions"
        label="Cover's counting theorem"
      />
      <Formula
        tex="2\sum_{k=0}^{N-1} \binom{N-1}{k} = 2^{N}"
        note="when the sum runs to N−1 it counts all labellings — the shatterable regime N ≤ d + 1"
        label="Total labellings identity"
      />

      <h4>Place N points in general position</h4>
      <p className="it-body-block">
        Points are drawn at random, rejected until no three are collinear. Labels are random; the panel
        counts how many of the 2ᴺ labellings a straight line can separate, using a convex-hull test.
      </p>
      <SeedControl seed={seed} onNewSeed={setSeed} />
      <Slider
        label="Number of points N"
        valueLabel={n}
        value={n}
        min={3}
        max={NMAX}
        step={1}
        onChange={setN}
        style={{ maxWidth: 420, marginTop: 'var(--space-3)' }}
      />

      <div style={{ display: 'flex', gap: 'var(--space-6)', flexWrap: 'wrap', margin: 'var(--space-4) 0' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 240 }}>
          <MetricRow label="All labellings 2ᴺ" value={totalLabellings} />
          <MetricRow label="Separable (enumerated)" value={instance.separableCount} valueColor="var(--color-accent-700)" />
          <MetricRow label="Cover prediction" value={instance.cover} valueColor="var(--color-accent-2-700)" />
          <MetricRow label="Separable fraction" value={`${(fraction * 100).toFixed(1)}%`} />
          <MetricRow
            label="Current labelling separable?"
            value={instance.separable ? 'yes' : 'no'}
            valueColor={instance.separable ? 'var(--color-accent-700)' : 'var(--color-accent-2-700)'}
          />
        </div>
        <div style={{ fontSize: 13, maxWidth: 320 }} className="text-muted">
          The enumerated count matches Cover’s formula exactly whenever the points are in general
          position. The mismatch against 2ᴺ is the neuron’s shortfall: at N = {n} it can realise only{' '}
          {instance.separableCount} of {totalLabellings} possible labellings.
        </div>
      </div>

      <Plot
        xDomain={[3, NMAX]}
        yDomain={[0, allMax * 1.05]}
        title="Separable dichotomies versus N"
        desc="The total number of labellings grows as 2^N, while Cover's count grows only like a degree-d polynomial. A vertical dashed line marks the rule-of-thumb 2d cliff."
        height={320}
      >
        <Axis orient="left" label="number of labellings" />
        <Axis orient="bottom" label="N (points)" ticks={[3, 4, 5, 6, 7, 8, 9, 10, 11, 12]} />
        <Curve points={countCurve.total} color="var(--color-neutral-400)" dashed />
        <Curve points={countCurve.theoretical} color="var(--color-accent-2-700)" />
        <Curve points={countCurve.empirical} color="var(--color-accent-700)" width={3} />
        <Curve points={[{ x: 4, y: 0 }, { x: 4, y: allMax * 1.05 }]} color="var(--color-neutral-500)" dashed />
        <Marker x={n} y={instance.separableCount} label={`N=${n}: ${instance.separableCount}`} />
      </Plot>
      <Legend
        items={[
          { label: 'empirical separable count', color: 'var(--color-accent-700)' },
          { label: "Cover's 2 Σ_{k=0}^{d} C(N−1,k)", color: 'var(--color-accent-2-700)' },
          { label: 'all labellings 2ᴺ', color: 'var(--color-neutral-400)', dashed: true },
          { label: '2d cliff (here 2·2 = 4)', color: 'var(--color-neutral-500)', dashed: true },
        ]}
      />

      <Callout title="The 2N cliff">
        A common rule of thumb: a linear classifier keeps up until about N ≈ 2d points, after which the
        fraction of separable labellings collapses toward zero. Precisely, it can shatter any N ≤ d + 1
        points (VC dimension d + 1); beyond that, separability is a vanishing fraction of all labellings.
      </Callout>

      <h4>Learning as inference</h4>
      <p className="it-body-block">
        Learning the weights is Bayesian inference: every weight vector that classifies the labels is
        equally consistent, and a prior down-weights large weights. The left panel samples such
        consistent separators; the right panel maps the posterior over separator direction θ and offset b.
      </p>

      <Plot
        xDomain={bounds.xr}
        yDomain={bounds.yr}
        title="Labelled points and consistent decision boundaries"
        desc="Points are coloured by label; the bold line is a perceptron boundary and the faint lines are weight vectors sampled from the consistent set."
        height={360}
      >
        <Axis orient="left" label="x₂" />
        <Axis orient="bottom" label="x₁" />
        {sampleLines.map((line, index) => (
          <Curve key={`sample-${index}`} points={line} color="var(--color-neutral-400)" width={1} dashed />
        ))}
        {boundaryPoints.length === 2 ? (
          <Curve points={boundaryPoints} color="var(--color-neutral-800)" width={2} />
        ) : null}
        {instance.points.map((point, index) => (
          <Marker
            key={index}
            x={point.x}
            y={point.y}
            radius={5}
            color={point.label === 1 ? 'var(--color-accent-700)' : 'var(--color-accent-2-700)'}
          />
        ))}
      </Plot>
      <Legend
        items={[
          { label: 'label +1', color: 'var(--color-accent-700)' },
          { label: 'label −1', color: 'var(--color-accent-2-700)' },
          { label: 'sampled consistent separator', color: 'var(--color-neutral-400)', dashed: true },
        ]}
      />

      <Plot
        xDomain={[0, 2 * Math.PI]}
        yDomain={[-2.5, 2.5]}
        title="Weight-space posterior over direction θ and offset b"
        desc="Brightness is the Gaussian prior mass over separator direction and offset, restricted to separators consistent with every label. A dark map means no linear separator exists."
        height={320}
      >
        <Axis orient="left" label="offset b" />
        <Axis orient="bottom" label="direction θ (radians)" ticks={[0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2, 2 * Math.PI]} />
        <Heatmap
          data={instance.posterior}
          max={1}
          colorFor={(t) => `color-mix(in srgb, var(--color-accent-2-700) ${Math.round(4 + t * 92)}%, var(--color-bg))`}
        />
      </Plot>

      <h4>Why capacity matters</h4>
      <ul style={{ maxWidth: 640, paddingLeft: 20 }}>
        <li>Each additional point doubles the number of labellings a perfect classifier must handle.</li>
        <li>A single neuron can only realise a polynomial number of them, so its relative capacity shrinks.</li>
        <li>The weight-space view turns training into inference: consistent weights form a region, not a point.</li>
        <li>Huge weights are one way to fit too much; a prior over weights is the Bayesian cure for overfitting.</li>
      </ul>
    </LecturePage>
  );
};

export default SingleNeuronPage;
