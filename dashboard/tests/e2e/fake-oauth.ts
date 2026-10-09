/**
 * A tiny OAuth 2.0 provider for the tests, on 127.0.0.1. The dashboard's `fake`
 * provider (src/lib/auth/auth.ts) talks to it like it talks to GitHub or Google:
 * authorize redirect, code exchange with PKCE, then the user profile.
 *
 * /authorize approves at once (no login screen) for the profile set with `signInAs`.
 */
import { createHash, randomBytes } from 'node:crypto';
import { createServer, type IncomingMessage } from 'node:http';
import type { AddressInfo } from 'node:net';

export interface FakeProfile {
  sub: string;
  name: string;
  email: string;
}

export interface FakeOAuthServer {
  url: string;
  /** The profile the next sign-ins get. */
  signInAs(profile: FakeProfile): void;
  /** Requests received, e.g. `GET /authorize`, `POST /token`, for assertions. */
  requests: string[];
  stop(): Promise<void>;
}

const CLIENT_ID = 'lessonfolk-test';
const CLIENT_SECRET = 'lessonfolk-test-secret';

function readBody(request: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let body = '';
    request.setEncoding('utf8');
    request.on('data', (chunk: string) => (body += chunk));
    request.on('end', () => resolve(body));
    request.on('error', reject);
  });
}

/** Client credentials from HTTP Basic auth or from the form (both are allowed by OAuth 2.0). */
function clientCredentials(request: IncomingMessage, form: URLSearchParams) {
  const basic = /^Basic (.+)$/i.exec(request.headers.authorization ?? '');
  if (basic) {
    const [id, secret] = Buffer.from(basic[1], 'base64').toString().split(':').map(decodeURIComponent);
    return { id, secret };
  }
  return { id: form.get('client_id'), secret: form.get('client_secret') };
}

export async function startFakeOAuth(): Promise<FakeOAuthServer> {
  let profile: FakeProfile = { sub: 'fake-1', name: 'Robin Tester', email: 'robin@example.test' };
  const codes = new Map<string, { redirectUri: string; challenge: string | null; profile: FakeProfile }>();
  const tokens = new Map<string, FakeProfile>();
  const requests: string[] = [];

  const server = createServer(async (request, response) => {
    const url = new URL(request.url ?? '/', 'http://127.0.0.1');
    requests.push(`${request.method} ${url.pathname}`);
    const json = (status: number, body: unknown) => {
      response.writeHead(status, { 'Content-Type': 'application/json' });
      response.end(JSON.stringify(body));
    };

    if (request.method === 'GET' && url.pathname === '/authorize') {
      const redirectUri = url.searchParams.get('redirect_uri');
      if (url.searchParams.get('client_id') !== CLIENT_ID || !redirectUri) return json(400, { error: 'invalid_request' });
      const code = randomBytes(16).toString('hex');
      codes.set(code, { redirectUri, challenge: url.searchParams.get('code_challenge'), profile });
      const back = new URL(redirectUri);
      back.searchParams.set('code', code);
      const state = url.searchParams.get('state');
      if (state) back.searchParams.set('state', state);
      response.writeHead(302, { Location: back.toString() });
      return response.end();
    }

    if (request.method === 'POST' && url.pathname === '/token') {
      const form = new URLSearchParams(await readBody(request));
      const client = clientCredentials(request, form);
      if (client.id !== CLIENT_ID || client.secret !== CLIENT_SECRET) return json(401, { error: 'invalid_client' });
      const grant = codes.get(form.get('code') ?? '');
      codes.delete(form.get('code') ?? '');
      if (!grant || grant.redirectUri !== form.get('redirect_uri')) return json(400, { error: 'invalid_grant' });
      if (grant.challenge) {
        const verifier = form.get('code_verifier') ?? '';
        const computed = createHash('sha256').update(verifier).digest('base64url');
        if (computed !== grant.challenge) return json(400, { error: 'invalid_grant', error_description: 'PKCE check failed' });
      }
      const accessToken = randomBytes(16).toString('hex');
      tokens.set(accessToken, grant.profile);
      return json(200, { access_token: accessToken, token_type: 'Bearer', expires_in: 3600, scope: 'openid email profile' });
    }

    if (request.method === 'GET' && url.pathname === '/userinfo') {
      const token = /^Bearer (.+)$/i.exec(request.headers.authorization ?? '')?.[1];
      const user = token && tokens.get(token);
      if (!user) return json(401, { error: 'invalid_token' });
      // A plain OAuth 2.0 profile (like GitHub's): the account id is `id`.
      return json(200, { id: user.sub, name: user.name, email: user.email, email_verified: true, picture: 'https://example.test/avatar.png' });
    }

    json(404, { error: 'not_found' });
  });

  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address() as AddressInfo;

  return {
    url: `http://127.0.0.1:${port}`,
    signInAs(next) {
      profile = next;
    },
    requests,
    stop: () =>
      new Promise((resolve) => {
        server.closeAllConnections();
        server.close(() => resolve());
      }),
  };
}
