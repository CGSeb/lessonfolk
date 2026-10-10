import { describe, expect, it } from 'vitest';
import {
  coursesHref,
  filterCourses,
  getThemeFilters,
  OTHER_THEME,
  pageNumbers,
  paginate,
  parseCatalogQuery,
  type FilterCourse,
} from './catalogFilter';

const course = (id: string, theme: string, title = `Title ${id}`, description = `About ${id}.`): FilterCourse => ({
  id,
  title,
  description,
  theme,
});

const themes = [
  { id: 'understanding', title: 'Understanding AI' },
  { id: 'using', title: 'Using AI tools' },
  { id: 'empty', title: 'Nothing yet' },
];
const foundations = course('foundations', 'understanding', 'AI Foundations', 'What AI is and how it learns.');
const prompting = course('prompting', 'using', 'Prompting Basics', 'Write clear prompts.');
const resume = course('resume', 'using', 'Résumé helper', 'Polish your CV with an assistant.');
const lost = course('lost', 'missing-theme', 'Lost course', 'Its theme is not listed.');
const courses = [foundations, prompting, resume, lost]; // index.yaml order

const ids = (list: FilterCourse[]) => list.map((c) => c.id);

describe('parseCatalogQuery', () => {
  const parse = (query: string) => parseCatalogQuery(new URLSearchParams(query), ['using', OTHER_THEME]);

  it('defaults to All, no search, page 1', () => {
    expect(parse('')).toEqual({ theme: undefined, q: '', recommended: false, page: 1 });
  });

  it('reads a known theme, the trimmed search and the page', () => {
    expect(parse('theme=using&q=%20prompt%20&page=3')).toEqual({ theme: 'using', q: 'prompt', recommended: false, page: 3 });
    expect(parse(`theme=${OTHER_THEME}`).theme).toBe(OTHER_THEME);
  });

  it('falls back to All for an unknown theme', () => {
    expect(parse('theme=nope').theme).toBeUndefined();
  });

  it.each(['0', '-2', '1.5', 'abc', ''])('falls back to page 1 for page=%s', (page) => {
    expect(parse(`page=${page}`).page).toBe(1);
  });

  it('caps very long searches', () => {
    expect(parse(`q=${'a'.repeat(500)}`).q).toHaveLength(100);
  });
});

describe('coursesHref', () => {
  it('leaves defaults out', () => {
    expect(coursesHref()).toBe('/courses');
    expect(coursesHref({ theme: undefined, q: '', page: 1 })).toBe('/courses');
  });

  it('encodes theme, search and page', () => {
    expect(coursesHref({ theme: 'using', q: 'a & b', page: 2 })).toBe('/courses?theme=using&q=a+%26+b&page=2');
  });
});

describe('getThemeFilters', () => {
  it('lists non-empty themes in themes.yaml order with their counts, then the fallback bucket', () => {
    expect(getThemeFilters(courses, themes)).toEqual([
      { id: 'understanding', title: 'Understanding AI', count: 1 },
      { id: 'using', title: 'Using AI tools', count: 2 },
      { id: OTHER_THEME, title: undefined, count: 1 },
    ]);
  });

  it('has no fallback bucket when every course has a known theme', () => {
    expect(getThemeFilters([foundations], themes).map((f) => f.id)).toEqual(['understanding']);
  });

  it('counts only the courses left by the search, keeping every theme listed (at 0 when none match)', () => {
    const matching = filterCourses(courses, { theme: undefined, q: 'resume' }, themes);
    expect(getThemeFilters(courses, themes, matching)).toEqual([
      { id: 'understanding', title: 'Understanding AI', count: 0 },
      { id: 'using', title: 'Using AI tools', count: 1 },
      { id: OTHER_THEME, title: undefined, count: 0 },
    ]);
  });
});

describe('filterCourses', () => {
  const filter = (theme: string | undefined, q = '') => ids(filterCourses(courses, { theme, q }, themes));

  it('keeps every course, in order, for All and no search', () => {
    expect(filter(undefined)).toEqual(['foundations', 'prompting', 'resume', 'lost']);
  });

  it('keeps the selected theme only', () => {
    expect(filter('using')).toEqual(['prompting', 'resume']);
    expect(filter(OTHER_THEME)).toEqual(['lost']);
  });

  it('searches titles, descriptions and theme titles, ignoring case', () => {
    expect(filter(undefined, 'PROMPTS')).toEqual(['prompting']);
    expect(filter(undefined, 'learns')).toEqual(['foundations']);
    expect(filter(undefined, 'using ai tools')).toEqual(['prompting', 'resume']);
  });

  it('ignores accents and needs every word', () => {
    expect(filter(undefined, 'resume')).toEqual(['resume']);
    expect(filter(undefined, 'résumé cv')).toEqual(['resume']);
    expect(filter(undefined, 'resume prompts')).toEqual([]);
  });

  it('combines the theme filter and the search', () => {
    expect(filter('understanding', 'prompt')).toEqual([]);
    expect(filter('using', 'cv')).toEqual(['resume']);
  });
});

describe('paginate', () => {
  const items = Array.from({ length: 7 }, (_, i) => i + 1);

  it('returns the asked page and its range', () => {
    expect(paginate(items, 2, 3)).toEqual({ items: [4, 5, 6], page: 2, pageCount: 3, from: 4, to: 6, total: 7 });
    expect(paginate(items, 3, 3)).toMatchObject({ items: [7], from: 7, to: 7 });
  });

  it('falls back to page 1 when the page is out of range', () => {
    expect(paginate(items, 9, 3)).toMatchObject({ items: [1, 2, 3], page: 1 });
  });

  it('has one empty page with no items', () => {
    expect(paginate([], 1, 3)).toEqual({ items: [], page: 1, pageCount: 1, from: 0, to: 0, total: 0 });
  });
});

describe('pageNumbers', () => {
  it('lists every page when there are few', () => {
    expect(pageNumbers(1, 1)).toEqual([1]);
    expect(pageNumbers(2, 5)).toEqual([1, 2, 3, 4, 5]);
  });

  it('keeps the first, the last and the neighbours of the current page', () => {
    expect(pageNumbers(1, 10)).toEqual([1, 2, null, 10]);
    expect(pageNumbers(6, 10)).toEqual([1, null, 5, 6, 7, null, 10]);
    expect(pageNumbers(10, 10)).toEqual([1, null, 9, 10]);
  });

  it('shows a single left-out page as its number', () => {
    expect(pageNumbers(4, 10)).toEqual([1, 2, 3, 4, 5, null, 10]);
  });
});

describe('recommended filter', () => {
  const courses = [
    { id: 'a', title: 'A', description: '', theme: 't' },
    { id: 'b', title: 'B', description: '', theme: 't' },
  ];
  const themes = [{ id: 't', title: 'T' }];

  it('reads recommended=1 from the URL and writes it back', () => {
    expect(parseCatalogQuery(new URLSearchParams('recommended=1'), []).recommended).toBe(true);
    expect(parseCatalogQuery(new URLSearchParams('recommended=yes'), []).recommended).toBe(false);
    expect(coursesHref({ recommended: true })).toBe('/courses?recommended=1');
    expect(coursesHref({ recommended: false })).toBe('/courses');
  });

  it('keeps only the courses of the path, in catalog order', () => {
    const only = filterCourses(courses, { theme: undefined, q: '', recommended: true }, themes, new Set(['b']));
    expect(only.map((c) => c.id)).toEqual(['b']);
    expect(filterCourses(courses, { theme: undefined, q: '' }, themes, new Set(['b']))).toHaveLength(2);
  });
});
