/** Tests of the feature map scripts: `npm run features:test`. They run on the real map, then break it on purpose. */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { featuresForFiles, filesFromText, globToRegExp, impactedFeatures, loadMap, repoFiles, routeOfPage, untestedFeatures, validate } from './lib.ts';

const root = fileURLToPath(new URL('../../', import.meta.url));
const map = loadMap(root);
const files = repoFiles(root);
const clone = () => structuredClone(map);

test('the real map passes validate', () => {
  assert.deepEqual(validate(map, files).errors, []);
});

test('globs: ** crosses folders, * does not', () => {
  assert.ok(globToRegExp('a/**').test('a/b/c.ts'));
  assert.ok(globToRegExp('a/*.ts').test('a/c.ts'));
  assert.ok(!globToRegExp('a/*.ts').test('a/b/c.ts'));
  assert.ok(globToRegExp('dashboard/src/pages/llms*.ts').test('dashboard/src/pages/llms-full.txt.ts'));
});

test('routes follow the Astro file convention', () => {
  assert.equal(routeOfPage('dashboard/src/pages/index.astro'), '/');
  assert.equal(routeOfPage('dashboard/src/pages/courses/index.astro'), '/courses');
  assert.equal(routeOfPage('dashboard/src/pages/api/authors/[slug]/avatar.ts'), '/api/authors/[slug]/avatar');
  assert.equal(routeOfPage('dashboard/src/pages/robots.txt.ts'), '/robots.txt');
  assert.equal(routeOfPage('dashboard/src/lib/seo.ts'), undefined);
});

test('files-for: a page and a test map to their feature', () => {
  assert.deepEqual(featuresForFiles(map, ['dashboard/src/pages/api/language.ts']).map((h) => h.id), ['interface-language']);
  const [hit] = featuresForFiles(map, ['dashboard/tests/e2e/seo.db.test.ts']);
  assert.equal(hit.id, 'site-pages');
  assert.equal(hit.reason, 'test');
});

test('impacted: a change in the course loader reaches the features that depend on it', () => {
  const ids = impactedFeatures(map, ['packages/core/src/courses.ts']).map((h) => h.id);
  assert.ok(ids.includes('course-catalog'));
    assert.ok(ids.includes('site-pages'), 'site-pages depends on course-catalog');
  assert.ok(!ids.includes('interface-language'));
});

test('impacted: reads a unified diff', () => {
  const diff = 'diff --git a/dashboard/src/pages/sign-out.ts b/dashboard/src/pages/sign-out.ts\n--- a/x\n+++ b/x\n@@ -1 +1 @@\n';
  assert.deepEqual(filesFromText(diff), ['dashboard/src/pages/sign-out.ts']);
  assert.ok(impactedFeatures(map, filesFromText(diff)).some((h) => h.id === 'authentication'));
});

test('untested: lists the features with coverage gaps, and drops one once its gaps are closed', () => {
  const ids = untestedFeatures(map).map((u) => u.id);
  assert.ok(ids.includes('home-learning-path'));
  assert.ok(!ids.includes('course-catalog'));
  assert.ok(!ids.includes('interface-language'), 'its gaps were closed by new e2e tests');
});

test('validate links the YAML map and the verification sheets', () => {
  const noSheet = clone();
  noSheet.features.push({ ...clone().features[0], id: 'ghost-feature' });
  assert.match(validate(noSheet, files).errors.join('\n'), /ghost-feature: in the feature map but has no verification sheet/);
  const noYaml = clone();
  noYaml.features = noYaml.features.filter((f) => f.id !== 'site-pages');
  noYaml.index = noYaml.index.filter((e) => e.id !== 'site-pages');
  assert.match(validate(noYaml, files).errors.join('\n'), /site-pages\.md: verification sheet of a feature that is not in features\/index\.yaml/);
});

test('validate catches drift', () => {
  const broken = (change: (m: ReturnType<typeof clone>) => void) => {
    const m = clone();
    change(m);
    return validate(m, files).errors.join('\n');
  };
  const feature = (m: ReturnType<typeof clone>, id: string) => m.features.find((f) => f.id === id)!;
  assert.match(broken((m) => (feature(m, 'site-pages').code.paths = ['nowhere/**'])), /matches no file/);
  assert.match(broken((m) => feature(m, 'site-pages').tests.unit!.push('no/such.test.ts')), /does not exist/);
  assert.match(broken((m) => (feature(m, 'site-pages').depends_on = ['ghost'])), /not a feature/);
  assert.match(broken((m) => (feature(m, 'site-pages').entry_points.routes = ['GET /robots.txt'])), /\/sitemap\.xml.*belongs to no feature/);
  assert.match(broken((m) => feature(m, 'site-pages').entry_points.routes!.push('GET /ghost')), /route \/ghost has no page file/);
  assert.match(broken((m) => feature(m, 'site-pages').code.models!.push('ghost_table')), /ghost_table/);
  assert.match(broken((m) => (feature(m, 'site-pages').id = 'course-catalog')), /duplicate feature id/);
  assert.match(broken((m) => (feature(m, 'course-catalog').depends_on = ['site-pages'])), /cycle/);
});
