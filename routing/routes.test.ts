import { describe, it, expect } from 'vitest';
import { parseRoute, hrefFor, HOME_HREF, LEGACY_SLUGS } from './routes';

describe('parseRoute', () => {
  it('treats the empty hash and #/ as home', () => {
    expect(parseRoute('')).toEqual({ kind: 'home' });
    expect(parseRoute('#')).toEqual({ kind: 'home' });
    expect(parseRoute('#/')).toEqual({ kind: 'home' });
  });

  it('parses page slugs from #/p/<slug>', () => {
    expect(parseRoute('#/p/bent-coin')).toEqual({ kind: 'page', slug: 'bent-coin' });
    expect(parseRoute('#/p/typical-sets/')).toEqual({ kind: 'page', slug: 'typical-sets' });
    expect(parseRoute('#/p/a%20b')).toEqual({ kind: 'page', slug: 'a b' });
  });

  it('redirects every legacy nav key', () => {
    for (const [legacy, slug] of Object.entries(LEGACY_SLUGS)) {
      expect(parseRoute(`#${legacy}`)).toEqual({ kind: 'page', slug });
    }
  });

  it('reports unknown hashes as notFound', () => {
    expect(parseRoute('#nonsense')).toEqual({ kind: 'notFound' });
    expect(parseRoute('#/p/')).toEqual({ kind: 'notFound' });
  });

  it('builds base-relative hrefs', () => {
    expect(hrefFor('bent-coin')).toBe('#/p/bent-coin');
    expect(HOME_HREF.startsWith('#')).toBe(true);
  });
});
