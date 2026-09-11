import React, { useMemo, useState } from 'react';
import Slider from '../Slider';
import MetricRow from '../MetricRow';
import LecturePage from '../shell/LecturePage';
import Formula from '../ui/Formula';
import Quiz, { type QuizQuestion } from '../quiz/Quiz';
import { Axis, Curve, Marker, Plot } from '../chart';
import { calculateEntropy, calculateInformationContent, formatValue } from '../../utils/informationTheory';
import { FORMULAS } from '../../content/formulas';

const GEMS: { kicker: string; title: string; body: string }[] = [
  { kicker: 'Concept', title: 'Information as Surprise', body: 'Less likely events carry more information when they occur.' },
  { kicker: 'Concept', title: 'Entropy', body: 'The average amount of information produced by a source.' },
  { kicker: 'Concept', title: 'Mutual Information', body: 'Shared information between two variables.' },
  { kicker: 'Theorem', title: 'Source Coding', body: 'Sets the limit on lossless compression given entropy.' },
  { kicker: 'Theorem', title: 'Channel Coding', body: 'Sets the max reliable transmission rate over noise.' },
  { kicker: 'Applications', title: 'Everywhere', body: 'JPEG/MPEG, error correction, cryptography, ML feature selection.' },
];

const F = FORMULAS['bent-coin'];

const QUESTIONS: QuizQuestion[] = [
  {
    id: 'fair-entropy',
    kind: 'numeric',
    prompt: 'What is the entropy of a fair coin, in bits?',
    answer: 1,
    tolerance: 1e-3,
    unit: 'bits',
    explanation: 'A fair coin is maximally uncertain: one full bit per toss.',
  },
  {
    id: 'max-at-half',
    kind: 'choice',
    prompt: 'At which value of P(Heads) is the coin’s entropy largest?',
    options: [
      { label: 'P(Heads) = 0' },
      { label: 'P(Heads) = 0.5', correct: true },
      { label: 'P(Heads) = 1' },
      { label: 'It is the same for every value' },
    ],
    explanation: 'Entropy is maximised when all outcomes are equally likely.',
  },
  {
    id: 'surprise-quarter',
    kind: 'numeric',
    prompt: 'How much information, in bits, does the event "Heads" carry when P(Heads) = 0.25?',
    answer: 2,
    tolerance: 1e-3,
    unit: 'bits',
    explanation: '−log₂(0.25) = 2 bits: the rarer the event, the bigger the surprise.',
  },
  {
    id: 'biased-entropy',
    kind: 'choice',
    prompt: 'What is the entropy of a coin with P(Heads) = 1?',
    options: [
      { label: '0 bits', correct: true },
      { label: '0.5 bits' },
      { label: '1 bit' },
      { label: 'It is undefined' },
    ],
    explanation: 'A certain outcome carries no surprise, so the entropy is zero.',
  },
];

const MainPage: React.FC = () => {
  const [pHeads, setPHeads] = useState<number>(0.5);
  const pTails = 1 - pHeads;
  const entropy = calculateEntropy(pHeads);
  const iHeads = calculateInformationContent(pHeads);
  const iTails = calculateInformationContent(pTails);

  const curve = useMemo(() => {
    const points = [];
    for (let i = 0; i <= 100; i++) {
      const p = i / 100;
      points.push({ x: p, y: calculateEntropy(p) });
    }
    return points;
  }, []);

  return (
    <LecturePage slug="bent-coin" quiz={<Quiz slug="bent-coin" questions={QUESTIONS} />}>
      <Slider
        label="Probability of Heads"
        valueLabel={pHeads.toFixed(2)}
        valueItalic
        value={pHeads}
        min={0}
        max={1}
        step={0.01}
        onChange={setPHeads}
        style={{ margin: 'var(--space-6) 0 var(--space-4) 0', maxWidth: 480 }}
      />

      <div style={{ display: 'flex', gap: 'var(--space-6)', flexWrap: 'wrap', marginBottom: 'var(--space-6)', maxWidth: 600 }}>
        <MetricRow label="P(Heads)" value={pHeads.toFixed(2)} valueColor="var(--color-accent-700)" width={220} />
        <MetricRow label="P(Tails)" value={pTails.toFixed(2)} valueColor="var(--color-accent-700)" width={220} />
        <MetricRow label="I(Heads)" value={`${formatValue(iHeads)} bits`} valueColor="var(--color-accent-700)" width={220} />
        <MetricRow label="I(Tails)" value={`${formatValue(iTails)} bits`} valueColor="var(--color-accent-700)" width={220} />
        <MetricRow label="Entropy H(Coin)" value={`${entropy.toFixed(3)} bits`} valueColor="var(--color-accent-2-700)" width={220} />
      </div>

      <Plot
        xDomain={[0, 1]}
        yDomain={[0, 1]}
        title="Entropy of a bent coin versus P(heads)"
        desc="A concave curve, peaking at one bit when P(heads) is one half and falling to zero at both extremes."
        height={240}
      >
        <Axis orient="left" label="H (bits)" ticks={[0, 0.5, 1]} />
        <Axis orient="bottom" label="P(heads)" ticks={[0, 0.5, 1]} />
        <Curve points={curve} />
        <Marker x={pHeads} y={entropy} label={`${entropy.toFixed(2)} bits`} />
      </Plot>

      <h4>What is Probability?</h4>
      <p className="it-body-block">
        Probability measures the likelihood of an event occurring. For our bent coin we can adjust
        P(Heads); P(Tails) is always 1 − P(Heads). A fair coin has P(Heads) = 0.5.
      </p>
      <Formula tex={F.tails} note="probabilities of complementary events sum to one" label="P of tails equals one minus P of heads" />

      <h4>What is Information Content?</h4>
      <p className="it-body-block">
        Information content (self-information) quantifies the “surprise” of an event — less likely
        events are more surprising and carry more information when they happen, measured in bits.
      </p>
      <Formula tex={F.selfInfo} note="bits per event" label="Information content of an event equals minus log base two of its probability" />

      <h4>What is Entropy?</h4>
      <p className="it-body-block">
        Entropy measures the average uncertainty of a random variable. It is maximised at
        P(Heads) = 0.5 (1 bit) and zero when the coin is fully biased.
      </p>
      <Formula tex={F.entropy} note="the general definition, in bits" label="Entropy of X equals minus the sum of p log p" />
      <Formula tex={F.coinEntropy} note="for a two-outcome coin" label="Entropy of the coin" />

      <h4>Key Gems of Information Theory</h4>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(180px,1fr))', gap: 'var(--space-3)', marginTop: 'var(--space-3)' }}>
        {GEMS.map((gem) => (
          <div className="card elev-sm" key={gem.title}>
            <div className="card-kicker">{gem.kicker}</div>
            <div className="card-title">{gem.title}</div>
            <p className="card-body">{gem.body}</p>
          </div>
        ))}
      </div>
    </LecturePage>
  );
};

export default MainPage;
