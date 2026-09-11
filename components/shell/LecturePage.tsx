import React from 'react';
import { PAGES_BY_SLUG } from '../../content/registry';
import { pageTitleFor } from '../../content/lectures';
import { hrefFor } from '../../routing/routes';
import PrevNext from './PrevNext';

interface LecturePageProps {
  slug: string;
  children: React.ReactNode;
  quiz?: React.ReactNode;
}

/**
 * The page shell: kicker, title, summary, prerequisite pills, body, quiz,
 * prev/next. Content components hold only the interactive body.
 */
const LecturePage: React.FC<LecturePageProps> = ({ slug, children, quiz }) => {
  const meta = PAGES_BY_SLUG[slug];
  if (!meta) throw new Error(`LecturePage: unknown slug "${slug}"`);

  const prereqs = (meta.prereqs ?? []).filter((prereq) => PAGES_BY_SLUG[prereq]);

  return (
    <article className="it-article">
      <div className="card-kicker">
        {meta.kicker} · Lecture {meta.lecture}
      </div>
      <h1>{meta.title}</h1>
      <p className="it-page-summary">{meta.summary}</p>

      {prereqs.length > 0 ? (
        <div className="it-prereqs">
          <span className="text-muted">Prerequisites:</span>
          {prereqs.map((prereq) => (
            <a key={prereq} href={hrefFor(prereq)}>
              {pageTitleFor(prereq)}
            </a>
          ))}
        </div>
      ) : null}

      <hr className="hr" />

      {children}

      {quiz}

      <PrevNext slug={slug} />
    </article>
  );
};

export default LecturePage;
