#!/bin/bash
set -e

echo "==> Running Clerk database migrations..."

# The schema.sql is mounted as 01-schema.sql and runs automatically before this.
# This script runs the numbered migrations in order.

for f in /docker-entrypoint-initdb.d/migrations/*.sql; do
  echo "    Applying: $(basename "$f")"
  psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -f "$f"
done

echo "==> Migrations complete."
