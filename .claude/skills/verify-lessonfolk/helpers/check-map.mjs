#!/usr/bin/env node
/**
 * Checks the verification map of the verify-lessonfolk skill (features/README.md and one sheet
 * per feature) without launching anything:
 *
 *   node .claude/skills/verify-lessonfolk/helpers/check-map.mjs      (or: npm run verify:check)
 *
 * - every sheet is listed in the README index, and every listed sheet exists;
 * - each sheet has an H1 and exactly the four H2 sections of the contract, in order;
 * - "Driving it with verify" has `Preconditions:`, `States to exercise:` and at least one `verify` command;
 * - sub-feature ids are unique across the map;
 * - every `verify <command>` and `verify browser <action>` a sheet uses exists in verify.mjs.
 * Exits 1 on errors. Plain Node, no dependency.
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const SECTIONS = ['Sub-features', 'How to get to it (user POV)', 'Driving it with verify', 'Gotchas'];

const HERE = dirname(fileURLToPath(import.meta.url));
export const SKILL_DIR = join(HERE, '..');

/** Commands and browser actions verify.mjs really implements, read from its source. */
export function harnessVocabulary(source) {
  const commands = new Set((/const commands = \{([^}]*)\}/.exec(source)?.[1] ?? '').split(',').map((s) => s.trim()).filter(Boolean));
  const browserBody = source.slice(source.indexOf('async function browser()'), source.indexOf('async function http()'));
  const actions = new Set([...browserBody.matchAll(/case '([a-z-]+)':/g)].map((m) => m[1]));
  return { commands, actions };
}

/** Problems in a map given as { readme, sheets: { 'id.md': text }, harness }. Pure, for the tests. */
export function checkMap({ readme, sheets, harness }) {
  const errors = [];
  const { commands, actions } = harnessVocabulary(harness);
  const listed = [...readme.matchAll(/\]\(\.\/([^)]+\.md)\)/g)].map((m) => m[1]);
  for (const file of listed) if (!(file in sheets)) errors.push(`README lists ${file}, which does not exist`);
  for (const file of Object.keys(sheets)) if (!listed.includes(file)) errors.push(`${file} is not listed in the README index`);
  if (new Set(listed).size !== listed.length) errors.push('README lists a sheet twice');

  const subIds = new Map();
  for (const [file, text] of Object.entries(sheets)) {
    const at = (msg) => errors.push(`${file}: ${msg}`);
    if (!/^[a-z0-9]+(-[a-z0-9]+)*\.md$/.test(file)) at('file name must be the kebab-case feature id');
    if (!/^# \S/m.test(text)) at('missing H1 title');
    const h2 = [...text.matchAll(/^## (.+)$/gm)].map((m) => m[1].trim());
    if (JSON.stringify(h2) !== JSON.stringify(SECTIONS)) at(`H2 sections must be exactly ${SECTIONS.join(' / ')} (found ${h2.join(' / ') || 'none'})`);
    const section = (name) => text.split(new RegExp(`^## ${name.replace(/[()]/g, '\\$&')}$`, 'm'))[1]?.split(/^## /m)[0] ?? '';

    const subs = [...section('Sub-features').matchAll(/^- `([a-z0-9-]+)`/gm)].map((m) => m[1]);
    if (!subs.length) at('Sub-features lists no `id`');
    for (const id of subs) {
      if (subIds.has(id)) at(`sub-feature \`${id}\` is also in ${subIds.get(id)}`);
      subIds.set(id, file);
    }
    if (!/^- /m.test(section('How to get to it (user POV)'))) at('How to get to it lists no entry point');

    const driving = section('Driving it with verify');
    if (!/^Preconditions:/m.test(driving)) at('Driving it has no `Preconditions:`');
    if (!/^States to exercise:/m.test(driving)) at('Driving it has no `States to exercise:`');
    const uses = [...text.matchAll(/`verify ([a-z-]+)(?: ([a-z-]+))?/g)];
    if (!uses.length) at('no `verify` command');
    for (const [, command, action] of uses) {
      if (!commands.has(command)) at(`\`verify ${command}\` is not a command of verify.mjs`);
      // `verify browser` alone is prose naming the harness; an action written after it must exist.
      else if (command === 'browser' && action && !actions.has(action)) at(`\`verify browser ${action}\` is not an action of verify.mjs`);
    }
  }
  return errors;
}

export function loadMap(skillDir = SKILL_DIR) {
  const dir = join(skillDir, 'features');
  const readmePath = join(dir, 'README.md');
  if (!existsSync(readmePath)) throw new Error(`${readmePath} not found`);
  const sheets = Object.fromEntries(readdirSync(dir).filter((f) => f.endsWith('.md') && f !== 'README.md').map((f) => [f, readFileSync(join(dir, f), 'utf8')]));
  return { readme: readFileSync(readmePath, 'utf8'), sheets, harness: readFileSync(join(skillDir, 'helpers', 'verify.mjs'), 'utf8') };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const map = loadMap();
  const errors = checkMap(map);
  for (const e of errors) console.log(`error: ${e}`);
  console.log(errors.length ? `\n${errors.length} error(s)` : `verification map OK: ${Object.keys(map.sheets).length} feature sheets`);
  process.exit(errors.length ? 1 : 0);
}
