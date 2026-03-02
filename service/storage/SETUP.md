# Google Cloud Storage Service Setup Guide

## Installation Steps

### 1. Install Dependencies

```bash
npm install @google-cloud/storage sharp uuid
npm install --save-dev @types/node
```

Or with yarn:

```bash
yarn add @google-cloud/storage sharp uuid
yarn add -D @types/node
```

### 2. Verify Dependencies in package.json

After installation, your `package.json` should include:

```json
{
  "dependencies": {
    "@google-cloud/storage": "^7.0.0",
    "sharp": "^0.33.0",
    "uuid": "^9.0.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0"
  }
}
```

### 3. Google Cloud Setup

#### Create a Service Account

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Go to **IAM & Admin** → **Service Accounts**
4. Click **Create Service Account**
5. Fill in the details and click **Create**
6. Click the service account to open it
7. Go to **Keys** tab
8. Click **Add Key** → **Create new key**
9. Choose **JSON**
10. Save the JSON file securely

#### Create a Storage Bucket

1. Go to **Cloud Storage** → **Buckets**
2. Click **Create Bucket**
3. Set bucket name (must be globally unique)
4. Choose location and storage class
5. Click **Create**

#### Set Permissions

1. In the **Buckets** view, click your bucket
2. Go to **Permissions** tab
3. Add the service account email with **Storage Object Admin** role

### 4. Environment Variables

Create a `.env.local` file in your project root:

```env
# Google Cloud Configuration
GCP_PROJECT_ID=your-project-id
GCP_KEY_FILE=./google-cloud-key.json
GCS_BUCKET_NAME=your-bucket-name
```

Or for production, use environment variables:

```bash
export GCP_PROJECT_ID="your-project-id"
export GCP_KEY_FILE="/path/to/key.json"
export GCS_BUCKET_NAME="your-bucket-name"
```

### 5. Store Service Account Key

```bash
# Copy your service account JSON key to the project root
cp ~/Downloads/your-key.json ./google-cloud-key.json

# Add to .gitignore to prevent committing sensitive data
echo "google-cloud-key.json" >> .gitignore
```

### 6. Verify Installation

Create a test file to verify everything works:

```typescript
// test-storage.ts
import { createStorageService } from "@/service/storage";

async function testStorage() {
  try {
    const storageService = createStorageService();
    console.log("✅ Storage service initialized successfully");

    // Test file operations here
  } catch (error) {
    console.error("❌ Failed to initialize storage service:", error);
  }
}

testStorage();
```

Run the test:

```bash
npx ts-node test-storage.ts
```

## Project Structure

After setup, your project should have:

```
project-root/
├── service/
│   └── storage/
│       ├── google-cloud-storage.ts
│       ├── types.ts
│       ├── utils.ts
│       ├── index.ts
│       ├── examples.ts
│       ├── README.md
│       └── MIGRATION.md
├── .env.local
├── .gitignore
├── package.json
└── ...
```

## Troubleshooting

### Error: "ENOENT: no such file or directory, open 'google-cloud-key.json'"

**Solution:** Ensure the service account JSON file exists at the path specified in `GCP_KEY_FILE`.

```bash
ls -la google-cloud-key.json
```

### Error: "Cannot find module '@google-cloud/storage'"

**Solution:** Install dependencies:

```bash
npm install @google-cloud/storage
```

### Error: "Authentication error"

**Possible causes:**

1. Invalid GCP_PROJECT_ID
2. Service account doesn't have permissions to the bucket
3. Key file is corrupted or invalid

**Solution:**

1. Verify project ID in Google Cloud Console
2. Check service account has **Storage Object Admin** role
3. Re-download the service account key

### Error: "Bucket not found"

**Solution:** Ensure bucket name is correct and exists:

```bash
# List buckets (if you have gsutil installed)
gsutil ls
```

## Security Best Practices

1. **Never commit service account keys to Git**

   ```bash
   echo "google-cloud-key.json" >> .gitignore
   echo ".env.local" >> .gitignore
   ```

2. **Use environment variables for sensitive data**
   - In production, use Google Cloud Secret Manager or similar

3. **Restrict service account permissions**
   - Only give the permissions needed (e.g., Storage Object Admin)

4. **Rotate keys periodically**
   - Delete old keys in Google Cloud Console
   - Generate new ones regularly

5. **Use signed URLs for sensitive files**
   - For private files, generate time-limited signed URLs

## Next Steps

1. ✅ Install dependencies
2. ✅ Create service account and bucket
3. ✅ Configure environment variables
4. ✅ Run setup test
5. ✅ Review [README.md](./README.md) for usage examples
6. ✅ Check [examples.ts](./examples.ts) for implementation patterns

## Quick Reference

### Initialize Service

```typescript
import { createStorageService } from "@/service/storage";
const storage = createStorageService();
await storage.initialize();
```

### Upload Image

```typescript
const images = await storage.uploadImage(file, {
  folder: "products",
  thumbnail: true,
});
```

### Delete File

```typescript
await storage.deleteFile({
  fileName: "products/image.jpg",
  bucket: process.env.GCS_BUCKET_NAME!,
});
```

## Support

For issues:

1. Check the [README.md](./README.md)
2. Review [examples.ts](./examples.ts)
3. Check [MIGRATION.md](./MIGRATION.md) if migrating from old code
4. Verify Google Cloud permissions and configuration
