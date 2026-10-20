/**
 * Domain verification for OpenAI's plugin directory: the submission portal
 * gives a token, and checks that `/.well-known/openai-apps-challenge` on this host returns it as
 * plain text. The route answers only when OPENAI_APPS_CHALLENGE is set, so a LessonFolk you run
 * yourself serves nothing there.
 */

/** The shape of the tokens the portal hands out: a single line of URL-safe characters. */
const TOKEN = /^[A-Za-z0-9._~+/=-]{8,512}$/;

/** The token to serve, or nothing when OPENAI_APPS_CHALLENGE is not set or is not a token. */
export function openAiChallenge(env: Record<string, string | undefined> = process.env): string | null {
  const token = env.OPENAI_APPS_CHALLENGE?.trim() ?? '';
  return TOKEN.test(token) ? token : null;
}

/** The response of `/.well-known/openai-apps-challenge`: the token as plain text, or 404. */
export function openAiChallengeResponse(env: Record<string, string | undefined> = process.env): Response {
  const token = openAiChallenge(env);
  if (!token) return new Response('Not found.', { status: 404, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
  return new Response(token, { headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' } });
}
