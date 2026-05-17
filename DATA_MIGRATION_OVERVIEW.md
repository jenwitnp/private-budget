# 🚀 Data Migration Guide - Complete Overview

Welcome! You now have a **complete, safe data migration system** for working with production ↔ local Supabase.

## 📂 Your Migration Toolkit

### 📚 Documentation Files

| File                             | Purpose                                       |
| -------------------------------- | --------------------------------------------- |
| **SAFE_DATA_MIGRATION.md**       | 📖 Full comprehensive guide with 6 strategies |
| **QUICKSTART_DATA_MIGRATION.md** | ⚡ Quick recipes for common scenarios         |
| **DATA_MIGRATION_COMMANDS.md**   | 🔧 Detailed commands & cheat sheet            |
| **This file**                    | 📍 Overview & quick reference                 |

### 🛠️ Executable Scripts

| Script                  | Purpose                               | Risk Level |
| ----------------------- | ------------------------------------- | ---------- |
| **safe-pull-schema.sh** | Pull schema from production (no data) | ✅ LOW     |
| **safe-pull-tables.sh** | Pull specific tables with data        | 🟡 MEDIUM  |
| **backup-restore.sh**   | Backup & restore local database       | ✅ LOW     |

---

## 🎯 Quick Decision Guide

### "I just want to...get started"

→ Read: **QUICKSTART_DATA_MIGRATION.md** (5 min read)
→ Run: `./safe-pull-schema.sh`

### "I need to pull production data"

→ Read: **QUICKSTART_DATA_MIGRATION.md** - Recipe 2
→ Run: `./safe-pull-tables.sh transactions bank_accounts`

### "Production broke something"

→ Read: **DATA_MIGRATION_COMMANDS.md** - "When Things Go Wrong"
→ Run: `./backup-restore.sh list` then `restore`

### "I want to understand all options"

→ Read: **SAFE_DATA_MIGRATION.md** (comprehensive)
→ See: 6 different strategies with pros/cons

---

## ⚡ Super Quick Start (3 commands)

```bash
# 1. Backup local (safety first)
./backup-restore.sh backup

# 2. Get schema from production
./safe-pull-schema.sh

# 3. You're done! Develop locally with production schema
```

**Time:** ~2 minutes  
**Risk:** ✅ LOW  
**Result:** Production schema + Your test data

---

## 🔄 The Core Philosophy

### ✅ What We Do

| Operation                  | Safe?  | Command                       |
| -------------------------- | ------ | ----------------------------- |
| Get schema from production | ✅ YES | `./safe-pull-schema.sh`       |
| Get specific tables + data | ✅ YES | `./safe-pull-tables.sh`       |
| Backup before changes      | ✅ YES | `./backup-restore.sh backup`  |
| Restore from backup        | ✅ YES | `./backup-restore.sh restore` |
| Deploy migrations to prod  | ✅ YES | `supabase db push --dry-run`  |
| Work locally               | ✅ YES | `npm run dev`                 |

### ❌ What We DON'T Do

| Operation                       | Safe? | Warning                   |
| ------------------------------- | ----- | ------------------------- |
| Dump entire production database | ❌ NO | Version incompatibilities |
| Push data dumps to production   | ❌ NO | Data integrity issues     |
| Modify production from local    | ❌ NO | Untested changes          |
| Store credentials in code       | ❌ NO | Security risk             |
| Skip backups                    | ❌ NO | No recovery option        |

---

## 🔐 Security First

Every script follows these principles:

1. **Passwords are never stored**
   - Prompted on each run
   - Never appear in logs

2. **Backups are automatic**
   - Created before any destructive operation
   - Stored with timestamp: `/tmp/supabase_backups/`

3. **Verification is built-in**
   - Confirm operations before executing
   - Report success/failure clearly
   - Show data counts for verification

4. **Credentials are isolated**
   ```
   .env.local              ✅ Contains credentials
     └─ .gitignore        ✅ Never committed
   supabase/migrations/    ✅ No credentials
   ```

---

## 📊 Your Current Setup

### Local Development

- **Status:** ✅ Running
- **URL:** `http://127.0.0.1:54321`
- **DB:** `postgresql://postgres:postgres@127.0.0.1:54322/postgres`
- **Studio:** `http://127.0.0.1:54323`

### Dev Mode Toggle

- **Location:** `.env.local`
- **Current:** `NEXT_PUBLIC_SUPABASE_DEV_MODE=true`
- **Effect:** Uses local Supabase automatically

### Production Connection

- **Status:** ✅ Configured
- **Project:** `tybmdxojhfcnkcdpoedh`
- **Access:** Via scripts (passwords secured)

---

## 🎓 Use Cases by Role

### 👨‍💻 Developer (Daily Work)

**Morning Setup:**

```bash
./safe-pull-schema.sh  # Get latest schema from prod
npm run dev           # Start developing
```

**New Feature (1 day):**

```bash
# Work locally, create migration if needed
git add supabase/migrations/
git commit -m "feature: new field"

# Deploy when ready
supabase db push --dry-run
supabase db push
```

**Need Production Data:**

```bash
./backup-restore.sh backup                    # Safety
./safe-pull-tables.sh transactions            # Get data
# Debug with real data
```

**Oops, Made a Mistake:**

```bash
./backup-restore.sh list                      # See options
./backup-restore.sh restore /tmp/backup...    # Restore
# Continue developing
```

---

### 🏗️ DevOps / Tech Lead

**Weekly Schema Audit:**

```bash
./safe-pull-schema.sh
# Review for unexpected changes
```

**Pre-Deployment Checklist:**

```bash
# 1. Review migrations
git log supabase/migrations/

# 2. Dry run
supabase db push --dry-run

# 3. Deploy
supabase db push

# 4. Verify
# Check production dashboard
```

**Emergency Recovery:**

```bash
# Ensure backups exist
./backup-restore.sh list

# Restore if needed (local only)
./backup-restore.sh restore <file>
```

---

### 📊 Data Analyst

**Need Test Data:**

```bash
./safe-pull-tables.sh transactions users      # Get real data
# Analyze locally, nothing affects production
```

**Create Reports:**

```bash
psql -h 127.0.0.1 -p 54322 -U postgres -d postgres \
  -c "SELECT COUNT(*) FROM transactions;"

# Generate queries locally before prod
```

---

## 🚨 Common Mistakes & How to Avoid

### ❌ Mistake 1: Losing track of backups

**Prevention:**

```bash
# Set backup directory location
export BACKUP_DIR="/Users/jenwitnoppiboon/Documents/backup-project/.backups"
mkdir -p "$BACKUP_DIR"

# Check regularly
./backup-restore.sh list
```

### ❌ Mistake 2: Syncing entire production database

**Prevention:**

```bash
# WRONG:
pg_dump production | psql local

# RIGHT:
./safe-pull-schema.sh                          # Schema only first
./safe-pull-tables.sh specific_table_to_pull   # Then pick tables
```

### ❌ Mistake 3: Committing .env.local to git

**Prevention:**

```bash
# Make sure .gitignore has:
echo ".env.local" >> .gitignore
git add .gitignore
git commit -m "Hide environment files"
```

### ❌ Mistake 4: Forgetting to backup before operating

**Prevention:**

```bash
# Always first line:
./backup-restore.sh backup

# Then your operation
./safe-pull-tables.sh ...
```

---

## 📈 Workflow Examples

### Daily Development Workflow

```
Morning:
  1. ./safe-pull-schema.sh          (get latest schema)
  2. npm run dev                    (start coding)

During Day:
  3. Create features/migrations
  4. Test locally
  5. git commit

Evening:
  6. supabase db push --dry-run     (preview changes)
  7. supabase db push               (deploy to prod)
```

### Weekly Data Refresh Workflow

```
Monday Morning:
  1. ./backup-restore.sh backup                (safety)
  2. ./safe-pull-schema.sh                     (schema sync)
  3. ./safe-pull-tables.sh transactions...     (data sync if needed)

Then:
  4. Run test suite against real-like data
  5. Report findings
```

---

## 📞 Quick Troubleshooting

| Problem                     | Solution                                             |
| --------------------------- | ---------------------------------------------------- |
| Can't connect to production | Check internet, verify `.env.local`                  |
| Schema sync failed          | Check disk space, retry                              |
| Data looks weird            | Restore backup: `./backup-restore.sh restore <file>` |
| Script won't run            | `chmod +x safe-pull-*.sh && bash script.sh`          |
| Forgot which tables to pull | Check schema: `supabase db diff`                     |
| Want to undo everything     | `./backup-restore.sh restore` then restart           |

---

## 🎯 Success Metrics

After implementing this system, you should see:

- ✅ **Zero data losses** - Backups before every operation
- ✅ **Fast schema syncs** - ~2 minutes for schema-only pulls
- ✅ **Clear audit trail** - Timestamped backups, logged operations
- ✅ **Confidence to test** - Work with production data safely
- ✅ **Easy rollbacks** - Restore from backup instantly
- ✅ **Production protected** - Never accidentally modify prod

---

## 📚 Documentation Map

```
START HERE
    ↓
┌─────────────────────────────────────┐
│ You are here: OVERVIEW.md           │
│ Quick reference & big picture       │
└─────────────────────────────────────┘
    ↓
    ├─→ Want quick start?
    │   └─→ QUICKSTART_DATA_MIGRATION.md ⚡
    │
    ├─→ Need specific commands?
    │   └─→ DATA_MIGRATION_COMMANDS.md 🔧
    │
    └─→ Want deep dive?
        └─→ SAFE_DATA_MIGRATION.md 📖
```

---

## ✨ Next Steps

1. **Read QUICKSTART_DATA_MIGRATION.md** (5 minutes)
2. **Run `./safe-pull-schema.sh`** (2 minutes)
3. **Verify local is working** (1 minute)
4. **Bookmark this folder** for future reference
5. **Share these tools with team** for consistent practices

---

## 🎉 You're All Set!

Your data migration system is ready. You can now:

✅ Safely pull production schema  
✅ Selectively sync tables with data  
✅ Backup before any operation  
✅ Restore quickly if needed  
✅ Deploy migrations with confidence

**Happy developing!** 🚀

---

_Last updated: May 3, 2026_  
_Questions? Check the detailed guides linked above_
