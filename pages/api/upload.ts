import type { NextApiRequest, NextApiResponse } from "next";
import sharp from "sharp";
import { v4 as uuidv4 } from "uuid";
import { Storage } from "@google-cloud/storage";
import path from "path";

interface UploadResponse {
  success: boolean;
  files?: Array<{
    filename: string;
    originalName: string;
    size: number;
    width: number;
    height: number;
    mimeType: string;
    url: string;
  }>;
  error?: string;
}

/**
 * API Route for image upload and processing
 * Handles: file upload, resize, compression, and GCP storage
 * Returns: processed image metadata with GCP URLs
 */
export const config = {
  api: {
    bodyParser: {
      sizeLimit: "50mb",
    },
  },
};

/**
 * Initialize Google Cloud Storage
 */
function initializeGCS() {
  const keyFile = process.env.GCP_KEY_FILE;
  const projectId = process.env.GCP_PROJECT_ID;

  if (!keyFile || !projectId) {
    console.warn("[GCS] Missing GCP configuration");
    return null;
  }

  try {
    const keyPath = path.resolve(process.cwd(), keyFile);
    console.log(`[GCS] Initializing with key file: ${keyPath}`);

    return new Storage({
      projectId,
      keyFilename: keyPath,
    });
  } catch (error) {
    console.error("[GCS] Failed to initialize:", error);
    return null;
  }
}

/**
 * Upload buffer to GCP Storage
 */
async function uploadToGCS(
  buffer: Buffer,
  filename: string,
): Promise<{ success: boolean; url?: string; error?: string }> {
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

    await file.save(buffer, {
      metadata: {
        contentType: "image/jpeg",
      },
    });

    console.log(`[GCS] Uploaded: ${filename}`);

    // Try to generate a signed URL (good for 7 days)
    // Signed URLs work for both private and public buckets
    try {
      const [signedUrl] = await file.getSignedUrl({
        version: "v4",
        action: "read",
        expires: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
      });
      console.log(`[GCS] Generated signed URL (expires in 7 days)`);
      return { success: true, url: signedUrl };
    } catch (signedUrlError) {
      // Fallback: try public URL for public buckets
      console.log(
        `[GCS] Signed URL failed, trying public URL: ${signedUrlError}`,
      );
      const publicUrl = `https://storage.googleapis.com/${bucketName}/withdrawal-images/${filename}`;
      return { success: true, url: publicUrl };
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("[GCS] Upload error:", errorMessage);
    return { success: false, error: errorMessage };
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<UploadResponse>,
) {
  if (req.method !== "POST") {
    return res
      .status(405)
      .json({ success: false, error: "Method not allowed" });
  }

  try {
    const { images } = req.body;

    if (!images || !Array.isArray(images)) {
      return res
        .status(400)
        .json({ success: false, error: "No images provided" });
    }

    const processedFiles: UploadResponse["files"] = [];

    for (const imageBase64 of images) {
      // Convert base64 to buffer
      const buffer = Buffer.from(
        imageBase64.split(",")[1] || imageBase64,
        "base64",
      );

      // Get original metadata
      const originalMeta = await sharp(buffer).metadata();

      // Resize and compress the image
      const resizedBuffer = await sharp(buffer)
        .resize(1920, 1080, {
          fit: "inside",
          withoutEnlargement: true,
        })
        .jpeg({ quality: 80, progressive: true })
        .toBuffer();

      const resizedMeta = await sharp(resizedBuffer).metadata();

      const filename = `${uuidv4()}-${Date.now()}.jpg`;

      // Upload to GCP
      console.log(`[API] Uploading to GCS: ${filename}`);
      const gcsResult = await uploadToGCS(resizedBuffer, filename);

      if (!gcsResult.success) {
        throw new Error(gcsResult.error || "GCS upload failed");
      }

      processedFiles.push({
        filename,
        originalName: `image-${Date.now()}.jpg`,
        size: resizedBuffer.length,
        width: resizedMeta.width || 0,
        height: resizedMeta.height || 0,
        mimeType: "image/jpeg",
        url: gcsResult.url || "",
      });

      // Log the processed image
      console.log("");
      console.log("📸 [API] Image processed and uploaded:");
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.log(`  Filename: ${filename}`);
      console.log(`  Original Size: ${buffer.length} bytes`);
      console.log(`  Resized Size: ${resizedBuffer.length} bytes`);
      console.log(
        `  Original Dimensions: ${originalMeta.width}x${originalMeta.height}`,
      );
      console.log(
        `  Resized Dimensions: ${resizedMeta.width}x${resizedMeta.height}`,
      );
      console.log(
        `  Compression: ${((resizedBuffer.length / buffer.length) * 100).toFixed(2)}%`,
      );
      console.log(`  GCP URL: ${gcsResult.url}`);
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.log("");
    }

    return res.status(200).json({
      success: true,
      files: processedFiles,
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("[API] Upload error:", errorMessage);
    return res.status(500).json({
      success: false,
      error: errorMessage,
    });
  }
}
