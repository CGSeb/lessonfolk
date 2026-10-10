import { describe, expect, it } from 'vitest';
import { CONTENT_SECURITY_POLICY, CSP_DIRECTIVES, securityHeaders, withSecurityHeaders } from './security-headers';

describe('securityHeaders', () => {
  it('locks down framing, sniffing, plugins and the base URL', () => {
    const headers = securityHeaders(false);
    expect(headers['X-Content-Type-Options']).toBe('nosniff');
    expect(headers['X-Frame-Options']).toBe('DENY');
    expect(headers['Referrer-Policy']).toBe('strict-origin-when-cross-origin');
    expect(CONTENT_SECURITY_POLICY).toContain("default-src 'self'");
    expect(CONTENT_SECURITY_POLICY).toContain("frame-ancestors 'none'");
    expect(CONTENT_SECURITY_POLICY).toContain("object-src 'none'");
    expect(CONTENT_SECURITY_POLICY).toContain("base-uri 'self'");
    // No inline scripts or <style> elements; only style="" attributes are allowed inline.
    expect(CONTENT_SECURITY_POLICY).not.toMatch(/(?:script|style)-src(?:-elem)? [^;]*'unsafe-inline'/);
    expect(CONTENT_SECURITY_POLICY).toContain("script-src 'self'");
    expect(CONTENT_SECURITY_POLICY).toContain("style-src-attr 'unsafe-inline'");
    expect(CSP_DIRECTIVES.join('; ')).not.toContain('unsafe-inline');
    // form-action would block the redirect to the sign-in provider.
    expect(CONTENT_SECURITY_POLICY).not.toContain('form-action');
  });

  it('sends HSTS only over HTTPS', () => {
    expect(securityHeaders(false)['Strict-Transport-Security']).toBeUndefined();
    expect(securityHeaders(true)['Strict-Transport-Security']).toMatch(/^max-age=\d{8,}/);
  });
});

describe('withSecurityHeaders', () => {
  it('keeps the body, status and headers a route set (such as the avatar CSP)', async () => {
    const response = withSecurityHeaders(
      new Response('hello', { status: 201, headers: { 'Content-Security-Policy': "default-src 'none'", 'X-Custom': '1' } }),
      false,
    );
    expect(response.status).toBe(201);
    expect(await response.text()).toBe('hello');
    expect(response.headers.get('content-security-policy')).toBe("default-src 'none'");
    expect(response.headers.get('x-custom')).toBe('1');
    expect(response.headers.get('x-frame-options')).toBe('DENY');
  });
});
