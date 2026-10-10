/**
 * The LessonFolk permissions of an MCP access token (OAuth scopes, `LESSONFOLK_AUTH=oauth`).
 *
 * - `lessonfolk:read`: read the courses and the learner's progress.
 * - `lessonfolk:write`: also save progress (profile, path, lessons, scores, notes), reset a
 *   course and import a progress file. It includes reading.
 *
 * Compatibility rule (deliberate): clients that never heard of these scopes must keep working.
 * Dynamic registration gives a client every scope, and an authorization request without a
 * `scope` parameter gets all of the client's scopes, so Claude Code, Codex and ChatGPT get both
 * by default. A token that carries no `lessonfolk:*` scope at all (a client that asked for the
 * OpenID scopes only, or a token issued before these scopes existed) keeps full access. As soon
 * as a token carries one, it is limited to what it names: the learner can narrow a request on
 * the consent page, and a client that asks for `lessonfolk:read` only is held to reading.
 */
export const SCOPE_READ = 'lessonfolk:read';
export const SCOPE_WRITE = 'lessonfolk:write';
export const LESSONFOLK_SCOPES = [SCOPE_READ, SCOPE_WRITE] as const;

export interface McpAccess {
  read: boolean;
  write: boolean;
}

export const FULL_ACCESS: McpAccess = { read: true, write: true };

/** The scope claim of an access token: a space-separated string (RFC 9068) or an array. */
export function parseScopeClaim(claim: unknown): string[] | undefined {
  if (typeof claim === 'string') return claim.split(/\s+/).filter(Boolean);
  if (Array.isArray(claim)) return claim.filter((value): value is string => typeof value === 'string');
  return undefined;
}

/** What a token's scopes allow. `undefined` (no token scopes: `LESSONFOLK_AUTH=none`) is full access. */
export function accessFromScopes(scopes: readonly string[] | undefined): McpAccess {
  if (!scopes || !scopes.some((scope) => (LESSONFOLK_SCOPES as readonly string[]).includes(scope))) return FULL_ACCESS;
  const write = scopes.includes(SCOPE_WRITE);
  return { read: write || scopes.includes(SCOPE_READ), write };
}

/** The permissions an authorization request asks for, for the consent page. */
export function requestedAccess(scope: string | null | undefined): McpAccess & { specific: boolean } {
  const scopes = parseScopeClaim(scope ?? '') ?? [];
  const specific = scopes.some((s) => (LESSONFOLK_SCOPES as readonly string[]).includes(s));
  return { ...accessFromScopes(scopes), specific };
}

/**
 * The scopes to grant when the learner turned "save my progress" off: the request without
 * `lessonfolk:write` (and with `lessonfolk:read`). Undefined when nothing needs narrowing.
 */
export function withoutWrite(scope: string | null | undefined): string | undefined {
  const scopes = parseScopeClaim(scope ?? '') ?? [];
  if (!scopes.includes(SCOPE_WRITE)) return undefined;
  const kept = scopes.filter((s) => s !== SCOPE_WRITE);
  if (!kept.includes(SCOPE_READ)) kept.push(SCOPE_READ);
  return kept.join(' ');
}
