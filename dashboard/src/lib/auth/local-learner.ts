import { learner, user, type Database } from '@lessonfolk/db';
import { LOCAL_USER } from './settings.ts';

/**
 * Create the single learner of `LESSONFOLK_AUTH=none` (a `user` row and its
 * `learner` row) if it does not exist yet. Safe to run on every start.
 */
export async function ensureLocalLearner(db: Database): Promise<void> {
  await db.transaction(async (tx) => {
    await tx
      .insert(user)
      .values({ id: LOCAL_USER.id, name: LOCAL_USER.name, email: LOCAL_USER.email, emailVerified: true })
      .onConflictDoNothing();
    await tx.insert(learner).values({ userId: LOCAL_USER.id }).onConflictDoNothing();
  });
}

/** Give every new signed-in user their (empty) learner row. */
export async function ensureLearner(db: Database, userId: string): Promise<void> {
  await db.insert(learner).values({ userId }).onConflictDoNothing();
}
