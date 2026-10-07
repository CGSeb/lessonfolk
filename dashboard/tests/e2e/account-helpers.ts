/** Helpers for the account page tests: forms as a browser sends them, and the learner's rows. */
import { eq } from 'drizzle-orm';
import { account, learner, lessonProgress, progressEvent, session, user, type Database } from '@lessonfolk/db';

/** A multipart/form-data body (what a form with a file input sends). */
export function multipartForm(fields: Record<string, string | { filename: string; content: string }>): {
  body: string;
  contentType: string;
} {
  const boundary = `----lessonfolk-test-${Math.random().toString(16).slice(2)}`;
  let body = '';
  for (const [name, value] of Object.entries(fields)) {
    body += `--${boundary}\r\n`;
    if (typeof value === 'string') {
      body += `Content-Disposition: form-data; name="${name}"\r\n\r\n${value}\r\n`;
    } else {
      body += `Content-Disposition: form-data; name="${name}"; filename="${value.filename}"\r\nContent-Type: application/json\r\n\r\n${value.content}\r\n`;
    }
  }
  body += `--${boundary}--\r\n`;
  return { body, contentType: `multipart/form-data; boundary=${boundary}` };
}

/** How many rows `userId` has in each table that holds their data. */
export async function rowCounts(db: Database, userId: string) {
  const count = async (rows: Promise<unknown[]>) => (await rows).length;
  return {
    user: await count(db.select().from(user).where(eq(user.id, userId))),
    account: await count(db.select().from(account).where(eq(account.userId, userId))),
    session: await count(db.select().from(session).where(eq(session.userId, userId))),
    learner: await count(db.select().from(learner).where(eq(learner.userId, userId))),
    lessonProgress: await count(db.select().from(lessonProgress).where(eq(lessonProgress.userId, userId))),
    progressEvent: await count(db.select().from(progressEvent).where(eq(progressEvent.userId, userId))),
  };
}

/** The value of the hidden `progress` field of the import preview (the checked file). */
export function previewedProgress(html: string): string {
  const match = /<input type="hidden" name="progress" value="([^"]*)"/.exec(html);
  if (!match) throw new Error('No import confirmation form on the page');
  const named: Record<string, string> = { quot: '"', apos: "'", lt: '<', gt: '>', amp: '&' };
  return match[1].replace(/&(#x[0-9a-f]+|#\d+|\w+);/gi, (entity, code: string) => {
    if (code[0] !== '#') return named[code.toLowerCase()] ?? entity;
    return String.fromCodePoint(code[1].toLowerCase() === 'x' ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10));
  });
}
