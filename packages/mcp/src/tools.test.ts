import { fileURLToPath } from 'node:url';
import { Client, StreamableHTTPClientTransport } from '@modelcontextprotocol/client';
import { afterAll, describe, expect, it } from 'vitest';
import { createMcpEndpoint } from './endpoint.ts';

const coursesDir = fileURLToPath(new URL('../../core/tests/fixtures/courses-valid', import.meta.url));

/** The tools by what they do to the learner's data (the declared hints must match). */
const READ_TOOLS = ['get_progress', 'get_next_lesson', 'get_lesson', 'list_courses', 'list_themes'];
const WRITE_TOOLS = [
  'set_profile',
  'set_path',
  'start_lesson',
  'complete_lesson',
  'skip_lesson',
  'level_check_skip_course',
  'reset_course',
  'save_lesson_notes',
  'record_review_score',
  'import_progress',
];
const DESTRUCTIVE_TOOLS = ['reset_course', 'import_progress'];

const clients: Client[] = [];
afterAll(() => Promise.all(clients.map((c) => c.close().catch(() => {}))));

async function listTools() {
  const endpoint = createMcpEndpoint({
    // Listing tools never touches the store.
    store: {} as never,
    gate: (_request, next) => next({ userId: 'tools-test', client: 'test' }),
    coursesDir,
  });
  const client = new Client({ name: 'lessonfolk-test', version: '1.0.0' });
  await client.connect(
    new StreamableHTTPClientTransport(new URL('http://127.0.0.1/mcp'), { fetch: (url, init) => endpoint(new Request(url, init)) }),
  );
  clients.push(client);
  return (await client.listTools()).tools;
}

describe('tool declarations', () => {
  it('declares exactly the read and write tools', async () => {
    const names = (await listTools()).map((t) => t.name).sort();
    expect(names).toEqual([...READ_TOOLS, ...WRITE_TOOLS].sort());
  });

  it('sets all four hints on every tool, matching what the tool does', async () => {
    for (const tool of await listTools()) {
      const a = tool.annotations;
      expect(a, tool.name).toMatchObject({ idempotentHint: true, openWorldHint: false });
      expect(a?.readOnlyHint, tool.name).toBe(READ_TOOLS.includes(tool.name));
      expect(a?.destructiveHint, tool.name).toBe(DESTRUCTIVE_TOOLS.includes(tool.name));
    }
  });

  it('sets annotations.title on every tool, the same as its title', async () => {
    for (const tool of await listTools()) {
      expect(tool.title, tool.name).toBeTruthy();
      expect(tool.annotations?.title, tool.name).toBe(tool.title);
    }
  });

  it('gives every tool an object input schema', async () => {
    for (const tool of await listTools()) expect(tool.inputSchema.type, tool.name).toBe('object');
  });
});
