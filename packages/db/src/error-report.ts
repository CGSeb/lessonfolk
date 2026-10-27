/**
 * Error monitoring with a self-hosted GlitchTip (docs/privacy.md, "Error monitoring").
 *
 * Off unless ERROR_REPORT_DSN is set, so a LessonFolk you run yourself reports nothing. The event is
 * built here from scratch, field by field, instead of by an SDK that gathers the request, its headers,
 * cookies, query string, user and breadcrumbs: it holds the error's type, a scrubbed message, the
 * stack (file, function and line only), the release and a place name. Never add a request, a user id,
 * an address or a body to it. It is sent over the internal network of the server, never to a third party.
 */
import { randomUUID } from 'node:crypto';
import { describeErrorForLog } from './log-safe.ts';

export interface ErrorReportEnv {
  ERROR_REPORT_DSN?: string;
  LESSONFOLK_VERSION?: string;
}

export interface Dsn {
  /** Where events are posted: `<origin>/api/<project>/store/`. */
  url: string;
  key: string;
}

/** `http://<key>@host:port/<project id>`, or `undefined` when empty or not a DSN. */
export function parseDsn(value: string | undefined): Dsn | undefined {
  if (!value?.trim()) return undefined;
  try {
    const url = new URL(value.trim());
    const project = url.pathname.replace(/^\/+|\/+$/g, '');
    if (!url.username || !/^\d+$/.test(project) || !['http:', 'https:'].includes(url.protocol)) return undefined;
    return { url: `${url.protocol}//${url.host}/api/${project}/store/`, key: decodeURIComponent(url.username) };
  } catch {
    return undefined;
  }
}

const MAX_MESSAGE = 300;
const MAX_FRAMES = 30;

/** A message without what could identify someone: emails, URL query strings, long tokens, ids. */
export function scrubMessage(message: string): string {
  return message
    .replace(/[^\s@<>"']+@[^\s@<>"']+\.[^\s@<>"']+/g, '[email]')
    .replace(/\?[^\s"')]*/g, '?[query]')
    .replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, '[id]')
    .replace(/\b[A-Za-z0-9_-]{24,}\b/g, '[token]')
    .slice(0, MAX_MESSAGE);
}

interface Frame {
  filename: string;
  function?: string;
  lineno?: number;
  colno?: number;
}

/** The frames of an error's stack (oldest call first, as Sentry expects), with paths shortened to the app's own folders. */
export function stackFrames(stack: string | undefined): Frame[] {
  const frames: Frame[] = [];
  for (const line of (stack ?? '').split('\n')) {
    const match = /^\s*at (?:(.+?) \()?(.+?):(\d+):(\d+)\)?$/.exec(line);
    if (!match) continue;
    const [, fn, file, row, col] = match;
    const filename = file
      .replace(/^file:\/\//, '')
      .replace(/^.*?(node_modules\/|packages\/|dashboard\/)/, '$1')
      .replace(/^\/(?:app\/)?/, '');
    frames.push({ filename, function: fn, lineno: Number(row), colno: Number(col) });
  }
  return frames.reverse().slice(-MAX_FRAMES);
}

export interface ErrorEvent {
  event_id: string;
  timestamp: number;
  platform: 'node';
  level: 'error';
  release?: string;
  environment: string;
  tags: { where: string };
  exception: { values: [{ type: string; value: string; stacktrace: { frames: Frame[] } }] };
}

/** The event for an error. `where` is a fixed place name ("mcp tool", "page"), never data from a request. */
export function buildEvent(error: unknown, where: string, env: ErrorReportEnv = process.env): ErrorEvent {
  const isError = error instanceof Error;
  // describeErrorForLog already withholds the details of database errors (they hold learners' data).
  const message = scrubMessage(describeErrorForLog(error));
  return {
    event_id: randomUUID().replaceAll('-', ''),
    timestamp: Date.now() / 1000,
    platform: 'node',
    level: 'error',
    release: env.LESSONFOLK_VERSION || undefined,
    environment: 'production',
    tags: { where },
    exception: {
      values: [{ type: isError ? error.name || 'Error' : 'NonError', value: message, stacktrace: { frames: isError ? stackFrames(error.stack) : [] } }],
    },
  };
}

/** At most this many events per minute: a loop of failures must not flood the tracker nor the server. */
const MAX_PER_MINUTE = 20;
const sent: number[] = [];
const SEND_TIMEOUT_MS = 3000;

/** Forget the rate-limit window (tests). */
export function resetErrorReportLimit(): void {
  sent.length = 0;
}

/**
 * Report an error to the tracker, if one is configured. Never throws and never waits on the tracker
 * for long: a down tracker must not break the app. Resolves when the event is sent or dropped.
 */
export async function reportError(
  error: unknown,
  where: string,
  { env = process.env, fetchImpl = fetch }: { env?: ErrorReportEnv; fetchImpl?: typeof fetch } = {},
): Promise<void> {
  try {
    const dsn = parseDsn(env.ERROR_REPORT_DSN);
    if (!dsn) return;
    const now = Date.now();
    while (sent.length && now - sent[0] > 60_000) sent.shift();
    if (sent.length >= MAX_PER_MINUTE) return;
    sent.push(now);
    await fetchImpl(dsn.url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Sentry-Auth': `Sentry sentry_version=7, sentry_key=${dsn.key}, sentry_client=lessonfolk/1` },
      body: JSON.stringify(buildEvent(error, where, env)),
      signal: AbortSignal.timeout(SEND_TIMEOUT_MS),
    });
  } catch {
    // The tracker is unreachable or refused the event: nothing to do, the log line already exists.
  }
}
