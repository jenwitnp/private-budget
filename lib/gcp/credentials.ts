/**
 * GCP Credentials Handler
 * Supports both local file path and base64 encoded credentials for Vercel deployments
 */

import path from "path";
import type { StorageOptions } from "@google-cloud/storage";

/**
 * Get GCP credentials from environment
 * Supports two modes:
 * 1. Development: GCP_KEY_FILE=path/to/credentials.json
 * 2. Production/Vercel: GCP_SERVICE_ACCOUNT_B64=base64_encoded_json
 */
export function getGCPCredentials(): {
  credentials: any;
  projectId: string;
} | null {
  const projectId = process.env.GCP_PROJECT_ID;

  if (!projectId) {
    console.error("[GCP] GCP_PROJECT_ID not configured");
    return null;
  }

  // Try base64 encoded credentials first (for Vercel/production)
  if (process.env.GCP_SERVICE_ACCOUNT_B64) {
    try {
      const json = Buffer.from(
        process.env.GCP_SERVICE_ACCOUNT_B64,
        "base64",
      ).toString("utf-8");
      const credentials = JSON.parse(json);
      console.log("[GCP] Using base64 encoded credentials");
      return { credentials, projectId };
    } catch (error) {
      console.error(
        "[GCP] Failed to decode base64 credentials:",
        error instanceof Error ? error.message : "Unknown error",
      );
      return null;
    }
  }

  // Fall back to file path (for local development)
  if (process.env.GCP_KEY_FILE) {
    try {
      const keyPath = path.resolve(process.cwd(), process.env.GCP_KEY_FILE);
      // Import dynamically to avoid "fs" issues in browser
      const fs = require("fs");
      const json = fs.readFileSync(keyPath, "utf-8");
      const credentials = JSON.parse(json);
      console.log("[GCP] Using file-based credentials from:", keyPath);
      return { credentials, projectId };
    } catch (error) {
      console.error(
        "[GCP] Failed to load credentials file:",
        error instanceof Error ? error.message : "Unknown error",
      );
      return null;
    }
  }

  console.error(
    "[GCP] No credentials configured. Set either GCP_SERVICE_ACCOUNT_B64 or GCP_KEY_FILE",
  );
  return null;
}

/**
 * Get Storage options for Google Cloud Storage client
 */
export function getStorageOptions(): StorageOptions | null {
  const creds = getGCPCredentials();

  if (!creds) {
    return null;
  }

  return {
    projectId: creds.projectId,
    credentials: creds.credentials,
  };
}

/**
 * Validate GCP configuration
 */
export function validateGCPConfig(): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!process.env.GCP_PROJECT_ID) {
    errors.push("GCP_PROJECT_ID is not set");
  }

  if (!process.env.GCP_SERVICE_ACCOUNT_B64 && !process.env.GCP_KEY_FILE) {
    errors.push(
      "Neither GCP_SERVICE_ACCOUNT_B64 nor GCP_KEY_FILE is configured",
    );
  }

  if (!process.env.GCS_BUCKET_NAME) {
    errors.push("GCS_BUCKET_NAME is not set");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
