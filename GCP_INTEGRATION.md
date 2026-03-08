# 🚀 GCP Integration Setup Guide

## What Was Integrated

Your project now supports **two ways** to configure Google Cloud Storage credentials:

1. **Local Development**: Using a credentials JSON file (current setup)
2. **Vercel/Production**: Using base64-encoded credentials in environment variables

### Files Created

- `lib/gcp/credentials.ts` - Helper functions for loading GCP credentials from either source

### Files Updated

- `pages/api/upload.ts` - Now uses the credential helper instead of hardcoded file path
- `.env.local` - Updated with clear instructions for both modes

---

## Quick Start: Local Development ✅

**No changes needed!** Your current setup works as-is:

```bash
# .env.local has:
GCP_PROJECT_ID=ckc2car-43f3e
GCP_KEY_FILE=credentials/ckc2car-43f3e-fd11653ba002.json
GCS_BUCKET_NAME=private-budget

# Local file at: credentials/ckc2car-43f3e-fd11653ba002.json
```

**Test locally:**

```bash
npm run dev
# Visit localhost:3000 and upload images to test
```

---

## Setup for Vercel Deployment

### Step 1: Encode Your Credentials to Base64

```bash
# macOS/Linux
cat credentials/ckc2car-43f3e-fd11653ba002.json | base64

# Copy the entire output
```

### Step 2: Add to Vercel Environment Variables

1. Go to **Vercel Dashboard** → Your Project
2. **Settings** → **Environment Variables**
3. Add new variable:
   - **Name:** `GCP_SERVICE_ACCOUNT_B64`
   - **Value:** [Paste the base64 string from Step 1]
   - **Environments:** Check `Production` and `Preview`

4. Also add:
   - **GCP_PROJECT_ID** = `ckc2car-43f3e`
   - **GCS_BUCKET_NAME** = `private-budget`

### Step 3: Deploy

```bash
git add .
git commit -m "Integrate GCP with environment variable support"
git push origin main
```

Vercel will automatically pick up the environment variables.

---

## How It Works

### Local Development (File Path)

```bash
1. env: GCP_KEY_FILE=credentials/...
2. Code reads JSON file from disk
3. Storage client uses file-based credentials
```

### Production (Base64)

```bash
1. env: GCP_SERVICE_ACCOUNT_B64=base64_string
2. Code decodes base64 → JSON string → JavaScript object
3. Storage client uses decoded credentials
```

### Code Logic

```typescript
// In lib/gcp/credentials.ts

if (GCP_SERVICE_ACCOUNT_B64) {
  // Vercel: Decode base64
  const json = Buffer.from(base64, "base64").toString("utf-8");
  const credentials = JSON.parse(json);
} else if (GCP_KEY_FILE) {
  // Local: Read file
  const json = fs.readFileSync(keyPath, "utf-8");
  const credentials = JSON.parse(json);
}
```

---

## Validation

The system automatically validates GCP configuration on every upload request:

```typescript
// Checks:
✓ GCP_PROJECT_ID is set
✓ Either GCP_SERVICE_ACCOUNT_B64 or GCP_KEY_FILE exists
✓ GCS_BUCKET_NAME is set

// If any check fails → 500 error with clear message
```

---

## Troubleshooting

### "No credentials configured" Error

Make sure **one of these is set**:

- ✅ `GCP_KEY_FILE` (local development)
- ✅ `GCP_SERVICE_ACCOUNT_B64` (Vercel)

```bash
# Check local
env | grep GCP_

# Check Vercel
vercel env list
```

### "Failed to decode base64 credentials"

The base64 string is invalid. Re-encode it:

```bash
cat credentials/ckc2car-43f3e-fd11653ba002.json | base64
```

Copy the **entire output** without any line breaks.

### Images Not Uploading

1. Check GCP bucket exists: `private-budget`
2. Check service account has permissions:
   - `storage.objects.create`
   - `storage.objects.get`
3. Check bucket policies allow signed URLs (7-day expiry)

---

## Security Notes

✅ **Safe configurations:**

- `GCP_KEY_FILE` in `.gitignore` - File never committed
- `GCP_SERVICE_ACCOUNT_B64` in Vercel - Encrypted at rest
- No credentials ever logged to console (they're filtered)

⚠️ **Be careful:**

- Don't commit credentials files to git
- Don't log base64 credentials
- Rotate credentials quarterly

---

## Testing Vercel Preview Deployment

```bash
# Deploy preview
vercel deploy

# Check environment variables are loaded
# Add temporary logging in pages/api/upload.ts
console.log('[GCS] Using credentials:',
  process.env.GCP_SERVICE_ACCOUNT_B64 ? 'base64' : 'file'
);
```

---

## Reference Implementation

**Read the source:**

- `lib/gcp/credentials.ts` - Credential loading logic
- `pages/api/upload.ts` - Usage example in upload handler

**Environment variable options:**

| Variable                | Local | Vercel | Required     |
| ----------------------- | ----- | ------ | ------------ |
| GCP_PROJECT_ID          | ✅    | ✅     | Yes          |
| GCP_KEY_FILE            | ✅    | ❌     | If no base64 |
| GCP_SERVICE_ACCOUNT_B64 | ❌    | ✅     | If no file   |
| GCS_BUCKET_NAME         | ✅    | ✅     | Yes          |

---

## To Generate Base64 (Detailed)

**macOS/Linux:**

```bash
# One-liner
cat credentials/ckc2car-43f3e-fd11653ba002.json | base64 | pbcopy

# Now paste in Vercel dashboard
```

**Windows PowerShell:**

```powershell
[System.IO.File]::ReadAllBytes("credentials/ckc2car-43f3e-fd11653ba002.json") |
  % {[Convert]::ToBase64String($_)} |
  Set-Clipboard
```

**Online tool (if needed):**

- https://www.base64encode.org/
- Upload the JSON file
- Copy base64 output

---

**Status:** ✅ Ready for Vercel deployment

**Last Updated:** March 8, 2026
