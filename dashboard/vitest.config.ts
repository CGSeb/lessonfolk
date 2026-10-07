import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

// DATABASE_URL for the database tests (*.db.test.ts) from the repository's .env,
// if there is one (variables already set in the environment win).
const envFile = fileURLToPath(new URL('../.env', import.meta.url));
if (existsSync(envFile)) process.loadEnvFile(envFile);

export default defineConfig({
  test: {
    // Builds the dashboard once for the end-to-end tests in tests/e2e/.
    globalSetup: ['./tests/e2e/global-setup.ts'],
    // Database tests create and migrate a fresh database, then start the server.
    hookTimeout: 30_000,
    testTimeout: 20_000,
  },
});
