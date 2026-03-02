# Google Cloud Storage Service

A TypeScript-based service for handling image uploads, resizing, and management with Google Cloud Storage. Designed for easy integration with Next.js and Node.js projects.

## Features

- ✅ **Image Upload & Resizing** - Automatic image resizing with multiple size variants
- ✅ **Base64 Support** - Upload base64 encoded images directly
- ✅ **Batch Operations** - Upload or delete multiple files at once
- ✅ **TypeScript** - Full type safety and IDE autocomplete
- ✅ **Configurable** - Easy configuration via environment variables or config objects
- ✅ **Error Handling** - Comprehensive error handling and logging
- ✅ **Public URLs** - Automatic generation of public CDN URLs
- ✅ **Metadata** - Full file metadata including dimensions and MIME types

## Installation

Ensure the following packages are installed:

```bash
npm install @google-cloud/storage sharp uuid
npm install --save-dev @types/node @types/sharp
```

## Environment Variables

Set up your `.env.local` or `.env` file:

```env
GCP_PROJECT_ID=your-gcp-project-id
GCP_KEY_FILE=path/to/your/service-account-key.json
GCS_BUCKET_NAME=your-bucket-name
```

## Quick Start

### Basic Setup

```typescript
import { createStorageService } from "@/service/storage";

// Service will use environment variables automatically
const storageService = createStorageService();
await storageService.initialize();
```

### Upload Single Image

```typescript
const formData = new FormData();
const fileInput = document.getElementById("file") as HTMLInputElement;
const file = fileInput.files?.[0];

if (file) {
  try {
    const uploadedImages = await storageService.uploadImage(file, {
      folder: "vehicles",
      thumbnail: true,
      quality: 85,
    });

    console.log("Upload successful:", uploadedImages);
    const publicUrl = uploadedImages[0].mediaLink;
  } catch (error) {
    console.error("Upload failed:", error);
  }
}
```

### Upload Multiple Images

```typescript
const formData = new FormData();
const fileInputs = document.querySelectorAll(
  'input[type="file"]',
) as NodeListOf<HTMLInputElement>;
const files: File[] = [];

fileInputs.forEach((input) => {
  if (input.files) {
    files.push(...Array.from(input.files));
  }
});

try {
  const results = await storageService.uploadMultipleImages(files, {
    folder: "products",
  });

  results.forEach((imageSet, index) => {
    console.log(`File ${index + 1}:`, imageSet);
  });
} catch (error) {
  console.error("Batch upload failed:", error);
}
```

### Upload Base64 Image

```typescript
const base64Data =
  "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAwIBAQI...";

try {
  const uploadedImage = await storageService.uploadBase64Image(
    base64Data,
    "user-avatar.jpg",
    "image/jpeg",
    "avatars",
  );

  console.log("Base64 image uploaded:", uploadedImage.mediaLink);
} catch (error) {
  console.error("Base64 upload failed:", error);
}
```

### Delete File

```typescript
try {
  await storageService.deleteFile({
    fileName: "vehicles/image-uuid-timestamp-2048-2048.jpg",
    bucket: "your-bucket-name",
  });
  console.log("File deleted successfully");
} catch (error) {
  console.error("Deletion failed:", error);
}
```

### Delete Multiple Files

```typescript
const filesToDelete = [
  {
    fileName: "vehicles/image1-uuid-timestamp-2048-2048.jpg",
    bucket: "your-bucket-name",
  },
  {
    fileName: "vehicles/image2-uuid-timestamp-2048-2048.jpg",
    bucket: "your-bucket-name",
  },
];

try {
  await storageService.deleteMultipleFiles(filesToDelete);
  console.log("All files deleted");
} catch (error) {
  console.error("Batch deletion failed:", error);
}
```

## Advanced Usage

### Custom Image Sizes

```typescript
const uploadedImages = await storageService.uploadImage(file, {
  folder: "products",
  sizes: [
    { width: 200, height: 200, suffix: "small" },
    { width: 500, height: 500, suffix: "medium" },
    { width: 1200, height: 1200, suffix: "large" },
  ],
});
```

### Custom Configuration

```typescript
import { GoogleCloudStorageService } from "@/service/storage";

const storageService = new GoogleCloudStorageService({
  projectId: "my-project",
  keyFilename: "/path/to/key.json",
  bucketName: "my-bucket",
});
```

### Custom Logger

```typescript
import { GoogleCloudStorageService } from "@/service/storage";

const customLogger = {
  log: (msg: string, data?: any) => {
    console.log(`🟢 ${msg}`, data);
  },
  warn: (msg: string, data?: any) => {
    console.warn(`🟡 ${msg}`, data);
  },
  error: (msg: string, data?: any) => {
    console.error(`🔴 ${msg}`, data);
  },
};

const storageService = new GoogleCloudStorageService(
  {
    projectId: process.env.GCP_PROJECT_ID!,
    keyFilename: process.env.GCP_KEY_FILE!,
    bucketName: process.env.GCS_BUCKET_NAME!,
  },
  customLogger,
);
```

### Check File Existence

```typescript
const exists = await storageService.fileExists("vehicles/image.jpg");
if (exists) {
  console.log("File exists");
}
```

### Get File Metadata

```typescript
const metadata = await storageService.getFileMetadata("vehicles/image.jpg");
console.log(metadata);
```

## Next.js Integration Examples

### API Route (pages/api/upload.ts)

```typescript
import type { NextApiRequest, NextApiResponse } from "next";
import { createStorageService } from "@/service/storage";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const storageService = createStorageService();

    // Handle file from form data
    const formData = await req.body; // Use next-connect or busboy for parsing
    const file = formData.file;

    const uploadedImages = await storageService.uploadImage(file, {
      folder: "products",
      thumbnail: true,
    });

    return res.status(200).json({
      success: true,
      data: uploadedImages,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return res.status(500).json({
      success: false,
      error: "Upload failed",
    });
  }
}
```

### App Router (app/api/upload/route.ts)

```typescript
import { createStorageService } from "@/service/storage";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const storageService = createStorageService();
    const uploadedImages = await storageService.uploadImage(file, {
      folder: "products",
      quality: 85,
    });

    return NextResponse.json({
      success: true,
      data: uploadedImages,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { success: false, error: "Upload failed" },
      { status: 500 },
    );
  }
}
```

### React Component Hook

```typescript
import { useState } from "react";
import { uploadImage } from "@/utils/upload-client";
import type { UploadedImageData } from "@/service/storage";

export function ImageUpload() {
  const [uploading, setUploading] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<
    UploadedImageData[]
  >([]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    setUploading(true);
    try {
      const formData = new FormData();
      Array.from(files).forEach((file) => {
        formData.append("files", file);
      });

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();
      if (result.success) {
        setUploadedImages(result.data);
      }
    } catch (error) {
      console.error("Upload failed:", error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <input
        type="file"
        multiple
        onChange={handleUpload}
        disabled={uploading}
      />
      {uploading && <p>Uploading...</p>}
      {uploadedImages.map((img) => (
        <img key={img.name} src={img.mediaLink} alt="uploaded" />
      ))}
    </div>
  );
}
```

## TypeScript Types

All types are exported from `@/service/storage`:

```typescript
// Main types
interface UploadOptions {
  folder?: string | false;
  thumbnail?: boolean;
  quality?: number; // 1-100, default 80
  sizes?: ImageSize[];
}

interface UploadedImageData {
  name: string;
  bucket: string;
  type: string;
  size: number;
  mediaLink: string;
  updated: string;
  generation: string;
  etag: string;
  md5Hash: string;
  metadata: Record<string, unknown>;
  orientation: "Horizontal" | "Vertical" | "Square";
  width: number;
  height: number;
}

interface FileDataForDeletion {
  fileName?: string;
  name?: string;
  bucket: string;
}
```

## Error Handling

The service provides detailed error messages:

```typescript
try {
  await storageService.uploadImage(file);
} catch (error) {
  if (error instanceof Error) {
    console.error(`Upload failed: ${error.message}`);
  }
}
```

## Default Configuration

**Default Image Sizes:**

- **Thumbnail**: 350x350px
- **Full Size**: 2048x2048px

**Default Quality:** 80 (JPEG quality)

## File Naming

Files are automatically named using the pattern:

```
{original-name}-{uuid}-{timestamp}-{width}-{height}.jpg
```

For example:

```
car-image-f47ac10b-58cc-4372-a567-0e02b2c3d479-1639402800000-2048-2048.jpg
```

## Performance Considerations

- **Batch Operations**: Use `uploadMultipleImages()` for better performance with multiple files
- **Quality Settings**: Lower quality (60-70) for thumbnails, higher (85-95) for full-size images
- **Folder Organization**: Use the `folder` option to organize files in bucket subfolders

## Testing

Example test setup:

```typescript
import { GoogleCloudStorageService } from "@/service/storage";

describe("GoogleCloudStorageService", () => {
  let service: GoogleCloudStorageService;

  beforeEach(() => {
    service = new GoogleCloudStorageService({
      projectId: process.env.GCP_PROJECT_ID!,
      keyFilename: process.env.GCP_KEY_FILE!,
      bucketName: process.env.GCS_BUCKET_NAME!,
    });
  });

  it("should upload an image", async () => {
    const file = new File(["content"], "test.jpg", {
      type: "image/jpeg",
    });
    const result = await service.uploadImage(file);
    expect(result).toHaveLength(1);
    expect(result[0].mediaLink).toBeDefined();
  });
});
```

## License

This service is part of the Cars Dealers Tenant project.
