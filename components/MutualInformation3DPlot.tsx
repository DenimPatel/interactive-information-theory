
import React, { useMemo } from 'react';
import Plot from 'react-plotly.js';
import { calculateEntropy } from '../utils/informationTheory';
import type { Plotly } from 'plotly.js-dist-min'; // Import Plotly type for assertion

// Helper function to calculate I(X;Y) for given q (P(X=0)) and p (crossover probability)
const calculateMutualInformationForPoint = (q_prob_x0: number, p_crossover: number): number => {
  const H_Y_given_X = calculateEntropy(p_crossover); // This is H(p)

  const probX1 = 1 - q_prob_x0;
  // P(Y=0) = P(Y=0|X=0)P(X=0) + P(Y=0|X=1)P(X=1)
  // P(Y=0) = (1-p_crossover)*q_prob_x0 + p_crossover*probX1
  const probY0 = (1 - p_crossover) * q_prob_x0 + p_crossover * probX1;
  const H_Y = calculateEntropy(probY0);
  
  let mutualInfo = H_Y - H_Y_given_X;
  // Clamp to 0 if very close due to potential floating point inaccuracies
  return mutualInfo < 1e-9 ? 0 : mutualInfo;
};

const MutualInformation3DPlot: React.FC = () => {
  const plotData = useMemo(() => {
    const q_values: number[] = []; // P(X=0) values for X-axis of plot
    const p_values: number[] = []; // Crossover probability values for Y-axis of plot
    const z_values: number[][] = []; // Matrix of I(X;Y) values for Z-axis

    const numSteps = 21; // Number of points along each axis (e.g., 0, 0.05, ..., 1.0)

    for (let i = 0; i < numSteps; i++) {
      q_values.push(i / (numSteps - 1));
      p_values.push(i / (numSteps - 1));
    }

    // z_values[i][j] will correspond to p_values[i] and q_values[j]
    // Plotly 'surface' trace: x -> q_values, y -> p_values
    for (let i = 0; i < numSteps; i++) { // Iterating over p_values (Plotly y-axis)
      const currentRow: number[] = [];
      const p_val = p_values[i];
      for (let j = 0; j < numSteps; j++) { // Iterating over q_values (Plotly x-axis)
        const q_val = q_values[j];
        currentRow.push(calculateMutualInformationForPoint(q_val, p_val));
      }
      z_values.push(currentRow);
    }
    
    return {
      x: q_values, // P(X=0)
      y: p_values, // Crossover p
      z: z_values, // I(X;Y)
    };
  }, []);

  return (
    <div className="w-full h-[500px] lg:h-[600px]" aria-label="3D plot of Mutual Information I(X;Y) versus P(X=0) and Crossover Probability p">
      <Plot
        data={[
          {
            x: plotData.x,
            y: plotData.y,
            z: plotData.z,
            type: 'surface',
            colorscale: 'Viridis', 
            colorbar: { 
              title: { text: 'I(X;Y) (bits)', side: 'right' },
              len: 0.75, 
              thickness: 20,
            },
            contours: {
              z: { 
                show: true,
                project: { z: true },
                // usecolormap: true, // Example: if you want them to use the surface colorscale
                // highlightcolor: "#42f462", // Example
                // highlightwidth: 16 // Example
              }
            } as Partial<Plotly.Contours> // Type assertion added here
          },
        ]}
        layout={{
          autosize: true,
          scene: {
            xaxis: { 
              title: { text: 'P(X=0) (Input q)', font: { size: 12 } },
              tickfont: { size: 10 }
            },
            yaxis: { 
              title: { text: 'Crossover Prob (p)', font: { size: 12 } },
              tickfont: { size: 10 }
            },
            zaxis: { 
              title: { text: 'Mutual Info I(X;Y) (bits)', font: { size: 12 } },
              range: [0, 1], 
              tickfont: { size: 10 }
            },
            camera: {
              eye: { x: 1.7, y: -1.7, z: 1.0 } 
            },
            aspectratio: {x:1, y:1, z:0.7}
          },
          margin: { l: 10, r: 10, b: 10, t: 10 }, 
        }}
        useResizeHandler={true}
        style={{ width: '100%', height: '100%' }}
        config={{ responsive: true, displaylogo: false }}
      />
    </div>
  );
};

export default MutualInformation3DPlot;
