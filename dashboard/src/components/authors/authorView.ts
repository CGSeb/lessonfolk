import { getStats, type CourseRef, type CourseStats, type Progress } from '../../lib/progress';

/** An author with their courses, as returned by the catalog loader (`Catalog.authors`). */
export interface AuthorRef<C extends CourseRef> {
  slug: string;
  name: string;
  bio?: string;
  github?: string;
  url?: string;
  /** Avatar image file name in `courses/authors/`. */
  avatar?: string;
  /** Courses in `index.yaml` order. */
  courses: C[];
}

/** A course's author, as shown in a byline. */
export interface AuthorLink {
  slug: string;
  name: string;
  /** Author page, e.g. `/authors/lessonfolk`. */
  href: string;
  /** Avatar image URL; `undefined` shows the initials instead. */
  avatar?: string;
}

export interface ExternalLink {
  kind: 'github' | 'website';
  href: string;
  /** Text shown for the link (GitHub username or website host). */
  label: string;
}

export interface AuthorListItem {
  author: AuthorLink & { bio?: string };
  courseCount: number;
}

export interface AuthorView<C extends CourseRef> {
  author: AuthorLink & { bio?: string };
  links: ExternalLink[];
  /** The author's courses in `index.yaml` order, with the learner's progress. */
  courses: CourseStats<C>[];
}

export const authorHref = (slug: string): string => `/authors/${encodeURIComponent(slug)}`;

/** URL of the endpoint serving an author's avatar image. */
export const authorAvatarHref = (slug: string): string => `/api/authors/${encodeURIComponent(slug)}/avatar`;

const toLink = ({ slug, name, avatar }: { slug: string; name: string; avatar?: string }): AuthorLink => ({
  slug,
  name,
  href: authorHref(slug),
  avatar: avatar ? authorAvatarHref(slug) : undefined,
});

/**
 * Up to two initials for the avatar fallback: the first letters of the first
 * and last words ("Ada Lovelace" → "AL", "LessonFolk" → "L").
 */
export function authorInitials(name: string): string {
  const words = name.trim().split(/[\s-]+/).filter(Boolean);
  const first = (word: string | undefined) => (word ? Array.from(word)[0] : '');
  return (first(words[0]) + (words.length > 1 ? first(words.at(-1)) : '')).toLocaleUpperCase();
}

/** Stable number for the colour of an author's initials (see `themeToneClass`), from their slug. */
export function authorTone(slug: string): number {
  let hash = 0;
  for (const char of slug) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return hash;
}

/**
 * The authors of a course, in `course.yaml` order, as links to their pages.
 * Unknown slugs (a content error, reported elsewhere) are left out.
 */
export function courseAuthors<C extends CourseRef>(
  course: { authors: string[] },
  authors: AuthorRef<C>[],
): AuthorLink[] {
  const bySlug = new Map(authors.map((a) => [a.slug, a]));
  return course.authors.flatMap((slug) => {
    const author = bySlug.get(slug);
    return author ? [toLink(author)] : [];
  });
}

/** Authors who have at least one course, in `authors.yaml` order, with their course count. */
export function getAuthorList<C extends CourseRef>(authors: AuthorRef<C>[]): AuthorListItem[] {
  return authors
    .filter((a) => a.courses.length > 0)
    .map((a) => ({ author: { ...toLink(a), bio: a.bio }, courseCount: a.courses.length }));
}

/**
 * External links of an author, built only from `authors.yaml` fields.
 * The schema already restricts `url` to http(s); this re-checks so a bad value
 * can never become a `javascript:` link.
 */
export function authorLinks(author: { github?: string; url?: string }): ExternalLink[] {
  const links: ExternalLink[] = [];
  if (author.github) {
    links.push({
      kind: 'github',
      href: `https://github.com/${encodeURIComponent(author.github)}`,
      label: author.github,
    });
  }
  if (author.url) {
    try {
      const url = new URL(author.url);
      if (url.protocol === 'https:' || url.protocol === 'http:') {
        links.push({ kind: 'website', href: url.href, label: url.host });
      }
    } catch {
      // Invalid URL: already reported by check:courses; show no link.
    }
  }
  return links;
}

/**
 * Everything the author page shows, or undefined when `slug` is unknown.
 * `courses` is the whole catalog in `index.yaml` order; the author's courses keep that order.
 */
export function getAuthorView<C extends CourseRef>(
  courses: C[],
  authors: AuthorRef<C>[],
  slug: string,
  progress: Progress,
): AuthorView<C> | undefined {
  const author = authors.find((a) => a.slug === slug);
  if (!author) return undefined;
  const ids = new Set(author.courses.map((c) => c.id));
  return {
    author: { ...toLink(author), bio: author.bio },
    links: authorLinks(author),
    courses: getStats(
      courses.filter((c) => ids.has(c.id)),
      progress,
    ).courses,
  };
}
