// @ts-check
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'astro/config';
import node from '@astrojs/node';
import { authStartupChecks } from './src/lib/auth/dev-integration.ts';

// Settings (LESSONFOLK_AUTH, sign-in providers, DATABASE_URL…) from the repository's
// .env, if there is one; variables already set in the environment win.
const envFile = fileURLToPath(new URL('../.env', import.meta.url));
if (existsSync(envFile)) process.loadEnvFile(envFile);

// The dashboard runs as a Node server: it reads courses/ from disk and progress from
// Postgres on every request. The address it listens on (HOST, `astro dev --host`) is
// checked at startup by the sign-in settings (LESSONFOLK_AUTH=none: 127.0.0.1 only).
export default defineConfig({
  output: 'server',
  adapter: node({ mode: 'standalone' }),
  server: { port: 4321 },
  integrations: [authStartupChecks()],
});
