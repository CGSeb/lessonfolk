/**
 * Builds the upload for OpenAI's plugin directory from the learner plugin of Claude Code
 * (.claude/skills/lessonfolk-tutor): a ZIP in OpenAI's portable "Agent Plugins" layout, as a
 * folder and a .zip in dist/openai-plugin/. OpenAI reads the remote MCP server from the package
 * itself (`mcp.json`), so the hosted server is declared there. The Course companion mod stays
 * out: OpenAI does not take hooks. Run with `npm run plugin:openai`.
 *
 * Two values are not ours to invent and come from the environment: OPENAI_DEMO_URL (the demo
 * recording the reviewers watch) and OPENAI_TERMS_URL (the terms of service). Without them the
 * package is still built, and the script says what the portal will ask for.
 */
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { crc32, deflateRawSync } from 'node:zlib';
import { SKILLS } from './sync-plugin-skills.ts';

const pluginDir = fileURLToPath(new URL('../../../.claude/skills/lessonfolk-tutor/', import.meta.url));
export const outDir = fileURLToPath(new URL('../../../dist/openai-plugin/', import.meta.url));

const lf = (text: string) => text.replace(/\r\n/g, '\n');

/** The hosted server the plugin connects to (the one public MCP endpoint). */
export const MCP_URL = 'https://lessonfolk.com/mcp';
const SITE = 'https://lessonfolk.com';
/** What the app asks for at sign-in: the OpenID scopes (the email) and the LessonFolk ones. */
const SCOPES = ['openid', 'email', 'lessonfolk:read', 'lessonfolk:write'];
/** The portal only accepts a category of its own list (`Education & Research`, `Productivity`, `Other`…). */
export const CATEGORY = 'Education & Research';

const DESCRIPTION =
  'Learn AI with LessonFolk: the learn, progress and review skills of an AI tutor, with the courses and your progress kept on the LessonFolk server.';
// The portal limits displayName and shortDescription to 30 characters, defaultPrompt to 3 of 128.
const SHORT_DESCRIPTION = 'Learn AI with an AI tutor';
const LONG_DESCRIPTION =
  'LessonFolk teaches AI to anyone, from complete beginners to advanced practitioners, through a conversation with an AI tutor. ' +
  'Pick a learning path, take one short lesson at a time, get checked on what you understood, and come back to your progress whenever you like. ' +
  'The courses and your progress are kept on the LessonFolk server, under your own account: you sign in with GitHub or Google. ' +
  'It stores your profile (name, experience, goal, language, level, interests), your lesson status and scores, and the tutor\'s notes. ' +
  'Your conversations stay with your AI app.';
const DEFAULT_PROMPTS = ['Start my first LessonFolk lesson.', 'Show my LessonFolk progress.', 'Quiz me on what I learned.'];

export interface PositiveCase {
  description: string;
  prompt: string;
  tools_triggered: string;
  expected_behavior: string;
}

/** The review cases: the prompts the tutor must answer with the server's tools, and ones it must not. */
export const POSITIVE_CASES: PositiveCase[] = [
  {
    description: 'A new learner starts',
    prompt: 'Start learning AI with LessonFolk.',
    tools_triggered: 'get_progress, set_profile',
    expected_behavior: 'Reads the saved progress, sees a new learner and asks a first onboarding question (level or interests).',
  },
  {
    description: 'Ask what to learn next',
    prompt: 'What should I learn next on LessonFolk?',
    tools_triggered: 'get_progress, get_next_lesson',
    expected_behavior: 'Reads the progress and names the next lesson of the learner\'s path.',
  },
  {
    description: 'Take the next lesson',
    prompt: 'Teach me my next LessonFolk lesson.',
    tools_triggered: 'get_next_lesson, start_lesson, get_lesson',
    expected_behavior: 'Starts the lesson and teaches its first key idea in short chunks, then asks a question.',
  },
  {
    description: 'Check the progress',
    prompt: 'Where am I in my LessonFolk courses?',
    tools_triggered: 'get_progress, list_courses',
    expected_behavior: 'Summarises the courses with their lessons done, in progress and not started.',
  },
  {
    description: 'Review what was learned',
    prompt: 'Quiz me on the lessons I finished.',
    tools_triggered: 'get_progress, record_review_score',
    expected_behavior: 'Asks questions on finished lessons, then saves a review score.',
  },
];

export const NEGATIVE_CASES = [
  { description: 'Unrelated question', prompt: 'What is the weather in Montreal tomorrow?' },
  { description: 'Unrelated task', prompt: 'Write a Python script that sorts a list of names.' },
  { description: 'Not about learning AI', prompt: 'Summarise this news article for me.' },
];

export interface OpenAiOptions {
  demoUrl?: string;
  termsUrl?: string;
}

/** The root manifest: the portable fields, and OpenAI's listing and review fields under `extensions`. */
export function openAiManifest(source: Record<string, unknown>, options: OpenAiOptions = {}): string {
  const manifest = {
    $schema: 'https://agent-plugins.org/schemas/1.0.0/plugin.schema.json',
    name: source.name,
    version: source.version,
    description: DESCRIPTION,
    author: { name: 'LessonFolk', url: SITE },
    homepage: source.homepage,
    repository: source.repository,
    license: source.license,
    extensions: {
      'com.openai': {
        interface: {
          displayName: 'LessonFolk',
          shortDescription: SHORT_DESCRIPTION,
          longDescription: LONG_DESCRIPTION,
          developerName: 'LessonFolk',
          category: CATEGORY,
          websiteURL: SITE,
          supportURL: source.supportUrl,
          privacyPolicyURL: source.privacyPolicyUrl,
          ...(options.termsUrl && { termsOfServiceURL: options.termsUrl }),
          defaultPrompt: DEFAULT_PROMPTS,
          logo: './assets/logo.png',
          composerIcon: './assets/icon.png',
        },
        review: {
          test_cases: { positive: POSITIVE_CASES, negative: NEGATIVE_CASES },
          ...(options.demoUrl && { demo_recording_url: options.demoUrl }),
          commerce: false,
        },
      },
    },
  };
  return `${JSON.stringify(manifest, null, 2)}\n`;
}

/**
 * The MCP config: one remote server, no secret and no header (public submissions refuse both).
 * The app registers itself with each client (dynamic client registration) and the endpoints come
 * from its OAuth discovery, so only the scopes are given here.
 */
export function openAiMcpConfig(): string {
  const config = {
    $schema: 'https://agent-plugins.org/schemas/1.0.0/mcp.schema.json',
    mcpServers: {
      lessonfolk: {
        type: 'streamable-http',
        url: MCP_URL,
        extensions: {
          'com.openai': { auth: { type: 'oauth', client: { mode: 'dcr' }, baseScopes: SCOPES } },
        },
      },
    },
  };
  return `${JSON.stringify(config, null, 2)}\n`;
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
export function buildOpenAiPlugin(
  options: OpenAiOptions = {},
  read: (path: string) => Buffer = (path) => readFileSync(join(pluginDir, path)),
): Map<string, Buffer> {
  const files = new Map<string, Buffer>();
  files.set('plugin.json', Buffer.from(openAiManifest(JSON.parse(read('.claude-plugin/plugin.json').toString('utf8')), options)));
  files.set('mcp.json', Buffer.from(openAiMcpConfig()));
  // One square PNG serves as the logo and the composer icon.
  files.set('assets/logo.png', read('.claude-plugin/icon.png'));
  files.set('assets/icon.png', read('.claude-plugin/icon.png'));
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
  const options = { demoUrl: process.env.OPENAI_DEMO_URL?.trim() || undefined, termsUrl: process.env.OPENAI_TERMS_URL?.trim() || undefined };
  const files = buildOpenAiPlugin(options);
  rmSync(outDir, { recursive: true, force: true });
  for (const [path, data] of files) {
    mkdirSync(dirname(join(outDir, 'lessonfolk-tutor', path)), { recursive: true });
    writeFileSync(join(outDir, 'lessonfolk-tutor', path), data);
  }
  writeFileSync(join(outDir, 'lessonfolk-tutor.zip'), zip(files));
  console.log(`Wrote ${files.size} files to ${outDir}lessonfolk-tutor.zip (and the same files in ${outDir}lessonfolk-tutor/).`);
  if (!options.demoUrl) console.warn('No OPENAI_DEMO_URL: the review needs a demo recording URL (review.demo_recording_url).');
  if (!options.termsUrl) console.warn('No OPENAI_TERMS_URL: a public submission asks for a terms of service URL (termsOfServiceURL).');
}
