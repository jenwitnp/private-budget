"use server";

/**
 * Client-side actions for withdrawal form
 * Handles form submission and client-side validation
 */

import { WithdrawFormData } from "@/types/withdrawal";
import { processWithdrawalOnServer } from "@/server/withdrawal.server";
import {
  prepareTransactionDataForSupabase,
  createTransactionInSupabase,
} from "@/server/withdrawal.server";

/**
 * Handle withdrawal form submission
 * Main entry point for form submission from the UI
 * Handles image upload, processing, and transaction creation
 * Note: userId should be passed from component that has access to session
 */
export async function handleWithdrawSubmitAction(
  formData: WithdrawFormData,
  userId: string,
  images?: File[],
): Promise<{
  success: boolean;
  message: string;
  transactionId?: string;
}> {
  try {
    console.log("🔄 [ACTION] Withdrawal form submitted");
    console.log("📋 Form Data:", {
      userId,
      bankAccountId: formData.bankAccountId,
      amount: formData.amount,
      description: formData.description,
      imagesCount: images?.length || 0,
    });

    // Step 1: Validate userId
    if (!userId) {
      throw new Error("User ID is required");
    }

    // Step 2: Process images via API if provided
    let processedImages: Array<{
      filename: string;
      size: number;
      width: number;
      height: number;
      url?: string;
    }> = [];

    if (images && images.length > 0) {
      console.log("📤 [ACTION] Uploading and processing images...");

      // Convert File objects to base64
      const base64Images = await Promise.all(
        images.map((file) => {
          return new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });
        }),
      );

      // Call upload API
      try {
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

        processedImages = uploadData.files || [];
        console.log("✅ [ACTION] Images processed successfully");
        console.log("📸 [ACTION] Processed images metadata:");
        processedImages.forEach((img, idx) => {
          console.log(`[${idx + 1}] ${img.filename}`);
          console.log(`  URL: ${img.url || "❌ NO URL"}`);
          console.log(`  Size: ${img.size}`);
          console.log(`  Dimensions: ${img.width}x${img.height}`);
        });
      } catch (uploadError) {
        const errorMessage =
          uploadError instanceof Error
            ? uploadError.message
            : "Image upload failed";
        console.error("❌ [ACTION] Image upload error:", errorMessage);
        throw uploadError;
      }
    }

    // Step 3: Call server-side business logic validation
    const result = await processWithdrawalOnServer(formData);

    if (!result.success) {
      console.error("❌ [ACTION] Withdrawal processing failed:", result.errors);
      throw new Error(result.message);
    }

    console.log("✅ [ACTION] Server validation passed");

    // Step 4: Prepare data for Supabase insertion
    const finalAmount =
      typeof formData.amount === "string"
        ? parseFloat(formData.amount.replace(/[฿,]/g, ""))
        : formData.amount;

    const transactionData = prepareTransactionDataForSupabase(
      formData,
      result.transactionId,
      0, // No fee
      finalAmount, // Net amount = full amount (no fee deduction)
      userId, // Use actual user ID from session
    );

    // Step 5: Insert into Supabase with image metadata
    console.log("📤 [ACTION] Inserting into Supabase...");
    const supabaseResult = await createTransactionInSupabase(
      transactionData,
      processedImages,
      userId,
    );

    if (!supabaseResult.success) {
      console.error(
        "❌ [ACTION] Supabase insertion failed:",
        supabaseResult.error,
      );
      throw new Error(`Supabase Error: ${supabaseResult.error}`);
    }

    console.log("✅ [ACTION] Transaction completed successfully");

    return {
      success: true,
      message: result.message,
      transactionId: result.transactionId,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error(
      "❌ [ACTION] Error in handleWithdrawSubmitAction:",
      errorMessage,
    );
    throw error;
  }
}

/**
 * Validate file before upload
 */
export function validateImageFile(file: File): {
  valid: boolean;
  error?: string;
} {
  const maxSizeBytes = 5 * 1024 * 1024; // 5MB
  const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];

  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `ประเภทไฟล์ไม่ได้รับอนุญาต: ${file.type}`,
    };
  }

  if (file.size > maxSizeBytes) {
    return {
      valid: false,
      error: `ไฟล์ใหญ่เกินไป: ${(file.size / 1024 / 1024).toFixed(2)}MB (max 5MB)`,
    };
  }

  return { valid: true };
}

/**
 * Log form data for debugging
 */
export function logFormData(formData: WithdrawFormData, stage: string): void {
  console.group(`📝 Form Data - ${stage}`);
  console.log("Bank Account ID:", formData.bankAccountId);
  console.log("Amount:", `฿${formData.amount.toLocaleString("th-TH")}`);
  console.log("Description:", formData.description || "(empty)");
  console.log("Images:", formData.images ? formData.images.length : 0);
  if (formData.images && formData.images.length > 0) {
    console.table(
      formData.images.map((img, idx) => ({
        index: idx,
        name: img.name,
        size: `${(img.size / 1024).toFixed(2)} KB`,
        type: img.type,
      })),
    );
  }
  console.groupEnd();
}
