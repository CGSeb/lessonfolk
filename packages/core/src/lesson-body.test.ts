import { describe, expect, it } from 'vitest';
import { checkLessonBody } from './lesson-body.ts';

const IDEAS = '1. One.\n2. Two.\n3. Three.';
const CHECKS = '1. Why?\n   Good answer: because.';

/** A structurally valid body, with any section overridden or dropped (`null`). */
function body(sections: Record<string, string | null> = {}): string {
  const all: Record<string, string | null> = {
    'Key ideas': IDEAS,
    'Teaching notes': 'Notes.',
    'Check your understanding': CHECKS,
    Exercise: null,
    'Completion criteria': 'Done.',
    'Going further': null,
    ...sections,
  };
  return Object.entries(all)
    .filter(([, content]) => content !== null)
    .map(([title, content]) => `## ${title}\n${content}\n`)
    .join('\n');
}

describe('checkLessonBody', () => {
  it('accepts a valid body, with or without optional sections', () => {
    expect(checkLessonBody(body(), 15)).toEqual({ errors: [], warnings: [] });
    expect(
      checkLessonBody(body({ Exercise: 'Do it.', 'Going further': 'Read more.' }), 15),
    ).toEqual({ errors: [], warnings: [] });
  });

  it('accepts Windows line endings and closing hashes on headings', () => {
    const crlf = body().replace(/\n/g, '\r\n').replace('## Teaching notes', '## Teaching notes ##');
    expect(checkLessonBody(crlf, 15).errors).toEqual([]);
  });

  it('reports each missing required section', () => {
    expect(checkLessonBody(body({ 'Teaching notes': null }), 15).errors).toEqual([
      'missing section "## Teaching notes"',
    ]);
    expect(checkLessonBody('', 15).errors).toHaveLength(4);
  });

  it('reports a misspelled heading with a suggestion', () => {
    const misspelled = body().replace('## Key ideas', '## Key Ideas');
    expect(checkLessonBody(misspelled, 15).errors).toEqual([
      'unknown section "## Key Ideas"; did you mean "## Key ideas"?',
      'missing section "## Key ideas"',
    ]);
  });

  it('lists the allowed sections for an unrelated heading', () => {
    const [error] = checkLessonBody(body() + '\n## Summary\nText.', 15).errors;
    expect(error).toMatch(/^unknown section "## Summary"; expected one of "## Key ideas", /);
  });

  it('reports a duplicated section', () => {
    expect(checkLessonBody(body() + '\n## Teaching notes\nAgain.', 15).errors).toContain(
      'section "## Teaching notes" appears more than once',
    );
  });

  it('reports sections out of order, including optional ones', () => {
    const swapped = body()
      .replace('## Key ideas', '## TMP')
      .replace('## Teaching notes', '## Key ideas')
      .replace('## TMP', '## Teaching notes');
    expect(checkLessonBody(swapped, 15).errors).toEqual([
      'section "## Key ideas" must come before "## Teaching notes"',
    ]);
    const lateExercise = body({ 'Going further': 'More.' }) + '\n## Exercise\nDo it.';
    expect(checkLessonBody(lateExercise, 15).errors).toEqual([
      'section "## Exercise" must come before "## Going further"',
    ]);
  });

  it('ignores headings inside fenced code blocks and deeper headings', () => {
    const withCode = body({
      'Teaching notes': '### Tips\n```markdown\n## Not a section\n```',
    });
    expect(checkLessonBody(withCode, 15).errors).toEqual([]);
  });

  it('requires a "Good answer:" line under every question', () => {
    const checks = '1. First?\n   Good answer: yes.\n2. Second?\n3. Third?\n   **Good answer:** yes.';
    expect(checkLessonBody(body({ 'Check your understanding': checks }), 15).errors).toEqual([
      'question 2 in "## Check your understanding" has no "Good answer:" line',
    ]);
  });

  it('requires at least one numbered question', () => {
    expect(
      checkLessonBody(body({ 'Check your understanding': 'Ask something.' }), 15).errors,
    ).toEqual(['"## Check your understanding" has no numbered questions']);
  });

  it('warns about guideline drift without raising errors', () => {
    const thin = checkLessonBody(body({ 'Key ideas': '1. Only.\n2. Two.' }), 15);
    expect(thin.errors).toEqual([]);
    expect(thin.warnings).toEqual([
      '"## Key ideas" has 2 numbered ideas; guidelines suggest 3–6',
    ]);

    const many = Array.from({ length: 7 }, (_, i) => `${i + 1}. Idea.`).join('\n');
    expect(checkLessonBody(body({ 'Key ideas': many }), 15).warnings).toHaveLength(1);

    expect(checkLessonBody(body(), 5).warnings).toEqual([
      'estimatedMinutes is 5; guidelines suggest 10–25 minutes',
    ]);
    expect(checkLessonBody(body(), 10).warnings).toEqual([]);
    expect(checkLessonBody(body(), 25).warnings).toEqual([]);
    expect(checkLessonBody(body(), 26).warnings).toHaveLength(1);
  });

  it('counts only top-level numbered items as key ideas', () => {
    const nested = '1. One.\n   1. Sub-point.\n2. Two.\n3. Three.';
    expect(checkLessonBody(body({ 'Key ideas': nested }), 15).warnings).toEqual([]);
  });
});
