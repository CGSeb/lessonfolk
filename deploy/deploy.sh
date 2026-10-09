#!/bin/sh
# Deploy an image tag of LessonFolk: ./deploy.sh sha-0123456789ab   (or: latest)
# Run by release.yml over SSH after the image is published; run it by hand to roll back
# to an earlier tag.
set -eu
cd "$(dirname "$0")"
tag="${1:?Usage: ./deploy.sh <image tag>}"

echo "LESSONFOLK_IMAGE_TAG=$tag" > image.env
compose="docker compose --env-file .env --env-file image.env"

$compose pull
# Pending database migrations run when the app container starts.
$compose up -d --remove-orphans
docker image prune -f > /dev/null
echo "Deployed $tag."
