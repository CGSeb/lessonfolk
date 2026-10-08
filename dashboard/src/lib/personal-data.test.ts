import { describe, expect, it } from 'vitest';
import { isRecentSignIn, RECENT_SIGN_IN_MS } from './personal-data';

const now = new Date('2026-01-01T12:00:00Z');

describe('isRecentSignIn', () => {
  it('needs nothing without sign-in (none mode)', () => {
    expect(isRecentSignIn('none', null, now)).toBe(true);
  });

  it('accepts a sign-in within the last 10 minutes, and refuses an older or unknown one', () => {
    expect(isRecentSignIn('oauth', new Date(now.getTime() - 60_000), now)).toBe(true);
    expect(isRecentSignIn('oauth', new Date(now.getTime() - RECENT_SIGN_IN_MS), now)).toBe(true);
    expect(isRecentSignIn('oauth', new Date(now.getTime() - RECENT_SIGN_IN_MS - 1), now)).toBe(false);
    expect(isRecentSignIn('oauth', null, now)).toBe(false);
  });
});
