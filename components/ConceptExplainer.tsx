
import React from 'react';

interface ConceptExplainerProps {
  title: string;
  explanation: React.ReactNode[]; // Array of paragraphs or elements
  formula?: string;
  id?: string;
}

const ConceptExplainer: React.FC<ConceptExplainerProps> = ({ title, explanation, formula, id }) => {
  return (
    <div id={id} className="bg-sky-50/70 p-4 sm:p-6 rounded-lg shadow-lg mb-6 border border-sky-200">
      <h3 className="text-xl sm:text-2xl font-semibold text-sky-700 mb-3">{title}</h3>
      <div className="text-slate-700 space-y-3 text-sm sm:text-base leading-relaxed">
        {explanation.map((paragraph, index) => (
          typeof paragraph === 'string' ? <p key={index}>{paragraph}</p> : <React.Fragment key={index}>{paragraph}</React.Fragment>
        ))}
      </div>
      {formula && (
        <div className="mt-4 p-3 bg-sky-100 rounded text-sky-800 font-mono text-sm sm:text-base overflow-x-auto shadow-inner">
          {formula}
        </div>
      )}
    </div>
  );
};

export default ConceptExplainer;
