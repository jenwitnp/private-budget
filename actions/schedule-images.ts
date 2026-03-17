"use server";

/**
 * Server actions for schedule image handling
 * Manages image upload and storage for schedules with optional transaction linkage
 */

import { supabase } from "@/lib/supabaseClient";
import { uploadImagesToServer } from "@/lib/helpers/upload-images";
import { deleteImageFromGCS } from "@/lib/helpers/delete-image";

interface UploadScheduleImagesParams {
  scheduleId: string | number;
  transactionId?: string | null;
  userId: string;
  images: File[];
}

/**
 * Upload images for a schedule
 * Stores images with both schedule_id and transaction_id (if exists)
 * or just schedule_id (if no transaction)
 *
 * Database Schema:
 * - schedule_id: bigint (from schedule.id)
 * - transaction_id: uuid | null (from transactions.id)
 * - Files: stored via API, metadata stored in DB
 */
export async function uploadScheduleImagesAction(
  params: UploadScheduleImagesParams,
): Promise<{
  success: boolean;
  message: string;
  images?: Array<{
    id: string;
    url: string;
    filename: string;
    created_at: string;
  }>;
  error?: string;
}> {
  try {
    const { scheduleId, transactionId, userId, images } = params;

    // Validate inputs
    if (!scheduleId) {
      throw new Error("Schedule ID is required");
    }

    if (!userId) {
      throw new Error("User ID is required");
    }

    if (!images || images.length === 0) {
      throw new Error("At least one image is required");
    }

    if (images.length > 5) {
      throw new Error("Maximum 5 images allowed");
    }

    // Convert scheduleId to number (schedule.id is bigserial)
    let scheduleIdNum: number;
    try {
      scheduleIdNum =
        typeof scheduleId === "string" ? parseInt(scheduleId, 10) : scheduleId;

      if (isNaN(scheduleIdNum)) {
        throw new Error("Invalid schedule ID format");
      }
    } catch (e) {
      throw new Error("Schedule ID must be a valid number");
    }

    // Step 1: Upload images via API helper
    console.log(
      `[uploadScheduleImagesAction] STEP 1: Uploading ${images.length} images via API...`,
    );
    const processedImages = await uploadImagesToServer(images);
    console.log(`[uploadScheduleImagesAction] STEP 1 RESULT:`, {
      count: processedImages.length,
      hasUrls: processedImages.every((img) => img.url),
      firstUrl: processedImages[0]?.url ? "✅ Present" : "❌ Missing",
    });

    if (!processedImages || processedImages.length === 0) {
      console.error(
        "[uploadScheduleImagesAction] ❌ No processed images returned from upload",
      );
      throw new Error("Image upload failed - no images returned from API");
    }

    // Step 2: Prepare image records for database
    // Note: transaction_id can be NULL (after migration)
    console.log(
      `[uploadScheduleImagesAction] STEP 2: Preparing ${processedImages.length} image records for database...`,
    );
    const imageRecords = processedImages.map((img) => {
      const record = {
        schedule_id: scheduleIdNum,
        transaction_id: transactionId || null, // Store transaction_id only if exists
        url: img.url || null,
        cloud_url: img.url || null,
        filename: img.filename,
        file_size: img.size,
        mime_type: "image/jpeg",
        width: img.width,
        height: img.height,
        storage_path: img.url ? `schedule-images/${img.filename}` : null,
        uploaded_by: userId,
        upload_status: "completed",
      };
      if (!record.url) {
        console.warn(
          `[uploadScheduleImagesAction] ⚠️  Image ${img.filename} has no URL!`,
        );
      }
      return record;
    });
    console.log(
      "[uploadScheduleImagesAction] STEP 2 RESULT:",
      imageRecords.length,
      "records prepared",
    );

    // Step 3: Insert images into database
    console.log(
      "[uploadScheduleImagesAction] STEP 3: Inserting",
      imageRecords.length,
      "records into database...",
    );
    const { data: insertedImages, error: insertError } = await (supabase as any)
      .from("images")
      .insert(imageRecords as any[])
      .select("id, url, filename, created_at");

    if (insertError) {
      console.error(
        "[uploadScheduleImagesAction] ❌ Database insert error:",
        insertError,
      );
      throw new Error(`Database insert failed: ${insertError.message}`);
    }

    if (!insertedImages || insertedImages.length === 0) {
      console.error(
        "[uploadScheduleImagesAction] ❌ Database insert returned no images",
      );
      throw new Error(
        "Failed to save images to database - no records returned",
      );
    }

    console.log(
      "[uploadScheduleImagesAction] STEP 3 RESULT: ✅",
      insertedImages.length,
      "images saved to database",
    );
    insertedImages.forEach((img: any, idx: number) => {
      console.log(
        `  [${idx + 1}] ID: ${img.id}, URL: ${img.url ? "✅ Stored" : "❌ NULL"}`,
      );
    });

    return {
      success: true,
      message: `Successfully uploaded ${insertedImages.length} image(s)`,
      images: insertedImages,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";

    return {
      success: false,
      message: "Image upload failed",
      error: errorMessage,
    };
  }
}

/**
 * Fetch schedule images
 * @param scheduleId - Schedule ID (string or number)
 */
export async function fetchScheduleImagesAction(
  scheduleId: string | number,
): Promise<{
  success: boolean;
  images?: Array<{
    id: string;
    url: string;
    filename: string;
    created_at: string;
    uploader_first_name: string | null;
    uploader_last_name: string | null;
  }>;
  error?: string;
}> {
  try {
    if (!scheduleId) {
      throw new Error("Schedule ID is required");
    }

    // Convert scheduleId to number (schedule.id is bigserial)
    let scheduleIdNum: number;
    try {
      scheduleIdNum =
        typeof scheduleId === "string" ? parseInt(scheduleId, 10) : scheduleId;

      if (isNaN(scheduleIdNum)) {
        throw new Error("Invalid schedule ID format");
      }
    } catch (e) {
      throw new Error("Schedule ID must be a valid number");
    }

    const { data: images, error: fetchError } = await (supabase as any)
      .from("images")
      .select(
        `
          id,
          url,
          filename,
          created_at,
          uploaded_by,
          users!inner(first_name, last_name)
        `,
      )
      .eq("schedule_id", scheduleIdNum)
      .order("created_at", { ascending: false });

    if (fetchError) {
      throw new Error(`Fetch failed: ${fetchError.message}`);
    }

    // Transform response to flatten user data
    const transformedImages = (images || []).map(
      (img: {
        id: string;
        url: string;
        filename: string;
        created_at: string;
        users: { first_name: string | null; last_name: string | null };
      }) => ({
        id: img.id,
        url: img.url,
        filename: img.filename,
        created_at: img.created_at,
        uploader_first_name: img.users?.first_name || null,
        uploader_last_name: img.users?.last_name || null,
      }),
    );

    return {
      success: true,
      images: transformedImages,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";

    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Delete schedule image from database and GCP bucket (via API)
 * @param imageId - Image ID to delete from database
 */
export async function deleteScheduleImageAction(imageId: string): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    if (!imageId) {
      throw new Error("Image ID is required");
    }

    // Step 1: Fetch image record to get filename
    const { data: imageRecord, error: fetchError } = await (supabase as any)
      .from("images")
      .select("filename")
      .eq("id", imageId)
      .single();

    if (fetchError || !imageRecord) {
      throw new Error(
        `Failed to fetch image: ${fetchError?.message || "Image not found"}`,
      );
    }

    const filename = imageRecord.filename;

    // Step 2: Delete from GCS bucket via API endpoint
    await deleteImageFromGCS(filename);

    // Step 3: Delete from database
    const { error: deleteError } = await (supabase as any)
      .from("images")
      .delete()
      .eq("id", imageId);

    if (deleteError) {
      throw new Error(`Database delete failed: ${deleteError.message}`);
    }

    console.log(`✅ [DB] Image record deleted: ${imageId}`);

    return {
      success: true,
      message: "Image deleted successfully",
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";

    console.error(`❌ [Delete] Error deleting image: ${errorMessage}`);

    return {
      success: false,
      message: errorMessage,
    };
  }
}
