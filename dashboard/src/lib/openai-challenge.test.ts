import { describe, expect, it } from 'vitest';
import { openAiChallenge, openAiChallengeResponse } from './openai-challenge';

describe('openAiChallenge', () => {
  it('is off unless OPENAI_APPS_CHALLENGE holds a token', () => {
    expect(openAiChallenge({})).toBeNull();
    expect(openAiChallenge({ OPENAI_APPS_CHALLENGE: '   ' })).toBeNull();
    expect(openAiChallenge({ OPENAI_APPS_CHALLENGE: 'short' })).toBeNull();
    expect(openAiChallenge({ OPENAI_APPS_CHALLENGE: 'has spaces and <tags>' })).toBeNull();
    expect(openAiChallenge({ OPENAI_APPS_CHALLENGE: 'abc123_-.XYZ789' })).toBe('abc123_-.XYZ789');
  });

  it('trims the value it serves', () => {
    expect(openAiChallenge({ OPENAI_APPS_CHALLENGE: '  abc123_-.XYZ789\n' })).toBe('abc123_-.XYZ789');
  });
});

describe('openAiChallengeResponse', () => {
  it('serves the token as plain text, not JSON or HTML', async () => {
    const response = openAiChallengeResponse({ OPENAI_APPS_CHALLENGE: 'abc123_-.XYZ789' });
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('text/plain');
    expect(await response.text()).toBe('abc123_-.XYZ789');
  });

  it('answers 404 when no token is set', async () => {
    const response = openAiChallengeResponse({});
    expect(response.status).toBe(404);
    expect(await response.text()).toBe('Not found.');
  });
});
