
import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceDot } from 'recharts';
import type { ChartDataPoint } from '../types';
import { calculateEntropy } from '../utils/informationTheory';

interface EntropyChartProps {
  currentPHeads: number;
}

const generateChartData = (): ChartDataPoint[] => {
  const data: ChartDataPoint[] = [];
  for (let i = 0; i <= 100; i++) {
    const p = i / 100;
    data.push({ pHeads: p, entropy: calculateEntropy(p) });
  }
  return data;
};

const chartData = generateChartData();

const EntropyChart: React.FC<EntropyChartProps> = ({ currentPHeads }) => {
  const currentEntropy = calculateEntropy(currentPHeads);

  return (
    <div className="h-72 sm:h-96 w-full"> {/* Ensure container has height */}
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={chartData}
          margin={{
            top: 5,
            right: 30,
            left: 0, // Adjusted for YAxis label space
            bottom: 20, // Adjusted for XAxis label space
          }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis 
            dataKey="pHeads" 
            type="number"
            domain={[0, 1]}
            ticks={[0, 0.25, 0.5, 0.75, 1]}
            label={{ value: 'P(Heads)', position: 'insideBottom', offset: -15, fill: '#475569' }}
            stroke="#64748b"
            tick={{ fontSize: 12, fill: '#64748b' }}
          />
          <YAxis 
            label={{ value: 'Entropy (bits)', angle: -90, position: 'insideLeft', offset:10, fill: '#475569' }}
            stroke="#64748b"
            tick={{ fontSize: 12, fill: '#64748b' }}
            domain={[0, 1]}
            ticks={[0, 0.25, 0.5, 0.75, 1.0]}
          />
          <Tooltip
            formatter={(value: number) => value.toFixed(3)}
            labelFormatter={(label: number) => `P(Heads): ${label.toFixed(2)}`}
            contentStyle={{ backgroundColor: 'white', border: '1px solid #cbd5e1', borderRadius: '0.375rem' }}
            itemStyle={{ color: '#0ea5e9' }}
            labelStyle={{ color: '#334155', fontWeight: 'bold' }}
          />
          <Legend verticalAlign="top" height={36} iconType="plainline" wrapperStyle={{color: '#475569'}}/>
          <Line type="monotone" dataKey="entropy" stroke="#0ea5e9" strokeWidth={2} dot={false} activeDot={{ r: 6, fill: '#0ea5e9', stroke: 'white', strokeWidth: 2 }} name="Entropy" />
          {currentPHeads >= 0 && currentPHeads <=1 && (
             <ReferenceDot 
                x={currentPHeads} 
                y={currentEntropy} 
                r={6} 
                fill="#ef4444" 
                stroke="white" 
                strokeWidth={2} 
                isFront={true} 
                ifOverflow="extendDomain"
              />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default EntropyChart;
