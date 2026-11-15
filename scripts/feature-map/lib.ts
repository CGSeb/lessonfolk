/**
 * Feature map library: loads features/index.yaml and the sheets, answers "which features does this
 * change touch?", and checks that the map still matches the repository (drift checks).
 * Plain Node (type stripping), only the `yaml` package; run through cli.ts. See features/README.md.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';

export interface Feature {
  id: string;
  name: string;
  summary: string;
  status: string;
  owner?: string;
  flag?: string;
  entry_points: { routes?: string[]; ui?: { page?: string; components?: string[]; selectors?: string[] }[] };
  code: { paths: string[]; models?: string[] };
  depends_on?: string[];
  impacts?: string[];
  rules?: string[];
  acceptance?: { given: string; when: string; then: string }[];
  tests: { harness?: string[]; run?: string; e2e?: string[]; unit?: string[]; coverage_gaps?: string[] };
  risks?: string[];
}

export interface IndexEntry {
  id: string;
  name: string;
  summary: string;
  file: string;
}

export interface FeatureMap {
  root: string;
  index: IndexEntry[];
  features: Feature[];
  /** Problems found while loading (unreadable file, bad YAML): reported by validate. */
  loadErrors: string[];
}

export const PAGES_DIR = 'dashboard/src/pages';
export const SCHEMA_FILE = 'packages/db/src/schema.ts';
export const STATUSES = ['stable', 'beta', 'experimental', 'deprecated'];

export function loadMap(root: string): FeatureMap {
  const loadErrors: string[] = [];
  const indexPath = join(root, 'features', 'index.yaml');
  if (!existsSync(indexPath)) throw new Error('features/index.yaml not found');
  const index: IndexEntry[] = parse(readFileSync(indexPath, 'utf8'))?.features ?? [];
  const features: Feature[] = [];
  for (const entry of index) {
    const file = join(root, entry.file ?? '');
    if (!entry.file || !existsSync(file)) {
      loadErrors.push(`index: sheet of "${entry.id}" not found (${entry.file})`);
      continue;
    }
    try {
      features.push(parse(readFileSync(file, 'utf8')) as Feature);
    } catch (error) {
      loadErrors.push(`${entry.file}: invalid YAML (${(error as Error).message.split('\n')[0]})`);
    }
  }
  return { root, index, features, loadErrors };
}

// ---------- files and globs ----------

/** Tracked and untracked (not ignored) files of the repository, with forward slashes. */
export function repoFiles(root: string): string[] {
  const run = (args: string[]) =>
    execFileSync('git', args, { cwd: root, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }).split('\n').filter(Boolean);
  return [...new Set([...run(['ls-files']), ...run(['ls-files', '--others', '--exclude-standard'])])].map(normalize);
}

export const normalize = (path: string) => path.replaceAll('\\', '/').replace(/^\.\//, '');

/** `**` crosses folders, `*` and `?` stay inside one path segment. */
export function globToRegExp(glob: string): RegExp {
  let source = '';
  for (let i = 0; i < glob.length; i++) {
    const c = glob[i];
    if (c === '*') {
      if (glob[i + 1] === '*') {
        i++;
        if (glob[i + 1] === '/') {
          i++;
          source += '(?:.*/)?';
        } else source += '.*';
      } else source += '[^/]*';
    } else if (c === '?') source += '[^/]';
    else source += c.replace(/[.+^${}()|[\]\\]/g, '\\$&');
  }
  return new RegExp(`^${source}$`);
}

export const matchesGlob = (glob: string, file: string) => globToRegExp(glob).test(file);

// ---------- routes ----------

/** The URL path an Astro page file serves: pages/api/me.ts -> /api/me, pages/index.astro -> /. */
export function routeOfPage(file: string): string | undefined {
  if (!file.startsWith(`${PAGES_DIR}/`) || !/\.(astro|ts)$/.test(file)) return undefined;
  let route = file.slice(PAGES_DIR.length).replace(/\.(astro|ts)$/, '');
  route = route.replace(/\/index$/, '');
  return route === '' ? '/' : route;
}

/** `GET /api/me` -> `/api/me`; a bare path is accepted too. */
export const routePath = (route: string) => route.replace(/^[A-Z]+\s+/, '').trim();

export const allRoutes = (map: FeatureMap): { feature: string; route: string }[] =>
  map.features.flatMap((f) => (f.entry_points?.routes ?? []).map((route) => ({ feature: f.id, route: routePath(route) })));

// ---------- queries ----------

export interface Hit {
  id: string;
  /** direct: a changed file is in code.paths. test: it is one of the feature's tests. dependent: reached through depends_on/impacts. */
  reason: 'direct' | 'test' | 'dependent';
  files: string[];
  via?: string;
}

export function featuresForFiles(map: FeatureMap, files: string[]): Hit[] {
  const hits: Hit[] = [];
  for (const feature of map.features) {
    const testFiles = [...(feature.tests?.e2e ?? []), ...(feature.tests?.unit ?? [])];
    // A listed test file inside code.paths (packages/mcp/src/** holds its tests) counts as a test change, not a code change.
    const code = files.filter((f) => !testFiles.includes(f) && feature.code?.paths?.some((g) => matchesGlob(g, f)));
    const tests = files.filter((f) => testFiles.includes(f));
    if (code.length) hits.push({ id: feature.id, reason: 'direct', files: code });
    else if (tests.length) hits.push({ id: feature.id, reason: 'test', files: tests });
  }
  return hits;
}

/** Features that depend on, or are impacted by, `id` (one hop). */
function downstream(map: FeatureMap, id: string): string[] {
  const out = new Set<string>();
  for (const f of map.features) {
    if (f.depends_on?.includes(id)) out.add(f.id);
    if (map.features.find((x) => x.id === id)?.impacts?.includes(f.id)) out.add(f.id);
  }
  return [...out];
}

/** The features touched by `files`, plus everything that depends on them or is listed in their `impacts` (transitively). */
export function impactedFeatures(map: FeatureMap, files: string[]): Hit[] {
  const result = new Map<string, Hit>(featuresForFiles(map, files).map((h) => [h.id, h]));
  const queue = [...result.keys()];
  while (queue.length) {
    const from = queue.shift() as string;
    for (const id of downstream(map, from)) {
      if (result.has(id)) continue;
      result.set(id, { id, reason: 'dependent', files: [], via: from });
      queue.push(id);
    }
  }
  return [...result.values()];
}

/** Files changed since `base` (committed, staged, unstaged) plus untracked files. */
export function changedFiles(root: string, base: string): string[] {
  const run = (args: string[]) => execFileSync('git', args, { cwd: root, encoding: 'utf8' }).split('\n').filter(Boolean);
  return [...new Set([...run(['diff', '--name-only', base]), ...run(['ls-files', '--others', '--exclude-standard'])])].map(normalize);
}

/** Files named in a unified diff (`diff --git a/x b/x`) or, failing that, one path per line. */
export function filesFromText(text: string): string[] {
  const named = [...text.matchAll(/^diff --git a\/(.+?) b\/(.+)$/gm)].map((m) => m[2]);
  if (named.length) return [...new Set(named.map(normalize))];
  return [...new Set(text.split('\n').map((l) => l.trim()).filter(Boolean).map(normalize))];
}

export interface Untested {
  id: string;
  problems: string[];
}

export function untestedFeatures(map: FeatureMap): Untested[] {
  const out: Untested[] = [];
  for (const f of map.features) {
    const problems: string[] = [];
    if (!f.tests?.e2e?.length && !f.tests?.unit?.length) problems.push('no test at all');
    else if (!f.tests?.e2e?.length) problems.push('no end-to-end test');
    for (const gap of f.tests?.coverage_gaps ?? []) problems.push(`gap: ${gap}`);
    if ((f.acceptance?.length ?? 0) === 0) problems.push('no acceptance criteria');
    if (problems.length) out.push({ id: f.id, problems });
  }
  return out;
}

// ---------- validation ----------

export function validate(map: FeatureMap, files: string[] = repoFiles(map.root)): { errors: string[]; warnings: string[] } {
  const errors = [...map.loadErrors];
  const warnings: string[] = [];
  const fileSet = new Set(files);
  const ids = new Set<string>();

  // index <-> sheets
  const indexIds = new Set<string>();
  for (const entry of map.index) {
    if (indexIds.has(entry.id)) errors.push(`index: duplicate id "${entry.id}"`);
    indexIds.add(entry.id);
    for (const field of ['name', 'summary', 'file'] as const) if (!entry[field]) errors.push(`index: "${entry.id}" has no ${field}`);
    if (/[\r\n]/.test(entry.summary ?? '')) errors.push(`index: summary of "${entry.id}" must be one line`);
  }
  for (const file of files.filter((f) => /^features\/[^/]+\.yaml$/.test(f) && f !== 'features/index.yaml')) {
    if (!map.index.some((e) => e.file === file)) errors.push(`${file}: sheet is not listed in features/index.yaml`);
  }

  const known = new Set(map.features.map((f) => f.id));
  for (const f of map.features) {
    const at = (msg: string) => `${f.id}: ${msg}`;
    if (ids.has(f.id)) errors.push(at('duplicate feature id'));
    ids.add(f.id);
    const entry = map.index.find((e) => e.id === f.id);
    if (!entry) errors.push(at('not listed in features/index.yaml'));
    else if (entry.file !== `features/${f.id}.yaml`) errors.push(at(`sheet path should be features/${f.id}.yaml (index says ${entry.file})`));
    else if (entry.summary !== f.summary) errors.push(at('summary differs between the index and the sheet'));
    for (const field of ['name', 'summary', 'status'] as const) if (!f[field]) errors.push(at(`missing ${field}`));
    if (f.status && !STATUSES.includes(f.status)) errors.push(at(`status "${f.status}" is not one of ${STATUSES.join(', ')}`));
    if (!f.code?.paths?.length) errors.push(at('code.paths is empty'));
    if (!f.entry_points?.routes?.length && !f.entry_points?.ui?.length) warnings.push(at('no entry point (no route, no ui)'));

    for (const glob of f.code?.paths ?? []) {
      if (!files.some((file) => matchesGlob(glob, file))) errors.push(at(`code.paths "${glob}" matches no file`));
    }
    for (const test of [...(f.tests?.e2e ?? []), ...(f.tests?.unit ?? [])]) {
      if (!fileSet.has(test)) errors.push(at(`test "${test}" does not exist`));
    }
    for (const harness of f.tests?.harness ?? []) if (!fileSet.has(harness)) errors.push(at(`test harness "${harness}" does not exist`));
    for (const ui of f.entry_points?.ui ?? []) {
      for (const component of ui.components ?? []) if (!fileSet.has(component)) errors.push(at(`ui component "${component}" does not exist`));
    }
    for (const dep of f.depends_on ?? []) if (!known.has(dep)) errors.push(at(`depends_on "${dep}" is not a feature`));
    for (const imp of f.impacts ?? []) if (!known.has(imp)) errors.push(at(`impacts "${imp}" is not a feature`));
    if (f.depends_on?.includes(f.id)) errors.push(at('depends on itself'));
    (f.acceptance ?? []).forEach((a, i) => {
      for (const part of ['given', 'when', 'then'] as const) if (!a?.[part]) errors.push(at(`acceptance #${i + 1} has no ${part}`));
    });
    if (!f.acceptance?.length) warnings.push(at('no acceptance criteria'));
  }

  // dependency cycles
  for (const f of map.features) {
    const seen = new Set<string>();
    const walk = (id: string): boolean => {
      for (const dep of map.features.find((x) => x.id === id)?.depends_on ?? []) {
        if (dep === f.id) return true;
        if (!seen.has(dep)) {
          seen.add(dep);
          if (walk(dep)) return true;
        }
      }
      return false;
    };
    if (walk(f.id)) errors.push(`${f.id}: depends_on forms a cycle`);
  }

  // routes: every page belongs to a feature, every declared route has a page
  const pages = new Map<string, string>();
  for (const file of files) {
    const route = routeOfPage(file);
    if (route) pages.set(route, file);
  }
  const declared = new Map<string, string[]>();
  for (const { feature, route } of allRoutes(map)) declared.set(route, [...(declared.get(route) ?? []), feature]);
  for (const [route, file] of pages) {
    if (!declared.has(route)) errors.push(`route ${route} (${file}) belongs to no feature`);
  }
  for (const [route, owners] of declared) {
    if (!pages.has(route)) errors.push(`${owners.join(', ')}: route ${route} has no page file under ${PAGES_DIR}`);
  }
  // a page file must also be inside the code.paths of the feature that declares its route
  for (const { feature, route } of allRoutes(map)) {
    const file = pages.get(route);
    const f = map.features.find((x) => x.id === feature);
    if (file && f && !f.code?.paths?.some((g) => matchesGlob(g, file))) errors.push(`${feature}: route ${route} is served by ${file}, not covered by its code.paths`);
  }

  // models exist in the schema
  const schemaPath = join(map.root, SCHEMA_FILE);
  if (existsSync(schemaPath)) {
    const tables = new Set([...readFileSync(schemaPath, 'utf8').matchAll(/pgTable\(\s*'([^']+)'/g)].map((m) => m[1]));
    for (const f of map.features) for (const model of f.code?.models ?? []) if (!tables.has(model)) errors.push(`${f.id}: model "${model}" is not a table of ${SCHEMA_FILE}`);
  }

  // test files claimed by no feature
  for (const file of files.filter((f) => /^dashboard\/tests\/e2e\/[^/]+\.test\.ts$/.test(f))) {
    if (!map.features.some((f) => f.tests?.e2e?.includes(file))) warnings.push(`${file}: e2e test listed by no feature`);
  }
  return { errors, warnings };
}
