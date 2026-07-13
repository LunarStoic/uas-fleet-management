#!/bin/sh
set -e

# Check if PostgreSQL is ready
pg_isready -U "$POSTGRES_USER" -d postgres || exit 1

# Check if all required databases exist
RESULT=$(psql -U "$POSTGRES_USER" -d postgres -tAc "SELECT count(*) FROM pg_database WHERE datname IN ('auth_db','fleet_db','order_db','report_db')")

if [ "$RESULT" = "4" ]; then
  exit 0
else
  exit 1
fi
