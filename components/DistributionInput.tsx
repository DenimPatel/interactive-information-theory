
import React from 'react';

interface DistributionInputProps {
  label: string;
  prob: number; // Probability of outcome 1
  onProbChange: (newProb: number) => void;
  color?: 'sky' | 'emerald' | 'rose' | 'amber'; // For theming accents
  outcome1Label?: string;
  outcome0Label?: string;
}

const DistributionInput: React.FC<DistributionInputProps> = ({
  label,
  prob,
  onProbChange,
  color = 'sky',
  outcome1Label = "P(Outcome 1)",
  outcome0Label = "P(Outcome 0)"
}) => {
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onProbChange(parseFloat(event.target.value));
  };

  const prob0 = 1 - prob;

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
      <div className="space-y-3">
        <label htmlFor={`${label}-slider`} className="block text-sm font-medium text-slate-700">
          {outcome1Label}: <span className={`font-bold ${currentColors.text}`}>{prob.toFixed(2)}</span>
        </label>
        <input
          type="range"
          id={`${label}-slider`}
          min="0"
          max="1"
          step="0.01"
          value={prob}
          onChange={handleChange}
          className={`w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer ${currentColors.accent} ${currentColors.hoverAccent}`}
          aria-label={`Adjust probability for ${outcome1Label} in ${label}`}
        />
        <div className="flex justify-between text-xs text-slate-500">
          <span>0.0</span>
          <span>0.5</span>
          <span>1.0</span>
        </div>
        <p className="text-sm text-slate-700">
          {outcome0Label}: <span className={`font-medium ${currentColors.text}`}>{prob0.toFixed(2)}</span>
        </p>
      </div>
    </div>
  );
};

export default DistributionInput;
