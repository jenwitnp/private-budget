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
import { useSession } from "next-auth/react";

/**
 * Handle withdrawal form submission
 * Main entry point for form submission from the UI
 * Note: userId should be passed from component that has access to session
 */
export async function handleWithdrawSubmitAction(
  formData: WithdrawFormData,
  userId: string,
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
      imagesCount: formData.images?.length || 0,
    });

    // Step 1: Validate userId
    if (!userId) {
      throw new Error("User ID is required");
    }

    // Step 2: Call server-side business logic validation
    const result = await processWithdrawalOnServer(formData);

    if (!result.success) {
      console.error("❌ [ACTION] Withdrawal processing failed:", result.errors);
      throw new Error(result.message);
    }

    console.log("✅ [ACTION] Server validation passed");

    // Step 3: Prepare data for Supabase insertion
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

    // Step 4: Insert into Supabase
    console.log("📤 [ACTION] Inserting into Supabase...");
    const supabaseResult = await createTransactionInSupabase(transactionData);

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
