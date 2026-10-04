import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Builds the dashboard once for the end-to-end tests in tests/e2e/.
    globalSetup: ['./tests/e2e/global-setup.ts'],
  },
});
