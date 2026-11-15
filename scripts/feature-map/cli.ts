/**
 * Feature map CLI.   npm run features -- <command>
 *
 *   list                              the index (id, name, summary)
 *   show <id>                         one sheet, as YAML
 *   files-for <file...>               features owning these files (code.paths and tests)
 *   impacted [--base <ref>] [--stdin] features touched by a change, plus those that depend on them
 *   untested                          features with no test or with coverage_gaps
 *   validate                          drift checks; exits 1 on errors (run in CI)
 *
 * Add --json for machine output. `impacted` reads `git diff --name-only <base>` (default main) plus
 * untracked files; with --stdin it reads a unified diff or a list of paths instead.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { changedFiles, featuresForFiles, filesFromText, impactedFeatures, loadMap, normalize, untestedFeatures, validate } from './lib.ts';

const root = fileURLToPath(new URL('../../', import.meta.url));
const [command, ...rest] = process.argv.slice(2);
const json = rest.includes('--json');
const flag = (name: string) => {
  const i = rest.indexOf(name);
  return i === -1 ? undefined : rest[i + 1];
};
const positional = rest.filter((a, i) => !a.startsWith('--') && rest[i - 1] !== '--base');
const out = (value: unknown, text: string) => console.log(json ? JSON.stringify(value, null, 2) : text);

function hitLines(hits: ReturnType<typeof featuresForFiles>): string {
  if (!hits.length) return '(no feature)';
  return hits
    .map((h) => `${h.id}  [${h.reason}${h.via ? ` via ${h.via}` : ''}]${h.files.length ? `  ${h.files.join(', ')}` : ''}`)
    .join('\n');
}

try {
  const map = loadMap(root);
  switch (command) {
    case 'list':
      out(map.index, map.index.map((e) => `${e.id.padEnd(22)} ${e.summary}`).join('\n'));
      break;
    case 'show': {
      const entry = map.index.find((e) => e.id === positional[0]);
      if (!entry) throw new Error(`unknown feature "${positional[0]}" (try: list)`);
      console.log(readFileSync(`${root}${entry.file}`, 'utf8'));
      break;
    }
    case 'files-for': {
      if (!positional.length) throw new Error('usage: files-for <file...>');
      const hits = featuresForFiles(map, positional.map(normalize));
      out(hits, hitLines(hits));
      break;
    }
    case 'impacted': {
      const files = rest.includes('--stdin') ? filesFromText(readFileSync(0, 'utf8')) : changedFiles(root, flag('--base') ?? 'main');
      const hits = impactedFeatures(map, files);
      const unowned = files.filter((f) => !featuresForFiles(map, [f]).length);
      out({ files, hits, unowned }, `${files.length} changed file(s)\n${hitLines(hits)}${unowned.length ? `\n\nnot in any feature: ${unowned.join(', ')}` : ''}`);
      break;
    }
    case 'untested': {
      const list = untestedFeatures(map);
      out(list, list.length ? list.map((u) => `${u.id}\n${u.problems.map((p) => `  - ${p}`).join('\n')}`).join('\n') : 'every feature has tests and no known gap');
      break;
    }
    case 'validate': {
      const { errors, warnings } = validate(map);
      if (json) console.log(JSON.stringify({ errors, warnings }, null, 2));
      else {
        for (const w of warnings) console.log(`warning: ${w}`);
        for (const e of errors) console.log(`error: ${e}`);
        console.log(errors.length ? `\n${errors.length} error(s), ${warnings.length} warning(s)` : `feature map OK: ${map.features.length} features, ${warnings.length} warning(s)`);
      }
      process.exitCode = errors.length ? 1 : 0;
      break;
    }
    default:
      console.log('usage: npm run features -- <list|show <id>|files-for <file...>|impacted [--base ref|--stdin]|untested|validate> [--json]');
      process.exitCode = command ? 2 : 0;
  }
} catch (error) {
  console.error(`features: ${(error as Error).message}`);
  process.exitCode = 2;
}
