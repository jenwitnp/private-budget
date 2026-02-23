# 🚀 Quick Supabase Integration - 3 Methods

## ⚡ Choose Your Method

### Method 1: API Endpoint (Easiest) ✅ RECOMMENDED

```bash
# 1. Start dev server
npm run dev

# 2. In another terminal, seed users
curl -X POST http://localhost:3000/api/admin/seed-users

# 3. Success! Users created
# Output shows: Test Credentials
```

**Best for:** Development, quick setup

---

### Method 2: SQL Script (Most Reliable) ✅ BEST FOR PRODUCTION

```bash
# 1. Open Supabase Dashboard
# 2. Go to SQL Editor
# 3. Create new query
# 4. Paste this entire file:
```

📄 **File**: `scripts/init-supabase.sql`

```sql
-- Copy entire content from scripts/init-supabase.sql
-- Then paste in Supabase SQL Editor and click "Run"
```

**Best for:** Production, migrations

---

### Method 3: TypeScript Script (Automated)

```bash
# 1. Install Supabase client
npm install @supabase/supabase-js

# 2. Set environment variables in .env.local
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# 3. Run seed script
npx ts-node scripts/seed-users.ts

# 4. Success! Check console for output
```

**Best for:** CI/CD, automation

---

## 📋 Quick Checklist

```
[ ] 1. Create Supabase project (supabase.com)
[ ] 2. Get your URL and keys
[ ] 3. Add to .env.local
[ ] 4. Install @supabase/supabase-js (npm install)
[ ] 5. Choose a method above and seed users
[ ] 6. Copy nextauth-supabase.ts to pages/api/auth/[...nextauth].ts
[ ] 7. Test login
```

---

## 🔑 Environment Variables

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ0eXAiOiJKV1QiLCJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJ0eXAiOiJKV1QiLCJhbGc...
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-min-32-chars
```

**Where to find:**

1. Login to Supabase
2. Select your project
3. Go to Settings → API Keys
4. Copy the keys

---

## 📁 Files Provided

| File                            | Purpose                     |
| ------------------------------- | --------------------------- |
| `scripts/init-supabase.sql`     | Database schema + seed data |
| `scripts/seed-users.ts`         | TypeScript seed script      |
| `scripts/nextauth-supabase.ts`  | Updated NextAuth config     |
| `pages/api/admin/seed-users.ts` | API endpoint (dev only)     |
| `SUPABASE_SETUP.md`             | Full setup guide            |

---

## 🧪 Test Credentials (After Seeding)

```
Owner:  owner@example.com / password123
Admin:  admin@example.com / password123
User:   user@example.com / password123
```

---

## ⏱️ Time to Complete

- **Method 1 (API)**: 2 minutes ⚡
- **Method 2 (SQL)**: 3 minutes 📋
- **Method 3 (Script)**: 5 minutes 🤖

---

## 🔄 Update NextAuth Configuration

After seeding users:

```bash
# Copy the Supabase-integrated NextAuth config
cp scripts/nextauth-supabase.ts pages/api/auth/[...nextauth].ts
```

Or manually update `pages/api/auth/[...nextauth].ts` to query from:

```sql
SELECT * FROM users WHERE email = $1
```

---

## ✅ Verify It Works

```bash
# 1. Start server
npm run dev

# 2. Go to login page
http://localhost:3000/login

# 3. Login with
owner@example.com / password123

# 4. Should redirect to dashboard ✅
```

---

## 🐛 Troubleshooting

| Issue                           | Solution                                    |
| ------------------------------- | ------------------------------------------- |
| "Cannot connect to Supabase"    | Check URL and keys in .env.local            |
| "Users already exist"           | Means seeding already worked!               |
| "Method not allowed" (API seed) | Only works in development                   |
| "Service role key not found"    | Add SUPABASE_SERVICE_ROLE_KEY to .env.local |

---

## 💡 Pro Tips

1. **Test locally first** (Method 1) before production (Method 2)
2. **Keep .env.local private** - never commit it
3. **Use different keys** for dev/prod
4. **Test all 3 roles** after seeding
5. **Remove seed endpoint** from production

---

## 📚 Full Documentation

For more details, see:

- `SUPABASE_SETUP.md` - Complete guide
- `docs/AUTHENTICATION.md` - Auth architecture
- `QUICKSTART.md` - Getting started

---

**Ready? Pick a method above and get started!** 🚀
