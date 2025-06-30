
import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceDot, ReferenceLine } from 'recharts';
import type { MutualInfoChartDataPoint } from '../types';
import { calculateEntropy } from '../utils/informationTheory';

interface MutualInformationVsPXChartProps {
  pCrossover: number; // Fixed crossover probability for this chart instance
  currentQProbX0: number; // Current P(X=0) from the slider, for the reference dot
  currentMutualInformation: number; // Current I(X;Y) for the reference dot
  channelCapacity: number; // Channel capacity C = 1 - H(pCrossover)
}

const generateChartData = (pCrossover: number): MutualInfoChartDataPoint[] => {
  const data: MutualInfoChartDataPoint[] = [];
  const H_Y_given_X = calculateEntropy(pCrossover); // This is H(p), constant for the chart

  for (let i = 0; i <= 100; i++) {
    const qVal = i / 100; // P(X=0)
    
    const probX1 = 1 - qVal;
    const probY0 = (1 - pCrossover) * qVal + pCrossover * probX1;
    const H_Y = calculateEntropy(probY0);
    
    let mutualInfo = H_Y - H_Y_given_X;
    mutualInfo = mutualInfo < 1e-9 ? 0 : mutualInfo; // Clamp to 0 if very close

    data.push({ qProbX0: qVal, mutualInformation: mutualInfo });
  }
  return data;
};

const MutualInformationVsPXChart: React.FC<MutualInformationVsPXChartProps> = ({
  pCrossover,
  currentQProbX0,
  currentMutualInformation,
  channelCapacity
}) => {
  const chartData = React.useMemo(() => generateChartData(pCrossover), [pCrossover]);

  return (
    <div className="h-72 sm:h-96 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={chartData}
          margin={{
            top: 5,
            right: 30,
            left: 0,
            bottom: 20,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis 
            dataKey="qProbX0" 
            type="number"
            domain={[0, 1]}
            ticks={[0, 0.25, 0.5, 0.75, 1]}
            label={{ value: 'P(X=0)', position: 'insideBottom', offset: -15, fill: '#475569' }}
            stroke="#64748b"
            tick={{ fontSize: 12, fill: '#64748b' }}
          />
          <YAxis 
            label={{ value: 'I(X;Y) (bits)', angle: -90, position: 'insideLeft', offset: 10, fill: '#475569' }}
            stroke="#64748b"
            tick={{ fontSize: 12, fill: '#64748b' }}
            domain={[0, 1]} // Mutual information for binary channel is <= 1
            ticks={[0, 0.25, 0.5, 0.75, 1.0]}
          />
          <Tooltip
            formatter={(value: number, name: string) => {
              const formattedValue = value.toFixed(4);
              if (name === "mutualInformation") return [formattedValue, "I(X;Y)"];
              if (name === "channelCapacity") return [formattedValue, "Capacity C"];
              return [formattedValue, name];
            }}
            labelFormatter={(label: number) => `P(X=0): ${label.toFixed(2)}`}
            contentStyle={{ backgroundColor: 'white', border: '1px solid #cbd5e1', borderRadius: '0.375rem' }}
            itemStyle={{ color: '#0ea5e9' }} // sky-600 for I(X;Y)
            labelStyle={{ color: '#334155', fontWeight: 'bold' }}
          />
          <Legend verticalAlign="top" height={36} iconType="plainline" wrapperStyle={{color: '#475569'}}/>
          
          <Line 
            type="monotone" 
            dataKey="mutualInformation" 
            stroke="#0ea5e9" // sky-600
            strokeWidth={2} 
            dot={false} 
            activeDot={{ r: 6, fill: '#0ea5e9', stroke: 'white', strokeWidth: 2 }} 
            name="Mutual Information I(X;Y)" 
          />

          <ReferenceLine
            y={channelCapacity}
            stroke="#ef4444" // red-500
            strokeDasharray="5 5"
            strokeWidth={1.5}
            name="Channel Capacity (C)" // This name won't show in default legend but good for context
            label={{ 
                value: `C=${channelCapacity.toFixed(3)}`, 
                position: 'insideTopRight', 
                fill: '#ef4444', 
                fontSize: 10,
                dy: -5, // Adjust vertical position
                dx: -5
            }}
          />
          
          {currentQProbX0 >= 0 && currentQProbX0 <=1 && currentMutualInformation >= 0 && (
             <ReferenceDot 
                x={currentQProbX0} 
                y={currentMutualInformation} 
                r={6} 
                fill="#f59e0b" // amber-500 for current point
                stroke="white" 
                strokeWidth={2} 
                isFront={true} 
                ifOverflow="extendDomain"
                label={{value: "Current I(X;Y)", position:"top", fill:"#f59e0b", fontSize: 10}}
              />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default MutualInformationVsPXChart;
