#!/bin/sh
# Deploy the latest LessonFolk release, pulled by the server itself: nothing outside holds a key to it.
# Run every few minutes by lessonfolk-update.timer (see lessonfolk-update.service). When a new
# release (not a pre-release) is published and its image is on GHCR, it copies that tag's deploy/
# files here and runs ./deploy.sh <tag>. Until the image is published (release.yml runs the tests
# first) it waits for the next run.
# A rollback by hand (./deploy.sh <older tag>) stays in place until the next release.
set -eu

repo=CGSeb/lessonfolk
image=ghcr.io/cgseb/lessonfolk

# Everything is in a function, read in full before it runs: this script replaces itself with the
# release's copy while it runs.
main() {
  cd "$(dirname "$0")"
  # The last release this script deployed, or the tag running now on its first run.
  last=$(cat .last-release 2>/dev/null || sed -n 's/^LESSONFOLK_IMAGE_TAG=//p' image.env 2>/dev/null || true)

  tag=$(curl -fsS --max-time 30 -H 'Accept: application/vnd.github+json' \
    "https://api.github.com/repos/$repo/releases/latest" |
    sed -n 's/^ *"tag_name": *"\([^"]*\)".*/\1/p' | head -n 1)
  case "$tag" in *[!A-Za-z0-9._-]*|'') echo "No usable release tag from GitHub." >&2; exit 1;; esac
  [ "$tag" = "$last" ] && exit 0

  if ! docker pull -q "$image:$tag" > /dev/null 2>&1; then
    echo "Release $tag: its image is not published yet, trying again on the next run."
    exit 0
  fi

  echo "Deploying release $tag."
  tmp=$(mktemp -d)
  trap 'rm -rf "$tmp"' EXIT
  curl -fsSL --max-time 120 "https://codeload.github.com/$repo/tar.gz/refs/tags/$tag" |
    tar -xz -C "$tmp" --strip-components=2 --wildcards '*/deploy/'
  # Same files as the repository's deploy/ folder; .env and image.env are not in it and are kept.
  cp -r "$tmp"/. .
  chmod +x ./*.sh
  ./deploy.sh "$tag"
  echo "$tag" > .last-release
}

main "$@"
exit
