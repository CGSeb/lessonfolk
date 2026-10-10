import { DrizzleQueryError } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';
import { describeErrorForLog } from './log-safe.ts';

describe('describeErrorForLog', () => {
  it('keeps the learner’s data out of a failed query’s log line', () => {
    const cause = Object.assign(new Error('invalid input syntax: "my private notes"'), { code: '22007' });
    const error = new DrizzleQueryError('insert into lesson_progress (notes) values ($1)', ['my private notes', 'user-123'], cause);
    const line = describeErrorForLog(error);
    expect(line).toContain('22007');
    for (const secret of ['my private notes', 'user-123', 'lesson_progress']) expect(line).not.toContain(secret);
  });

  it('withholds the details of any database error, even without a code', () => {
    const error = new DrizzleQueryError('select 1', ['secret@example.test']);
    expect(describeErrorForLog(error)).not.toContain('secret@example.test');
  });

  it('keeps the message of other errors, which hold no learner data', () => {
    expect(describeErrorForLog(new TypeError('x is not a function'))).toBe('TypeError: x is not a function');
    expect(describeErrorForLog('oops')).toBe('non-error value thrown');
  });
});
