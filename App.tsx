
import React, { useState, useMemo } from 'react';
import CoinBiasControl from './components/CoinBiasControl';
import InformationDisplay from './components/InformationDisplay';
import EntropyChart from './components/EntropyChart';
import ConceptExplainer from './components/ConceptExplainer';
import Card from './components/Card';
import RelativeEntropyPage from './components/RelativeEntropyPage';
import HuffmanEncodingPage from './components/HuffmanEncodingPage';
import MontyHallPage from './components/MontyHallPage';
import SamplingMethodsPage from './components/SamplingMethodsPage';
import ConditionalEntropyPage from './components/ConditionalEntropyPage';
import BinarySymmetricChannelPage from './components/BinarySymmetricChannelPage';
import NoisyChannelTheoremPage from './components/NoisyChannelTheoremPage';
import BayesianInferencePage from './components/BayesianInferencePage'; // Import new page
import InformationGems from './components/InformationGems';
import type { InfoMetrics } from './types';
import { calculateInformationContent, calculateEntropy } from './utils/informationTheory';

type PageView = 'main' | 'relativeEntropy' | 'huffman' | 'montyHall' | 'samplingMethods' | 'conditionalEntropy' | 'bscMutualInformation' | 'noisyChannelTheorem' | 'bayesianInference';

const App: React.FC = () => {
  const [pHeads, setPHeads] = useState<number>(0.5);
  const [currentPage, setCurrentPage] = useState<PageView>('main');

  const metrics: InfoMetrics = useMemo(() => {
    const pTails = 1 - pHeads;
    return {
      pHeads,
      pTails,
      iHeads: calculateInformationContent(pHeads),
      iTails: calculateInformationContent(pTails),
      entropy: calculateEntropy(pHeads),
    };
  }, [pHeads]);

  const probabilityExplanation = [
    "Probability measures the likelihood of an event occurring. For our bent coin, we can adjust the probability of getting 'Heads', denoted as P(Heads). The probability of 'Tails', P(Tails), is always 1 minus P(Heads).",
    "A fair coin, which has an equal chance of landing on Heads or Tails, has P(Heads) = 0.5. If P(Heads) = 1, the coin will always land on Heads. If P(Heads) = 0, it will always land on Tails."
  ];

  const infoContentExplanation = [
    "Information content (or self-information) quantifies the 'surprise' associated with an event. An event that is less likely to occur is more surprising and therefore carries more information when it does happen. This is measured in bits.",
    "For example, if a coin is heavily biased to land on Tails (e.g., P(Heads) = 0.01), observing Heads is a very surprising event and thus has high information content. Conversely, if P(Heads) = 0.99, observing Heads is very common and provides little new information."
  ];

  const entropyExplanation = [
    "Entropy, in information theory, is a measure of the average uncertainty or 'randomness' of a random variable. For our coin, it tells us, on average, how much information we gain from a single flip. Like information content, entropy is also measured in bits.",
    "Entropy is maximized when all outcomes are equally likely. For a coin, this occurs when P(Heads) = 0.5 (a fair coin), resulting in 1 bit of entropy. This means a fair coin flip provides the maximum possible average information.",
    "If the coin is completely biased (i.e., P(Heads) = 0 or P(Heads) = 1), there is no uncertainty about the outcome. The coin always lands on one side. In this case, the entropy is 0, meaning a flip provides no new information because the result is already known."
  ];

  const handleNavigate = (page: PageView) => {
    setCurrentPage(page);
    window.scrollTo(0, 0); // Scroll to top on page change
  };

  return (
    <div className="min-h-screen bg-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <header className="text-center mb-10">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-sky-700 cursor-pointer" onClick={() => handleNavigate('main')}>
          Information Theory & The Bent Coin
        </h1>
        <p className="mt-3 text-lg text-slate-600 max-w-2xl mx-auto">
          Explore core concepts like Probability, Information Content, and Entropy interactively.
        </p>
        <nav className="mt-6 space-y-2 sm:space-y-0 sm:space-x-2 flex flex-wrap sm:justify-center items-center">
          <button
            onClick={() => handleNavigate('main')}
            className="text-sky-600 hover:text-sky-800 hover:underline font-medium transition-colors duration-150 px-3 py-1"
            aria-current={currentPage === 'main' ? 'page' : undefined}
          >
            Main Concepts
          </button>
          <button
            onClick={() => handleNavigate('relativeEntropy')}
            className="text-sky-600 hover:text-sky-800 hover:underline font-medium transition-colors duration-150 px-3 py-1"
            aria-current={currentPage === 'relativeEntropy' ? 'page' : undefined}
          >
            Relative Entropy (KL Divergence)
          </button>
           <button
            onClick={() => handleNavigate('conditionalEntropy')}
            className="text-sky-600 hover:text-sky-800 hover:underline font-medium transition-colors duration-150 px-3 py-1"
            aria-current={currentPage === 'conditionalEntropy' ? 'page' : undefined}
          >
            Conditional Entropy & Chain Rule
          </button>
          <button
            onClick={() => handleNavigate('bayesianInference')}
            className="text-sky-600 hover:text-sky-800 hover:underline font-medium transition-colors duration-150 px-3 py-1"
            aria-current={currentPage === 'bayesianInference' ? 'page' : undefined}
          >
            Bayesian Inference
          </button>
          <button
            onClick={() => handleNavigate('bscMutualInformation')}
            className="text-sky-600 hover:text-sky-800 hover:underline font-medium transition-colors duration-150 px-3 py-1"
            aria-current={currentPage === 'bscMutualInformation' ? 'page' : undefined}
          >
            BSC & Mutual Information
          </button>
          <button
            onClick={() => handleNavigate('noisyChannelTheorem')}
            className="text-sky-600 hover:text-sky-800 hover:underline font-medium transition-colors duration-150 px-3 py-1"
            aria-current={currentPage === 'noisyChannelTheorem' ? 'page' : undefined}
          >
            Noisy Channel Theorem
          </button>
          <button
            onClick={() => handleNavigate('huffman')}
            className="text-sky-600 hover:text-sky-800 hover:underline font-medium transition-colors duration-150 px-3 py-1"
            aria-current={currentPage === 'huffman' ? 'page' : undefined}
          >
            Huffman Encoding
          </button>
          <button
            onClick={() => handleNavigate('montyHall')}
            className="text-sky-600 hover:text-sky-800 hover:underline font-medium transition-colors duration-150 px-3 py-1"
            aria-current={currentPage === 'montyHall' ? 'page' : undefined}
          >
            The Monty Hall Problem
          </button>
          <button
            onClick={() => handleNavigate('samplingMethods')}
            className="text-sky-600 hover:text-sky-800 hover:underline font-medium transition-colors duration-150 px-3 py-1"
            aria-current={currentPage === 'samplingMethods' ? 'page' : undefined}
          >
            Efficient Sampling
          </button>
        </nav>
      </header>

      {currentPage === 'main' && (
        <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Left Column / Controls and Metrics */}
          <div className="lg:col-span-1 space-y-6">
            <Card title="Adjust Coin Bias" className="sticky top-6">
              <CoinBiasControl pHeads={pHeads} onPHeadsChange={setPHeads} />
            </Card>
            <InformationDisplay metrics={metrics} />
          </div>

          {/* Right Column / Explanations and Chart */}
          <div className="lg:col-span-2 space-y-6">
            <Card title="Entropy vs. P(Heads)">
              <EntropyChart currentPHeads={pHeads} />
            </Card>
            
            <ConceptExplainer
              id="probability"
              title="What is Probability?"
              explanation={probabilityExplanation}
              formula="P(Tails) = 1 - P(Heads)"
            />
            <ConceptExplainer
              id="info-content"
              title="What is Information Content (Self-Information)?"
              explanation={infoContentExplanation}
              formula="I(event) = -log₂(P(event)) bits"
            />
            <ConceptExplainer
              id="entropy"
              title="What is Entropy?"
              explanation={entropyExplanation}
              formula="H(Coin) = -P(H)log₂(P(H)) - P(T)log₂(P(T)) bits"
            />
            <InformationGems />
          </div>
        </main>
      )}

      {currentPage === 'relativeEntropy' && (
        <RelativeEntropyPage onNavigateBack={() => handleNavigate('main')} />
      )}
      
      {currentPage === 'bayesianInference' && (
        <BayesianInferencePage onNavigateBack={() => handleNavigate('main')} />
      )}

      {currentPage === 'conditionalEntropy' && (
        <ConditionalEntropyPage onNavigateBack={() => handleNavigate('main')} />
      )}

      {currentPage === 'bscMutualInformation' && (
        <BinarySymmetricChannelPage onNavigateBack={() => handleNavigate('main')} />
      )}

      {currentPage === 'noisyChannelTheorem' && (
        <NoisyChannelTheoremPage onNavigateBack={() => handleNavigate('main')} />
      )}

      {currentPage === 'huffman' && (
        <HuffmanEncodingPage onNavigateBack={() => handleNavigate('main')} />
      )}

      {currentPage === 'montyHall' && (
        <MontyHallPage onNavigateBack={() => handleNavigate('main')} />
      )}

      {currentPage === 'samplingMethods' && (
        <SamplingMethodsPage onNavigateBack={() => handleNavigate('main')} />
      )}

      <footer className="text-center mt-12 py-6 border-t border-slate-300">
        <p className="text-sm text-slate-500">
          An interactive explainer for Information Theory concepts.
        </p>
      </footer>
    </div>
  );
};

export default App;
