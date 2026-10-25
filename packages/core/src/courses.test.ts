import {
  appendFileSync,
  cpSync,
  mkdirSync,
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
  languageCode,
  listLanguages,
  loadAuthors,
  loadCatalog,
  loadCourse,
  loadThemes,
  validateAllCourses,
} from './courses.ts';
import { getCoursesDir } from './paths.ts';

const invalidDir = resolve(__dirname, '../tests/fixtures/courses-invalid');
const realDir = getCoursesDir();
/** Pinned copy of the catalog (AI Foundations only), so new courses do not change test expectations. */
const validDir = resolve(__dirname, '../tests/fixtures/courses-valid');

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
    expect(first.checks).toBeGreaterThan(0);
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

  it('shows the English courses for a language with no translation', () => {
    const english = loadCatalog('en');
    const unknown = inspectCatalog('xx');
    expect(unknown.catalog.lang).toBe('xx');
    expect(unknown.catalog.courses).toEqual(english);
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

describe('estimatedHours', () => {
  /** Copy of the pinned courses (lessons add up to 55 minutes) with another `estimatedHours`. */
  function hoursWarnings(estimatedHours: number, dropLesson = false) {
    const dir = mkdtempSync(join(tmpdir(), 'lessonfolk-courses-'));
    cpSync(validDir, dir, { recursive: true });
    const courseFile = join(dir, 'en', 'ai-foundations', 'course.yaml');
    writeFileSync(
      courseFile,
      readFileSync(courseFile, 'utf8').replace(/^estimatedHours:.*$/m, `estimatedHours: ${estimatedHours}`),
    );
    if (dropLesson) rmSync(join(dir, 'en', 'ai-foundations', '03-what-is-an-llm.md'));
    const { warnings } = inspectCatalog('en', dir);
    return warnings.filter((w) => w.file === courseFile).map((w) => w.message);
  }

  it('accepts a total within a quarter of an hour of the lessons', () => {
    expect(hoursWarnings(1)).toEqual([]);
    expect(hoursWarnings(0.75)).toEqual([]);
  });

  it('warns when the total drifts from the sum of the lessons', () => {
    expect(hoursWarnings(2)).toEqual([
      'estimatedHours is 2, but its lessons add up to 55 minutes (about 1 hour)',
    ]);
    expect(hoursWarnings(0.5)).toHaveLength(1);
  });

  it('does not compare when a listed lesson failed to load', () => {
    expect(hoursWarnings(2, true)).toEqual([]);
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

describe('translations', () => {
  const lines = (...parts: string[]) => parts.join('\n') + '\n';
  const unknownTheme = lines('themes:', '  - id: no-such-theme', '    title: X', '    description: Y');

  /** A copy of the valid fixture with `files` (path → content) written under it. */
  function withFiles(files: Record<string, string>): string {
    const dir = mkdtempSync(join(tmpdir(), 'lessonfolk-courses-'));
    cpSync(validDir, dir, { recursive: true });
    for (const [path, content] of Object.entries(files)) {
      mkdirSync(join(dir, path, '..'), { recursive: true });
      writeFileSync(join(dir, path), content);
    }
    return dir;
  }

  /** The English lesson with a French title and objectives (section headings stay English). */
  function frenchLesson(dir: string, slug: string, title: string): string {
    const english = readFileSync(join(dir, 'en', 'ai-foundations', `${slug}.md`), 'utf8').replaceAll('\r\n', '\n');
    return english
      .replace(/^title: .*$/m, `title: ${title}`)
      .replace(/objectives:\n(?: {2}- .*\n)+/, 'objectives:\n  - Expliquer ce qu’est l’IA\n');
  }

  function writeLesson(dir: string, slug: string, text: string) {
    mkdirSync(join(dir, 'fr', 'ai-foundations'), { recursive: true });
    writeFileSync(join(dir, 'fr', 'ai-foundations', `${slug}.md`), text);
  }

  /** `inspectCatalog('fr')` on `dir`, which is then removed. */
  function inspectFrench(dir: string) {
    try {
      return inspectCatalog('fr', dir);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  }

  it('uses the translated text and keeps English for the rest', () => {
    const dir = withFiles({
      'fr/themes.yaml': lines('themes:', '  - id: understanding-ai', '    title: Comprendre l’IA', '    description: Ce qu’est l’IA.'),
      'fr/ai-foundations/course.yaml': lines('id: ai-foundations', 'title: Les bases de l’IA', 'description: Partir de zéro.'),
    });
    writeLesson(dir, '01-what-is-ai', frenchLesson(dir, '01-what-is-ai', 'Qu’est-ce que l’IA ?'));
    const frenchFile = join(dir, 'fr', 'ai-foundations', '01-what-is-ai.md');
    const { catalog, issues, warnings } = inspectFrench(dir);
    expect(issues).toEqual([]);
    expect(warnings).toHaveLength(inspectCatalog('en', validDir).warnings.length);

    const [course] = catalog.courses;
    expect(catalog.lang).toBe('fr');
    expect(course).toMatchObject({ id: 'ai-foundations', title: 'Les bases de l’IA', lang: 'fr', level: 'beginner' });
    expect(course.lessons.map((l) => [l.title, l.lang])).toEqual([
      ['Qu’est-ce que l’IA ?', 'fr'],
      ['How do machines learn?', 'en'],
      ['What is a large language model?', 'en'],
    ]);
    expect(course.lessons[0]).toMatchObject({
      id: 'ai-foundations/01-what-is-ai',
      estimatedMinutes: 15,
      objectives: ['Expliquer ce qu’est l’IA'],
      file: frenchFile,
    });

    // Themes and authors point to the translated courses; untranslated themes stay English.
    expect(catalog.themes.map((th) => th.title)).toEqual(['Comprendre l’IA', 'Using AI tools', 'Building with AI', 'AI and society']);
    expect(catalog.themes[0].courses[0].title).toBe('Les bases de l’IA');
    expect(catalog.authors[0].courses[0].title).toBe('Les bases de l’IA');
  });

  it('keeps the course text in English when only some lessons are translated', () => {
    const dir = withFiles({});
    writeLesson(dir, '02-how-machines-learn', frenchLesson(dir, '02-how-machines-learn', 'Comment les machines apprennent'));
    const { catalog, issues } = inspectFrench(dir);
    expect(issues).toEqual([]);
    expect(catalog.courses[0]).toMatchObject({ title: 'AI Foundations', lang: 'en' });
    expect(catalog.courses[0].lessons[1]).toMatchObject({ title: 'Comment les machines apprennent', lang: 'fr' });
  });

  it('reports translation files that match no English course, lesson or theme', () => {
    const dir = withFiles({
      'fr/index.yaml': lines('courses:', '  - ai-foundations'),
      'fr/themes.yaml': unknownTheme,
      'fr/no-such-course/course.yaml': lines('id: no-such-course', 'title: X', 'description: Y'),
      'fr/ai-foundations/course.yaml': lines('id: wrong-id', 'title: X', 'description: Y'),
      'fr/ai-foundations/09-extra.md': lines('---', 'id: ai-foundations/09-extra', 'title: X', '---'),
    });
    const rel = (file: string) => file.slice(dir.length + 1).replaceAll('\\', '/');
    const { catalog, issues, warnings } = inspectFrench(dir);
    expect(issues.map((i) => [rel(i.file), i.message])).toEqual([
      ['fr/themes.yaml', 'theme "no-such-theme" is not in en/themes.yaml'],
      ['fr/no-such-course', 'course "no-such-course" is not in en/index.yaml: translate an existing course'],
      ['fr/ai-foundations/course.yaml', 'id "wrong-id" does not match its folder name "ai-foundations"'],
      ['fr/ai-foundations/09-extra.md', 'lesson file is not listed in en/ai-foundations/course.yaml'],
    ]);
    expect(warnings.map((w) => rel(w.file))).toContain('fr/index.yaml');
    // Whatever could not be used stays in English.
    expect(catalog.courses[0].title).toBe('AI Foundations');
  });

  it('keeps the English lesson when the translation renames a section heading', () => {
    const dir = withFiles({});
    writeLesson(dir, '01-what-is-ai', frenchLesson(dir, '01-what-is-ai', 'Qu’est-ce que l’IA ?').replace('## Key ideas', '## Idées clés'));
    const { catalog, issues } = inspectFrench(dir);
    expect(issues.some((i) => i.message.startsWith('unknown section "## Idées clés"'))).toBe(true);
    expect(catalog.courses[0].lessons[0]).toMatchObject({ title: 'What is AI?', lang: 'en' });
  });

  it('keeps the English lesson when the translation has a different number of checks', () => {
    const dir = withFiles({});
    const french = frenchLesson(dir, '01-what-is-ai', 'Qu’est-ce que l’IA ?').replace(
      '## Completion criteria',
      '4. Une question en plus ?\n   Good answer: oui.\n\n## Completion criteria',
    );
    writeLesson(dir, '01-what-is-ai', french);
    const { catalog, issues } = inspectFrench(dir);
    expect(issues.map((i) => i.message)).toContain(
      '"## Check your understanding" has 4 questions, but the en lesson has 3: keep the same questions in the same order',
    );
    expect(catalog.courses[0].lessons[0]).toMatchObject({ title: 'What is AI?', lang: 'en', checks: 3 });
  });

  it('reports each translation problem once, without repeating the English ones', () => {
    const dir = withFiles({ 'fr/themes.yaml': unknownTheme });
    try {
      expect(inspectAllCourses(dir).issues.map((i) => i.message)).toEqual(['theme "no-such-theme" is not in en/themes.yaml']);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('reads a language code from a profile language', () => {
    expect(['fr', 'fr-FR', 'FR', 'Français', 'francais', 'French', 'French (France)'].map(languageCode)).toEqual(Array(7).fill('fr'));
    expect(['en', 'en_GB', 'English', 'Anglais'].map(languageCode)).toEqual(Array(4).fill('en'));
    expect(languageCode('de')).toBe('de');
    expect([undefined, null, 42, '', '  ', 'Klingon please'].map(languageCode)).toEqual(Array(6).fill(undefined));
  });

  it('never reads a language folder outside the courses directory', () => {
    expect(inspectCatalog('../en', validDir).catalog.courses[0].lang).toBe('en');
  });
});

