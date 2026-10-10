/**
 * Errors as they may be written to the server log. A failed query's error (Drizzle's
 * `DrizzleQueryError`, Postgres' own messages) carries the SQL parameters and offending values,
 * which are learners' data (profile, lesson notes, email). Logs get the error's name and code
 * only, never its message, `params`, `query` or `cause` text.
 */
export function describeErrorForLog(error: unknown): string {
  if (!(error instanceof Error)) return 'non-error value thrown';
  const code = errorCode(error);
  const databaseError = 'query' in error || 'params' in error || code !== undefined;
  const name = error.name || 'Error';
  if (databaseError) return code === undefined ? `${name} (database error, details withheld)` : `${name} (code ${code}, details withheld)`;
  return `${name}: ${error.message}`;
}

/** The first `code` found on the error or its causes (Postgres error code, `ECONNREFUSED`…). */
function errorCode(error: unknown): string | undefined {
  for (let current: unknown = error, depth = 0; current instanceof Error && depth < 5; current = current.cause, depth += 1) {
    const code = (current as { code?: unknown }).code;
    if (typeof code === 'string' || typeof code === 'number') return String(code);
  }
  return undefined;
}
