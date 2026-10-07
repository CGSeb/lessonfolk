// Text imports (`import text from './file.md?raw'`), resolved by Vite: Astro's build and Vitest.
declare module '*.md?raw' {
  const text: string;
  export default text;
}
