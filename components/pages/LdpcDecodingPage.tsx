import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Slider from '../Slider';
import MetricRow from '../MetricRow';
import LecturePage from '../shell/LecturePage';
import Formula from '../ui/Formula';
import Quiz, { type QuizQuestion } from '../quiz/Quiz';
import { Axis, BarSeries, Legend, Plot } from '../chart';
import SeedControl from '../ui/SeedControl';
import SegmentedControl from '../ui/SegmentedControl';
import SimControls from '../ui/SimControls';
import Callout from '../ui/Callout';
import { useAnimationLoop } from '../../hooks/useAnimationLoop';
import { mulberry32 } from '../../utils/rng';

const NV = 6;
const CHECK_NODES: number[][] = [
  [0, 1, 4],
  [1, 2, 3],
  [0, 2, 5],
];
const NC = CHECK_NODES.length;
const LMAX = 12;
const MAX_ITER = 50;

interface Edge {
  c: number;
  v: number;
}

const EDGES: Edge[] = [];
for (let c = 0; c < NC; c++) {
  for (const v of CHECK_NODES[c]) EDGES.push({ c, v });
}

const INCIDENT_C: number[][] = CHECK_NODES.map((_, c) =>
  EDGES.map((edge, index) => (edge.c === c ? index : -1)).filter((index) => index >= 0),
);
const INCIDENT_V: number[][] = Array.from({ length: NV }, (_, v) =>
  EDGES.map((edge, index) => (edge.v === v ? index : -1)).filter((index) => index >= 0),
);

interface BpEvent {
  kind: 'check' | 'var';
  v: number;
  edge: number;
}

const SCHEDULE: BpEvent[] = [];
for (let c = 0; c < NC; c++) {
  for (const edge of INCIDENT_C[c]) SCHEDULE.push({ kind: 'check', v: EDGES[edge].v, edge });
}
for (let v = 0; v < NV; v++) SCHEDULE.push({ kind: 'var', v, edge: -1 });

const BASIS = [
  [1, 0, 0, 0, 1, 1],
  [0, 1, 1, 0, 1, 1],
  [0, 0, 1, 1, 0, 1],
];
const CODEWORDS: number[][] = [];
for (let mask = 0; mask < 2 ** BASIS.length; mask++) {
  const codeword = new Array<number>(NV).fill(0);
  for (let b = 0; b < BASIS.length; b++) {
    if ((mask >> b) & 1) {
      for (let i = 0; i < NV; i++) codeword[i] ^= BASIS[b][i];
    }
  }
  CODEWORDS.push(codeword);
}

const hardDecision = (llr: number[]): number[] => llr.map((value) => (value >= 0 ? 0 : 1));

const syndrome = (bits: number[]): number[] =>
  CHECK_NODES.map((variables) => variables.reduce((parity, v) => parity ^ bits[v], 0));

const QUESTIONS: QuizQuestion[] = [
  {
    id: 'rate',
    kind: 'numeric',
    prompt: 'A (n = 6, k = 3) linear code has rate R = k/n. What is R?',
    answer: 0.5,
    tolerance: 0.001,
    explanation: 'Three message bits per six transmitted bits: R = 3/6 = 1/2.',
  },
  {
    id: 'erasure-llr',
    kind: 'numeric',
    prompt: 'On a binary erasure channel, what channel log-likelihood ratio does a fully erased bit carry?',
    answer: 0,
    tolerance: 1e-6,
    explanation: 'An erasure says nothing: L = log(P(0)/P(1)) = 0, so the bit starts neutral.',
  },
  {
    id: 'converged',
    kind: 'choice',
    prompt: 'Belief propagation on a linear code has converged when…',
    options: [
      { label: 'Every variable has a large LLR' },
      { label: 'The hard decision satisfies every parity check', correct: true },
      { label: 'The messages stop changing magnitude' },
      { label: 'The channel noise reaches zero' },
    ],
    explanation: 'A zero syndrome H·ĉ = 0 certifies that the current hard decision is a valid codeword.',
  },
  {
    id: 'threshold',
    kind: 'choice',
    prompt: 'Raising the noise above the decoding threshold makes belief propagation…',
    options: [
      { label: 'Always converge faster' },
      { label: 'Converge to the transmitted codeword' },
      { label: 'Fail to converge, leaving a residual syndrome', correct: true },
      { label: 'Correct more errors' },
    ],
    explanation: 'Above threshold the messages oscillate or settle on a wrong codeword, so the syndrome never clears.',
  },
];

const LdpcDecodingPage: React.FC = () => {
  const [seed, setSeed] = useState<number>(4092);
  const [channel, setChannel] = useState<'bsc' | 'bec'>('bsc');
  const [noise, setNoise] = useState<number>(0.1);
  const [codewordIndex, setCodewordIndex] = useState<number>(1);
  const [v2c, setV2c] = useState<number[]>(() => new Array(EDGES.length).fill(0));
  const [c2v, setC2v] = useState<number[]>(() => new Array(EDGES.length).fill(0));
  const [beliefs, setBeliefs] = useState<number[]>(() => new Array(NV).fill(0));
  const [activeEdge, setActiveEdge] = useState<number>(-1);
  const [iteration, setIteration] = useState<number>(0);
  const [status, setStatus] = useState<string>('Ready.');
  const [outcome, setOutcome] = useState<'converged' | 'failed' | null>(null);

  const v2cRef = useRef<number[]>(v2c);
  const c2vRef = useRef<number[]>(c2v);
  const beliefsRef = useRef<number[]>(beliefs);
  const posRef = useRef<number>(0);
  const iterRef = useRef<number>(0);
  const doneRef = useRef<boolean>(false);
  const lchRef = useRef<number[]>(new Array(NV).fill(0));

  const channelData = useMemo(() => {
    const rng = mulberry32(seed);
    const sent = CODEWORDS[codewordIndex] ?? CODEWORDS[0];
    const received = sent.slice();
    const erased = new Array<boolean>(NV).fill(false);
    if (channel === 'bsc') {
      for (let i = 0; i < NV; i++) if (rng() < noise) received[i] ^= 1;
    } else {
      for (let i = 0; i < NV; i++) if (rng() < noise) erased[i] = true;
    }
    const Lch = new Array<number>(NV).fill(0);
    for (let i = 0; i < NV; i++) {
      if (channel === 'bec') {
        Lch[i] = erased[i] ? 0 : received[i] === 0 ? LMAX : -LMAX;
      } else if (noise <= 0.001) {
        Lch[i] = received[i] === 0 ? LMAX : -LMAX;
      } else if (noise >= 0.5) {
        Lch[i] = 0;
      } else {
        const magnitude = Math.log((1 - noise) / noise);
        Lch[i] = received[i] === 0 ? magnitude : -magnitude;
      }
    }
    return { sent, received, erased, Lch };
  }, [seed, channel, noise, codewordIndex]);

  lchRef.current = channelData.Lch;

  const checkMessage = (edge: number): number => {
    const c = EDGES[edge].c;
    let product = 1;
    for (const other of INCIDENT_C[c]) {
      if (other === edge) continue;
      product *= Math.tanh(v2cRef.current[other] / 2);
    }
    const clamped = Math.max(-0.999999, Math.min(0.999999, product));
    return 2 * Math.atanh(clamped);
  };

  const updateVariable = (v: number) => {
    let total = lchRef.current[v];
    for (const edge of INCIDENT_V[v]) total += c2vRef.current[edge];
    beliefsRef.current[v] = total;
    for (const edge of INCIDENT_V[v]) v2cRef.current[edge] = total - c2vRef.current[edge];
  };

  const resetMessages = useCallback(() => {
    const v2cInit = EDGES.map((edge) => lchRef.current[edge.v]);
    const c2vInit = new Array<number>(EDGES.length).fill(0);
    const beliefsInit = lchRef.current.slice();
    v2cRef.current = v2cInit;
    c2vRef.current = c2vInit;
    beliefsRef.current = beliefsInit;
    posRef.current = 0;
    iterRef.current = 0;
    doneRef.current = false;
    setV2c(v2cInit);
    setC2v(c2vInit);
    setBeliefs(beliefsInit);
    setActiveEdge(-1);
    setIteration(0);
    setOutcome(null);
    setStatus('Ready. Press Run or Step to pass messages along the Tanner graph.');
  }, []);

  const step = useCallback(() => {
    if (doneRef.current) return;
    const event = SCHEDULE[posRef.current];
    if (event.kind === 'check') {
      c2vRef.current[event.edge] = checkMessage(event.edge);
    } else {
      updateVariable(event.v);
    }
    setActiveEdge(event.edge);
    posRef.current += 1;

    if (posRef.current >= SCHEDULE.length) {
      posRef.current = 0;
      iterRef.current += 1;
      const bits = hardDecision(beliefsRef.current);
      const checks = syndrome(bits);
      const weight = checks.reduce((sum, value) => sum + value, 0);
      const allKnown = beliefsRef.current.every((value) => Math.abs(value) > 1e-9);
      if (allKnown && weight === 0) {
        doneRef.current = true;
        setOutcome('converged');
        setStatus('Converged: the hard decision is a valid codeword.');
      } else if (iterRef.current >= MAX_ITER) {
        doneRef.current = true;
        setOutcome('failed');
        setStatus(`Failed: residual syndrome after ${MAX_ITER} iterations.`);
      } else {
        setStatus(`Iteration ${iterRef.current}: syndrome weight ${weight}.`);
      }
    }

    setV2c(v2cRef.current.slice());
    setC2v(c2vRef.current.slice());
    setBeliefs(beliefsRef.current.slice());
    setIteration(iterRef.current);
  }, []);

  const loop = useAnimationLoop({ tick: step, onReset: resetMessages, initialSpeed: 12 });

  useEffect(() => {
    resetMessages();
    loop.pause();
  }, [channelData, resetMessages]);

  useEffect(() => {
    if (outcome) loop.pause();
  }, [outcome]);

  const decided = hardDecision(beliefs);
  const checks = syndrome(decided);
  const syndromeWeight = checks.reduce((sum, value) => sum + value, 0);
  const bitErrors = decided.reduce((sum, bit, index) => sum + (bit !== channelData.sent[index] ? 1 : 0), 0);
  const rate = (NV - NC) / NV;
  const maxAbs = Math.max(1, ...beliefs.map((value) => Math.abs(value)));
  const llrMax = maxAbs * 1.15;

  const positiveBars = beliefs
    .map((value, v) => (value > 0 ? { x: v - 0.35, y: value, width: 0.7 } : null))
    .filter((bar): bar is { x: number; y: number; width: number } => bar !== null);
  const negativeBars = beliefs
    .map((value, v) => (value < 0 ? { x: v - 0.35, y: value, width: 0.7 } : null))
    .filter((bar): bar is { x: number; y: number; width: number } => bar !== null);

  const graphWidth = 640;
  const graphHeight = 300;
  const checkX = (c: number) => 90 + c * (460 / Math.max(1, NC - 1));
  const varX = (v: number) => 70 + v * (500 / Math.max(1, NV - 1));

  const receivedLabel =
    channel === 'bec'
      ? channelData.received.map((bit, i) => (channelData.erased[i] ? '?' : String(bit))).join(' ')
      : channelData.received.join(' ');

  return (
    <LecturePage slug="ldpc-decoding" quiz={<Quiz slug="ldpc-decoding" questions={QUESTIONS} />}>
      <p className="it-body-block">
        LDPC codes are decoded by belief propagation: variable and check nodes exchange
        log-likelihood ratios along the edges of a sparse Tanner graph until the hard decisions satisfy
        every parity check — or the decoder gives up.
      </p>
      <Formula
        tex="L_{v \to c} = L_{\text{ch}} + \sum_{c' \ne c} L_{c' \to v}"
        note="a variable node adds its channel evidence to every incoming check message"
        label="Variable-node update"
      />
      <Formula
        tex="L_{c \to v} = 2\tanh^{-1}\!\prod_{v' \ne v}\tanh\!\left(\frac{L_{v' \to c}}{2}\right)"
        note="a check node enforces even parity; the product ignores the edge being updated"
        label="Check-node update"
      />

      <h4>Set up the code and channel</h4>
      <Formula
        tex="H = \begin{bmatrix} 1&1&0&0&1&0 \\ 0&1&1&1&0&0 \\ 1&0&1&0&0&1 \end{bmatrix}"
        note={`a rate ${rate.toFixed(2)} (${NV}, ${NV - NC}) code with ${EDGES.length} Tanner edges`}
        label="Parity-check matrix"
      />
      <SeedControl seed={seed} onNewSeed={setSeed} />
      <div style={{ display: 'flex', gap: 'var(--space-6)', flexWrap: 'wrap', marginTop: 'var(--space-3)' }}>
        <SegmentedControl<'bsc' | 'bec'>
          label="Channel"
          value={channel}
          onChange={setChannel}
          name="ldpc-channel"
          options={[
            { value: 'bsc', label: 'BSC (bit flips)' },
            { value: 'bec', label: 'BEC (erasures)' },
          ]}
        />
        <Slider
          label="Noise level"
          valueLabel={`${(noise * 100).toFixed(0)}%`}
          value={noise}
          min={0}
          max={0.5}
          step={0.01}
          onChange={setNoise}
          style={{ maxWidth: 300, flex: 1 }}
        />
        <Slider
          label="Transmitted codeword"
          valueLabel={channelData.sent.join('')}
          value={codewordIndex}
          min={0}
          max={CODEWORDS.length - 1}
          step={1}
          onChange={setCodewordIndex}
          accentColor="var(--color-accent-2)"
          valueColor="var(--color-accent-2-700)"
          style={{ maxWidth: 300, flex: 1 }}
        />
      </div>

      <div style={{ display: 'flex', gap: 'var(--space-6)', flexWrap: 'wrap', margin: 'var(--space-4) 0' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5, minWidth: 240 }}>
          <MetricRow label="Rate R = k/n" value={rate.toFixed(2)} />
          <MetricRow label="Iteration" value={iteration} />
          <MetricRow label="Syndrome weight" value={syndromeWeight} valueColor={syndromeWeight === 0 ? 'var(--color-accent-700)' : 'var(--color-accent-2-700)'} />
          <MetricRow label="Bit errors vs sent" value={bitErrors} />
          <MetricRow label="Tanner edges" value={EDGES.length} />
          <MetricRow label="Max |V→C message|" value={Math.max(0, ...v2c.map((value) => Math.abs(value))).toFixed(2)} />
        </div>
        <div style={{ fontSize: 13, display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div>Sent codeword: <b>{channelData.sent.join(' ')}</b></div>
          <div>
            Received{' '}
            {channel === 'bec' ? '(? = erased)' : '(BSC)'}: <b style={{ color: 'var(--color-accent-2-700)' }}>{receivedLabel}</b>
          </div>
          <div>Decoded: <b style={{ color: outcome === 'failed' ? 'var(--color-accent-2-700)' : 'var(--color-accent-700)' }}>{decided.join(' ')}</b></div>
          <div className="text-muted" style={{ maxWidth: 360 }}>{status}</div>
        </div>
      </div>

      <SimControls loop={loop} runLabel="Run belief propagation" pauseLabel="Pause" onReset={resetMessages} speedRange={[1, 120]} />

      <div className="text-muted" style={{ fontSize: 12, margin: 'var(--space-4) 0 4px 0' }}>Tanner graph</div>
      <svg
        viewBox={`0 0 ${graphWidth} ${graphHeight}`}
        role="img"
        aria-label="Tanner graph of the LDPC code"
        style={{ width: '100%', maxWidth: graphWidth, display: 'block' }}
      >
        <title>Tanner graph with variable nodes below and check nodes above</title>
        {EDGES.map((edge, index) => {
          const message = c2v[index];
          const color =
            message > 1e-9
              ? 'var(--color-accent-700)'
              : message < -1e-9
                ? 'var(--color-accent-2-700)'
                : 'var(--color-neutral-400)';
          return (
            <line
              key={index}
              x1={checkX(edge.c)}
              y1={64}
              x2={varX(edge.v)}
              y2={graphHeight - 64}
              stroke={index === activeEdge ? 'var(--color-neutral-800)' : color}
              strokeWidth={index === activeEdge ? 4 : 2}
              opacity={index === activeEdge ? 1 : 0.8}
            />
          );
        })}
        {CHECK_NODES.map((variables, c) => {
          const satisfied = checks[c] === 0;
          return (
            <g key={`c-${c}`}>
              <circle
                cx={checkX(c)}
                cy={64}
                r={17}
                fill={satisfied ? 'var(--color-accent-100)' : 'var(--color-accent-2-100)'}
                stroke={satisfied ? 'var(--color-accent-700)' : 'var(--color-accent-2-700)'}
                strokeWidth={2}
              />
              <text x={checkX(c)} y={68} textAnchor="middle" fontSize={11}>
                c{c}
              </text>
              <text x={checkX(c)} y={40} textAnchor="middle" fontSize={10} opacity={0.6}>
                {variables.length}
              </text>
            </g>
          );
        })}
        {Array.from({ length: NV }, (_, v) => {
          const belief = beliefs[v];
          const decodedBit = belief >= 0 ? 0 : 1;
          const fill =
            Math.abs(belief) < 1e-9
              ? 'var(--color-bg)'
              : decodedBit === 0
                ? 'var(--color-accent-700)'
                : 'var(--color-accent-2-700)';
          const textColor = Math.abs(belief) < 1e-9 ? 'var(--color-text)' : 'var(--color-bg)';
          return (
            <g key={`v-${v}`}>
              <circle
                cx={varX(v)}
                cy={graphHeight - 64}
                r={17}
                fill={fill}
                stroke={channelData.erased[v] ? 'var(--color-neutral-800)' : 'var(--color-divider)'}
                strokeWidth={channelData.erased[v] ? 3 : 1.5}
                strokeDasharray={channelData.erased[v] ? '3 2' : undefined}
              />
              <text x={varX(v)} y={graphHeight - 60} textAnchor="middle" fontSize={11} fill={textColor}>
                v{v}
              </text>
            </g>
          );
        })}
      </svg>
      <Legend
        items={[
          { label: 'positive message', color: 'var(--color-accent-700)' },
          { label: 'negative message', color: 'var(--color-accent-2-700)' },
          { label: 'zero / erased', color: 'var(--color-neutral-400)' },
        ]}
      />

      <Plot
        xDomain={[-0.5, NV - 0.5]}
        yDomain={[-llrMax, llrMax]}
        title="Variable-node log-likelihood ratios"
        desc="Each bar is a variable node's total evidence L = L_channel + sum of incoming check messages. Bars growing away from zero indicate a confident hard decision; a near-zero bar is an unresolved erasure."
        height={300}
      >
        <Axis orient="left" label="LLR (nats)" />
        <Axis orient="bottom" label="variable node" ticks={[0, 1, 2, 3, 4, 5]} />
        <BarSeries bars={positiveBars} color="var(--color-accent-700)" baseline={0} />
        <BarSeries bars={negativeBars} color="var(--color-accent-2-700)" baseline={0} />
      </Plot>
      <Legend
        items={[
          { label: 'L > 0 → decoded 0', color: 'var(--color-accent-700)' },
          { label: 'L < 0 → decoded 1', color: 'var(--color-accent-2-700)' },
        ]}
      />

      <Callout title="Converging or failing" tone={outcome === 'failed' ? 'warn' : 'info'}>
        At low noise every check message reinforces the channel, and within a few iterations the hard
        decision satisfies H·ĉ = 0. Raise the noise and the LLRs stall: the syndrome never clears, and
        the decoder returns a non-codeword. The transition between these regimes is the LDPC decoding
        threshold.
      </Callout>

      <h4>The parity-check matrix</h4>
      <table className="table" style={{ maxWidth: 420 }}>
        <thead>
          <tr>
            <th>check</th>
            {Array.from({ length: NV }, (_, v) => (
              <th key={v}>v{v}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {CHECK_NODES.map((variables, c) => (
            <tr key={c}>
              <td>c{c}</td>
              {Array.from({ length: NV }, (_, v) => (
                <td key={v}>{variables.includes(v) ? 1 : 0}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </LecturePage>
  );
};

export default LdpcDecodingPage;
