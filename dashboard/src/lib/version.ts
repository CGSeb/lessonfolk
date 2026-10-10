const RELEASES_URL = 'https://github.com/CGSeb/lessonfolk/releases/tag/';

export interface Release {
  /** The release tag, e.g. `v0.2.0`. */
  version: string;
  /** The page of that release on GitHub. */
  url: string;
}

/**
 * The release this server runs, from LESSONFOLK_VERSION (set in the published Docker image
 * to the release's tag). Nothing when it is not set (a build of a checkout) or is not a
 * plain tag name.
 */
export function currentRelease(env: Record<string, string | undefined> = process.env): Release | null {
  const version = env.LESSONFOLK_VERSION?.trim();
  if (!version || !/^[A-Za-z0-9._-]+$/.test(version)) return null;
  return { version, url: RELEASES_URL + version };
}
