import React, { useState } from 'react';
import Slider from './Slider';
import MetricRow from './MetricRow';
import { calculateEntropy, pLogP } from '../utils/informationTheory';

const ConditionalEntropyPage: React.FC = () => {
  const [pSunny, setPSunny] = useState<number>(0.6);
  const [pGivenSunny, setPGivenSunny] = useState<number>(0.9); // P(Yes | Sunny)
  const [pGivenRainy, setPGivenRainy] = useState<number>(0.1); // P(Yes | Rainy)

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
    <section>
      <div className="card-kicker">Foundations</div>
      <h2>Conditional Entropy &amp; Chain Rule</h2>
      <p className="text-muted" style={{ maxWidth: 640 }}>
        H(Y|X) quantifies remaining uncertainty about Y once X is known: 0 &le; H(Y|X) &le; H(Y), equal to H(Y)
        only when X and Y are independent.
      </p>
      <p style={{ fontStyle: 'italic', color: 'var(--color-accent-700)', margin: 'var(--space-3) 0 var(--space-6) 0' }}>
        H(Y|X) = &Sigma;&#7623; p(x) H(Y|X=x) = &minus;&Sigma;&#7623;&#7616; p(x,y) log&#8322;(p(y|x))
      </p>

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
      <p style={{ fontStyle: 'italic', color: 'var(--color-accent-700)', margin: 'var(--space-3) 0 var(--space-3) 0' }}>
        H(X,Y) = H(X) + H(Y|X) = H(Y) + H(X|Y)
      </p>
      <p style={{ maxWidth: 640 }}>
        The total uncertainty of Weather and Sunglasses together equals the uncertainty about Weather, plus the
        remaining uncertainty about Sunglasses once Weather is known. Generalizes to n variables:
        H(X&#8321;,&hellip;,X&#8345;) = &Sigma;&#7522; H(X&#7522; | X&#7522;&minus;&#8321;,&hellip;,X&#8321;).
      </p>
    </section>
  );
};

export default ConditionalEntropyPage;
