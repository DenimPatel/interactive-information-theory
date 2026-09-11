import { describe, it, expect } from 'vitest';
import katex from 'katex';
import { ALL_FORMULAS, FORMULAS } from './formulas';

describe('site formulas', () => {
  it('publishes at least one formula', () => {
    expect(ALL_FORMULAS.length).toBeGreaterThan(0);
    expect(Object.keys(FORMULAS).length).toBeGreaterThan(0);
  });

  it('renders every formula without a katex-error', () => {
    for (const tex of ALL_FORMULAS) {
      const html = katex.renderToString(tex, { throwOnError: false, output: 'html', strict: false });
      expect(html.includes('katex-error'), `formula failed to parse: ${tex}`).toBe(false);
    }
  });
});
