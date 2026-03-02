/**
 * Example Usage of Google Cloud Storage Service
 * This file demonstrates how to use the service in various scenarios
 */

import { GoogleCloudStorageService, createStorageService } from "./index";
import type { UploadOptions, UploadedImageData } from "./types";

// ============================================================================
// 1. BASIC INITIALIZATION
// ============================================================================

/**
 * Using environment variables (recommended)
 */
export async function initializeStorageService() {
  const storageService = createStorageService();
  await storageService.initialize();
  return storageService;
}

/**
 * Using custom configuration
 */
export function initializeWithCustomConfig() {
  const storageService = new GoogleCloudStorageService({
    projectId: "my-project-id",
    keyFilename: "/path/to/service-account-key.json",
    bucketName: "my-bucket",
  });
  return storageService;
}

// ============================================================================
// 2. SINGLE FILE UPLOAD
// ============================================================================

/**
 * Upload a single vehicle image
 */
export async function uploadVehicleImage(
  file: File,
): Promise<UploadedImageData[]> {
  const storageService = createStorageService();

  return storageService.uploadImage(file, {
    folder: "vehicles",
    thumbnail: true,
    quality: 85,
  });
}

/**
 * Upload a product image with custom sizes
 */
export async function uploadProductImage(
  file: File,
): Promise<UploadedImageData[]> {
  const storageService = createStorageService();

  return storageService.uploadImage(file, {
    folder: "products",
    sizes: [
      { width: 200, height: 200, suffix: "thumbnail" },
      { width: 600, height: 600, suffix: "medium" },
      { width: 1200, height: 1200, suffix: "large" },
    ],
    quality: 90,
  });
}

/**
 * Upload user profile picture
 */
export async function uploadProfilePicture(
  file: File,
): Promise<UploadedImageData[]> {
  const storageService = createStorageService();

  return storageService.uploadImage(file, {
    folder: "profiles",
    thumbnail: true,
    quality: 80,
  });
}

// ============================================================================
// 3. BATCH OPERATIONS
// ============================================================================

/**
 * Upload multiple vehicle images at once
 */
export async function uploadVehicleImages(
  files: File[],
): Promise<UploadedImageData[][]> {
  const storageService = createStorageService();

  return storageService.uploadMultipleImages(files, {
    folder: "vehicles",
    thumbnail: true,
    quality: 85,
  });
}

/**
 * Upload multiple gallery images
 */
export async function uploadGalleryImages(
  files: File[],
): Promise<UploadedImageData[][]> {
  const storageService = createStorageService();

  return storageService.uploadMultipleImages(files, {
    folder: "gallery",
    sizes: [
      { width: 300, height: 300, suffix: "thumbnail" },
      { width: 800, height: 800, suffix: "display" },
      { width: 2000, height: 2000, suffix: "original" },
    ],
    quality: 85,
  });
}

// ============================================================================
// 4. BASE64 UPLOADS
// ============================================================================

/**
 * Upload image from canvas or cropped image (base64)
 */
export async function uploadCroppedImage(
  base64Data: string,
  fileName: string,
): Promise<UploadedImageData> {
  const storageService = createStorageService();

  return storageService.uploadBase64Image(
    base64Data,
    fileName,
    "image/jpeg",
    "edited-images",
  );
}

/**
 * Upload watermarked image
 */
export async function uploadWatermarkedImage(
  base64Data: string,
): Promise<UploadedImageData> {
  const storageService = createStorageService();
  const timestamp = Date.now();

  return storageService.uploadBase64Image(
    base64Data,
    `watermarked-${timestamp}.jpg`,
    "image/jpeg",
    "watermarked",
  );
}

// ============================================================================
// 5. DELETION OPERATIONS
// ============================================================================

/**
 * Delete a single vehicle image
 */
export async function deleteVehicleImage(fileData: {
  fileName: string;
  bucket: string;
}): Promise<void> {
  const storageService = createStorageService();
  await storageService.deleteFile(fileData);
}

/**
 * Delete multiple images from a vehicle
 */
export async function deleteVehicleImages(
  fileDataList: Array<{ fileName: string; bucket: string }>,
): Promise<void> {
  const storageService = createStorageService();
  await storageService.deleteMultipleFiles(fileDataList);
}

/**
 * Delete images and handle failures gracefully
 */
export async function deleteImagesWithFallback(
  fileDataList: Array<{ fileName: string; bucket: string }>,
): Promise<{ success: number; failed: number }> {
  const storageService = createStorageService();

  let successCount = 0;
  let failureCount = 0;

  for (const fileData of fileDataList) {
    try {
      await storageService.deleteFile(fileData);
      successCount++;
    } catch (error) {
      console.error(`Failed to delete ${fileData.fileName}:`, error);
      failureCount++;
    }
  }

  return { success: successCount, failed: failureCount };
}

// ============================================================================
// 6. UTILITY FUNCTIONS
// ============================================================================

/**
 * Extract public URL from uploaded image data
 */
export function getPublicImageUrl(imageData: UploadedImageData): string {
  return imageData.mediaLink;
}

/**
 * Check if file exists before deletion
 */
export async function checkAndDeleteFile(
  fileName: string,
  bucket: string,
): Promise<boolean> {
  const storageService = createStorageService();

  const exists = await storageService.fileExists(fileName);
  if (exists) {
    await storageService.deleteFile({ fileName, bucket });
    return true;
  }
  return false;
}

/**
 * Get file metadata
 */
export async function getFileInfo(
  fileName: string,
): Promise<Record<string, unknown>> {
  const storageService = createStorageService();
  return storageService.getFileMetadata(fileName);
}

/**
 * Get image dimensions from uploaded data
 */
export function getImageDimensions(imageData: UploadedImageData) {
  return {
    width: imageData.width,
    height: imageData.height,
    orientation: imageData.orientation,
  };
}

// ============================================================================
// 7. ERROR HANDLING EXAMPLES
// ============================================================================

/**
 * Upload with comprehensive error handling
 */
export async function uploadWithErrorHandling(
  file: File,
): Promise<{ success: boolean; data?: UploadedImageData[]; error?: string }> {
  try {
    // Validate file
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return {
        success: false,
        error: `File size exceeds ${maxSize / 1024 / 1024}MB limit`,
      };
    }

    const validMimeTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!validMimeTypes.includes(file.type)) {
      return {
        success: false,
        error: "Invalid file type. Only JPEG, PNG, and WebP are allowed",
      };
    }

    // Upload
    const storageService = createStorageService();
    const data = await storageService.uploadImage(file, {
      folder: "uploads",
      thumbnail: true,
    });

    return { success: true, data };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    console.error("Upload error:", errorMessage);
    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Delete with retry logic
 */
export async function deleteFileWithRetry(
  fileData: { fileName: string; bucket: string },
  maxRetries: number = 3,
): Promise<boolean> {
  const storageService = createStorageService();

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await storageService.deleteFile(fileData);
      return true;
    } catch (error) {
      if (attempt === maxRetries) {
        console.error(
          `Failed to delete file after ${maxRetries} attempts:`,
          error,
        );
        return false;
      }
      // Wait before retrying
      await new Promise((resolve) =>
        setTimeout(resolve, Math.pow(2, attempt) * 1000),
      );
    }
  }

  return false;
}

// ============================================================================
// 8. NEXT.JS API ROUTE EXAMPLES
// ============================================================================

/**
 * Example API route for Next.js (app/api/upload/route.ts)
 */
export async function exampleNextJsApiRoute() {
  // This is pseudo-code showing how to use in an API route
  /*
  import { NextRequest, NextResponse } from 'next/server';
  import { createStorageService } from '@/service/storage';

  export async function POST(request: NextRequest) {
    try {
      const formData = await request.formData();
      const file = formData.get('file') as File;

      if (!file) {
        return NextResponse.json(
          { error: 'No file provided' },
          { status: 400 }
        );
      }

      const storageService = createStorageService();
      const uploadedImages = await storageService.uploadImage(file, {
        folder: 'vehicles',
        thumbnail: true,
      });

      return NextResponse.json({
        success: true,
        data: uploadedImages,
      });
    } catch (error) {
      return NextResponse.json(
        { success: false, error: 'Upload failed' },
        { status: 500 }
      );
    }
  }
  */
}

// ============================================================================
// 9. INTEGRATION PATTERNS
// ============================================================================

/**
 * Pattern: Upload and save URL to database
 */
export async function uploadAndSaveToDatabase(
  file: File,
  saveToDb: (url: string) => Promise<void>,
): Promise<boolean> {
  try {
    const uploadedImages = await uploadVehicleImage(file);
    if (uploadedImages.length > 0) {
      await saveToDb(uploadedImages[0].mediaLink);
      return true;
    }
    return false;
  } catch (error) {
    console.error("Upload and save failed:", error);
    return false;
  }
}

/**
 * Pattern: Upload, save, then delete old image
 */
export async function replaceImage(
  newFile: File,
  oldImageData: { fileName: string; bucket: string },
  saveToDb: (url: string) => Promise<void>,
): Promise<boolean> {
  try {
    // Upload new image
    const uploadedImages = await uploadVehicleImage(newFile);
    if (uploadedImages.length === 0) {
      throw new Error("Upload failed");
    }

    // Save new URL to database
    await saveToDb(uploadedImages[0].mediaLink);

    // Delete old image
    await deleteVehicleImage(oldImageData);

    return true;
  } catch (error) {
    console.error("Image replacement failed:", error);
    return false;
  }
}

export default {
  initializeStorageService,
  uploadVehicleImage,
  uploadProductImage,
  uploadVehicleImages,
  deleteVehicleImage,
  uploadWithErrorHandling,
  deleteFileWithRetry,
};
