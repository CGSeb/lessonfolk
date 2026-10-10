import { connect, isUnreachableError, learner, migrationUrl, redactUrl, runMigrations, user, type Database } from '@lessonfolk/db';
import { AuthConfigError, LOCAL_USER } from './settings.ts';

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

/**
 * `LESSONFOLK_AUTH=none` keeps the local learner's progress in Postgres: apply pending
 * migrations and create the local learner. Safe to run on every start. Throws
 * AuthConfigError, saying what to do, when the database cannot be reached or prepared.
 */
export async function prepareLocalDatabase(url: string, ownerUrl: string = migrationUrl()): Promise<void> {
  try {
    // Migrations need the owner; the learner row only needs the runtime role.
    await runMigrations(ownerUrl);
    const { db, close } = connect(url, { max: 1 });
    try {
      await ensureLocalLearner(db);
    } finally {
      await close();
    }
  } catch (error) {
    if (isUnreachableError(error)) {
      throw new AuthConfigError(
        `your progress is kept in Postgres, but the database at ${redactUrl(url)} cannot be reached. ` +
          'Start it from the LessonFolk folder with "docker compose up -d db" (Docker must be running), ' +
          'or set DATABASE_URL to your Postgres server.',
      );
    }
    throw new AuthConfigError(`could not prepare the database at ${redactUrl(url)}: ${(error as Error).message}`);
  }
}
