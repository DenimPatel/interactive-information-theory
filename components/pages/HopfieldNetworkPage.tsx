import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Slider from '../Slider';
import MetricRow from '../MetricRow';
import LecturePage from '../shell/LecturePage';
import Formula from '../ui/Formula';
import Quiz, { type QuizQuestion } from '../quiz/Quiz';
import { Axis, Curve, Plot } from '../chart';
import SeedControl from '../ui/SeedControl';
import SimControls from '../ui/SimControls';
import Callout from '../ui/Callout';
import { useAnimationLoop } from '../../hooks/useAnimationLoop';
import { mulberry32, shuffle, type Rng } from '../../utils/rng';

const GRID = 8;
const NEURONS = GRID * GRID;
const CELL = 22;
const GRID_PX = GRID * CELL;
const CAPACITY_PER_NEURON = 0.138;

const QUESTIONS: QuizQuestion[] = [
  {
    id: 'capacity',
    kind: 'numeric',
    prompt: 'For N = 64 neurons, the classical Hebbian storage capacity is about 0.138N. Roughly how many patterns is that?',
    answer: 8.8,
    tolerance: 0.5,
    unit: 'patterns',
    explanation: '0.138 × 64 ≈ 8.8. Beyond roughly nine patterns, recall of randomly chosen patterns starts to fail.',
  },
  {
    id: 'hebbian',
    kind: 'choice',
    prompt: 'Hebbian learning stores a pattern by…',
    options: [
      { label: 'Setting each weight to the pattern value' },
      { label: 'Strengthening connections between units that are co-active (an outer product)', correct: true },
      { label: 'Randomising the weights' },
      { label: 'Inverting the pattern' },
    ],
    explanation: 'W = (1/N) Σ_μ ξ_μ ξ_μᵀ sums outer products, so co-active pairs get positive and opposed pairs negative weights.',
  },
  {
    id: 'overload',
    kind: 'choice',
    prompt: 'When the number of stored patterns exceeds the capacity, recall…',
    options: [
      { label: 'Improves, because more memories reinforce each other' },
      { label: 'Is unaffected' },
      { label: 'Degrades, producing spurious attractors and wrong recalls', correct: true },
      { label: 'Becomes exact' },
    ],
    explanation: 'Cross-talk between patterns grows with the load; the network settles into mixture states rather than the intended memory.',
  },
  {
    id: 'glauber',
    kind: 'choice',
    prompt: 'Glauber dynamics at zero temperature updates a unit to…',
    options: [
      { label: 'A random value' },
      { label: 'The sign of its local field, lowering the energy', correct: true },
      { label: 'The value of the nearest stored pattern' },
      { label: 'Zero' },
    ],
    explanation: 'As T → 0 the logistic becomes a step function, so each asynchronous update is coordinate descent on the energy.',
  },
];

const computeEnergy = (weights: number[][], state: number[]): number => {
  let energy = 0;
  for (let i = 0; i < state.length; i++) {
    let field = 0;
    for (let j = 0; j < state.length; j++) field += weights[i][j] * state[j];
    energy -= 0.5 * field * state[i];
  }
  return energy;
};

const HopfieldNetworkPage: React.FC = () => {
  const [seed, setSeed] = useState<number>(7311);
  const [drawing, setDrawing] = useState<boolean[]>(() => new Array(NEURONS).fill(false));
  const [patternSeq, setPatternSeq] = useState<number>(0);
  const [stored, setStored] = useState<number[][]>([]);
  const [current, setCurrent] = useState<number[]>(() => new Array(NEURONS).fill(-1));
  const [targetIndex, setTargetIndex] = useState<number | null>(null);
  const [noise, setNoise] = useState<number>(0.15);
  const [temperature, setTemperature] = useState<number>(0);
  const [status, setStatus] = useState<string>('Store a few patterns, then recall one from a corrupted start.');
  const [energyHistory, setEnergyHistory] = useState<number[]>([]);
  const [stepCount, setStepCount] = useState<number>(0);
  const [testResults, setTestResults] = useState<{ index: number; recalled: boolean; overlap: number }[]>([]);
  const [converged, setConverged] = useState<boolean>(false);

  const stateRef = useRef<number[]>(current);
  const energyRef = useRef<number[]>([]);
  const stepRef = useRef<number>(0);
  const stableRef = useRef<number>(0);
  const convergedRef = useRef<boolean>(false);
  const rngRef = useRef<Rng>(mulberry32(seed));

  useEffect(() => {
    rngRef.current = mulberry32(seed);
  }, [seed]);

  const weights = useMemo<number[][]>(() => {
    const w: number[][] = Array.from({ length: NEURONS }, () => new Array<number>(NEURONS).fill(0));
    const count = stored.length;
    if (count === 0) return w;
    for (const pattern of stored) {
      for (let i = 0; i < NEURONS; i++) {
        for (let j = i + 1; j < NEURONS; j++) {
          const value = (pattern[i] * pattern[j]) / NEURONS;
          w[i][j] += value;
          w[j][i] += value;
        }
      }
    }
    return w;
  }, [stored]);

  const tick = useCallback(() => {
    const state = stateRef.current;
    if (state.length !== NEURONS) return;
    const index = Math.floor(rngRef.current() * NEURONS);
    let field = 0;
    for (let j = 0; j < NEURONS; j++) field += weights[index][j] * state[j];
    let next: number;
    if (temperature <= 0.001) {
      next = field >= 0 ? 1 : -1;
    } else {
      const probability = 1 / (1 + Math.exp((-2 * field) / Math.max(temperature, 1e-3)));
      next = rngRef.current() < probability ? 1 : -1;
    }
    const updated = state.slice();
    updated[index] = next;
    stateRef.current = updated;

    if (next === state[index]) stableRef.current += 1;
    else stableRef.current = 0;

    const energy = computeEnergy(weights, updated);
    energyRef.current = [...energyRef.current, energy].slice(-600);
    stepRef.current += 1;

    setCurrent(updated);
    setEnergyHistory(energyRef.current.slice());
    setStepCount(stepRef.current);

    if (stableRef.current > NEURONS && temperature <= 0.001 && !convergedRef.current) {
      convergedRef.current = true;
      setConverged(true);
    }
  }, [weights, temperature]);

  const loop = useAnimationLoop({ tick, initialSpeed: 40 });

  useEffect(() => {
    if (!converged) return;
    loop.pause();
    if (targetIndex !== null && stored[targetIndex]) {
      const target = stored[targetIndex];
      const overlap = target.reduce((sum, value, i) => sum + value * current[i], 0) / NEURONS;
      setStatus(
        overlap > 0.95
          ? `Converged to stored pattern ${targetIndex + 1} (overlap ${(overlap * 100).toFixed(0)}%).`
          : `Converged to a different state (best overlap ${(overlap * 100).toFixed(0)}%).`,
      );
    }
  }, [converged]);

  const toggleCell = (index: number) => {
    setDrawing((previous) => {
      const updated = previous.slice();
      updated[index] = !updated[index];
      return updated;
    });
  };

  const randomPattern = () => {
    const rng = mulberry32(seed + patternSeq * 7919);
    setDrawing(Array.from({ length: NEURONS }, () => rng() < 0.5));
    setPatternSeq((value) => value + 1);
  };

  const storePattern = () => {
    const pattern = drawing.map((value) => (value ? 1 : -1));
    setStored((previous) => [...previous, pattern]);
    setStatus(`Stored pattern ${stored.length + 1}. Load is ${(stored.length + 1).toFixed(1)}× the 0.138N capacity.`);
  };

  const deletePattern = (index: number) => {
    setStored((previous) => previous.filter((_, i) => i !== index));
    if (targetIndex === index) setTargetIndex(null);
  };

  const recallPattern = (index: number) => {
    const base = stored[index];
    if (!base) return;
    const rng = rngRef.current;
    const corrupted = base.slice();
    const flips = Math.round(noise * NEURONS);
    for (let f = 0; f < flips; f++) {
      const cell = Math.floor(rng() * NEURONS);
      corrupted[cell] = -corrupted[cell];
    }
    stateRef.current = corrupted;
    energyRef.current = [computeEnergy(weights, corrupted)];
    stepRef.current = 0;
    stableRef.current = 0;
    convergedRef.current = false;
    setTargetIndex(index);
    setCurrent(corrupted);
    setEnergyHistory(energyRef.current.slice());
    setStepCount(0);
    setConverged(false);
    setStatus(`Relaxing toward stored pattern ${index + 1} from ${flips} flipped bits…`);
    loop.start();
  };

  const resetSimulation = () => {
    stateRef.current = new Array(NEURONS).fill(-1);
    energyRef.current = [];
    stepRef.current = 0;
    stableRef.current = 0;
    convergedRef.current = false;
    setCurrent(stateRef.current.slice());
    setEnergyHistory([]);
    setStepCount(0);
    setConverged(false);
    setTargetIndex(null);
    setStatus('Reset. Store patterns, then recall one from a corrupted start.');
  };

  const quickRecall = (pattern: number[], rng: Rng): boolean => {
    const state = pattern.slice();
    const flips = Math.round(noise * NEURONS);
    for (let f = 0; f < flips; f++) {
      const cell = Math.floor(rng() * NEURONS);
      state[cell] = -state[cell];
    }
    for (let sweep = 0; sweep < 40; sweep++) {
      let changed = false;
      const order = shuffle(rng, Array.from({ length: NEURONS }, (_, i) => i));
      for (const i of order) {
        let field = 0;
        for (let j = 0; j < NEURONS; j++) field += weights[i][j] * state[j];
        const next = field >= 0 ? 1 : -1;
        if (next !== state[i]) {
          state[i] = next;
          changed = true;
        }
      }
      if (!changed) break;
    }
    let best = -1;
    for (const memory of stored) {
      const overlap = memory.reduce((sum, value, i) => sum + value * state[i], 0) / NEURONS;
      if (overlap > best) best = overlap;
    }
    return best > 0.95;
  };

  const runCapacityTest = () => {
    const rng = mulberry32(seed ^ 0x5bd1e995);
    setTestResults(
      stored.map((pattern, index) => {
        const recalled = quickRecall(pattern, rng);
        return { index, recalled, overlap: 0 };
      }),
    );
  };

  const overlaps = useMemo(
    () =>
      stored.map((pattern) =>
        pattern.reduce((sum, value, i) => sum + value * current[i], 0) / NEURONS,
      ),
    [stored, current],
  );

  const targetOverlap = targetIndex !== null && overlaps[targetIndex] !== undefined ? overlaps[targetIndex] : 0;
  const capacity = CAPACITY_PER_NEURON * NEURONS;
  const load = capacity > 0 ? stored.length / capacity : 0;
  const successes = testResults.filter((result) => result.recalled).length;

  const energyDomain = useMemo(() => {
    if (energyHistory.length === 0) return { xMax: 30, yMin: -1.5, yMax: 0 };
    let min = Infinity;
    let max = -Infinity;
    for (const value of energyHistory) {
      min = Math.min(min, value);
      max = Math.max(max, value);
    }
    const span = Math.max(0.5, max - min);
    return { xMax: Math.max(30, energyHistory.length), yMin: min - span * 0.1, yMax: max + span * 0.1 };
  }, [energyHistory]);

  const energyPoints = energyHistory.map((value, index) => ({ x: index, y: value }));

  const renderGrid = (values: number[], onToggle?: (index: number) => void, pixel = GRID_PX) => (
    <svg
      viewBox={`0 0 ${GRID_PX} ${GRID_PX}`}
      width={pixel}
      height={pixel}
      role="img"
      aria-label="Hopfield pattern grid"
      style={{ cursor: onToggle ? 'pointer' : 'default', border: '1px solid var(--color-divider)' }}
      onClick={
        onToggle
          ? (event: React.MouseEvent<SVGSVGElement>) => {
              const rect = event.currentTarget.getBoundingClientRect();
              const x = ((event.clientX - rect.left) / rect.width) * GRID_PX;
              const y = ((event.clientY - rect.top) / rect.height) * GRID_PX;
              const col = Math.min(GRID - 1, Math.max(0, Math.floor(x / CELL)));
              const row = Math.min(GRID - 1, Math.max(0, Math.floor(y / CELL)));
              onToggle(row * GRID + col);
            }
          : undefined
      }
    >
      {Array.from({ length: NEURONS }, (_, index) => {
        const row = Math.floor(index / GRID);
        const col = index % GRID;
        return (
          <rect
            key={index}
            x={col * CELL}
            y={row * CELL}
            width={CELL}
            height={CELL}
            fill={values[index] === 1 ? 'var(--color-accent-700)' : 'var(--color-bg)'}
            stroke="var(--color-divider)"
            strokeWidth={0.75}
          />
        );
      })}
    </svg>
  );

  return (
    <LecturePage slug="hopfield-network" quiz={<Quiz slug="hopfield-network" questions={QUESTIONS} />}>
      <p className="it-body-block">
        A Hopfield network is an associative memory: patterns are stored in a symmetric weight matrix,
        and asynchronous Glauber dynamics rolls a corrupted state downhill on the energy surface into the
        nearest stored memory.
      </p>
      <Formula
        tex="W_{ij} = \frac{1}{N}\sum_{\mu} \xi_i^{\mu}\xi_j^{\mu}, \quad W_{ii}=0"
        note="the Hebbian outer-product rule: co-active units attract, opposed units repel"
        label="Hebbian weight matrix"
      />
      <Formula
        tex="E = -\tfrac{1}{2}\sum_{i,j} W_{ij}s_i s_j"
        note="each asynchronous flip to sign(local field) never increases E"
        label="Hopfield energy"
      />

      <h4>1. Draw and store patterns</h4>
      <p className="it-body-block">
        Click cells to paint a pattern, then store it. Store several patterns; the network adds their
        outer products into W.
      </p>
      <SeedControl seed={seed} onNewSeed={setSeed} />
      <div style={{ display: 'flex', gap: 'var(--space-5)', flexWrap: 'wrap', alignItems: 'flex-start', marginTop: 'var(--space-3)' }}>
        <div>
          <div className="text-muted" style={{ fontSize: 12, marginBottom: 6 }}>Editable pattern</div>
          {renderGrid(drawing.map((value) => (value ? 1 : -1)), toggleCell)}
          <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
            <button type="button" className="btn btn-secondary" onClick={randomPattern}>Random</button>
            <button type="button" className="btn btn-secondary" onClick={() => setDrawing(new Array(NEURONS).fill(false))}>Clear</button>
            <button type="button" className="btn btn-primary" onClick={storePattern}>Store pattern</button>
          </div>
        </div>

        <div style={{ flex: 1, minWidth: 280 }}>
          <div className="text-muted" style={{ fontSize: 12, marginBottom: 6 }}>
            Stored memories ({stored.length})
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
            {stored.length === 0 ? <span className="text-muted">No patterns stored yet.</span> : null}
            {stored.map((pattern, index) => (
              <div key={index} className="card elev-sm" style={{ padding: 'var(--space-2)', gap: 'var(--space-1)' }}>
                <div className="card-kicker">Memory {index + 1}</div>
                {renderGrid(pattern, undefined, 66)}
                <div style={{ display: 'flex', gap: 6 }}>
                  <button type="button" className="btn btn-secondary" onClick={() => recallPattern(index)}>Recall</button>
                  <button type="button" className="btn btn-ghost" onClick={() => deletePattern(index)}>Delete</button>
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 6, maxWidth: 360 }}>
            <MetricRow label="Neurons N" value={NEURONS} />
            <MetricRow label="Stored P" value={stored.length} />
            <MetricRow label="Capacity ≈ 0.138N" value={capacity.toFixed(1)} valueColor="var(--color-accent-2-700)" />
            <MetricRow
              label="Load P / capacity"
              value={`${load.toFixed(2)}×`}
              valueColor={load > 1 ? 'var(--color-accent-2-700)' : 'var(--color-accent-700)'}
            />
          </div>
          <div style={{ marginTop: 'var(--space-3)' }}>
            <button type="button" className="btn btn-secondary" onClick={runCapacityTest} disabled={stored.length === 0}>
              Test recall of all stored patterns
            </button>
            {testResults.length > 0 ? (
              <p className="text-muted" style={{ fontSize: 13, marginTop: 'var(--space-2)' }}>
                Recalled {successes}/{testResults.length} memories at {(noise * 100).toFixed(0)}% corruption.{' '}
                {load > 1 ? ' Load exceeds capacity — expect failures.' : ' Load is below capacity.'}
              </p>
            ) : null}
          </div>
        </div>
      </div>

      <h4 style={{ marginTop: 'var(--space-6)' }}>2. Corrupt and relax</h4>
      <p className="it-body-block">
        Recalling flips a fraction of bits, then Glauber dynamics repeatedly settles a random unit to the
        sign of its local field. At zero temperature the energy is non-increasing.
      </p>
      <div style={{ display: 'flex', gap: 'var(--space-6)', flexWrap: 'wrap', maxWidth: 620, marginBottom: 'var(--space-3)' }}>
        <Slider
          label="Corruption"
          valueLabel={`${(noise * 100).toFixed(0)}%`}
          value={noise}
          min={0}
          max={0.5}
          step={0.01}
          onChange={setNoise}
          style={{ maxWidth: 300, flex: 1 }}
        />
        <Slider
          label="Temperature"
          valueLabel={temperature === 0 ? '0 (deterministic)' : temperature.toFixed(2)}
          value={temperature}
          min={0}
          max={1}
          step={0.01}
          onChange={setTemperature}
          accentColor="var(--color-accent-2)"
          valueColor="var(--color-accent-2-700)"
          style={{ maxWidth: 300, flex: 1 }}
        />
      </div>
      <SimControls loop={loop} runLabel="Run" pauseLabel="Pause" onReset={resetSimulation} speedRange={[1, 120]} />

      <p style={{ minHeight: '1.6em', margin: 'var(--space-3) 0' }}>{status}</p>

      <div style={{ display: 'flex', gap: 'var(--space-5)', flexWrap: 'wrap', alignItems: 'flex-start' }}>
        <div>
          <div className="text-muted" style={{ fontSize: 12, marginBottom: 6 }}>Current state</div>
          {renderGrid(current)}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 'var(--space-2)', fontSize: 13 }}>
            <MetricRow label="Steps" value={stepCount} width={240} />
            <MetricRow label="Current energy" value={(energyHistory[energyHistory.length - 1] ?? 0).toFixed(3)} width={240} />
            <MetricRow label="Overlap with target" value={targetOverlap.toFixed(3)} width={240} valueColor="var(--color-accent-2-700)" />
          </div>
        </div>
        <div style={{ flex: 1, minWidth: 320 }}>
          <Plot
            xDomain={[0, energyDomain.xMax]}
            yDomain={[energyDomain.yMin, energyDomain.yMax]}
            title="Energy during relaxation"
            desc="With asynchronous Glauber updates at zero temperature the Hopfield energy is non-increasing, so a corrupted state rolls downhill into an attractor."
            height={300}
          >
            <Axis orient="left" label="energy E" />
            <Axis orient="bottom" label="updates" />
            <Curve points={energyPoints} color="var(--color-accent-700)" />
          </Plot>
        </div>
      </div>

      <Callout title="Storage capacity" tone={load > 1 ? 'warn' : 'info'}>
        A Hopfield network stores about 0.138N random patterns before cross-talk creates spurious
        attractors. Here N = {NEURONS}, so capacity is ≈ {capacity.toFixed(1)} patterns; the current load
        is {load.toFixed(2)}× capacity. Push past it and the “Test recall” button starts reporting
        failures.
      </Callout>

      <h4>Why it works</h4>
      <ul style={{ maxWidth: 640, paddingLeft: 20 }}>
        <li>Stored patterns are local minima of E because the Hebbian weights align each unit with the rest.</li>
        <li>Asynchronous updates guarantee the energy never rises, so the dynamics always settle.</li>
        <li>Symmetric zero-diagonal weights make E a Lyapunov function for the network.</li>
        <li>Capacity is linear in N but with a small constant — the price of overlapping memories.</li>
      </ul>
    </LecturePage>
  );
};

export default HopfieldNetworkPage;
