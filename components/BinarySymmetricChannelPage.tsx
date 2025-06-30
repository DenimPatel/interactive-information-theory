import React, { useState, useMemo } from 'react';
import Card from './Card';
import ConceptExplainer from './ConceptExplainer';
import DistributionInput from './DistributionInput';
import { calculateEntropy } from '../utils/informationTheory';
import type { BSCMetrics } from '../types';
import BSCMetricsDerivationModal from './BSCMetricsDerivationModal';
import MutualInformationVsPXChart from './MutualInformationVsPXChart';
import MutualInformation3DPlot from './MutualInformation3DPlot'; // Import the new 3D plot component

interface BinarySymmetricChannelPageProps {
  onNavigateBack: () => void;
}

const MetricDisplayItem: React.FC<{ 
  label: string; 
  metricKey: string; // Unique key for this metric
  value: string | number; 
  unit?: string; 
  highlight?: boolean; 
  description?: string;
  onShowDetail: (key: string) => void;
}> = ({ label, metricKey, value, unit, highlight, description, onShowDetail }) => (
  <div className={`py-2 px-3 rounded-md ${highlight ? 'bg-sky-100 border border-sky-300' : 'bg-slate-100'}`}>
    <div className="flex justify-between items-center">
      <span className={`text-sm font-medium ${highlight ? 'text-sky-700' : 'text-slate-600'}`}>{label}:</span>
      <div className="flex items-center">
        <span className={`text-lg font-semibold ${highlight ? 'text-sky-600' : 'text-slate-800'}`}>
          {typeof value === 'number' ? value.toFixed(4) : value}
          {unit && <span className="text-xs text-slate-500 ml-1">{unit}</span>}
        </span>
        <button
            onClick={() => onShowDetail(metricKey)}
            className="ml-2 text-sky-500 hover:text-sky-700 p-0.5 rounded focus:outline-none focus:ring-1 focus:ring-sky-400"
            aria-label={`Show calculation detail for ${label}`}
            title={`Show calculation for ${label}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
            </svg>
          </button>
      </div>
    </div>
    {description && <p className="text-xs text-slate-500 mt-0.5">{description}</p>}
  </div>
);


const BinarySymmetricChannelPage: React.FC<BinarySymmetricChannelPageProps> = ({ onNavigateBack }) => {
  const [pCrossover, setPCrossover] = useState<number>(0.1); // p: Crossover probability P(Y!=x | X=x)
  const [qProbX0, setQProbX0] = useState<number>(0.5);     // q: P(X=0)
  const [selectedBSCMetricDetail, setSelectedBSCMetricDetail] = useState<string | null>(null);


  const bscMetrics: BSCMetrics = useMemo(() => {
    const p = pCrossover;
    const q = qProbX0;
    const probX1 = 1 - q;

    // H(X)
    const H_X = calculateEntropy(q);

    // P(Y)
    // P(Y=0) = P(Y=0|X=0)P(X=0) + P(Y=0|X=1)P(X=1)
    //        = (1-p)q           + p(1-q)
    const probY0 = (1 - p) * q + p * probX1;
    const probY1 = 1 - probY0; // or p*q + (1-p)*(1-q)
    
    // H(Y)
    const H_Y = calculateEntropy(probY0);

    // H(Y|X)
    // For a BSC, H(Y|X=0) = H(p) and H(Y|X=1) = H(p)
    // So, H(Y|X) = P(X=0)H(Y|X=0) + P(X=1)H(Y|X=1)
    //             = q*H(p) + (1-q)*H(p) = H(p)
    const H_Y_given_X = calculateEntropy(p);

    // I(X;Y) = H(Y) - H(Y|X)
    // Clamp I_X_Y to be non-negative due to potential floating point inaccuracies
    let I_X_Y_calc = H_Y - H_Y_given_X;
    const I_X_Y = I_X_Y_calc < 1e-9 ? 0 : I_X_Y_calc;


    // Channel Capacity C = 1 - H(p)
    // This is max_q I(X;Y), which occurs when q=0.5.
    // Capacity is 1 - H(p)
    let capacity_calc = 1 - H_Y_given_X; 
    const capacity = capacity_calc < 1e-9 ? 0 : capacity_calc;


    return {
      p_crossover: p,
      q_probX0: q,
      probX0: q,
      probX1,
      H_X,
      probY0,
      probY1,
      H_Y,
      H_Y_given_X,
      I_X_Y,
      capacity,
    };
  }, [pCrossover, qProbX0]);

  const bscDefinition = [
    "A Binary Symmetric Channel (BSC) is a fundamental model of a noisy communication channel. It describes a channel that can transmit binary digits (0 or 1), but with a certain probability that a bit might be flipped due to noise.",
    <strong key="bsc-key-props">Key properties:</strong>,
    <ul key="bsc-props-list" className="list-disc list-inside ml-2 space-y-0.5 text-sm sm:text-base">
      <li><strong>Binary Input/Output:</strong> The channel accepts a binary input X (either 0 or 1) and produces a binary output Y (either 0 or 1).</li>
      <li><strong>Symmetric Noise:</strong> The probability of a bit flip is the same regardless of whether a 0 or a 1 was transmitted. This is called the 'crossover probability', denoted by 'p'.
        <ul key="bsc-crossover-list" className="list-disc list-inside ml-4 space-y-0.5 text-xs sm:text-sm">
            <li>P(Y=1 | X=0) = p  (a 0 flips to a 1)</li>
            <li>P(Y=0 | X=1) = p  (a 1 flips to a 0)</li>
        </ul>
      </li>
      <li>Consequently, the probabilities of correct transmission are:
        <ul key="bsc-correct-list" className="list-disc list-inside ml-4 space-y-0.5 text-xs sm:text-sm">
            <li>P(Y=0 | X=0) = 1 - p</li>
            <li>P(Y=1 | X=1) = 1 - p</li>
        </ul>
      </li>
      <li><strong>Memoryless:</strong> The channel's behavior for each bit transmission is independent of past transmissions.</li>
    </ul>,
    <div key="bsc-diagram" className="mt-3 p-2 bg-slate-100 rounded text-sm font-mono text-center">
        <div>X=0 ---- P(Y=0|X=0)=1-p ----&gt; Y=0</div>
        <div>     |                          </div>
        <div>     `--- P(Y=1|X=0)=p ----&gt; Y=1</div>
        <br/>
        <div>X=1 ---- P(Y=1|X=1)=1-p ----&gt; Y=1</div>
        <div>     |                          </div>
        <div>     `--- P(Y=0|X=1)=p ----&gt; Y=0</div>
    </div>
  ];

  const mutualInfoExplanation = [
    "Mutual Information, denoted I(X;Y), measures the amount of information that one random variable (e.g., channel input X) contains about another random variable (e.g., channel output Y). It quantifies the reduction in uncertainty about Y that results from knowing X.",
    "It can be expressed in several ways:",
    <ul key="mi-formulas-list" className="list-disc list-inside ml-2 space-y-1 text-sm sm:text-base">
      <li><code className="bg-slate-200 px-1 rounded">I(X;Y) = H(Y) - H(Y|X)</code>: The uncertainty of Y minus the uncertainty of Y given X.</li>
      <li><code className="bg-slate-200 px-1 rounded">I(X;Y) = H(X) - H(X|Y)</code>: Symmetrically, the uncertainty of X minus the uncertainty of X given Y.</li>
      <li><code className="bg-slate-200 px-1 rounded">I(X;Y) = H(X) + H(Y) - H(X,Y)</code>: Where H(X,Y) is the joint entropy of X and Y.</li>
    </ul>,
    "If X and Y are independent, I(X;Y) = 0, meaning knowing X provides no information about Y. If X perfectly determines Y, then I(X;Y) = H(Y). Mutual information is always non-negative and is measured in bits."
  ];
  
  const bscCapacityExplanation = [
    "Channel Capacity (C) is the maximum rate at which information can be transmitted reliably over a communication channel. It's the maximum possible mutual information I(X;Y) between the input X and output Y, maximized over all possible input distributions P(X).",
    "For a Binary Symmetric Channel with crossover probability 'p':",
    <code key="bsc-capacity-formula" className="block bg-slate-200 px-2 py-1 rounded my-1 text-sm">C = 1 - H(p)</code>,
    "Where H(p) is the binary entropy function: <code className='bg-slate-100 px-1'>H(p) = -p log₂(p) - (1-p) log₂(1-p)</code>.",
    "This maximum is achieved when the input bits are equally likely, i.e., P(X=0) = P(X=1) = 0.5.",
    "The capacity C ranges from 1 bit (for a perfect channel, p=0 or p=1) down to 0 bits (for a completely random channel, p=0.5, where the output is independent of the input)."
  ];

  const handleShowBSCMetricDetail = (metricKey: string) => {
    setSelectedBSCMetricDetail(metricKey);
  };

  const handleCloseBSCMetricModal = () => {
    setSelectedBSCMetricDetail(null);
  };

  return (
    <main className="max-w-4xl mx-auto space-y-6 lg:space-y-8">
      <Card>
        <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-200">
          <h2 className="text-3xl font-bold text-sky-700">BSC & Mutual Information</h2>
          <button
            onClick={onNavigateBack}
            className="px-4 py-2 bg-sky-600 text-white text-sm font-medium rounded-md hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 transition-colors duration-150"
            aria-label="Back to Main Concepts"
          >
            &larr; Back to Main Concepts
          </button>
        </div>

        <ConceptExplainer
          title="What is a Binary Symmetric Channel (BSC)?"
          explanation={bscDefinition}
          formula="P(Y=y | X=x) = p if y!=x, 1-p if y=x"
        />

        <ConceptExplainer
          title="What is Mutual Information I(X;Y)?"
          explanation={mutualInfoExplanation}
          formula="I(X;Y) = H(Y) - H(Y|X)"
        />

        <Card title="Interactive BSC Explorer" className="mt-6 bg-slate-50">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <DistributionInput
              label="Crossover Probability (p)"
              prob={pCrossover}
              onProbChange={setPCrossover}
              outcome1Label="P(Flip)" // p is P(Flip)
              outcome0Label="P(No Flip)" // 1-p is P(No Flip)
              color="rose"
            />
            <DistributionInput
              label="Input Distribution P(X)"
              prob={qProbX0} // q is P(X=0)
              onProbChange={setQProbX0}
              outcome1Label="P(X=0)"
              outcome0Label="P(X=1)"
              color="amber"
            />
          </div>

          <h4 className="text-lg font-semibold text-slate-700 mb-3">Calculated Metrics:</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <MetricDisplayItem label="P(X=0)" metricKey="PX0" value={bscMetrics.probX0.toFixed(2)} onShowDetail={handleShowBSCMetricDetail} />
            <MetricDisplayItem label="P(X=1)" metricKey="PX1" value={bscMetrics.probX1.toFixed(2)} onShowDetail={handleShowBSCMetricDetail} />
            <MetricDisplayItem label="H(X)" metricKey="H_X_BSC" value={bscMetrics.H_X} unit="bits" description="Entropy of input" onShowDetail={handleShowBSCMetricDetail} />
            
            <MetricDisplayItem label="P(Y=0)" metricKey="PY0" value={bscMetrics.probY0.toFixed(3)} onShowDetail={handleShowBSCMetricDetail}/>
            <MetricDisplayItem label="P(Y=1)" metricKey="PY1" value={bscMetrics.probY1.toFixed(3)} onShowDetail={handleShowBSCMetricDetail}/>
            <MetricDisplayItem label="H(Y)" metricKey="H_Y_BSC" value={bscMetrics.H_Y} unit="bits" description="Entropy of output" onShowDetail={handleShowBSCMetricDetail}/>
            
            <MetricDisplayItem label="H(Y|X)" metricKey="H_Y_given_X_BSC" value={bscMetrics.H_Y_given_X} unit="bits" description="H(p), equivocation" onShowDetail={handleShowBSCMetricDetail}/>
            <MetricDisplayItem 
                label="I(X;Y)" 
                metricKey="I_X_Y_BSC"
                value={bscMetrics.I_X_Y} 
                unit="bits" 
                highlight={true} 
                description="Mutual Information"
                onShowDetail={handleShowBSCMetricDetail}
            />
            <MetricDisplayItem 
                label="Capacity (C)" 
                metricKey="C_BSC"
                value={bscMetrics.capacity} 
                unit="bits" 
                highlight={true} 
                description="1 - H(p), max I(X;Y)"
                onShowDetail={handleShowBSCMetricDetail}
            />
          </div>
           <p className="text-xs text-slate-500 mt-4">
              Note: H(Y|X) = H(p) is the entropy of the noise introduced by the channel.
              Mutual Information I(X;Y) represents how much knowing the input X reduces uncertainty about the output Y.
              Channel Capacity C is fixed for a given channel (depends only on 'p') and is the maximum possible I(X;Y).
            </p>
        </Card>
        
        <Card title="Mutual Information I(X;Y) vs. Input Distribution P(X=0)" className="mt-6 bg-white">
          <p className="text-sm text-slate-600 mb-2">
            This chart shows how Mutual Information <code className="bg-slate-100 text-xs px-1 rounded">I(X;Y)</code> varies as you change the input probability <code className="bg-slate-100 text-xs px-1 rounded">P(X=0)</code>.
            The Crossover Probability <code className="bg-slate-100 text-xs px-1 rounded">p = {pCrossover.toFixed(2)}</code> is held constant for this chart.
            The Channel Capacity <code className="bg-slate-100 text-xs px-1 rounded">C = {bscMetrics.capacity.toFixed(4)}</code> bits (dashed line) is the maximum possible <code className="bg-slate-100 text-xs px-1 rounded">I(X;Y)</code> for this <code className="bg-slate-100 text-xs px-1 rounded">p</code>.
          </p>
          <MutualInformationVsPXChart
            pCrossover={pCrossover}
            currentQProbX0={qProbX0}
            currentMutualInformation={bscMetrics.I_X_Y}
            channelCapacity={bscMetrics.capacity}
          />
        </Card>

        <Card title="3D View: I(X;Y) vs. P(X=0) and Crossover Probability (p)" className="mt-8 bg-white">
          <p className="text-sm text-slate-600 mb-2 leading-relaxed">
            The 3D plot below visualizes the entire landscape of Mutual Information <code className="bg-slate-100 text-xs px-1 rounded">I(X;Y)</code> as both the input distribution <code className="bg-slate-100 text-xs px-1 rounded">P(X=0)</code> (denoted <code className="bg-slate-100 text-xs px-1 rounded">q</code>, on the X-axis) and the channel's crossover probability <code className="bg-slate-100 text-xs px-1 rounded">p</code> (on the Y-axis) vary from 0 to 1. The Z-axis (height and color) represents the calculated <code className="bg-slate-100 text-xs px-1 rounded">I(X;Y)</code> in bits.
          </p>
          <p className="text-sm text-slate-600 mb-4 leading-relaxed">
            Observe how <code className="bg-slate-100 text-xs px-1 rounded">I(X;Y)</code> is maximized (reaching the channel capacity <code className="bg-slate-100 text-xs px-1 rounded">C = 1 - H(p)</code>) when <code className="bg-slate-100 text-xs px-1 rounded">P(X=0) = 0.5</code>. The 2D chart shown above is a "slice" of this 3D surface at the currently selected crossover probability <code className="bg-slate-100 text-xs px-1 rounded">p = {pCrossover.toFixed(2)}</code>.
            The surface is symmetric around <code className="bg-slate-100 text-xs px-1 rounded">p = 0.5</code> because a channel that flips bits with probability <code className="bg-slate-100 text-xs px-1 rounded">p</code> is just as "noisy" (in terms of information capacity) as one that flips bits with probability <code className="bg-slate-100 text-xs px-1 rounded">1-p</code>.
          </p>
          <MutualInformation3DPlot />
        </Card>


        <ConceptExplainer
          title="Channel Capacity of a BSC"
          explanation={bscCapacityExplanation}
        />
      </Card>
      {selectedBSCMetricDetail && bscMetrics && (
        <BSCMetricsDerivationModal
          metricKey={selectedBSCMetricDetail}
          metrics={bscMetrics}
          onClose={handleCloseBSCMetricModal}
        />
      )}
    </main>
  );
};

export default BinarySymmetricChannelPage;