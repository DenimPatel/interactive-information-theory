import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Slider from '../Slider';
import MetricRow from '../MetricRow';
import LecturePage from '../shell/LecturePage';
import Formula from '../ui/Formula';
import Quiz, { type QuizQuestion } from '../quiz/Quiz';
import { Axis, Curve, Marker, Plot, RuleY } from '../chart';
import SimControls from '../ui/SimControls';
import { useAnimationLoop } from '../../hooks/useAnimationLoop';
import { calculateEntropy } from '../../utils/informationTheory';
import { FORMULAS } from '../../content/formulas';

const F = FORMULAS.bsc;

const QUESTIONS: QuizQuestion[] = [
  {
    id: 'p-half',
    kind: 'numeric',
    prompt: 'What is the capacity of a BSC with crossover probability p = 0.5, in bits?',
    answer: 0,
    tolerance: 1e-6,
    unit: 'bits',
    explanation: 'A channel that randomises every bit carries no information at all.',
  },
  {
    id: 'optimal-input',
    kind: 'choice',
    prompt: 'Which input distribution maximises mutual information over a BSC?',
    options: [
      { label: 'Always send 0' },
      { label: 'Always send 1' },
      { label: 'Uniform: P(X=0) = 0.5', correct: true },
      { label: 'It depends on p' },
    ],
    explanation: 'The BSC is symmetric, so the capacity-achieving input is uniform for every p.',
  },
  {
    id: 'perfect',
    kind: 'numeric',
    prompt: 'What is C for a noiseless BSC (p = 0), in bits per channel use?',
    answer: 1,
    tolerance: 1e-6,
    unit: 'bits',
    explanation: 'With no noise each bit is received exactly, so one bit per use is achievable.',
  },
];

const BinarySymmetricChannelPage: React.FC = () => {
  const [p, setP] = useState<number>(0.1);
  const [q, setQ] = useState<number>(0.5);

  const probX1 = 1 - q;
  const hX = calculateEntropy(q);
  const probY0 = (1 - p) * q + p * probX1;
  const hY = calculateEntropy(probY0);
  const hYX = calculateEntropy(p);
  const iXY = Math.max(0, hY - hYX);
  const capacity = Math.max(0, 1 - hYX);

  const [baQ, setBaQ] = useState<[number, number]>([0.9, 0.1]);
  const [baIter, setBaIter] = useState(0);
  const baQRef = useRef<[number, number]>([0.9, 0.1]);

  const resetBa = useCallback(() => {
    baQRef.current = [0.9, 0.1];
    setBaQ([0.9, 0.1]);
    setBaIter(0);
  }, []);

  const safeLog = (num: number, den: number) => (num > 0 && den > 0 ? Math.log2(num / den) : 0);

  const baStep = useCallback(() => {
    const [q0, q1] = baQRef.current;
    const py0 = (1 - p) * q0 + p * q1;
    const py1 = 1 - py0;
    const e0 = (1 - p) * safeLog(1 - p, py0) + p * safeLog(p, py1);
    const e1 = p * safeLog(p, py0) + (1 - p) * safeLog(1 - p, py1);
    const w0 = 2 ** e0;
    const w1 = 2 ** e1;
    const z = w0 + w1 || 1;
    const next: [number, number] = [w0 / z, w1 / z];
    baQRef.current = next;
    setBaQ(next);
    setBaIter((count) => count + 1);
  }, [p]);

  useEffect(() => {
    resetBa();
  }, [p, resetBa]);

  const loop = useAnimationLoop({ tick: baStep, initialSpeed: 5 });

  const baPy0 = (1 - p) * baQ[0] + p * baQ[1];
  const baPy1 = 1 - baPy0;
  const baMI = baQ[0] * ((1 - p) * safeLog(1 - p, baPy0) + p * safeLog(p, baPy1))
    + baQ[1] * (p * safeLog(p, baPy0) + (1 - p) * safeLog(1 - p, baPy1));

  const curve = useMemo(() => {
    const points = [];
    for (let i = 0; i <= 100; i++) {
      const qi = i / 100;
      const y0 = (1 - p) * qi + p * (1 - qi);
      points.push({ x: qi, y: Math.max(0, calculateEntropy(y0) - hYX) });
    }
    return points;
  }, [p, hYX]);

  return (
    <LecturePage slug="bsc" quiz={<Quiz slug="bsc" questions={QUESTIONS} />}>
      <p className="it-body-block">
        A Binary Symmetric Channel flips a transmitted bit with crossover probability p, independent of
        past transmissions.
      </p>
      <Formula tex={F.mutualInfo} note="what the output tells you about the input" label="Mutual information over a BSC" />
      <Formula tex={F.capacity} note="the maximum mutual information, achieved by a uniform input" label="Capacity of a BSC" />

      <div style={{ display: 'flex', gap: 'var(--space-6)', flexWrap: 'wrap', marginBottom: 'var(--space-5)' }}>
        <Slider
          label="Crossover Probability (p)" valueLabel={p.toFixed(2)} valueColor="var(--color-accent-2-700)" accentColor="var(--color-accent-2)"
          value={p} min={0} max={1} step={0.01} onChange={setP}
          style={{ maxWidth: 300, flex: 1 }}
        />
        <Slider
          label="Input Distribution P(X=0)" valueLabel={q.toFixed(2)}
          value={q} min={0} max={1} step={0.01} onChange={setQ}
          style={{ maxWidth: 300, flex: 1 }}
        />
      </div>

      <div style={{ display: 'flex', gap: 'var(--space-6)', flexWrap: 'wrap', marginBottom: 'var(--space-5)' }}>
        <div>H(X)<br /><b style={{ color: 'var(--color-accent-700)' }}>{hX.toFixed(4)}</b></div>
        <div>H(Y)<br /><b style={{ color: 'var(--color-accent-700)' }}>{hY.toFixed(4)}</b></div>
        <div>H(Y|X)<br /><b style={{ color: 'var(--color-accent-700)' }}>{hYX.toFixed(4)}</b></div>
        <div>I(X;Y)<br /><b style={{ color: 'var(--color-accent-2-700)' }}>{iXY.toFixed(4)}</b></div>
        <div>Capacity C<br /><b style={{ color: 'var(--color-accent-2-700)' }}>{capacity.toFixed(4)}</b></div>
      </div>

      <Plot
        xDomain={[0, 1]}
        yDomain={[0, 1]}
        title="Mutual information versus P(X=0)"
        desc="Mutual information over a binary symmetric channel is maximised at a uniform input, where it equals the capacity; the dashed line marks that capacity."
        height={300}
      >
        <Axis orient="left" label="I(X;Y) (bits)" ticks={[0, 0.25, 0.5, 0.75, 1]} />
        <Axis orient="bottom" label="P(X=0)" ticks={[0, 0.25, 0.5, 0.75, 1]} />
        <RuleY y={capacity} label={`C = ${capacity.toFixed(3)}`} />
        <Curve points={curve} />
        <Marker x={q} y={iXY} label={iXY.toFixed(3)} />
      </Plot>

      <h4 style={{ marginTop: 'var(--space-6)' }}>Capacity via Blahut–Arimoto</h4>
      <p className="it-body-block">
        Blahut–Arimoto is an alternating-maximisation algorithm that finds the capacity-achieving input
        distribution by repeatedly reweighting q(x) toward the inputs whose output distributions are
        most distinguishable. Start it from a skewed input and watch it converge to the uniform
        distribution — the BSC’s optimal input — while I(X;Y) climbs to C.
      </p>
      <SimControls loop={loop} runLabel="Run Blahut–Arimoto" pauseLabel="Pause" onReset={resetBa} speedRange={[1, 20]} />
      <div style={{ display: 'flex', gap: 'var(--space-6)', flexWrap: 'wrap', maxWidth: 560 }}>
        <MetricRow label="q(X=0)" value={baQ[0].toFixed(4)} valueColor="var(--color-accent-700)" width={200} />
        <MetricRow label="q(X=1)" value={baQ[1].toFixed(4)} valueColor="var(--color-accent-700)" width={200} />
        <MetricRow label="I(X;Y)" value={`${baMI.toFixed(4)} bits`} valueColor="var(--color-accent-2-700)" width={200} />
        <MetricRow label="Capacity C" value={`${capacity.toFixed(4)} bits`} valueColor="var(--color-accent-2-700)" width={200} />
        <MetricRow label="Iterations" value={baIter} width={200} />
      </div>

      <h4>Channel Capacity</h4>
      <p className="it-body-block">
        Capacity is the maximum mutual information over all input distributions p(x) — for a BSC,
        achieved when input bits are equally likely (P(X=0) = 0.5). It ranges from 1 bit (perfect
        channel) down to 0 bits (fully random channel, p = 0.5). A channel with p &gt; 0.5 is just as
        useless as its mirror image: you can invert every received bit to obtain a BSC with 1 − p.
      </p>
    </LecturePage>
  );
};

export default BinarySymmetricChannelPage;
