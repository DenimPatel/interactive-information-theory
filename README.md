# Information Theory & The Bent Coin

**[🚀 Live Demo](https://denimpatel.github.io/interactive-information-theory/)**

An interactive web app for building intuition about core Information Theory
concepts. Using a "bent" (biased) coin as a running example, it lets you
adjust probabilities and immediately see how information content, entropy,
and related quantities respond — turning abstract formulas into something
you can play with.

## Features

The app is organized into several interactive modules, each dedicated to a
key concept:

- **Probability, Information Content & Entropy** — Adjust P(Heads) on a
  biased coin and watch self-information and entropy update live, alongside
  an entropy-vs-probability chart.
- **Relative Entropy (KL Divergence)** — Compare two probability
  distributions and visualize how they diverge.
- **Conditional Entropy & the Chain Rule** — Explore how uncertainty in one
  variable is reduced by knowledge of another.
- **Bayesian Inference** — Visualize how a prior distribution is updated
  into a posterior as new evidence arrives.
- **Binary Symmetric Channel & Mutual Information** — See how channel noise
  affects the information shared between input and output.
- **Noisy Channel Coding Theorem** — Explore channel capacity and the
  limits of reliable communication over a noisy channel.
- **Huffman Encoding** — Build an optimal prefix code for a symbol
  distribution and visualize the resulting encoding tree.
- **The Monty Hall Problem** — A classic probability puzzle demonstrating
  how information changes optimal decisions.
- **Efficient Sampling Methods** — Compare techniques for sampling from a
  distribution.

## Tech Stack

- [React](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vitejs.dev/) for tooling and bundling
- Hand-rolled inline SVG charts, no charting library
- The [Broadsheet](broadsheet.css) design system for styling

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies:
   ```
   npm install
   ```
2. Run the app:
   ```
   npm run dev
   ```
3. Open the printed local URL in your browser.

## Build

```
npm run build
```

This produces a production build in `dist/`, configured for deployment
under the `/interactive-information-theory/` base path (see
`vite.config.ts`), matching how the [live demo](https://denimpatel.github.io/interactive-information-theory/)
is hosted on GitHub Pages.
