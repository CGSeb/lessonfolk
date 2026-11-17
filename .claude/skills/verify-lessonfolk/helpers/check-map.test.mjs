/** Tests of check-map.mjs: `npm run verify:test`. They run on the real map, then break it on purpose. */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { checkMap, harnessVocabulary, loadMap } from './check-map.mjs';

const map = loadMap();
const errorsOf = (change) => {
  const copy = structuredClone(map);
  change(copy);
  return checkMap(copy).join('\n');
};
const first = Object.keys(map.sheets)[0];

test('the real map passes', () => {
  assert.deepEqual(checkMap(map), []);
});

test('the harness vocabulary is read from verify.mjs', () => {
  const { commands, actions } = harnessVocabulary(map.harness);
  for (const c of ['launch', 'doctor', 'browser', 'http', 'db', 'teardown']) assert.ok(commands.has(c), c);
  for (const a of ['goto', 'click', 'fill', 'expect-text', 'snapshot', 'cookies']) assert.ok(actions.has(a), a);
});

test('a sheet missing from the index, or an index entry with no sheet, is an error', () => {
  assert.match(errorsOf((m) => (m.sheets['ghost.md'] = m.sheets[first])), /ghost\.md is not listed/);
  assert.match(errorsOf((m) => delete m.sheets[first]), new RegExp(`README lists ${first}`));
});

test('the four sections are required, in order', () => {
  assert.match(errorsOf((m) => (m.sheets[first] = m.sheets[first].replace('## Gotchas', '## Notes'))), /H2 sections must be exactly/);
  assert.match(errorsOf((m) => (m.sheets[first] += '\n## Code\n- src/**\n')), /H2 sections must be exactly/);
});

test('Driving it needs preconditions and states', () => {
  assert.match(errorsOf((m) => (m.sheets[first] = m.sheets[first].replace('Preconditions:', 'Before:'))), /no `Preconditions:`/);
  assert.match(errorsOf((m) => (m.sheets[first] = m.sheets[first].replace('States to exercise:', 'States:'))), /no `States to exercise:`/);
});

test('a command or browser action the harness lacks is an error', () => {
  assert.match(errorsOf((m) => (m.sheets[first] += '\nRun `verify browser hover --role button`.\n')), /verify browser hover` is not an action/);
  assert.match(errorsOf((m) => (m.sheets[first] += '\nRun `verify seed --fixture x`.\n')), /verify seed` is not a command/);
});

test('sub-feature ids are unique across sheets', () => {
  const [a, b] = Object.keys(map.sheets);
  const id = /^- `([a-z0-9-]+)`/m.exec(map.sheets[a])[1];
  assert.match(errorsOf((m) => (m.sheets[b] = m.sheets[b].replace('## Sub-features\n\n', `## Sub-features\n\n- \`${id}\` duplicate.\n`))), new RegExp(`sub-feature \`${id}\` is also in`));
});
