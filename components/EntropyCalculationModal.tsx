
import React, { useEffect } from 'react';
import type { ConditionalEntropyMetrics } from './ConditionalEntropyPage'; // Import the metrics type
import { pLogP } from '../utils/informationTheory'; // Import pLogP for calculations

interface EntropyCalculationModalProps {
  entropyType: string | null;
  metrics: ConditionalEntropyMetrics;
  onClose: () => void;
}

const CalculationStep: React.FC<{ title: string; calculation: string; result: string | number; subSteps?: React.ReactNode[] }> = ({ title, calculation, result, subSteps }) => (
  <div className="mb-2">
    <p className="text-sm font-medium text-slate-700">{title}:</p>
    <p className="text-xs text-slate-600 ml-2">
      <code className="bg-slate-100 p-1 rounded">{calculation}</code>
      <span className="font-semibold"> = {typeof result === 'number' ? result.toFixed(5) : result}</span>
    </p>
    {subSteps && <div className="ml-4 mt-1 border-l-2 border-slate-200 pl-3">{subSteps}</div>}
  </div>
);

const ValueDisplay: React.FC<{label: string; value: number}> = ({label, value}) => (
    <p className="text-xs text-slate-600"><code className="font-semibold">{label}</code> = {value.toFixed(5)}</p>
);

const EntropyCalculationModal: React.FC<EntropyCalculationModalProps> = ({ entropyType, metrics, onClose }) => {
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => {
      window.removeEventListener('keydown', handleEsc);
    };
  }, [onClose]);

  if (!entropyType) return null;

  let title = '';
  let formula = '';
  let content: React.ReactNode = null;

  const renderHXDetails = () => (
    <>
      <ValueDisplay label="P(Sunny)" value={metrics.pSunny} />
      <ValueDisplay label="P(Rainy)" value={metrics.pRainy} />
      <hr className="my-2"/>
      <CalculationStep
        title="1. Term for Sunny"
        calculation={`pLogP(P(Sunny)) = P(Sunny) * log₂(P(Sunny))`}
        result={pLogP(metrics.pSunny)}
        subSteps={[
            <ValueDisplay key="pS" label="P(Sunny)" value={metrics.pSunny} />,
            <p key="logPS" className="text-xs text-slate-600"><code className="font-semibold">log₂(P(Sunny))</code> = {metrics.pSunny > 0 ? Math.log2(metrics.pSunny).toFixed(5) : "-∞ (term is 0)"}</p>,
        ]}
      />
      <CalculationStep
        title="2. Term for Rainy"
        calculation={`pLogP(P(Rainy)) = P(Rainy) * log₂(P(Rainy))`}
        result={pLogP(metrics.pRainy)}
        subSteps={[
            <ValueDisplay key="pR" label="P(Rainy)" value={metrics.pRainy} />,
            <p key="logPR" className="text-xs text-slate-600"><code className="font-semibold">log₂(P(Rainy))</code> = {metrics.pRainy > 0 ? Math.log2(metrics.pRainy).toFixed(5) : "-∞ (term is 0)"}</p>,
        ]}
      />
      <CalculationStep
        title="3. Sum of terms"
        calculation="pLogP(P(Sunny)) + pLogP(P(Rainy))"
        result={pLogP(metrics.pSunny) + pLogP(metrics.pRainy)}
      />
       <CalculationStep
        title="4. Final Entropy H(Weather)"
        calculation="- (Sum of terms)"
        result={metrics.H_X}
      />
    </>
  );
  
  const renderHYDetails = () => (
    <>
      <p className="text-sm font-medium text-slate-700 mb-1">First, calculate P(Sunglasses=Yes) and P(Sunglasses=No):</p>
      <ValueDisplay label="P(Sunny)" value={metrics.pSunny} />
      <ValueDisplay label="P(Rainy)" value={metrics.pRainy} />
      <ValueDisplay label="P(Yes|Sunny)" value={metrics.pSunglassesGivenSunny} />
      <ValueDisplay label="P(Yes|Rainy)" value={metrics.pSunglassesGivenRainy} />
      <hr className="my-2"/>
      <CalculationStep title="1. P(Sunny, Yes)" calculation="P(Yes|Sunny) * P(Sunny)" result={metrics.pSunny_Yes} />
      <CalculationStep title="2. P(Rainy, Yes)" calculation="P(Yes|Rainy) * P(Rainy)" result={metrics.pRainy_Yes} />
      <CalculationStep title="3. P(Sunglasses=Yes)" calculation="P(Sunny, Yes) + P(Rainy, Yes)" result={metrics.pSunglassesYes} />
      <CalculationStep title="4. P(Sunglasses=No)" calculation="1 - P(Sunglasses=Yes)" result={metrics.pSunglassesNo} />
      <hr className="my-2"/>
      <p className="text-sm font-medium text-slate-700 my-1">Then, calculate H(Sunglasses):</p>
      <CalculationStep
        title="5. Term for Yes"
        calculation={`pLogP(P(Yes)) = P(Yes) * log₂(P(Yes))`}
        result={pLogP(metrics.pSunglassesYes)}
      />
      <CalculationStep
        title="6. Term for No"
        calculation={`pLogP(P(No)) = P(No) * log₂(P(No))`}
        result={pLogP(metrics.pSunglassesNo)}
      />
      <CalculationStep
        title="7. Sum of terms"
        calculation="pLogP(P(Yes)) + pLogP(P(No))"
        result={pLogP(metrics.pSunglassesYes) + pLogP(metrics.pSunglassesNo)}
      />
       <CalculationStep
        title="8. Final Entropy H(Sunglasses)"
        calculation="- (Sum of terms)"
        result={metrics.H_Y}
      />
    </>
  );

  const renderH_Y_given_Condition = (conditionLabel: string, p_yes_given_cond: number, p_no_given_cond: number, result_H_Y_cond: number) => (
     <>
      <ValueDisplay label={`P(Yes|${conditionLabel})`} value={p_yes_given_cond} />
      <ValueDisplay label={`P(No|${conditionLabel})`} value={p_no_given_cond} />
      <hr className="my-2"/>
      <CalculationStep
        title={`1. Term for Yes given ${conditionLabel}`}
        calculation={`pLogP(P(Yes|${conditionLabel}))`}
        result={pLogP(p_yes_given_cond)}
      />
      <CalculationStep
        title={`2. Term for No given ${conditionLabel}`}
        calculation={`pLogP(P(No|${conditionLabel}))`}
        result={pLogP(p_no_given_cond)}
      />
      <CalculationStep
        title="3. Sum of terms"
        calculation={`pLogP(P(Yes|${conditionLabel})) + pLogP(P(No|${conditionLabel}))`}
        result={pLogP(p_yes_given_cond) + pLogP(p_no_given_cond)}
      />
       <CalculationStep
        title={`4. Final Entropy H(Sunglasses|${conditionLabel})`}
        calculation="- (Sum of terms)"
        result={result_H_Y_cond}
      />
    </>
  );

  const renderH_Y_given_X_Details = () => (
    <>
      <ValueDisplay label="P(Sunny)" value={metrics.pSunny} />
      <ValueDisplay label="P(Rainy)" value={metrics.pRainy} />
      <ValueDisplay label="H(Sunglasses|Sunny)" value={metrics.H_Y_given_Sunny} />
      <ValueDisplay label="H(Sunglasses|Rainy)" value={metrics.H_Y_given_Rainy} />
      <p className="text-xs text-slate-500 mb-2">(Click H(Y|Sunny) or H(Y|Rainy) on the main page for their individual calculation details.)</p>
      <hr className="my-2"/>
      <CalculationStep
        title="1. Sunny contribution"
        calculation="P(Sunny) * H(Sunglasses|Sunny)"
        result={metrics.pSunny * metrics.H_Y_given_Sunny}
      />
      <CalculationStep
        title="2. Rainy contribution"
        calculation="P(Rainy) * H(Sunglasses|Rainy)"
        result={metrics.pRainy * metrics.H_Y_given_Rainy}
      />
      <CalculationStep
        title="3. Final Conditional Entropy H(Sunglasses|Weather)"
        calculation="Sum of contributions"
        result={metrics.H_Y_given_X}
      />
    </>
  );

  const renderH_X_Y_Details = () => (
      <>
      <p className="text-sm font-medium text-slate-700 mb-1">Joint Probabilities P(Weather, Sunglasses):</p>
      <ValueDisplay label="P(Sunny, Yes)" value={metrics.pSunny_Yes} />
      <ValueDisplay label="P(Sunny, No)" value={metrics.pSunny_No} />
      <ValueDisplay label="P(Rainy, Yes)" value={metrics.pRainy_Yes} />
      <ValueDisplay label="P(Rainy, No)" value={metrics.pRainy_No} />
       <p className="text-xs text-slate-500 mb-2">(These are derived: P(X,Y) = P(Y|X) * P(X) )</p>
      <hr className="my-2"/>
      <CalculationStep title="1. Term for (Sunny, Yes)" calculation="pLogP(P(Sunny, Yes))" result={pLogP(metrics.pSunny_Yes)} />
      <CalculationStep title="2. Term for (Sunny, No)" calculation="pLogP(P(Sunny, No))" result={pLogP(metrics.pSunny_No)} />
      <CalculationStep title="3. Term for (Rainy, Yes)" calculation="pLogP(P(Rainy, Yes))" result={pLogP(metrics.pRainy_Yes)} />
      <CalculationStep title="4. Term for (Rainy, No)" calculation="pLogP(P(Rainy, No))" result={pLogP(metrics.pRainy_No)} />
      <CalculationStep
        title="5. Sum of terms"
        calculation="Sum of pLogP(P(x,y)) for all x,y"
        result={pLogP(metrics.pSunny_Yes) + pLogP(metrics.pSunny_No) + pLogP(metrics.pRainy_Yes) + pLogP(metrics.pRainy_No)}
      />
      <CalculationStep
        title="6. Final Joint Entropy H(Weather, Sunglasses)"
        calculation="- (Sum of terms)"
        result={metrics.H_X_Y}
      />
      <p className="text-xs text-slate-500 mt-2">Alternatively, using Chain Rule: H(X,Y) = H(X) + H(Y|X) = {metrics.H_X.toFixed(5)} + {metrics.H_Y_given_X.toFixed(5)} = {(metrics.H_X + metrics.H_Y_given_X).toFixed(5)}</p>
      </>
  );

  const renderI_X_Y_Details = () => (
    <>
      <ValueDisplay label="H(Sunglasses)" value={metrics.H_Y} />
      <ValueDisplay label="H(Sunglasses|Weather)" value={metrics.H_Y_given_X} />
      <p className="text-xs text-slate-500 mb-2">(Click these on the main page for their individual calculation details.)</p>
      <hr className="my-2"/>
      <CalculationStep
        title="1. Mutual Information I(Weather; Sunglasses)"
        calculation="H(Sunglasses) - H(Sunglasses|Weather)"
        result={metrics.I_X_Y}
      />
      <p className="text-xs text-slate-500 mt-2">Alternatively: I(X;Y) = H(Weather) + H(Sunglasses) - H(Weather, Sunglasses) = {metrics.H_X.toFixed(5)} + {metrics.H_Y.toFixed(5)} - {metrics.H_X_Y.toFixed(5)} = {(metrics.H_X + metrics.H_Y - metrics.H_X_Y).toFixed(5)}</p>
    </>
  );


  switch (entropyType) {
    case 'H_X':
      title = 'Calculation for H(Weather)';
      formula = 'H(X) = - Σ p(x) log₂(p(x)) = - [P(Sunny)log₂(P(Sunny)) + P(Rainy)log₂(P(Rainy))]';
      content = renderHXDetails();
      break;
    case 'H_Y':
      title = 'Calculation for H(Sunglasses)';
      formula = 'H(Y) = - Σ p(y) log₂(p(y)) = - [P(Yes)log₂(P(Yes)) + P(No)log₂(P(No))]';
      content = renderHYDetails();
      break;
    case 'H_Y_given_Sunny':
      title = 'Calculation for H(Sunglasses | Sunny)';
      formula = 'H(Y|X=Sunny) = - [P(Yes|Sunny)log₂(P(Yes|Sunny)) + P(No|Sunny)log₂(P(No|Sunny))]';
      content = renderH_Y_given_Condition("Sunny", metrics.pSunglassesGivenSunny, metrics.pNoSunglassesGivenSunny, metrics.H_Y_given_Sunny);
      break;
    case 'H_Y_given_Rainy':
      title = 'Calculation for H(Sunglasses | Rainy)';
      formula = 'H(Y|X=Rainy) = - [P(Yes|Rainy)log₂(P(Yes|Rainy)) + P(No|Rainy)log₂(P(No|Rainy))]';
      content = renderH_Y_given_Condition("Rainy", metrics.pSunglassesGivenRainy, metrics.pNoSunglassesGivenRainy, metrics.H_Y_given_Rainy);
      break;
    case 'H_Y_given_X':
      title = 'Calculation for H(Sunglasses | Weather)';
      formula = 'H(Y|X) = P(Sunny)H(Y|X=Sunny) + P(Rainy)H(Y|X=Rainy)';
      content = renderH_Y_given_X_Details();
      break;
    case 'H_X_Y':
      title = 'Calculation for H(Weather, Sunglasses)';
      formula = 'H(X,Y) = - Σ_{x,y} P(x,y)log₂(P(x,y))';
      content = renderH_X_Y_Details();
      break;
    case 'I_X_Y':
      title = 'Calculation for I(Weather ; Sunglasses)';
      formula = 'I(X;Y) = H(Y) - H(Y|X)';
      content = renderI_X_Y_Details();
      break;
    default:
      content = <p>No details available for this metric.</p>;
  }


  return (
    <div 
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-labelledby="calculation-modal-title"
    >
      <div 
        className="bg-white p-6 rounded-lg shadow-xl max-w-xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()} // Prevent click inside modal from closing it
      >
        <div className="flex justify-between items-center mb-4">
          <h3 id="calculation-modal-title" className="text-lg font-semibold text-sky-700">{title}</h3>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-700 text-2xl"
            aria-label="Close calculation detail"
          >
            &times;
          </button>
        </div>
        
        <div className="mb-3">
          <p className="text-sm font-semibold text-slate-600">Formula:</p>
          <p className="text-xs bg-slate-100 p-2 rounded font-mono text-slate-700 break-words">{formula}</p>
        </div>

        <div className="mb-3">
          <p className="text-sm font-semibold text-slate-600">Inputs & Calculation Steps:</p>
          <div className="bg-slate-50 p-3 rounded mt-1 border border-slate-200 text-sm">
            {content}
          </div>
        </div>
        
        <div className="mt-4 text-right">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-sky-600 text-white text-sm font-medium rounded-md hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default EntropyCalculationModal;
