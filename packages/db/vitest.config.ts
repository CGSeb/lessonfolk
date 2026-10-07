import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

// Pick up DATABASE_URL from the repository's .env, if there is one (variables
// already set in the environment win).
const envFile = fileURLToPath(new URL('../../.env', import.meta.url));
if (existsSync(envFile)) process.loadEnvFile(envFile);

export default defineConfig({
  test: {
    // Database tests create and migrate a fresh database each, which can take a few
    // seconds on a cold Postgres.
    hookTimeout: 30_000,
    testTimeout: 15_000,
  },
});
