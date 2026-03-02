/**
 * Google Cloud Storage Service Index
 * Exports all storage-related utilities and services
 */

export {
  GoogleCloudStorageService,
  createStorageService,
} from "./google-cloud-storage";

export type {
  ImageSize,
  UploadOptions,
  UploadedImageData,
  FileDataForDeletion,
  GCSConfig,
  UploadResponse,
  DeleteResponse,
  Logger,
} from "./types";

export {
  getMimeTypeFromBase64,
  base64ToBuffer,
  generateUniqueFilename,
  validateConfig,
  getDefaultImageSizes,
} from "./utils";
