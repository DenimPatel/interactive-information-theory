import React, { useMemo, useState } from 'react';
import LecturePage from '../shell/LecturePage';
import Quiz, { type QuizQuestion } from '../quiz/Quiz';
import Formula from '../ui/Formula';
import Slider from '../Slider';
import MetricRow from '../MetricRow';
import SegmentedControl from '../ui/SegmentedControl';
import Callout from '../ui/Callout';
import { Plot, Axis, Curve, Marker, RuleY, Heatmap, Legend, seriesColor } from '../chart';
import { pLogP } from '../../utils/informationTheory';

type ChannelId = 'bsc' | 'bec' | 'z' | 'typewriter';

interface ChannelDef {
  id: ChannelId;
  label: string;
  description: string;
  inputs: string[];
  outputs: string[];
  paramLabel: string;
  paramNote: string;
  matrix: (param: number) => number[][];
}

const CHANNELS: ChannelDef[] = [
  {
    id: 'bsc',
    label: 'BSC',
    description: 'Binary Symmetric Channel: each bit is flipped independently with probability p.',
    inputs: ['0', '1'],
    outputs: ['0', '1'],
    paramLabel: 'Crossover p',
    paramNote: 'p is the probability a transmitted bit is received inverted.',
    matrix: (p) => [
      [1 - p, p],
      [p, 1 - p],
    ],
  },
  {
    id: 'bec',
    label: 'Binary erasure',
    description: 'Binary Erasure Channel: each bit either arrives intact or is replaced by a visible erasure “?”.',
    inputs: ['0', '1'],
    outputs: ['0', '?', '1'],
    paramLabel: 'Erasure e',
    paramNote: 'e is the probability a bit is erased rather than received.',
    matrix: (e) => [
      [1 - e, e, 0],
      [0, e, 1 - e],
    ],
  },
  {
    id: 'z',
    label: 'Z-channel',
    description: 'Z-channel: a 0 may be misread as 1, but a 1 is never misread as 0.',
    inputs: ['0', '1'],
    outputs: ['0', '1'],
    paramLabel: 'Asymmetry a = P(1|0)',
    paramNote: 'a is the extra probability that a sent 0 is received as 1.',
    matrix: (a) => [
      [1 - a, a],
      [0, 1],
    ],
  },
  {
    id: 'typewriter',
    label: 'Noisy typewriter',
    description: 'Noisy typewriter over four symbols: each symbol is transmitted intact with probability 1 − t, else slips to the next symbol.',
    inputs: ['a', 'b', 'c', 'd'],
    outputs: ['a', 'b', 'c', 'd'],
    paramLabel: 'Slip t',
    paramNote: 't is the probability a symbol advances to its neighbour instead of staying.',
    matrix: (t) => [
      [1 - t, t, 0, 0],
      [0, 1 - t, t, 0],
      [0, 0, 1 - t, t],
      [t, 0, 0, 1 - t],
    ],
  },
];

const tickRange = (count: number): number[] => Array.from({ length: count }, (_, i) => i);

const entropyOf = (probs: number[]): number => {
  let h = 0;
  for (const p of probs) h -= pLogP(p);
  return h < 1e-9 ? 0 : h;
};

const inputDistribution = (size: number, p0: number): number[] => {
  const clamped = Math.min(1, Math.max(0, p0));
  if (size <= 1) return [1];
  if (size === 2) return [clamped, 1 - clamped];
  const rest = (1 - clamped) / (size - 1);
  return Array.from({ length: size }, (_, i) => (i === 0 ? clamped : rest));
};

interface ChannelMetrics {
  hX: number;
  hYX: number;
  hY: number;
  iXY: number;
  py: number[];
}

const mutualInformation = (matrix: number[][], dist: number[]): ChannelMetrics => {
  const hX = entropyOf(dist);
  const hYX = matrix.reduce((sum, row, i) => sum + dist[i] * entropyOf(row), 0);
  const size = matrix[0]?.length ?? 0;
  const py: number[] = [];
  for (let j = 0; j < size; j++) {
    let acc = 0;
    for (let i = 0; i < matrix.length; i++) acc += dist[i] * matrix[i][j];
    py.push(acc);
  }
  const hY = entropyOf(py);
  const iXY = Math.max(0, hY - hYX);
  return { hX, hYX, hY, iXY, py };
};

const fmt = (value: number): string => (Number.isFinite(value) ? Math.max(0, value).toFixed(4) : '0.0000');

const QUESTIONS: QuizQuestion[] = [
  {
    id: 'erasure-output',
    kind: 'choice',
    prompt: 'Which channel has an output alphabet that includes a symbol the transmitter never sends?',
    options: [
      { label: 'The binary symmetric channel' },
      { label: 'The binary erasure channel', correct: true },
      { label: 'The Z-channel' },
      { label: 'The noiseless channel' },
    ],
    explanation: 'An erased bit becomes a visible “?”, so the receiver knows the bit was lost rather than guessing at it.',
  },
  {
    id: 'bec-capacity',
    kind: 'numeric',
    prompt: 'A binary erasure channel erases each bit with probability e = 0.5. What is its capacity C, in bits?',
    answer: 0.5,
    tolerance: 1e-6,
    unit: 'bits',
    explanation: 'The erasure channel loses exactly the erased fraction, so C = 1 − e = 0.5 bits per use.',
  },
  {
    id: 'bsc-half',
    kind: 'numeric',
    prompt: 'How many bits of mutual information does a BSC with p = 0.5 carry?',
    answer: 0,
    tolerance: 1e-6,
    unit: 'bits',
    explanation: 'At p = 0.5 the output is independent of the input, so I(X;Y) = 0.',
  },
  {
    id: 'typewriter-shift',
    kind: 'choice',
    prompt: 'At slip t = 1 the noisy typewriter becomes a pure cyclic shift. What is I(X;Y) then?',
    options: [
      { label: 'Zero, because the channel is noisy' },
      { label: 'H(X), because the shift is invertible', correct: true },
      { label: 'log₂ 3, the number of outcomes' },
      { label: 'It depends on the input distribution alone' },
    ],
    explanation: 'A deterministic invertible map carries all the input information: H(Y|X) = 0 and I(X;Y) = H(X).',
  },
];

const ChannelZooPage: React.FC = () => {
  const [channel, setChannel] = useState<ChannelId>('bsc');
  const [p0, setP0] = useState<number>(0.5);
  const [params, setParams] = useState<Record<ChannelId, number>>({
    bsc: 0.1,
    bec: 0.2,
    z: 0.3,
    typewriter: 0.15,
  });

  const def = CHANNELS.find((item) => item.id === channel) ?? CHANNELS[0];
  const param = params[channel];
  const matrix = def.matrix(param);
  const size = def.inputs.length;
  const dist = inputDistribution(size, p0);
  const metrics = mutualInformation(matrix, dist);
  const outputColor = (index: number): string => seriesColor(index);

  const capacity = useMemo(() => {
    let best = 0;
    for (let k = 0; k <= 200; k++) {
      const candidate = inputDistribution(size, k / 200);
      best = Math.max(best, mutualInformation(matrix, candidate).iXY);
    }
    return best;
  }, [matrix, size]);

  const fan = useMemo(() => {
    const p0s = [0.5, 0.375, 0.25, 0.125, 0];
    return p0s.map((probe, index) => {
      const points: { x: number; y: number }[] = [];
      for (let k = 0; k <= 60; k++) {
        const t = k / 60;
        const candidate = inputDistribution(size, probe);
        points.push({ x: t, y: mutualInformation(def.matrix(t), candidate).iXY });
      }
      return { label: `P(X₀)=${probe.toFixed(3)}`, color: seriesColor(index), points };
    });
  }, [def, size]);

  const yMax = size >= 4 ? 2 : 1;
  const yTicks = size >= 4 ? [0, 0.5, 1, 1.5, 2] : [0, 0.25, 0.5, 0.75, 1];

  const setParam = (value: number): void => {
    setParams((prev) => ({ ...prev, [channel]: value }));
  };

  return (
    <LecturePage slug="channel-zoo" quiz={<Quiz slug="channel-zoo" questions={QUESTIONS} />}>
      <p className="it-body-block" style={{ maxWidth: 680 }}>
        Channels are described by a transition matrix P(Y|X). The diagonal says how often a symbol
        survives; the off-diagonal says how it can be corrupted. Pick a channel, move its noise
        parameter, and watch what the input tells you about the output.
      </p>

      <SegmentedControl
        label="Choose a channel"
        name="channel-zoo-channel"
        value={channel}
        onChange={setChannel}
        options={CHANNELS.map((item) => ({ value: item.id, label: item.label }))}
      />
      <p className="text-muted" style={{ maxWidth: 680, marginTop: 'var(--space-3)' }}>
        {def.description}
      </p>
      <p className="text-muted" style={{ maxWidth: 680 }}>{def.paramNote}</p>

      <div style={{ display: 'flex', gap: 'var(--space-6)', flexWrap: 'wrap', margin: 'var(--space-4) 0' }}>
        <Slider
          label={def.paramLabel}
          valueLabel={param.toFixed(2)}
          value={param}
          min={0}
          max={1}
          step={0.01}
          onChange={setParam}
          accentColor="var(--color-accent-2)"
          valueColor="var(--color-accent-2-700)"
          style={{ maxWidth: 300, flex: 1 }}
        />
        <Slider
          label={`Input distribution P(X=${def.inputs[0]})`}
          valueLabel={p0.toFixed(2)}
          value={p0}
          min={0}
          max={1}
          step={0.01}
          onChange={setP0}
          style={{ maxWidth: 300, flex: 1 }}
        />
      </div>

      <div style={{ display: 'flex', gap: 'var(--space-8)', flexWrap: 'wrap', marginBottom: 'var(--space-5)', maxWidth: 640 }}>
        <div style={{ minWidth: 220, flex: 1 }}>
          <MetricRow label="H(X)" value={fmt(metrics.hX)} valueColor="var(--color-accent-700)" />
          <MetricRow label="H(Y|X)" value={fmt(metrics.hYX)} valueColor="var(--color-accent-700)" />
          <MetricRow label="H(Y)" value={fmt(metrics.hY)} valueColor="var(--color-accent-2-700)" />
          <MetricRow label="I(X;Y)" value={fmt(metrics.iXY)} valueColor="var(--color-accent-2-700)" />
          <MetricRow label="Capacity C (best P(X))" value={fmt(capacity)} valueColor="var(--color-accent-2-700)" />
        </div>
      </div>

      <h4>Transition Matrix</h4>
      <div style={{ display: 'flex', gap: 'var(--space-6)', flexWrap: 'wrap', alignItems: 'flex-start' }}>
        <Plot
          xDomain={[0, def.outputs.length]}
          yDomain={[0, def.inputs.length]}
          title="Transition matrix P(Y|X) as a heatmap"
          desc="Darker cells carry more probability. Rows are input symbols and columns are output symbols."
          height={220}
          width={300}
        >
          <Heatmap data={matrix} max={1} />
          <Axis orient="bottom" label="output" ticks={tickRange(def.outputs.length + 1)} />
          <Axis orient="left" label="input" ticks={tickRange(def.inputs.length + 1)} />
        </Plot>
        <table className="table" style={{ width: 'auto' }}>
          <thead>
            <tr>
              <th />
              {def.outputs.map((symbol) => (
                <th key={symbol}>{symbol}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {matrix.map((row, i) => (
              <tr key={def.inputs[i]}>
                <td><b>{def.inputs[i]}</b></td>
                {row.map((value, j) => (
                  <td key={def.outputs[j]} style={{ color: outputColor(j) }}>{value.toFixed(3)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h4>Symbol Flow</h4>
      <div style={{ maxWidth: 640, marginBottom: 'var(--space-5)' }}>
        <div className="text-muted" style={{ fontSize: 12, marginBottom: 6 }}>
          Joint contributions P(X=x)·P(Y|X=x) per input symbol, and the resulting output marginal P(Y).
        </div>
        {matrix.map((row, i) => (
          <div key={`flow-${def.inputs[i]}`} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 5 }}>
            <span className="tag tag-neutral" style={{ minWidth: 36, justifyContent: 'center' }}>{def.inputs[i]}</span>
            <div style={{ flex: 1, display: 'flex', height: 14, background: 'var(--color-surface)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
              {row.map((value, j) => (
                <div
                  key={def.outputs[j]}
                  title={`P(X=${def.inputs[i]}, Y=${def.outputs[j]}) = ${(dist[i] * value).toFixed(3)}`}
                  style={{ width: `${dist[i] * value * 100}%`, background: outputColor(j) }}
                />
              ))}
            </div>
          </div>
        ))}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginTop: 'var(--space-3)' }}>
          <span className="tag tag-accent" style={{ minWidth: 36, justifyContent: 'center' }}>Y</span>
          <div style={{ flex: 1, display: 'flex', height: 14, background: 'var(--color-surface)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
            {metrics.py.map((value, j) => (
              <div key={`marg-${def.outputs[j]}`} title={`P(Y=${def.outputs[j]}) = ${value.toFixed(3)}`} style={{ width: `${value * 100}%`, background: outputColor(j) }} />
            ))}
          </div>
        </div>
        <div className="text-muted" style={{ fontSize: 12, marginTop: 6 }}>
          {def.outputs.map((symbol, j) => `P(Y=${symbol}) = ${metrics.py[j].toFixed(3)}`).join('   ')}
        </div>
      </div>

      <Formula
        tex="I(X;Y) = H(Y) - H(Y\mid X)"
        note="what the output tells you about the input, for any discrete channel"
        label="Mutual information"
      />

      <Plot
        xDomain={[0, 1]}
        yDomain={[0, yMax]}
        title={`Mutual information versus ${def.paramLabel}`}
        desc="Each curve fixes an input distribution while the channel parameter sweeps from 0 to 1; the top curve approaches the channel capacity."
        caption="A fan of input distributions. The symmetric channels are optimised by a uniform input; the Z-channel prefers a biased input, so its capacity sits above the uniform-input curve."
        height={320}
      >
        <Axis orient="left" label="I(X;Y) (bits)" ticks={yTicks} />
        <Axis orient="bottom" label={def.paramLabel} ticks={[0, 0.25, 0.5, 0.75, 1]} />
        {fan.map((series) => (
          <Curve key={series.label} points={series.points} color={series.color} />
        ))}
        <RuleY y={capacity} color="var(--color-neutral-500)" label={`Capacity ≈ ${capacity.toFixed(3)}`} />
        <Marker x={param} y={metrics.iXY} color="var(--color-accent-700)" label={`I = ${metrics.iXY.toFixed(3)}`} />
      </Plot>
      <Legend items={fan.map((series) => ({ label: series.label, color: series.color }))} />

      <Callout title="Symmetric versus asymmetric">
        A BSC, erasure channel and noisy typewriter treat inputs alike, so a uniform input maximises
        mutual information. The Z-channel is asymmetric, so its capacity is reached by sending 0 more
        often, and at a = 1 the channel collapses everything to 1 — capacity zero.
      </Callout>
    </LecturePage>
  );
};

export default ChannelZooPage;
