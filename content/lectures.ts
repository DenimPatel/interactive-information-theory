/**
 * The 16-lecture ITPRNN course map, plus the bonus lecture. This is the single
 * source of truth for which pages belong to which lecture and in what order,
 * including pages that are not implemented yet. `registry.ts` supplies the
 * implemented `PageMeta` for each slug; the home page greys out the rest.
 */
export interface LecturePageRef {
  slug: string;
  title: string;
}

export interface Lecture {
  number: number;
  title: string;
  blurb: string;
  pages: LecturePageRef[];
}

export const LECTURES: Lecture[] = [
  {
    number: 1,
    title: 'Introduction to Information Theory',
    blurb: 'What information is, where it lives, and why channels can carry it reliably against all odds.',
    pages: [
      { slug: 'channel-zoo', title: 'The Channel Zoo' },
      { slug: 'repetition-hamming', title: 'Repetition & Hamming Codes' },
    ],
  },
  {
    number: 2,
    title: 'Entropy and Data Compression (I)',
    blurb: 'Probability, surprise, and entropy, built from a single bent coin.',
    pages: [
      { slug: 'bent-coin', title: 'The Bent Coin' },
      { slug: 'weighing-problem', title: 'The Weighing Problem' },
    ],
  },
  {
    number: 3,
    title: 'Entropy and Data Compression (II)',
    blurb: 'The asymptotic equipartition property: almost all the probability sits in almost none of the outcomes.',
    pages: [
      { slug: 'typical-sets', title: 'Typical Sets & the AEP' },
      { slug: 'source-coding-theorem', title: 'The Source Coding Theorem' },
    ],
  },
  {
    number: 4,
    title: 'Entropy and Data Compression (III)',
    blurb: 'Symbol codes, prefix-freedom, and the Kraft inequality.',
    pages: [
      { slug: 'symbol-codes', title: 'Symbol Codes & Kraft' },
      { slug: 'huffman', title: 'Huffman Encoding' },
    ],
  },
  {
    number: 5,
    title: 'Entropy and Data Compression (IV)',
    blurb: 'Two codes that approach the entropy limit: arithmetic coding and Lempel–Ziv.',
    pages: [
      { slug: 'arithmetic-coding', title: 'Arithmetic Coding' },
      { slug: 'lempel-ziv', title: 'Lempel–Ziv' },
    ],
  },
  {
    number: 6,
    title: 'Noisy Channel Coding (I)',
    blurb: 'Conditional entropy, mutual information, and what one variable tells you about another.',
    pages: [
      { slug: 'conditional-entropy', title: 'Conditional Entropy' },
      { slug: 'relative-entropy', title: 'Relative Entropy' },
      { slug: 'information-venn', title: 'The Information Venn' },
    ],
  },
  {
    number: 7,
    title: 'Noisy Channel Coding (II)',
    blurb: 'Channel capacity and the input distribution that achieves it.',
    pages: [{ slug: 'bsc', title: 'The Binary Symmetric Channel' }],
  },
  {
    number: 8,
    title: 'Noisy Channel Coding (III)',
    blurb: 'Random coding, typicality, and why error probability vanishes below capacity.',
    pages: [{ slug: 'noisy-channel-theorem', title: 'The Noisy Channel Coding Theorem' }],
  },
  {
    number: 9,
    title: 'A Coding Gem + Bayesian Inference (I)',
    blurb: 'Side information as a free error-correcting code, then Bayes by the book.',
    pages: [
      { slug: 'coding-gem', title: 'A Coding Gem' },
      { slug: 'monty-hall', title: 'Monty Hall' },
      { slug: 'bayesian-inference', title: 'Bayesian Inference' },
    ],
  },
  {
    number: 10,
    title: 'Bayesian Inference (II)',
    blurb: 'Fitting parameters and comparing models: the evidence and Occam’s razor.',
    pages: [{ slug: 'model-comparison', title: 'Model Comparison & Occam' }],
  },
  {
    number: 11,
    title: 'Approximating Distributions (I)',
    blurb: 'Clustering with hard K-means, soft K-means, and the EM algorithm.',
    pages: [{ slug: 'clustering', title: 'Clustering & EM' }],
  },
  {
    number: 12,
    title: 'Monte Carlo Methods (I)',
    blurb: 'Sampling from distributions: inversion, rejection, importance, Metropolis, and Gibbs.',
    pages: [{ slug: 'sampling-methods', title: 'Sampling Methods' }],
  },
  {
    number: 13,
    title: 'Monte Carlo Methods (II)',
    blurb: 'Slice sampling, Hamiltonian Monte Carlo, over-relaxation, and coupling from the past.',
    pages: [{ slug: 'advanced-monte-carlo', title: 'Advanced Monte Carlo' }],
  },
  {
    number: 14,
    title: 'Variational Methods',
    blurb: 'Mean-field inference, the free-energy bound, and the perils of factorised approximations.',
    pages: [{ slug: 'variational-methods', title: 'Variational Methods' }],
  },
  {
    number: 15,
    title: 'Neural Networks (I)',
    blurb: 'The capacity of a single neuron, and learning as Bayesian inference.',
    pages: [{ slug: 'single-neuron', title: 'The Single Neuron' }],
  },
  {
    number: 16,
    title: 'Neural Networks (II)',
    blurb: 'Associative memories in Hopfield networks, and LDPC codes decoded by belief propagation.',
    pages: [
      { slug: 'hopfield-network', title: 'Hopfield Networks' },
      { slug: 'ldpc-decoding', title: 'LDPC & Belief Propagation' },
    ],
  },
  {
    number: 17,
    title: 'Bonus: Counting Labelled Trees',
    blurb: 'Cayley’s formula via Prüfer sequences — a coding argument in disguise.',
    pages: [{ slug: 'counting-trees', title: 'Counting Labelled Trees' }],
  },
];

const TITLE_BY_SLUG: Record<string, string> = Object.fromEntries(
  LECTURES.flatMap((lecture) => lecture.pages.map((page) => [page.slug, page.title])),
);

const LECTURE_BY_SLUG: Record<string, number> = Object.fromEntries(
  LECTURES.flatMap((lecture) => lecture.pages.map((page) => [page.slug, lecture.number])),
);

/** Intended title for any slug, implemented or planned. */
export const pageTitleFor = (slug: string): string => TITLE_BY_SLUG[slug] ?? slug;

/** Intended lecture number for any slug, implemented or planned. */
export const lectureNumberFor = (slug: string): number => LECTURE_BY_SLUG[slug] ?? 1;

/** The slug order for the whole course, implemented or not. */
export const COURSE_SLUG_ORDER: string[] = LECTURES.flatMap((lecture) =>
  lecture.pages.map((page) => page.slug),
);

export const lectureFor = (number: number): Lecture | undefined =>
  LECTURES.find((lecture) => lecture.number === number);
