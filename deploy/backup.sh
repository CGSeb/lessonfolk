#!/bin/sh
# Nightly database backup: a compressed pg_dump in ./backups, kept 35 days (the retention
# stated in docs/privacy.md), then copied off the server when BACKUP_REMOTE is set.
# Install it in cron, see docs/hosting.md.
set -eu
cd "$(dirname "$0")"
if [ -f .env ]; then
  set -a
  . ./.env
  set +a
fi

mkdir -p backups
file="backups/lessonfolk-$(date -u +%Y%m%dT%H%M%SZ).sql.gz"
docker compose exec -T db pg_dump -U lessonfolk --no-owner lessonfolk | gzip > "$file.partial"
mv "$file.partial" "$file"
echo "Backup written: $file ($(du -h "$file" | cut -f1))"

find backups -name 'lessonfolk-*.sql.gz' -mtime +35 -delete

if [ -n "${BACKUP_REMOTE:-}" ]; then
  rclone copy "$file" "$BACKUP_REMOTE"
  rclone delete --min-age 35d "$BACKUP_REMOTE"
  echo "Copied to $BACKUP_REMOTE"
fi
