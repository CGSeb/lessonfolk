#!/bin/sh
# Deploy an image tag of LessonFolk: ./deploy.sh v1.0.0   (a release tag, or: latest)
# Run by release.yml over SSH after the image is published; run it by hand to roll back
# to an earlier tag.
set -eu
cd "$(dirname "$0")"
tag="${1:?Usage: ./deploy.sh <image tag>}"

# The app connects to Postgres as the least-privilege role lessonfolk_app. Generate its password
# once if .env does not have one yet (existing servers get it on their first deploy of this version).
if ! grep -q '^LESSONFOLK_APP_DB_PASSWORD=.' .env; then
  echo "LESSONFOLK_APP_DB_PASSWORD=$(openssl rand -hex 24)" >> .env
  echo "Generated LESSONFOLK_APP_DB_PASSWORD in .env."
fi

echo "LESSONFOLK_IMAGE_TAG=$tag" > image.env
compose="docker compose --env-file .env --env-file image.env"

$compose pull
# Pending database migrations run when the app container starts.
$compose up -d --remove-orphans
docker image prune -f > /dev/null
echo "Deployed $tag."
