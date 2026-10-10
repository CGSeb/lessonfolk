import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { loadCatalog } from './courses.ts';
import { REVIEW_CRITERIA, reviewBrief, selectLessons } from './lesson-review.ts';

const courses = loadCatalog('en', resolve(__dirname, '../tests/fixtures/courses-valid'));
const [course] = courses;

describe('selectLessons', () => {
  const ids = (filters?: string[]) => selectLessons(courses, filters).selected.map((s) => s.lesson.id);

  it('selects every lesson without a filter', () => {
    expect(ids()).toEqual(course.lessons.map((l) => l.id));
  });

  it('selects by course id or lesson id, in catalog order', () => {
    expect(ids(['ai-foundations'])).toHaveLength(3);
    expect(ids(['ai-foundations/03-what-is-an-llm', 'ai-foundations/01-what-is-ai'])).toEqual([
      'ai-foundations/01-what-is-ai',
      'ai-foundations/03-what-is-an-llm',
    ]);
  });

  it('reports filters that match nothing', () => {
    expect(selectLessons(courses, ['ai-foundations', 'nope', 'ai-foundations/09-x']).unknown).toEqual([
      'nope',
      'ai-foundations/09-x',
    ]);
  });
});

describe('reviewBrief', () => {
  const { selected } = selectLessons(courses, ['ai-foundations/02-how-machines-learn']);
  const brief = reviewBrief(courses, selected, (lesson) => `courses/en/${lesson.id}.md`);

  it('gives every criterion of the rubric', () => {
    for (const { id, question } of REVIEW_CRITERIA) expect(brief).toContain(`- ${id}: ${question}`);
  });

  it('lists only the selected lessons to review, with the path to read', () => {
    expect(brief).toContain('## Lessons to review (1)');
    expect(brief).toContain(
      '- courses/en/ai-foundations/02-how-machines-learn.md (beginner, 20 min, course "AI Foundations")',
    );
    expect(brief).not.toContain('- courses/en/ai-foundations/01-what-is-ai.md');
  });

  it('outlines the whole catalog for the overlap check', () => {
    expect(brief).toContain('ai-foundations (beginner, prerequisites: none): AI Foundations');
    for (const lesson of course.lessons) {
      expect(brief).toContain(`${lesson.id}: ${lesson.title}`);
      for (const objective of lesson.objectives) expect(brief).toContain(objective);
    }
  });
});
