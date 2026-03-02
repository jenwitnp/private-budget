# Storage Service - Complete Overview

## 📁 File Structure

```
service/storage/
├── google-cloud-storage.ts      # Main service class
├── types.ts                      # TypeScript type definitions
├── utils.ts                      # Utility functions
├── index.ts                      # Public exports
├── examples.ts                   # Usage examples (9 scenarios)
├── vehicle-integration.ts        # Vehicle-specific integration
├── README.md                     # Comprehensive documentation
├── SETUP.md                      # Installation & setup guide
├── MIGRATION.md                  # Migration from old code
└── (this file) INDEX.md          # Overview & quick reference
```

## 🚀 Quick Start (5 Minutes)

### 1. Install Dependencies

```bash
npm install @google-cloud/storage sharp uuid
```

### 2. Set Environment Variables

```env
GCP_PROJECT_ID=your-project-id
GCP_KEY_FILE=./google-cloud-key.json
GCS_BUCKET_NAME=your-bucket-name
```

### 3. Basic Usage

```typescript
import { createStorageService } from "@/service/storage";

// Initialize
const storage = createStorageService();

// Upload image
const result = await storage.uploadImage(file, {
  folder: "vehicles",
  thumbnail: true,
});

console.log(result[0].mediaLink); // Get public URL
```

## 📚 Documentation Files

### README.md

**Complete feature documentation**

- Features overview
- Installation instructions
- Quick start examples
- Advanced usage
- Next.js integration examples
- TypeScript type references
- Performance tips

→ Start here for: Learning all features, integration patterns, examples

### SETUP.md

**Installation and configuration guide**

- Step-by-step dependency installation
- Google Cloud setup (Service Account, Bucket)
- Environment variable configuration
- Verification testing
- Troubleshooting common issues
- Security best practices

→ Start here for: Initial setup, troubleshooting, security

### MIGRATION.md

**Migration from old googleCloud.js**

- Overview of changes
- Step-by-step migration guide
- API comparison (old vs new)
- Complete migration examples
- New features available
- Breaking changes documentation

→ Start here for: Migrating from old code, understanding improvements

### examples.ts

**9 real-world usage scenarios**

1. Basic initialization
2. Single file uploads (vehicles, products, profiles)
3. Batch operations
4. Base64 uploads
5. Deletion operations
6. Utility functions
7. Error handling patterns
8. Next.js API route examples
9. Integration patterns

→ Start here for: Copy-paste ready code examples

### vehicle-integration.ts

**Vehicle feature specific integration**

- Upload vehicle images
- Delete vehicle images
- Replace images (old + new)
- Reorder images
- Get image metadata
- Server actions
- API route handlers

→ Start here for: Vehicle module integration

## 🔧 Main Components

### GoogleCloudStorageService Class

**Constructor**

```typescript
new GoogleCloudStorageService(config, logger?)
```

**Main Methods**

- `uploadImage(file, options)` - Upload and resize single image
- `uploadMultipleImages(files, options)` - Upload multiple images
- `uploadBase64Image(data, fileName, mimeType, folder)` - Upload base64
- `deleteFile(fileData)` - Delete single file
- `deleteMultipleFiles(filesData)` - Delete multiple files
- `getFileMetadata(fileName)` - Get file info
- `fileExists(fileName)` - Check if file exists
- `initialize()` - Initialize bucket

### Utility Functions

- `getMimeTypeFromBase64()` - Extract MIME type from base64
- `base64ToBuffer()` - Convert base64 to buffer
- `generateUniqueFilename()` - Generate unique filenames
- `validateConfig()` - Validate configuration
- `getDefaultImageSizes()` - Get default image dimensions

### Types

All TypeScript interfaces:

- `UploadOptions` - Upload configuration
- `UploadedImageData` - Upload response data
- `FileDataForDeletion` - Deletion payload
- `GCSConfig` - Service configuration
- `Logger` - Custom logger interface
- `ImageSize` - Image dimension config

## 📊 Feature Comparison

| Feature              | Old JS | New TS   | Notes                      |
| -------------------- | ------ | -------- | -------------------------- |
| Image Upload         | ✅     | ✅       | Better error handling      |
| Resizing             | ✅     | ✅       | Custom sizes now supported |
| Base64 Upload        | ✅     | ✅       | Improved API               |
| File Deletion        | ✅     | ✅       | Better error handling      |
| Batch Upload         | ❌     | ✅       | **NEW**                    |
| Batch Delete         | ❌     | ✅       | **NEW**                    |
| Type Safety          | ❌     | ✅       | **NEW**                    |
| Metadata Query       | ❌     | ✅       | **NEW**                    |
| File Existence Check | ❌     | ✅       | **NEW**                    |
| Custom Logger        | ❌     | ✅       | **NEW**                    |
| Quality Control      | ❌     | ✅       | **NEW**                    |
| Error Logging        | Basic  | Advanced | **NEW**                    |

## 🎯 Use Cases

### Vehicle Management System

```typescript
// In vehicle-integration.ts
uploadVehicleImagesAndGetUrls(files);
deleteVehicleImages(urls);
replaceVehicleImages(oldUrls, newFiles);
```

### Product Catalog

```typescript
uploadProductImage(file); // From examples.ts
```

### User Profiles

```typescript
uploadProfilePicture(file); // From examples.ts
```

### Gallery Management

```typescript
uploadGalleryImages(files); // From examples.ts
```

## 🔐 Security Features

- ✅ Environment variable based configuration
- ✅ No hardcoded credentials
- ✅ Service account key isolation
- ✅ Error handling without exposing sensitive data
- ✅ Public URL generation with proper bucket access
- ✅ Optional signed URLs support
- ✅ Input validation (MIME types, file sizes)

## 📈 Performance Features

- ✅ Batch upload operations
- ✅ Batch delete operations
- ✅ Configurable image quality
- ✅ Automatic image resizing (reduces file size)
- ✅ Stream-based uploads (efficient memory usage)
- ✅ Parallel image processing with sharp
- ✅ Reusable service instance

## 🧪 Testing Support

The service is designed for easy testing:

```typescript
// Custom logger for testing
const mockLogger = {
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

const service = new GoogleCloudStorageService(config, mockLogger);
```

## 🚀 Deployment Considerations

### Environment Variables

Set these in your deployment platform:

- Heroku: Config vars
- Vercel: Environment variables
- Firebase: Cloud Functions env vars
- Docker: ENV in Dockerfile

### Key File Management

Options:

1. Store JSON key in environment variable (base64 encoded)
2. Mount as secret volume (Kubernetes)
3. Use Cloud Functions default service account
4. Use Workload Identity (GKE)

## 📱 Next.js Integration

### Pages Router

```typescript
// pages/api/upload.ts
import { createStorageService } from "@/service/storage";

export default async function handler(req, res) {
  const storage = createStorageService();
  // ...
}
```

### App Router

```typescript
// app/api/upload/route.ts
import { createStorageService } from "@/service/storage";

export async function POST(request) {
  const storage = createStorageService();
  // ...
}
```

### Server Actions

```typescript
// action.ts
import { createStorageService } from "@/service/storage";

export async function uploadAction(formData: FormData) {
  const storage = createStorageService();
  // ...
}
```

## 💡 Best Practices

1. **Reuse Service Instance**
   - Don't create new instance for every request
   - Use dependency injection or singleton pattern

2. **Error Handling**
   - Always wrap in try-catch
   - Log errors for debugging
   - Return user-friendly messages

3. **Batch Operations**
   - Use `uploadMultipleImages()` for multiple files
   - Use `deleteMultipleFiles()` for batch deletion

4. **Quality Control**
   - Use quality: 90 for display images
   - Use quality: 60-70 for thumbnails
   - Adjust based on your use case

5. **Folder Organization**
   - Use folder option to organize files
   - Example: `vehicles`, `products`, `users`

6. **File Naming**
   - Files automatically get unique names
   - Includes UUID + timestamp for uniqueness

## 📞 Support Resources

1. **Setup Issues** → See SETUP.md
2. **Migration Questions** → See MIGRATION.md
3. **Usage Examples** → See examples.ts
4. **Vehicle Integration** → See vehicle-integration.ts
5. **API Reference** → See README.md

## ✅ Checklist for Integration

- [ ] Install dependencies
- [ ] Create Google Cloud Service Account
- [ ] Create GCS Bucket
- [ ] Set environment variables
- [ ] Run setup test (test-storage.ts)
- [ ] Import service in your code
- [ ] Update API routes
- [ ] Test uploads and deletions
- [ ] Deploy with environment variables
- [ ] Monitor logs for errors

## 🔄 Version History

### v1.0.0 (Current)

- TypeScript conversion from googleCloud.js
- Added batch operations
- Added custom logging
- Added quality control
- Full TypeScript support
- Comprehensive documentation

## 📝 License

Part of Cars Dealers Tenant project.

---

**Need Help?** Check the relevant documentation file:

- 🚀 Getting started → README.md
- 🔧 Setup issues → SETUP.md
- 🔄 Migrating from old code → MIGRATION.md
- 💻 Code examples → examples.ts
- 🚗 Vehicle integration → vehicle-integration.ts
