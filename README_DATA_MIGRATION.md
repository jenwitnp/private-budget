# SAFE DATA MIGRATION: Quick Reference

## START HERE

This folder contains everything you need to safely work with production and local Supabase data.

## READ THESE FILES IN ORDER:

1. DATA_MIGRATION_OVERVIEW.md (THIS FILE - 5 min overview)
2. QUICKSTART_DATA_MIGRATION.md (Common recipes)
3. DATA_MIGRATION_COMMANDS.md (Detailed reference)
4. SAFE_DATA_MIGRATION.md (Complete strategies)

## AVAILABLE SCRIPTS (Ready to use):

- ./safe-pull-schema.sh Pull schema from production (no data)
- ./safe-pull-tables.sh Pull specific tables with data
- ./backup-restore.sh Backup/restore local database

## 3-MINUTE QUICK START:

```bash
1. ./backup-restore.sh backup
2. ./safe-pull-schema.sh
3. Start developing!
```

## COMMON TASKS:

Pull schema from production:
./safe-pull-schema.sh

Pull specific tables with data:
./backup-restore.sh backup
./safe-pull-tables.sh transactions bank_accounts

Restore from backup:
./backup-restore.sh list
./backup-restore.sh restore <file>

Deploy to production:
supabase db push --dry-run
supabase db push

## SECURITY ESSENTIALS:

- Passwords are prompted (never stored)
- Backups created before any operation
- .env.local should be in .gitignore
- Confirmation required for destructive operations
- All operations verified after completion

## NEVER DO:

- pg_dump production | psql local
- Modify production from local connection
- Commit .env.local to git
- Skip backups before operations
- Push raw data dumps to production

## DATABASE CONNECTIONS:

Local: psql -h 127.0.0.1 -p 54322 -U postgres -d postgres
Production: Use the scripts (they handle authentication)

## BACKUPS ARE STORED IN:

/tmp/supabase*backups/backup*\*.sql

## CURRENT SETUP STATUS:

- Local Supabase: Running on http://127.0.0.1:54321
- Dev Mode: Enabled (NEXT_PUBLIC_SUPABASE_DEV_MODE=true)
- Production: Configured and accessible

## NEED HELP?

Question: "How do I set up development?"
Answer: Read QUICKSTART_DATA_MIGRATION.md - Recipe 1

Question: "What if I break something?"
Answer: Read DATA_MIGRATION_COMMANDS.md - "When Things Go Wrong"

Question: "I want all the details"
Answer: Read SAFE_DATA_MIGRATION.md

## QUICK WORKFLOW:

Morning:
./safe-pull-schema.sh
npm run dev

During Day:
Develop and test locally
Create migrations if needed

Evening:
supabase db push --dry-run (preview)
supabase db push (deploy)

## SUCCESS CHECKLIST AFTER SETUP:

- [ ] Read DATA_MIGRATION_OVERVIEW.md
- [ ] Run ./safe-pull-schema.sh successfully
- [ ] Created a backup with ./backup-restore.sh backup
- [ ] Verified local Supabase is working
- [ ] Added .env.local to .gitignore
- [ ] Bookmarked this folder for reference

---

That's it! You're all set. Your data migration system is ready to use.

See: DATA_MIGRATION_OVERVIEW.md for complete overview
