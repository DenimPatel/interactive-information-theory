import type { ComponentType } from 'react';

/** Shape every page module must expose so `React.lazy` can consume it. */
export interface PageModule {
  default: ComponentType;
}

/**
 * One entry per URL. `slug` is the permanent URL id: once shipped, a slug may
 * only change with a `LEGACY_SLUGS` entry in `routing/routes.ts`.
 */
export interface PageMeta {
  slug: string;
  title: string;
  /** Matches the existing `.card-kicker` convention. */
  kicker: string;
  /** One sentence; used on home cards and the page shell. */
  summary: string;
  /** 1..16 for the main course, 17 for the bonus lecture. */
  lecture: number;
  /** Slugs of prerequisite pages — drives the guided path. */
  prereqs?: string[];
  /**
   * A thunk (not a LazyExoticComponent) so the registry stays cheap and the
   * same thunk feeds both `React.lazy` and prefetch-on-hover.
   */
  load: () => Promise<PageModule>;
  status?: 'draft';
}
