import { describe, expect, it } from 'vitest';
import { localGate, type McpIdentity } from './endpoint.ts';
import { callerAddress, limitBodySize } from './limits.ts';
import { createOAuthLimits } from './oauth-limits.ts';
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

describe('callerAddress', () => {
  it('prefers the last X-Forwarded-For entry, then the socket address', () => {
    const forwarded = new Request('http://x/mcp', { headers: { 'x-forwarded-for': '6.6.6.6, 203.0.113.7' } });
    expect(callerAddress(forwarded, { clientAddress: '10.0.0.1' })).toBe('203.0.113.7');
    expect(callerAddress(new Request('http://x/mcp'), { clientAddress: '192.0.2.9' })).toBe('192.0.2.9');
    expect(callerAddress(new Request('http://x/mcp'))).toBe('unknown');
  });
});

describe('limitBodySize', () => {
  const post = (body: BodyInit, headers: Record<string, string> = {}) => new Request('http://x/mcp', { method: 'POST', body, headers });

  it('lets a small body through, still readable', async () => {
    const result = await limitBodySize(post('{"a":1}'), 100);
    expect(result).toBeInstanceOf(Request);
    expect(await (result as Request).text()).toBe('{"a":1}');
  });

  it('refuses a body over the limit with 413, declared or streamed', async () => {
    const declared = await limitBodySize(post('x'.repeat(200)), 100);
    expect(declared).toBeInstanceOf(Response);
    expect((declared as Response).status).toBe(413);

    // No Content-Length (chunked): counted while reading.
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        for (let i = 0; i < 5; i++) controller.enqueue(new Uint8Array(40));
        controller.close();
      },
    });
    const chunked = new Request('http://x/mcp', { method: 'POST', body: stream, duplex: 'half' } as RequestInit);
    chunked.headers.delete('content-length');
    const result = await limitBodySize(chunked, 100);
    expect((result as Response).status).toBe(413);
  });

  it('passes a request without a body', async () => {
    const get = new Request('http://x/mcp');
    expect(await limitBodySize(get, 10)).toBe(get);
  });
});

describe('createOAuthLimits', () => {
  const request = (path: string, headers: Record<string, string> = {}, body?: string) =>
    new Request(`http://x/api/auth${path}`, { method: body ? 'POST' : 'GET', headers, body });

  it('rate limits each OAuth endpoint per caller address, and only those', async () => {
    const limits = createOAuthLimits({ limits: { register: { limit: 2, windowMs: 60_000 } }, fallback: { limit: 3, windowMs: 60_000 } });
    const from = (ip: string) => ({ 'x-forwarded-for': ip });
    expect(await limits(request('/oauth2/register', from('1.1.1.1'), '{}'))).toBeInstanceOf(Request);
    expect(await limits(request('/oauth2/register', from('1.1.1.1'), '{}'))).toBeInstanceOf(Request);
    const refused = (await limits(request('/oauth2/register', from('1.1.1.1'), '{}'))) as Response;
    expect(refused.status).toBe(429);
    expect(Number(refused.headers.get('retry-after'))).toBeGreaterThan(0);
    // Another address, and another endpoint, have their own budget.
    expect(await limits(request('/oauth2/register', from('2.2.2.2'), '{}'))).toBeInstanceOf(Request);
    for (let i = 0; i < 3; i++) expect(await limits(request('/oauth2/revoke', from('1.1.1.1')))).toBeInstanceOf(Request);
    expect(((await limits(request('/oauth2/revoke', from('1.1.1.1')))) as Response).status).toBe(429);
    // Sign-in callbacks and the session are not touched.
    for (let i = 0; i < 10; i++) expect(await limits(request('/get-session', from('1.1.1.1')))).toBeInstanceOf(Request);
  });

  it('refuses a body over the limit', async () => {
    const limits = createOAuthLimits({ maxBodyBytes: 50 });
    const refused = (await limits(request('/oauth2/register', {}, 'x'.repeat(100)))) as Response;
    expect(refused.status).toBe(413);
  });
});
