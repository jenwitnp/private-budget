import type { NextApiRequest, NextApiResponse } from "next";
import { Storage } from "@google-cloud/storage";
import { getStorageOptions, validateGCPConfig } from "@/lib/gcp/credentials";

interface DeleteImageResponse {
  success: boolean;
  message?: string;
  error?: string;
}

/**
 * Initialize Google Cloud Storage
 * Supports both local development (file path) and production (base64 credentials)
 */
function initializeGCS() {
  const storageOptions = getStorageOptions();

  if (!storageOptions) {
    console.warn("[GCS] Failed to get storage options");
    return null;
  }

  try {
    console.log("[GCS] Initializing with:", {
      projectId: storageOptions.projectId,
      hasCredentials: !!storageOptions.credentials,
    });

    return new Storage(storageOptions);
  } catch (error) {
    console.error(
      "[GCS] Failed to initialize:",
      error instanceof Error ? error.message : "Unknown error",
    );
    return null;
  }
}

/**
 * Delete file from GCP Storage bucket
 */
async function deleteFromGCS(
  filename: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const storage = initializeGCS();
    if (!storage) {
      throw new Error("GCS not configured");
    }

    const bucketName = process.env.GCS_BUCKET_NAME;
    if (!bucketName) {
      throw new Error("GCS_BUCKET_NAME not set");
    }

    const bucket = storage.bucket(bucketName);
    const file = bucket.file(`withdrawal-images/${filename}`);

    // Check if file exists before deleting
    const [exists] = await file.exists();
    if (!exists) {
      console.log(`[GCS] File not found: ${filename}`);
      return { success: true }; // Treat as success even if file doesn't exist
    }

    // Delete the file
    await file.delete();
    console.log(`[GCS] Deleted: ${filename}`);

    return { success: true };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("[GCS] Delete error:", errorMessage);
    return { success: false, error: errorMessage };
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<DeleteImageResponse>,
) {
  if (req.method !== "DELETE") {
    return res
      .status(405)
      .json({ success: false, error: "Method not allowed" });
  }

  // Validate GCP configuration
  const gcpConfig = validateGCPConfig();
  if (!gcpConfig.valid) {
    console.error("[GCS] Configuration errors:", gcpConfig.errors);
    return res.status(500).json({
      success: false,
      error: "Server misconfiguration: " + gcpConfig.errors.join(", "),
    });
  }

  try {
    const { filename } = req.body;

    if (!filename || typeof filename !== "string") {
      return res
        .status(400)
        .json({ success: false, error: "Missing or invalid filename" });
    }

    console.log(`[API] Deleting from GCS: ${filename}`);

    const gcsResult = await deleteFromGCS(filename);

    if (!gcsResult.success) {
      console.error("[API] GCS deletion error:", gcsResult.error);
      return res.status(500).json({
        success: false,
        error: gcsResult.error || "Failed to delete from GCS",
      });
    }

    console.log(`✅ [API] Image deleted successfully: ${filename}`);

    return res.status(200).json({
      success: true,
      message: "Image deleted successfully",
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("[API] Delete error:", errorMessage);
    return res.status(500).json({
      success: false,
      error: errorMessage,
    });
  }
}
