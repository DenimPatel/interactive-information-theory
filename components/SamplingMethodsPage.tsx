
import React, { useState, useCallback, useMemo } from 'react';
import Card from './Card';
import ConceptExplainer from './ConceptExplainer';

interface SamplingMethodsPageProps {
  onNavigateBack: () => void;
}

const SamplingMethodsPage: React.FC<SamplingMethodsPageProps> = ({ onNavigateBack }) => {
  const [probA, setProbA] = useState<number>(0.99); // User-configurable P(A)
  const [interactiveBits, setInteractiveBits] = useState<string>('');
  const [interactiveInterval, setInteractiveInterval] = useState<{ lower: number; upper: number }>({ lower: 0, upper: 1 });
  const [interactiveOutcome, setInteractiveOutcome] = useState<'A' | 'B' | null>(null);
  const [interactiveLog, setInteractiveLog] = useState<string[]>(['Initial interval: [0.000000, 1.000000)']);
  const [isSimulationActive, setIsSimulationActive] = useState<boolean>(true);

  const probB = useMemo(() => 1 - probA, [probA]);

  const resetSimulation = useCallback(() => {
    setInteractiveBits('');
    setInteractiveInterval({ lower: 0, upper: 1 });
    setInteractiveOutcome(null);
    setInteractiveLog([`P(A) set to ${probA.toFixed(3)}. Initial interval: [0.000000, 1.000000)`]);
    setIsSimulationActive(true);
  }, [probA]); // Add probA to dependency array for log message

  // Effect to reset simulation if probA changes
  React.useEffect(() => {
    resetSimulation();
  }, [probA, resetSimulation]);


  const handleDrawBit = useCallback((bit: '0' | '1') => {
    if (!isSimulationActive) return;

    const newBits = interactiveBits + bit;
    setInteractiveBits(newBits);

    let { lower, upper } = interactiveInterval;
    let newLogEntry = `Bit '${bit}' drawn. `;
    const midPoint = lower + (upper - lower) / 2;

    if (bit === '0') {
      upper = midPoint;
      newLogEntry += `New interval: [${lower.toFixed(6)}, ${upper.toFixed(6)}).`;
    } else { // bit === '1'
      lower = midPoint;
      newLogEntry += `New interval: [${lower.toFixed(6)}, ${upper.toFixed(6)}).`;
    }
    
    setInteractiveInterval({ lower, upper });

    let outcome: 'A' | 'B' | null = null;
    // probA defines the upper bound for A and the lower bound for B
    if (upper <= probA) {
      outcome = 'A';
      newLogEntry += ` Interval fully within [0, ${probA.toFixed(3)}). Outcome: A.`;
      setIsSimulationActive(false);
    } else if (lower >= probA) { 
      outcome = 'B';
      newLogEntry += ` Interval fully within [${probA.toFixed(3)}, 1). Outcome: B.`;
      setIsSimulationActive(false);
    } else {
      newLogEntry += ` Outcome still undetermined.`;
    }
    setInteractiveOutcome(outcome);
    setInteractiveLog(prevLog => [...prevLog, newLogEntry]);

  }, [interactiveBits, interactiveInterval, isSimulationActive, probA]);


  const problemStatement = [
    "The challenge is to generate an outcome (either 'A' or 'B') according to highly skewed probabilities, specifically P(A) = 0.99 and P(B) = 0.01, using the minimum possible number of random bits on average.",
    "This problem is fundamental in areas like efficient simulation, cryptography, and aspects of data compression where random variates need to be generated according to specific distributions with minimal resource usage (random bits being a resource)."
  ];

  const comparisonTable = (
    <div className="overflow-x-auto my-4">
      <table className="min-w-full w-full divide-y divide-slate-300 border border-slate-300 shadow-sm rounded-lg">
        <thead className="bg-slate-100">
          <tr>
            <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Method</th>
            <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Expected Bits (Avg.) for P(A)=0.99</th>
            <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Notes</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-slate-200">
          <tr>
            <td scope="row" className="px-4 py-3 whitespace-normal text-sm font-medium text-slate-800">Inversion Sampling (Binary Interval Method)</td>
            <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-700">~0.08 bits</td>
            <td className="px-4 py-3 whitespace-normal text-sm text-slate-700">Optimal in expected sense; approaches entropy.</td>
          </tr>
          <tr>
            <td scope="row" className="px-4 py-3 whitespace-normal text-sm font-medium text-slate-800">Huffman Coding (Adapted)</td>
            <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-700">~1.01 bits</td>
            <td className="px-4 py-3 whitespace-normal text-sm text-slate-700">Not ideal for such skewed probabilities for single-event generation; reflects inefficiencies.</td>
          </tr>
          <tr>
            <td scope="row" className="px-4 py-3 whitespace-normal text-sm font-medium text-slate-800">Fixed-Length Bits</td>
            <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-700">≥7 bits</td>
            <td className="px-4 py-3 whitespace-normal text-sm text-slate-700">Wasteful; may require rejection sampling, increasing average bits.</td>
          </tr>
        </tbody>
      </table>
    </div>
  );

  const inversionSamplingExplanation = [
    "This method is also known as 'parsing a random bit stream' or can be seen as a simplified form of arithmetic coding for a binary outcome. It's highly efficient for skewed distributions.",
    <strong key="is-idea">Core Idea:</strong>,
    "Imagine the interval [0, 1). We want to determine if a uniformly random number U from this interval falls into [0, P(A)) (for outcome A) or [P(A), 1.0) (for outcome B), where P(A) is the probability of outcome A. Instead of generating a full high-precision U, we generate just enough random bits to know which sub-interval U lies in.",
    <strong key="is-process">Process:</strong>,
    <ol key="is-steps" className="list-decimal list-inside space-y-1 mt-1">
      <li>Start with an interval [L, H) = [0, 1).</li>
      <li>Read a random bit 'b'.</li>
      <li>If 'b' is 0, the new interval becomes [L, L + (H-L)/2).</li>
      <li>If 'b' is 1, the new interval becomes [L + (H-L)/2, H).</li>
      <li>If the current interval [L, H) is entirely contained within [0, P(A)), output A and stop.</li>
      <li>If the current interval [L, H) is entirely contained within [P(A), 1.0), output B and stop.</li>
      <li>Otherwise, repeat from step 2.</li>
    </ol>,
    <strong key="is-efficiency">Efficiency:</strong>,
    "For a high P(A) (e.g., 0.99), most of the time, the random number U will be far from the boundary P(A). For example:",
    <ul key="is-example" className="list-disc list-inside ml-4 space-y-0.5 mt-1">
        <li>If P(A) ≥ 0.5 and the first bit drawn is '0', the interval becomes [0, 0.5). This is entirely within [0, P(A)), so we output A using just 1 bit. This happens 50% of the time.</li>
    </ul>,
    "When U is close to P(A), more bits are needed. However, if P(A) is very high or very low (skewed), these cases are rare for one of the outcomes. The expected number of bits used approaches the entropy of the distribution, H(P(A), P(B)). For P(A)=0.99, this is ≈ 0.0808 bits, making it exceptionally efficient.",
  ];

  const huffmanExplanation = [
    "Huffman coding is primarily a lossless data compression algorithm that assigns variable-length codes to symbols based on their frequencies: frequent symbols get shorter codes.",
    <strong key="hc-generation">Application to Generation:</strong>,
    "To adapt this for generating a single sample (A or B):",
     "If we were to build a Huffman tree for two symbols A (freq P(A)) and B (freq P(B)), they would be assigned codes of length 1 (e.g., A='0', B='1'). Consuming one random bit would then select A or B with 0.5 probability each, which isn't what we want unless P(A)=P(B)=0.5.",
    "The table's value of '~1.01 bits' likely refers to an average bit cost in a system that tries to use Huffman-like principles for generation for P(A)=0.99, perhaps involving encoding a choice or reflecting overheads not present in the idealized inversion sampling. For instance, if the generation process always consumes at least one full bit and sometimes more due to tree traversal based on random bits to match probabilities, the average could exceed the entropy.",
    <strong key="hc-inefficiency">Why Not Ideal Here:</strong>,
    "Standard Huffman codes have integer lengths. For highly skewed probabilities like P(B)=0.01 (information content -log₂(0.01) ≈ 6.64 bits), a 1-bit code is too short to capture this rarity efficiently if used naively for generation. In contrast, inversion sampling effectively uses fractional bits by stopping early. The ~1.01 bits indicates a significant inefficiency compared to the ~0.08 bits theoretical minimum (entropy) for P(A)=0.99."
  ];

  const fixedLengthExplanation = [
    "This is a straightforward but often wasteful approach.",
    <strong key="fl-idea">Core Idea:</strong>,
    "Use a fixed number of N random bits to generate an integer 'k' in the range [0, 2ᴺ-1]. Then, map sub-ranges of these integers to outcomes A and B.",
    <strong key="fl-process">Process for P(A)=0.99, P(B)=0.01:</strong>,
    <ol key="fl-steps" className="list-decimal list-inside space-y-1 mt-1">
        <li>To distinguish probabilities with precision up to 0.01 (i.e., 1 part in 100), we need at least 100 distinct states.</li>
        <li>The number of bits N must satisfy 2ᴺ ≥ 100. The smallest N is 7 (since 2⁷ = 128). So, we read 7 bits.</li>
        <li>These 7 bits give a random integer 'k' from 0 to 127.</li>
        <li>To achieve P(B)=0.01:
            <ul key="fl-sub-steps" className="list-disc list-inside ml-4 space-y-0.5 mt-1">
                <li>Map 1% of the 100 desired states to B. For instance, if k falls into a specific range representing 1 out of 100 values (e.g., k=0 if we scale to 0-99).</li>
                <li>Map 99% of states to A (e.g., k=1 to k=99).</li>
            </ul>
        </li>
        <li>If using 128 states from 7 bits: we could assign 1 state to B (e.g., if k=0, output B, P(B) = 1/128 ≈ 0.0078) and 99 states to A (e.g., if k=1...99, output A, P(A) = 99/128 ≈ 0.773). This doesn't quite match. The remaining 28 states (100 to 127) would need to be assigned or lead to rejection.</li>
        <li><strong>Rejection Sampling:</strong> To get exact P(B)=0.01, P(A)=0.99: Generate 'k' from 0-127. If 'k' is 0-99: if k=0, output B; if k=1..99, output A. If 'k' is 100-127 (28 values), reject this sample and regenerate 7 new bits. This ensures the 0-99 range is uniform.</li>
    </ol>,
    <strong key="fl-inefficiency">Wastefulness:</strong>,
    "We always consume 7 bits. If rejection sampling is used, the expected number of bits is 7 / (100/128) = 7 * (128/100) = 8.96 bits. This is significantly more than the ~0.08 bits of inversion sampling. The '≥7 bits' in the table indicates that at least 7 bits are read each time, and potentially more on average if rejection is involved."
  ];

  const conclusion = [
    "For generating a random variable with highly skewed probabilities like P(A)=0.99 and P(B)=0.01, the Inversion Sampling (Binary Interval Method) is vastly more efficient in terms of expected random bits consumed.",
    "It achieves this by dynamically using only the necessary number of bits to resolve the outcome, closely aligning with the fundamental limit set by the entropy of the distribution. Fixed-length methods are simpler to conceive but inherently wasteful for such distributions, while Huffman coding, designed for compression, isn't directly optimal for this specific generation task without significant adaptation (like arithmetic coding, which inversion sampling resembles)."
  ];


  return (
    <main className="max-w-4xl mx-auto space-y-6 lg:space-y-8">
      <Card>
        <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-200">
          <h2 className="text-3xl font-bold text-sky-700">Efficient Random Variable Generation</h2>
          <button
            onClick={onNavigateBack}
            className="px-4 py-2 bg-sky-600 text-white text-sm font-medium rounded-md hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 transition-colors duration-150"
            aria-label="Back to Main Concepts"
          >
            &larr; Back to Main Concepts
          </button>
        </div>

        <ConceptExplainer
          title="The Challenge: Generating Skewed Probabilities Efficiently"
          explanation={problemStatement}
        />
        
        <Card title="Comparison of Methods" className="mt-6 bg-slate-50">
          <p className="text-sm text-slate-600 mb-4">
            The following table compares methods for generating an outcome (A or B) where P(A)=0.99 and P(B)=0.01, in terms of average random bits consumed for that specific case:
          </p>
          {comparisonTable}
        </Card>

        <ConceptExplainer
          title="Method 1: Inversion Sampling (Binary Interval Method)"
          explanation={inversionSamplingExplanation}
          formula="Expected bits ≈ H(P(A), P(B))"
        />
        
        <Card title="Interactive Inversion Sampling Demo" className="mt-6 bg-sky-50/70 border border-sky-200 shadow-lg">
          <p className="text-sm text-slate-700 mb-1">
            Simulate generating an outcome A or B. Set P(A), and P(B) will be <code className="bg-sky-100 text-sky-700 px-1 rounded">{probB.toFixed(3)}</code>.
            Outcome A occurs if the final interval is within <code className="bg-sky-100 text-sky-700 px-1 rounded">[0, {probA.toFixed(3)})</code>,
            Outcome B if within <code className="bg-sky-100 text-sky-700 px-1 rounded">[{probA.toFixed(3)}, 1.0)</code>.
          </p>
          <p className="text-xs text-slate-600 mb-4">
            The theoretical average bits needed is H(P(A), P(B)). This demo shows one trial.
          </p>

          {/* P(A) Control */}
          <div className="mb-6 p-3 bg-white rounded-md shadow border border-slate-200">
            <label htmlFor="probASlider" className="block text-sm font-medium text-slate-700">
              Set Probability of Outcome A, P(A): <span className="font-bold text-sky-600">{probA.toFixed(3)}</span>
            </label>
            <div className="flex items-center space-x-2 mt-1">
                <input
                    type="range"
                    id="probASlider"
                    min="0.001"
                    max="0.999"
                    step="0.001"
                    value={probA}
                    onChange={(e) => setProbA(parseFloat(e.target.value))}
                    className="w-2/3 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-sky-600 hover:accent-sky-700"
                    aria-label="Adjust P(A)"
                />
                <input
                    type="number"
                    id="probANumber"
                    min="0.001"
                    max="0.999"
                    step="0.001"
                    value={probA}
                    onChange={(e) => setProbA(parseFloat(e.target.value))}
                    className="w-1/3 p-1.5 border border-slate-300 rounded-md shadow-sm text-sm focus:ring-sky-500 focus:border-sky-500"
                />
            </div>
            <div className="flex justify-between text-xs text-slate-500 mt-0.5">
                <span>0.001</span>
                <span>0.999</span>
            </div>
            <p className="text-sm text-slate-700 mt-1">
              Probability of Outcome B, P(B): <span className="font-medium text-rose-600">{probB.toFixed(3)}</span>
            </p>
          </div>

          <div className="flex space-x-3 mb-4">
            <button
              onClick={() => handleDrawBit('0')}
              disabled={!isSimulationActive}
              className="px-4 py-2 bg-sky-500 text-white font-semibold rounded-md hover:bg-sky-600 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors duration-150"
              aria-label="Draw bit 0"
            >
              Draw 0
            </button>
            <button
              onClick={() => handleDrawBit('1')}
              disabled={!isSimulationActive}
              className="px-4 py-2 bg-emerald-500 text-white font-semibold rounded-md hover:bg-emerald-600 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors duration-150"
              aria-label="Draw bit 1"
            >
              Draw 1
            </button>
            <button
              onClick={resetSimulation}
              className="px-4 py-2 bg-slate-500 text-white font-semibold rounded-md hover:bg-slate-600 transition-colors duration-150"
              aria-label="Reset simulation"
            >
              Reset
            </button>
          </div>

          {/* Visualization Section */}
          <div className="my-6 space-y-1">
            {/* Bar 1: Target Outcome Regions */}
            <h5 className="text-xs font-medium text-slate-600 text-center">Target Outcome Regions</h5>
            <div className="relative h-6 w-full bg-slate-200 rounded-sm overflow-hidden border border-slate-300" aria-label="Target outcome regions for A and B">
              <div
                className="absolute top-0 left-0 h-full bg-green-300/80 flex items-center justify-center"
                style={{ width: `${probA * 100}%` }}
                title={`Region for Outcome A: [0, ${probA.toFixed(3)})`}
              >
                <span className="text-[10px] font-medium text-green-800 px-0.5">A</span>
              </div>
              <div
                className="absolute top-0 h-full bg-red-300/80 flex items-center justify-center"
                style={{ left: `${probA * 100}%`, width: `${probB * 100}%` }}
                title={`Region for Outcome B: [${probA.toFixed(3)}, 1.0)`}
              >
                <span className="text-[10px] font-medium text-red-800 px-0.5">B</span>
              </div>
            </div>
            <div className="relative h-3 w-full">
              <span className="absolute left-0 text-[10px] text-slate-500">0.0</span>
              {probA > 0.02 && probA < 0.98 && ( 
                <span 
                  className="absolute text-[10px] text-slate-500 text-center"
                  style={{ 
                    left: `${probA * 100}%`,
                    transform: 'translateX(-50%)',
                  }}
                >
                  {probA.toFixed(3)}
                </span>
              )}
              <span className="absolute right-0 text-[10px] text-slate-500">1.0</span>
            </div>

            {/* Bar 2: Current Sampling Interval */}
            <h5 className="text-xs font-medium text-slate-600 text-center mt-4">Current Sampling Interval [L, H)</h5>
            <div className="relative h-6 w-full bg-slate-200 rounded-sm overflow-hidden border border-slate-300" aria-label="Current sampling interval">
              <div
                className="absolute top-0 h-full bg-sky-500 border-y-2 border-sky-700 shadow-md transition-all duration-300 ease-out box-border"
                style={{
                  left: `${interactiveInterval.lower * 100}%`,
                  width: `${Math.max(0.1, (interactiveInterval.upper - interactiveInterval.lower)) * 100}%`, 
                }}
                title={`Current Interval: [${interactiveInterval.lower.toFixed(6)}, ${interactiveInterval.upper.toFixed(6)})`}
              >
                 {(interactiveInterval.upper - interactiveInterval.lower) * 100 > 10 && (
                  <span className="absolute inset-0 flex items-center justify-center text-[10px] font-medium text-white overflow-hidden whitespace-nowrap px-0.5 leading-none">
                    [{interactiveInterval.lower.toFixed(2)}, {interactiveInterval.upper.toFixed(2)})
                  </span>
                )}
              </div>
            </div>
            <div className="relative h-3 w-full">
              <span className="absolute left-0 text-[10px] text-slate-500">0.0</span>
              <span className="absolute right-0 text-[10px] text-slate-500">1.0</span>
            </div>
          </div>


          <div className="space-y-2 text-sm">
            <p>
              <span className="font-semibold text-slate-700">Bits Drawn:</span> 
              <span className="ml-1 font-mono text-sky-700 bg-slate-100 px-2 py-0.5 rounded">{interactiveBits || "(none)"}</span>
              <span className="ml-2 text-slate-600">(Count: {interactiveBits.length})</span>
            </p>
            <p>
              <span className="font-semibold text-slate-700">Current Interval [L, H):</span>
              <span className="ml-1 font-mono text-sky-700 bg-slate-100 px-2 py-0.5 rounded">
                [{interactiveInterval.lower.toFixed(6)}, {interactiveInterval.upper.toFixed(6)})
              </span>
            </p>
            {interactiveOutcome && (
              <p className="text-lg font-bold mt-2">
                <span className="text-slate-700">Determined Outcome: </span> 
                <span className={interactiveOutcome === 'A' ? "text-green-600" : "text-red-600"}>
                  {interactiveOutcome}
                </span>
              </p>
            )}
            {!isSimulationActive && !interactiveOutcome && (
                 <p className="text-md font-semibold text-slate-700 mt-2">Simulation complete. Reset to try new P(A) or run again.</p>
            )}
          </div>

          <div className="mt-4">
            <h4 className="text-md font-semibold text-slate-700 mb-1">Simulation Log:</h4>
            <div className="bg-white p-3 rounded-md shadow-inner max-h-48 overflow-y-auto text-xs text-slate-600 border border-slate-200">
              {interactiveLog.map((entry, index) => (
                <p key={index} className="mb-1 last:mb-0">{entry}</p>
              ))}
            </div>
          </div>
        </Card>


        <ConceptExplainer
          title="Method 2: Huffman Coding Approach"
          explanation={huffmanExplanation}
        />
        
        <ConceptExplainer
          title="Method 3: Fixed-Length Bits"
          explanation={fixedLengthExplanation}
          formula="N = ceil(log₂(1/min_prob_resolution)) bits. E.g. 7 bits for 1/100."
        />
        
        <ConceptExplainer
          title="Conclusion"
          explanation={conclusion}
        />
      </Card>
    </main>
  );
};

export default SamplingMethodsPage;
