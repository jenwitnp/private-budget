/**
 * Image deletion helper utilities
 * Handles calling the delete API for removing images from GCS
 */

/**
 * Delete image from GCS bucket via API endpoint
 * Non-blocking operation - logs warnings but doesn't fail if deletion fails
 * @param filename - Filename of the image to delete from GCS
 * @returns Success status
 */
export async function deleteImageFromGCS(filename: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    if (!filename) {
      throw new Error("Filename is required");
    }

    console.log(`🗑️  [Helper] Calling delete API for: ${filename}`);

    const deleteResponse = await fetch("/api/delete-image", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ filename }),
    });

    if (!deleteResponse.ok) {
      const error = await deleteResponse.json();
      console.warn(`⚠️  [Helper] API deletion warning:`, error.error);
      // Return success: true anyway - don't fail the entire operation
      return {
        success: true,
        error: error.error || "GCS deletion warning",
      };
    }

    console.log(`✅ [Helper] Deleted from GCS via API: ${filename}`);
    return { success: true };
  } catch (apiError: unknown) {
    const error = apiError as any;
    console.warn(
      `⚠️  [Helper] API call failed: ${error?.message || "Unknown error"}`,
    );
    // Don't fail the entire operation if API call fails
    return {
      success: true,
      error: error?.message || "API call failed",
    };
  }
}
