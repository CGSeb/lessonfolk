import type { APIRoute } from 'astro';
import { openAiChallengeResponse } from '../../lib/openai-challenge';

export const prerender = false;

/** Domain verification for OpenAI's plugin directory: the token of OPENAI_APPS_CHALLENGE, as plain text. */
export const GET: APIRoute = () => openAiChallengeResponse();
