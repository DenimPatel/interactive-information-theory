import { describe, it, expect } from 'vitest';
import { PAGES, PAGES_BY_SLUG, pagesForLecture, prevNextFor } from './registry';
import { LECTURES, COURSE_SLUG_ORDER, lectureNumberFor, pageTitleFor } from './lectures';

const LECTURE_NUMBERS = new Set(LECTURES.map((lecture) => lecture.number));

describe('registry invariants', () => {
  it('has unique slugs', () => {
    const slugs = PAGES.map((page) => page.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it('gives every page a title in the course map', () => {
    for (const page of PAGES) {
      expect(pageTitleFor(page.slug)).toBe(page.title);
    }
  });

  it('registers only slugs that appear in the course map', () => {
    for (const page of PAGES) {
      expect(COURSE_SLUG_ORDER).toContain(page.slug);
    }
  });

  it('assigns each page its declared lecture number', () => {
    for (const page of PAGES) {
      expect(LECTURE_NUMBERS.has(page.lecture)).toBe(true);
      expect(lectureNumberFor(page.slug)).toBe(page.lecture);
    }
  });

  it('resolves every prerequisite to a registered page', () => {
    for (const page of PAGES) {
      for (const prereq of page.prereqs ?? []) {
        expect(PAGES_BY_SLUG[prereq], `${page.slug} -> ${prereq}`).toBeDefined();
      }
    }
  });

  it('exposes every page through pagesForLecture', () => {
    for (const page of PAGES) {
      expect(pagesForLecture(page.lecture).map((p) => p.slug)).toContain(page.slug);
    }
  });

  it('orders PAGES along the intended course order', () => {
    const indices = PAGES.map((page) => COURSE_SLUG_ORDER.indexOf(page.slug));
    for (let i = 1; i < indices.length; i++) {
      expect(indices[i]).toBeGreaterThan(indices[i - 1]);
    }
  });

  it('has a resolvable load thunk for every page', async () => {
    for (const page of PAGES) {
      const mod = await page.load();
      expect(typeof mod.default, page.slug).toBe('function');
    }
  });

  it('walks prev/next across the implemented course', () => {
    expect(prevNextFor(PAGES[0].slug).prev).toBeUndefined();
    expect(prevNextFor(PAGES[PAGES.length - 1].slug).next).toBeUndefined();
    for (let i = 1; i < PAGES.length; i++) {
      expect(prevNextFor(PAGES[i].slug).prev?.slug).toBe(PAGES[i - 1].slug);
      expect(prevNextFor(PAGES[i - 1].slug).next?.slug).toBe(PAGES[i].slug);
    }
  });
});
