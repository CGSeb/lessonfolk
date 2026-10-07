import type { AstroIntegration } from 'astro';
import { connect, redactUrl } from '@lessonfolk/db';
import { ensureLocalLearner } from './local-learner.ts';
import { AuthConfigError, checkStartup, readAuthSettings } from './settings.ts';

/**
 * The startup checks of scripts/serve.ts, for `astro dev`: refuse to start with
 * bad sign-in settings, and in `none` mode check the address the dev server
 * really listens on and create the local learner.
 */
export function authStartupChecks(): AstroIntegration {
  const stop = (message: string): never => {
    console.error(`\nLessonFolk cannot start: ${message}\n`);
    process.exit(1);
  };

  return {
    name: 'lessonfolk:auth-startup-checks',
    hooks: {
      'astro:server:start': async ({ address, logger }) => {
        try {
          const settings = readAuthSettings();
          checkStartup(settings, { host: address.address, from: 'astro dev --host' });
          if (settings.mode === 'oauth') {
            logger.info(`Sign-in with OAuth (LESSONFOLK_AUTH=oauth) at ${settings.baseURL}`);
            return;
          }
          const url = process.env.DATABASE_URL?.trim();
          if (url) {
            const { db, close } = connect(url, { max: 1 });
            try {
              await ensureLocalLearner(db);
            } catch (error) {
              stop(`could not create the local learner in ${redactUrl(url)}: ${(error as Error).message}`);
            } finally {
              await close();
            }
          }
          logger.info('Sign-in is off (LESSONFOLK_AUTH=none): one local learner, on this computer only.');
        } catch (error) {
          if (error instanceof AuthConfigError) stop(error.message);
          throw error;
        }
      },
    },
  };
}
