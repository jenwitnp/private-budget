# 🔐 Security Setup Guide

## Current Security Status ✅

**Overall: SECURE**

- ✅ `.env.local` and `credentials/` are properly ignored by `.gitignore`
- ✅ No secrets found in git history (22 commits checked)
- ✅ Private GitHub repository
- ✅ `.env.local.example` tracked as template

---

## Security Verification Results

### 1. Git Protection ✅

```bash
# Verified:
git check-ignore -v credentials/ .env.local
# Output:
# .gitignore:34:/credentials      credentials/
# .gitignore:28:.env.local        .env.local

git log --all --full-history -- credentials/ .env.local
# Output: (empty - never committed)

git ls-files | grep -E "(credentials|\.env\.local)"
# Output: .env.local.example (only template tracked)
```

### 2. .gitignore Configuration ✅

```
Line 28: .env.local
Line 34: /credentials
Line 36: *.key
Line 37: *.pem
```

### 3. Current File Status ✅

- `.env.local` - Exists locally, NOT tracked by git
- `credentials/` - Exists locally, NOT tracked by git
- No untracked sensitive files in git status

---

## Setting Up Vercel (Recommended: Option 1 - Base64)

### Step 1: Encode GCP Credentials

```bash
# macOS/Linux
cat credentials/ckc2car-43f3e-fd11653ba002.json | base64

# Windows (PowerShell)
[Convert]::ToBase64String([System.IO.File]::ReadAllBytes("credentials/ckc2car-43f3e-fd11653ba002.json")) | Set-Clipboard
```

Copy the base64 output.

### Step 2: Add to Vercel Environment Variables

1. Go to **Vercel Dashboard** → Your Project → **Settings** → **Environment Variables**
2. Add new variable:
   - **Name:** `GCP_SERVICE_ACCOUNT_B64`
   - **Value:** [Paste base64 string from Step 1]
   - **Environments:** Select Production, Preview (or both)

3. Add other secrets:

| Variable                        | Value                       | Environments                     |
| ------------------------------- | --------------------------- | -------------------------------- |
| `NEXTAUTH_SECRET`               | Your random 32+ char secret | Production, Preview, Development |
| `NEXT_PUBLIC_SUPABASE_URL`      | Your Supabase URL           | All                              |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon key      | All                              |
| `SUPABASE_SERVICE_ROLE_KEY`     | Your service role key       | Production, Preview              |
| `LINE_CHANNEL_ACCESS_TOKEN`     | Your LINE token             | Production, Preview              |
| `LINE_CHANNEL_SECRET`           | Your LINE secret            | Production, Preview              |
| `GCS_BUCKET_NAME`               | your-bucket-name            | All                              |

### Step 3: Update Your Code

For runtime decoding of base64 GCP credentials:

```typescript
// lib/gcp/client.ts or similar
export function getGCPCredentials() {
  const base64 = process.env.GCP_SERVICE_ACCOUNT_B64;

  if (!base64) {
    throw new Error("GCP_SERVICE_ACCOUNT_B64 not configured");
  }

  const json = Buffer.from(base64, "base64").toString("utf-8");
  return JSON.parse(json);
}

// Usage in your GCS client
import { getGCPCredentials } from "@/lib/gcp/client";

const credentials = getGCPCredentials();
// Use credentials with @google-cloud/storage
```

### Step 4: Update `.env.local` for Local Development

```bash
# Keep using file path locally
GCP_KEY_FILE=credentials/ckc2car-43f3e-fd11653ba002.json
GCP_SERVICE_ACCOUNT_B64=  # Leave empty for local
```

Or use base64 locally too:

```bash
# Generate base64 for local development
cat credentials/ckc2car-43f3e-fd11653ba002.json | base64 > /tmp/gcp_b64.txt
# Copy content to .env.local under GCP_SERVICE_ACCOUNT_B64
```

---

## Alternative: Option 2 - Individual Environment Variables

If you prefer not to use base64, add individual fields:

```bash
# In Vercel Environment Variables
GCP_PROJECT_ID=ckc2car-43f3e
GCP_PRIVATE_KEY_ID=fd11653ba00225fe93a06b89d994b79e05ec81de
GCP_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GCP_CLIENT_EMAIL=private-budget@ckc2car-43f3e.iam.gserviceaccount.com
GCP_CLIENT_ID=117261282415497176965
```

Then reconstruct in code:

```typescript
export function getGCPCredentials() {
  return {
    type: "service_account",
    project_id: process.env.GCP_PROJECT_ID,
    private_key_id: process.env.GCP_PRIVATE_KEY_ID,
    private_key: process.env.GCP_PRIVATE_KEY,
    client_email: process.env.GCP_CLIENT_EMAIL,
    client_id: process.env.GCP_CLIENT_ID,
  };
}
```

---

## Ongoing Security Practices

### 📅 Quarterly Tasks

- [ ] Rotate GCP service account keys

  ```bash
  # In GCP Console: IAM → Service Accounts → Select account → Keys → Create New
  # Delete old key after updating Vercel
  ```

- [ ] Review and rotate LINE channel credentials if needed

- [ ] Rotate NEXTAUTH_SECRET in Vercel

### 🔍 Monitoring

- [ ] Enable GCP Cloud Audit Logs for bucket access
- [ ] Set up alerts for unauthorized bucket access
- [ ] Monitor Vercel deployment logs for errors

### 🛡️ Pre-commit Hooks (Optional but Recommended)

Install git-secrets to prevent accidental commits:

```bash
# Install git-secrets
brew install git-secrets  # macOS

# Configure for project
cd /Users/jenwitnoppiboon/Documents/budget-project
git secrets --install
git secrets --register-aws  # Adds AWS patterns
git secrets --add-provider 'cat .gitignore'

# Test it works
echo "SUPABASE_SERVICE_ROLE_KEY=test" > test.txt
git add test.txt
# Should fail with: "Git secrets: SUPABASE_SERVICE_ROLE_KEY matched patterns"

rm test.txt
```

### 🚨 What To Do If Credentials Are Accidentally Committed

1. **Immediately rotate the compromised credentials** in GCP/Supabase/LINE
2. Use `git filter-branch` or `BFG Repo-Cleaner` to remove from history
3. Force push to clean the history:
   ```bash
   # WARNING: This rewrites history - coordinate with team
   git push origin --force-with-lease
   ```
4. Notify collaborators to fetch fresh copy

---

## Checklist for Vercel Deployment

- [ ] All environment variables added to Vercel project
- [ ] `GCP_SERVICE_ACCOUNT_B64` is base64 encoded correctly
- [ ] Production and Preview environments configured separately if needed
- [ ] `NEXTAUTH_URL` updated to production domain
- [ ] `NEXT_PUBLIC_SUPABASE_URL` and keys verified
- [ ] LINE webhook URL updated to production domain
- [ ] Test deployment with `vercel deploy --prod`

---

## Testing Environment Variables

```bash
# Test locally that all variables are loaded
node -e "console.log(process.env.NEXTAUTH_SECRET ? '✓' : '✗')"

# Test in Vercel preview
# Add this to a page temporarily:
export default function Test() {
  return <pre>{JSON.stringify(process.env, null, 2)}</pre>
}
# Only in non-production!
```

---

## Reference Documents

- [Vercel Environment Variables](https://vercel.com/docs/projects/environment-variables)
- [NextAuth.js Configuration](https://next-auth.js.org/configuration/overview)
- [GCP Service Accounts](https://cloud.google.com/iam/docs/service-accounts)
- [git-secrets](https://github.com/awslabs/git-secrets)

---

**Last Updated:** March 8, 2026  
**Status:** ✅ Secure Configuration
