# Safe Data Migration: Production ↔ Local Supabase

## ⚠️ Critical Safety Principles

1. **Never pull entire production schema directly** - Causes compatibility issues (PostgreSQL versions, extensions)
2. **Always backup first** - Both production and local before operations
3. **Test in local first** - Run migrations locally before any production changes
4. **Use read-only credentials initially** - Verify data integrity before writing
5. **Keep backups for 7+ days** - Recovery window if issues arise
6. **Separate schema from data** - Migrate structure independently from data

---

## Strategy 1: Schema-Only Export (Recommended First Step)

**Best for:** Initial setup, understanding structure without production data risks

### Pull Schema Only

```bash
# Export only schema without data
pg_dump \
  --host=db.tybmdxojhfcnkcdpoedh.supabase.co \
  --username=postgres \
  --password \
  --schema-only \
  --no-owner \
  --no-privileges \
  postgres > schema_prod.sql

# Then apply to local
psql -h 127.0.0.1 -p 54322 -U postgres -d postgres -f schema_prod.sql
```

### What This Does:

- ✅ Schema structure only (tables, views, functions)
- ✅ No data transferred
- ✅ No version compatibility issues
- ✅ Quick to execute
- ❌ You need to populate with test data manually

---

## Strategy 2: Selective Table Sync (Recommended for Most Cases)

**Best for:** Pulling specific tables with real data without everything

### Pull Specific Tables Only

```bash
# Example: Pull only user and transaction tables
pg_dump \
  --host=db.tybmdxojhfcnkcdpoedh.supabase.co \
  --username=postgres \
  --password \
  --data-only \
  --table=auth.users \
  --table=public.transactions \
  --table=public.bank_accounts \
  postgres > selective_data.sql

# Apply to local
psql -h 127.0.0.1 -p 54322 -U postgres -d postgres -f selective_data.sql
```

### Advantages:

- ✅ Only get needed tables
- ✅ Can exclude sensitive data
- ✅ Faster operation
- ✅ Lower risk of conflicts

---

## Strategy 3: Safe Incremental Sync

**Best for:** Regular syncing of new/changed data without disruption

### Sync Only Recent Changes

```bash
# Pull transactions from last 7 days
pg_dump \
  --host=db.tybmdxojhfcnkcdpoedh.supabase.co \
  --username=postgres \
  --password \
  --data-only \
  postgres \
  | grep -E "COPY public\.transactions|^[0-9]" | \
  sed -E "WHERE created_at > NOW() - INTERVAL '7 days'" \
  > recent_data.sql
```

---

## Strategy 4: Environment-Based Push/Pull Workflow

**Best for:** Regular development ↔ production sync

### Pull from Production to Local (Safe)

```bash
#!/bin/bash
# pull-prod-to-local.sh

set -e

PROD_HOST="db.tybmdxojhfcnkcdpoedh.supabase.co"
PROD_USER="postgres"
LOCAL_HOST="127.0.0.1"
LOCAL_PORT="54322"
LOCAL_USER="postgres"
LOCAL_DB="postgres"

echo "🔒 Connecting to production (READ ONLY)..."
read -s -p "Production password: " PROD_PASS
export PGPASSWORD=$PROD_PASS

BACKUP_FILE="/tmp/prod_backup_$(date +%s).sql"

echo "💾 Creating local backup first..."
pg_dump -h $LOCAL_HOST -p $LOCAL_PORT -U $LOCAL_USER $LOCAL_DB > \
  "/tmp/local_backup_$(date +%s).sql"

echo "📥 Pulling schema from production..."
pg_dump \
  --host=$PROD_HOST \
  --username=$PROD_USER \
  --schema-only \
  --no-owner \
  --no-privileges \
  postgres > "$BACKUP_FILE"

echo "🔄 Applying schema to local..."
psql -h $LOCAL_HOST -p $LOCAL_PORT -U $LOCAL_USER -d $LOCAL_DB < "$BACKUP_FILE"

echo "✅ Success! Schema updated from production"
echo "📍 Backup saved: $BACKUP_FILE"

unset PGPASSWORD
```

### Push from Local to Production (HIGH RISK - Requires Approval)

```bash
#!/bin/bash
# push-local-to-prod.sh

set -e

read -p "⚠️  CONFIRM: You are about to push changes to PRODUCTION. Type 'CONFIRM': " confirm
if [ "$confirm" != "CONFIRM" ]; then
  echo "❌ Cancelled"
  exit 1
fi

PROD_HOST="db.tybmdxojhfcnkcdpoedh.supabase.co"
PROD_USER="postgres"
LOCAL_HOST="127.0.0.1"
LOCAL_PORT="54322"
LOCAL_USER="postgres"

read -s -p "Production password: " PROD_PASS
export PGPASSWORD=$PROD_PASS

echo "💾 Creating production backup..."
pg_dump -h $PROD_HOST -U $PROD_USER postgres > \
  "/tmp/prod_backup_before_push_$(date +%s).sql"

echo "📤 Pushing migrations to production..."
# Only push migrations, not raw data
psql -h $PROD_HOST -U $PROD_USER -d postgres < supabase/migrations/*.sql

echo "✅ Push complete!"
echo "⚠️  Verify changes at: https://supabase.com/dashboard"

unset PGPASSWORD
```

---

## Strategy 5: Safe Bulk Import with Verification

```bash
#!/bin/bash
# import-with-verification.sh

LOCAL_DB="postgres"
LOCAL_HOST="127.0.0.1"
LOCAL_PORT="54322"
LOCAL_USER="postgres"

echo "📊 Checking table counts before import..."
BEFORE=$(psql -h $LOCAL_HOST -p $LOCAL_PORT -U $LOCAL_USER -d $LOCAL_DB \
  -t -c "SELECT COUNT(*) FROM information_schema.table_constraints;")

echo "Existing constraints: $BEFORE"

# Import data
psql -h $LOCAL_HOST -p $LOCAL_PORT -U $LOCAL_USER -d $LOCAL_DB < data_to_import.sql

echo "📊 Checking table counts after import..."
AFTER=$(psql -h $LOCAL_HOST -p $LOCAL_PORT -U $LOCAL_USER -d $LOCAL_DB \
  -t -c "SELECT COUNT(*) FROM information_schema.table_constraints;")

echo "New constraints: $AFTER"

# Verify integrity
echo "🔍 Verifying foreign key constraints..."
psql -h $LOCAL_HOST -p $LOCAL_PORT -U $LOCAL_USER -d $LOCAL_DB \
  -c "SELECT constraint_name, table_name FROM information_schema.table_constraints \
      WHERE constraint_type='FOREIGN KEY' ORDER BY table_name;"

echo "✅ Verification complete"
```

---

## Strategy 6: Using Supabase CLI Built-in Commands

```bash
# Check current status
supabase db status

# Create a backup of local
supabase db pull --force

# Use db diff to see differences
supabase db diff --schema public

# Reset local to clean state (CAUTION!)
supabase db reset
```

---

## Safe Workflow for Development

### Step 1: Initial Setup

```bash
# Start with clean local schema (no migrations)
supabase db reset

# Manually create only the tables you need for development
# OR pull schema-only from production
```

### Step 2: Create Test Data

```bash
# Create seed.sql with realistic test data
# Keep it small (100-1000 rows max)
```

### Step 3: Daily Development

```bash
# Work locally only
# Never push to production unless necessary

# At end of day, commit migration files
git add supabase/migrations/
git commit -m "Add feature: [description]"
```

### Step 4: Production Deployment

```bash
# Only apply tested migrations to production
# NEVER push raw data dump to production

# Deploy only migration files:
supabase db push --dry-run  # See what will change
supabase db push            # Actually apply
```

---

## ✅ Best Practices Checklist

- [ ] Always backup before any data operation
- [ ] Test migrations locally 3+ times
- [ ] Use `--dry-run` flag when available
- [ ] Never expose credentials in scripts (use `.env` or password prompt)
- [ ] Keep migration files in git (never raw SQL dumps)
- [ ] Document why each migration was needed
- [ ] Have rollback plan before applying to production
- [ ] Verify data integrity after each import
- [ ] Keep production and local schemas in sync manually with migrations
- [ ] Use different credentials for prod/local

---

## ❌ What NOT to Do

- ❌ `pg_dump` entire production database and import to local
- ❌ Modify production data directly via local connection
- ❌ Share credentials in Slack/email
- ❌ Skip backups "just this once"
- ❌ Push data-only dumps to production
- ❌ Import production data without verification
- ❌ Use dev credentials for production commands
- ❌ Delete migrations, always create new ones

---

## Troubleshooting Common Issues

### Issue: "Version compatibility" Error

**Solution:** Use `--schema-only` first, then understand version differences

### Issue: "Foreign key constraint violated"

**Solution:** Import in dependency order (parent tables before children)

### Issue: "Column doesn't exist"

**Solution:** Schemas are out of sync - pull latest schema first

### Issue: Stuck/Slow Import

**Solution:**

```bash
# Disable constraints during import
ALTER TABLE table_name DISABLE TRIGGER ALL;
# [import data]
ALTER TABLE table_name ENABLE TRIGGER ALL;
```

---

## Quick Decision Tree

```
Need to update schema?
├─ YES, test locally
│  └─ Create migration file
│     └─ Run `supabase db push`
│
└─ NO, need data?
   ├─ YES, all of it?
   │  └─ Use Strategy 3 (Incremental)
   │
   └─ YES, specific tables?
      └─ Use Strategy 2 (Selective)
```
