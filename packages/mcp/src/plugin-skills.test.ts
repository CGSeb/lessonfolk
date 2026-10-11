/**
 * The learner plugin's skills carry a copy of the tutor procedures, since an installed plugin
 * cannot read this repository: the copies must match prompts/*.md and name no repository file.
 */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { MARKER, SKILLS, skillPath, synced } from '../scripts/sync-plugin-skills.ts';

const text = (name: string) => readFileSync(skillPath(name), 'utf8').replace(/\r\n/g, '\n');

describe('learner plugin skills', () => {
  it.each(SKILLS)('%s carries the current procedure (else run `npm run plugin:sync`)', (name) => {
    expect(text(name)).toBe(synced(name));
  });

  it.each(SKILLS)('%s works without the repository', (name) => {
    const head = text(name).split(MARKER)[0]!;
    expect(head).toMatch(new RegExp(`^---\nname: ${name}\ndescription: .+\n---\n`));
    expect(text(name)).not.toMatch(/packages\/|AGENTS\.md|\.mcp\.json|docs\//);
  });
});
