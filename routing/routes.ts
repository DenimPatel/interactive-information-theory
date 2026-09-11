export type Route =
  | { kind: 'home' }
  | { kind: 'page'; slug: string }
  | { kind: 'notFound' };

/**
 * Maps the pre-router nav keys (`#main`, `#relativeEntropy`, ...) onto the
 * permanent slugs. Old bookmarks keep working; new links never use these.
 */
export const LEGACY_SLUGS: Record<string, string> = {
  main: 'bent-coin',
  relativeEntropy: 'relative-entropy',
  conditionalEntropy: 'conditional-entropy',
  bayesianInference: 'bayesian-inference',
  bscMutualInformation: 'bsc',
  noisyChannelTheorem: 'noisy-channel-theorem',
  huffman: 'huffman',
  montyHall: 'monty-hall',
  samplingMethods: 'sampling-methods',
};

/** The canonical hash for a page slug, base-relative by construction. */
export const hrefFor = (slug: string): string => `#/p/${slug}`;

/** The canonical hash for the course home. */
export const HOME_HREF = '#/';

export const parseRoute = (hash: string): Route => {
  const raw = hash.startsWith('#') ? hash.slice(1) : hash;
  if (raw === '' || raw === '/') return { kind: 'home' };

  if (raw.startsWith('/p/')) {
    const slug = decodeURIComponent(raw.slice(3).replace(/\/+$/, ''));
    return slug ? { kind: 'page', slug } : { kind: 'notFound' };
  }

  const legacyKey = raw.replace(/^\/+/, '').split(/[/?]/)[0];
  const slug = LEGACY_SLUGS[legacyKey];
  return slug ? { kind: 'page', slug } : { kind: 'notFound' };
};
