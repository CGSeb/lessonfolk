/**
 * The upload for OpenAI's plugin directory (scripts/build-openai-plugin.ts): skills, a manifest
 * and the remote MCP server, with nothing that belongs to Claude Code.
 */
import { readFileSync } from 'node:fs';
import { inflateRawSync } from 'node:zlib';
import { describe, expect, it } from 'vitest';
import { SKILLS } from '../scripts/sync-plugin-skills.ts';
import { buildOpenAiPlugin, MCP_URL, NEGATIVE_CASES, openAiSkill, POSITIVE_CASES, zip } from '../scripts/build-openai-plugin.ts';

/** Reads a .zip back the way a reader does: the central directory, then each entry's data. */
function unzip(archive: Buffer): Map<string, Buffer> {
  const end = archive.length - 22;
  expect(archive.readUInt32LE(end)).toBe(0x06054b50);
  const count = archive.readUInt16LE(end + 10);
  let at = archive.readUInt32LE(end + 16);
  const files = new Map<string, Buffer>();
  for (let i = 0; i < count; i++) {
    expect(archive.readUInt32LE(at)).toBe(0x02014b50);
    const size = archive.readUInt32LE(at + 20);
    const nameLength = archive.readUInt16LE(at + 28);
    const local = archive.readUInt32LE(at + 42);
    const name = archive.subarray(at + 46, at + 46 + nameLength).toString();
    expect(archive.readUInt32LE(local)).toBe(0x04034b50);
    const start = local + 30 + archive.readUInt16LE(local + 26) + archive.readUInt16LE(local + 28);
    files.set(name, inflateRawSync(archive.subarray(start, start + size)));
    at += 46 + nameLength;
  }
  return files;
}

const serverTools = [...readFileSync(new URL('./server.ts', import.meta.url), 'utf8').matchAll(/registerTool\(\s*'([a-z_]+)'/g)].map((m) => m[1]);
const options = { demoUrl: 'https://example.test/demo', termsUrl: 'https://example.test/terms' };

describe('the OpenAI plugin upload', () => {
  const files = buildOpenAiPlugin(options);
  const text = (path: string) => files.get(path)!.toString('utf8');
  const manifest = JSON.parse(text('plugin.json'));
  const listing = manifest.extensions['com.openai'].interface;
  const review = manifest.extensions['com.openai'].review;

  it('holds the manifests, the icons and the three skills, and nothing else', () => {
    expect([...files.keys()].sort()).toEqual([
      'assets/icon.png',
      'assets/logo.png',
      'mcp.json',
      'plugin.json',
      ...SKILLS.map((name) => `skills/${name}/SKILL.md`),
    ]);
  });

  it('declares exactly one remote server, with OAuth and no secret or header', () => {
    const config = JSON.parse(text('mcp.json'));
    expect(Object.keys(config.mcpServers)).toEqual(['lessonfolk']);
    const server = config.mcpServers.lessonfolk;
    expect(server).toMatchObject({ type: 'streamable-http', url: MCP_URL });
    expect(server.url).toMatch(/^https:\/\//);
    expect(server.extensions['com.openai'].auth).toMatchObject({ type: 'oauth', client: { mode: 'dcr' } });
    expect(server.extensions['com.openai'].auth.baseScopes).toEqual(expect.arrayContaining(['openid', 'email']));
    expect(text('mcp.json')).not.toMatch(/clientSecret|headers|token/i);
  });

  it('has a manifest without the mod, hooks or Claude Code fields', () => {
    expect(manifest.name).toBe('lessonfolk-tutor');
    expect(manifest.description).not.toMatch(/pane/i);
    for (const field of ['types', 'hooks', 'mcpServers', 'icon', 'displayName']) expect(manifest, field).not.toHaveProperty(field);
    expect(manifest.extensions['com.openai']).not.toHaveProperty('hooks');
    expect(text('plugin.json')).not.toMatch(/\bClaude\b|\.claude/);
  });

  it('respects the portal limits of the listing', () => {
    expect(listing.displayName.length).toBeLessThanOrEqual(30);
    expect(listing.shortDescription.length).toBeLessThanOrEqual(30);
    expect(listing.longDescription.length).toBeLessThanOrEqual(4000);
    expect(listing.developerName.length).toBeLessThanOrEqual(80);
    expect(listing.defaultPrompt.length).toBeLessThanOrEqual(3);
    for (const prompt of listing.defaultPrompt) expect(prompt.length).toBeLessThanOrEqual(128);
    for (const url of [listing.websiteURL, listing.supportURL, listing.privacyPolicyURL, listing.termsOfServiceURL]) {
      expect(url).toMatch(/^https:\/\/[^@\s]*$/);
      expect(url.length).toBeLessThanOrEqual(1024);
    }
  });

  it('gives five positive and three negative review cases, on tools the server really has', () => {
    expect(POSITIVE_CASES).toHaveLength(5);
    expect(NEGATIVE_CASES).toHaveLength(3);
    expect(review.test_cases.positive).toHaveLength(5);
    expect(review.test_cases.negative).toHaveLength(3);
    expect(serverTools.length).toBeGreaterThan(10);
    for (const test of POSITIVE_CASES) {
      expect(test.prompt && test.expected_behavior).toBeTruthy();
      for (const tool of test.tools_triggered.split(', ')) expect(serverTools, test.description).toContain(tool);
    }
    expect(review.demo_recording_url).toBe(options.demoUrl);
  });

  it('leaves out the demo and terms URLs it was not given, instead of inventing them', () => {
    const bare = JSON.parse(buildOpenAiPlugin().get('plugin.json')!.toString('utf8')).extensions['com.openai'];
    expect(bare.review).not.toHaveProperty('demo_recording_url');
    expect(bare.interface).not.toHaveProperty('termsOfServiceURL');
  });

  it.each(SKILLS)('%s keeps its procedure and names nothing from Claude Code', (name) => {
    const skill = text(`skills/${name}/SKILL.md`);
    expect(skill).toMatch(new RegExp(`^---\nname: ${name}\ndescription: .+\n---\n`));
    expect(skill).toContain('# LessonFolk:');
    expect(skill).not.toMatch(/mcp__|\/mcp`|Course companion|\bClaude\b/);
  });

  it('refuses a skill that still names a Claude Code tool', () => {
    expect(() => openAiSkill('Use `/mcp` to connect.')).toThrow('Claude Code');
  });

  it('is a valid .zip with the same files', () => {
    const back = unzip(zip(files));
    expect([...back.keys()].sort()).toEqual([...files.keys()].sort());
    for (const [path, data] of files) expect(back.get(path)!.equals(data), path).toBe(true);
  });

  it('gives the same archive every time', () => {
    expect(zip(files).equals(zip(buildOpenAiPlugin(options)))).toBe(true);
  });
});
