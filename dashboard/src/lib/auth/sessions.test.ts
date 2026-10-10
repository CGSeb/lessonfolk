import { describe, expect, it } from 'vitest';
import { describeBrowser, isPastMaxAge, SESSION_MAX_AGE_SECONDS } from './sessions';

describe('absolute session lifetime', () => {
  it('is 30 days from sign-in', () => {
    expect(SESSION_MAX_AGE_SECONDS).toBe(30 * 24 * 60 * 60);
    const created = new Date('2026-01-01T00:00:00Z');
    expect(isPastMaxAge(created, new Date('2026-01-30T23:59:59Z'))).toBe(false);
    expect(isPastMaxAge(created, new Date('2026-01-31T00:00:00Z'))).toBe(true);
  });
});

describe('describeBrowser', () => {
  it('names the browser and the system, nothing else', () => {
    expect(describeBrowser('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36')).toBe(
      'Chrome on Windows',
    );
    expect(describeBrowser('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126.0.0.0 Safari/537.36 Edg/126.0.0.0')).toBe(
      'Edge on Windows',
    );
    expect(describeBrowser('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15')).toBe(
      'Safari on macOS',
    );
    expect(describeBrowser('Mozilla/5.0 (X11; Linux x86_64; rv:127.0) Gecko/20100101 Firefox/127.0')).toBe('Firefox on Linux');
    expect(describeBrowser('Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 Version/17.5 Mobile/15E148 Safari/604.1')).toBe(
      'Safari on iOS',
    );
  });

  it('returns null when there is nothing to name', () => {
    expect(describeBrowser(null)).toBeNull();
    expect(describeBrowser('')).toBeNull();
    expect(describeBrowser('curl/8.0')).toBeNull();
  });
});
