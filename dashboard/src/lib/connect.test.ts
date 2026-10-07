import { describe, expect, it } from 'vitest';
import { connectClients } from '../components/connect/clients';
import { mcpConnection } from './connect';
import type { OAuthSettings } from './auth/settings';

const oauth = (baseURL: string): OAuthSettings => ({ mode: 'oauth', baseURL, secret: 'x'.repeat(32), providers: {} });
const page = new URL('http://127.0.0.1:4321/connect');

describe('mcpConnection', () => {
  it('uses the address of the page in none mode, for apps on this computer only', () => {
    expect(mcpConnection({ mode: 'none' }, page, {})).toEqual({
      url: 'http://127.0.0.1:4321/mcp',
      mode: 'none',
      tokenRequired: false,
      reachableFromWeb: false,
    });
    expect(mcpConnection({ mode: 'none' }, new URL('http://localhost:4400/connect'), {}).url).toBe('http://localhost:4400/mcp');
  });

  it('says when LESSONFOLK_MCP_TOKEN is required, without exposing it', () => {
    const connection = mcpConnection({ mode: 'none' }, page, { LESSONFOLK_MCP_TOKEN: 'secret-token' });
    expect(connection.tokenRequired).toBe(true);
    expect(JSON.stringify(connectClients(connection))).not.toContain('secret-token');
    expect(mcpConnection({ mode: 'none' }, page, { LESSONFOLK_MCP_TOKEN: '  ' }).tokenRequired).toBe(false);
  });

  it('uses LESSONFOLK_BASE_URL in oauth mode, whatever address the page was opened on', () => {
    const connection = mcpConnection(oauth('https://learn.example.org'), new URL('http://10.0.0.5:4321/connect'), {});
    expect(connection).toEqual({ url: 'https://learn.example.org/mcp', mode: 'oauth', tokenRequired: false, reachableFromWeb: true });
    expect(mcpConnection(oauth('http://localhost:4321'), page, {}).reachableFromWeb).toBe(false);
  });
});

describe('connectClients', () => {
  const byId = (clients: ReturnType<typeof connectClients>) => Object.fromEntries(clients.map((c) => [c.id, c]));

  it('lists every app, and web chats as not available on this computer', () => {
    const clients = byId(connectClients(mcpConnection({ mode: 'none' }, page, {})));
    expect(Object.keys(clients)).toEqual(['claude-code', 'codex', 'cursor', 'claude-desktop', 'claude-ai', 'chatgpt']);
    expect(clients['claude-code'].steps[0].code).toBe('claude mcp add --transport http lessonfolk http://127.0.0.1:4321/mcp');
    expect(clients['codex'].steps[0].code).toBe('codex mcp add lessonfolk --url http://127.0.0.1:4321/mcp');
    expect(JSON.parse(clients['cursor'].steps[0].code!)).toEqual({ mcpServers: { lessonfolk: { url: 'http://127.0.0.1:4321/mcp' } } });
    // Claude Desktop's connectors come from Anthropic's servers: a local bridge instead.
    expect(clients['claude-desktop'].steps[0].code).toContain('mcp-remote');
    expect(clients['claude-ai'].available).toBe(false);
    expect(clients['chatgpt'].available).toBe(false);
  });

  it('adds the token header where each app takes it', () => {
    const clients = byId(connectClients(mcpConnection({ mode: 'none' }, page, { LESSONFOLK_MCP_TOKEN: 't' })));
    expect(clients['claude-code'].steps[0].code).toContain('--header "Authorization: Bearer <your token>"');
    expect(clients['codex'].steps[0].code).toContain('--bearer-token-env-var LESSONFOLK_MCP_TOKEN');
    expect(JSON.parse(clients['cursor'].steps[0].code!).mcpServers.lessonfolk.headers).toEqual({ Authorization: 'Bearer <your token>' });
  });

  it('offers web chats and the sign-in steps on a public https address', () => {
    const clients = byId(connectClients(mcpConnection(oauth('https://learn.example.org'), page, {})));
    expect(clients['claude-ai'].available).toBe(true);
    expect(clients['chatgpt'].available).toBe(true);
    expect(clients['claude-desktop'].steps[0].code).toBeUndefined();
    expect(clients['codex'].steps[1].code).toBe('codex mcp login lessonfolk');
    expect(clients['claude-code'].steps[0].code).toBe('claude mcp add --transport http lessonfolk https://learn.example.org/mcp');
  });
});
