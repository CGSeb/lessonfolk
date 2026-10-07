/**
 * The tutor procedures (prompts/*.md) as served: instructions and prompts through the official
 * MCP client (both protocol eras), and the prompt files checked against the real tools.
 * Listing prompts and tools never touches the progress store, so none is needed here.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import type { ProgressStore } from '@lessonfolk/core';
import { Client, StreamableHTTPClientTransport, type Tool } from '@modelcontextprotocol/client';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { createMcpEndpoint, type McpEndpoint } from './endpoint.ts';
import { INSTRUCTIONS, PROMPTS } from './prompts.ts';

const promptsDir = fileURLToPath(new URL('../prompts/', import.meta.url));
const coursesDir = fileURLToPath(new URL('../../core/tests/fixtures/courses-valid', import.meta.url));
const promptFiles = readdirSync(promptsDir).filter((f) => f.endsWith('.md'));
/** Statuses and kinds the tools return (list_courses, get_next_lesson). */
const STATUS_WORDS = ['not_started', 'in_progress', 'skipped_after_level_check', 'all_done'];
const fileText =(name: string) => readFileSync(`${promptsDir}${name}`, 'utf8').replace(/\r\n/g, '\n').trim();

const endpoint: McpEndpoint = createMcpEndpoint({
  store: {} as ProgressStore,
  gate: (_request, next) => next({ userId: 'prompt-test', client: 'test' }),
  coursesDir,
});
const clients: Client[] = [];

type Era = 'legacy' | 'modern';
async function connect(era: Era = 'legacy'): Promise<Client> {
  const client = new Client(
    { name: 'lessonfolk-test', version: '1.0.0' },
    era === 'modern' ? { versionNegotiation: { mode: { pin: '2026-07-28' } } } : {},
  );
  await client.connect(
    new StreamableHTTPClientTransport(new URL('http://127.0.0.1/mcp'), { fetch: (url, init) => endpoint(new Request(url, init)) }),
  );
  clients.push(client);
  return client;
}

afterEach(async () => {
  await Promise.all(clients.splice(0).map((c) => c.close().catch(() => {})));
});

describe.each<Era>(['legacy', 'modern'])('tutor prompts over MCP (%s protocol)', (era) => {
  it('serves prompts/instructions.md as the server instructions', async () => {
    const client = await connect(era);
    expect(client.getInstructions()).toBe(fileText('instructions.md'));
  });

  it('lists the learn, review and progress prompts, each with an optional request', async () => {
    const client = await connect(era);
    const { prompts } = await client.listPrompts();
    expect(prompts.map((p) => p.name)).toEqual(['learn', 'review', 'progress']);
    for (const prompt of prompts) {
      expect(prompt.description?.length).toBeGreaterThan(20);
      expect(prompt.arguments).toEqual([expect.objectContaining({ name: 'request', required: false })]);
    }
  });

  it.each(['learn', 'review', 'progress'])('returns the %s procedure followed by the tutor rules', async (name) => {
    const client = await connect(era);
    const plain = await client.getPrompt({ name });
    expect(plain.messages).toHaveLength(1);
    const { role, content } = plain.messages[0];
    expect(role).toBe('user');
    const text = (content as { text: string }).text;
    expect(text.startsWith(fileText(`${name}.md`))).toBe(true);
    expect(text.endsWith(INSTRUCTIONS)).toBe(true);
    expect(text).not.toContain('The learner asks');

    const asked = await client.getPrompt({ name, arguments: { request: 'recommend a path' } });
    expect((asked.messages[0].content as { text: string }).text).toContain('The learner asks: recommend a path');
  });
});

describe('prompt files', () => {
  let tools: Tool[];
  beforeAll(async () => {
    tools = (await (await connect()).listTools()).tools;
  });

  it('has one file per prompt plus the instructions', () => {
    expect(promptFiles.sort()).toEqual([...PROMPTS.map((p) => `${p.name}.md`), 'instructions.md'].sort());
  });

  it.each(promptFiles)('%s only calls tools that exist, with their own arguments', (file) => {
    const text = fileText(file);
    const calls = [...text.matchAll(/`([a-z]+(?:_[a-z]+)+)\(([^)`]*)\)`/g)];
    expect(calls.length).toBeGreaterThan(0);
    for (const [, name, args] of calls) {
      const tool = tools.find((t) => t.name === name);
      expect(tool, `${file} calls unknown tool ${name}`).toBeDefined();
      const properties = Object.keys((tool!.inputSchema as { properties?: object }).properties ?? {});
      for (const arg of args.split(',').map((a) => a.trim()).filter(Boolean)) {
        expect(properties, `${file}: ${name} has no argument "${arg}"`).toContain(arg);
      }
    }
    // Any other snake_case name in backticks is a tool or a status the tools return.
    const known = new Set([...tools.map((t) => t.name), ...STATUS_WORDS]);
    for (const [, word] of text.matchAll(/`([a-z]+(?:_[a-z]+)+)`/g)) {
      expect(known.has(word), `${file} names unknown tool or status ${word}`).toBe(true);
    }
  });

  it('mentions every tool somewhere', () => {
    const all = promptFiles.map(fileText).join('\n');
    for (const tool of tools) expect(all, `no prompt mentions ${tool.name}`).toContain(`\`${tool.name}(`);
  });

  it('keeps the rule about skipped courses in the instructions and the learn prompt', () => {
    for (const file of ['instructions.md', 'learn.md']) {
      const text = fileText(file);
      expect(text).toMatch(/say "as you saw" only if the learner did|only say "as you saw" if the learner did/i);
      expect(text).toContain('`done`');
      expect(text).toContain('skipped_after_level_check');
      expect(text).toMatch(/not started, never imply they saw it/);
    }
  });

  it('keeps the core teaching rules in the instructions', () => {
    expect(INSTRUCTIONS).toContain('Never paste the lesson');
    expect(INSTRUCTIONS).toContain('One question at a time');
    expect(INSTRUCTIONS).toContain('`get_progress()` first');
    expect(INSTRUCTIONS).toMatch(/right after every change/);
  });
});
