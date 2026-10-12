#!/bin/sh
# Nightly database backup: a compressed pg_dump of each database (the app's and the audience
# statistics') in ./backups, kept 35 days (the retention stated in docs/privacy.md), then copied
# off the server when BACKUP_REMOTE is set.
# Run it from cron, e.g.: 15 3 * * * /opt/lessonfolk/backup.sh >> /opt/lessonfolk/backups/backup.log 2>&1
set -eu
# Backups hold personal data: readable by the owner only.
umask 077
cd "$(dirname "$0")"
if [ -f .env ]; then
  set -a
  . ./.env
  set +a
fi

compose="${COMPOSE:-docker compose}"
mkdir -p backups
stamp="$(date -u +%Y%m%dT%H%M%SZ)"

# Dump one database to backups/<name>-<stamp>.sql.gz. Dump to a file first: in a pipe, a failing
# pg_dump would still leave a valid (empty) .gz that replaces nothing but looks like a good backup.
dump() {
  name="$1"
  file="backups/$name-$stamp.sql.gz"
  if ! $compose exec -T db pg_dump -U lessonfolk --no-owner "$name" > "$file.sql.partial"; then
    rm -f "$file.sql.partial"
    echo "pg_dump of $name failed: no backup written." >&2
    exit 1
  fi
  gzip -c "$file.sql.partial" > "$file"
  rm -f "$file.sql.partial"
  gzip -t "$file"
  echo "Backup written: $file ($(du -h "$file" | cut -f1))"
  files="$files $file"
}

files=""
dump lessonfolk
# The audience statistics (Umami) are in their own database, which exists once deploy.sh has run.
if $compose exec -T db psql -U lessonfolk -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname = 'umami'" | grep -q 1; then
  dump umami
fi

find backups \( -name 'lessonfolk-*.sql.gz' -o -name 'umami-*.sql.gz' \) -mtime +35 -delete

if [ -n "${BACKUP_REMOTE:-}" ]; then
  for file in $files; do rclone copy "$file" "$BACKUP_REMOTE"; done
  rclone delete --min-age 35d "$BACKUP_REMOTE"
  echo "Copied to $BACKUP_REMOTE"
fi
