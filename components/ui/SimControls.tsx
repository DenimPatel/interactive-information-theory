import React from 'react';
import type { AnimationLoop } from '../../hooks/useAnimationLoop';

interface SimControlsProps {
  loop: AnimationLoop;
  /** Shown as the run button label; defaults to "Run". */
  runLabel?: string;
  pauseLabel?: string;
  onReset?: () => void;
  speedRange?: [number, number];
  speedStep?: number;
}

/** Run / pause / step / reset / speed bar over the house `.btn` styles. */
const SimControls: React.FC<SimControlsProps> = ({
  loop,
  runLabel = 'Run',
  pauseLabel = 'Pause',
  onReset,
  speedRange = [1, 60],
  speedStep = 1,
}) => (
  <div className="it-controls" role="group" aria-label="Simulation controls">
    <button
      type="button"
      className="btn btn-primary"
      onClick={loop.toggle}
      aria-pressed={loop.running}
    >
      {loop.running ? pauseLabel : runLabel}
    </button>
    <button type="button" className="btn btn-secondary" onClick={loop.step} disabled={loop.running}>
      Step
    </button>
    <button
      type="button"
      className="btn btn-secondary"
      onClick={() => {
        loop.reset();
        onReset?.();
      }}
    >
      Reset
    </button>
    <label className="it-controls-label" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      Speed
      <input
        type="range"
        min={speedRange[0]}
        max={speedRange[1]}
        step={speedStep}
        value={loop.speed}
        onChange={(event) => loop.setSpeed(Number(event.target.value))}
        style={{ accentColor: 'var(--color-accent)' }}
      />
    </label>
  </div>
);

export default SimControls;
