import { defineConfig } from 'drizzle-kit';

// `npm run generate -w @lessonfolk/db` turns changes in src/schema.ts into a new
// SQL migration in drizzle/. Commit the generated files: they are applied in order
// when the app starts.
export default defineConfig({
  dialect: 'postgresql',
  schema: './src/schema.ts',
  out: './drizzle',
});
