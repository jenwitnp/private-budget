import { supabase } from "@/lib/supabaseClient";
import { createStorageService } from "@/service/storage";
/**
 * Server-side business logic for withdrawal processing
 * This file contains all core server logic for handling withdrawal requests
 * Only runs on the server side - never exposed to client
 */

import {
  WithdrawFormData,
  ProcessWithdrawalResult,
  CalculatedFees,
} from "@/types/withdrawal";

/**
 * Process withdrawal request with business logic validation
 * This is the main server-side function that handles all withdrawal logic
 */
export async function processWithdrawalOnServer(
  formData: WithdrawFormData,
): Promise<ProcessWithdrawalResult> {
  try {
    // Validate amount
    const numAmount =
      typeof formData.amount === "string"
        ? parseFloat(formData.amount)
        : formData.amount;

    // Validation
    const errors: Record<string, string> = {};

    // Validate bank account ID - Required only for transfer payment method
    if (formData.payment_method === "transfer") {
      if (!formData.bankAccountId || formData.bankAccountId.trim() === "") {
        errors.bankAccountId = "กรุณาเลือกบัญชีธนาคาร";
      }
    }

    // Validate amount (already converted above, but also strip ฿ and commas just in case)
    let cleanAmount = formData.amount;
    if (typeof cleanAmount === "string") {
      cleanAmount = cleanAmount.replace(/[฿,]/g, "");
    }
    const finalNumAmount =
      typeof cleanAmount === "string" ? parseFloat(cleanAmount) : cleanAmount;

    if (!finalNumAmount || finalNumAmount <= 0) {
      errors.amount = "จำนวนเงินต้องมากกว่า 0";
    }
    // Validate images if provided
    if (formData.images && formData.images.length > 0) {
      if (formData.images.length > 5) {
        errors.images = "สามารถอัปโหลดได้สูงสุด 5 รูปภาพ";
      }

      // Check file sizes
      const maxSizeBytes = 5 * 1024 * 1024; // 5MB
      const oversizedFiles = formData.images.filter(
        (file) => file.size > maxSizeBytes,
      );
      if (oversizedFiles.length > 0) {
        errors.images = `ไฟล์ต่อไปนี้ใหญ่เกินไป (max 5MB): ${oversizedFiles
          .map((f) => f.name)
          .join(", ")}`;
      }
    }

    // If there are validation errors, return them
    if (Object.keys(errors).length > 0) {
      return {
        success: false,
        message: "ข้อมูลไม่ถูกต้อง",
        errors,
      };
    }

    // Simulate transaction ID generation
    const txTimestamp = Date.now();
    const random = Math.floor(Math.random() * 10000);
    const transactionId = `TRX${txTimestamp}${random}`;

    return {
      success: true,
      transactionId,
      message: "ส่งคำขอถอนเงินสำเร็จ",
      data: formData,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";

    return {
      success: false,
      message: "เกิดข้อผิดพลาดในการประมวลผล",
      errors: { general: errorMessage },
    };
  }
}

/**
 * Validate withdrawal data before processing
 */
export function validateWithdrawalDataOnServer(
  formData: WithdrawFormData,
): boolean {
  const amount =
    typeof formData.amount === "string"
      ? parseFloat(formData.amount)
      : formData.amount;

  return (
    formData.bankAccountId && amount > 0 && amount >= 100 && amount <= 100000
  );
}

/**
 * Generate unique transaction number
 * Format: TXN-YYYYMMDD-HHMMSS-RANDOM
 */
export function generateTransactionNumber(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hour = String(now.getHours()).padStart(2, "0");
  const minute = String(now.getMinutes()).padStart(2, "0");
  const second = String(now.getSeconds()).padStart(2, "0");
  const random = String(Math.floor(Math.random() * 10000)).padStart(4, "0");

  return `PRV-${year}${month}${day}-${random}`;
}

/**
 * Prepare transaction data for Supabase insertion
 * Maps form data to transactions table schema
 */
export function prepareTransactionDataForSupabase(
  formData: WithdrawFormData,
  transactionNumber: string,
  fee: number,
  netAmount: number,
  userId: string,
): Record<string, any> {
  const finalAmount =
    typeof formData.amount === "string"
      ? parseFloat(formData.amount.replace(/[฿,]/g, ""))
      : formData.amount;

  // Convert district_id and sub_district_id to numbers if provided
  // Note: districts and sub_districts tables use BIGSERIAL (64-bit int)
  // which can be safely represented as JavaScript numbers
  let districtId: number | null = null;
  let subDistrictId: number | null = null;

  if (formData.district_id && formData.district_id.trim() !== "") {
    try {
      districtId = parseInt(formData.district_id, 10);
      if (isNaN(districtId)) {
        districtId = null;
      }
    } catch (e) {
      districtId = null;
    }
  }

  if (formData.sub_district_id && formData.sub_district_id.trim() !== "") {
    try {
      subDistrictId = parseInt(formData.sub_district_id, 10);
      if (isNaN(subDistrictId)) {
        subDistrictId = null;
      }
    } catch (e) {
      subDistrictId = null;
    }
  }

  return {
    item_name: formData.itemName || null,
    transaction_number: transactionNumber,
    user_id: userId,
    bank_account_id:
      !formData.bankAccountId || formData.bankAccountId.trim() === ""
        ? null
        : formData.bankAccountId,
    amount: finalAmount,
    currency: "THB",
    description: formData.description || null,
    category_id: formData.category || null,
    payment_method: formData.payment_method,
    notes: `Item: ${formData.itemName}`,
    status: "pending",
    transaction_date: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    districts_id: districtId,
    sub_districts_id: subDistrictId,
  };
}

/**
 * Supabase client function to insert transaction and images
 * Creates transaction record, inserts images to images table, and sets thumbnail
 */
export async function createTransactionInSupabase(
  transactionData: Record<string, any>,
  imageMetadata: Array<{
    filename: string;
    size: number;
    width: number;
    height: number;
    url?: string;
  }> = [],
  userId?: string,
): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    // Step 1: Insert transaction
    const { data: transactionResult, error: transactionError } = await supabase
      .from("transactions")
      .insert([transactionData as any])
      .select("id");

    if (transactionError) {
      return { success: false, error: transactionError.message };
    }

    const transactionId = transactionResult?.[0]?.id;
    if (!transactionId) {
      return { success: false, error: "Failed to create transaction" };
    }

    console.log(`✅ [DB] Transaction created: ${transactionId}`);

    // Step 2: Insert images and collect URLs
    let thumbnailUrl: string | null = null;

    if (imageMetadata.length > 0) {
      console.log("");
      console.log("📸 [DB] Inserting images into database:");
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.log(`Received ${imageMetadata.length} images:`);

      imageMetadata.forEach((img, idx) => {
        console.log(`\n[${idx + 1}] Image metadata:`);
        console.log(`  filename: ${img.filename}`);
        console.log(`  size: ${img.size}`);
        console.log(`  width: ${img.width}`);
        console.log(`  height: ${img.height}`);
        console.log(`  url: ${img.url || "❌ NULL/UNDEFINED"}`);
      });

      const imageRecords = imageMetadata.map((img, index) => ({
        transaction_id: transactionId,
        url: img.url || null,
        cloud_url: img.url || null,
        filename: img.filename,
        file_size: img.size,
        mime_type: "image/jpeg",
        width: img.width,
        height: img.height,
        storage_path: img.url ? `withdrawal-images/${img.filename}` : null,
        uploaded_by: userId,
        upload_status: "completed",
      }));

      const { error: imagesError } = await (supabase as any)
        .from("images")
        .insert(imageRecords as any[]);

      if (imagesError) {
        console.error("[DB] Failed to insert images:", imagesError.message);
        return { success: false, error: imagesError.message };
      }

      // Set thumbnail to first image URL
      if (imageMetadata[0]?.url) {
        thumbnailUrl = imageMetadata[0].url;
      }

      // Log inserted images
      imageMetadata.forEach((img, index) => {
        console.log(`  Image ${index + 1}:`);
        console.log(`    Filename: ${img.filename}`);
        console.log(`    Size: ${(img.size / 1024).toFixed(2)} KB`);
        console.log(`    Dimensions: ${img.width}x${img.height}`);
        console.log(`    URL: ${img.url || "❌ NOT SET"}`);
      });
      console.log(`Total images inserted: ${imageMetadata.length}`);
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.log("");

      // Step 3: Update transaction thumbnail
      if (thumbnailUrl) {
        const { error: updateError } = await supabase
          .from("transactions")
          .update({ thumbnail: thumbnailUrl } as any)
          .eq("id", transactionId);

        if (updateError) {
          console.error(
            "[DB] Failed to update thumbnail:",
            updateError.message,
          );
          // Don't fail the transaction if thumbnail update fails
        } else {
          console.log(`✅ [DB] Transaction thumbnail updated: ${thumbnailUrl}`);
        }
      }
    }

    return { success: true, id: transactionId };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    console.error("[DB] Error in createTransactionInSupabase:", errorMessage);
    return { success: false, error: errorMessage };
  }
}
