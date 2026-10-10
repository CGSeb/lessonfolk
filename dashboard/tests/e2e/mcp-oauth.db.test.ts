/**
 * The MCP endpoint with LESSONFOLK_AUTH=oauth, end to end, the way an MCP client (Claude
 * Code, Codex) connects: 401 with the protected resource metadata, discovery, dynamic client
 * registration, authorization code + PKCE with sign-in (fake provider) and consent, token,
 * then the tools with the access token.
 */
import { createHash, randomBytes } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createTestDatabase, type TestDatabase } from '@lessonfolk/db/testing';
import { startFakeOAuth, type FakeOAuthServer } from './fake-oauth';
import { Browser, callJson, connectMcp, location } from './mcp-client';
import { freePort, startDashboard, visibleText, type DashboardServer } from './server';

// Like Claude Code: a localhost callback, registered without an application_type.
const REDIRECT_URI = 'http://localhost:33418/callback';

let testDb: TestDatabase;
let fake: FakeOAuthServer;
let server: DashboardServer;
let baseURL: string;

beforeAll(async () => {
  testDb = await createTestDatabase();
  fake = await startFakeOAuth();
  const port = await freePort();
  baseURL = `http://127.0.0.1:${port}`;
  server = await startDashboard({
    PORT: String(port),
    DATABASE_URL: testDb.url,
    LESSONFOLK_AUTH: 'oauth',
    LESSONFOLK_BASE_URL: baseURL,
    BETTER_AUTH_SECRET: 'test-secret-that-is-long-enough-1234567890',
    LESSONFOLK_TEST_OAUTH_URL: fake.url,
  });
});

afterAll(async () => {
  await server?.stop();
  await fake?.stop();
  await testDb?.drop();
});

interface Discovery {
  resource: string;
  authorizationEndpoint: string;
  tokenEndpoint: string;
  registrationEndpoint: string;
}

/** What an MCP client discovers from a 401 on /mcp. */
async function discover(): Promise<Discovery> {
  const unauthorized = await fetch(`${baseURL}/mcp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json, text/event-stream' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/list' }),
  });
  expect(unauthorized.status).toBe(401);
  const challenge = unauthorized.headers.get('www-authenticate') ?? '';
  const metadataUrl = /resource_metadata="([^"]+)"/.exec(challenge)?.[1];
  expect(metadataUrl, challenge).toBeTruthy();

  const resourceMetadata = await (await fetch(metadataUrl!)).json();
  expect(resourceMetadata.resource).toBe(`${baseURL}/mcp`);
  const issuer = new URL(resourceMetadata.authorization_servers[0]);
  expect(issuer.origin).toBe(baseURL);

  // RFC 8414: the issuer's path goes after the well-known name.
  const asMetadataResponse = await fetch(`${issuer.origin}/.well-known/oauth-authorization-server${issuer.pathname.replace(/\/$/, '')}`);
  expect(asMetadataResponse.status).toBe(200);
  const asMetadata = await asMetadataResponse.json();
  expect(asMetadata.issuer).toBe(issuer.href.replace(/\/$/, ''));
  expect(asMetadata.code_challenge_methods_supported).toContain('S256');
  expect(asMetadata.registration_endpoint).toBeTruthy();
  // Older clients look at the root paths too.
  for (const path of ['/.well-known/oauth-authorization-server', '/.well-known/oauth-protected-resource']) {
    const response = await fetch(`${baseURL}${path}`);
    expect(response.status, path).toBe(200);
  }
  return {
    resource: resourceMetadata.resource,
    authorizationEndpoint: asMetadata.authorization_endpoint,
    tokenEndpoint: asMetadata.token_endpoint,
    registrationEndpoint: asMetadata.registration_endpoint,
  };
}

async function register(d: Discovery): Promise<string> {
  const response = await fetch(d.registrationEndpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_name: 'Test MCP client',
      redirect_uris: [REDIRECT_URI],
      token_endpoint_auth_method: 'none',
      grant_types: ['authorization_code', 'refresh_token'],
      response_types: ['code'],
    }),
  });
  expect(response.status, await response.clone().text()).toBeLessThan(300);
  const client = await response.json();
  expect(client.client_id).toBeTruthy();
  return client.client_id;
}

/** Authorization code flow with PKCE, for the user the fake provider signs in. Returns the token response. */
interface TokenResult {
  access_token: string;
  refresh_token?: string;
  error?: string | null;
}

async function authorize(
  d: Discovery,
  clientId: string,
  accept = true,
  { scope = 'openid profile offline_access' }: { scope?: string } = {},
): Promise<TokenResult> {
  const verifier = randomBytes(32).toString('base64url');
  const challenge = createHash('sha256').update(verifier).digest('base64url');
  const state = randomBytes(8).toString('hex');
  const url = new URL(d.authorizationEndpoint);
  url.search = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    redirect_uri: REDIRECT_URI,
    code_challenge: challenge,
    code_challenge_method: 'S256',
    state,
    scope,
    resource: d.resource,
  }).toString();

  const browser = new Browser(baseURL);
  // Not signed in: the authorize endpoint sends us to the login page, which sends us to /sign-in.
  const toLogin = await browser.request(url.href, { headers: { Accept: 'text/html' } });
  expect(toLogin.status, await toLogin.clone().text()).toBe(302);
  expect(location(toLogin)).toContain('/oauth/sign-in?');
  const toSignIn = await browser.request(location(toLogin));
  const signInPage = new URL(location(toSignIn), baseURL);
  expect(signInPage.pathname).toBe('/sign-in');
  const next = signInPage.searchParams.get('next')!;
  expect(next.startsWith('/api/auth/oauth2/authorize?')).toBe(true);

  // Sign in with the fake provider; Better Auth sends us back to the authorize request.
  const start = await browser.post('/sign-in/fake', { next });
  const approved = await fetch(location(start), { redirect: 'manual' });
  const callback = await browser.request(location(approved));
  const backToAuthorize = location(callback);
  expect(backToAuthorize).toContain('/api/auth/oauth2/authorize?');

  // Signed in: the authorize endpoint asks for consent.
  const toConsent = await browser.request(backToAuthorize, { headers: { Accept: 'text/html' } });
  const consentUrl = new URL(location(toConsent), baseURL);
  expect(consentUrl.pathname).toBe('/oauth/consent');
  const consentPage = await browser.request(consentUrl.href);
  expect(consentPage.status).toBe(200);
  const consentHtml = await consentPage.text();
  const consentText = visibleText(consentHtml);
  expect(consentText).toContain('Allow Test MCP client to use LessonFolk?');
  expect(consentText).toContain('was chosen by the app itself');
  expect(consentText).toContain('localhost:33418');
  expect(consentText).toContain('on your own computer');
  expect(consentHtml).not.toContain('name="allow_write"');

  const decided = await browser.post('/oauth/consent/decide', { oauth_query: consentUrl.search.slice(1), accept: String(accept) });
  expect(decided.status, await decided.clone().text()).toBe(303);
  const back = new URL(location(decided));
  expect(back.origin + back.pathname).toBe(REDIRECT_URI);
  expect(back.searchParams.get('state')).toBe(state);
  if (!accept) return { access_token: '', error: back.searchParams.get('error') };

  const code = back.searchParams.get('code')!;
  const token = await fetch(d.tokenEndpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: REDIRECT_URI,
      client_id: clientId,
      code_verifier: verifier,
      resource: d.resource,
    }).toString(),
  });
  expect(token.status, await token.clone().text()).toBe(200);
  return (await token.json()) as TokenResult;
}

describe('MCP with LESSONFOLK_AUTH=oauth', () => {
  it('serves discovery, registration, sign-in, consent and token, then the tools as that user', async () => {
    const d = await discover();
    const clientId = await register(d);

    fake.signInAs({ sub: 'fake-robin', name: 'Robin Tester', email: 'robin@example.test' });
    const robin = await authorize(d, clientId);
    expect(robin.access_token.split('.')).toHaveLength(3); // A JWT bound to /mcp.

    const client = await connectMcp(baseURL, robin.access_token);
    try {
      expect((await client.listTools()).tools.length).toBeGreaterThan(10);
      expect(await callJson(client, 'get_progress')).toMatchObject({ profile: {}, lessons: {} });
      await callJson(client, 'set_profile', { name: 'Robin', level: 'beginner' });
      await callJson(client, 'start_lesson', { lessonId: 'ai-foundations/01-what-is-ai' });
    } finally {
      await client.close();
    }
    const [robinRow] = await testDb.sql`select u.id as user_id, u.email, l.profile from learner l join "user" u on u.id = l.user_id where l.profile->>'name' = 'Robin'`;
    expect(robinRow.email).toBe('robin@example.test');

    // Another person signs in with the same app: they see only their own progress.
    fake.signInAs({ sub: 'fake-sam', name: 'Sam Other', email: 'sam@example.test' });
    const sam = await authorize(d, clientId);
    const samClient = await connectMcp(baseURL, sam.access_token);
    try {
      expect(await callJson(samClient, 'get_progress')).toMatchObject({ profile: {}, lessons: {} });
      // Sam's token, whatever arguments he sends, only writes to Sam; Robin's data stays as it was.
      await callJson(samClient, 'set_profile', { name: 'Sam', userId: robinRow.user_id });
      await callJson(samClient, 'save_lesson_notes', { lessonId: 'ai-foundations/01-what-is-ai', notes: 'sam notes' }).catch(() => {});
      expect((await callJson(samClient, 'get_progress')).profile.name).toBe('Sam');
    } finally {
      await samClient.close();
    }
    const robinAgain = await connectMcp(baseURL, robin.access_token);
    try {
      const progress = await callJson(robinAgain, 'get_progress');
      expect(progress.profile.name).toBe('Robin');
      expect(progress.current).toBe('ai-foundations/01-what-is-ai');
      expect(JSON.stringify(progress)).not.toContain('Sam');
    } finally {
      await robinAgain.close();
    }
  });

  it('scopes the token: a read-only request cannot write; other apps get all they asked for', async () => {
    const d = await discover();
    const clientId = await register(d);
    fake.signInAs({ sub: 'fake-robin', name: 'Robin Tester', email: 'robin@example.test' });

    // The app asks to read only.
    const readOnly = await authorize(d, clientId, true, { scope: 'openid lessonfolk:read' });
    // The app asks for everything: allowing grants it all (the consent page has no partial choice).
    const full = await authorize(d, clientId, true, { scope: 'openid lessonfolk:read lessonfolk:write' });
    // An app that only knows the OpenID scopes keeps working (compatibility rule).
    const legacy = await authorize(d, clientId);

    for (const [name, token, canWrite] of [
      ['read only', readOnly, false],
      ['full', full, true],
      ['legacy', legacy, true],
    ] as const) {
      const client = await connectMcp(baseURL, token.access_token);
      try {
        await callJson(client, 'get_progress'); // Everyone reads.
        const attempt = callJson(client, 'set_profile', { level: 'beginner' });
        if (canWrite) await expect(attempt, name).resolves.toBeTruthy();
        else await expect(attempt, name).rejects.toThrow('lessonfolk:write');
      } finally {
        await client.close();
      }
    }
  });

  it('sends the app an error when the learner denies access', async () => {
    const d = await discover();
    const clientId = await register(d);
    fake.signInAs({ sub: 'fake-robin', name: 'Robin Tester', email: 'robin@example.test' });
    expect((await authorize(d, clientId, false)).error).toBe('access_denied');
  });

  it('refuses the access token of a deleted account at once', async () => {
    const d = await discover();
    const clientId = await register(d);
    fake.signInAs({ sub: 'fake-gone', name: 'Gone Soon', email: 'gone@example.test' });
    const gone = await authorize(d, clientId);
    const call = () =>
      fetch(`${baseURL}/mcp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json, text/event-stream', Authorization: `Bearer ${gone.access_token}` },
        body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/list' }),
      });
    expect((await call()).status).toBe(200);
    // What deleting the account does (see deleteLearnerData): the signed token itself is still unexpired.
    await testDb.sql`delete from "user" where email = 'gone@example.test'`;
    expect((await call()).status).toBe(401);
  });

  it('lets a learner disconnect an app: its access and refresh tokens stop working, and nobody else can do it', async () => {
    const d = await discover();
    const clientId = await register(d);
    const callMcp = (token: string) =>
      fetch(`${baseURL}/mcp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json, text/event-stream', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/list' }),
      });
    const refresh = (refreshToken: string) =>
      fetch(d.tokenEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ grant_type: 'refresh_token', refresh_token: refreshToken, client_id: clientId, resource: d.resource }).toString(),
      });
    const signIn = async (profile: Parameters<FakeOAuthServer['signInAs']>[0]) => {
      const browser = new Browser(baseURL);
      fake.signInAs(profile);
      const start = await browser.post('/sign-in/fake', { next: '/account' });
      const approved = await fetch(location(start), { redirect: 'manual' });
      await browser.request(location(approved));
      return browser;
    };

    const kim = { sub: 'fake-kim', name: 'Kim Connected', email: 'kim@example.test' };
    const lee = { sub: 'fake-lee', name: 'Lee Other', email: 'lee@example.test' };
    fake.signInAs(kim);
    const kimToken = await authorize(d, clientId);
    fake.signInAs(lee);
    const leeToken = await authorize(d, clientId);
    expect(kimToken.refresh_token).toBeTruthy();
    expect((await callMcp(kimToken.access_token)).status).toBe(200);

    // The account page lists the app, for its own user only.
    const kimBrowser = await signIn(kim);
    const leeBrowser = await signIn(lee);
    const kimPage = await (await kimBrowser.request('/account')).text();
    expect(visibleText(kimPage)).toContain('Test MCP client');
    expect(visibleText(kimPage)).toContain('Connected since');
    const consentIdOf = (html: string) => /name="consent" value="([^"]+)"/.exec(html)?.[1];
    const kimConsent = consentIdOf(kimPage)!;
    const leeConsent = consentIdOf(await (await leeBrowser.request('/account')).text())!;
    expect(kimConsent).toBeTruthy();
    expect(leeConsent).not.toBe(kimConsent);

    // Lee posts Kim's consent id: nothing is revoked.
    const attempt = await leeBrowser.post('/api/account/disconnect-app', { consent: kimConsent });
    expect(location(attempt)).toContain('error=app');
    expect((await callMcp(kimToken.access_token)).status).toBe(200);
    // A signed-out visitor and a cross-site post get nowhere either.
    expect(location(await new Browser(baseURL).post('/api/account/disconnect-app', { consent: kimConsent }))).toContain('/sign-in');
    const crossSite = await fetch(`${baseURL}/api/account/disconnect-app`, {
      method: 'POST',
      headers: { Origin: 'https://evil.example', 'Content-Type': 'application/x-www-form-urlencoded', Cookie: kimBrowser.cookieHeader() },
      body: `consent=${kimConsent}`,
      redirect: 'manual',
    });
    expect(crossSite.status).toBe(403);
    expect((await callMcp(kimToken.access_token)).status).toBe(200);

    // Kim disconnects: access token, refresh token and the listing all go.
    const done = await kimBrowser.post('/api/account/disconnect-app', { consent: kimConsent });
    expect(location(done)).toContain('disconnected=1');
    expect((await callMcp(kimToken.access_token)).status).toBe(401);
    expect((await refresh(kimToken.refresh_token!)).status).toBeGreaterThanOrEqual(400);
    expect(visibleText(await (await kimBrowser.request('/account')).text())).toContain('No AI app is connected');
    // Lee is unaffected.
    expect((await callMcp(leeToken.access_token)).status).toBe(200);
    expect((await refresh(leeToken.refresh_token!)).status).toBe(200);
    expect(consentIdOf(await (await leeBrowser.request('/account')).text())).toBe(leeConsent);

    // Allowing the app again does not bring the old token back (consents and tokens are dated to the second).
    await new Promise((resolve) => setTimeout(resolve, 1100));
    fake.signInAs(kim);
    const again = await authorize(d, clientId);
    expect((await callMcp(again.access_token)).status).toBe(200);
    expect((await callMcp(kimToken.access_token)).status).toBe(401);
  });

  it('refuses a forged or foreign token', async () => {
    const d = await discover();
    const forged = `${Buffer.from('{"alg":"none"}').toString('base64url')}.${Buffer.from(JSON.stringify({ sub: 'fake-robin', aud: d.resource })).toString('base64url')}.`;
    for (const token of [forged, 'not-a-token']) {
      const response = await fetch(`${baseURL}/mcp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json, text/event-stream', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/list' }),
      });
      expect(response.status).toBe(401);
    }
  });

  it('keeps the consent page behind sign-in, and refuses consent posted from another site', async () => {
    const signedOut = await new Browser(baseURL).request('/oauth/consent?client_id=x&sig=y');
    expect(signedOut.status).toBe(303);
    expect(location(signedOut)).toContain('/sign-in?next=');

    const crossSite = await fetch(`${baseURL}/oauth/consent/decide`, {
      method: 'POST',
      headers: { Origin: 'https://evil.example', 'Content-Type': 'application/x-www-form-urlencoded' },
      body: 'accept=true&oauth_query=x',
      redirect: 'manual',
    });
    expect(crossSite.status).toBe(403);
  });
  it('refuses oversized request bodies on /mcp and on the OAuth endpoints', async () => {
    const big = 'x'.repeat(2 * 1024 * 1024);
    const mcp = await fetch(`${baseURL}/mcp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer not-a-token' },
      body: big,
    });
    expect(mcp.status).toBe(413);
    const d = await discover();
    const register = await fetch(d.registrationEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ client_name: big, redirect_uris: [REDIRECT_URI] }),
    });
    expect(register.status).toBe(413);
  });

  // Last on purpose: it uses up the registration budget of this address.
  it('rate limits open client registration per address', async () => {
    const d = await discover();
    const statuses: number[] = [];
    for (let i = 0; i < 15; i++) {
      const response = await fetch(d.registrationEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ client_name: `Flood ${i}`, redirect_uris: [REDIRECT_URI], token_endpoint_auth_method: 'none' }),
      });
      statuses.push(response.status);
      if (response.status === 429) {
        expect(Number(response.headers.get('retry-after'))).toBeGreaterThan(0);
        break;
      }
    }
    expect(statuses.at(-1)).toBe(429);
    expect(statuses.filter((status) => status < 300).length).toBeLessThanOrEqual(10);
  });
});
