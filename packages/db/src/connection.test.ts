/** Pure unit tests: no Postgres needed. */
import { describe, expect, it } from 'vitest';
import { databaseUrl, DEFAULT_DATABASE_URL, isUnreachableError, redactUrl } from './connection.ts';
import { createTestDatabase, PostgresUnreachableError } from './testing.ts';

describe('databaseUrl', () => {
  it('uses DATABASE_URL when set', () => {
    expect(databaseUrl({ DATABASE_URL: 'postgres://u:p@db:5432/x' })).toBe('postgres://u:p@db:5432/x');
  });

  it('falls back to the docker compose database', () => {
    expect(databaseUrl({})).toBe(DEFAULT_DATABASE_URL);
    expect(databaseUrl({ DATABASE_URL: '  ' })).toBe(DEFAULT_DATABASE_URL);
  });
});

describe('redactUrl', () => {
  it('hides the password', () => {
    expect(redactUrl('postgres://lessonfolk:secret@127.0.0.1:5432/lessonfolk')).toBe(
      'postgres://lessonfolk:***@127.0.0.1:5432/lessonfolk',
    );
  });

  it('never echoes an invalid URL', () => {
    expect(redactUrl('not a url with secret')).toBe('(invalid DATABASE_URL)');
  });
});

describe('isUnreachableError', () => {
  const withCode = (code: string) => Object.assign(new Error(code), { code });

  it('recognises connection failures', () => {
    expect(isUnreachableError(withCode('ECONNREFUSED'))).toBe(true);
    expect(isUnreachableError(withCode('CONNECT_TIMEOUT'))).toBe(true);
    expect(isUnreachableError(new AggregateError([withCode('ECONNREFUSED')]))).toBe(true);
    expect(isUnreachableError(new Error('Failed query', { cause: withCode('ECONNREFUSED') }))).toBe(true);
  });

  it('leaves query errors alone', () => {
    expect(isUnreachableError(withCode('42P01'))).toBe(false);
    expect(isUnreachableError('ECONNREFUSED')).toBe(false);
  });
});

describe('createTestDatabase', () => {
  it('explains how to start Postgres when it is not reachable', async () => {
    // Port 1 on localhost: nothing listens there, the connection is refused.
    const error = await createTestDatabase('postgres://lessonfolk:secret@127.0.0.1:1/lessonfolk').catch((e) => e);
    expect(error).toBeInstanceOf(PostgresUnreachableError);
    expect(error.message).toContain('docker compose up -d db');
    expect(error.message).toContain('127.0.0.1:1');
    expect(error.message).not.toContain('secret');
  });
});
