/**
 * The upload for OpenAI's plugin directory (scripts/build-openai-plugin.ts): skills and manifest
 * only, with nothing that belongs to Claude Code.
 */
import { inflateRawSync } from 'node:zlib';
import { describe, expect, it } from 'vitest';
import { SKILLS } from '../scripts/sync-plugin-skills.ts';
import { buildOpenAiPlugin, openAiManifest, openAiSkill, zip } from '../scripts/build-openai-plugin.ts';

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

describe('the OpenAI plugin upload', () => {
  const files = buildOpenAiPlugin();
  const text = (path: string) => files.get(path)!.toString('utf8');

  it('holds the manifest, its icon and the three skills, and nothing else', () => {
    expect([...files.keys()].sort()).toEqual([
      '.claude-plugin/icon.png',
      '.claude-plugin/plugin.json',
      ...SKILLS.map((name) => `skills/${name}/SKILL.md`),
    ]);
  });

  it('has a manifest with a description and the listing links, without the mod', () => {
    const manifest = JSON.parse(text('.claude-plugin/plugin.json'));
    expect(manifest.name).toBe('lessonfolk-tutor');
    expect(manifest.description).toBeTruthy();
    expect(manifest.description).not.toMatch(/pane/i);
    expect(manifest.privacyPolicyUrl).toMatch(/^https:\/\//);
    expect(manifest).not.toHaveProperty('types');
    expect(manifest).not.toHaveProperty('hooks');
    expect(manifest).not.toHaveProperty('mcpServers');
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

  it('keeps only the fields OpenAI reads', () => {
    const kept = JSON.parse(openAiManifest({ name: 'x', types: './t.d.ts', hooks: {}, icon: './i.png' }));
    expect(kept).toMatchObject({ name: 'x', icon: './i.png' });
    expect(kept).not.toHaveProperty('types');
    expect(kept).not.toHaveProperty('hooks');
  });

  it('is a valid .zip with the same files', () => {
    const back = unzip(zip(files));
    expect([...back.keys()].sort()).toEqual([...files.keys()].sort());
    for (const [path, data] of files) expect(back.get(path)!.equals(data), path).toBe(true);
  });

  it('gives the same archive every time', () => {
    expect(zip(files).equals(zip(buildOpenAiPlugin()))).toBe(true);
  });
});
