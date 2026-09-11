import React from 'react';
import { LECTURES } from '../../content/lectures';
import { PAGES_BY_SLUG, isRegistered } from '../../content/registry';
import { HOME_HREF, hrefFor, type Route } from '../../routing/routes';
import { useProgressStore } from '../../hooks/useProgressStore';

interface SidebarProps {
  route: Route;
}

/**
 * Lecture-grouped contents rail. On narrow viewports it is a `<details>`
 * "Contents" disclosure; at >=900px CSS pins it open as a left rail. Zero JS.
 */
const Sidebar: React.FC<SidebarProps> = ({ route }) => {
  const activeSlug = route.kind === 'page' ? route.slug : undefined;
  const progress = useProgressStore();

  return (
    <aside className="it-rail">
      <details className="it-sidebar" open>
        <summary className="it-sidebar-summary">Contents</summary>
        <nav className="it-sidebar-body" aria-label="Course contents">
          <a
            className="it-sidebar-home"
            href={HOME_HREF}
            aria-current={route.kind === 'home' ? 'page' : undefined}
          >
            Course home
          </a>
          {LECTURES.map((lecture) => (
            <div className="it-sidebar-group" key={lecture.number}>
              <div className="it-sidebar-lecture">
                <span className="it-sidebar-num">L{lecture.number}</span> {lecture.title}
              </div>
              <ul>
                {lecture.pages.map((page) =>
                  isRegistered(page.slug) ? (
                    <li key={page.slug}>
                      <a
                        href={hrefFor(page.slug)}
                        aria-current={activeSlug === page.slug ? 'page' : undefined}
                        onMouseEnter={() => {
                          void PAGES_BY_SLUG[page.slug].load();
                        }}
                      >
                        {page.title}
                        {progress.totals[page.slug] ? (
                          <span className="it-sidebar-progress">
                            {Object.keys(progress.answers[page.slug] ?? {}).length}/
                            {progress.totals[page.slug]}
                          </span>
                        ) : null}
                      </a>
                    </li>
                  ) : (
                    <li key={page.slug}>
                      <span className="it-sidebar-soon" title="Coming soon">
                        {page.title}
                      </span>
                    </li>
                  ),
                )}
              </ul>
            </div>
          ))}
        </nav>
      </details>
    </aside>
  );
};

export default Sidebar;
