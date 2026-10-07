import {
  appendFileSync,
  cpSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  CourseValidationError,
  findLesson,
  inspectAllCourses,
  inspectCatalog,
  listLanguages,
  loadAuthors,
  loadCatalog,
  loadCourse,
  loadThemes,
  validateAllCourses,
} from './courses';
import { getPaths } from './paths';

const invalidDir = resolve(__dirname, '../../tests/fixtures/courses-invalid');
const realDir = getPaths().courses;
/** Pinned copy of the catalog (AI Foundations only), so new courses do not change test expectations. */
const validDir = resolve(__dirname, '../../tests/fixtures/courses-valid');

function issuesFor(dir: string) {
  return inspectCatalog('en', dir).issues.map((i) => ({
    file: i.file.slice(dir.length + 1).replaceAll('\\', '/'),
    message: i.message,
  }));
}

describe('loadCatalog (real courses)', () => {
  it('loads AI Foundations with its 3 lessons in order', () => {
    const courses = loadCatalog();
    const course = courses.find((c) => c.id === 'ai-foundations');
    expect(course).toBeDefined();
    expect(course).toMatchObject({
      title: 'AI Foundations',
      level: 'beginner',
      prerequisites: [],
    });
    expect(course!.lessons.map((l) => l.id)).toEqual([
      'ai-foundations/01-what-is-ai',
      'ai-foundations/02-how-machines-learn',
      'ai-foundations/03-what-is-an-llm',
    ]);
    const [first, second] = course!.lessons;
    expect(first.prerequisites).toEqual([]);
    expect(first.objectives.length).toBeGreaterThan(0);
    expect(first.file).toBe(join(realDir, 'en', 'ai-foundations', '01-what-is-ai.md'));
    expect(second.prerequisites).toEqual(['ai-foundations/01-what-is-ai']);
  });

  it('defaults to en and the repo courses directory', () => {
    expect(loadCatalog()).toEqual(loadCatalog('en', realDir));
  });

  it('finds courses and lessons by id', () => {
    expect(loadCourse('ai-foundations')?.lessons).toHaveLength(3);
    expect(loadCourse('nope')).toBeUndefined();
    expect(findLesson('ai-foundations/03-what-is-an-llm')?.course.id).toBe('ai-foundations');
  });

  it('validates every language in the repo', () => {
    expect(listLanguages()).toContain('en');
    expect(validateAllCourses()).toEqual([]);
    // Seeded themes may wait for their first course; nothing else should warn.
    const warnings = inspectAllCourses().warnings.map((w) => w.message);
    expect(warnings.filter((m) => !/^theme "[a-z-]+" has no course yet$/.test(m))).toEqual([]);
  });

  it('credits AI Foundations to the lessonfolk author', () => {
    expect(loadCourse('ai-foundations')?.authors).toEqual(['lessonfolk']);
    const lessonfolk = loadAuthors().find((a) => a.slug === 'lessonfolk');
    expect(lessonfolk).toMatchObject({ name: 'LessonFolk' });
    expect(lessonfolk?.bio).toBeTruthy();
    expect(lessonfolk?.courses.map((c) => c.id)).toContain('ai-foundations');
  });

  it('assigns AI Foundations to a theme and groups themes in themes.yaml order', () => {
    expect(loadCourse('ai-foundations')?.theme).toBe('understanding-ai');
    const themes = loadThemes();
    expect(themes[0]).toMatchObject({ id: 'understanding-ai', title: 'Understanding AI' });
    expect(themes[0].courses.map((c) => c.id)).toContain('ai-foundations');
  });

  it('throws a clear error for an unknown language', () => {
    expect(() => loadCatalog('xx')).toThrow(/index\.yaml not found for language "xx"/);
  });
});

describe('loadCatalog (invalid fixture)', () => {
  it('throws a CourseValidationError naming each faulty file', () => {
    let error: unknown;
    try {
      loadCatalog('en', invalidDir);
    } catch (err) {
      error = err;
    }
    expect(error).toBeInstanceOf(CourseValidationError);
    const message = (error as Error).message;
    expect(message).toMatch(/course\.yaml: title:/);
    expect(message).toContain('01-start.md');
  });

  it('reports a missing required field', () => {
    expect(issuesFor(invalidDir)).toContainEqual({
      file: 'en/missing-field/course.yaml',
      message: expect.stringMatching(/^title: /),
    });
  });

  it('reports a listed lesson whose file does not exist', () => {
    expect(issuesFor(invalidDir)).toContainEqual({
      file: 'en/broken-refs/course.yaml',
      message: 'lesson "broken-refs/02-not-there" is listed but 02-not-there.md does not exist',
    });
  });

  it('reports a lesson id that does not match its path', () => {
    expect(issuesFor(invalidDir)).toContainEqual({
      file: 'en/broken-refs/03-wrong-id.md',
      message: expect.stringContaining('expected "broken-refs/03-wrong-id"'),
    });
  });

  it('reports a broken prerequisite', () => {
    expect(issuesFor(invalidDir)).toContainEqual({
      file: 'en/broken-refs/01-start.md',
      message: 'prerequisite lesson "broken-refs/00-nope" does not exist',
    });
  });

  it('reports invalid lesson frontmatter', () => {
    const issues = issuesFor(invalidDir).filter(
      (i) => i.file === 'en/broken-refs/04-bad-frontmatter.md',
    );
    expect(issues.map((i) => i.message.split(':')[0]).sort()).toEqual([
      'estimatedMinutes',
      'level',
    ]);
  });

  it('reports a course listed in index.yaml that does not exist', () => {
    expect(issuesFor(invalidDir)).toContainEqual({
      file: 'en/index.yaml',
      message: expect.stringContaining('course "ghost-course" is listed but'),
    });
  });

  it('still returns the parts that loaded', () => {
    const { catalog } = inspectCatalog('en', invalidDir);
    expect(catalog.courses.map((c) => c.id)).toEqual(['broken-refs', 'broken-sections']);
    expect(catalog.courses[0].prerequisites).toEqual([]);
  });
});

describe('themes', () => {
  /** Copy of the pinned courses with `themes.yaml` replaced (or removed when `undefined`). */
  function withThemes(themesYaml: string | undefined, extraCourses: string[] = []) {
    const dir = mkdtempSync(join(tmpdir(), 'lessonfolk-courses-'));
    cpSync(validDir, dir, { recursive: true });
    const themesFile = join(dir, 'en', 'themes.yaml');
    if (themesYaml === undefined) rmSync(themesFile);
    else writeFileSync(themesFile, themesYaml);
    for (const id of extraCourses) {
      cpSync(join(dir, 'en', 'ai-foundations'), join(dir, 'en', id), { recursive: true });
      const courseFile = join(dir, 'en', id, 'course.yaml');
      writeFileSync(
        courseFile,
        readFileSync(courseFile, 'utf8')
          .replace('id: ai-foundations', `id: ${id}`)
          .replace('theme: understanding-ai', 'theme: second')
          .replaceAll('ai-foundations/', `${id}/`),
      );
      for (const name of readdirSync(join(dir, 'en', id)).filter((n) => n.endsWith('.md'))) {
        const file = join(dir, 'en', id, name);
        writeFileSync(file, readFileSync(file, 'utf8').replaceAll('ai-foundations/', `${id}/`));
      }
      appendFileSync(join(dir, 'en', 'index.yaml'), `  - ${id}\n`);
    }
    return dir;
  }
  const theme = (id: string) => `  - id: ${id}\n    title: T ${id}\n    description: D.\n`;

  it('reports an unknown theme id', () => {
    expect(issuesFor(invalidDir)).toContainEqual({
      file: 'en/broken-refs/course.yaml',
      message: 'theme "ghost-theme" is not listed in themes.yaml',
    });
  });

  it('reports a missing theme field', () => {
    expect(issuesFor(invalidDir)).toContainEqual({
      file: 'en/missing-field/course.yaml',
      message: 'theme: missing required field (expected string)',
    });
  });

  it('reports a missing themes.yaml', () => {
    expect(issuesFor(withThemes(undefined))).toEqual([
      { file: 'en/themes.yaml', message: 'themes.yaml not found' },
    ]);
  });

  it('reports an invalid themes.yaml', () => {
    const issues = issuesFor(withThemes('themes:\n  - id: Not Kebab\n    title: T\n'));
    expect(issues.map((i) => i.message).sort()).toEqual([
      'themes.0.description: missing required field (expected string)',
      'themes.0.id: must be a kebab-case theme id',
    ]);
  });

  it('reports duplicate theme ids', () => {
    const dir = withThemes(`themes:\n${theme('understanding-ai')}${theme('understanding-ai')}`);
    expect(issuesFor(dir)).toEqual([
      { file: 'en/themes.yaml', message: 'theme "understanding-ai" is listed more than once' },
    ]);
  });

  it('warns on a theme with no course', () => {
    const dir = withThemes(`themes:\n${theme('understanding-ai')}${theme('empty')}`);
    const { issues, warnings } = inspectCatalog('en', dir);
    expect(issues).toEqual([]);
    expect(warnings.map((w) => w.message)).toEqual(['theme "empty" has no course yet']);
  });

  it('returns themes in themes.yaml order with courses in index.yaml order', () => {
    const dir = withThemes(
      `themes:\n${theme('second')}${theme('understanding-ai')}`,
      ['course-b', 'course-a'],
    );
    expect(loadThemes('en', dir).map((t) => [t.id, t.courses.map((c) => c.id)])).toEqual([
      ['second', ['course-b', 'course-a']],
      ['understanding-ai', ['ai-foundations']],
    ]);
  });
});

describe('authors', () => {
  /** Copy of the pinned courses with `authors.yaml` replaced (or removed when `undefined`). */
  function withAuthors(authorsYaml: string | undefined, courseAuthors?: string) {
    const dir = mkdtempSync(join(tmpdir(), 'lessonfolk-courses-'));
    cpSync(validDir, dir, { recursive: true });
    const authorsFile = join(dir, 'authors.yaml');
    if (authorsYaml === undefined) rmSync(authorsFile);
    else writeFileSync(authorsFile, authorsYaml);
    if (courseAuthors !== undefined) {
      const courseFile = join(dir, 'en', 'ai-foundations', 'course.yaml');
      writeFileSync(
        courseFile,
        readFileSync(courseFile, 'utf8').replace(/^authors:.*$/m, courseAuthors),
      );
    }
    return dir;
  }
  const author = (slug: string) => `  - slug: ${slug}\n    name: N ${slug}\n`;
  const authorsYaml = (...slugs: string[]) => `authors:\n${slugs.map(author).join('')}`;
  const allIssues = (dir: string) =>
    inspectAllCourses(dir).issues.map((i) => ({
      file: i.file.slice(dir.length + 1).replaceAll('\\', '/'),
      message: i.message,
    }));

  it('reports an unknown author slug', () => {
    expect(issuesFor(invalidDir)).toContainEqual({
      file: 'en/broken-refs/course.yaml',
      message: 'author "ghost-author" is not listed in authors.yaml',
    });
  });

  it('reports a course without authors', () => {
    expect(issuesFor(invalidDir)).toContainEqual({
      file: 'en/missing-field/course.yaml',
      message: 'authors: missing required field (expected array)',
    });
    expect(allIssues(withAuthors(authorsYaml('lessonfolk'), 'authors: []'))).toEqual([
      {
        file: 'en/ai-foundations/course.yaml',
        message: 'authors: must list at least one author slug from authors.yaml',
      },
    ]);
  });

  it('reports an author listed twice in a course', () => {
    const dir = withAuthors(authorsYaml('lessonfolk'), 'authors: [lessonfolk, lessonfolk]');
    expect(issuesFor(dir)).toEqual([
      { file: 'en/ai-foundations/course.yaml', message: 'author "lessonfolk" is listed more than once' },
    ]);
  });

  it('reports a missing authors.yaml once', () => {
    expect(allIssues(withAuthors(undefined))).toEqual([
      { file: 'authors.yaml', message: 'authors.yaml not found' },
    ]);
  });

  it('reports an invalid authors.yaml', () => {
    const dir = withAuthors(
      'authors:\n  - slug: Not Kebab\n    github: https://github.com/x\n    url: javascript:alert(1)\n',
    );
    expect(allIssues(dir).map((i) => i.message).sort()).toEqual([
      'authors.0.github: must be a GitHub username (no URL, no @)',
      'authors.0.name: missing required field (expected string)',
      'authors.0.slug: must be a kebab-case author slug',
      'authors.0.url: must be an http(s) URL',
    ]);
  });

  it('reports duplicate author slugs', () => {
    expect(allIssues(withAuthors(authorsYaml('lessonfolk', 'lessonfolk')))).toEqual([
      { file: 'authors.yaml', message: 'author "lessonfolk" is listed more than once' },
    ]);
  });

  it('warns on an author with no course in any language', () => {
    const { issues, warnings } = inspectAllCourses(invalidDir);
    expect(issues.length).toBeGreaterThan(0);
    expect(warnings.filter((w) => w.file.endsWith('authors.yaml')).map((w) => w.message)).toEqual([
      'author "unused" has no course yet',
    ]);
    const dir = withAuthors(authorsYaml('lessonfolk', 'idle'));
    expect(inspectAllCourses(dir).warnings.map((w) => w.message)).toContain(
      'author "idle" has no course yet',
    );
    // Per-language checks do not warn: the author may have courses in another language.
    expect(inspectCatalog('en', dir).warnings.map((w) => w.message)).not.toContain(
      'author "idle" has no course yet',
    );
  });

  it('accepts optional bio and links, and lists authors in authors.yaml order', () => {
    const dir = withAuthors(
      `${authorsYaml('idle', 'lessonfolk')}    bio: B.\n    github: some-one\n    url: https://example.com/me\n`,
    );
    expect(loadAuthors('en', dir).map((a) => [a.slug, a.courses.map((c) => c.id)])).toEqual([
      ['idle', []],
      ['lessonfolk', ['ai-foundations']],
    ]);
    expect(loadAuthors('en', dir)[1]).toMatchObject({
      bio: 'B.',
      github: 'some-one',
      url: 'https://example.com/me',
    });
  });

  describe('avatars', () => {
    const withAvatar = (avatar: string) => withAuthors(`${authorsYaml('lessonfolk')}    avatar: ${avatar}\n`);

    it('keeps an avatar whose image is in courses/authors/', () => {
      expect(loadAuthors('en', validDir)[0].avatar).toBe('lessonfolk.svg');
      expect(allIssues(withAvatar('lessonfolk.svg'))).toEqual([]);
    });

    it('never treats the avatars folder as a language', () => {
      expect(listLanguages(validDir)).toEqual(['en']);
    });

    it('reports a missing image and drops the avatar', () => {
      const dir = withAvatar('nobody.png');
      expect(allIssues(dir)).toEqual([
        { file: 'authors.yaml', message: 'author "lessonfolk": avatar "nobody.png" not found in authors/' },
      ]);
      expect(inspectCatalog('en', dir).catalog.authors[0].avatar).toBeUndefined();
    });

    it('reports an image that is too large', () => {
      const dir = withAvatar('big.png');
      writeFileSync(join(dir, 'authors', 'big.png'), Buffer.alloc(512 * 1024 + 1));
      expect(allIssues(dir)).toEqual([
        { file: 'authors.yaml', message: 'author "lessonfolk": avatar "big.png" is larger than 512 KB' },
      ]);
    });

    it.each(['../secret.png', 'authors/me.png', 'me.gif', 'Me.png', 'https://example.com/me.png'])(
      'rejects the avatar name %s',
      (avatar) => {
        expect(allIssues(withAvatar(JSON.stringify(avatar))).map((i) => i.message)).toEqual([
          'authors.0.avatar: must be an image file name in courses/authors/ (png, jpg, webp or svg)',
        ]);
      },
    );
  });
});

describe('lesson sections (invalid fixture)', () => {
  const sectionIssues = (lesson: string) =>
    issuesFor(invalidDir)
      .filter((i) => i.file === `en/broken-sections/${lesson}.md`)
      .map((i) => i.message);

  it('reports a missing section', () => {
    expect(sectionIssues('01-missing-section')).toEqual(['missing section "## Teaching notes"']);
  });

  it('reports a misspelled section', () => {
    expect(sectionIssues('02-misspelled-section')).toEqual([
      'unknown section "## Key Idea"; did you mean "## Key ideas"?',
      'missing section "## Key ideas"',
    ]);
  });

  it('reports sections out of order', () => {
    expect(sectionIssues('03-out-of-order')).toEqual([
      'section "## Key ideas" must come before "## Teaching notes"',
    ]);
  });

  it('reports a check question without a good answer', () => {
    expect(sectionIssues('04-no-good-answer')).toEqual([
      'question 2 in "## Check your understanding" has no "Good answer:" line',
    ]);
  });

  it('reports guideline drift as warnings only', () => {
    expect(sectionIssues('05-guideline-drift')).toEqual([]);
    const { warnings } = inspectCatalog('en', invalidDir);
    expect(warnings.map((w) => w.message)).toEqual([
      '"## Key ideas" has 2 numbered ideas; guidelines suggest 3–6',
      'estimatedMinutes is 40; guidelines suggest 10–25 minutes',
    ]);
    expect(warnings.every((w) => w.file.endsWith('05-guideline-drift.md'))).toBe(true);
  });

  it('does not block loading on warnings', () => {
    const course = inspectCatalog('en', invalidDir).catalog.courses.find(
      (c) => c.id === 'broken-sections',
    );
    expect(course?.lessons.map((l) => l.id)).toContain('broken-sections/05-guideline-drift');
  });
});

describe('loadCatalog (live edits)', () => {
  it('reads files at call time, without caching', () => {
    const dir = mkdtempSync(join(tmpdir(), 'lessonfolk-courses-'));
    cpSync(validDir, dir, { recursive: true });
    const courseFile = join(dir, 'en', 'ai-foundations', 'course.yaml');
    expect(loadCourse('ai-foundations', 'en', dir)?.title).toBe('AI Foundations');

    writeFileSync(
      courseFile,
      readFileSync(courseFile, 'utf8').replace('title: AI Foundations', 'title: Edited'),
    );
    expect(loadCourse('ai-foundations', 'en', dir)?.title).toBe('Edited');
  });

  it('accepts Windows line endings in frontmatter', () => {
    const dir = mkdtempSync(join(tmpdir(), 'lessonfolk-courses-'));
    cpSync(validDir, dir, { recursive: true });
    const lessonFile = join(dir, 'en', 'ai-foundations', '01-what-is-ai.md');
    writeFileSync(lessonFile, readFileSync(lessonFile, 'utf8').replace(/\r?\n/g, '\r\n'));
    expect(findLesson('ai-foundations/01-what-is-ai', 'en', dir)?.lesson.title).toBe(
      'What is AI?',
    );
  });
});
