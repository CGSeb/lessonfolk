/** Helpers for the MCP end-to-end tests: an MCP SDK client, and a tiny cookie-keeping browser. */
import { request as httpRequest } from 'node:http';
import { Client, StreamableHTTPClientTransport, type CallToolResult } from '@modelcontextprotocol/client';

/** Connect the official MCP client to `<origin>/mcp` (2025 protocol, like most AI chats today). */
export async function connectMcp(origin: string, token?: string): Promise<Client> {
  const client = new Client({ name: 'lessonfolk-e2e', version: '1.0.0' });
  const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
  await client.connect(new StreamableHTTPClientTransport(new URL('/mcp', origin), { requestInit: { headers } }));
  return client;
}

export async function callJson(client: Client, name: string, args: Record<string, unknown> = {}) {
  const result = (await client.callTool({ name, arguments: args })) as CallToolResult;
  const text = (result.content[0] as { text: string }).text;
  if (result.isError) throw new Error(text);
  return text.includes('Progress now:\n') ? JSON.parse(text.split('Progress now:\n')[1]) : JSON.parse(text);
}

/** Fetch with the dashboard's cookies, following no redirect by itself. */
export class Browser {
  private cookies = new Map<string, string>();
  constructor(private readonly origin: string) {}

  /** The `Cookie` header this browser sends (for requests that must stay open, like event streams). */
  cookieHeader(): string {
    return [...this.cookies].map(([name, value]) => `${name}=${value}`).join('; ');
  }

  async request(url: string, init: RequestInit = {}): Promise<Response> {
    const headers = new Headers(init.headers);
    // Like a browser following links: Node's fetch would otherwise say "cors", and Better Auth answers fetches with JSON.
    if (!init.method || init.method === 'GET') {
      if (!headers.has('accept')) headers.set('Accept', 'text/html');
      headers.set('Sec-Fetch-Mode', 'navigate');
    }
    const sameOrigin = new URL(url, this.origin).origin === this.origin;
    if (sameOrigin && this.cookies.size > 0) {
      headers.set('Cookie', [...this.cookies].map(([name, value]) => `${name}=${value}`).join('; '));
    }
    const response = await rawRequest(new URL(url, this.origin), init.method ?? 'GET', headers, init.body as string | undefined);
    if (sameOrigin) {
      for (const cookie of response.headers.getSetCookie()) {
        const [pair, ...attributes] = cookie.split(';');
        const [name, ...rest] = pair.split('=');
        const value = rest.join('=');
        const expired = attributes.some((a) => /^\s*max-age=0\s*$/i.test(a)) || value === '';
        if (expired) this.cookies.delete(name.trim());
        else this.cookies.set(name.trim(), value);
      }
    }
    return response;
  }

  /** Submit a dashboard form, as a browser would (with its Origin header). */
  post(path: string, fields: Record<string, string> = {}): Promise<Response> {
    return this.request(path, {
      method: 'POST',
      headers: { Origin: this.origin, 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(fields).toString(),
    });
  }
}

/**
 * One HTTP request with exactly these headers. Node's fetch always sends `Sec-Fetch-Mode: cors`,
 * which a browser following a link never does (Better Auth then answers with JSON, not a redirect).
 */
function rawRequest(url: URL, method: string, headers: Headers, body?: string): Promise<Response> {
  return new Promise((resolve, reject) => {
    const outgoing: Record<string, string> = {};
    headers.forEach((value, name) => (outgoing[name] = value));
    if (body !== undefined) outgoing['content-length'] = String(Buffer.byteLength(body));
    const req = httpRequest(url, { method, headers: outgoing }, (res) => {
      const chunks: Buffer[] = [];
      res.on('data', (chunk: Buffer) => chunks.push(chunk));
      res.on('end', () => {
        const responseHeaders = new Headers();
        for (const [name, value] of Object.entries(res.headers)) {
          for (const v of Array.isArray(value) ? value : value === undefined ? [] : [value]) responseHeaders.append(name, v);
        }
        const status = res.statusCode ?? 500;
        const content = [204, 304].includes(status) ? null : Buffer.concat(chunks);
        resolve(new Response(content, { status, headers: responseHeaders }));
      });
    });
    req.on('error', reject);
    if (body !== undefined) req.write(body);
    req.end();
  });
}

export const location = (response: Response) => {
  const value = response.headers.get('location');
  if (!value) throw new Error(`Expected a redirect, got ${response.status}`);
  return value;
};
