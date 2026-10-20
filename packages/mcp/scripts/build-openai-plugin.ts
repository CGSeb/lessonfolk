/**
 * Builds the upload for OpenAI's plugin directory from the learner plugin
 * of Claude Code (.claude/skills/lessonfolk-tutor): the three skills and the manifest, as a
 * folder and a .zip in dist/openai-plugin/. OpenAI does not take hooks, so the Course companion
 * mod stays out, together with what only it needs (.mcp.json, types, tests); the MCP server is
 * given to the portal as its public address instead. Run with `npm run plugin:openai`.
 */
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { crc32, deflateRawSync } from 'node:zlib';
import { SKILLS } from './sync-plugin-skills.ts';

const pluginDir = fileURLToPath(new URL('../../../.claude/skills/lessonfolk-tutor/', import.meta.url));
export const outDir = fileURLToPath(new URL('../../../dist/openai-plugin/', import.meta.url));

const lf = (text: string) => text.replace(/\r\n/g, '\n');

/** The manifest fields OpenAI reads, in order. `types` belongs to the mod, which is left out. */
const MANIFEST_FIELDS = [
  'name',
  'displayName',
  'version',
  'description',
  'author',
  'homepage',
  'repository',
  'license',
  'icon',
  'supportUrl',
  'privacyPolicyUrl',
] as const;

/** The description of the Claude Code plugin mentions the side pane of the mod, which OpenAI's upload does not have. */
const DESCRIPTION = 'Learn AI with LessonFolk: the learn, progress and review skills of an AI tutor, with the courses and your progress kept on the LessonFolk server.';

export function openAiManifest(manifest: Record<string, unknown>): string {
  const kept = Object.fromEntries(MANIFEST_FIELDS.filter((field) => field in manifest).map((field) => [field, manifest[field]]));
  kept.description = DESCRIPTION;
  return `${JSON.stringify(kept, null, 2)}\n`;
}

/**
 * A skill without what only Claude Code has: the paragraph about the Course companion tools
 * (`mcp__lessonfolk-tutor__…`), and the `/mcp` command that connects a server there.
 */
export function openAiSkill(skill: string): string {
  const text = lf(skill)
    .split('\n\n')
    .filter((paragraph) => !paragraph.includes('mcp__lessonfolk-tutor__'))
    .join('\n\n')
    .replace('run `/mcp`, pick the\nLessonFolk server and sign in', 'connect the\nLessonFolk server and sign in');
  if (/mcp__lessonfolk-tutor__|`\/mcp`/.test(text)) throw new Error('A skill still names a Claude Code tool or command.');
  return text;
}

/** The files of the upload, by path inside the archive. */
export function buildOpenAiPlugin(read: (path: string) => Buffer = (path) => readFileSync(join(pluginDir, path))): Map<string, Buffer> {
  const files = new Map<string, Buffer>();
  files.set('.claude-plugin/plugin.json', Buffer.from(openAiManifest(JSON.parse(read('.claude-plugin/plugin.json').toString('utf8')))));
  files.set('.claude-plugin/icon.png', read('.claude-plugin/icon.png'));
  for (const name of SKILLS) files.set(`skills/${name}/SKILL.md`, Buffer.from(openAiSkill(read(`skills/${name}/SKILL.md`).toString('utf8'))));
  return files;
}

// A fixed time (1 January 1980, the DOS epoch), so that the same files always give the same archive.
const DOS_TIME = 0;
const DOS_DATE = (0 << 9) | (1 << 5) | 1;

/** A .zip of the files (deflate, no extra fields). */
export function zip(files: Map<string, Buffer>): Buffer {
  const parts: Buffer[] = [];
  const central: Buffer[] = [];
  let offset = 0;
  for (const [path, data] of [...files].sort(([a], [b]) => a.localeCompare(b))) {
    const name = Buffer.from(path);
    const packed = deflateRawSync(data);
    const checksum = crc32(data);
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4); // version needed
    local.writeUInt16LE(0x0800, 6); // names are UTF-8
    local.writeUInt16LE(8, 8); // deflate
    local.writeUInt16LE(DOS_TIME, 10);
    local.writeUInt16LE(DOS_DATE, 12);
    local.writeUInt32LE(checksum, 14);
    local.writeUInt32LE(packed.length, 18);
    local.writeUInt32LE(data.length, 22);
    local.writeUInt16LE(name.length, 26);
    parts.push(local, name, packed);

    const entry = Buffer.alloc(46);
    entry.writeUInt32LE(0x02014b50, 0);
    entry.writeUInt16LE(20, 4); // made by
    local.copy(entry, 6, 4, 30); // version needed … name length, the same as the local header
    entry.writeUInt32LE(offset, 42);
    central.push(entry, name);
    offset += local.length + name.length + packed.length;
  }
  const directory = Buffer.concat(central);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(files.size, 8);
  end.writeUInt16LE(files.size, 10);
  end.writeUInt32LE(directory.length, 12);
  end.writeUInt32LE(offset, 16);
  return Buffer.concat([...parts, directory, end]);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const files = buildOpenAiPlugin();
  rmSync(outDir, { recursive: true, force: true });
  for (const [path, data] of files) {
    mkdirSync(dirname(join(outDir, 'lessonfolk-tutor', path)), { recursive: true });
    writeFileSync(join(outDir, 'lessonfolk-tutor', path), data);
  }
  writeFileSync(join(outDir, 'lessonfolk-tutor.zip'), zip(files));
  console.log(`Wrote ${files.size} files to ${outDir}lessonfolk-tutor.zip (and the same files in ${outDir}lessonfolk-tutor/).`);
}
