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
    return [];
  }

  try {
    // Convert files to base64
    const base64Images = await filesToBase64(images);

    // Call upload API
    const uploadResponse = await fetch("/api/upload", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        images: base64Images,
      }),
    });

    if (!uploadResponse.ok) {
      const errorData = await uploadResponse.json();
      throw new Error(errorData.error || "Upload failed");
    }

    const uploadData = await uploadResponse.json();

    if (!uploadData.success) {
      throw new Error(uploadData.error || "Image processing failed");
    }

    return uploadData.files || [];
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Image upload failed";
    throw new Error(errorMessage);
  }
}
