import { cpSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { CourseValidationError, inspectAllCourses, listLanguages } from './courses.ts';
import { findProject, inspectProjects, listProjectLanguages, loadProjects, readProjectContent } from './projects.ts';

/** Pinned copy of the catalog (AI Foundations only). */
const validDir = resolve(__dirname, '../tests/fixtures/courses-valid');

const front = (fields: Record<string, string>) =>
  `---\n${Object.entries(fields)
    .map(([key, value]) => `${key}: ${value}`)
    .join('\n')}\n---\n`;

const BASE_FIELDS = {
  id: 'demo',
  title: 'Demo project',
  level: 'beginner',
  theme: 'understanding-ai',
  authors: '[lessonfolk]',
  description: 'A demo.',
  estimatedHours: '2',
  buildsOn: '[ai-foundations]',
  needs: '[An AI chat app]',
};

const BODY = [
  '## Brief',
  'Make something.',
  '## Milestones',
  '1. First.\n   Done when: one.',
  '2. Second.\n   Done when: two.',
  '3. Third.\n   Done when: three.',
  '## Coaching notes',
  '- Coach.',
  '## Review',
  '1. Good.',
  '2. Clear.',
  '',
].join('\n');

/** The courses and projects folders of a content root made by `withProjects`. */
const C = (root: string) => join(root, 'courses');
const P = (root: string) => join(root, 'projects');

/**
 * A content root like the repository's: a copy of the valid catalog in courses/, and the given
 * project files in projects/ (path under projects/ → text).
 */
function withProjects(files: Record<string, string>): string {
  const dir = mkdtempSync(join(tmpdir(), 'lessonfolk-projects-'));
  cpSync(validDir, C(dir), { recursive: true });
  for (const [path, text] of Object.entries(files)) {
    const file = join(dir, 'projects', path);
    mkdirSync(join(file, '..'), { recursive: true });
    writeFileSync(file, text);
  }
  return dir;
}

const project = (fields: Record<string, string> = {}, body = BODY) => front({ ...BASE_FIELDS, ...fields }) + body;
const INDEX = 'projects:\n  - demo\n';

function issues(dir: string, lang = 'en') {
  return inspectProjects(lang, P(dir), C(dir)).issues.map((i) => ({
    file: i.file.slice(dir.length + 1).replaceAll('\\', '/'),
    message: i.message,
  }));
}

describe('projects (real content)', () => {
  it('loads the repository projects in both languages', () => {
    const en = loadProjects();
    expect(en.map((p) => p.id)).toContain('reusable-prompt');
    const fr = findProject('reusable-prompt', 'fr');
    expect(fr?.lang).toBe('fr');
    expect(fr?.milestones).toBe(en.find((p) => p.id === 'reusable-prompt')?.milestones);
  });
});

describe('inspectProjects', () => {
  it('means no projects when there is no projects folder', () => {
    const none = join(validDir, 'no-projects-here');
    expect(inspectProjects('en', none, validDir)).toEqual({ projects: [], issues: [], warnings: [] });
    expect(listProjectLanguages(none)).toEqual([]);
  });

  it('loads a valid project with its counts', () => {
    const dir = withProjects({ 'en/index.yaml': INDEX, 'en/demo.md': project() });
    expect(loadProjects('en', P(dir), C(dir))).toEqual([
      {
        id: 'demo',
        title: 'Demo project',
        level: 'beginner',
        theme: 'understanding-ai',
        authors: ['lessonfolk'],
        description: 'A demo.',
        estimatedHours: 2,
        buildsOn: ['ai-foundations'],
        needs: ['An AI chat app'],
        milestones: 3,
        reviewCriteria: 2,
        file: join(dir, 'projects', 'en', 'demo.md'),
        lang: 'en',
      },
    ]);
    expect(findProject('nope', 'en', P(dir), C(dir))).toBeUndefined();
  });

  it('keeps the projects folder apart from the course languages', () => {
    const dir = withProjects({ 'en/index.yaml': INDEX, 'en/demo.md': project() });
    expect(listLanguages(C(dir))).toEqual(['en']);
    expect(listProjectLanguages(P(dir))).toEqual(['en']);
    expect(inspectAllCourses(C(dir), P(dir)).issues).toEqual([]);
  });

  it('reports a missing index', () => {
    const dir = withProjects({ 'en/demo.md': project() });
    expect(issues(dir)).toEqual([
      { file: 'projects/en/index.yaml', message: 'index.yaml not found: projects are listed in projects/en/index.yaml' },
    ]);
  });

  it('reports listing problems', () => {
    const dir = withProjects({
      'en/index.yaml': 'projects:\n  - demo\n  - demo\n  - ghost\n',
      'en/demo.md': project(),
      'en/stray.md': project({ id: 'stray' }),
    });
    expect(issues(dir)).toEqual([
      { file: 'projects/en/index.yaml', message: 'project "demo" is listed more than once' },
      { file: 'projects/en/index.yaml', message: 'project "ghost" is listed but ghost.md does not exist' },
      { file: 'projects/en/stray.md', message: 'project file is not listed in projects/en/index.yaml' },
    ]);
    expect(() => loadProjects('en', P(dir), C(dir))).toThrow(CourseValidationError);
  });

  it('reports bad frontmatter and broken references', () => {
    const dir = withProjects({
      'en/index.yaml': INDEX,
      'en/demo.md': project({
        id: 'other',
      }),
    });
    expect(issues(dir)).toEqual([{ file: 'projects/en/demo.md', message: 'id "other" does not match its file name "demo"' }]);

    const refs = withProjects({
      'en/index.yaml': INDEX,
      'en/demo.md': project({
        theme: 'no-such-theme',
        authors: '[lessonfolk, lessonfolk, ghost]',
        buildsOn: '[no-such-course]',
        needs: '[]',
      }),
    });
    expect(issues(refs).map((i) => i.message)).toEqual(['needs: must list what the learner needs, at least one item']);

    const links = withProjects({
      'en/index.yaml': INDEX,
      'en/demo.md': project({ theme: 'no-such-theme', authors: '[lessonfolk, lessonfolk, ghost]', buildsOn: '[no-such-course]' }),
    });
    expect(issues(links).map((i) => i.message)).toEqual([
      'theme "no-such-theme" is not listed in themes.yaml',
      'author "lessonfolk" is listed more than once',
      'author "ghost" is not listed in authors.yaml',
      'buildsOn course "no-such-course" is not listed in index.yaml',
    ]);
  });

  it('reports body errors and leaves the project out', () => {
    const dir = withProjects({ 'en/index.yaml': INDEX, 'en/demo.md': project({}, BODY.replace('## Review', '## Reviews')) });
    const result = inspectProjects('en', P(dir), C(dir));
    expect(result.projects).toEqual([]);
    expect(result.issues.map((i) => i.message)).toEqual([
      'unknown section "## Reviews"; did you mean "## Review"?',
      'missing section "## Review"',
    ]);
  });
});

describe('project translations', () => {
  const frFields = { id: 'demo', title: 'Projet démo', description: 'Une démo.' };
  const fr = (fields: Record<string, string> = {}, body = BODY) => front({ ...frFields, ...fields }) + body;

  it('replaces the text and keeps the rest from English', () => {
    const dir = withProjects({
      'en/index.yaml': INDEX,
      'en/demo.md': project(),
      'fr/demo.md': fr({ needs: '[Une application de chat IA]', level: 'advanced' }),
    });
    const [demo] = loadProjects('fr', P(dir), C(dir));
    expect(demo).toMatchObject({
      title: 'Projet démo',
      description: 'Une démo.',
      needs: ['Une application de chat IA'],
      level: 'beginner',
      lang: 'fr',
      file: join(dir, 'projects', 'fr', 'demo.md'),
    });
  });

  it('falls back to English for a project not translated', () => {
    const dir = withProjects({ 'en/index.yaml': INDEX, 'en/demo.md': project(), 'fr/.keep': '' });
    expect(loadProjects('fr', P(dir), C(dir))[0]).toMatchObject({ title: 'Demo project', lang: 'en' });
    expect(loadProjects('de', P(dir), C(dir))[0]).toMatchObject({ lang: 'en' });
  });

  it('reports translations that do not match the English project', () => {
    const dir = withProjects({
      'en/index.yaml': INDEX,
      'en/demo.md': project(),
      'fr/index.yaml': INDEX,
      'fr/demo.md': fr({}, BODY.replace('3. Third.\n   Done when: three.\n', '').replace('2. Clear.\n', '')),
      'fr/ghost.md': fr({ id: 'ghost' }),
    });
    const result = inspectProjects('fr', P(dir), C(dir));
    expect(result.issues.map((i) => i.message)).toEqual([
      'project "ghost" is not in projects/en/index.yaml: translate an existing project',
      '"## Milestones" has 2 milestones, but the en project has 3: keep the same milestones in the same order',
      '"## Review" has 1 criterion, but the en project has 2: keep the same criteria in the same order',
    ]);
    expect(result.warnings.map((w) => w.message)).toEqual([
      'not used: the projects and their order come from projects/en/index.yaml',
    ]);
    expect(result.projects[0]).toMatchObject({ title: 'Demo project', lang: 'en' });
    // inspectAllCourses reports them too.
    expect(inspectAllCourses(C(dir), P(dir)).issues.map((i) => i.message)).toContain(
      'project "ghost" is not in projects/en/index.yaml: translate an existing project',
    );
  });

  it('reports a folder that is not a language', () => {
    const dir = withProjects({ 'en/index.yaml': INDEX, 'en/demo.md': project(), 'drafts/demo.md': project() });
    expect(inspectAllCourses(C(dir), P(dir)).issues.map((i) => i.message)).toEqual([
      '"drafts" is not a language code: projects/ holds one folder per language',
    ]);
  });

  it('counts an author with only a project as having content', () => {
    const dir = withProjects({ 'en/index.yaml': INDEX, 'en/demo.md': project({ authors: '[solo]' }) });
    const authorsFile = join(C(dir), 'authors.yaml');
    writeFileSync(authorsFile, `${readFileSync(authorsFile, 'utf8')}  - slug: solo\n    name: Solo\n`);
    const { issues: found, warnings } = inspectAllCourses(C(dir), P(dir));
    expect(found).toEqual([]);
    expect(warnings.map((w) => w.message)).not.toContain('author "solo" has no course yet');
  });
});

describe('readProjectContent', () => {
  it('reads the real project in both languages, with the same milestones', () => {
    const en = readProjectContent(findProject('reusable-prompt')!);
    const fr = readProjectContent(findProject('reusable-prompt', 'fr')!);
    expect(en.milestones).toHaveLength(5);
    expect(en.milestones[0].title).toBe('Choose the task and what "good" means');
    expect(fr.milestones).toHaveLength(5);
    expect(fr.review).toHaveLength(en.review.length);
    expect(en.brief.length).toBeGreaterThan(0);
  });
});
