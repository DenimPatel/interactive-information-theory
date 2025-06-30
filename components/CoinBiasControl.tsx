
import React from 'react';

interface CoinBiasControlProps {
  pHeads: number;
  onPHeadsChange: (newPHeads: number) => void;
}

const CoinBiasControl: React.FC<CoinBiasControlProps> = ({ pHeads, onPHeadsChange }) => {
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onPHeadsChange(parseFloat(event.target.value));
  };

  return (
    <div className="space-y-3">
      <label htmlFor="pHeadsSlider" className="block text-sm font-medium text-slate-700">
        Probability of Heads (P(Heads)): <span className="font-bold text-sky-600">{pHeads.toFixed(2)}</span>
      </label>
      <input
        type="range"
        id="pHeadsSlider"
        min="0"
        max="1"
        step="0.01"
        value={pHeads}
        onChange={handleChange}
        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-sky-600 hover:accent-sky-700"
      />
      <div className="flex justify-between text-xs text-slate-500">
        <span>0.0 (Always Tails)</span>
        <span>0.5 (Fair Coin)</span>
        <span>1.0 (Always Heads)</span>
      </div>
    </div>
  );
};

export default CoinBiasControl;
