# Migration Guide: From googleCloud.js to TypeScript Storage Service

This guide helps you migrate from the old `googleCloud.js` file to the new TypeScript-based storage service.

## Overview of Changes

| Aspect         | Old (googleCloud.js)       | New (TypeScript Service)                |
| -------------- | -------------------------- | --------------------------------------- |
| Language       | JavaScript                 | TypeScript                              |
| Structure      | Functions + module exports | Class-based service                     |
| Configuration  | Environment variables only | Environment variables or config objects |
| Error Handling | Basic try-catch            | Comprehensive error handling + logging  |
| Testing        | Difficult                  | Easy with dependency injection          |
| Type Safety    | None                       | Full TypeScript support                 |
| Documentation  | Minimal                    | Comprehensive JSDoc + README            |

## Step 1: Update Imports

**Before (old file):**

```javascript
import {
  uploadToGoogle,
  deleteFileFromGoogleCloud,
} from "@/service/googleCloud";
```

**After (new service):**

```typescript
import { createStorageService } from "@/service/storage";

const storageService = createStorageService();
```

## Step 2: Initialize Service

**Before:**

```javascript
// No explicit initialization needed, but dependencies were global
```

**After:**

```typescript
// In your app initialization or before first use
const storageService = createStorageService();
await storageService.initialize(); // Optional but recommended
```

## Step 3: Upload Images

### Single Image Upload

**Before:**

```javascript
const uploadedData = await uploadToGoogle(files, {
  folder: "vehicles",
  thumbnail: true,
});
```

**After:**

```typescript
const storageService = createStorageService();
const uploadedData = await storageService.uploadImage(file, {
  folder: "vehicles",
  thumbnail: true,
  quality: 85, // New: control quality
});
```

### Multiple Images

**Before:**

```javascript
// Had to loop through files manually
for (const file of files) {
  await uploadToGoogle(file, options);
}
```

**After:**

```typescript
const storageService = createStorageService();
const results = await storageService.uploadMultipleImages(files, {
  folder: "vehicles",
  thumbnail: true,
});
```

## Step 4: Base64 Uploads

**Before:**

```javascript
const result = await uploadGoogleFromClient(
  fileName,
  base64Data,
  defaultMimeType,
);
```

**After:**

```typescript
const storageService = createStorageService();
const result = await storageService.uploadBase64Image(
  base64Data,
  fileName,
  defaultMimeType,
  "folder",
);
```

## Step 5: File Deletion

**Before:**

```javascript
await deleteFileFromGoogleCloud(fileData);
```

**After:**

```typescript
const storageService = createStorageService();
await storageService.deleteFile(fileData);
```

### Delete Multiple Files

**Before:**

```javascript
// Had to loop manually
for (const file of files) {
  await deleteFileFromGoogleCloud(file);
}
```

**After:**

```typescript
const storageService = createStorageService();
await storageService.deleteMultipleFiles(files);
```

## Step 6: Environment Variables

**No changes needed - same environment variables:**

```env
GCP_PROJECT_ID=your-gcp-project-id
GCP_KEY_FILE=path/to/your/service-account-key.json
GCS_BUCKET_NAME=your-bucket-name
```

## Complete Migration Example

### Before (Old Code)

```javascript
// pages/api/vehicle/upload.js
import { uploadToGoogle } from "@/service/googleCloud";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const files = req.files;
    const uploadedData = await uploadToGoogle(files, {
      folder: "vehicles",
      thumbnail: true,
    });

    res.status(200).json({
      success: true,
      data: uploadedData,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}
```

### After (New TypeScript Service)

```typescript
// app/api/vehicle/upload/route.ts
import { createStorageService } from "@/service/storage";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = formData.getAll("files") as File[];

    if (files.length === 0) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 });
    }

    const storageService = createStorageService();
    const uploadedData = await storageService.uploadMultipleImages(files, {
      folder: "vehicles",
      thumbnail: true,
      quality: 85,
    });

    return NextResponse.json({
      success: true,
      data: uploadedData,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Upload failed",
      },
      { status: 500 },
    );
  }
}
```

## New Features Available

The new service adds several improvements:

### 1. Custom Image Sizes

```typescript
await storageService.uploadImage(file, {
  sizes: [
    { width: 200, height: 200, suffix: "thumb" },
    { width: 800, height: 800, suffix: "display" },
    { width: 2000, height: 2000, suffix: "original" },
  ],
});
```

### 2. Quality Control

```typescript
await storageService.uploadImage(file, {
  quality: 90, // Higher quality for display images
});
```

### 3. File Metadata Retrieval

```typescript
const metadata = await storageService.getFileMetadata(fileName);
```

### 4. File Existence Check

```typescript
const exists = await storageService.fileExists(fileName);
```

### 5. Custom Logging

```typescript
const storageService = new GoogleCloudStorageService(
  {
    projectId: process.env.GCP_PROJECT_ID!,
    keyFilename: process.env.GCP_KEY_FILE!,
    bucketName: process.env.GCS_BUCKET_NAME!,
  },
  {
    log: (msg, data) => console.log(`🟢 ${msg}`, data),
    warn: (msg, data) => console.warn(`🟡 ${msg}`, data),
    error: (msg, data) => console.error(`🔴 ${msg}`, data),
  },
);
```

## Breaking Changes

| Old API                          | New API                                     | Migration                                |
| -------------------------------- | ------------------------------------------- | ---------------------------------------- |
| `uploadToGoogle(files, options)` | `storageService.uploadImage(file, options)` | Update method names and pass single file |
| `uploadGoogleFromClient()`       | `storageService.uploadBase64Image()`        | Update parameter order                   |
| Direct function import           | Service instance                            | Initialize service first                 |
| No type safety                   | Full TypeScript types                       | Add type annotations                     |

## Troubleshooting

### Issue: "Cannot find module '@/service/storage'"

**Solution:** Ensure the new storage service files are in place:

- `/service/storage/google-cloud-storage.ts`
- `/service/storage/types.ts`
- `/service/storage/utils.ts`
- `/service/storage/index.ts`

### Issue: "environment variable is not set"

**Solution:** Ensure your `.env.local` or `.env` file has:

```env
GCP_PROJECT_ID=your-project-id
GCP_KEY_FILE=path/to/key.json
GCS_BUCKET_NAME=bucket-name
```

### Issue: Type errors in TypeScript

**Solution:** Make sure imports use the correct types:

```typescript
import type { UploadedImageData, UploadOptions } from "@/service/storage";
```

## Testing Migration

After migration, test the following scenarios:

1. **Single image upload**

   ```typescript
   const result = await storageService.uploadImage(file);
   expect(result[0].mediaLink).toBeDefined();
   ```

2. **Multiple images upload**

   ```typescript
   const results = await storageService.uploadMultipleImages(files);
   expect(results.length).toBe(files.length);
   ```

3. **Base64 upload**

   ```typescript
   const result = await storageService.uploadBase64Image(base64Data, name);
   expect(result.mediaLink).toBeDefined();
   ```

4. **File deletion**
   ```typescript
   await storageService.deleteFile(fileData);
   // Verify file is deleted
   ```

## Performance Improvements

The new service offers better performance:

- **Parallel uploads**: `uploadMultipleImages()` handles multiple files efficiently
- **Configurable quality**: Lower quality settings reduce file sizes
- **Batch deletion**: Delete multiple files in one operation
- **Smart caching**: Reusable service instance

## Next Steps

1. ✅ Replace imports in all files
2. ✅ Initialize service at app startup or lazily
3. ✅ Update API routes to use new service
4. ✅ Test all upload/delete operations
5. ✅ Update error handling as needed
6. ✅ Deploy and monitor

## Additional Resources

- [Service README](./README.md)
- [Examples](./examples.ts)
- [Type Definitions](./types.ts)
- [Utility Functions](./utils.ts)

## Questions or Issues?

Refer to the comprehensive documentation in the service folder or check the examples for specific use cases.
