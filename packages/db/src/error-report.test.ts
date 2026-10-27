import { DrizzleQueryError } from 'drizzle-orm';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { buildEvent, parseDsn, reportError, resetErrorReportLimit, scrubMessage, stackFrames } from './error-report.ts';

const env = { ERROR_REPORT_DSN: 'http://abc123@glitchtip:8000/1', LESSONFOLK_VERSION: 'v1.2.3' };

describe('parseDsn', () => {
  it('reads the store address and the key', () => {
    expect(parseDsn('http://abc123@glitchtip:8000/1')).toEqual({ url: 'http://glitchtip:8000/api/1/store/', key: 'abc123' });
  });
  it('is off for nothing or something that is not a DSN', () => {
    for (const value of [undefined, '', '  ', 'nonsense', 'http://glitchtip:8000/1', 'http://k@glitchtip/x', 'ftp://k@glitchtip/1']) expect(parseDsn(value)).toBeUndefined();
  });
});

describe('scrubMessage', () => {
  it('removes emails, query strings, ids and long tokens', () => {
    const text = scrubMessage('failed for jane@example.com at /oauth?code=secret&state=x id 123e4567-e89b-12d3-a456-426614174000 token AbCdEfGhIjKlMnOpQrStUvWxYz012345');
    for (const secret of ['jane', 'example.com', 'secret', 'state=x', '123e4567', 'AbCdEfGhIjKlMnOpQrStUvWxYz']) expect(text).not.toContain(secret);
  });
  it('is short', () => {
    expect(scrubMessage('x '.repeat(500)).length).toBeLessThanOrEqual(300);
  });
});

describe('buildEvent', () => {
  it('holds the error, the release and the place, and nothing else', () => {
    const event = buildEvent(new TypeError('x is not a function'), 'page', env);
    expect(event.release).toBe('v1.2.3');
    expect(event.tags).toEqual({ where: 'page' });
    expect(event.exception.values[0]).toMatchObject({ type: 'TypeError', value: 'TypeError: x is not a function' });
    expect(Object.keys(event).sort()).toEqual(['environment', 'event_id', 'exception', 'level', 'platform', 'release', 'tags', 'timestamp']);
    expect(event.event_id).toMatch(/^[0-9a-f]{32}$/);
  });

  it('keeps a failed query’s parameters out of the event', () => {
    const error = new DrizzleQueryError('insert into lesson_progress (notes) values ($1)', ['my private notes', 'user-123', 'jane@example.com']);
    const body = JSON.stringify(buildEvent(error, 'mcp tool', env));
    for (const secret of ['my private notes', 'user-123', 'jane@example.com', 'lesson_progress']) expect(body).not.toContain(secret);
  });

  it('copes with a value that is not an error', () => {
    expect(buildEvent('oops', 'page', env).exception.values[0].type).toBe('NonError');
  });
});

describe('stackFrames', () => {
  it('keeps file, function and line, with paths inside the app', () => {
    const frames = stackFrames('Error: boom\n    at run (file:///app/packages/mcp/src/server.ts:85:5)\n    at /app/dashboard/dist/server/chunks/a.mjs:10:3');
    expect(frames).toEqual([
      { filename: 'dashboard/dist/server/chunks/a.mjs', function: undefined, lineno: 10, colno: 3 },
      { filename: 'packages/mcp/src/server.ts', function: 'run', lineno: 85, colno: 5 },
    ]);
  });
});

describe('reportError', () => {
  beforeEach(resetErrorReportLimit);

  it('posts the event with the key', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(new Response('{}'));
    await reportError(new Error('boom'), 'page', { env, fetchImpl });
    expect(fetchImpl).toHaveBeenCalledOnce();
    const [url, init] = fetchImpl.mock.calls[0];
    expect(url).toBe('http://glitchtip:8000/api/1/store/');
    expect(init.headers['X-Sentry-Auth']).toContain('sentry_key=abc123');
    expect(JSON.parse(init.body).exception.values[0].value).toBe('Error: boom');
  });

  it('sends nothing without a DSN', async () => {
    const fetchImpl = vi.fn();
    await reportError(new Error('boom'), 'page', { env: {}, fetchImpl });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('never throws when the tracker is down', async () => {
    const fetchImpl = vi.fn().mockRejectedValue(new Error('ECONNREFUSED'));
    await expect(reportError(new Error('boom'), 'page', { env, fetchImpl })).resolves.toBeUndefined();
  });

  it('caps the events per minute', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(new Response('{}'));
    for (let i = 0; i < 50; i += 1) await reportError(new Error('loop'), 'page', { env, fetchImpl });
    expect(fetchImpl).toHaveBeenCalledTimes(20);
  });
});
