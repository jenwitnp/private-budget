/**
 * Image Upload Utility
 * Converts images to base64 and sends to API for processing
 */

export interface ProcessedImage {
  filename: string;
  originalName: string;
  size: number;
  width: number;
  height: number;
  mimeType: string;
}

/**
 * Convert File to Base64
 */
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Upload and process images via API
 * Returns processed image metadata
 */
export async function uploadAndProcessImages(
  files: File[],
): Promise<ProcessedImage[]> {
  if (!files || files.length === 0) {
    return [];
  }

  try {
    // Convert all files to base64
    const base64Images = await Promise.all(files.map(fileToBase64));

    // Send to API for processing
    const response = await fetch("/api/upload", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        images: base64Images,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Upload failed");
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || "Image processing failed");
    }

    return data.files || [];
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("[IMAGE UPLOAD] Error:", errorMessage);
    throw error;
  }
}
