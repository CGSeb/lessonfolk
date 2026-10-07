import type { APIRoute } from 'astro';
import { rootDiscoveryHandler } from '@lessonfolk/mcp';
import { getAuth } from '../../lib/auth/auth';
import { getAuthSettings } from '../../lib/auth/current-user';

export const prerender = false;

let rootDiscovery: ReturnType<typeof rootDiscoveryHandler> | undefined;

/**
 * OAuth discovery for MCP clients (LESSONFOLK_AUTH=oauth only): the protected resource
 * metadata of /mcp (RFC 9728) and the authorization server metadata (RFC 8414, OpenID
 * configuration), at the paths with and without the issuer path `/api/auth`.
 */
export const GET: APIRoute = ({ request }) => {
  if (getAuthSettings().mode !== 'oauth') return Response.json({ error: 'Not found.' }, { status: 404 });
  const auth = getAuth();
  rootDiscovery ??= rootDiscoveryHandler(auth);
  return rootDiscovery(request) ?? auth.handler(request);
};
