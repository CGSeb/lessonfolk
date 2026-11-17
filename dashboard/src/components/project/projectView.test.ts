import { cpSync, mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { emptyProgress, inspectCatalog, loadProjects, type Progress } from '@lessonfolk/core';
import { describe, expect, it } from 'vitest';
import { getProjectView, inlineSegments, projectCard, projectsForCourse } from './projectView';

const fixture = fileURLToPath(new URL('../../../../packages/core/tests/fixtures/courses-valid', import.meta.url));

const PROJECT = `---
id: demo
title: Demo
level: beginner
theme: understanding-ai
authors: [lessonfolk]
description: A demo.
estimatedHours: 2
buildsOn: [ai-foundations, gone]
needs: [An AI chat app]
---

## Brief
Make **something** real.

## Milestones
1. **First.** Do it. Done when: one.
2. **Second.** Do more. Done when: two.
3. **Third.** Finish. Done when: three.

## Coaching notes
- Tutor only.

## Review
1. It works.
2. It is clear.

## Going further
- Keep going.
`;

function setup() {
  // A content root like the repository's: courses/ and projects/ side by side.
  const root = mkdtempSync(join(tmpdir(), 'lessonfolk-project-view-'));
  const coursesDir = join(root, 'courses');
  const projectsDir = join(root, 'projects');
  cpSync(fixture, coursesDir, { recursive: true });
  mkdirSync(join(projectsDir, 'en'), { recursive: true });
  writeFileSync(join(projectsDir, 'en', 'index.yaml'), 'projects:\n  - demo\n');
  // `gone` is not a course: the file builds on real courses only, `gone` is added after loading
  // so the view is shown a course id that is not in the catalog.
  writeFileSync(join(projectsDir, 'en', 'demo.md'), PROJECT.replace(', gone]', ']'));
  const projects = loadProjects('en', projectsDir, coursesDir).map((p) => ({ ...p, buildsOn: [...p.buildsOn, 'gone'] }));
  return { projects, catalog: inspectCatalog('en', coursesDir).catalog };
}

describe('project views', () => {
  it('builds a card with theme, status and the courses it builds on', () => {
    const { projects, catalog } = setup();
    const card = projectCard(projects[0], catalog, emptyProgress());
    expect(card).toMatchObject({ status: 'not_started', reached: 0, theme: { id: 'understanding-ai' } });
    expect(card.buildsOn.map((b) => [b.id, b.course?.title])).toEqual([
      ['ai-foundations', 'AI Foundations'],
      ['gone', undefined],
    ]);
    expect(projectsForCourse(projects, 'ai-foundations').map((p) => p.id)).toEqual(['demo']);
    expect(projectsForCourse(projects, 'other')).toEqual([]);
  });

  it('marks milestones reached and the next one, and leaves the tutor-only parts out', () => {
    const { projects, catalog } = setup();
    const progress: Progress = {
      ...emptyProgress(),
      projects: { demo: { status: 'in_progress', startedAt: '2026-11-01', milestones: [1], notes: ' Weekly update. ' } },
    };
    const view = getProjectView(projects, 'demo', catalog, progress)!;
    expect(view.milestones.map((m) => [m.title, m.state])).toEqual([
      ['First', 'reached'],
      ['Second', 'next'],
      ['Third', 'todo'],
    ]);
    expect(view).toMatchObject({ status: 'in_progress', reached: 1, startedOn: 'Nov 1, 2026', completedOn: null, notes: 'Weekly update.' });
    expect(view.brief).toEqual(['Make **something** real.']);
    expect(view.milestones[0]).toEqual({ title: 'First', body: 'Do it.', state: 'reached' });
    // "Done when:", the review criteria, "Going further" and the coaching notes are for the tutor.
    const shown = JSON.stringify({ brief: view.brief, milestones: view.milestones });
    for (const hidden of ['Done when', 'It works.', 'Keep going.', 'Tutor only']) expect(shown).not.toContain(hidden);

    const done = getProjectView(projects, 'demo', catalog, {
      ...emptyProgress(),
      projects: { demo: { status: 'done', milestones: [1, 2, 3], review: { 1: 'met', 2: 'partly' }, completedAt: '2026-11-05' } },
    })!;
    expect(done.milestones.every((m) => m.state === 'reached')).toBe(true);
    expect(getProjectView(projects, 'ghost', catalog, emptyProgress())).toBeUndefined();
  });

  it('splits inline Markdown into escaped segments', () => {
    expect(inlineSegments('Make **something** real with `code` <b>.')).toEqual([
      { kind: 'text', text: 'Make ' },
      { kind: 'strong', text: 'something' },
      { kind: 'text', text: ' real with ' },
      { kind: 'code', text: 'code' },
      { kind: 'text', text: ' <b>.' },
    ]);
    expect(inlineSegments('plain')).toEqual([{ kind: 'text', text: 'plain' }]);
  });
});
