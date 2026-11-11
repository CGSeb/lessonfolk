import { describe, expect, it } from 'vitest';
import { checkProjectBody, parseProjectContent } from './project-body.ts';

const milestone = (n: number, doneWhen = true) =>
  `${n}. **Step ${n}.** Reach something.\n${doneWhen ? '   Done when: the learner shows it.\n' : ''}`;

function body({
  milestones = 3,
  brief = 'Make something real.',
  review = '1. It works.\n2. It is clear.',
  extra = '',
} = {}) {
  return [
    `## Brief\n${brief}\n`,
    `## Milestones\n${Array.from({ length: milestones }, (_, i) => milestone(i + 1)).join('')}`,
    '## Coaching notes\n- Ask, do not tell.\n',
    `## Review\n${review}\n`,
    extra,
  ].join('\n');
}

describe('checkProjectBody', () => {
  it('accepts a well-formed project and counts milestones and criteria', () => {
    expect(checkProjectBody(body({ extra: '## Going further\n- More.\n' }), 2)).toEqual({
      errors: [],
      warnings: [],
      milestones: 3,
      reviewCriteria: 2,
    });
  });

  it('reports missing, unknown and out-of-order sections', () => {
    const { errors } = checkProjectBody('## Milestones\n1. A\n   Done when: x\n## Brief\nB\n## Exercise\nC\n', 2);
    expect(errors).toEqual([
      expect.stringMatching(/^unknown section "## Exercise"; expected one of "## Brief"/),
      'missing section "## Coaching notes"',
      'missing section "## Review"',
      'section "## Brief" must come before "## Milestones"',
    ]);
  });

  it('suggests the intended heading for a typo', () => {
    const { errors } = checkProjectBody(body().replace('## Coaching notes', '## coaching note'), 2);
    expect(errors).toContain('unknown section "## coaching note"; did you mean "## Coaching notes"?');
  });

  it('requires a "Done when:" line on every milestone', () => {
    const text = body().replace(milestone(2), milestone(2, false));
    expect(checkProjectBody(text, 2).errors).toEqual(['milestone 2 in "## Milestones" has no "Done when:" line']);
  });

  it('requires a brief, milestones and numbered review criteria', () => {
    expect(checkProjectBody(body({ brief: '  ', review: 'Looks good.' }), 2).errors).toEqual([
      '"## Brief" is empty',
      '"## Review" has no numbered criteria',
    ]);
    expect(checkProjectBody(body({ milestones: 0 }), 2).errors).toEqual(['"## Milestones" has no numbered milestones']);
  });

  it('warns when milestones or hours stray from the guidelines', () => {
    expect(checkProjectBody(body({ milestones: 2 }), 12).warnings).toEqual([
      '"## Milestones" has 2 milestones; guidelines suggest 3–6',
      'estimatedHours is 12; guidelines suggest 1–10 hours',
    ]);
    expect(checkProjectBody(body({ milestones: 7 }), 0.5).warnings).toHaveLength(2);
  });
});

describe('parseProjectContent', () => {
  it('returns the learner-facing parts and never the coaching notes', () => {
    const content = parseProjectContent(
      [
        '## Brief',
        'Pick a task you do',
        'again and again.',
        '',
        'Your tutor is a **coach**.',
        '## Milestones',
        '1. **Choose the task.** Pick one real task.',
        '   Done when: the learner names the task',
        '   and who reads it.',
        '2. Write it. Done when: it is written.',
        '3. No line for this one.',
        '## Coaching notes',
        '- SECRET coaching advice.',
        '## Review',
        '1. The prompt gives',
        '   the context.',
        '2. Placeholders are marked.',
        '## Going further',
        '- Do it again',
        '  for a second task.',
        '- Add an example.',
      ].join('\n'),
    );
    expect(content).toEqual({
      brief: ['Pick a task you do again and again.', 'Your tutor is a **coach**.'],
      milestones: [
        { title: 'Choose the task', body: 'Pick one real task.', doneWhen: 'the learner names the task and who reads it.' },
        { title: '', body: 'Write it.', doneWhen: 'it is written.' },
        { title: '', body: 'No line for this one.', doneWhen: '' },
      ],
      review: ['The prompt gives the context.', 'Placeholders are marked.'],
      goingFurther: ['Do it again for a second task.', 'Add an example.'],
    });
    expect(JSON.stringify(content)).not.toContain('SECRET');
  });
});
