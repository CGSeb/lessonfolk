import { cpSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  CourseValidationError,
  findLesson,
  inspectAllCourses,
  inspectCatalog,
  listLanguages,
  loadCatalog,
  loadCourse,
  validateAllCourses,
} from './courses';
import { getPaths } from './paths';

const invalidDir = resolve(__dirname, '../../tests/fixtures/courses-invalid');
const realDir = getPaths().courses;

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
    expect(inspectAllCourses().warnings).toEqual([]);
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
    const dir = mkdtempSync(join(tmpdir(), 'apprentice-courses-'));
    cpSync(realDir, dir, { recursive: true });
    const courseFile = join(dir, 'en', 'ai-foundations', 'course.yaml');
    expect(loadCourse('ai-foundations', 'en', dir)?.title).toBe('AI Foundations');

    writeFileSync(
      courseFile,
      readFileSync(courseFile, 'utf8').replace('title: AI Foundations', 'title: Edited'),
    );
    expect(loadCourse('ai-foundations', 'en', dir)?.title).toBe('Edited');
  });

  it('accepts Windows line endings in frontmatter', () => {
    const dir = mkdtempSync(join(tmpdir(), 'apprentice-courses-'));
    cpSync(realDir, dir, { recursive: true });
    const lessonFile = join(dir, 'en', 'ai-foundations', '01-what-is-ai.md');
    writeFileSync(lessonFile, readFileSync(lessonFile, 'utf8').replace(/\r?\n/g, '\r\n'));
    expect(findLesson('ai-foundations/01-what-is-ai', 'en', dir)?.lesson.title).toBe(
      'What is AI?',
    );
  });
});
