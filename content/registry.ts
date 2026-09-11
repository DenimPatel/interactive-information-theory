import type { PageMeta } from './types';
import { COURSE_SLUG_ORDER } from './lectures';

/**
 * Every implemented page. Unwritten pages live only in `lectures.ts` (as
 * planned refs) so every `load` here resolves and the home page can grey out
 * the rest. When a page lands, add its entry and delete nothing else.
 */
const IMPLEMENTED: PageMeta[] = [
  {
    slug: 'bent-coin',
    title: 'The Bent Coin',
    kicker: 'Foundations',
    summary: 'Probability, information content, and entropy, explored on a single biased coin.',
    lecture: 2,
    prereqs: [],
    load: () => import('../components/pages/MainPage'),
  },
  {
    slug: 'relative-entropy',
    title: 'Relative Entropy',
    kicker: 'Divergence',
    summary: 'How much one distribution differs from another, and why the divergence is never negative.',
    lecture: 6,
    prereqs: ['bent-coin'],
    load: () => import('../components/pages/RelativeEntropyPage'),
  },
  {
    slug: 'conditional-entropy',
    title: 'Conditional Entropy',
    kicker: 'Noisy Channels',
    summary: 'What X still tells you about Y once the other variable is known.',
    lecture: 6,
    prereqs: ['bent-coin'],
    load: () => import('../components/pages/ConditionalEntropyPage'),
  },
  {
    slug: 'bayesian-inference',
    title: 'Bayesian Inference',
    kicker: 'Inference',
    summary: 'Update beliefs with Bayes’ rule and watch a posterior sharpen as evidence arrives.',
    lecture: 9,
    prereqs: [],
    load: () => import('../components/pages/BayesianInferencePage'),
  },
  {
    slug: 'bsc',
    title: 'The Binary Symmetric Channel',
    kicker: 'Noisy Channels',
    summary: 'Mutual information and capacity of the simplest noisy channel.',
    lecture: 7,
    prereqs: ['conditional-entropy'],
    load: () => import('../components/pages/BinarySymmetricChannelPage'),
  },
  {
    slug: 'noisy-channel-theorem',
    title: 'The Noisy Channel Coding Theorem',
    kicker: 'Theorems',
    summary: 'Why reliable communication is possible right up to the channel capacity.',
    lecture: 8,
    prereqs: ['bsc'],
    load: () => import('../components/pages/NoisyChannelTheoremPage'),
  },
  {
    slug: 'huffman',
    title: 'Huffman Encoding',
    kicker: 'Compression',
    summary: 'Build an optimal prefix code from symbol frequencies and watch the tree grow.',
    lecture: 4,
    prereqs: ['bent-coin'],
    load: () => import('../components/pages/HuffmanEncodingPage'),
  },
  {
    slug: 'monty-hall',
    title: 'Monty Hall',
    kicker: 'Inference',
    summary: 'The famous three-door puzzle, resolved by explicit enumeration and simulation.',
    lecture: 9,
    prereqs: ['bayesian-inference'],
    load: () => import('../components/pages/MontyHallPage'),
  },
  {
    slug: 'sampling-methods',
    title: 'Sampling Methods',
    kicker: 'Monte Carlo',
    summary: 'Turn a uniform random source into samples from any distribution.',
    lecture: 12,
    prereqs: ['bent-coin'],
    load: () => import('../components/pages/SamplingMethodsPage'),
  },
  {
    slug: 'channel-zoo',
    title: 'The Channel Zoo',
    kicker: 'Channels',
    summary: 'Four simple channels side by side, with their transition matrices, mutual information and capacity.',
    lecture: 1,
    prereqs: [],
    load: () => import('../components/pages/ChannelZooPage'),
  },
  {
    slug: 'repetition-hamming',
    title: 'Repetition & Hamming Codes',
    kicker: 'Coding',
    summary: 'Repetition and Hamming codes: encode, flip bits, and watch syndrome decoding recover the message.',
    lecture: 1,
    prereqs: [],
    load: () => import('../components/pages/RepetitionHammingPage'),
  },
  {
    slug: 'weighing-problem',
    title: 'The Weighing Problem',
    kicker: 'Information',
    summary: 'The 12-ball balance puzzle as an information problem, where each weighing buys at most log₂3 bits.',
    lecture: 2,
    prereqs: ['bent-coin'],
    load: () => import('../components/pages/WeighingProblemPage'),
  },
  {
    slug: 'typical-sets',
    title: 'Typical Sets & the AEP',
    kicker: 'Asymptotics',
    summary: 'Almost all the probability lives in the typical set, of size about 2 to the N H.',
    lecture: 3,
    prereqs: ['bent-coin'],
    load: () => import('../components/pages/TypicalSetsPage'),
  },
  {
    slug: 'source-coding-theorem',
    title: 'The Source Coding Theorem',
    kicker: 'Compression',
    summary: 'The bent-coin lottery: watch the error probability collapse once the rate exceeds the entropy.',
    lecture: 3,
    prereqs: ['typical-sets'],
    load: () => import('../components/pages/SourceCodingTheoremPage'),
  },
  {
    slug: 'symbol-codes',
    title: 'Symbol Codes & Kraft',
    kicker: 'Compression',
    summary: 'Type your own codewords and check prefix-freedom, the Kraft budget, and expected length against entropy.',
    lecture: 4,
    prereqs: ['bent-coin'],
    load: () => import('../components/pages/SymbolCodesPage'),
  },
  {
    slug: 'arithmetic-coding',
    title: 'Arithmetic Coding',
    kicker: 'Compression',
    summary: 'Watch an interval narrow symbol by symbol, emit the shortest binary fraction, and decode it back.',
    lecture: 5,
    prereqs: ['symbol-codes'],
    load: () => import('../components/pages/ArithmeticCodingPage'),
  },
  {
    slug: 'lempel-ziv',
    title: 'Lempel–Ziv',
    kicker: 'Compression',
    summary: 'Build the LZ78 dictionary phrase by phrase and compare the compressed size with the source entropy.',
    lecture: 5,
    prereqs: ['symbol-codes'],
    load: () => import('../components/pages/LempelZivPage'),
  },
  {
    slug: 'information-venn',
    title: 'The Information Venn',
    kicker: 'Noisy Channels',
    summary: 'Edit a joint table and watch H(X), H(Y), H(X|Y), H(Y|X) and I(X;Y) move as areas.',
    lecture: 6,
    prereqs: ['conditional-entropy'],
    load: () => import('../components/pages/InformationVennPage'),
  },
  {
    slug: 'coding-gem',
    title: 'A Coding Gem',
    kicker: 'Coding',
    summary: 'MacKay’s gem: a little shared side information buys error-free communication.',
    lecture: 9,
    prereqs: ['bsc'],
    load: () => import('../components/pages/CodingGemPage'),
  },
  {
    slug: 'model-comparison',
    title: 'Model Comparison & Occam',
    kicker: 'Inference',
    summary: 'Fit polynomials of rising order and watch the evidence peak at the right complexity — Occam’s razor.',
    lecture: 10,
    prereqs: ['bayesian-inference'],
    load: () => import('../components/pages/ModelComparisonPage'),
  },
  {
    slug: 'clustering',
    title: 'Clustering & EM',
    kicker: 'Distributions',
    summary: 'Place points and compare hard K-means, soft K-means and Gaussian-mixture EM as the likelihood climbs.',
    lecture: 11,
    prereqs: ['bayesian-inference'],
    load: () => import('../components/pages/ClusteringPage'),
  },
  {
    slug: 'advanced-monte-carlo',
    title: 'Advanced Monte Carlo',
    kicker: 'Monte Carlo',
    summary: 'Slice sampling, Hamiltonian Monte Carlo, over-relaxation and coupling from the past on one target.',
    lecture: 13,
    prereqs: ['sampling-methods'],
    load: () => import('../components/pages/AdvancedMonteCarloPage'),
  },
  {
    slug: 'variational-methods',
    title: 'Variational Methods',
    kicker: 'Approximation',
    summary: 'Fit a factorised Q to a correlated Gaussian, tightening the free-energy bound and underestimating variance.',
    lecture: 14,
    prereqs: ['bayesian-inference'],
    load: () => import('../components/pages/VariationalMethodsPage'),
  },
  {
    slug: 'single-neuron',
    title: 'The Single Neuron',
    kicker: 'Neural Networks',
    summary: 'Count separable dichotomies, meet the 2N cliff, and see learning as inference in weight space.',
    lecture: 15,
    prereqs: ['bayesian-inference'],
    load: () => import('../components/pages/SingleNeuronPage'),
  },
  {
    slug: 'hopfield-network',
    title: 'Hopfield Networks',
    kicker: 'Neural Networks',
    summary: 'Store patterns, corrupt one, and watch a Hopfield network fall into the nearest attractor.',
    lecture: 16,
    prereqs: ['single-neuron'],
    load: () => import('../components/pages/HopfieldNetworkPage'),
  },
  {
    slug: 'ldpc-decoding',
    title: 'LDPC & Belief Propagation',
    kicker: 'Neural Networks',
    summary: 'Animate belief propagation on a small LDPC code’s Tanner graph over a noisy channel.',
    lecture: 16,
    prereqs: ['repetition-hamming'],
    load: () => import('../components/pages/LdpcDecodingPage'),
  },
  {
    slug: 'counting-trees',
    title: 'Counting Labelled Trees',
    kicker: 'Bonus',
    summary: 'Cayley’s formula n to the n minus 2 via Prüfer sequences, in both directions.',
    lecture: 17,
    prereqs: [],
    load: () => import('../components/pages/CountingTreesPage'),
  },
];

const ORDER = new Map(COURSE_SLUG_ORDER.map((slug, index) => [slug, index]));

export const PAGES: PageMeta[] = [...IMPLEMENTED].sort(
  (a, b) => (ORDER.get(a.slug) ?? Number.MAX_SAFE_INTEGER) - (ORDER.get(b.slug) ?? Number.MAX_SAFE_INTEGER),
);

export const PAGES_BY_SLUG: Record<string, PageMeta> = Object.fromEntries(
  PAGES.map((page) => [page.slug, page]),
);

export const isRegistered = (slug: string): boolean => slug in PAGES_BY_SLUG;

export const pagesForLecture = (lecture: number): PageMeta[] =>
  PAGES.filter((page) => page.lecture === lecture);

/** Registered neighbours in intended course order, skipping unimplemented pages. */
export const prevNextFor = (slug: string): { prev?: PageMeta; next?: PageMeta } => {
  const index = PAGES.findIndex((page) => page.slug === slug);
  if (index === -1) return {};
  return { prev: PAGES[index - 1], next: PAGES[index + 1] };
};
