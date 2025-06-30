
import React, { useEffect } from 'react';
import type { InfoMetrics } from '../types';
import { pLogP, calculateInformationContent } from '../utils/informationTheory';

type MetricKey = 'pHeads' | 'pTails' | 'iHeads' | 'iTails' | 'entropy';

interface MetricCalculationModalProps {
  metricKey: MetricKey | null;
  pHeadsValue: number;
  metrics: InfoMetrics; // Pass all metrics for easy access to calculated values
  onClose: () => void;
}

const CalculationStep: React.FC<{ title: string; calculation: string; result: string | number; final?: boolean; subSteps?: React.ReactNode[] }> = 
 ({ title, calculation, result, final, subSteps }) => (
  <div className="mb-2">
    <p className={`text-sm font-medium ${final ? 'text-sky-700': 'text-slate-700'}`}>{title}:</p>
    <p className="text-xs text-slate-600 ml-2">
      <code className="bg-slate-100 p-1 rounded break-all">{calculation}</code>
      <span className={`font-semibold ${final ? 'text-sky-600': ''}`}> = {typeof result === 'number' ? result.toFixed(5) : result}</span>
    </p>
    {subSteps && <div className="ml-4 mt-1 border-l-2 border-slate-200 pl-3">{subSteps}</div>}
  </div>
);

const ValueDisplay: React.FC<{label: string; value: number | string; symbol?:string}> = ({label, value, symbol}) => (
    <p className="text-xs text-slate-600"><code className="font-semibold">{symbol || label}</code> ({label}) = {typeof value === 'number' ? value.toFixed(5) : value}</p>
);


const MetricCalculationModal: React.FC<MetricCalculationModalProps> = ({ metricKey, pHeadsValue, metrics, onClose }) => {
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

  if (!metricKey) return null;

  let title = '';
  let formula = '';
  let content: React.ReactNode = null;

  const pH = pHeadsValue;
  const pT = 1 - pH;

  switch (metricKey) {
    case 'pHeads':
      title = 'Calculation for P(Heads)';
      formula = 'P(Heads) = User Input';
      content = (
        <>
          <ValueDisplay label="User-defined probability of Heads" value={pH} symbol="P(Heads)" />
          <CalculationStep title="Final P(Heads)" calculation="P(Heads)" result={metrics.pHeads} final />
        </>
      );
      break;
    case 'pTails':
      title = 'Calculation for P(Tails)';
      formula = 'P(Tails) = 1 - P(Heads)';
      content = (
        <>
          <ValueDisplay label="P(Heads)" value={pH} />
          <CalculationStep title="Final P(Tails)" calculation={`1 - ${pH.toFixed(5)}`} result={metrics.pTails} final />
        </>
      );
      break;
    case 'iHeads':
      title = 'Calculation for I(Heads)';
      formula = 'I(Heads) = -log₂(P(Heads))';
      content = (
        <>
          <ValueDisplay label="P(Heads)" value={pH} />
          {pH === 0 && <p className="text-xs text-slate-600 ml-2">Since P(Heads) = 0, log₂(0) is -Infinity, so I(Heads) is Infinity.</p>}
          {pH === 1 && <p className="text-xs text-slate-600 ml-2">Since P(Heads) = 1, log₂(1) is 0, so I(Heads) is 0.</p>}
          {pH > 0 && pH < 1 && 
            <CalculationStep title="log₂(P(Heads))" calculation={`log₂(${pH.toFixed(5)})`} result={Math.log2(pH).toFixed(5)} />
          }
          <CalculationStep title="Final I(Heads) (bits)" calculation={pH > 0 && pH < 1 ? `- (log₂(P(Heads)))` : (pH === 0 ? "Infinity" : "0")} result={metrics.iHeads} final />
        </>
      );
      break;
    case 'iTails':
      title = 'Calculation for I(Tails)';
      formula = 'I(Tails) = -log₂(P(Tails))';
      content = (
        <>
          <ValueDisplay label="P(Heads)" value={pH} />
          <ValueDisplay label="Calculated P(Tails)" value={pT} symbol="P(Tails)" />
           {pT === 0 && <p className="text-xs text-slate-600 ml-2">Since P(Tails) = 0, log₂(0) is -Infinity, so I(Tails) is Infinity.</p>}
           {pT === 1 && <p className="text-xs text-slate-600 ml-2">Since P(Tails) = 1, log₂(1) is 0, so I(Tails) is 0.</p>}
           {pT > 0 && pT < 1 && 
            <CalculationStep title="log₂(P(Tails))" calculation={`log₂(${pT.toFixed(5)})`} result={Math.log2(pT).toFixed(5)} />
          }
          <CalculationStep title="Final I(Tails) (bits)" calculation={pT > 0 && pT < 1 ? `- (log₂(P(Tails)))` : (pT === 0 ? "Infinity" : "0")} result={metrics.iTails} final />
        </>
      );
      break;
    case 'entropy':
      title = 'Calculation for Entropy H(Coin)';
      formula = 'H(Coin) = - [P(Heads)log₂(P(Heads)) + P(Tails)log₂(P(Tails))]';
      const termHeads = pLogP(pH);
      const termTails = pLogP(pT);
      content = (
        <>
          <ValueDisplay label="P(Heads)" value={pH} />
          <ValueDisplay label="P(Tails)" value={pT} />
          <hr className="my-2"/>
          <CalculationStep
            title="1. Term for Heads: P(H)log₂(P(H))"
            calculation={`pLogP(${pH.toFixed(5)})`}
            result={termHeads}
            subSteps={[
                <p key="condH" className="text-xs text-slate-500">If P(H)=0 or P(H)=1, this term is 0. Otherwise, it's P(H) * log₂(P(H)).</p>
            ]}
          />
          <CalculationStep
            title="2. Term for Tails: P(T)log₂(P(T))"
            calculation={`pLogP(${pT.toFixed(5)})`}
            result={termTails}
            subSteps={[
                <p key="condT" className="text-xs text-slate-500">If P(T)=0 or P(T)=1, this term is 0. Otherwise, it's P(T) * log₂(P(T)).</p>
            ]}
          />
          <CalculationStep
            title="3. Sum of terms"
            calculation={`${termHeads.toFixed(5)} + ${termTails.toFixed(5)}`}
            result={termHeads + termTails}
          />
          <CalculationStep
            title="4. Final Entropy H(Coin) (bits)"
            calculation={`- (${(termHeads + termTails).toFixed(5)})`}
            result={metrics.entropy}
            final
          />
        </>
      );
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
        aria-labelledby="metric-calculation-modal-title"
    >
      <div 
        className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()} 
      >
        <div className="flex justify-between items-center mb-4">
          <h3 id="metric-calculation-modal-title" className="text-lg font-semibold text-sky-700">{title}</h3>
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
          <p className="text-xs bg-slate-100 p-2 rounded font-mono text-slate-700 break-all">{formula}</p>
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

export default MetricCalculationModal;
