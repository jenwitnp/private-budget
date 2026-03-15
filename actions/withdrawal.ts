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
import { uploadImagesToServer } from "@/lib/helpers/upload-images";

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
      processedImages = await uploadImagesToServer(images);
    }

    // Step 3: Call server-side business logic validation
    const result = await processWithdrawalOnServer(formData);

    if (!result.success) {
      throw new Error(result.message);
    }

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
    const supabaseResult = await createTransactionInSupabase(
      transactionData,
      processedImages,
      userId,
    );

    if (!supabaseResult.success) {
      throw new Error(`Supabase Error: ${supabaseResult.error}`);
    }

    return {
      success: true,
      message: result.message,
      transactionId: result.transactionId,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
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
  // Logging disabled
}
