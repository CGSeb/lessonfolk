import { describe, expect, it } from 'vitest';
import { analyticsTag } from './analytics';

const ID = '3f0d6c1e-7a52-4c1b-9e0a-2d8f5b6a1c47';
const PUBLIC = { noindex: false, notFound: false, signedIn: false };
const ORIGIN = 'https://lessonfolk.example';

describe('analyticsTag', () => {
  it('points the tracker and its collect endpoint at the site itself', () => {
    expect(analyticsTag(ORIGIN, PUBLIC, { UMAMI_WEBSITE_ID: ID })).toEqual({
      src: 'https://lessonfolk.example/u/script.js',
      hostUrl: 'https://lessonfolk.example/u',
      websiteId: ID,
    });
  });

  it('is off without a website id, or with something that is not an id', () => {
    expect(analyticsTag(ORIGIN, PUBLIC, {})).toBeNull();
    expect(analyticsTag(ORIGIN, PUBLIC, { UMAMI_WEBSITE_ID: '  ' })).toBeNull();
    expect(analyticsTag(ORIGIN, PUBLIC, { UMAMI_WEBSITE_ID: '"><script>alert(1)</script>' })).toBeNull();
  });

  it.each([
    ['a private page', { ...PUBLIC, noindex: true }],
    ['a page that was not found', { ...PUBLIC, notFound: true }],
    ['a signed-in learner', { ...PUBLIC, signedIn: true }],
  ])('measures nothing on %s', (_name, page) => {
    expect(analyticsTag(ORIGIN, page, { UMAMI_WEBSITE_ID: ID })).toBeNull();
  });
});
