/**
 * Integration Example: Vehicle Image Upload
 * Shows how to integrate the storage service with the existing vehicle module
 */

import { createStorageService } from "@/service/storage";
import type { UploadedImageData } from "@/service/storage";

/**
 * Upload vehicle images and return the URLs
 * This function would be called from your vehicle actions
 */
export async function uploadVehicleImagesAndGetUrls(files: File[]): Promise<{
  success: boolean;
  imageUrls?: string[];
  thumbnailUrls?: string[];
  error?: string;
}> {
  if (!files || files.length === 0) {
    return { success: false, error: "No files provided" };
  }

  try {
    const storageService = createStorageService();

    // Upload all files
    const uploadResults = await storageService.uploadMultipleImages(files, {
      folder: "vehicles",
      thumbnail: true,
      quality: 85,
      sizes: [
        { width: 350, height: 350, suffix: "thumbnail" },
        { width: 2048, height: 2048, suffix: "" },
      ],
    });

    // Extract URLs from results
    const imageUrls: string[] = [];
    const thumbnailUrls: string[] = [];

    uploadResults.forEach((imageSet) => {
      imageSet.forEach((image) => {
        if (image.size > 1000000) {
          // Larger file = full size
          imageUrls.push(image.mediaLink);
        } else {
          // Smaller file = thumbnail
          thumbnailUrls.push(image.mediaLink);
        }
      });
    });

    return {
      success: true,
      imageUrls,
      thumbnailUrls,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("Vehicle image upload failed:", errorMessage);
    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Delete vehicle images
 * Call this when updating or deleting a vehicle
 */
export async function deleteVehicleImages(
  imageUrls: string[],
): Promise<{ success: boolean; deleted: number; failed: number }> {
  if (!imageUrls || imageUrls.length === 0) {
    return { success: true, deleted: 0, failed: 0 };
  }

  const storageService = createStorageService();
  let deletedCount = 0;
  let failedCount = 0;

  for (const url of imageUrls) {
    try {
      // Extract filename from URL
      const fileName = extractFileNameFromUrl(url);
      if (!fileName) {
        failedCount++;
        continue;
      }

      await storageService.deleteFile({
        fileName,
        bucket: process.env.GCS_BUCKET_NAME!,
      });
      deletedCount++;
    } catch (error) {
      console.error(`Failed to delete image: ${url}`, error);
      failedCount++;
    }
  }

  return {
    success: failedCount === 0,
    deleted: deletedCount,
    failed: failedCount,
  };
}

/**
 * Replace vehicle images (delete old, upload new)
 * Use this when updating vehicle images
 */
export async function replaceVehicleImages(
  oldImageUrls: string[],
  newFiles: File[],
): Promise<{
  success: boolean;
  imageUrls?: string[];
  error?: string;
}> {
  try {
    // Upload new images first
    const uploadResult = await uploadVehicleImagesAndGetUrls(newFiles);
    if (!uploadResult.success) {
      return uploadResult;
    }

    // Delete old images (don't block on failures)
    if (oldImageUrls.length > 0) {
      await deleteVehicleImages(oldImageUrls).catch((error) => {
        console.warn("Failed to delete old images:", error);
      });
    }

    return {
      success: true,
      imageUrls: uploadResult.imageUrls,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Update vehicle image order
 * Re-upload images in specified order
 */
export async function reorderVehicleImages(
  orderedImageUrls: string[],
): Promise<{ success: boolean; error?: string }> {
  // This would typically involve updating the database
  // The storage service doesn't need to be called for reordering
  // as files are already in cloud storage
  return {
    success: true,
  };
}

/**
 * Get vehicle image metadata
 */
export async function getVehicleImageMetadata(
  imageUrl: string,
): Promise<{ success: boolean; metadata?: any; error?: string }> {
  try {
    const storageService = createStorageService();
    const fileName = extractFileNameFromUrl(imageUrl);

    if (!fileName) {
      return {
        success: false,
        error: "Invalid image URL",
      };
    }

    const metadata = await storageService.getFileMetadata(fileName);
    return {
      success: true,
      metadata,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Extract filename from Google Cloud Storage URL
 * Handles URLs like: https://storage.googleapis.com/bucket-name/path/to/file.jpg
 */
function extractFileNameFromUrl(url: string): string | null {
  try {
    // Parse the URL
    const urlObj = new URL(url);
    // Get pathname and remove leading slash
    const pathname = urlObj.pathname.replace(/^\/[^\/]+\//, "");
    return pathname || null;
  } catch {
    return null;
  }
}

/**
 * Example: Server Action for Next.js
 * Use this in your vehicle-actions.ts
 */
export async function uploadVehicleImagesServerAction(
  formData: FormData,
): Promise<{ success: boolean; imageUrls?: string[]; error?: string }> {
  try {
    const files = formData.getAll("images") as File[];
    return uploadVehicleImagesAndGetUrls(files);
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Upload failed",
    };
  }
}

/**
 * Example: Integration with existing vehicle service
 * Shows how to integrate with mapVehicleDataForInsert
 */
export async function createVehicleWithImages(
  vehicleData: any,
  imageFiles: File[],
) {
  // Upload images first
  const uploadResult = await uploadVehicleImagesAndGetUrls(imageFiles);
  if (!uploadResult.success) {
    throw new Error(uploadResult.error || "Image upload failed");
  }

  // Prepare vehicle data with image URLs
  const vehicleWithImages = {
    ...vehicleData,
    primary_image_url: uploadResult.imageUrls?.[0],
    thumbnail_url: uploadResult.thumbnailUrls?.[0],
    image_count: uploadResult.imageUrls?.length || 0,
  };

  // Save to database
  // return await saveVehicle(vehicleWithImages);
}

/**
 * Example API Route Handler
 * Use in app/api/vehicles/upload/route.ts
 */
export async function handleVehicleImageUploadRequest(
  formData: FormData,
): Promise<Response> {
  try {
    const files = formData.getAll("images") as File[];

    if (files.length === 0) {
      return new Response(JSON.stringify({ error: "No files provided" }), {
        status: 400,
      });
    }

    // Validate file types
    const validMimeTypes = ["image/jpeg", "image/png", "image/webp"];
    for (const file of files) {
      if (!validMimeTypes.includes(file.type)) {
        return new Response(
          JSON.stringify({
            error: `Invalid file type: ${file.name}`,
          }),
          { status: 400 },
        );
      }
    }

    // Validate file sizes (max 10MB each)
    const maxSize = 10 * 1024 * 1024;
    for (const file of files) {
      if (file.size > maxSize) {
        return new Response(
          JSON.stringify({
            error: `File too large: ${file.name}`,
          }),
          { status: 400 },
        );
      }
    }

    // Upload images
    const result = await uploadVehicleImagesAndGetUrls(files);

    if (!result.success) {
      return new Response(JSON.stringify({ error: result.error }), {
        status: 500,
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          imageUrls: result.imageUrls,
          thumbnailUrls: result.thumbnailUrls,
          count: result.imageUrls?.length || 0,
        },
      }),
      { status: 200 },
    );
  } catch (error) {
    console.error("Upload handler error:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
      }),
      { status: 500 },
    );
  }
}

export default {
  uploadVehicleImagesAndGetUrls,
  deleteVehicleImages,
  replaceVehicleImages,
  reorderVehicleImages,
  getVehicleImageMetadata,
  uploadVehicleImagesServerAction,
  createVehicleWithImages,
};
