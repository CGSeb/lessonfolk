#!/bin/sh
# Delete audience statistics (Umami) older than 25 months, the retention stated on the privacy
# page and in docs/privacy.md. Umami keeps everything until told otherwise.
# Run it from cron, e.g.: 30 3 * * * /opt/lessonfolk/purge-analytics.sh >> /opt/lessonfolk/backups/purge.log 2>&1
set -eu
cd "$(dirname "$0")"

compose="${COMPOSE:-docker compose}"
months="${ANALYTICS_RETENTION_MONTHS:-25}"
case "$months" in '' | *[!0-9]*) echo "ANALYTICS_RETENTION_MONTHS must be a number." >&2; exit 1 ;; esac

# Nothing to do before deploy.sh has created the Umami database.
if ! $compose exec -T db psql -U lessonfolk -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname = 'umami'" | grep -q 1; then
  echo "No Umami database: nothing to purge."
  exit 0
fi

# Children first, then the sessions that have no event left. One transaction: all or nothing.
$compose exec -T db psql -U lessonfolk -d umami -v ON_ERROR_STOP=1 -v "months=$months" <<'SQL'
BEGIN;
DELETE FROM event_data WHERE created_at < now() - make_interval(months => :months);
DELETE FROM website_event WHERE created_at < now() - make_interval(months => :months);
DELETE FROM session_data WHERE created_at < now() - make_interval(months => :months);
DELETE FROM session s
 WHERE s.created_at < now() - make_interval(months => :months)
   AND NOT EXISTS (SELECT 1 FROM website_event e WHERE e.session_id = s.session_id);
COMMIT;
SQL
echo "Purged audience statistics older than $months months."
