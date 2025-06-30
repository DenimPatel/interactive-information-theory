
import React from 'react';

const MatrixCell: React.FC<{ children: React.ReactNode; isHeader?: boolean; isLabel?: boolean; className?: string }> = ({ children, isHeader, isLabel, className }) => {
  const baseClass = "flex items-center justify-center p-1.5 sm:p-2 text-xs sm:text-sm min-w-[24px] sm:min-w-[30px] h-[24px] sm:h-[30px]";
  const headerClass = isHeader ? "font-semibold text-slate-500" : "font-mono text-slate-700";
  const labelClass = isLabel ? "font-medium text-sky-700" : "";
  return <div className={`${baseClass} ${headerClass} ${labelClass} ${className || ''}`}>{children}</div>;
};

const HammingMatrixEncoding: React.FC = () => {
  const messageVector = ['d₀', 'd₁', 'd₂', 'd₃'];
  const generatorMatrix = [
    [1, 1, 1, 0, 0, 0, 0],
    [1, 0, 0, 1, 1, 0, 0],
    [0, 1, 0, 1, 0, 1, 0],
    [1, 1, 0, 1, 0, 0, 1],
  ];
  const codewordLabels = ['p₀', 'p₁', 'd₀', 'p₂', 'd₁', 'd₂', 'd₃'];

  return (
    <div className="my-4 p-3 bg-slate-50 rounded-lg shadow overflow-x-auto">
      <div className="flex flex-col sm:flex-row items-center justify-center space-y-2 sm:space-y-0 sm:space-x-3 text-lg" aria-label="Hamming code encoding equation m * G = c">
        {/* Message Vector m */}
        <div className="flex flex-col items-center">
          <div className="text-xs text-slate-500 mb-0.5">Message <code className="font-mono">(m)</code></div>
          <div className="flex border border-slate-300 bg-white rounded shadow-sm p-0.5">
            {messageVector.map((bit, idx) => (
              <MatrixCell key={`m-${idx}`} className={idx > 0 ? "border-l border-slate-200" : ""}>{bit}</MatrixCell>
            ))}
          </div>
           <div className="text-xs text-slate-400 mt-0.5">(1x4)</div>
        </div>

        <div className="font-semibold text-sky-600 text-xl mx-1 sm:mx-2">&times;</div>

        {/* Generator Matrix G */}
        <div className="flex flex-col items-center">
          <div className="text-xs text-slate-500 mb-0.5">Generator Matrix <code className="font-mono">(G)</code></div>
          <div className="flex flex-col border border-slate-300 bg-white rounded shadow-sm p-0.5">
            {/* Header row for G */}
            <div className="flex">
                {codewordLabels.map((label, colIdx) => (
                    <MatrixCell key={`g-header-${colIdx}`} isHeader className={`text-sky-600 ${colIdx > 0 ? "border-l border-slate-200" : ""}`}>{label}</MatrixCell>
                ))}
            </div>
            {generatorMatrix.map((row, rowIndex) => (
              <div key={`g-row-${rowIndex}`} className={`flex ${rowIndex > 0 ? "border-t border-slate-200" : ""}`}>
                {/* Row label for G */}
                {/* <MatrixCell isLabel className="border-r border-slate-200 text-emerald-600">{messageVector[rowIndex]}</MatrixCell> */}
                {row.map((val, colIndex) => (
                  <MatrixCell key={`g-${rowIndex}-${colIndex}`} className={colIndex > 0 ? "border-l border-slate-200" : ""}>{val}</MatrixCell>
                ))}
              </div>
            ))}
          </div>
          <div className="text-xs text-slate-400 mt-0.5">(4x7)</div>
        </div>

        <div className="font-semibold text-sky-600 text-xl mx-1 sm:mx-2">=</div>

        {/* Codeword Vector c */}
        <div className="flex flex-col items-center">
            <div className="text-xs text-slate-500 mb-0.5">Codeword <code className="font-mono">(c)</code></div>
            <div className="flex border border-slate-300 bg-white rounded shadow-sm p-0.5">
                {codewordLabels.map((bit, idx) => (
                <MatrixCell key={`c-${idx}`} className={idx > 0 ? "border-l border-slate-200" : ""}>{bit}</MatrixCell>
                ))}
            </div>
            <div className="text-xs text-slate-400 mt-0.5">(1x7)</div>
        </div>
      </div>
    </div>
  );
};

export default HammingMatrixEncoding;
