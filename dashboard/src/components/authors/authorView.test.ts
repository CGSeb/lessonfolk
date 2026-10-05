import { describe, expect, it } from 'vitest';
import { emptyProgress, type CourseRef, type Progress } from '../../lib/progress';
import {
  authorHref,
  authorLinks,
  courseAuthors,
  getAuthorList,
  getAuthorView,
  type AuthorRef,
} from './authorView';

type TestCourse = CourseRef & { authors: string[] };

const course = (id: string, authors: string[], lessonCount = 2): TestCourse => ({
  id,
  authors,
  lessons: Array.from({ length: lessonCount }, (_, i) => ({ id: `${id}/0${i + 1}`, prerequisites: [] })),
});

const a = course('a', ['ada']);
const b = course('b', ['bob', 'ada']);
const c = course('c', ['bob']);
const courses = [a, b, c]; // index.yaml order

const author = (slug: string, members: TestCourse[], extra: Partial<AuthorRef<TestCourse>> = {}) => ({
  slug,
  name: `Name ${slug}`,
  courses: members,
  ...extra,
});

const ada = author('ada', [a, b], { bio: 'Writes courses.', github: 'ada-l', url: 'https://ada.example/' });
const bob = author('bob', [b, c]);
const idle = author('idle', []);
const authors = [ada, bob, idle]; // authors.yaml order

const progress = (lessons: Record<string, 'done' | 'skipped' | 'in_progress'>): Progress => ({
  ...emptyProgress(),
  lessons: Object.fromEntries(Object.entries(lessons).map(([id, status]) => [id, { status }])),
});

describe('courseAuthors', () => {
  it('lists the course authors in course.yaml order, linking to their pages', () => {
    expect(courseAuthors(b, authors)).toEqual([
      { slug: 'bob', name: 'Name bob', href: '/authors/bob' },
      { slug: 'ada', name: 'Name ada', href: '/authors/ada' },
    ]);
  });

  it('leaves out unknown author slugs', () => {
    expect(courseAuthors(course('x', ['ghost', 'ada']), authors).map((l) => l.slug)).toEqual(['ada']);
  });
});

describe('getAuthorList', () => {
  it('lists authors with at least one course, in authors.yaml order, with their course count', () => {
    expect(getAuthorList(authors)).toEqual([
      {
        author: { slug: 'ada', name: 'Name ada', href: '/authors/ada', bio: 'Writes courses.' },
        courseCount: 2,
      },
      { author: { slug: 'bob', name: 'Name bob', href: '/authors/bob', bio: undefined }, courseCount: 2 },
    ]);
  });
});

describe('authorLinks', () => {
  it('builds GitHub and website links from authors.yaml fields', () => {
    expect(authorLinks(ada)).toEqual([
      { kind: 'github', href: 'https://github.com/ada-l', label: 'ada-l' },
      { kind: 'website', href: 'https://ada.example/', label: 'ada.example' },
    ]);
  });

  it('shows no link when none is set', () => {
    expect(authorLinks(bob)).toEqual([]);
  });

  it('never renders a non-web URL', () => {
    expect(authorLinks({ url: 'javascript:alert(1)' })).toEqual([]);
    expect(authorLinks({ url: 'not a url' })).toEqual([]);
  });
});

describe('getAuthorView', () => {
  it('returns undefined for an unknown author', () => {
    expect(getAuthorView(courses, authors, 'nobody', emptyProgress())).toBeUndefined();
  });

  it("lists the author's courses in index.yaml order with the learner's progress", () => {
    // Courses listed out of order in the author entry still follow index.yaml.
    const view = getAuthorView(courses, [author('bob', [c, b])], 'bob', progress({ 'b/01': 'done', 'b/02': 'skipped' }))!;
    expect(view.author).toEqual({ slug: 'bob', name: 'Name bob', href: '/authors/bob', bio: undefined });
    expect(view.courses.map((s) => [s.course.id, s.completed])).toEqual([
      ['b', true],
      ['c', false],
    ]);
  });

  it('keeps the bio and the external links', () => {
    const view = getAuthorView(courses, authors, 'ada', emptyProgress())!;
    expect(view.author.bio).toBe('Writes courses.');
    expect(view.links.map((l) => l.kind)).toEqual(['github', 'website']);
  });

  it('returns an empty course list for an author with no course', () => {
    expect(getAuthorView(courses, authors, 'idle', emptyProgress())?.courses).toEqual([]);
  });
});

describe('authorHref', () => {
  it('builds the author page path', () => {
    expect(authorHref('apprentice')).toBe('/authors/apprentice');
  });
});
