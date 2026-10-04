// @ts-check
import { defineConfig } from 'astro/config';
import node from '@astrojs/node';

// The dashboard runs as a local Node server so it can read courses/ and
// .progress/ from disk on every request. It only listens on localhost.
export default defineConfig({
  output: 'server',
  adapter: node({ mode: 'standalone' }),
  server: { host: '127.0.0.1', port: 4321 },
});
