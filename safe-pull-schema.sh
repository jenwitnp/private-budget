#!/bin/bash

# safe-pull-schema.sh
# Safely pull SCHEMA ONLY from production to local (NO DATA)
# Usage: ./safe-pull-schema.sh

set -e

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
ENV_FILE="$SCRIPT_DIR/.env.local"

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

echo "🔐 Safe Schema Pull - Production to Local"
echo "=========================================="
echo ""
echo "⚠️  This will ONLY copy schema structure (no data)"
echo "Local data will be preserved"
echo ""

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
  --schema-only \
  > "$LOCAL_BACKUP" 2>/dev/null

echo "✅ Local backup saved: $LOCAL_BACKUP"

# Pull schema from production
echo "📥 Pulling schema from production..."
PROD_SCHEMA="$BACKUP_DIR/prod_schema_$(date +%Y%m%d_%H%M%S).sql"

pg_dump \
  --host="$PROD_HOST" \
  --username=postgres \
  --schema-only \
  --no-owner \
  --no-privileges \
  --exclude-schema=pg_* \
  --exclude-schema=information_schema \
  postgres > "$PROD_SCHEMA"

echo "✅ Production schema exported to: $PROD_SCHEMA"

# Apply to local
echo "🔄 Applying schema to local database..."
PGPASSWORD=postgres psql \
  -h "$LOCAL_HOST" \
  -p "$LOCAL_PORT" \
  -U "$LOCAL_USER" \
  -d "$LOCAL_DB" \
  -f "$PROD_SCHEMA" > /dev/null 2>&1

if [ $? -eq 0 ]; then
  echo "✅ Schema successfully updated!"
  echo ""
  echo "📊 Schema Summary:"
  PGPASSWORD=postgres psql \
    -h "$LOCAL_HOST" \
    -p "$LOCAL_PORT" \
    -U "$LOCAL_USER" \
    -d "$LOCAL_DB" \
    -c "SELECT schemaname, COUNT(*) as tables FROM pg_tables WHERE schemaname NOT IN ('pg_catalog', 'information_schema') GROUP BY schemaname;"
else
  echo "❌ Error applying schema. Check for compatibility issues."
  echo "Restore backup: psql -h 127.0.0.1 -p 54322 -U postgres -d postgres -f $LOCAL_BACKUP"
  unset PGPASSWORD
  exit 1
fi

echo ""
echo "📍 Backups saved in: $BACKUP_DIR"
echo "🎉 Done! Your local schema is now synced with production."

unset PGPASSWORD
