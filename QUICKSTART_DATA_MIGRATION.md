# Quick Start: Safe Data Migration

## 📋 Available Tools

| Script                | Purpose                     | Risk      | Data Transfer |
| --------------------- | --------------------------- | --------- | ------------- |
| `safe-pull-schema.sh` | Sync schema structure only  | ✅ LOW    | None          |
| `safe-pull-tables.sh` | Sync specific tables + data | 🟡 MEDIUM | Selective     |
| `backup-restore.sh`   | Backup/restore local DB     | ✅ LOW    | N/A           |

---

## 🚀 Quick Recipes

### Recipe 1: Initial Development Setup

```bash
# 1. Create clean local schema from production
./safe-pull-schema.sh

# 2. Create test data file (seed.sql)
echo "INSERT INTO users VALUES(...)" > supabase/seed.sql

# 3. Reset local with test data
supabase db reset

# 4. Start developing
npm run dev
```

### Recipe 2: Pull Latest Production Data

```bash
# 1. Backup local first
./backup-restore.sh backup

# 2. Pull specific tables you need
./safe-pull-tables.sh transactions bank_accounts

# 3. Verify data looks correct
psql -h 127.0.0.1 -p 54322 -U postgres -d postgres \
  -c "SELECT COUNT(*) FROM transactions;"

# 4. Start developing
npm run dev
```

### Recipe 3: Regular Daily Sync

```bash
#!/bin/bash
# daily-sync.sh - Run each morning

echo "Starting daily sync..."

# Backup
./backup-restore.sh backup

# Pull latest schema
./safe-pull-schema.sh

# Pull recent production data (optional - uncomment if needed)
# ./safe-pull-tables.sh transactions

echo "✅ Daily sync complete"
```

### Recipe 4: Emergency Restore

```bash
# If something goes wrong:

# 1. List backups
./backup-restore.sh list

# 2. Pick one and restore
./backup-restore.sh restore /tmp/supabase_backups/backup_20260503_120000.sql

# Done!
```

---

## ⚠️ Common Scenarios & Solutions

### Scenario: "I need production data for testing"

```bash
# ✅ SAFE approach:
./safe-pull-tables.sh transactions

# Then work locally, changes won't affect production
```

### Scenario: "Production schema changed, sync my local"

```bash
# ✅ SAFE approach:
./safe-pull-schema.sh

# Your local data is preserved
```

### Scenario: "Made a mistake, need to undo"

```bash
# ✅ SAFE approach:
# 1. Check what backups exist
./backup-restore.sh list

# 2. Restore from one of them
./backup-restore.sh restore /tmp/supabase_backups/backup_xxx.sql
```

### Scenario: "Need to update production with new migrations I created"

```bash
# ✅ SAFE approach - Deploy via CLI:
supabase db push --dry-run  # See what will change

# Review thoroughly, then:
supabase db push            # Deploy
```

---

## 🔐 Password Management

All scripts will **PROMPT** for production password:

- ✅ Never stored in script
- ✅ Never echo'd to terminal
- ✅ Never saved in history

---

## 📊 Database Connection Strings

### Local Development

```
psql -h 127.0.0.1 -p 54322 -U postgres -d postgres
```

### Production (Use script prompts instead)

```
psql -h db.tybmdxojhfcnkcdpoedh.supabase.co -U postgres -d postgres
# ⚠️ Better: Let safe-pull-*.sh handle this
```

---

## ✅ Verification Checklist

After any data pull:

```bash
# 1. Check row counts
psql -h 127.0.0.1 -p 54322 -U postgres -d postgres \
  -c "SELECT schemaname, COUNT(*) FROM pg_tables \
      WHERE schemaname NOT IN ('pg_catalog', 'information_schema') \
      GROUP BY schemaname;"

# 2. Check specific table
psql -h 127.0.0.1 -p 54322 -U postgres -d postgres \
  -c "SELECT COUNT(*) FROM your_table;"

# 3. Check constraints
psql -h 127.0.0.1 -p 54322 -U postgres -d postgres \
  -c "\d+ your_table"

# 4. Test a query
psql -h 127.0.0.1 -p 54322 -U postgres -d postgres \
  -c "SELECT * FROM your_table LIMIT 5;"
```

---

## 🚨 Never Do This

❌ `pg_dump production | psql local` - Dangerous!  
❌ Modify production from local connection  
❌ Pull without backup first  
❌ Delete migration files  
❌ Push raw data dumps to production  
❌ Share production credentials

---

## 💡 Pro Tips

1. **Keep backups for 7+ days** - Good recovery window
2. **Name backups clearly** - Include date/time
3. **Test locally 3+ times** before pushing to production
4. **Use `--dry-run`** when deploying to understand changes
5. **Document why** - Add comments to migration files
6. **Automate daily syncs** - Less manual work
7. **Monitor backups** - `./backup-restore.sh clean` weekly

---

## 📞 Troubleshooting

### Error: "Cannot connect to production"

- Check internete connection
- Verify .env.local has correct PROD_URL
- Try manual connection first

### Error: "Foreign key constraint violated"

- You're pulling child tables before parents
- Use `supabase db reset` to start clean

### Error: "Column doesn't exist"

- Schemas out of sync
- Run `./safe-pull-schema.sh` first

### Script won't run

- Check permissions: `chmod +x safe-pull-*.sh`
- Check you're in project directory: `pwd`

---

## 📚 Full Documentation

See `SAFE_DATA_MIGRATION.md` for:

- Detailed strategies
- Strategy explanations
- Advanced techniques
- Decision trees
