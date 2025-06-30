
import React, { useEffect } from 'react';
import type { BSCMetrics } from '../types';
import { pLogP } from '../utils/informationTheory';

interface BSCMetricsDerivationModalProps {
  metricKey: string | null;
  metrics: BSCMetrics;
  onClose: () => void;
}

const CalculationStep: React.FC<{ title: string; calculation: string; result: string | number; subSteps?: React.ReactNode[], final?: boolean }> = 
  ({ title, calculation, result, subSteps, final }) => (
  <div className="mb-2">
    <p className={`text-sm font-medium ${final ? 'text-sky-700': 'text-slate-700'}`}>{title}:</p>
    <p className="text-xs text-slate-600 ml-2">
      <code className="bg-slate-100 p-1 rounded break-all">{calculation}</code>
      <span className={`font-semibold ${final ? 'text-sky-600': ''}`}> = {typeof result === 'number' ? result.toFixed(5) : result}</span>
    </p>
    {subSteps && <div className="ml-4 mt-1 border-l-2 border-slate-200 pl-3">{subSteps}</div>}
  </div>
); // Added missing closing parenthesis here

const ValueDisplay: React.FC<{label: string; value: number; symbol?: string}> = ({label, value, symbol}) => (
    <p className="text-xs text-slate-600"><code className="font-semibold">{symbol || label}</code> ({label}) = {value.toFixed(5)}</p>
);

const BSCMetricsDerivationModal: React.FC<BSCMetricsDerivationModalProps> = ({ metricKey, metrics, onClose }) => {
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

  const p = metrics.p_crossover;
  const q = metrics.q_probX0;

  const render_P_X0 = () => (
    <>
      <ValueDisplay label="Input P(X=0)" value={q} symbol="q"/>
      <CalculationStep title="Final P(X=0)" calculation="q" result={metrics.probX0} final/>
    </>
  );
  const render_P_X1 = () => (
    <>
      <ValueDisplay label="Input P(X=0)" value={q} symbol="q"/>
      <CalculationStep title="Final P(X=1)" calculation="1 - q" result={metrics.probX1} final/>
    </>
  );

  const render_H_X = () => (
    <>
      <ValueDisplay label="P(X=0)" value={metrics.probX0} symbol="P(X=0)" />
      <ValueDisplay label="P(X=1)" value={metrics.probX1} symbol="P(X=1)" />
      <hr className="my-2"/>
      <CalculationStep
        title="1. Term for X=0"
        calculation={`pLogP(P(X=0))`}
        result={pLogP(metrics.probX0)}
      />
      <CalculationStep
        title="2. Term for X=1"
        calculation={`pLogP(P(X=1))`}
        result={pLogP(metrics.probX1)}
      />
      <CalculationStep
        title="3. Sum of terms"
        calculation="pLogP(P(X=0)) + pLogP(P(X=1))"
        result={pLogP(metrics.probX0) + pLogP(metrics.probX1)}
      />
       <CalculationStep
        title="4. Final Entropy H(X)"
        calculation="- (Sum of terms)"
        result={metrics.H_X}
        final
      />
    </>
  );
  
  const render_P_Y0 = () => (
    <>
      <ValueDisplay label="Crossover probability" value={p} symbol="p"/>
      <ValueDisplay label="P(X=0)" value={q} symbol="q"/>
      <ValueDisplay label="P(X=1)" value={1-q} symbol="1-q"/>
      <hr className="my-2"/>
      <CalculationStep title="Term 1: P(Y=0|X=0)P(X=0)" calculation="(1-p) * q" result={(1-p)*q} />
      <CalculationStep title="Term 2: P(Y=0|X=1)P(X=1)" calculation="p * (1-q)" result={p*(1-q)} />
      <CalculationStep title="Final P(Y=0)" calculation="Term 1 + Term 2" result={metrics.probY0} final/>
    </>
  );
  const render_P_Y1 = () => (
     <>
      <ValueDisplay label="Crossover probability" value={p} symbol="p"/>
      <ValueDisplay label="P(X=0)" value={q} symbol="q"/>
      <ValueDisplay label="P(X=1)" value={1-q} symbol="1-q"/>
      <hr className="my-2"/>
      <CalculationStep title="Term 1: P(Y=1|X=0)P(X=0)" calculation="p * q" result={p*q} />
      <CalculationStep title="Term 2: P(Y=1|X=1)P(X=1)" calculation="(1-p) * (1-q)" result={(1-p)*(1-q)} />
      <CalculationStep title="Final P(Y=1)" calculation="Term 1 + Term 2" result={metrics.probY1} final/>
      <p className="text-xs text-slate-500 mt-2">Alternatively: P(Y=1) = 1 - P(Y=0) = 1 - {metrics.probY0.toFixed(5)} = {(1-metrics.probY0).toFixed(5)}</p>
    </>
  );

  const render_H_Y = () => (
     <>
      <ValueDisplay label="P(Y=0)" value={metrics.probY0} symbol="P(Y=0)" />
      <ValueDisplay label="P(Y=1)" value={metrics.probY1} symbol="P(Y=1)" />
      <p className="text-xs text-slate-500 mb-2">(Click P(Y=0) or P(Y=1) on the main page for their individual calculation details.)</p>
      <hr className="my-2"/>
      <CalculationStep
        title="1. Term for Y=0"
        calculation={`pLogP(P(Y=0))`}
        result={pLogP(metrics.probY0)}
      />
      <CalculationStep
        title="2. Term for Y=1"
        calculation={`pLogP(P(Y=1))`}
        result={pLogP(metrics.probY1)}
      />
      <CalculationStep
        title="3. Sum of terms"
        calculation="pLogP(P(Y=0)) + pLogP(P(Y=1))"
        result={pLogP(metrics.probY0) + pLogP(metrics.probY1)}
      />
       <CalculationStep
        title="4. Final Entropy H(Y)"
        calculation="- (Sum of terms)"
        result={metrics.H_Y}
        final
      />
    </>
  );

  const render_H_Y_given_X = () => (
     <>
      <ValueDisplay label="Crossover probability" value={p} symbol="p"/>
      <ValueDisplay label="P(No flip)" value={1-p} symbol="1-p"/>
      <p className="text-xs text-slate-500 my-1">For a BSC, H(Y|X) = H(Y|X=0)P(X=0) + H(Y|X=1)P(X=1).</p>
      <p className="text-xs text-slate-500 my-1">H(Y|X=0) is entropy of {'{p, 1-p}'}, which is H(p).</p>
      <p className="text-xs text-slate-500 mb-2">H(Y|X=1) is entropy of {'{p, 1-p}'}, which is H(p). So H(Y|X) = H(p).</p>
      <hr className="my-2"/>
      <CalculationStep
        title="1. Term for flip (prob p)"
        calculation={`pLogP(p)`}
        result={pLogP(p)}
      />
      <CalculationStep
        title="2. Term for no flip (prob 1-p)"
        calculation={`pLogP(1-p)`}
        result={pLogP(1-p)}
      />
      <CalculationStep
        title="3. Sum of terms"
        calculation="pLogP(p) + pLogP(1-p)"
        result={pLogP(p) + pLogP(1-p)}
      />
       <CalculationStep
        title="4. Final H(Y|X) = H(p)"
        calculation="- (Sum of terms)"
        result={metrics.H_Y_given_X}
        final
      />
    </>
  );

  const render_I_X_Y = () => (
    <>
      <ValueDisplay label="H(Y)" value={metrics.H_Y} symbol="H(Y)" />
      <ValueDisplay label="H(Y|X)" value={metrics.H_Y_given_X} symbol="H(Y|X)" />
      <p className="text-xs text-slate-500 mb-2">(Click H(Y) or H(Y|X) on the main page for their individual calculation details.)</p>
      <hr className="my-2"/>
      <CalculationStep
        title="Final Mutual Information I(X;Y)"
        calculation="H(Y) - H(Y|X)"
        result={metrics.I_X_Y}
        final
      />
    </>
  );
  
  const render_C = () => (
    <>
      <ValueDisplay label="H(p) which is H(Y|X) for BSC" value={metrics.H_Y_given_X} symbol="H(p)" />
      <p className="text-xs text-slate-500 mb-2">(Click H(Y|X) on the main page for its calculation details. H(p) is the entropy of the crossover probability p.)</p>
      <hr className="my-2"/>
      <CalculationStep
        title="Final Channel Capacity (C)"
        calculation="1 - H(p)"
        result={metrics.capacity}
        final
      />
    </>
  );


  switch (metricKey) {
    case 'PX0':
      title = 'Derivation for P(X=0)';
      formula = 'P(X=0) = q';
      content = render_P_X0();
      break;
    case 'PX1':
      title = 'Derivation for P(X=1)';
      formula = 'P(X=1) = 1 - q';
      content = render_P_X1();
      break;
    case 'H_X_BSC':
      title = 'Derivation for H(X)';
      formula = 'H(X) = - [ q log₂(q) + (1-q) log₂(1-q) ]';
      content = render_H_X();
      break;
    case 'PY0':
      title = 'Derivation for P(Y=0)';
      formula = 'P(Y=0) = P(Y=0|X=0)P(X=0) + P(Y=0|X=1)P(X=1) = (1-p)q + p(1-q)';
      content = render_P_Y0();
      break;
    case 'PY1':
      title = 'Derivation for P(Y=1)';
      formula = 'P(Y=1) = P(Y=1|X=0)P(X=0) + P(Y=1|X=1)P(X=1) = pq + (1-p)(1-q)';
      content = render_P_Y1();
      break;
    case 'H_Y_BSC':
      title = 'Derivation for H(Y)';
      formula = 'H(Y) = - [ P(Y=0)log₂(P(Y=0)) + P(Y=1)log₂(P(Y=1)) ]';
      content = render_H_Y();
      break;
    case 'H_Y_given_X_BSC':
      title = 'Derivation for H(Y|X)';
      formula = 'H(Y|X) = H(p) = - [ p log₂(p) + (1-p) log₂(1-p) ]  (for BSC)';
      content = render_H_Y_given_X();
      break;
    case 'I_X_Y_BSC':
      title = 'Derivation for I(X;Y)';
      formula = 'I(X;Y) = H(Y) - H(Y|X)';
      content = render_I_X_Y();
      break;
    case 'C_BSC':
      title = 'Derivation for Channel Capacity (C)';
      formula = 'C = 1 - H(p)  (for BSC)';
      content = render_C();
      break;
    default:
      content = <p>No derivation available for this metric.</p>;
  }


  return (
    <div 
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-labelledby="bsc-metric-modal-title"
    >
      <div 
        className="bg-white p-6 rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()} 
      >
        <div className="flex justify-between items-center mb-4">
          <h3 id="bsc-metric-modal-title" className="text-lg font-semibold text-sky-700">{title}</h3>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-700 text-2xl"
            aria-label="Close derivation detail"
          >
            &times;
          </button>
        </div>
        
        <div className="mb-3">
          <p className="text-sm font-semibold text-slate-600">Formula:</p>
          <p className="text-xs bg-slate-100 p-2 rounded font-mono text-slate-700 break-all">{formula}</p>
        </div>

        <div className="mb-3">
          <p className="text-sm font-semibold text-slate-600">Inputs & Derivation Steps:</p>
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

export default BSCMetricsDerivationModal;
