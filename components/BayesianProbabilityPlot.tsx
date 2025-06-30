
import React, { useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceDot } from 'recharts';
import type { BayesianPlotDataPoint } from '../types';
import { calculatePosteriorForPlot } from '../utils/bayesianCalculations';

type XAxisVariable = 'prior' | 'sensitivity' | 'specificity';

interface BayesianProbabilityPlotProps {
  currentPriorDisease: number;
  currentSensitivity: number;
  currentSpecificity: number;
}

const PARAM_DETAILS: Record<XAxisVariable, { label: string; min: number; max: number; step: number; sliderCurrentValue: (props: BayesianProbabilityPlotProps) => number }> = {
  prior: { label: "Prior P(Disease)", min: 0.001, max: 0.5, step: 0.001, sliderCurrentValue: props => props.currentPriorDisease },
  sensitivity: { label: "Test Sensitivity P(+|D)", min: 0.5, max: 0.999, step: 0.001, sliderCurrentValue: props => props.currentSensitivity },
  specificity: { label: "Test Specificity P(-|¬D)", min: 0.5, max: 0.999, step: 0.001, sliderCurrentValue: props => props.currentSpecificity },
};

const BayesianProbabilityPlot: React.FC<BayesianProbabilityPlotProps> = (props) => {
  const { currentPriorDisease, currentSensitivity, currentSpecificity } = props;
  const [xAxisVariable, setXAxisVariable] = useState<XAxisVariable>('prior');

  const chartData: BayesianPlotDataPoint[] = useMemo(() => {
    const data: BayesianPlotDataPoint[] = [];
    const detail = PARAM_DETAILS[xAxisVariable];
    const numPoints = 50; // Number of points for the plot line

    for (let i = 0; i <= numPoints; i++) {
      const variedValue = detail.min + ( (detail.max - detail.min) * (i / numPoints) );
      
      let prior = currentPriorDisease;
      let sensitivity = currentSensitivity;
      let specificity = currentSpecificity;

      if (xAxisVariable === 'prior') {
        prior = variedValue;
      } else if (xAxisVariable === 'sensitivity') {
        sensitivity = variedValue;
      } else { // specificity
        specificity = variedValue;
      }
      
      const posterior = calculatePosteriorForPlot(prior, sensitivity, specificity);
      data.push({ variableValue: variedValue, posterior });
    }
    return data;
  }, [xAxisVariable, currentPriorDisease, currentSensitivity, currentSpecificity]);

  const currentPosteriorForReferenceDot = calculatePosteriorForPlot(currentPriorDisease, currentSensitivity, currentSpecificity);
  const currentXValueForReferenceDot = PARAM_DETAILS[xAxisVariable].sliderCurrentValue(props);

  return (
    <div className="mt-6">
      <h4 className="text-md font-semibold text-slate-700 mb-2">Posterior Probability P(Disease | +) vs. Input Parameters</h4>
      
      <div className="mb-4 p-3 bg-white rounded-md shadow border border-slate-200">
        <label className="block text-sm font-medium text-slate-700 mb-1">Vary on X-axis:</label>
        <div className="flex flex-wrap gap-x-4 gap-y-2">
          {(['prior', 'sensitivity', 'specificity'] as XAxisVariable[]).map(param => (
            <div key={param} className="flex items-center">
              <input
                type="radio"
                id={`radio-${param}`}
                name="xAxisVariable"
                value={param}
                checked={xAxisVariable === param}
                onChange={() => setXAxisVariable(param)}
                className="h-4 w-4 text-sky-600 border-slate-300 focus:ring-sky-500 accent-sky-600"
              />
              <label htmlFor={`radio-${param}`} className="ml-2 text-sm text-slate-700">
                {PARAM_DETAILS[param].label}
              </label>
            </div>
          ))}
        </div>
      </div>

      <div className="h-72 sm:h-96 w-full bg-white p-2 rounded-md shadow">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{ top: 5, right: 30, left: 10, bottom: 25 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis
              dataKey="variableValue"
              type="number"
              domain={[PARAM_DETAILS[xAxisVariable].min, PARAM_DETAILS[xAxisVariable].max]}
              tickFormatter={(tick) => tick.toFixed(2)}
              label={{ value: PARAM_DETAILS[xAxisVariable].label, position: 'insideBottom', offset: -15, fill: '#475569', fontSize: 12 }}
              stroke="#64748b"
              tick={{ fontSize: 10, fill: '#64748b' }}
            />
            <YAxis
              dataKey="posterior"
              type="number"
              domain={[0, 1]}
              label={{ value: 'P(Disease | +)', angle: -90, position: 'insideLeft', offset: -5, fill: '#475569', fontSize: 12 }}
              stroke="#64748b"
              tick={{ fontSize: 10, fill: '#64748b' }}
              tickFormatter={(tick) => tick.toFixed(2)}
            />
            <Tooltip
              formatter={(value: number, name: string) => {
                if (name === 'posterior') return [value.toFixed(4), "P(D|+)"];
                return [value.toFixed(4), name];
              }}
              labelFormatter={(label: number) => `${PARAM_DETAILS[xAxisVariable].label}: ${label.toFixed(3)}`}
              contentStyle={{ backgroundColor: 'white', border: '1px solid #cbd5e1', borderRadius: '0.375rem', fontSize: '12px' }}
              labelStyle={{ color: '#334155', fontWeight: 'bold' }}
            />
            <Legend verticalAlign="top" height={30} wrapperStyle={{fontSize: '12px', color: '#475569'}} />
            <Line
              type="monotone"
              dataKey="posterior"
              stroke="#0ea5e9" // sky-500
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 5, fill: '#0ea5e9', stroke: 'white', strokeWidth: 1 }}
              name="P(Disease | Positive Test)"
              isAnimationActive={false}
            />
            <ReferenceDot
              x={currentXValueForReferenceDot}
              y={currentPosteriorForReferenceDot}
              r={6}
              fill="#f59e0b" // amber-500
              stroke="white"
              strokeWidth={2}
              isFront={true}
              ifOverflow="visible" // Ensure dot is visible even if at edge of data range
              label={{value: "Current Setting", position:"top", fill:"#f59e0b", fontSize: 10, dy: -5}}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <p className="text-xs text-slate-500 mt-2 text-center">
        The orange dot indicates P(Disease | +) based on the current slider settings above.
      </p>
    </div>
  );
};

export default BayesianProbabilityPlot;
