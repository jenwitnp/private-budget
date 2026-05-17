#!/bin/bash

# safe-pull-tables.sh
# Safely pull SPECIFIC TABLES with data from production to local
# Usage: ./safe-pull-tables.sh transactions bank_accounts

set -e

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
ENV_FILE="$SCRIPT_DIR/.env.local"

if [ $# -eq 0 ]; then
  echo "Usage: $0 table_name [table_name2] [table_name3]..."
  echo ""
  echo "Example: $0 transactions bank_accounts"
  echo ""
  echo "This script safely pulls specific tables (schema + data) from production."
  echo "All data in specified tables on local will be REPLACED."
  exit 1
fi

# Load environment
if [ ! -f "$ENV_FILE" ]; then
  echo "❌ Error: .env.local not found"
  exit 1
fi

PROD_URL=$(grep "NEXT_PUBLIC_SUPABASE_PROD_URL" "$ENV_FILE" | cut -d'=' -f2)
PROD_HOST=$(echo "$PROD_URL" | sed 's|https://||' | cut -d'.' -f1)".supabase.co"

LOCAL_HOST="127.0.0.1"
LOCAL_PORT="54322"
LOCAL_USER="postgres"
LOCAL_DB="postgres"

echo "🔐 Safe Table Pull - Production to Local"
echo "========================================"
echo ""
echo "Tables to pull: $@"
echo ""
echo "⚠️  This will DELETE AND REPLACE local data in these tables"
echo "    Schema will be updated to match production"
echo ""

read -p "Continue? (yes/no): " -r
echo ""
if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
  echo "❌ Cancelled"
  exit 1
fi

read -s -p "Enter production database password: " PROD_PASS
echo ""

export PGPASSWORD=$PROD_PASS

# Verify production connection
echo "🔍 Verifying production connection..."
if ! pg_isready -h "$PROD_HOST" -U postgres -q 2>/dev/null; then
  echo "❌ Cannot connect to production database"
  unset PGPASSWORD
  exit 1
fi

# Backup local database first
echo "💾 Creating local backup..."
BACKUP_DIR="/tmp/supabase_backups"
mkdir -p "$BACKUP_DIR"
LOCAL_BACKUP="$BACKUP_DIR/local_backup_$(date +%Y%m%d_%H%M%S).sql"

PGPASSWORD=postgres pg_dump \
  -h "$LOCAL_HOST" \
  -p "$LOCAL_PORT" \
  -U "$LOCAL_USER" \
  -d "$LOCAL_DB" \
  > "$LOCAL_BACKUP" 2>/dev/null

echo "✅ Local backup saved: $LOCAL_BACKUP"

# Build pg_dump table arguments
TABLE_ARGS=""
for table in "$@"; do
  TABLE_ARGS="$TABLE_ARGS --table=public.$table"
done

# Pull tables from production
echo "📥 Pulling tables from production..."
PROD_BACKUP="$BACKUP_DIR/prod_tables_$(date +%Y%m%d_%H%M%S).sql"

pg_dump \
  --host="$PROD_HOST" \
  --username=postgres \
  --no-owner \
  --no-privileges \
  $TABLE_ARGS \
  postgres > "$PROD_BACKUP"

if [ ! -s "$PROD_BACKUP" ]; then
  echo "❌ Error: No data retrieved. Check table names and try again."
  unset PGPASSWORD
  exit 1
fi

echo "✅ Tables exported to: $PROD_BACKUP"

# Clear local tables and apply
echo "🧹 Clearing local tables..."
for table in "$@"; do
  PGPASSWORD=postgres psql \
    -h "$LOCAL_HOST" \
    -p "$LOCAL_PORT" \
    -U "$LOCAL_USER" \
    -d "$LOCAL_DB" \
    -c "TRUNCATE TABLE public.$table CASCADE;" 2>/dev/null || true
done

echo "🔄 Applying tables to local database..."
PGPASSWORD=postgres psql \
  -h "$LOCAL_HOST" \
  -p "$LOCAL_PORT" \
  -U "$LOCAL_USER" \
  -d "$LOCAL_DB" \
  -f "$PROD_BACKUP" > /dev/null 2>&1

if [ $? -eq 0 ]; then
  echo "✅ Tables successfully updated!"
  echo ""
  echo "📊 Data Summary:"
  for table in "$@"; do
    COUNT=$(PGPASSWORD=postgres psql \
      -h "$LOCAL_HOST" \
      -p "$LOCAL_PORT" \
      -U "$LOCAL_USER" \
      -d "$LOCAL_DB" \
      -t \
      -c "SELECT COUNT(*) FROM public.$table;" 2>/dev/null)
    echo "  $table: $COUNT rows"
  done
else
  echo "❌ Error applying tables. Restoring backup..."
  echo "Restore: psql -h 127.0.0.1 -p 54322 -U postgres -d postgres -f $LOCAL_BACKUP"
  unset PGPASSWORD
  exit 1
fi

echo ""
echo "📍 Backups saved in: $BACKUP_DIR"
echo "🎉 Done! Tables synced with production."

unset PGPASSWORD
