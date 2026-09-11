import React from 'react';

interface SeedControlProps {
  seed: number;
  onNewSeed: (seed: number) => void;
}

/** Reproducible-demo control: shows the current seed and rerolls it. */
const SeedControl: React.FC<SeedControlProps> = ({ seed, onNewSeed }) => (
  <div className="it-controls">
    <span className="it-controls-label">Seed</span>
    <code style={{ fontSize: 13 }}>{seed}</code>
    <button
      type="button"
      className="btn btn-secondary"
      onClick={() => onNewSeed(Math.floor(Math.random() * 2 ** 31))}
    >
      New seed
    </button>
  </div>
);

export default SeedControl;
