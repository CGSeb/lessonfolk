/**
 * Theme filter, search and paging of the catalogs (courses and projects). The URL query
 * (`?theme=…&q=…&recommended=1&page=…`) is the source of truth, so filters survive reloads,
 * live refreshes, the back button and shared links.
 */

/** The pages that list a catalog with this search and filter. */
export type CatalogBase = '/courses' | '/projects';

/** Filter key of the courses whose theme is unknown; theme ids are kebab-case so it cannot collide. */
export const OTHER_THEME = '_other';
/** Courses per page: three rows on a wide screen. */
export const PAGE_SIZE = 9;
/** Longest search kept from the URL, so a crafted link cannot make every request slow. */
const MAX_QUERY_LENGTH = 100;

export interface CatalogQuery {
  /** Selected theme id (or `OTHER_THEME`); `undefined` means All. */
  theme: string | undefined;
  /** Search text as typed, trimmed. */
  q: string;
  /** Only the courses of the learner's recommended path. */
  recommended: boolean;
  /** 1-based page number as asked; `paginate` falls back to 1 when it is out of range. */
  page: number;
}

export interface FilterCourse {
  id: string;
  title: string;
  description: string;
  theme: string;
}

export interface ThemeFilter {
  /** Theme id, or `OTHER_THEME`. */
  id: string;
  /** `undefined` for the fallback bucket; the page names it. */
  title: string | undefined;
  count: number;
}

/** Read the query; an unknown theme falls back to All and a bad page to 1. */
export function parseCatalogQuery(params: URLSearchParams, themeIds: Iterable<string>): CatalogQuery {
  const theme = params.get('theme') ?? undefined;
  const page = Number(params.get('page'));
  return {
    theme: theme !== undefined && new Set(themeIds).has(theme) ? theme : undefined,
    q: (params.get('q') ?? '').trim().slice(0, MAX_QUERY_LENGTH),
    recommended: params.get('recommended') === '1',
    page: Number.isInteger(page) && page >= 1 ? page : 1,
  };
}

/** Link to a catalog with these filters; defaults (All, no search, not only recommended, page 1) are left out. */
export function catalogHref(base: CatalogBase, { theme, q, recommended, page }: Partial<CatalogQuery> = {}): string {
  const params = new URLSearchParams();
  if (theme) params.set('theme', theme);
  if (q) params.set('q', q);
  if (recommended) params.set('recommended', '1');
  if (page && page > 1) params.set('page', String(page));
  const query = params.toString();
  return query ? `${base}?${query}` : base;
}

/** Link to the course catalog with these filters. */
export const coursesHref = (query: Partial<CatalogQuery> = {}) => catalogHref('/courses', query);

/** Link to the project catalog with these filters. */
export const projectsHref = (query: Partial<CatalogQuery> = {}) => catalogHref('/projects', query);

/**
 * One filter per theme that has courses, in `themes.yaml` order, then the
 * fallback bucket for courses with no known theme (a content error, reported
 * on the page) so they can still be found.
 *
 * Which themes are listed comes from `courses` (the whole catalog); the counts come from
 * `counted`, the courses left by the search and the recommended filter (not the theme
 * filter), so the badges show how many courses each theme would give. A theme with no
 * match stays listed, at 0.
 */
export function getThemeFilters(
  courses: FilterCourse[],
  themes: { id: string; title: string }[],
  counted: FilterCourse[] = courses,
): ThemeFilter[] {
  const known = new Set(themes.map((t) => t.id));
  const filters: ThemeFilter[] = themes
    .map(({ id, title }) => ({ id, title, count: counted.filter((c) => c.theme === id).length, listed: courses.some((c) => c.theme === id) }))
    .filter((f) => f.listed)
    .map(({ id, title, count }) => ({ id, title, count }));
  if (courses.some((c) => !known.has(c.theme))) {
    filters.push({ id: OTHER_THEME, title: undefined, count: counted.filter((c) => !known.has(c.theme)).length });
  }
  return filters;
}

/** Lower case, without accents, so "resume" finds "Résumé". */
function normalize(text: string): string {
  return text.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
}

/**
 * Courses of the selected theme whose title, description or theme title
 * contain every word of the search. With `recommended`, only the courses whose id is
 * in `recommendedIds`. Keeps the given (`index.yaml`) order.
 */
export function filterCourses<C extends FilterCourse>(
  courses: C[],
  { theme, q, recommended = false }: Pick<CatalogQuery, 'theme' | 'q'> & { recommended?: boolean },
  themes: { id: string; title: string }[],
  recommendedIds: ReadonlySet<string> = new Set(),
): C[] {
  const titles = new Map(themes.map((t) => [t.id, t.title]));
  const words = normalize(q).split(/\s+/).filter(Boolean);
  return courses.filter((course) => {
    const courseTheme = titles.has(course.theme) ? course.theme : OTHER_THEME;
    if (theme && courseTheme !== theme) return false;
    if (recommended && !recommendedIds.has(course.id)) return false;
    if (!words.length) return true;
    const text = normalize([course.title, course.description, titles.get(course.theme) ?? ''].join(' '));
    return words.every((word) => text.includes(word));
  });
}

export interface Page<T> {
  items: T[];
  /** Page shown: the asked page, or 1 when it is out of range. */
  page: number;
  /** At least 1, even with no items. */
  pageCount: number;
  /** 1-based position of the first and last item shown (0 and 0 with no items). */
  from: number;
  to: number;
  total: number;
}

export function paginate<T>(items: T[], page: number, pageSize = PAGE_SIZE): Page<T> {
  const pageCount = Math.max(1, Math.ceil(items.length / pageSize));
  const current = Number.isInteger(page) && page >= 1 && page <= pageCount ? page : 1;
  const start = (current - 1) * pageSize;
  const shown = items.slice(start, start + pageSize);
  return {
    items: shown,
    page: current,
    pageCount,
    from: shown.length ? start + 1 : 0,
    to: start + shown.length,
    total: items.length,
  };
}

/**
 * Page numbers for the pager: the first, the last and the neighbours of the
 * current page, with `null` where pages are left out (shown as "…").
 */
export function pageNumbers(page: number, pageCount: number): (number | null)[] {
  const keep = new Set([1, pageCount, page - 1, page, page + 1]);
  const result: (number | null)[] = [];
  for (let n = 1; n <= pageCount; n++) {
    if (keep.has(n)) result.push(n);
    // A single left-out page is shown as its number: "…" would take the same room.
    else if (keep.has(n - 1) && keep.has(n + 1)) result.push(n);
    else if (result.at(-1) !== null) result.push(null);
  }
  return result;
}

export interface CatalogBadge {
  /** Theme id, `OTHER_THEME`, or `undefined` for All. */
  id: string | undefined;
  count: number;
  href: string;
  current: boolean;
}

export interface CatalogListing<C> {
  query: CatalogQuery;
  /** All, then one badge per theme (see `getThemeFilters`). */
  badges: CatalogBadge[];
  /** Matches of the whole query (theme included), before paging. */
  matches: C[];
  shown: Page<C>;
  /** The pager's numbers with their links (`null` for "…"). */
  pages: ({ page: number; href: string; current: boolean } | null)[];
}

/**
 * Everything a catalog page needs to list `items` with the search, theme filter and paging
 * of its URL: the parsed query, the theme badges (counts follow the search and the
 * recommended filter, not the theme), the matches and the page shown.
 */
export function catalogListing<C extends FilterCourse>(
  base: CatalogBase,
  items: C[],
  themes: { id: string; title: string }[],
  params: URLSearchParams,
  recommendedIds: ReadonlySet<string> = new Set(),
): CatalogListing<C> {
  const allFilters = getThemeFilters(items, themes);
  const query = parseCatalogQuery(
    params,
    allFilters.map((f) => f.id),
  );
  const searched = filterCourses(items, { ...query, theme: undefined }, themes, recommendedIds);
  const badges = [{ id: undefined, count: searched.length }, ...getThemeFilters(items, themes, searched)].map(({ id, count }) => ({
    id,
    count,
    href: catalogHref(base, { theme: id, q: query.q, recommended: query.recommended }),
    current: id === query.theme,
  }));
  const matches = filterCourses(items, query, themes, recommendedIds);
  const shown = paginate(matches, query.page);
  const pages = pageNumbers(shown.page, shown.pageCount).map((page) =>
    page === null ? null : { page, href: catalogHref(base, { ...query, page }), current: page === shown.page },
  );
  return { query, badges, matches, shown, pages };
}
