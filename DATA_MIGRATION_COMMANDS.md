# Data Migration Commands Reference

## 🎯 Use Case Decision Matrix

### I Want To...

#### 1️⃣ Set up my local dev environment for the first time

```bash
# Step 1: Get schema from production (no data)
./safe-pull-schema.sh

# Step 2: Create test data (optional)
echo "INSERT INTO users VALUES ('John', 'john@example.com');" > supabase/seed.sql

# Step 3: Reset with seed data
supabase db reset

# ✅ Done! You now have schema + test data locally
```

**Result:** ✅ Production schema, ✅ No production data, ✅ Your test data

---

#### 2️⃣ Get real-world data for debugging

```bash
# Backup local first (safety)
./backup-restore.sh backup

# Pull specific tables with data
./safe-pull-tables.sh transactions bank_accounts users

# Verify it worked
psql -h 127.0.0.1 -p 54322 -U postgres -d postgres \
  -c "SELECT COUNT(*) FROM transactions;"

# ✅ Now debug with real data locally (production untouched)
```

**Result:** ✅ Real data locally, ✅ Safe restoration available, ✅ Production untouched

---

#### 3️⃣ Sync local schema with production changes

```bash
# Just pull schema
./safe-pull-schema.sh

# Your local data is preserved, schema is updated

# Run migrations
supabase db reset --seed-sql supabase/seed.sql

# ✅ Schema synced, your dev data preserved
```

**Result:** ✅ Matching schema, ✅ Dev data intact, ✅ Ready to code

---

#### 4️⃣ Something broke, restore my local

```bash
# See available backups
./backup-restore.sh list

# Pick one and restore (output will show path)
./backup-restore.sh restore /tmp/supabase_backups/backup_20260503_120000.sql

# ✅ Back to the previous state
```

**Result:** ✅ Back to working state, ✅ Minimal downtime

---

#### 5️⃣ Deploy my new migrations to production

```bash
# First, test locally 3+ times
npm run dev
# [test thoroughly]

# See what will change
supabase db push --dry-run

# Review the output carefully, then deploy
supabase db push

# ✅ Production updated safely
```

**Result:** ✅ Tested locally, ✅ Dry run verified, ✅ Production deployed

---

#### 6️⃣ Regularly sync production schema to local (auto)

```bash
#!/bin/bash
# weekly-schema-sync.sh
# Run via: chmod +x weekly-schema-sync.sh && ./weekly-schema-sync.sh

cd /Users/jenwitnoppiboon/Documents/budget-project

echo "🔄 Weekly schema sync..."
echo "Start: $(date)" >> /tmp/schema-sync.log

./safe-pull-schema.sh >> /tmp/schema-sync.log 2>&1

if [ $? -eq 0 ]; then
  echo "✅ Success: $(date)" >> /tmp/schema-sync.log
else
  echo "❌ Failed: $(date)" >> /tmp/schema-sync.log
fi

# View logs: cat /tmp/schema-sync.log
```

**Result:** ✅ Automatic weekly syncs, ✅ Audit trail, ✅ Always in sync

---

## 🛠️ Advanced Recipes

### Recipe: Pull Only Recent Data (Last 7 Days)

```bash
# Manual SQL for advanced users
psql -h db.tybmdxojhfcnkcdpoedh.supabase.co -U postgres -d postgres \
  -c "SELECT * FROM transactions WHERE created_at > NOW() - INTERVAL '7 days'" \
  > recent_transactions.sql

# Then import
psql -h 127.0.0.1 -p 54322 -U postgres -d postgres < recent_transactions.sql
```

---

### Recipe: Selective Sync with Filtering

```bash
# If you only need completed transactions

# Step 1: Export
pg_dump \
  --host=db.tybmdxojhfcnkcdpoedh.supabase.co \
  --username=postgres \
  --password \
  --data-only \
  --table=public.transactions \
  postgres | \
  grep "WHERE status = 'completed'" > completed_transactions.sql

# Step 2: Clear local
psql -h 127.0.0.1 -p 54322 -U postgres -d postgres \
  -c "TRUNCATE TABLE transactions;"

# Step 3: Import
psql -h 127.0.0.1 -p 54322 -U postgres -d postgres \
  < completed_transactions.sql
```

---

### Recipe: Backup Before Any Major Operation

```bash
#!/bin/bash
# Create backup + run operation + validate

set -e

# 1. Backup
echo "Creating backup..."
BACKUP=$(mktemp)
pg_dump -h 127.0.0.1 -p 54322 -U postgres postgres > "$BACKUP"

# 2. Run operation (example)
./safe-pull-tables.sh bank_accounts

# 3. Validate
COUNT=$(psql -h 127.0.0.1 -p 54322 -U postgres -d postgres \
  -t -c "SELECT COUNT(*) FROM bank_accounts;")

if [ "$COUNT" -gt 0 ]; then
  echo "✅ Success: $COUNT rows imported"
  rm "$BACKUP"  # Delete temp backup
else
  echo "❌ Failed: No rows. Restoring..."
  psql -h 127.0.0.1 -p 54322 -U postgres -d postgres < "$BACKUP"
fi
```

---

### Recipe: Automated Daily Backup

```bash
#!/bin/bash
# Save as: automated-backup.sh

BACKUP_DIR="/Users/jenwitnoppiboon/Documents/budget-project/.backups"
mkdir -p "$BACKUP_DIR"

# Create daily backup
BACKUP_FILE="$BACKUP_DIR/backup_$(date +%Y%m%d).sql"

PGPASSWORD=postgres pg_dump \
  -h 127.0.0.1 \
  -p 54322 \
  -U postgres \
  -d postgres \
  > "$BACKUP_FILE"

# Keep only last 7 days
find "$BACKUP_DIR" -name "backup_*.sql" -mtime +7 -delete

echo "✅ Backup created: $BACKUP_FILE"

# Add to crontab to run daily:
# 0 2 * * * /Users/jenwitnoppiboon/Documents/budget-project/automated-backup.sh
```

---

## 📋 Command Cheat Sheet

```bash
# === BACKUP & RESTORE ===
./backup-restore.sh backup              # Create backup
./backup-restore.sh list                # List backups
./backup-restore.sh restore <file>      # Restore backup
./backup-restore.sh clean               # Delete old backups

# === SCHEMA SYNC ===
./safe-pull-schema.sh                   # Pull schema only (no data)

# === DATA SYNC ===
./safe-pull-tables.sh table1 table2    # Pull specific tables
./safe-pull-tables.sh transactions     # Pull single table

# === DATABASE QUERIES ===
psql -h 127.0.0.1 -p 54322 -U postgres -d postgres -c "SELECT COUNT(*) FROM table_name;"
psql -h 127.0.0.1 -p 54322 -U postgres -d postgres -f migration.sql

# === SUPABASE CLI ===
supabase status                         # Check running services
supabase start                          # Start local
supabase stop                           # Stop local
supabase db push --dry-run              # Preview changes
supabase db push                        # Deploy migrations
supabase db reset                       # Reset local DB
supabase db pull                        # Pull latest schema

# === GIT MIGRATIONS ===
git add supabase/migrations/            # Stage migrations
git commit -m "Add feature: xyz"        # Commit
git push origin main                    # Push
```

---

## ❌ DO NOT Do These

```bash
# ❌ DON'T: Direct production connection without script
psql -h db.tybmdxojhfcnkcdpoedh.supabase.co -U postgres

# ❌ DON'T: Pipe dump directly without verification
pg_dump production | psql local

# ❌ DON'T: Forget to backup before operations
./safe-pull-tables.sh table  # WRONG

# ✅ DO: This instead
./backup-restore.sh backup
./safe-pull-tables.sh table

# ❌ DON'T: Store credentials in commits
git add .env.local            # WRONG

# ✅ DO: Use .env.local (not in git)
echo ".env.local" >> .gitignore
git add .gitignore

# ❌ DON'T: Mix production and local credentials
# NEXT_PUBLIC_SUPABASE_URL=prod_when_local=true  # WRONG

# ✅ DO: Use env toggle
NEXT_PUBLIC_SUPABASE_DEV_MODE=true  # Switches automatically
```

---

## 🔐 Security Checklist

- [ ] Production password never stored in scripts
- [ ] Credentials not committed to git
- [ ] `.env.local` has `*.env.local` in `.gitignore`
- [ ] Backup credentials separate from access
- [ ] Daily backups retained for 7+ days
- [ ] Schema changes via migrations (not direct SQL)
- [ ] Never execute unknown SQL files
- [ ] Only pull schema initially, add data progressively
- [ ] Document reason for each data pull
- [ ] Review `supabase db push --dry-run` before deploying

---

## 📞 When Things Go Wrong

**"I can't connect to production"**

```bash
# Check connectivity
nc -zv db.tybmdxojhfcnkcdpoedh.supabase.co 5432

# Test with psql
psql -h db.tybmdxojhfcnkcdpoedh.supabase.co -U postgres -d postgres
# (will prompt for password)
```

**"Schema has errors"**

```bash
# Restore backup
./backup-restore.sh restore <backup_file>

# Then try again with schema-only
./safe-pull-schema.sh
```

**"Data is corrupted"**

```bash
# See when it broke
ls -lt /tmp/supabase_backups/*.sql

# Restore from before break
./backup-restore.sh restore <pre-break-backup>
```

---

## 📚 Learn More

- Full guide: `SAFE_DATA_MIGRATION.md`
- Quick start: `QUICKSTART_DATA_MIGRATION.md`
- This file: `DATA_MIGRATION_COMMANDS.md`
