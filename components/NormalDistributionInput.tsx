
import React from 'react';

interface NormalDistributionInputProps {
  label: string;
  mean: number;
  onMeanChange: (value: number) => void;
  variance: number;
  onVarianceChange: (value: number) => void;
  meanMin?: number;
  meanMax?: number;
  meanStep?: number;
  varianceMin?: number;
  varianceMax?: number;
  varianceStep?: number;
  color?: 'sky' | 'emerald' | 'rose' | 'amber';
}

const NormalDistributionInput: React.FC<NormalDistributionInputProps> = ({
  label,
  mean,
  onMeanChange,
  variance,
  onVarianceChange,
  meanMin = -5,
  meanMax = 5,
  meanStep = 0.1,
  varianceMin = 0.1,
  varianceMax = 5,
  varianceStep = 0.01,
  color = 'sky',
}) => {
  const colorClasses = {
    sky: { text: 'text-sky-600', accent: 'accent-sky-600', hoverAccent: 'hover:accent-sky-700', bgLight: 'bg-sky-50' },
    emerald: { text: 'text-emerald-600', accent: 'accent-emerald-600', hoverAccent: 'hover:accent-emerald-700', bgLight: 'bg-emerald-50' },
    rose: { text: 'text-rose-600', accent: 'accent-rose-600', hoverAccent: 'hover:accent-rose-700', bgLight: 'bg-rose-50' },
    amber: { text: 'text-amber-600', accent: 'accent-amber-600', hoverAccent: 'hover:accent-amber-700', bgLight: 'bg-amber-50' },
  };
  const currentColors = colorClasses[color] || colorClasses.sky;

  return (
    <div className={`p-4 rounded-lg border border-slate-300 shadow-sm ${currentColors.bgLight}`}>
      <h3 className={`text-lg font-semibold mb-3 ${currentColors.text}`}>{label}</h3>
      <div className="space-y-4">
        {/* Mean Input */}
        <div>
          <label htmlFor={`${label}-mean-number`} className="block text-sm font-medium text-slate-700">
            Mean (μ): <span className={`font-bold ${currentColors.text}`}>{mean.toFixed(2)}</span>
          </label>
          <div className="flex items-center space-x-2 mt-1">
            <input
              type="range"
              id={`${label}-mean-slider`}
              min={meanMin}
              max={meanMax}
              step={meanStep}
              value={mean}
              onChange={(e) => onMeanChange(parseFloat(e.target.value))}
              className={`w-2/3 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer ${currentColors.accent} ${currentColors.hoverAccent}`}
              aria-label={`Adjust mean for ${label}`}
            />
            <input
              type="number"
              id={`${label}-mean-number`}
              min={meanMin}
              max={meanMax}
              step={meanStep}
              value={mean}
              onChange={(e) => onMeanChange(parseFloat(e.target.value))}
              className="w-1/3 p-1.5 border border-slate-300 rounded-md shadow-sm text-sm focus:ring-sky-500 focus:border-sky-500"
            />
          </div>
          <div className="flex justify-between text-xs text-slate-500 mt-0.5">
            <span>{meanMin}</span>
            <span>{meanMax}</span>
          </div>
        </div>

        {/* Variance Input */}
        <div>
          <label htmlFor={`${label}-variance-number`} className="block text-sm font-medium text-slate-700">
            Variance (σ²): <span className={`font-bold ${currentColors.text}`}>{variance.toFixed(2)}</span>
          </label>
          <div className="flex items-center space-x-2 mt-1">
            <input
              type="range"
              id={`${label}-variance-slider`}
              min={varianceMin}
              max={varianceMax}
              step={varianceStep}
              value={variance}
              onChange={(e) => onVarianceChange(parseFloat(e.target.value))}
              className={`w-2/3 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer ${currentColors.accent} ${currentColors.hoverAccent}`}
              aria-label={`Adjust variance for ${label}`}
            />
            <input
              type="number"
              id={`${label}-variance-number`}
              min={varianceMin}
              max={varianceMax}
              step={varianceStep}
              value={variance}
              onChange={(e) => onVarianceChange(parseFloat(e.target.value))}
              className="w-1/3 p-1.5 border border-slate-300 rounded-md shadow-sm text-sm focus:ring-sky-500 focus:border-sky-500"
            />
          </div>
           <div className="flex justify-between text-xs text-slate-500 mt-0.5">
            <span>{varianceMin}</span>
            <span>{varianceMax}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NormalDistributionInput;
