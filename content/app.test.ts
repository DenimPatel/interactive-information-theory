import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import App from '../App';
import MainPage from '../components/pages/MainPage';
import { PAGES } from './registry';

describe('App smoke render', () => {
  it('server-renders the course home without throwing', () => {
    const html = renderToString(React.createElement(App));
    expect(html).toContain('Information Theory, from the ground up');
    expect(html).toContain('Introduction to Information Theory');
    expect(html).toContain('Hopfield Networks');
    expect(html).toContain('#/p/bent-coin');
    expect(html).toContain('#/p/channel-zoo');
    expect(html).toContain('#/p/counting-trees');
  });

  it('server-renders the reference lecture page, chart kit and KaTeX included', () => {
    const html = renderToString(React.createElement(MainPage));
    expect(html).toContain('Entropy of a bent coin versus P(heads)');
    expect(html).toContain('class="katex"');
    expect(html).not.toContain('katex-error');
    expect(html).toContain('Check your understanding');
  });

  it('server-renders every registered page without throwing or a katex-error', async () => {
    for (const page of PAGES) {
      const module = await page.load();
      const html = renderToString(React.createElement(module.default));
      expect(html.length, page.slug).toBeGreaterThan(0);
      expect(html.includes('katex-error'), `${page.slug} has a KaTeX error`).toBe(false);
    }
  });
});
