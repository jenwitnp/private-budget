/**
 * Image upload helper utilities
 * Handles converting files to base64 and uploading to API
 */

/**
 * Convert File objects to base64 strings
 */
async function filesToBase64(files: File[]): Promise<string[]> {
  return Promise.all(
    files.map((file) => {
      return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    }),
  );
}

/**
 * Upload images to the server API
 * @param images - Array of File objects to upload
 * @returns Processed images metadata from server
 */
export async function uploadImagesToServer(images: File[]): Promise<
  Array<{
    filename: string;
    size: number;
    width: number;
    height: number;
    url?: string;
  }>
> {
  if (!images || images.length === 0) {
    console.log("[📸 uploadImagesToServer] ⚠️ No images provided");
    return [];
  }

  try {
    console.log(
      `[📸 uploadImagesToServer] START - Converting ${images.length} images to base64`,
    );

    // Convert files to base64
    const base64Images = await filesToBase64(images);
    console.log(
      `[📸 uploadImagesToServer] ✅ Converted ${base64Images.length} images to base64`,
    );

    // Call upload API
    console.log("[📸 uploadImagesToServer] 📤 Calling /api/upload endpoint...");
    const uploadResponse = await fetch("/api/upload", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        images: base64Images,
      }),
    });

    console.log(
      "[📸 uploadImagesToServer] 📥 Response status:",
      uploadResponse.status,
      uploadResponse.statusText,
    );

    if (!uploadResponse.ok) {
      const errorData = await uploadResponse.json();
      console.error(
        "[📸 uploadImagesToServer] ❌ Upload API error:",
        errorData,
      );
      throw new Error(
        errorData.error || `Upload failed with status ${uploadResponse.status}`,
      );
    }

    const uploadData = await uploadResponse.json();
    console.log("[📸 uploadImagesToServer] 📦 API Response:", uploadData);

    if (!uploadData.success) {
      console.error(
        "[📸 uploadImagesToServer] ❌ API returned success=false:",
        uploadData.error,
      );
      throw new Error(uploadData.error || "Image processing failed");
    }

    const processedFiles = uploadData.files || [];
    console.log(
      `[📸 uploadImagesToServer] ✅ SUCCESS - Received ${processedFiles.length} processed files with URLs`,
    );
    processedFiles.forEach((file: any, idx: number) => {
      console.log(
        `  [${idx + 1}] ${file.filename} - URL: ${file.url ? "✅ Present" : "❌ Missing"}`,
      );
    });

    return processedFiles;
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Image upload failed";
    console.error("[📸 uploadImagesToServer] ❌ FAILED:", errorMessage);
    throw new Error(errorMessage);
  }
}
