import { describe, expect, it } from 'vitest';
import { currentRelease } from './version';

describe('currentRelease', () => {
  it('gives the release tag and its GitHub page', () => {
    expect(currentRelease({ LESSONFOLK_VERSION: ' v0.2.0 ' })).toEqual({
      version: 'v0.2.0',
      url: 'https://github.com/CGSeb/lessonfolk/releases/tag/v0.2.0',
    });
  });

  it('gives nothing when no release is set', () => {
    expect(currentRelease({})).toBeNull();
    expect(currentRelease({ LESSONFOLK_VERSION: '' })).toBeNull();
  });

  it('ignores a value that is not a plain tag name', () => {
    expect(currentRelease({ LESSONFOLK_VERSION: 'v1/../..' })).toBeNull();
    expect(currentRelease({ LESSONFOLK_VERSION: '"><script>' })).toBeNull();
  });
});
