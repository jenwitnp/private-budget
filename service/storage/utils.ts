/**
 * Google Cloud Storage Utility Functions
 */

/**
 * Extract MIME type from base64 encoded data
 * @param encoded - Base64 encoded data string
 * @returns MIME type or null
 */
export function getMimeTypeFromBase64(encoded: string): string | null {
  if (typeof encoded !== "string") {
    return null;
  }

  const mime = encoded.match(/data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+).*,.*/);
  return mime && mime.length ? mime[1] : null;
}

/**
 * Convert base64 string to buffer
 * @param base64String - Base64 encoded string (with or without data URI prefix)
 * @returns Buffer
 */
export function base64ToBuffer(base64String: string): Buffer {
  const base64EncodedString = base64String.replace(
    /^data:\w+\/\w+;base64,/,
    "",
  );
  return Buffer.from(base64EncodedString, "base64");
}

/**
 * Generate unique filename
 * @param originalName - Original file name
 * @returns Generated unique filename with uuid and timestamp
 */
export function generateUniqueFilename(originalName: string): string {
  const { v4: uuid } = require("uuid");
  const path = require("path");
  const nameWithoutExt = path.basename(
    originalName,
    path.extname(originalName),
  );
  return `${nameWithoutExt}-${uuid()}-${Date.now()}`;
}

/**
 * Validate file configuration
 * @param config - Configuration object
 * @throws Error if configuration is invalid
 */
export function validateConfig(config: {
  projectId?: string;
  keyFilename?: string;
  bucketName?: string;
}): void {
  const { projectId, keyFilename, bucketName } = config;

  if (!projectId) {
    throw new Error("GCP_PROJECT_ID environment variable is not set");
  }

  if (!keyFilename) {
    throw new Error("GCP_KEY_FILE environment variable is not set");
  }

  if (!bucketName) {
    throw new Error("GCS_BUCKET_NAME environment variable is not set");
  }
}

/**
 * Get default image sizes for resizing
 * @returns Array of default image size configurations
 */
export function getDefaultImageSizes() {
  return [
    {
      width: 350,
      height: 350,
      suffix: "thumbnail",
    },
    {
      width: 2048,
      height: 2048,
      suffix: "",
    },
  ];
}
