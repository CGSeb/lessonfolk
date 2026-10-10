import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { parse } from 'yaml';

// Guards the supply-chain hardening (ticket #105): pinned actions, least-privilege
// workflows, a minimal non-root image, Dependabot and CI scans.
const root = fileURLToPath(new URL('../../', import.meta.url));
const read = (path: string) => readFileSync(root + path, 'utf8');
const workflowFiles = readdirSync(root + '.github/workflows').filter((f) => /\.ya?ml$/.test(f));

describe('GitHub workflows', () => {
  it.each(workflowFiles)('%s pins every action to a commit SHA', (file) => {
    const uses = [...read(`.github/workflows/${file}`).matchAll(/^\s*-?\s*uses:\s*(\S+)/gm)].map(
      (m) => m[1],
    );
    for (const ref of uses) {
      if (ref.startsWith('./')) continue; // a reusable workflow of this repository
      expect(ref, `${file}: ${ref}`).toMatch(/@[0-9a-f]{40}$/);
    }
  });

  it.each(workflowFiles)('%s sets least-privilege permissions', (file) => {
    const workflow = parse(read(`.github/workflows/${file}`));
    expect(workflow.permissions).toEqual({ contents: 'read' });
  });

  it('the checkouts do not keep the token in the git config', () => {
    for (const file of workflowFiles) {
      const workflow = parse(read(`.github/workflows/${file}`));
      for (const job of Object.values<any>(workflow.jobs)) {
        for (const step of job.steps ?? []) {
          if (String(step.uses).startsWith('actions/checkout@')) {
            expect(step.with?.['persist-credentials'], file).toBe(false);
          }
        }
      }
    }
  });

  it('scans the dependencies and the image on every pull request', () => {
    const security = parse(read('.github/workflows/security.yml'));
    expect(Object.keys(security.on)).toContain('pull_request');
    const text = read('.github/workflows/security.yml');
    expect(text).toContain('npm audit --omit=dev --audit-level=high');
    expect(text).toMatch(/aquasecurity\/trivy-action@[0-9a-f]{40}/);
    expect(text).toMatch(/exit-code: "1"/);
  });
});

describe('Dependabot', () => {
  it('watches npm, GitHub Actions and Docker', () => {
    const config = parse(read('.github/dependabot.yml'));
    const ecosystems = config.updates.map((u: { 'package-ecosystem': string }) => u['package-ecosystem']);
    expect(ecosystems).toEqual(expect.arrayContaining(['npm', 'github-actions', 'docker']));
  });
});

describe('Dockerfile', () => {
  const dockerfile = read('Dockerfile');
  const runtime = dockerfile.slice(dockerfile.lastIndexOf('FROM node:'));

  it('runs the server as the non-root node user', () => {
    expect(runtime).toMatch(/^USER node$/m);
  });

  it('uses the minimal alpine base image', () => {
    for (const line of dockerfile.match(/^FROM .*$/gm) ?? []) {
      expect(line).toMatch(/^FROM (node:\d+-alpine|deps)\b/);
    }
  });

  it('keeps the package managers and drizzle-kit out of the runtime image', () => {
    expect(runtime).toMatch(/rm -rf \/usr\/local\/lib\/node_modules[^\n]*\/usr\/local\/bin\/npm/);
    expect(dockerfile).toMatch(/npm ci --omit=dev[^\n]*\\\n\s*&& rm -rf node_modules\/drizzle-kit/);
  });
});
