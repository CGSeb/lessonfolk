#!/bin/sh
# Restore test: load a backup (default: the newest) into a scratch database, check that the
# data is there, then drop it. The live database is never touched. The newest Umami backup
# (audience statistics), if there is one, is tested the same way when no file is given.
#   ./restore-test.sh [backups/lessonfolk-<date>.sql.gz]
set -eu
cd "$(dirname "$0")"
file="${1:-$(ls -1t backups/lessonfolk-*.sql.gz 2>/dev/null | head -n 1)}"
[ -n "$file" ] && [ -f "$file" ] || { echo "No backup found." >&2; exit 1; }
scratch="${RESTORE_SCRATCH_DB:-lessonfolk_restore_test}"
psql="${COMPOSE:-docker compose} exec -T db psql -U lessonfolk -v ON_ERROR_STOP=1"

$psql -d postgres -c "DROP DATABASE IF EXISTS $scratch" -c "CREATE DATABASE $scratch"
trap '$psql -d postgres -c "DROP DATABASE IF EXISTS $scratch" > /dev/null' EXIT

echo "Restoring $file into $scratch..."
gunzip -c "$file" | $psql -d "$scratch" -q > /dev/null

tables=$($psql -d "$scratch" -tAc "SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public'")
users=$($psql -d "$scratch" -tAc 'SELECT count(*) FROM "user"')
echo "Restored $tables tables, $users users."
[ "$tables" -gt 0 ] || { echo "The backup restored no tables." >&2; exit 1; }

if [ $# -eq 0 ]; then
  umami=$(ls -1t backups/umami-*.sql.gz 2>/dev/null | head -n 1 || true)
  if [ -n "$umami" ]; then
    $psql -d postgres -c "DROP DATABASE IF EXISTS $scratch" -c "CREATE DATABASE $scratch"
    echo "Restoring $umami into $scratch..."
    gunzip -c "$umami" | $psql -d "$scratch" -q > /dev/null
    events=$($psql -d "$scratch" -tAc 'SELECT count(*) FROM website_event')
    echo "Restored the audience statistics: $events page views."
  fi
fi
echo "Restore test passed."
