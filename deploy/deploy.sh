#!/bin/sh
# Deploy an image tag of LessonFolk: ./deploy.sh v1.0.0   (a release tag, or: latest)
# Run by update.sh when a new release is published; run it by hand to roll back to an earlier
# tag (it stays until the next release).
set -eu
cd "$(dirname "$0")"
tag="${1:?Usage: ./deploy.sh <image tag>}"

# The app connects to Postgres as the least-privilege role lessonfolk_app. Generate its password
# once if .env does not have one yet (existing servers get it on their first deploy of this version).
if ! grep -q '^LESSONFOLK_APP_DB_PASSWORD=.' .env; then
  echo "LESSONFOLK_APP_DB_PASSWORD=$(openssl rand -hex 24)" >> .env
  echo "Generated LESSONFOLK_APP_DB_PASSWORD in .env."
fi

# Audience measurement (Umami) and error monitoring (GlitchTip) each have their own database role
# and their own secret: generate them once.
for name in UMAMI_DB_PASSWORD UMAMI_APP_SECRET GLITCHTIP_DB_PASSWORD GLITCHTIP_SECRET_KEY; do
  if ! grep -q "^$name=." .env; then
    echo "$name=$(openssl rand -hex 24)" >> .env
    echo "Generated $name in .env."
  fi
done

echo "LESSONFOLK_IMAGE_TAG=$tag" > image.env
compose="docker compose --env-file .env --env-file image.env"

$compose pull
# The Umami database and role must exist before Umami starts. Safe to run on every deploy:
# it creates what is missing and sets the role's password to the one in .env. Only the Umami
# role can connect to that database (the app role cannot read the statistics, nor Umami the learners).
$compose up -d --wait db
umami_password=$(grep '^UMAMI_DB_PASSWORD=' .env | tail -n 1 | cut -d= -f2-)
$compose exec -T db psql -U lessonfolk -d postgres -v ON_ERROR_STOP=1 -v "umami_password=$umami_password" <<'SQL'
SELECT 'CREATE ROLE umami LOGIN' WHERE NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'umami') \gexec
ALTER ROLE umami PASSWORD :'umami_password';
SELECT 'CREATE DATABASE umami OWNER umami' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'umami') \gexec
REVOKE CONNECT ON DATABASE umami FROM PUBLIC;
GRANT CONNECT ON DATABASE umami TO umami;
SQL
# Same for the error tracker: its own database and role, which only that role can connect to.
glitchtip_password=$(grep '^GLITCHTIP_DB_PASSWORD=' .env | tail -n 1 | cut -d= -f2-)
$compose exec -T db psql -U lessonfolk -d postgres -v ON_ERROR_STOP=1 -v "glitchtip_password=$glitchtip_password" <<'SQL'
SELECT 'CREATE ROLE glitchtip LOGIN' WHERE NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'glitchtip') \gexec
ALTER ROLE glitchtip PASSWORD :'glitchtip_password';
SELECT 'CREATE DATABASE glitchtip OWNER glitchtip' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'glitchtip') \gexec
REVOKE CONNECT ON DATABASE glitchtip FROM PUBLIC;
GRANT CONNECT ON DATABASE glitchtip TO glitchtip;
SQL

# Pending database migrations run when the app container starts.
$compose up -d --remove-orphans
# Caddy reads its Caddyfile only when it starts, and `up` leaves it running when only that file
# changed: reload it so a changed Caddyfile takes effect (no downtime; it keeps the old
# configuration if the new one is invalid, and then this fails the deploy).
$compose exec -T caddy caddy reload --config /etc/caddy/Caddyfile
# Each release leaves its image behind: keep only the one running now, then the dangling layers.
docker images --format '{{.Repository}}:{{.Tag}}' ghcr.io/cgseb/lessonfolk |
  grep -vx "ghcr.io/cgseb/lessonfolk:$tag" | xargs -r docker rmi > /dev/null 2>&1 || true
docker image prune -f > /dev/null
echo "Deployed $tag."
