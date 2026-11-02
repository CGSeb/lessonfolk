import { and, eq } from 'drizzle-orm';
import { account, type Database, user } from '@lessonfolk/db';
import type { Auth } from './auth.ts';
import { ensureLearner } from './local-learner.ts';
import type { DemoAccount } from './settings.ts';

/** Fixed ids, so the demo account is the same row after every restart. */
export const DEMO_USER_ID = 'demo-reviewer';
const DEMO_ACCOUNT_ID = 'demo-reviewer-credential';

/**
 * Make the demo account match the environment: its user, its learner and a password account
 * whose hash is the current LESSONFOLK_DEMO_PASSWORD. Safe to run before every demo sign-in.
 * The password is never stored in clear.
 */
export async function ensureDemoAccount(auth: Auth, db: Database, demo: DemoAccount): Promise<void> {
  const { password } = await auth.$context;
  await db
    .insert(user)
    .values({ id: DEMO_USER_ID, name: 'Demo reviewer', email: demo.email, emailVerified: true })
    .onConflictDoUpdate({ target: user.id, set: { email: demo.email } });
  await ensureLearner(db, DEMO_USER_ID);

  const [existing] = await db
    .select({ password: account.password })
    .from(account)
    .where(and(eq(account.userId, DEMO_USER_ID), eq(account.providerId, 'credential')))
    .limit(1);
  if (existing?.password && (await password.verify({ hash: existing.password, password: demo.password }))) return;

  const hash = await password.hash(demo.password);
  await db
    .insert(account)
    .values({ id: DEMO_ACCOUNT_ID, accountId: DEMO_USER_ID, providerId: 'credential', userId: DEMO_USER_ID, password: hash })
    .onConflictDoUpdate({ target: account.id, set: { password: hash } });
}
