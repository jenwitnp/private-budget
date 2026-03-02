/**
 * Google Cloud Storage Service
 * Handles image uploads, resizing, and deletion operations
 */

import sharp from "sharp";
import { Storage, Bucket, File } from "@google-cloud/storage";
import { Readable } from "stream";

import type {
  UploadOptions,
  UploadedImageData,
  FileDataForDeletion,
  GCSConfig,
  Logger,
  ImageSize,
} from "./types";

import {
  getMimeTypeFromBase64,
  base64ToBuffer,
  generateUniqueFilename,
  validateConfig,
  getDefaultImageSizes,
} from "./utils";

/**
 * Google Cloud Storage Service Class
 * Provides comprehensive image upload and management capabilities
 */
export class GoogleCloudStorageService {
  private storage: Storage;
  private bucket: Bucket;
  private config: GCSConfig;
  private logger: Logger;

  /**
   * Create a new GoogleCloudStorageService instance
   * @param config - Google Cloud Storage configuration
   * @param logger - Optional logger instance (defaults to console)
   */
  constructor(config: GCSConfig, logger?: Logger) {
    validateConfig(config);

    this.config = config;
    this.logger = logger || this.createDefaultLogger();

    this.storage = new Storage({
      projectId: config.projectId,
      keyFilename: config.keyFilename,
    });

    this.bucket = this.storage.bucket(config.bucketName);
  }

  /**
   * Initialize the bucket (create if it doesn't exist)
   */
  async initialize(): Promise<void> {
    try {
      const [bucketExists] = await this.bucket.exists();

      if (!bucketExists) {
        this.logger.log(
          `Bucket ${this.config.bucketName} does not exist, creating...`,
        );
        await this.storage.createBucket(this.config.bucketName);
        this.logger.log(
          `Bucket ${this.config.bucketName} created successfully`,
        );
      } else {
        this.logger.log(`Bucket ${this.config.bucketName} already exists`);
      }
    } catch (error) {
      this.logger.error("Failed to initialize bucket", error);
      throw error;
    }
  }

  /**
   * Upload image(s) with optional resizing
   * @param file - File object (e.g., from Next.js FormData)
   * @param options - Upload options
   * @returns Array of uploaded image metadata
   */
  async uploadImage(
    file: File | { name: string; arrayBuffer: () => Promise<ArrayBuffer> },
    options: UploadOptions = {},
  ): Promise<UploadedImageData[]> {
    const {
      folder = false,
      bucketPrefix = "vehicle",
      thumbnail = true,
      quality = 80,
      sizes,
    } = options;

    this.logger.log(`Starting image upload: ${file.name}`);

    try {
      const imageSizes = sizes || getDefaultImageSizes();
      const uploadedData: UploadedImageData[] = [];

      const fileBuffer = Buffer.from(await (file as any).arrayBuffer());
      const generateFilename = generateUniqueFilename(file.name);

      for (const size of imageSizes) {
        // Skip thumbnail if not requested
        if (size.suffix === "thumbnail" && !thumbnail) {
          this.logger.log(
            `Skipping thumbnail generation (thumbnail option is disabled)`,
          );
          continue;
        }

        const resizedData = await this.resizeImage(fileBuffer, size, quality);
        const uploadUrl = await this.uploadResizedImage(
          resizedData.buffer,
          generateFilename,
          size,
          folder,
          bucketPrefix,
        );

        if (!size.suffix) {
          uploadedData.push({
            ...uploadUrl,
            width: resizedData.metadata.width,
            height: resizedData.metadata.height,
          });
        }

        this.logger.log(
          `Successfully uploaded: ${size.width}x${size.height}${size.suffix ? ` (${size.suffix})` : ""}`,
        );
      }

      this.logger.log(
        `Image upload completed. Total files: ${uploadedData.length}`,
      );
      return uploadedData;
    } catch (error) {
      this.logger.error(`Image upload failed: ${file.name}`, error);
      throw error;
    }
  }

  /**
   * Upload multiple images
   * @param files - Array of file objects
   * @param options - Upload options
   * @returns Array of upload results for each file
   */
  async uploadMultipleImages(
    files: (File | { name: string; arrayBuffer: () => Promise<ArrayBuffer> })[],
    options: UploadOptions = {},
  ): Promise<UploadedImageData[][]> {
    this.logger.log(`Starting batch upload: ${files.length} files`);

    const uploadResults = await Promise.all(
      files.map((file) => this.uploadImage(file, options)),
    );

    this.logger.log(`Batch upload completed: ${files.length} files processed`);
    return uploadResults;
  }

  /**
   * Upload base64 encoded image
   * @param base64Data - Base64 encoded image data
   * @param fileName - Output file name
   * @param defaultMimeType - Default MIME type if not in data URI
   * @param folder - Optional folder path
   * @returns Upload metadata
   */
  async uploadBase64Image(
    base64Data: string,
    fileName: string,
    defaultMimeType: string = "image/jpeg",
    folder?: string | false,
  ): Promise<UploadedImageData> {
    this.logger.log(`Starting base64 image upload: ${fileName}`);

    try {
      const fileBuffer = base64ToBuffer(base64Data);
      const mimeType = getMimeTypeFromBase64(base64Data) || defaultMimeType;

      const filePath = folder ? `${folder}/${fileName}` : fileName;
      const gcsFile = this.bucket.file(filePath);

      await gcsFile.save(fileBuffer, {
        metadata: { contentType: mimeType },
        resumable: false,
        validation: false,
      });

      const [metadata] = await gcsFile.getMetadata();

      const uploadedData: UploadedImageData = {
        name: metadata.name || "",
        bucket: metadata.bucket || "",
        type: metadata.contentType || "image/jpeg",
        size: Number(metadata.size) || 0,
        mediaLink: `https://storage.googleapis.com/${metadata.bucket || ""}/${metadata.name || ""}`,
        updated: metadata.updated || new Date().toISOString(),
        generation: String(metadata.generation) || "0",
        etag: metadata.etag || "",
        md5Hash: metadata.md5Hash || "",
        metadata: metadata.metadata || {},
        orientation: "Square",
        width: 0,
        height: 0,
      };

      this.logger.log(`Base64 image uploaded successfully: ${fileName}`);
      return uploadedData;
    } catch (error) {
      this.logger.error(`Base64 image upload failed: ${fileName}`, error);
      throw error;
    }
  }

  /**
   * Delete file(s) from Google Cloud Storage
   * @param fileData - File data object or array
   * @returns Deletion status
   */
  async deleteFile(
    fileData: FileDataForDeletion | FileDataForDeletion[],
  ): Promise<void> {
    if (!fileData) {
      throw new Error("File data is required for deletion");
    }

    const file = Array.isArray(fileData) ? fileData[0] : fileData;

    if (!file || !file.bucket) {
      throw new Error("Invalid file data: missing bucket information");
    }

    const fileName = file.fileName || file.name;
    if (!fileName) {
      throw new Error("Invalid file data: missing file name");
    }

    this.logger.log(
      `Attempting to delete file: ${fileName} from bucket: ${file.bucket}`,
    );

    try {
      await this.storage.bucket(file.bucket).file(fileName).delete();
      this.logger.log(`File deleted successfully: ${fileName}`);
    } catch (error: unknown) {
      const err = error as any;
      if (err.code === 404) {
        this.logger.warn(
          `File not found (404), skipping deletion: ${fileName}`,
        );
        return;
      }
      this.logger.error(`Failed to delete file: ${fileName}`, error);
      throw error;
    }
  }

  /**
   * Delete multiple files
   * @param filesData - Array of file data objects
   */
  async deleteMultipleFiles(
    filesData: (FileDataForDeletion | FileDataForDeletion[])[],
  ): Promise<void> {
    this.logger.log(`Starting batch deletion: ${filesData.length} files`);

    for (const fileData of filesData) {
      try {
        await this.deleteFile(fileData);
      } catch (error) {
        this.logger.error(`Error deleting file`, error);
        // Continue with next file instead of stopping
      }
    }

    this.logger.log(`Batch deletion completed`);
  }

  /**
   * Get file metadata from Google Cloud Storage
   * @param fileName - File name/path in bucket
   * @returns File metadata
   */
  async getFileMetadata(fileName: string): Promise<any> {
    try {
      const [metadata] = await this.bucket.file(fileName).getMetadata();
      return metadata;
    } catch (error) {
      this.logger.error(`Failed to get file metadata: ${fileName}`, error);
      throw error;
    }
  }

  /**
   * Check if file exists in bucket
   * @param fileName - File name/path in bucket
   * @returns True if file exists
   */
  async fileExists(fileName: string): Promise<boolean> {
    try {
      const [exists] = await this.bucket.file(fileName).exists();
      return exists;
    } catch (error) {
      this.logger.error(`Error checking file existence: ${fileName}`, error);
      return false;
    }
  }

  /**
   * Private helper: Resize image using sharp
   */
  private async resizeImage(
    buffer: Buffer,
    size: ImageSize,
    quality: number,
  ): Promise<{ buffer: Buffer; metadata: sharp.Metadata }> {
    try {
      const resizedBuffer = await sharp(buffer)
        .resize(size.width, size.height, { fit: "inside" })
        .jpeg({ quality })
        .toBuffer();

      const metadata = await sharp(resizedBuffer).metadata();

      return { buffer: resizedBuffer, metadata };
    } catch (error) {
      this.logger.error(
        `Image resizing failed for size ${size.width}x${size.height}`,
        error,
      );
      throw error;
    }
  }

  /**
   * Private helper: Upload resized image to GCS
   */
  private async uploadResizedImage(
    buffer: Buffer,
    generateFilename: string,
    size: ImageSize,
    folder: string | false,
    bucketPrefix: string = "default",
  ): Promise<UploadedImageData> {
    try {
      const stream = Readable.from(buffer);

      const baseFilename = `${generateFilename}-${size.width}-${size.height}.jpg`;

      let filePath: string;
      if (folder) {
        if (size.suffix === "thumbnail") {
          filePath = `${bucketPrefix}/thumbnail/${folder}/${baseFilename}`;
        } else {
          filePath = `${bucketPrefix}/images/${folder}/${baseFilename}`;
        }
      } else {
        filePath = baseFilename;
      }
      const gcsFile = this.bucket.file(filePath);

      const streamUpload = stream.pipe(
        gcsFile.createWriteStream({
          metadata: { contentType: "image/jpeg" },
        }),
      );

      await new Promise((resolve, reject) => {
        streamUpload.on("finish", resolve);
        streamUpload.on("error", reject);
      });

      const [metadata] = await gcsFile.getMetadata();

      if (!metadata) {
        throw new Error("Failed to retrieve metadata after upload");
      }

      const uploadedData: UploadedImageData = {
        name: metadata.name || "",
        bucket: metadata.bucket || "",
        type: metadata.contentType || "image/jpeg",
        size: Number(metadata.size) || 0,
        mediaLink: `https://storage.googleapis.com/${metadata.bucket || ""}/${metadata.name || ""}`,
        updated: metadata.updated || new Date().toISOString(),
        generation: String(metadata.generation) || "0",
        etag: metadata.etag || "",
        md5Hash: metadata.md5Hash || "",
        metadata: metadata.metadata || {},
        orientation: "Square",
        width: size.width,
        height: size.height,
      };

      return uploadedData;
    } catch (error) {
      this.logger.error(
        `Failed to upload resized image: ${size.width}x${size.height}`,
        error,
      );
      throw error;
    }
  }

  /**
   * Private helper: Create default logger
   */
  private createDefaultLogger(): Logger {
    return {
      log: (message: string, data?: unknown) => {
        console.log(`[GCS] ${message}`, data || "");
      },
      warn: (message: string, data?: unknown) => {
        console.warn(`[GCS WARN] ${message}`, data || "");
      },
      error: (message: string, data?: unknown) => {
        console.error(`[GCS ERROR] ${message}`, data || "");
      },
    };
  }
}

/**
 * Create a singleton instance of GoogleCloudStorageService
 * @param config - Optional configuration (uses environment variables by default)
 * @returns GoogleCloudStorageService instance
 */
export function createStorageService(
  config?: Partial<GCSConfig>,
): GoogleCloudStorageService {
  const finalConfig: GCSConfig = {
    projectId: config?.projectId || process.env.GCP_PROJECT_ID || "",
    keyFilename: config?.keyFilename || process.env.GCP_KEY_FILE || "",
    bucketName: config?.bucketName || process.env.GCS_BUCKET_NAME || "",
  };

  return new GoogleCloudStorageService(finalConfig);
}

export default GoogleCloudStorageService;
