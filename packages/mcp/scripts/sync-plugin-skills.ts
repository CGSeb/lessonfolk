/**
 * Copies the tutor procedures (prompts/*.md) into the learner plugin's skills
 * (.claude/skills/lessonfolk-tutor/skills/<name>/SKILL.md), below their marker line.
 * An installed plugin has no access to this repository, so each skill carries the text itself;
 * prompts/*.md stays the single source. Run with `npm run plugin:sync` after editing a prompt.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

export const SKILLS = ['learn', 'progress', 'review'] as const;

/** Everything below this line of a SKILL.md is the copied procedure. */
export const MARKER = '<!-- The procedure below is copied by `npm run plugin:sync`: do not edit it here. -->';

const lf = (text: string) => text.replace(/\r\n/g, '\n');

export const promptPath = (name: string) => fileURLToPath(new URL(`../prompts/${name}.md`, import.meta.url));
export const skillPath = (name: string) =>
  fileURLToPath(new URL(`../../../.claude/skills/lessonfolk-tutor/skills/${name}/SKILL.md`, import.meta.url));

/** The skill's own head (frontmatter and introduction) followed by the procedure. */
export function withProcedure(skill: string, prompt: string): string {
  const at = lf(skill).indexOf(MARKER);
  if (at === -1) throw new Error('The skill has no marker line for the procedure.');
  return `${lf(skill).slice(0, at)}${MARKER}\n\n${lf(prompt).trim()}\n`;
}

export const synced = (name: string) => withProcedure(readFileSync(skillPath(name), 'utf8'), readFileSync(promptPath(name), 'utf8'));

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  for (const name of SKILLS) writeFileSync(skillPath(name), synced(name));
  console.log(`Synced the ${SKILLS.join(', ')} skills of the learner plugin.`);
}
