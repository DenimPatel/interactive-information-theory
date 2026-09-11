import React, { Suspense, useMemo } from 'react';
import { PAGES_BY_SLUG } from '../../content/registry';
import type { Route } from '../../routing/routes';
import CourseHomePage from '../pages/CourseHomePage';

const NotFoundPage: React.FC<{ slug?: string }> = ({ slug }) => (
  <article className="it-article">
    <div className="card-kicker">404</div>
    <h1>Page not found</h1>
    <p className="text-muted">
      {slug ? (
        <>
          No page is registered for <code>{slug}</code>.
        </>
      ) : (
        'That link does not point anywhere.'
      )}
    </p>
    <p>
      <a href="#/">Return to the course home</a>
    </p>
  </article>
);

const PageLoading: React.FC = () => (
  <div className="it-loading" role="status" aria-live="polite">
    Loading…
  </div>
);

/** Resolves a Route to the right page, code-splitting each page lazily. */
const PageRouter: React.FC<{ route: Route }> = ({ route }) => {
  const meta = route.kind === 'page' ? PAGES_BY_SLUG[route.slug] : undefined;
  const LazyPage = useMemo(() => (meta ? React.lazy(meta.load) : null), [meta]);

  if (route.kind === 'home') return <CourseHomePage />;
  if (route.kind === 'notFound' || !meta || !LazyPage) {
    return <NotFoundPage slug={route.kind === 'page' ? route.slug : undefined} />;
  }

  return (
    <Suspense fallback={<PageLoading />}>
      <LazyPage />
    </Suspense>
  );
};

export default PageRouter;
