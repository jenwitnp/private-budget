# 🔗 Supabase Integration Guide

## Setup Steps

### 1. Set Up Supabase

```bash
# Go to https://supabase.com and create a new project
# Copy your credentials
```

### 2. Add Environment Variables

Update `.env.local`:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-min-32-chars
```

### 3. Create Database Schema

**Option A: Using SQL Editor (Recommended)**

1. Go to Supabase Dashboard → SQL Editor
2. Copy and paste content from `scripts/init-supabase.sql`
3. Click "Run"

**Option B: Create Tables Manually**

```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL,
  status VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
```

### 4. Install Supabase Client

```bash
npm install @supabase/supabase-js
```

### 5. Seed Test Users

**Option A: Using API Endpoint (Easiest)**

```bash
# Start dev server
npm run dev

# In another terminal, call the seed endpoint
curl -X POST http://localhost:3000/api/admin/seed-users
```

**Option B: Using TypeScript Script**

```bash
# Set up environment variables first
npx ts-node scripts/seed-users.ts
```

**Option C: Using Supabase SQL Editor**

Copy from `scripts/init-supabase.sql` (includes INSERT statements)

### 6. Update NextAuth Configuration

Replace your current `pages/api/auth/[...nextauth].ts` with:

```bash
cp scripts/nextauth-supabase.ts pages/api/auth/[...nextauth].ts
```

Then update the file to match your needs.

### 7. Test the Integration

```bash
# Start dev server
npm run dev

# Try logging in
# Email: owner@example.com
# Password: password123
```

---

## File Structure

```
scripts/
├── init-supabase.sql          # Database schema + seed data
├── seed-users.ts              # TypeScript seed script
└── nextauth-supabase.ts       # Updated NextAuth config

pages/api/admin/
└── seed-users.ts              # API endpoint to seed users
```

---

## Three Methods Explained

### Method 1: API Endpoint (✅ Recommended for Development)

**Pros:**

- Easiest to use
- No CLI needed
- Can be called from browser

**Cons:**

- Only works in development

**Usage:**

```bash
curl -X POST http://localhost:3000/api/admin/seed-users
```

### Method 2: SQL Script (✅ Recommended for Production)

**Pros:**

- Works in production
- Creates schema + seeds data
- Most reliable

**Cons:**

- Requires manual SQL execution

**Usage:**

1. Open Supabase SQL Editor
2. Paste `scripts/init-supabase.sql`
3. Click "Run"

### Method 3: TypeScript Script (✅ For Automation)

**Pros:**

- Can be automated
- Good for CI/CD

**Cons:**

- Requires setup
- Needs environment variables

**Usage:**

```bash
npx ts-node scripts/seed-users.ts
```

---

## Database Schema

```sql
users
├── id (TEXT, PRIMARY KEY)
├── email (VARCHAR, UNIQUE)
├── name (VARCHAR)
├── password_hash (VARCHAR)
├── role (VARCHAR: owner|admin|user)
├── status (VARCHAR: active|inactive)
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)
```

---

## Test Users

After seeding, these accounts will work:

| Email             | Password    | Role  |
| ----------------- | ----------- | ----- |
| owner@example.com | password123 | owner |
| admin@example.com | password123 | admin |
| user@example.com  | password123 | user  |

---

## Environment Variables Checklist

```
✓ NEXT_PUBLIC_SUPABASE_URL
✓ NEXT_PUBLIC_SUPABASE_ANON_KEY
✓ SUPABASE_SERVICE_ROLE_KEY
✓ NEXTAUTH_URL
✓ NEXTAUTH_SECRET
✓ NODE_ENV (development/production)
```

---

## Troubleshooting

### "Could not connect to Supabase"

- Check SUPABASE_URL and keys in `.env.local`
- Verify Supabase project is active

### "Users already exist"

- Users have already been seeded
- Use `/api/admin/seed-users` to skip existing

### "Invalid password"

- Password hash doesn't match
- Verify password is "password123"
- Check bcryptjs hash is correct

### "Service role key not found"

- Add `SUPABASE_SERVICE_ROLE_KEY` to `.env.local`
- Get it from Supabase Dashboard → Settings → API Keys

---

## Security Notes

⚠️ **Important:**

- Never commit `.env.local` with real keys
- Use `SUPABASE_SERVICE_ROLE_KEY` only in backend
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` is public (safe)
- Remove seed endpoint from production or protect it

---

## Next Steps

1. ✅ Set up Supabase project
2. ✅ Add environment variables
3. ✅ Create database schema (use `init-supabase.sql`)
4. ✅ Seed test users
5. ✅ Update NextAuth config (copy `nextauth-supabase.ts`)
6. ✅ Test login
7. ⏳ Replace mock data in app with database queries

---

## Creating New Users

### From Admin Panel

1. Login as owner/admin
2. Go to `/admin/users`
3. Click "+ เพิ่มผู้ใช้"
4. Fill in form
5. Click "เพิ่มผู้ใช้"

This will insert directly into Supabase users table.

### From API

```typescript
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(url, key);

const { data, error } = await supabase.from("users").insert({
  id: "4",
  email: "newuser@example.com",
  name: "New User",
  password_hash: bcryptHashedPassword,
  role: "user",
  status: "active",
});
```

---

## Updating User Roles

```typescript
const { data, error } = await supabase
  .from("users")
  .update({ role: "admin" })
  .eq("email", "user@example.com");
```

---

## Deleting Users

```typescript
const { error } = await supabase.from("users").delete().eq("id", "3");
```

---

## Querying Users

```typescript
// Get single user
const { data: user } = await supabase
  .from("users")
  .select("*")
  .eq("email", "owner@example.com")
  .single();

// Get all users
const { data: users } = await supabase.from("users").select("*");

// Get by role
const { data: admins } = await supabase
  .from("users")
  .select("*")
  .eq("role", "admin");
```

---

## Production Deployment

### Before Going Live

1. [ ] Set strong `NEXTAUTH_SECRET`
2. [ ] Use production Supabase project
3. [ ] Remove seed endpoint (or protect it)
4. [ ] Enable HTTPS
5. [ ] Set up backups
6. [ ] Configure RLS policies
7. [ ] Set up monitoring

### Environment Setup

```bash
# Production .env
NEXT_PUBLIC_SUPABASE_URL=https://prod-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=prod-anon-key
SUPABASE_SERVICE_ROLE_KEY=prod-service-role-key
NEXTAUTH_URL=https://yourdomain.com
NEXTAUTH_SECRET=your-super-secret-key-min-32-chars
NODE_ENV=production
```

---

**Need Help?** See `QUICKSTART.md` or `docs/AUTHENTICATION.md`
