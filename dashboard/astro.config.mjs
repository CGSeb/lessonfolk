// @ts-check
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'astro/config';
import node from '@astrojs/node';
import { authStartupChecks } from './src/lib/auth/dev-integration.ts';
import { CSP_DIRECTIVES, STYLE_ATTRIBUTE_SOURCE } from './src/lib/security-headers.ts';

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
  // checkOrigin is off: cross-site form posts are refused in src/middleware.ts instead
  // (src/lib/auth/origin-check.ts), which lets MCP clients post to the OAuth token endpoint.
  // allowedDomains: the Node adapter only trusts a `Host` header that matches this list, and
  // otherwise builds `Astro.url` as `localhost:<port>`. Without sign-in the pages use the
  // address of the request (the MCP address on the Connect page, form posts, the sitemap), so
  // the names of this computer are listed. With sign-in they use LESSONFOLK_BASE_URL, which is
  // only known when the server starts, so the hosted address does not need to be here.
  // The CSP (hashes for inline scripts and styles, no 'unsafe-inline') is built by Astro; see
  // src/lib/security-headers.ts. It is only active in builds, not in `astro dev`.
  security: {
    checkOrigin: false,
    allowedDomains: [{ hostname: 'localhost' }, { hostname: '**.localhost' }, { hostname: '127.0.0.1' }],
    csp: {
      directives: [...CSP_DIRECTIVES],
      scriptDirective: { resources: ["'self'"] },
      styleDirective: { resources: ["'self'", { resource: STYLE_ATTRIBUTE_SOURCE, kind: 'attribute' }] },
    },
  },
});
