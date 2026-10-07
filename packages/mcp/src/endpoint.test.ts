import { describe, expect, it } from 'vitest';
import { localGate, type McpIdentity } from './endpoint.ts';
import { createRateLimiter } from './rate-limit.ts';

const passed = async (identity: McpIdentity) => Response.json(identity);

function request(headers: Record<string, string>, url = 'http://127.0.0.1:4321/mcp') {
  return new Request(url, { method: 'POST', headers });
}

describe('localGate (LESSONFOLK_AUTH=none)', () => {
  const open = localGate({ userId: 'local' });

  it('lets requests to this computer through as the local learner', async () => {
    for (const host of ['127.0.0.1:4321', 'localhost:4321', '[::1]:4321']) {
      const response = await open(request({ host }), passed);
      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({ userId: 'local', client: 'mcp' });
    }
  });

  it('refuses another Host (DNS rebinding) and other sites as Origin', async () => {
    expect((await open(request({ host: 'evil.example:4321' }), passed)).status).toBe(403);
    expect((await open(request({ host: '127.0.0.1:4321', origin: 'https://evil.example' }), passed)).status).toBe(403);
    expect((await open(request({ host: '127.0.0.1:4321', origin: 'http://localhost:4321' }), passed)).status).toBe(200);
  });

  it('requires the static token when one is set', async () => {
    const gate = localGate({ userId: 'local', token: 's3cret-token' });
    const missing = await gate(request({ host: '127.0.0.1' }), passed);
    expect(missing.status).toBe(401);
    expect(missing.headers.get('www-authenticate')).toContain('Bearer');
    expect((await gate(request({ host: '127.0.0.1', authorization: 'Bearer wrong' }), passed)).status).toBe(401);
    expect((await gate(request({ host: '127.0.0.1', authorization: 'Bearer s3cret-token' }), passed)).status).toBe(200);
  });
});

describe('createRateLimiter', () => {
  it('allows `limit` writes per window, then says how long to wait', () => {
    let now = 0;
    const limiter = createRateLimiter({ limit: 2, windowMs: 10_000, now: () => now });
    expect(limiter.take('a')).toBe(0);
    expect(limiter.take('a')).toBe(0);
    expect(limiter.take('a')).toBe(10);
    expect(limiter.take('b')).toBe(0);
    now = 10_000;
    expect(limiter.take('a')).toBe(0);
  });
});
