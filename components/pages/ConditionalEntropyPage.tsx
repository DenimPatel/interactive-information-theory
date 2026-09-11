import React, { useState } from 'react';
import Slider from '../Slider';
import MetricRow from '../MetricRow';
import LecturePage from '../shell/LecturePage';
import Formula from '../ui/Formula';
import Quiz, { type QuizQuestion } from '../quiz/Quiz';
import { calculateEntropy, pLogP } from '../../utils/informationTheory';
import { FORMULAS } from '../../content/formulas';

const F = FORMULAS['conditional-entropy'];

const QUESTIONS: QuizQuestion[] = [
  {
    id: 'independent',
    kind: 'choice',
    prompt: 'If X and Y are independent, what is H(Y | X)?',
    options: [
      { label: '0' },
      { label: 'H(Y)', correct: true },
      { label: 'H(X) + H(Y)' },
      { label: 'It is undefined' },
    ],
    explanation: 'Knowing X tells you nothing about Y, so your uncertainty about Y is unchanged.',
  },
  {
    id: 'certain',
    kind: 'numeric',
    prompt: 'Suppose P(Yes | Sunny) = 1 and P(Yes | Rainy) = 0. What is H(Y | X) in bits?',
    answer: 0,
    tolerance: 1e-6,
    unit: 'bits',
    explanation: 'Once the weather is known, sunglasses are certain — no residual uncertainty remains.',
  },
  {
    id: 'mutual-zero',
    kind: 'choice',
    prompt: 'I(X; Y) = 0 exactly when…',
    options: [
      { label: 'H(X) = H(Y)' },
      { label: 'X and Y are independent', correct: true },
      { label: 'Y is a deterministic function of X' },
      { label: 'H(X | Y) = H(Y | X)' },
    ],
    explanation: 'Mutual information measures shared information; independence means there is none.',
  },
];

const ConditionalEntropyPage: React.FC = () => {
  const [pSunny, setPSunny] = useState<number>(0.6);
  const [pGivenSunny, setPGivenSunny] = useState<number>(0.9);
  const [pGivenRainy, setPGivenRainy] = useState<number>(0.1);

  const pRainy = 1 - pSunny;
  const noSunny = 1 - pGivenSunny;
  const noRainy = 1 - pGivenRainy;
  const sunnyYes = pGivenSunny * pSunny;
  const sunnyNo = noSunny * pSunny;
  const rainyYes = pGivenRainy * pRainy;
  const rainyNo = noRainy * pRainy;
  const yesTotal = sunnyYes + rainyYes;
  const noTotal = sunnyNo + rainyNo;

  const hYSunny = calculateEntropy(pGivenSunny);
  const hYRainy = calculateEntropy(pGivenRainy);
  const hYX = pSunny * hYSunny + pRainy * hYRainy;
  const hX = calculateEntropy(pSunny);
  const hY = calculateEntropy(yesTotal);
  const hXY = -(pLogP(sunnyYes) + pLogP(sunnyNo) + pLogP(rainyYes) + pLogP(rainyNo));
  const iXY = hY - hYX;

  return (
    <LecturePage slug="conditional-entropy" quiz={<Quiz slug="conditional-entropy" questions={QUESTIONS} />}>
      <p className="it-body-block">
        H(Y|X) quantifies the remaining uncertainty about Y once X is known: 0 ≤ H(Y|X) ≤ H(Y), equal
        to H(Y) only when X and Y are independent.
      </p>
      <Formula tex={F.definition} note="the remaining uncertainty in Y given X" label="Conditional entropy of Y given X" />

      <h4>Weather (X) &amp; Sunglasses (Y)</h4>
      <div style={{ display: 'flex', gap: 'var(--space-4)', flexWrap: 'wrap', margin: 'var(--space-3) 0 var(--space-5) 0' }}>
        <Slider
          label="P(Sunny)" valueLabel={pSunny.toFixed(2)} valueColor="var(--color-accent-2-700)" accentColor="var(--color-accent-2)"
          value={pSunny} min={0} max={1} step={0.01} onChange={setPSunny}
          style={{ maxWidth: 260, flex: 1 }}
        />
        <Slider
          label="P(Yes|Sunny)" valueLabel={pGivenSunny.toFixed(2)}
          value={pGivenSunny} min={0} max={1} step={0.01} onChange={setPGivenSunny}
          style={{ maxWidth: 260, flex: 1 }}
        />
        <Slider
          label="P(Yes|Rainy)" valueLabel={pGivenRainy.toFixed(2)} valueColor="var(--color-neutral-700)" accentColor="var(--color-neutral-600)"
          value={pGivenRainy} min={0} max={1} step={0.01} onChange={setPGivenRainy}
          style={{ maxWidth: 260, flex: 1 }}
        />
      </div>

      <div style={{ display: 'flex', gap: 'var(--space-8)', flexWrap: 'wrap' }}>
        <div>
          <h5 style={{ marginBottom: 'var(--space-2)' }}>Joint Probability Table</h5>
          <table className="table" style={{ width: 'auto' }}>
            <thead><tr><th>X \ Y</th><th>Yes</th><th>No</th><th>P(X)</th></tr></thead>
            <tbody>
              <tr><td><b>Sunny</b></td><td>{sunnyYes.toFixed(3)}</td><td>{sunnyNo.toFixed(3)}</td><td>{pSunny.toFixed(3)}</td></tr>
              <tr><td><b>Rainy</b></td><td>{rainyYes.toFixed(3)}</td><td>{rainyNo.toFixed(3)}</td><td>{pRainy.toFixed(3)}</td></tr>
              <tr><td><b>P(Y)</b></td><td><b>{yesTotal.toFixed(3)}</b></td><td><b>{noTotal.toFixed(3)}</b></td><td><b>1.000</b></td></tr>
            </tbody>
          </table>
        </div>
        <div>
          <h5 style={{ marginBottom: 'var(--space-2)' }}>Calculated Entropies (bits)</h5>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 260 }}>
            <MetricRow label="H(Weather)" value={hX.toFixed(4)} valueColor="var(--color-accent-700)" />
            <MetricRow label="H(Sunglasses)" value={hY.toFixed(4)} valueColor="var(--color-accent-700)" />
            <MetricRow label="H(Sunglasses|Sunny)" value={hYSunny.toFixed(4)} valueColor="var(--color-accent-700)" />
            <MetricRow label="H(Sunglasses|Rainy)" value={hYRainy.toFixed(4)} valueColor="var(--color-accent-700)" />
            <MetricRow label={<b>H(Sunglasses|Weather)</b>} value={hYX.toFixed(4)} valueColor="var(--color-accent-2-700)" />
            <MetricRow label="H(Weather, Sunglasses)" value={hXY.toFixed(4)} valueColor="var(--color-accent-700)" />
            <MetricRow label="I(Weather ; Sunglasses)" value={iXY.toFixed(4)} valueColor="var(--color-accent-700)" />
          </div>
        </div>
      </div>

      <h4 style={{ marginTop: 'var(--space-6)' }}>Chain Rule of Entropy</h4>
      <Formula tex={F.chainRule} note="the chain rule" label="H of X and Y equals H of X plus H of Y given X" />
      <Formula tex={F.mutualInfo} note="mutual information, two equivalent ways" label="Mutual information of X and Y" />
      <p className="it-body-block">
        The total uncertainty of Weather and Sunglasses together equals the uncertainty about Weather,
        plus the remaining uncertainty about Sunglasses once Weather is known. This generalises to n
        variables by chaining one conditional at a time.
      </p>
    </LecturePage>
  );
};

export default ConditionalEntropyPage;
