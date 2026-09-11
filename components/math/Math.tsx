import React, { useMemo } from 'react';
import katex from 'katex';

const cache = new Map<string, string>();

const renderKatex = (tex: string, displayMode: boolean): string => {
  const key = `${displayMode ? 'd' : 'i'}:${tex}`;
  const cached = cache.get(key);
  if (cached !== undefined) return cached;
  const html = katex.renderToString(tex, {
    throwOnError: false,
    output: 'html',
    displayMode,
    strict: false,
  });
  cache.set(key, html);
  return html;
};

interface MathProps {
  tex: string;
  /** Human-readable label for assistive tech; falls back to the LaTeX source. */
  label?: string;
  className?: string;
}

/**
 * Inline KaTeX. Rendered once per unique `tex` and cached at module level, so
 * slider-driven pages re-render the surrounding UI without re-typesetting.
 * `output: 'html'` omits MathML, so an `aria-label` is supplied explicitly.
 */
export const Math: React.FC<MathProps> = ({ tex, label, className }) => {
  const html = useMemo(() => renderKatex(tex, false), [tex]);
  return (
    <span className={className} role="math" aria-label={label ?? tex}>
      <span aria-hidden="true" dangerouslySetInnerHTML={{ __html: html }} />
    </span>
  );
};

/** Display-mode KaTeX on its own line. */
export const MathBlock: React.FC<MathProps> = ({ tex, label, className }) => {
  const html = useMemo(() => renderKatex(tex, true), [tex]);
  return (
    <span className={['it-mathblock', className].filter(Boolean).join(' ')} role="math" aria-label={label ?? tex}>
      <span aria-hidden="true" dangerouslySetInnerHTML={{ __html: html }} />
    </span>
  );
};

export default Math;
