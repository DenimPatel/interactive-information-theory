import React, { useState } from 'react';
import MainPage from './components/MainPage';
import RelativeEntropyPage from './components/RelativeEntropyPage';
import ConditionalEntropyPage from './components/ConditionalEntropyPage';
import BayesianInferencePage from './components/BayesianInferencePage';
import BinarySymmetricChannelPage from './components/BinarySymmetricChannelPage';
import NoisyChannelTheoremPage from './components/NoisyChannelTheoremPage';
import HuffmanEncodingPage from './components/HuffmanEncodingPage';
import MontyHallPage from './components/MontyHallPage';
import SamplingMethodsPage from './components/SamplingMethodsPage';

type PageView =
  | 'main'
  | 'relativeEntropy'
  | 'conditionalEntropy'
  | 'bayesianInference'
  | 'bscMutualInformation'
  | 'noisyChannelTheorem'
  | 'huffman'
  | 'montyHall'
  | 'samplingMethods';

const NAV_ITEMS: { key: PageView; label: string }[] = [
  { key: 'main', label: 'Bent Coin' },
  { key: 'relativeEntropy', label: 'Relative Entropy' },
  { key: 'conditionalEntropy', label: 'Conditional Entropy' },
  { key: 'bayesianInference', label: 'Bayesian Inference' },
  { key: 'bscMutualInformation', label: 'BSC & Mutual Info' },
  { key: 'noisyChannelTheorem', label: 'Noisy Channel' },
  { key: 'huffman', label: 'Huffman Encoding' },
  { key: 'montyHall', label: 'Monty Hall' },
  { key: 'samplingMethods', label: 'Efficient Sampling' },
];

const PAGES: Record<PageView, React.FC> = {
  main: MainPage,
  relativeEntropy: RelativeEntropyPage,
  conditionalEntropy: ConditionalEntropyPage,
  bayesianInference: BayesianInferencePage,
  bscMutualInformation: BinarySymmetricChannelPage,
  noisyChannelTheorem: NoisyChannelTheoremPage,
  huffman: HuffmanEncodingPage,
  montyHall: MontyHallPage,
  samplingMethods: SamplingMethodsPage,
};

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<PageView>('main');

  const handleNavigate = (page: PageView) => {
    setCurrentPage(page);
    window.scrollTo(0, 0);
  };

  const CurrentPage = PAGES[currentPage];

  return (
    <div style={{ minHeight: '100vh' }}>
      <header
        className="nav it-nav"
        style={{
          position: 'sticky', top: 0, zIndex: 20,
          background: 'var(--color-bg)', borderBottom: '1px solid var(--color-divider)',
          maxWidth: 1000, margin: '0 auto',
        }}
      >
        <span className="nav-brand" onClick={() => handleNavigate('main')} style={{ cursor: 'pointer' }}>
          Information Theory &amp; The Bent Coin
        </span>
        {NAV_ITEMS.map(item => (
          <a
            key={item.key}
            href="#"
            onClick={(e) => { e.preventDefault(); handleNavigate(item.key); }}
            aria-current={currentPage === item.key ? 'page' : undefined}
            style={{ fontWeight: currentPage === item.key ? 600 : 400 }}
          >
            {item.label}
          </a>
        ))}
      </header>

      <main style={{ maxWidth: 900, margin: '0 auto', padding: 'var(--space-8) var(--space-6) calc(var(--space-8) * 2)' }}>
        <CurrentPage />
      </main>

      <footer style={{ maxWidth: 900, margin: '0 auto', padding: '0 var(--space-6) var(--space-8)' }}>
        <p className="text-muted" style={{ fontSize: 13 }}>
          An interactive explainer for Information Theory concepts.
        </p>
      </footer>
    </div>
  );
};

export default App;
