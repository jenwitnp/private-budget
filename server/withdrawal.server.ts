"use server";

import { supabase } from "@/lib/supabaseClient";
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
      console.error("❌ VALIDATION FAILED:", errors);
      return {
        success: false,
        message: "ข้อมูลไม่ถูกต้อง",
        errors,
      };
    }

    console.log("✅ VALIDATION PASSED");

    // Simulate transaction ID generation
    const txTimestamp = Date.now();
    const random = Math.floor(Math.random() * 10000);
    const transactionId = `TRX${txTimestamp}${random}`;

    console.log("🎫 TRANSACTION CREATED:", {
      id: transactionId,
      bankAccount: formData.bankAccountId || "N/A",
      itemName: formData.itemName,
      category: formData.category,
      payment_method: formData.payment_method,
      amount: `฿${finalNumAmount.toLocaleString("th-TH")}`,
      images: formData.images?.length || 0,
    });

    return {
      success: true,
      transactionId,
      message: "ส่งคำขอถอนเงินสำเร็จ",
      data: formData,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    console.error("❌ WITHDRAWAL ERROR:", errorMessage);

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

  return `TXN-${year}${month}${day}-${hour}${minute}${second}-${random}`;
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
      console.warn("Invalid district_id:", formData.district_id);
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
      console.warn("Invalid sub_district_id:", formData.sub_district_id);
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
 * TODO: Supabase client function to insert transaction
 * This will be implemented when Supabase client is configured
 */
export async function createTransactionInSupabase(
  transactionData: Record<string, any>,
): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    console.log("");
    console.log("📤 [SUPABASE] Attempting to insert transaction...");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("📊 Transaction Data:", transactionData);
    console.log("");

    // Cast to proper Supabase type to avoid TypeScript errors
    const { data, error } = await supabase
      .from("transactions")
      .insert([transactionData as any])
      .select("id");

    if (error) {
      console.error("❌ [SUPABASE] Insert failed!");
      console.error("Error Message:", error.message);
      console.error("Error Code:", error.code);
      console.error(
        "╚════════════════════════════════════════════════════════╝\n",
      );
      return { success: false, error: error.message };
    }

    console.log("✅ [SUPABASE] Transaction inserted successfully!");
    console.log("📌 Inserted ID:", data?.[0]?.id);
    console.log("📌 Full Response:", data);
    console.log("╚════════════════════════════════════════════════════════╝\n");

    return { success: true, id: data?.[0]?.id };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    console.error("");
    console.error("❌ [SUPABASE] Error inserting transaction!");
    console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.error("Error Type:", typeof err);
    console.error("Error Message:", errorMessage);
    console.error("Full Error:", err);
    console.error(
      "╚════════════════════════════════════════════════════════╝\n",
    );
    return { success: false, error: errorMessage };
  }
}

/**
 * TODO: Upload images to Supabase Storage
 */
export async function uploadTransactionImagesToSupabase(
  images: File[],
  transactionNumber: string,
): Promise<{ success: boolean; urls?: string[]; error?: string }> {
  try {
    // TODO: Replace with actual Supabase storage upload
    // const uploadedUrls: string[] = [];
    //
    // for (const image of images) {
    //   const filePath = `transactions/${transactionNumber}/${image.name}`;
    //   const { error } = await supabase.storage
    //     .from("withdrawal-images")
    //     .upload(filePath, image);
    //
    //   if (error) {
    //     return { success: false, error: error.message };
    //   }
    //
    //   uploadedUrls.push(filePath);
    // }
    //
    // return { success: true, urls: uploadedUrls };

    console.log(
      "📤 [SUPABASE] Would upload",
      images.length,
      "images for transaction:",
      transactionNumber,
    );
    return {
      success: true,
      urls: images.map(
        (img) => `transactions/${transactionNumber}/${img.name}`,
      ),
    };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    console.error("📤 [SUPABASE] Error uploading images:", errorMessage);
    return { success: false, error: errorMessage };
  }
}
