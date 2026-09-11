import React from 'react';
import { LECTURES } from '../../content/lectures';
import { PAGES_BY_SLUG, isRegistered } from '../../content/registry';
import { hrefFor } from '../../routing/routes';
import { useProgressStore } from '../../hooks/useProgressStore';

const ProgressTag: React.FC<{ slug: string }> = ({ slug }) => {
  const store = useProgressStore();
  const total = store.totals[slug] ?? 0;
  if (total === 0) return null;
  const answered = Object.keys(store.answers[slug] ?? {}).length;
  return (
    <span className={`tag ${answered === total ? 'tag-accent' : 'tag-neutral'} it-progress-tag`}>
      {answered}/{total}
    </span>
  );
};

/** The `#/` route: 16 lecture cards, each listing its pages and status. */
const CourseHomePage: React.FC = () => (
  <article className="it-article">
    <div className="card-kicker">Course</div>
    <h1>Information Theory, from the ground up</h1>
    <p className="it-lede">
      An interactive companion to David MacKay’s <em>Information Theory, Pattern Recognition
      and Neural Networks</em>. Every lecture is something you manipulate: drag the sliders,
      run the simulations, and check yourself as you go.
    </p>

    <div className="it-lecture-grid">
      {LECTURES.map((lecture) => (
        <section className="card elev-sm it-lecture-card" key={lecture.number}>
          <div className="card-kicker">Lecture {lecture.number}</div>
          <div className="card-title">{lecture.title}</div>
          <p className="card-body">{lecture.blurb}</p>
          <ul className="it-lecture-pages">
            {lecture.pages.map((page) =>
              isRegistered(page.slug) ? (
                <li key={page.slug} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                  <a
                    href={hrefFor(page.slug)}
                    onMouseEnter={() => {
                      void PAGES_BY_SLUG[page.slug].load();
                    }}
                  >
                    {page.title}
                  </a>
                  <ProgressTag slug={page.slug} />
                </li>
              ) : (
                <li key={page.slug} className="it-lecture-soon">
                  <span>{page.title}</span>
                  <span className="tag tag-neutral">coming soon</span>
                </li>
              ),
            )}
          </ul>
        </section>
      ))}
    </div>

    <hr className="hr" />

    <section>
      <h2>About this companion</h2>
      <p style={{ maxWidth: 640 }}>
        This site follows the 16-lecture structure of David MacKay’s course
        <em> Information Theory, Pattern Recognition and Neural Networks</em> (University of
        Cambridge). The mathematics is MacKay’s; the interactive demonstrations, quizzes and
        guided path are this site’s own. For the original lectures, slides and textbook, see
        MacKay’s course materials.
      </p>
    </section>
  </article>
);

export default CourseHomePage;
