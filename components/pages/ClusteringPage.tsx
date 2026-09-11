import React, { useMemo, useState } from 'react';
import LecturePage from '../shell/LecturePage';
import Formula from '../ui/Formula';
import Quiz, { type QuizQuestion } from '../quiz/Quiz';
import Slider from '../Slider';
import MetricRow from '../MetricRow';
import Callout from '../ui/Callout';
import SegmentedControl from '../ui/SegmentedControl';
import SeedControl from '../ui/SeedControl';
import SimControls from '../ui/SimControls';
import { Axis, Curve, Legend, Plot, seriesColor } from '../chart';
import { useAnimationLoop } from '../../hooks/useAnimationLoop';
import { gaussian, mulberry32, shuffle, type Rng } from '../../utils/rng';

interface Pt {
  x: number;
  y: number;
}

type Kind = 'hard' | 'soft' | 'gmm';

interface Component {
  mean: Pt;
  cov: [number, number, number];
  weight: number;
}

interface SimState {
  kind: Kind;
  points: Pt[];
  centers: Pt[];
  resp: number[][];
  comps: Component[];
  history: number[];
  iteration: number;
  objective: number;
}

const COV_FLOOR = 1e-3;
const BETA = 12;
const MAX_HISTORY = 240;

const W = 560;
const H = 420;
const MARGIN = { left: 34, right: 14, top: 12, bottom: 34 };
const INNER_W = W - MARGIN.left - MARGIN.right;
const INNER_H = H - MARGIN.top - MARGIN.bottom;

const toPx = (x: number): number => MARGIN.left + x * INNER_W;
const toPy = (y: number): number => MARGIN.top + (1 - y) * INNER_H;
const clamp01 = (value: number): number => Math.min(1, Math.max(0, value));
const dist2 = (a: Pt, b: Pt): number => (a.x - b.x) ** 2 + (a.y - b.y) ** 2;

const argmax = (row: number[]): number => {
  let best = 0;
  let bestValue = -Infinity;
  for (let i = 0; i < row.length; i += 1) {
    if (row[i] > bestValue) {
      bestValue = row[i];
      best = i;
    }
  }
  return best;
};

const softmax = (logits: number[]): number[] => {
  const max = Math.max(...logits);
  if (!Number.isFinite(max)) return logits.map(() => 1 / logits.length);
  const exps = logits.map((value) => Math.exp(value - max));
  const sum = exps.reduce((total, value) => total + value, 0);
  return sum > 0 ? exps.map((value) => value / sum) : logits.map(() => 1 / logits.length);
};

const logSumExp = (values: number[]): number => {
  const max = Math.max(...values);
  if (!Number.isFinite(max)) return max;
  let sum = 0;
  for (const value of values) sum += Math.exp(value - max);
  return max + Math.log(sum);
};

const logGaussian = (p: Pt, comp: Component): number => {
  const [sxx, sxy, syy] = comp.cov;
  const det = Math.max(sxx * syy - sxy * sxy, COV_FLOOR);
  const dx = p.x - comp.mean.x;
  const dy = p.y - comp.mean.y;
  const maha = (syy * dx * dx - 2 * sxy * dx * dy + sxx * dy * dy) / det;
  return (
    Math.log(Math.max(comp.weight, 1e-12)) -
    Math.log(2 * Math.PI) -
    0.5 * Math.log(det) -
    0.5 * Math.max(0, maha)
  );
};

const makeBlobs = (seed: number): Pt[] => {
  const rng = mulberry32(seed);
  const centers: Pt[] = [
    { x: 0.28, y: 0.32 },
    { x: 0.72, y: 0.6 },
    { x: 0.3, y: 0.78 },
  ];
  const points: Pt[] = [];
  for (const center of centers) {
    for (let i = 0; i < 14; i += 1) {
      points.push({
        x: clamp01(center.x + 0.055 * gaussian(rng)),
        y: clamp01(center.y + 0.055 * gaussian(rng)),
      });
    }
  }
  return points;
};

const pickCenters = (points: Pt[], k: number, rng: Rng): Pt[] => {
  if (points.length === 0) {
    return Array.from({ length: k }, () => ({ x: rng(), y: rng() }));
  }
  const order = shuffle(rng, points.map((_, index) => index));
  return Array.from({ length: k }, (_, j) => {
    const point = points[order[j % order.length]];
    return { x: point.x, y: point.y };
  });
};

const initState = (points: Pt[], k: number, kind: Kind, seed: number): SimState => {
  const rng = mulberry32((seed ^ 0x9e3779b9) >>> 0);
  const count = Math.max(1, Math.min(k, Math.max(1, points.length)));
  const centers = pickCenters(points, count, rng);
  const comps: Component[] = centers.map((center) => ({
    mean: { ...center },
    cov: [0.02, 0, 0.02] as [number, number, number],
    weight: 1 / count,
  }));
  let resp = points.map(() => new Array<number>(count).fill(1 / count));
  if (points.length > 0) {
    if (kind === 'hard') {
      resp = points.map((point) => {
        let best = 0;
        let bestDist = Infinity;
        for (let j = 0; j < count; j += 1) {
          const d = dist2(point, centers[j]);
          if (d < bestDist) {
            bestDist = d;
            best = j;
          }
        }
        const row = new Array<number>(count).fill(0);
        row[best] = 1;
        return row;
      });
    } else if (kind === 'soft') {
      resp = points.map((point) => softmax(centers.map((center) => -BETA * dist2(point, center))));
    } else {
      resp = points.map((point) => softmax(comps.map((comp) => logGaussian(point, comp))));
    }
  }
  return {
    kind,
    points,
    centers,
    resp,
    comps,
    history: [],
    iteration: 0,
    objective: 0,
  };
};

const pushHistory = (history: number[], value: number): number[] => {
  const next = [...history, value];
  return next.length > MAX_HISTORY ? next.slice(next.length - MAX_HISTORY) : next;
};

const hardStep = (state: SimState): void => {
  const k = state.centers.length;
  const resp = state.points.map((point) => {
    let best = 0;
    let bestDist = Infinity;
    for (let j = 0; j < k; j += 1) {
      const d = dist2(point, state.centers[j]);
      if (d < bestDist) {
        bestDist = d;
        best = j;
      }
    }
    const row = new Array<number>(k).fill(0);
    row[best] = 1;
    return row;
  });
  const counts = new Array<number>(k).fill(0);
  const sums = state.centers.map(() => ({ x: 0, y: 0 }));
  state.points.forEach((point, i) => {
    const j = argmax(resp[i]);
    counts[j] += 1;
    sums[j].x += point.x;
    sums[j].y += point.y;
  });
  const centers = state.centers.map((center, j) =>
    counts[j] > 0 ? { x: sums[j].x / counts[j], y: sums[j].y / counts[j] } : { ...center },
  );
  let inertia = 0;
  state.points.forEach((point, i) => {
    inertia += dist2(point, centers[argmax(resp[i])]);
  });
  state.centers = centers;
  state.resp = resp;
  state.objective = -inertia;
  state.iteration += 1;
  state.history = pushHistory(state.history, state.objective);
};

const softStep = (state: SimState): void => {
  const k = state.centers.length;
  const resp = state.points.map((point) => softmax(state.centers.map((center) => -BETA * dist2(point, center))));
  const masses = new Array<number>(k).fill(0);
  const sums = state.centers.map(() => ({ x: 0, y: 0 }));
  state.points.forEach((point, i) => {
    const row = resp[i];
    for (let j = 0; j < k; j += 1) {
      masses[j] += row[j];
      sums[j].x += row[j] * point.x;
      sums[j].y += row[j] * point.y;
    }
  });
  const centers = state.centers.map((center, j) =>
    masses[j] > 1e-12 ? { x: sums[j].x / masses[j], y: sums[j].y / masses[j] } : { ...center },
  );
  let objective = 0;
  for (const point of state.points) {
    objective += logSumExp(centers.map((center) => -BETA * dist2(point, center)));
  }
  state.centers = centers;
  state.resp = resp;
  state.objective = objective;
  state.iteration += 1;
  state.history = pushHistory(state.history, state.objective);
};

const gmmStep = (state: SimState): void => {
  const k = state.comps.length;
  if (state.points.length === 0) {
    state.iteration += 1;
    return;
  }
  const logpdf = state.points.map((point) => state.comps.map((comp) => logGaussian(point, comp)));
  const resp = logpdf.map((row) => softmax(row));
  const mass = new Array<number>(k).fill(0);
  resp.forEach((row) => row.forEach((value, j) => { mass[j] += value; }));
  const comps = state.comps.map((_comp, j) => {
    if (mass[j] < 1e-8) {
      let worst = 0;
      let worstScore = Infinity;
      resp.forEach((row, i) => {
        if (row[j] < worstScore) {
          worstScore = row[j];
          worst = i;
        }
      });
      return { mean: { ...state.points[worst] }, cov: [0.02, 0, 0.02] as [number, number, number], weight: 1 / k };
    }
    const m = mass[j];
    let mx = 0;
    let my = 0;
    state.points.forEach((point, i) => {
      mx += resp[i][j] * point.x;
      my += resp[i][j] * point.y;
    });
    mx /= m;
    my /= m;
    let sxx = 0;
    let sxy = 0;
    let syy = 0;
    state.points.forEach((point, i) => {
      const dx = point.x - mx;
      const dy = point.y - my;
      sxx += resp[i][j] * dx * dx;
      sxy += resp[i][j] * dx * dy;
      syy += resp[i][j] * dy * dy;
    });
    return {
      mean: { x: mx, y: my },
      cov: [sxx / m + COV_FLOOR, sxy / m, syy / m + COV_FLOOR] as [number, number, number],
      weight: m / state.points.length,
    };
  });
  const totalWeight = comps.reduce((sum, comp) => sum + comp.weight, 0);
  const normalized = comps.map((comp) => ({ ...comp, weight: totalWeight > 0 ? comp.weight / totalWeight : 1 / k }));
  let objective = 0;
  for (const point of state.points) {
    objective += logSumExp(normalized.map((comp) => logGaussian(point, comp)));
  }
  state.comps = normalized;
  state.resp = resp;
  state.centers = normalized.map((comp) => comp.mean);
  state.objective = objective;
  state.iteration += 1;
  state.history = pushHistory(state.history, state.objective);
};

const stepState = (state: SimState, kind: Kind): SimState => {
  const next: SimState = {
    ...state,
    centers: state.centers.map((center) => ({ ...center })),
    resp: state.resp.map((row) => row.slice()),
    comps: state.comps.map((comp) => ({ ...comp, mean: { ...comp.mean }, cov: [...comp.cov] as [number, number, number] })),
    history: state.history.slice(),
  };
  if (kind === 'hard') hardStep(next);
  else if (kind === 'soft') softStep(next);
  else gmmStep(next);
  return next;
};

interface Ellipse {
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  deg: number;
}

const ellipseOf = (comp: Component): Ellipse => {
  const [sxx, sxy, syy] = comp.cov;
  const ap = sxx * INNER_W * INNER_W;
  const bp = -sxy * INNER_W * INNER_H;
  const cp = syy * INNER_H * INNER_H;
  const trace = ap + cp;
  const diff = ap - cp;
  const disc = Math.sqrt(Math.max(0, diff * diff + 4 * bp * bp));
  const l1 = (trace + disc) / 2;
  const l2 = (trace - disc) / 2;
  return {
    cx: toPx(comp.mean.x),
    cy: toPy(comp.mean.y),
    rx: Math.min(Math.sqrt(Math.max(l1, 0)) * 1.5, 2000),
    ry: Math.min(Math.sqrt(Math.max(l2, 0)) * 1.5, 2000),
    deg: (0.5 * Math.atan2(2 * bp, diff) * 180) / Math.PI,
  };
};

const QUESTIONS: QuizQuestion[] = [
  {
    id: 'em-monotone',
    kind: 'choice',
    prompt: 'What does the EM algorithm guarantee about the log-likelihood at each iteration?',
    options: [
      { label: 'It always decreases' },
      { label: 'It never decreases', correct: true },
      { label: 'It oscillates around the maximum' },
      { label: 'It is unrelated to the parameters' },
    ],
    explanation:
      'The E and M steps together increase (or leave unchanged) the observed-data log-likelihood, so the curve climbs to a local optimum.',
  },
  {
    id: 'hard-vs-soft',
    kind: 'choice',
    prompt: 'What distinguishes soft K-means from hard K-means?',
    options: [
      { label: 'Soft K-means assigns each point to exactly one centre' },
      { label: 'Soft K-means uses responsibilities that can be shared across centres', correct: true },
      { label: 'Soft K-means has no centres' },
      { label: 'Hard K-means maximises a likelihood' },
    ],
    explanation:
      'Hard K-means is winner-take-all; soft K-means weights every point by its responsibility for each centre.',
  },
  {
    id: 'kmeans-objective',
    kind: 'numeric',
    prompt: 'Two points at (0, 0) and (1, 0) are assigned to one centre at (0.5, 0). What is the K-means objective J?',
    answer: 0.5,
    tolerance: 1e-6,
    explanation: 'J = 0.5² + 0.5² = 0.25 + 0.25 = 0.5.',
  },
  {
    id: 'gmm-model',
    kind: 'choice',
    prompt: 'A Gaussian mixture model represents each cluster as…',
    options: [
      { label: 'A single point' },
      { label: 'A Gaussian with its own weight, mean, and covariance', correct: true },
      { label: 'A hard boundary' },
      { label: 'A uniform ball of fixed radius' },
    ],
    explanation:
      'Each mixture component is a weighted Gaussian; EM fits all weights, means, and covariances jointly.',
  },
];

const ClusteringPage: React.FC = () => {
  const [seed, setSeed] = useState<number>(7);
  const [k, setK] = useState<number>(3);
  const [kind, setKind] = useState<Kind>('hard');
  const [sim, setSim] = useState<SimState>(() => initState(makeBlobs(7), 3, 'hard', 7));

  const loop = useAnimationLoop({
    tick: () => setSim((prev) => stepState(prev, kind)),
    onReset: () => setSim(initState(sim.points, k, kind, seed)),
    initialSpeed: 4,
  });

  const addPoint = (point: Pt) => {
    if (sim.points.length >= 400) return;
    setSim(initState([...sim.points, point], k, kind, seed));
  };

  const resetWith = (nextPoints: Pt[], nextK: number, nextKind: Kind, nextSeed: number) => {
    setSim(initState(nextPoints, nextK, nextKind, nextSeed));
  };

  const handleClick = (event: React.MouseEvent<SVGSVGElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    const px = ((event.clientX - rect.left) / rect.width) * W;
    const py = ((event.clientY - rect.top) / rect.height) * H;
    const x = (px - MARGIN.left) / INNER_W;
    const y = 1 - (py - MARGIN.top) / INNER_H;
    if (x < 0 || x > 1 || y < 0 || y > 1) return;
    addPoint({ x, y });
  };

  const historyDomain = useMemo(() => {
    if (sim.history.length < 2) {
      return { x: [0, 1] as [number, number], y: [0, 1] as [number, number] };
    }
    const low = Math.min(...sim.history);
    const high = Math.max(...sim.history);
    const pad = Math.max(1e-3, (high - low) * 0.1);
    return { x: [0, sim.history.length - 1] as [number, number], y: [low - pad, high + pad] as [number, number] };
  }, [sim.history]);

  const historyPoints = sim.history.map((value, index) => ({ x: index, y: value }));
  const objectiveLabel = kind === 'hard' ? '− inertia' : kind === 'soft' ? 'soft objective' : 'log-likelihood';
  const clusterCount = sim.centers.length;

  return (
    <LecturePage slug="clustering" quiz={<Quiz slug="clustering" questions={QUESTIONS} />}>
      <p className="it-body-block">
        Clustering asks how to group unlabelled points around prototypes. Hard K-means makes one
        assignment per point, soft K-means shares each point between centres, and full Gaussian-mixture
        EM fits a weighted Gaussian to every cluster.
      </p>
      <Formula
        tex="\mathcal{L}(\theta) = \sum_i \log \sum_j \pi_j\, \mathcal{N}(x_i \mid \mu_j, \Sigma_j)"
        note="the observed-data log-likelihood that EM climbs"
        label="Gaussian-mixture log-likelihood"
      />
      <Formula
        tex="r_{ij} = \frac{\pi_j \mathcal{N}(x_i \mid \mu_j, \Sigma_j)}{\sum_l \pi_l \mathcal{N}(x_i \mid \mu_l, \Sigma_l)}"
        note="the E step: responsibilities of each Gaussian for each point"
        label="Responsibility of component j for point i"
      />

      <div style={{ display: 'flex', gap: 'var(--space-6)', flexWrap: 'wrap', marginBottom: 'var(--space-4)' }}>
        <SegmentedControl<Kind>
          label="Algorithm"
          name="clustering-kind"
          value={kind}
          onChange={(value) => {
            setKind(value);
            resetWith(sim.points, k, value, seed);
          }}
          options={[
            { value: 'hard', label: 'Hard K-means' },
            { value: 'soft', label: 'Soft K-means' },
            { value: 'gmm', label: 'Gaussian mixture EM' },
          ]}
        />
        <Slider
          label="Clusters K"
          valueLabel={k}
          value={k}
          min={1}
          max={6}
          step={1}
          onChange={(value) => {
            const nextK = Math.round(value);
            setK(nextK);
            resetWith(sim.points, nextK, kind, seed);
          }}
          style={{ maxWidth: 260, flex: 1 }}
        />
      </div>

      <div style={{ display: 'flex', gap: 'var(--space-6)', flexWrap: 'wrap', marginBottom: 'var(--space-4)' }}>
        <SeedControl
          seed={seed}
          onNewSeed={(value) => {
            setSeed(value);
            resetWith(makeBlobs(value), k, kind, value);
          }}
        />
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => resetWith([], k, kind, seed)}
        >
          Clear points
        </button>
      </div>

      <SimControls
        loop={loop}
        runLabel="Run"
        onReset={() => resetWith(sim.points, k, kind, seed)}
        speedRange={[1, 20]}
      />

      <p className="text-muted" style={{ fontSize: 12, margin: 'var(--space-3) 0' }}>
        Click inside the plot to add points. Colours show the current (soft) assignment.
      </p>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-labelledby="clustering-title"
        aria-describedby="clustering-desc"
        onClick={handleClick}
        style={{
          width: '100%',
          maxWidth: W,
          height: 'auto',
          display: 'block',
          background: 'var(--color-surface)',
          borderRadius: 'var(--radius-md)',
          cursor: 'crosshair',
          border: '1px solid var(--color-divider)',
        }}
      >
        <title id="clustering-title">Point cloud with fitted cluster centres</title>
        <desc id="clustering-desc">
          Each point is coloured by its strongest assignment, centres are drawn as rings, and Gaussian
          mixture covariances are drawn as ellipses.
        </desc>

        {[0.25, 0.5, 0.75].map((tick) => (
          <g key={tick}>
            <line
              x1={toPx(tick)}
              y1={MARGIN.top}
              x2={toPx(tick)}
              y2={MARGIN.top + INNER_H}
              stroke="var(--color-divider)"
              strokeWidth={1}
              opacity={0.5}
            />
            <line
              x1={MARGIN.left}
              y1={toPy(tick)}
              x2={MARGIN.left + INNER_W}
              y2={toPy(tick)}
              stroke="var(--color-divider)"
              strokeWidth={1}
              opacity={0.5}
            />
          </g>
        ))}

        {kind === 'gmm'
          ? sim.comps.map((comp, j) => {
              const ellipse = ellipseOf(comp);
              return (
                <ellipse
                  key={`ellipse-${j}`}
                  cx={ellipse.cx}
                  cy={ellipse.cy}
                  rx={ellipse.rx}
                  ry={ellipse.ry}
                  transform={`rotate(${ellipse.deg} ${ellipse.cx} ${ellipse.cy})`}
                  fill="none"
                  stroke={seriesColor(j)}
                  strokeWidth={2}
                  strokeDasharray="5 4"
                  opacity={0.75}
                />
              );
            })
          : null}

        {sim.points.map((point, i) => {
          const row = sim.resp[i] ?? [];
          const j = row.length > 0 ? argmax(row) : 0;
          const confidence = row.length > 0 ? Math.max(...row) : 1;
          const opacity = kind === 'hard' ? 0.9 : 0.3 + 0.7 * confidence;
          return (
            <circle
              key={`point-${i}`}
              cx={toPx(point.x)}
              cy={toPy(point.y)}
              r={4.5}
              fill={seriesColor(j)}
              opacity={opacity}
            />
          );
        })}

        {sim.centers.map((center, j) => (
          <g key={`center-${j}`}>
            <circle
              cx={toPx(center.x)}
              cy={toPy(center.y)}
              r={8}
              fill="none"
              stroke={seriesColor(j)}
              strokeWidth={3}
            />
            <circle cx={toPx(center.x)} cy={toPy(center.y)} r={2.5} fill={seriesColor(j)} />
          </g>
        ))}
      </svg>

      {clusterCount > 0 ? (
        <Legend
          items={sim.centers.map((_, j) => ({ label: `Cluster ${j + 1}`, color: seriesColor(j) }))}
        />
      ) : null}

      <div style={{ display: 'flex', gap: 'var(--space-8)', flexWrap: 'wrap', margin: 'var(--space-4) 0' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 220 }}>
          <MetricRow label="Points" value={sim.points.length} />
          <MetricRow label="Clusters" value={clusterCount} />
          <MetricRow label="Iteration" value={sim.iteration} />
          <MetricRow
            label={objectiveLabel}
            value={Number.isFinite(sim.objective) ? sim.objective.toFixed(3) : '—'}
            valueColor="var(--color-accent-700)"
          />
        </div>
      </div>

      {sim.history.length >= 2 ? (
        <Plot
          xDomain={historyDomain.x}
          yDomain={historyDomain.y}
          title={`${objectiveLabel} across iterations`}
          desc="For Gaussian-mixture EM the log-likelihood increases at every step, illustrating the monotonic ascent guaranteed by the algorithm."
          height={240}
        >
          <Axis orient="left" label={objectiveLabel} />
          <Axis orient="bottom" label="iteration" />
          <Curve points={historyPoints} color="var(--color-accent-700)" />
        </Plot>
      ) : (
        <p className="text-muted">Step or run the algorithm to trace the objective.</p>
      )}

      <Callout title="Reading the picture" tone="info">
        Hard K-means paints each point one colour; soft K-means and EM fade points whose responsibilities
        are split. For Gaussian mixtures you also see the one-standard-deviation ellipse of each
        component, so the fitted covariance is visible rather than implied.
      </Callout>

      <h4>How the three algorithms differ</h4>
      <ul style={{ maxWidth: 660, paddingLeft: 20 }}>
        <li><b>Hard K-means:</b> assign each point to its nearest centre, then move each centre to the mean of its members. Minimises within-cluster squared distance.</li>
        <li><b>Soft K-means:</b> replace the hard assignment with responsibilities from a sharpened exponential of the distance; centres become responsibility-weighted means.</li>
        <li><b>Gaussian-mixture EM:</b> responsibilities come from full Gaussians with fitted weights and covariances, so elongated and differently-sized clusters are allowed.</li>
      </ul>
    </LecturePage>
  );
};

export default ClusteringPage;
