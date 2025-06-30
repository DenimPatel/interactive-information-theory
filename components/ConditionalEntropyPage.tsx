
import React, { useState, useMemo } from 'react';
import Card from './Card';
import ConceptExplainer from './ConceptExplainer';
import DistributionInput from './DistributionInput';
import { calculateEntropy, pLogP } from '../utils/informationTheory';
import EntropyCalculationModal from './EntropyCalculationModal'; // Import the new modal

interface ConditionalEntropyPageProps {
  onNavigateBack: () => void;
}

// Define the type for the metrics object for clarity
export interface ConditionalEntropyMetrics {
  pSunny: number; pRainy: number;
  pSunglassesGivenSunny: number; pNoSunglassesGivenSunny: number;
  pSunglassesGivenRainy: number; pNoSunglassesGivenRainy: number;
  pSunny_Yes: number; pSunny_No: number; pRainy_Yes: number; pRainy_No: number;
  pSunglassesYes: number; pSunglassesNo: number;
  H_X: number; H_Y: number;
  H_Y_given_Sunny: number; H_Y_given_Rainy: number; H_Y_given_X: number;
  H_X_Y: number; I_X_Y: number;
}


const ConditionalEntropyPage: React.FC<ConditionalEntropyPageProps> = ({ onNavigateBack }) => {
  const [pSunny, setPSunny] = useState<number>(0.6); // P(X=Sunny)
  const [pSunglassesGivenSunny, setPSunglassesGivenSunny] = useState<number>(0.9); // P(Y=Yes | X=Sunny)
  const [pSunglassesGivenRainy, setPSunglassesGivenRainy] = useState<number>(0.1); // P(Y=Yes | X=Rainy)

  const [selectedEntropyDetail, setSelectedEntropyDetail] = useState<string | null>(null);

  const metrics: ConditionalEntropyMetrics = useMemo(() => {
    const pRainy = 1 - pSunny; // P(X=Rainy)
    const pNoSunglassesGivenSunny = 1 - pSunglassesGivenSunny; // P(Y=No | X=Sunny)
    const pNoSunglassesGivenRainy = 1 - pSunglassesGivenRainy; // P(Y=No | X=Rainy)

    // Joint probabilities P(X,Y)
    const pSunny_Yes = pSunglassesGivenSunny * pSunny;       // P(X=Sunny, Y=Yes)
    const pSunny_No = pNoSunglassesGivenSunny * pSunny;      // P(X=Sunny, Y=No)
    const pRainy_Yes = pSunglassesGivenRainy * pRainy;       // P(X=Rainy, Y=Yes)
    const pRainy_No = pNoSunglassesGivenRainy * pRainy;      // P(X=Rainy, Y=No)

    // Marginal P(Y)
    const pSunglassesYes = pSunny_Yes + pRainy_Yes;          // P(Y=Yes)
    const pSunglassesNo = pSunny_No + pRainy_No;            // P(Y=No)

    // Individual Entropies H(Y|X=x)
    const H_Y_given_Sunny = calculateEntropy(pSunglassesGivenSunny);
    const H_Y_given_Rainy = calculateEntropy(pSunglassesGivenRainy);

    // Conditional Entropy H(Y|X)
    const H_Y_given_X = pSunny * H_Y_given_Sunny + pRainy * H_Y_given_Rainy;

    // Entropies H(X), H(Y)
    const H_X = calculateEntropy(pSunny);
    const H_Y = calculateEntropy(pSunglassesYes);

    // Joint Entropy H(X,Y)
    // H(X,Y) = - Σx Σy p(x,y)log(p(x,y))
    const H_X_Y = -(
      pLogP(pSunny_Yes) +
      pLogP(pSunny_No) +
      pLogP(pRainy_Yes) +
      pLogP(pRainy_No)
    );

    // Mutual Information I(X;Y) = H(Y) - H(Y|X)
    const I_X_Y = H_Y - H_Y_given_X;


    return {
      pSunny, pRainy,
      pSunglassesGivenSunny, pNoSunglassesGivenSunny,
      pSunglassesGivenRainy, pNoSunglassesGivenRainy,
      pSunny_Yes, pSunny_No, pRainy_Yes, pRainy_No,
      pSunglassesYes, pSunglassesNo,
      H_X, H_Y,
      H_Y_given_Sunny, H_Y_given_Rainy, H_Y_given_X,
      H_X_Y, I_X_Y
    };
  }, [pSunny, pSunglassesGivenSunny, pSunglassesGivenRainy]);

  const conditionalEntropyExplanation = [
    "Conditional entropy quantifies the amount of uncertainty remaining about a random variable Y when the value of another random variable X is known. It's denoted as H(Y|X).",
    "In simpler terms, it answers: 'On average, how much more information do I need to identify Y, if I already know X?'",
    "If knowing X tells us a lot about Y, then H(Y|X) will be low. If X tells us nothing about Y (they are independent), then H(Y|X) = H(Y).",
    <React.Fragment key="cond-entropy-props">
      <h4 className="font-semibold mt-3 mb-1 text-md text-slate-700">Key Properties:</h4>
      <ul className="list-disc list-inside ml-2 space-y-0.5 text-sm sm:text-base">
        <li><code className="bg-slate-200 px-1 rounded">0 ≤ H(Y|X) ≤ H(Y)</code>: Knowing X can only reduce or keep the same uncertainty about Y; it never increases it.</li>
        <li><code className="bg-slate-200 px-1 rounded">H(Y|X) = 0</code> if Y is completely determined by X (e.g., if Y = f(X)).</li>
        <li><code className="bg-slate-200 px-1 rounded">H(Y|X) = H(Y)</code> if and only if Y and X are independent random variables.</li>
      </ul>
    </React.Fragment>,
  ];

  const conditionalEntropyExampleText = [
    "Consider X as 'Weather' (e.g., Sunny, Rainy) and Y as 'Wears Sunglasses' (e.g., Yes, No). Use the interactive explorer below to see how changing the probabilities affects the conditional entropy H(Sunglasses|Weather) and other related values.",
    "For example, if P(Sunglasses=Yes | Sunny) is high (e.g., 0.9) and P(Sunglasses=Yes | Rainy) is low (e.g., 0.1), then knowing the weather significantly reduces uncertainty about whether someone wears sunglasses. This results in a lower H(Sunglasses|Weather).",
    "If P(Sunglasses=Yes | Sunny) is similar to P(Sunglasses=Yes | Rainy) (e.g., both around 0.5), then weather information doesn't help much, and H(Sunglasses|Weather) will be closer to H(Sunglasses)."
  ];

  const chainRuleExplanation = [
    "The chain rule of entropy relates the joint entropy of two (or more) random variables to their individual and conditional entropies.",
    "For two variables X and Y, it states that the uncertainty of the pair (X,Y) occurring together is the uncertainty of X, plus the uncertainty of Y that remains once X is known.",
    "This rule is fundamental for understanding how information accumulates or decomposes across multiple variables and is crucial in many areas, including data compression and Bayesian networks."
  ];
  
  const chainRuleGeneralization = [
    "The chain rule can be generalized to multiple random variables X₁, X₂, ..., Xn:",
    <code key="chain-formula-multi" className="block bg-slate-200 px-2 py-1 rounded my-1 text-sm">H(X₁, X₂, ..., Xn) = H(X₁) + H(X₂|X₁) + H(X₃|X₁,X₂) + ... + H(Xn|X₁, ..., Xn₋₁)</code>,
    "This can be written more compactly as:",
    <code key="chain-formula-sum" className="block bg-slate-200 px-2 py-1 rounded my-1 text-sm">H(X₁, ..., Xn) = Σᵢⁿ H(Xᵢ | Xᵢ₋₁, ..., X₁)</code>,
    "(Where H(X₁|X₀,...) is taken as H(X₁))"
  ];

  const chainRuleExample = [
    "Continuing the 'Weather' (X) and 'Wears Sunglasses' (Y) example from the interactive tool:",
    <code key="chain-example-formula1" className="block bg-slate-200 px-2 py-1 rounded my-1 text-sm">H(Weather, Sunglasses) = H(Weather) + H(Sunglasses | Weather)</code>,
    "This means the total uncertainty about both the weather and whether sunglasses are worn is: the uncertainty about the weather itself, PLUS the remaining uncertainty about sunglasses *after* we find out what the weather is.",
    "Symmetrically, it's also true that:",
    <code key="chain-example-formula2" className="block bg-slate-200 px-2 py-1 rounded my-1 text-sm">H(Weather, Sunglasses) = H(Wears Sunglasses) + H(Weather | Wears Sunglasses)</code>,
    "You can verify these relationships using the values calculated in the interactive explorer."
  ];

  const MetricItem: React.FC<{ 
    label: string; 
    labelKey: string; // Unique key for this metric, e.g., 'H_X'
    value: string | number; 
    unit?: string; 
    highlight?: boolean;
    onShowDetail: (key: string) => void;
   }> = ({ label, labelKey, value, unit, highlight, onShowDetail }) => (
    <div className={`py-1.5 px-2 rounded-md ${highlight ? 'bg-sky-100 border border-sky-200' : ''}`}>
      <div className="flex justify-between items-center">
        <span className={`text-sm font-medium ${highlight ? 'text-sky-700' : 'text-slate-600'}`}>{label}:</span>
        <div className="flex items-center">
          <span className={`text-md font-semibold ${highlight ? 'text-sky-700' : 'text-slate-800'}`}>
            {typeof value === 'number' ? value.toFixed(4) : value}
            {unit && <span className="text-xs text-slate-500 ml-1">{unit}</span>}
          </span>
          <button
            onClick={() => onShowDetail(labelKey)}
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
    </div>
  );

  const handleShowDetail = (metricKey: string) => {
    setSelectedEntropyDetail(metricKey);
  };

  const handleCloseModal = () => {
    setSelectedEntropyDetail(null);
  };


  return (
    <main className="max-w-4xl mx-auto space-y-6 lg:space-y-8">
      <Card>
        <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-200">
          <h2 className="text-3xl font-bold text-sky-700">Conditional Entropy & Chain Rule</h2>
          <button
            onClick={onNavigateBack}
            className="px-4 py-2 bg-sky-600 text-white text-sm font-medium rounded-md hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 transition-colors duration-150"
            aria-label="Back to Main Concepts"
          >
            &larr; Back to Main Concepts
          </button>
        </div>

        <ConceptExplainer
          title="Conditional Entropy: H(Y|X)"
          explanation={conditionalEntropyExplanation}
          formula="H(Y|X) = Σ_{x∈X} p(x) H(Y|X=x) = - Σ_{x∈X} Σ_{y∈Y} p(x,y) log₂(p(y|x))"
        />

        <Card title="Interactive Example: Weather (X) and Sunglasses (Y)" className="mt-6 bg-slate-50">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <DistributionInput
              label="P(Weather)"
              prob={metrics.pSunny}
              onProbChange={setPSunny}
              outcome1Label="P(Sunny)"
              outcome0Label="P(Rainy)"
              color="amber"
            />
            <DistributionInput
              label="P(Sunglasses | Sunny)"
              prob={metrics.pSunglassesGivenSunny}
              onProbChange={setPSunglassesGivenSunny}
              outcome1Label="P(Yes|Sunny)"
              outcome0Label="P(No|Sunny)"
              color="sky"
            />
            <DistributionInput
              label="P(Sunglasses | Rainy)"
              prob={metrics.pSunglassesGivenRainy}
              onProbChange={setPSunglassesGivenRainy}
              outcome1Label="P(Yes|Rainy)"
              outcome0Label="P(No|Rainy)"
              color="emerald"
            />
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h4 className="text-md font-semibold text-slate-700 mb-2">Probability Table P(Weather, Sunglasses):</h4>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm border border-slate-300">
                  <thead className="bg-slate-200">
                    <tr>
                      <th className="p-2 border-b border-slate-300 text-left">X (Weather) \ Y (Sunglasses)</th>
                      <th className="p-2 border-b border-slate-300 text-center">Yes</th>
                      <th className="p-2 border-b border-slate-300 text-center">No</th>
                      <th className="p-2 border-b border-slate-300 text-center font-semibold">P(X)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="p-2 border-r border-slate-300 font-medium text-slate-600">Sunny</td>
                      <td className="p-2 text-center">{metrics.pSunny_Yes.toFixed(3)}</td>
                      <td className="p-2 text-center">{metrics.pSunny_No.toFixed(3)}</td>
                      <td className="p-2 text-center font-semibold bg-slate-100">{metrics.pSunny.toFixed(3)}</td>
                    </tr>
                    <tr>
                      <td className="p-2 border-r border-slate-300 font-medium text-slate-600">Rainy</td>
                      <td className="p-2 text-center">{metrics.pRainy_Yes.toFixed(3)}</td>
                      <td className="p-2 text-center">{metrics.pRainy_No.toFixed(3)}</td>
                      <td className="p-2 text-center font-semibold bg-slate-100">{metrics.pRainy.toFixed(3)}</td>
                    </tr>
                    <tr className="bg-slate-100">
                      <td className="p-2 font-semibold text-slate-600">P(Y)</td>
                      <td className="p-2 text-center font-semibold">{metrics.pSunglassesYes.toFixed(3)}</td>
                      <td className="p-2 text-center font-semibold">{metrics.pSunglassesNo.toFixed(3)}</td>
                      <td className="p-2 text-center font-bold text-slate-700">1.000</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div>
              <h4 className="text-md font-semibold text-slate-700 mb-2">Calculated Entropies (bits):</h4>
              <div className="space-y-1">
                <MetricItem label="H(Weather)" labelKey="H_X" value={metrics.H_X} onShowDetail={handleShowDetail} />
                <MetricItem label="H(Sunglasses)" labelKey="H_Y" value={metrics.H_Y} onShowDetail={handleShowDetail}/>
                <MetricItem label="H(Sunglasses | Sunny)" labelKey="H_Y_given_Sunny" value={metrics.H_Y_given_Sunny} onShowDetail={handleShowDetail}/>
                <MetricItem label="H(Sunglasses | Rainy)" labelKey="H_Y_given_Rainy" value={metrics.H_Y_given_Rainy} onShowDetail={handleShowDetail}/>
                <MetricItem label="H(Sunglasses | Weather)" labelKey="H_Y_given_X" value={metrics.H_Y_given_X} highlight={true} onShowDetail={handleShowDetail}/>
                <MetricItem label="H(Weather, Sunglasses)" labelKey="H_X_Y" value={metrics.H_X_Y} onShowDetail={handleShowDetail}/>
                <MetricItem label="I(Weather ; Sunglasses)" labelKey="I_X_Y" value={metrics.I_X_Y} onShowDetail={handleShowDetail}/>
              </div>
            </div>
          </div>
        </Card>
        
        <ConceptExplainer
          title="Understanding the Example"
          explanation={conditionalEntropyExampleText}
        />

        <ConceptExplainer
          title="Chain Rule of Entropy: H(X,Y)"
          explanation={chainRuleExplanation}
          formula="H(X,Y) = H(X) + H(Y|X)  |  H(X,Y) = H(Y) + H(X|Y)"
        />

        <ConceptExplainer
          title="Generalization of the Chain Rule"
          explanation={chainRuleGeneralization}
        />
        
        <ConceptExplainer
          title="Example of the Chain Rule"
          explanation={chainRuleExample}
        />
      </Card>
      {selectedEntropyDetail && metrics && (
        <EntropyCalculationModal
          entropyType={selectedEntropyDetail}
          metrics={metrics}
          onClose={handleCloseModal}
        />
      )}
    </main>
  );
};

export default ConditionalEntropyPage;
