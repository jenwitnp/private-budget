/**
 * Google Cloud Storage Service Types
 * Provides type definitions for image upload and storage operations
 */

/**
 * Image size configuration for resizing
 */
export interface ImageSize {
  width: number;
  height: number;
  suffix: string; // e.g., "thumbnail", "" for full size
}

/**
 * Upload options for image processing
 */
export interface UploadOptions {
  folder?: string | false;
  bucketPrefix?: string; // e.g., 'vehicle', 'product', 'user-profile'
  thumbnail?: boolean;
  quality?: number; // JPEG quality (1-100)
  sizes?: ImageSize[];
}

/**
 * Uploaded image metadata returned from Google Cloud Storage
 */
export interface UploadedImageData {
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

/**
 * File data for deletion operations
 */
export interface FileDataForDeletion {
  fileName?: string;
  name?: string;
  bucket: string;
  [key: string]: unknown;
}

/**
 * Google Cloud Storage configuration
 */
export interface GCSConfig {
  projectId: string;
  keyFilename: string;
  bucketName: string;
}

/**
 * Response for file upload
 */
export interface UploadResponse {
  success: boolean;
  data?: UploadedImageData[];
  error?: string;
}

/**
 * Response for file deletion
 */
export interface DeleteResponse {
  success: boolean;
  message?: string;
  error?: string;
}

/**
 * Logger interface for extensibility
 */
export interface Logger {
  log: (message: string, data?: unknown) => void;
  warn: (message: string, data?: unknown) => void;
  error: (message: string, data?: unknown) => void;
}
