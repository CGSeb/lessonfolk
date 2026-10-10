import { describe, expect, it } from 'vitest';
import { isLoopbackHost } from './oauth.ts';

describe('isLoopbackHost', () => {
  it('accepts loopback hosts only', () => {
    for (const host of ['localhost', '127.0.0.1', '[::1]', 'app.localhost']) expect(isLoopbackHost(host)).toBe(true);
    for (const host of ['example.com', 'localhost.evil.com', '127.0.0.2', '192.168.1.5']) expect(isLoopbackHost(host)).toBe(false);
  });
});
