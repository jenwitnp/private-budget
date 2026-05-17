# Production to Local Supabase Migration Guide

Your production project is: **tybmdxojhfcnkcdpoedh**

## 🚀 Quick Start (Automated)

Use the provided script to automate the entire migration:

```bash
./migrate-prod-to-local.sh
```

You'll be prompted to provide your Supabase access token. Follow the prompts.

---

## 📋 Manual Steps (Using CLI)

### Step 1: Get Access Token

1. Go to: https://app.supabase.com/account/tokens
2. Click "Generate New Token"
3. Name it: "CLI-Migration"
4. Copy the token (starts with `sbp_`)

### Step 2: Authenticate

```bash
supabase login --token <YOUR_TOKEN_HERE>
```

Replace `<YOUR_TOKEN_HERE>` with your actual token.

### Step 3: Link Project

```bash
supabase link --project-ref tybmdxojhfcnkcdpoedh
```

### Step 4: Pull Production Schema

```bash
supabase db pull
```

This creates migration files from your production database schema.

### Step 5: Push to Local

```bash
supabase db push
```

This applies the schema to your local database.

### Step 6: Verify

```bash
supabase status
```

Open Studio at: http://127.0.0.1:54323

---

## 🔄 Alternative: Direct Database Connection

If you have direct PostgreSQL access credentials to production, you can use `pg_dump`:

```bash
# Export from production
pg_dump postgresql://user:password@host/database > backup.sql

# Import to local
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres < backup.sql
```

---

## 🔐 Security Notes

- **Access Tokens**: Keep tokens secure, never commit to git
- **Service Role Key**: Only use server-side, never in frontend
- **Anon Key**: Safe to expose in frontend
- Set tokens in environment variables, not as command arguments when possible

```bash
export SUPABASE_ACCESS_TOKEN="sbp_your_token_here"
supabase link --project-ref tybmdxojhfcnkcdpoedh
```

---

## 📊 What Gets Migrated

✅ **Database Schema**

- All tables
- Column definitions
- Constraints
- Indexes
- Functions

✅ **Seed Data** (if exists in migrations)

- Initial data from migrations

❌ **Real-time subscriptions** (re-configured automatically)

❌ **Auth users** (create test users locally)

❌ **Storage files** (download separately if needed)

---

## 🔀 Switching Between Environments

Your `.env.local` is already configured:

```env
NEXT_PUBLIC_SUPABASE_DEV_MODE=true   # Use local
# OR
NEXT_PUBLIC_SUPABASE_DEV_MODE=false  # Use production
```

The `supabaseClient.ts` automatically selects the correct credentials based on this flag.

**In your code:**

```typescript
import { supabase } from "@/lib/supabaseClient";

// Automatically uses local or production based on NEXT_PUBLIC_SUPABASE_DEV_MODE
const { data } = await supabase.from("users").select();
```

---

## 🔍 Verify Migration Success

### Check Local Studio

```bash
# This opens automatically, or go to:
open http://127.0.0.1:54323
```

### List Tables

```bash
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -c "\dt"
```

### Check Row Counts

```bash
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -c "SELECT tablename FROM pg_tables WHERE schemaname='public';"
```

---

## 🆘 Troubleshooting

### "Project not linked" error

```bash
supabase link --project-ref tybmdxojhfcnkcdpoedh
```

### "Authentication required" error

```bash
# Use token-based auth
export SUPABASE_ACCESS_TOKEN="sbp_your_token"
supabase db pull
```

### "Local Supabase not running" error

```bash
supabase start
```

### Verify local is running

```bash
supabase status
```

### Reset local database

```bash
# WARNING: This deletes all local data
supabase db reset
```

---

## 📝 Migration Checklist

- [ ] Generated access token at https://app.supabase.com/account/tokens
- [ ] Stored token securely (env variable, not in code)
- [ ] Ran `supabase login` or `supabase login --token`
- [ ] Linked project with `supabase link`
- [ ] Pulled schema with `supabase db pull`
- [ ] Pushed to local with `supabase db push`
- [ ] Verified tables exist in local Studio
- [ ] Set `NEXT_PUBLIC_SUPABASE_DEV_MODE=true` in .env.local
- [ ] Tested app against local Supabase
- [ ] Ready to switch to production when needed

---

## 🚀 Next Steps

1. **Run migration** (choose one method above)
2. **Verify data** in Studio UI (http://127.0.0.1:54323)
3. **Test your app** against local Supabase
4. **Update .env.local**: Keep `NEXT_PUBLIC_SUPABASE_DEV_MODE=true` for development
5. **When ready for production**: Change to `NEXT_PUBLIC_SUPABASE_DEV_MODE=false`

---

## 📚 Resources

- [Supabase CLI Docs](https://supabase.com/docs/guides/cli)
- [Local Development Guide](https://supabase.com/docs/guides/local-development)
- [Database Migrations](https://supabase.com/docs/guides/cli/local-development#database-migrations)
- [Account Tokens](https://app.supabase.com/account/tokens)
