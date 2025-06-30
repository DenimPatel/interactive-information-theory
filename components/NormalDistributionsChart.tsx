import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { normalPDF } from '../utils/informationTheory';

interface NormalDistributionsChartProps {
  meanP: number;
  varianceP: number;
  meanQ: number;
  varianceQ: number;
  colorP?: string;
  colorQ?: string;
}

interface ChartDataPoint {
  x: number;
  densityP: number | null; // Can be null if varianceP <= 0
  densityQ: number | null; // Can be null if varianceQ <= 0
}

const NormalDistributionsChart: React.FC<NormalDistributionsChartProps> = ({
  meanP,
  varianceP,
  meanQ,
  varianceQ,
  colorP = '#0ea5e9', // sky-500
  colorQ = '#10b981', // emerald-500
}) => {
  const data: ChartDataPoint[] = React.useMemo(() => {
    const stdP = varianceP > 0 ? Math.sqrt(varianceP) : 0;
    const stdQ = varianceQ > 0 ? Math.sqrt(varianceQ) : 0;

    // Determine a reasonable range for the x-axis
    // Extend 4 standard deviations from each mean, or a minimum range
    const minBoundP = meanP - 4 * stdP;
    const maxBoundP = meanP + 4 * stdP;
    const minBoundQ = meanQ - 4 * stdQ;
    const maxBoundQ = meanQ + 4 * stdQ;
    
    let minX = Math.min(minBoundP, minBoundQ);
    let maxX = Math.max(maxBoundP, maxBoundQ);

    // Ensure a minimum range if variances are very small
    const minRangeWidth = 1;
    if (maxX - minX < minRangeWidth) {
        const midPoint = (minX + maxX) / 2;
        minX = midPoint - minRangeWidth / 2;
        maxX = midPoint + minRangeWidth / 2;
    }
     // If means are far apart but variances tiny, ensure range covers both means adequately
    if (Math.abs(meanP - meanQ) > (maxX - minX)) {
        minX = Math.min(meanP, meanQ) - minRangeWidth/2;
        maxX = Math.max(meanP, meanQ) + minRangeWidth/2;
    }


    const points: ChartDataPoint[] = [];
    const numPoints = 200; // Number of points to plot for smoothness
    const step = (maxX - minX) / numPoints;

    for (let i = 0; i <= numPoints; i++) {
      const xVal = minX + i * step;
      points.push({
        x: xVal,
        densityP: varianceP > 0 ? normalPDF(xVal, meanP, varianceP) : null,
        densityQ: varianceQ > 0 ? normalPDF(xVal, meanQ, varianceQ) : null,
      });
    }
    return points;
  }, [meanP, varianceP, meanQ, varianceQ]);

  const yMax = React.useMemo(() => {
    let maxDensity = 0;
    data.forEach(d => {
      if (d.densityP !== null) maxDensity = Math.max(maxDensity, d.densityP);
      if (d.densityQ !== null) maxDensity = Math.max(maxDensity, d.densityQ);
    });
    return maxDensity > 0 ? maxDensity * 1.1 : 0.5; // Add some padding or default if no data
  }, [data]);


  return (
    <div className="h-72 sm:h-96 w-full mt-6">
      <h4 className="text-md font-semibold text-slate-700 mb-2 text-center">Distributions P and Q</h4>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{
            top: 5,
            right: 30,
            left: 10, 
            bottom: 25,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis
            dataKey="x"
            type="number"
            domain={['dataMin', 'dataMax']}
            tickFormatter={(tick) => tick.toFixed(1)}
            label={{ value: 'Value (x)', position: 'insideBottom', offset: -15, fill: '#475569', fontSize: 12 }}
            stroke="#64748b"
            tick={{ fontSize: 10, fill: '#64748b' }}
          />
          <YAxis
            domain={[0, yMax]}
            label={{ value: 'Density', angle: -90, position: 'insideLeft', offset: -5, fill: '#475569', fontSize: 12 }}
            stroke="#64748b"
            tick={{ fontSize: 10, fill: '#64748b' }}
            tickFormatter={(tick) => tick.toFixed(2)}
          />
          <Tooltip
            formatter={(value: number, name: string) => [`${value.toFixed(4)}`, name === 'densityP' ? 'P(x)' : 'Q(x)' ]}
            labelFormatter={(label: number) => `x: ${label.toFixed(2)}`}
            contentStyle={{ backgroundColor: 'white', border: '1px solid #cbd5e1', borderRadius: '0.375rem' }}
            itemStyle={{ fontSize: 12 }}
            labelStyle={{ color: '#334155', fontWeight: 'bold', fontSize: 12 }}
          />
          <Legend verticalAlign="top" height={30} wrapperStyle={{fontSize: '12px', color: '#475569'}}/>
          
          {varianceP > 0 && (
            <Line 
                type="monotone" 
                dataKey="densityP" 
                stroke={colorP} 
                strokeWidth={2} 
                dot={false} 
                activeDot={{ r: 5, fill: colorP, stroke: 'white', strokeWidth: 1 }} 
                name="P(x)" 
                isAnimationActive={false} // Faster rendering on param change
            />
          )}
          {varianceQ > 0 && (
            <Line 
                type="monotone" 
                dataKey="densityQ" 
                stroke={colorQ} 
                strokeWidth={2} 
                dot={false} 
                activeDot={{ r: 5, fill: colorQ, stroke: 'white', strokeWidth: 1 }} 
                name="Q(x)"
                isAnimationActive={false} // Faster rendering on param change
            />
          )}

          {varianceP > 0 && (
            <ReferenceLine x={meanP} stroke={colorP} strokeDasharray="3 3" strokeWidth={1.5}>
                 <Legend type="none" />
                 {/* Recharts doesn't directly support label on ReferenceLine legend, but this stops it from showing up there. */}
                 {/* A custom label might need to be positioned manually if truly needed in the legend */}
            </ReferenceLine>
          )}
           {varianceQ > 0 && (
            <ReferenceLine x={meanQ} stroke={colorQ} strokeDasharray="3 3" strokeWidth={1.5} />
          )}
        </LineChart>
      </ResponsiveContainer>
        <div className="text-xs text-center text-slate-500 mt-1 space-x-4">
            {varianceP > 0 && <span style={{ color: colorP }}>— Mean P: {meanP.toFixed(2)} (dashed line)</span>}
            {varianceQ > 0 && <span style={{ color: colorQ }}>— Mean Q: {meanQ.toFixed(2)} (dashed line)</span>}
        </div>
    </div>
  );
};

export default NormalDistributionsChart;
