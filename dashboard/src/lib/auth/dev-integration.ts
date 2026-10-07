import type { AstroIntegration } from 'astro';
import { databaseUrl } from '@lessonfolk/db';
import { prepareLocalDatabase } from './local-learner.ts';
import { AuthConfigError, checkStartup, readAuthSettings } from './settings.ts';

/**
 * The startup checks of scripts/serve.ts, for `astro dev`: refuse to start with
 * bad sign-in settings, and in `none` mode check the address the dev server
 * really listens on, then prepare the database and the local learner.
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
          await prepareLocalDatabase(databaseUrl());
          logger.info('Sign-in is off (LESSONFOLK_AUTH=none): one local learner, on this computer only.');
        } catch (error) {
          if (error instanceof AuthConfigError) stop(error.message);
          throw error;
        }
      },
    },
  };
}
