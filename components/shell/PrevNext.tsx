import React from 'react';
import { prevNextFor } from '../../content/registry';
import { hrefFor } from '../../routing/routes';

interface PrevNextProps {
  slug: string;
}

/** Walks the implemented course in intended lecture order. */
const PrevNext: React.FC<PrevNextProps> = ({ slug }) => {
  const { prev, next } = prevNextFor(slug);
  if (!prev && !next) return null;

  return (
    <nav className="it-prevnext" aria-label="Course navigation">
      {prev ? (
        <a className="it-prevnext-link" href={hrefFor(prev.slug)}>
          <span className="it-prevnext-dir">← Previous</span>
          <span className="it-prevnext-title">{prev.title}</span>
        </a>
      ) : (
        <span />
      )}
      {next ? (
        <a className="it-prevnext-link it-prevnext-next" href={hrefFor(next.slug)}>
          <span className="it-prevnext-dir">Next →</span>
          <span className="it-prevnext-title">{next.title}</span>
        </a>
      ) : (
        <span />
      )}
    </nav>
  );
};

export default PrevNext;
