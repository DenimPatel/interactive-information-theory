import React from 'react';
import { Math } from '../math/Math';

interface FormulaProps {
  tex: string;
  /** Small explanatory note shown under the formula. */
  note?: React.ReactNode;
  label?: string;
}

/**
 * The house formula treatment: centred, italic, accent-tinted, with an
 * optional note. Replaces the hand-typed `&minus;log&#8322;` HTML entities.
 */
const Formula: React.FC<FormulaProps> = ({ tex, note, label }) => (
  <div style={{ margin: 'var(--space-4) 0', textAlign: 'center' }}>
    <Math tex={tex} label={label} />
    {note ? (
      <div className="text-muted" style={{ fontSize: 12, marginTop: 4 }}>
        {note}
      </div>
    ) : null}
  </div>
);

export default Formula;
