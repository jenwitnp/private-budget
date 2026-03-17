"use server";

import {
  getScheduleStats,
  searchSchedules,
  createSchedule,
  updateSchedule,
  getScheduleById,
  type CreateScheduleInput,
  type UpdateScheduleInput,
} from "@/server/schedule.server";
import { supabase } from "@/lib/supabaseClient";
import {
  generateTransactionNumber,
  createTransactionInSupabase,
  updateTransactionInSupabase,
} from "@/server/withdrawal.server";
import type { FormData } from "@/pages/schedule";

/**
 * Fetch schedule stats for the menu badge
 */
export async function fetchScheduleStatsAction() {
  try {
    const result = await getScheduleStats();

    if (!result.success) {
      throw new Error(result.error || "Failed to fetch stats");
    }

    return {
      success: true,
      stats: result.stats,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    throw error;
  }
}

/**
 * Search schedules by title, date, or location
 */
export async function searchSchedulesAction(query: string) {
  try {
    const result = await searchSchedules(query);

    if (!result.success) {
      throw new Error(result.error || "Failed to search schedules");
    }

    return {
      success: true,
      data: result.data || [],
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    throw error;
  }
}

/**
 * Fetch the latest schedule data (fresh from DB with transaction details)
 * Used when opening edit modal to ensure we have current transaction data
 */
export async function fetchScheduleForEditAction(
  userId: string,
  scheduleId: string,
) {
  try {
    const result = await getScheduleById(userId, scheduleId);

    if (!result.success) {
      return {
        success: false,
        error: result.error || "Failed to fetch schedule",
      };
    }

    return {
      success: true,
      data: result.data,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Submit schedule with optional withdrawal transaction
 * Flow: Form Submit -> Schedule Action -> Log Request Data -> Server (Schedule + Transaction)
 */
export async function submitScheduleAction(
  userId: string,
  formData: FormData,
  scheduleId?: string, // If provided, it's an update
) {
  try {
    // ============================================
    // STEP 1: VALIDATE REQUIRED FIELDS
    // ============================================
    if (!formData.scheduled_date || formData.scheduled_date.trim() === "") {
      return {
        success: false,
        error: "วันที่ไม่ได้ถูกตั้ง - กรุณาเลือกวันที่ใหม่",
      };
    }

    // ============================================
    // STEP 2: LOG & DISPLAY REQUEST DATA
    // ============================================
    const requestData = {
      userId,
      scheduleId: scheduleId || null,
      isUpdate: !!scheduleId,
      timestamp: new Date().toISOString(),
      formData: {
        scheduled_date: formData.scheduled_date,
        time_start: formData.time_start,
        time_end: formData.time_end,
        title: formData.title,
        address: formData.address,
        district_id: formData.district_id,
        sub_district_id: formData.sub_district_id,
        note: formData.note,
        status: formData.status,
      },
      withdrawalData: {
        show_withdraw_form: formData.show_withdraw_form,
        payment_method: formData.payment_method,
        bankAccountId: formData.bankAccountId,
        amount: formData.amount,
      },
    };

    console.log("📋 REQUEST DATA RECEIVED:", requestData);

    // ============================================
    // STEP 1.5: VALIDATE WITHDRAWAL FIELDS (IF ENABLED)
    // ============================================
    if (formData.show_withdraw_form) {
      if (!formData.payment_method || formData.payment_method.trim() === "") {
        return {
          success: false,
          error: "กรุณาเลือกประเภทการเบิก (เงินสด / โอนเงิน)",
        };
      }

      if (formData.payment_method === "transfer") {
        if (!formData.bankAccountId || formData.bankAccountId.trim() === "") {
          return {
            success: false,
            error: "กรุณาเลือกบัญชีธนาคาร (ต้องสำหรับการโอนเงิน)",
          };
        }
      }

      if (
        !formData.amount ||
        formData.amount === "" ||
        formData.amount === "0"
      ) {
        return {
          success: false,
          error: "กรุณากรอกจำนวนเงิน",
        };
      }
    }

    // ============================================
    // STEP 2: PREPARE SCHEDULE PAYLOAD
    // ============================================
    const schedulePayload = {
      scheduled_date: formData.scheduled_date,
      time_start: formData.time_start || undefined,
      time_end: formData.time_end || undefined,
      title: formData.title || undefined,
      address: formData.address || undefined,
      district_id: formData.district_id || undefined,
      sub_district_id: formData.sub_district_id || undefined,
      note: formData.note || undefined,
      status: formData.status,
    };

    // ============================================
    // STEP 3: CREATE OR UPDATE SCHEDULE
    // ============================================
    let scheduleResult;
    if (scheduleId) {
      // UPDATE
      scheduleResult = await updateSchedule(
        userId,
        scheduleId,
        schedulePayload as UpdateScheduleInput,
      );
    } else {
      // CREATE
      scheduleResult = await createSchedule(
        userId,
        schedulePayload as CreateScheduleInput,
      );
    }

    if (!scheduleResult.success) {
      return {
        success: false,
        error: scheduleResult.error || "Failed to save schedule",
        requestData, // Return request data for debugging
      };
    }

    const createdScheduleId = scheduleResult.data?.id;
    let createdTransactionId: string | null = null;

    // ============================================
    // STEP 4.5: UPDATE EXISTING TRANSACTION (IF EDITING PENDING TRANSACTION)
    // ============================================
    if (scheduleId && formData.show_withdraw_form) {
      try {
        // Fetch the schedule to get transaction_id
        const fetchResult = await getScheduleById(userId, scheduleId);
        if (fetchResult.success && fetchResult.data?.transaction_id) {
          const transactionId = fetchResult.data.transaction_id;

          // Prepare transaction update data
          const finalAmount =
            typeof formData.amount === "string"
              ? parseFloat(formData.amount.replace(/[฿,]/g, ""))
              : Number(formData.amount);

          const updateData = {
            payment_method: formData.payment_method,
            bank_account_id:
              !formData.bankAccountId || formData.bankAccountId.trim() === ""
                ? null
                : formData.bankAccountId,
            amount: finalAmount,
            net_amount: finalAmount,
            notes: formData.note || null,
            updated_at: new Date().toISOString(),
          };

          console.log("💰 UPDATING TRANSACTION:", {
            transactionId,
            updateData,
          });

          // Update the transaction
          const updateResult = await updateTransactionInSupabase(
            transactionId,
            updateData,
          );

          if (!updateResult.success) {
            console.warn("⚠️  Transaction update failed:", updateResult.error);
          } else {
            console.log("✅ Transaction updated successfully:", transactionId);
          }
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Unknown error";
        console.warn("⚠️  Error updating transaction:", errorMsg);
        // Don't fail the operation - schedule is still updated
      }
    }

    // ============================================
    // STEP 4: CREATE WITHDRAWAL TRANSACTION (IF ENABLED & NEW SCHEDULE)
    // ============================================
    if (formData.show_withdraw_form && createdScheduleId && !scheduleId) {
      try {
        const finalAmount =
          typeof formData.amount === "string"
            ? parseFloat(formData.amount.replace(/[฿,]/g, ""))
            : Number(formData.amount);

        const transactionNumber = generateTransactionNumber();

        // Convert IDs to numbers for database
        let districtId: number | null = null;
        let subDistrictId: number | null = null;

        if (formData.district_id) {
          try {
            const idStr =
              typeof formData.district_id === "string"
                ? formData.district_id.trim()
                : String(formData.district_id);
            districtId = idStr !== "" ? parseInt(idStr, 10) : null;
          } catch (e) {
            districtId = null;
          }
        }

        if (formData.sub_district_id) {
          try {
            const idStr =
              typeof formData.sub_district_id === "string"
                ? formData.sub_district_id.trim()
                : String(formData.sub_district_id);
            subDistrictId = idStr !== "" ? parseInt(idStr, 10) : null;
          } catch (e) {
            subDistrictId = null;
          }
        }

        const transactionData = {
          item_name: formData.title,
          transaction_number: transactionNumber,
          user_id: userId,
          created_by: userId,
          bank_account_id:
            !formData.bankAccountId || formData.bankAccountId.trim() === ""
              ? null
              : formData.bankAccountId,
          amount: finalAmount,
          net_amount: finalAmount,
          currency: "THB",
          description: `คำขอเบิกจากตารางงาน : ${formData.title}`,
          category_id: "b07b2cc8-6f32-443a-b490-03686d3908f4",
          payment_method: formData.payment_method,
          notes: formData.note || null,
          status: "pending",
          transaction_date: formData.scheduled_date,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          districts_id: districtId,
          sub_districts_id: subDistrictId,
          transaction_type: 2,
        };

        console.log("💰 TRANSACTION PAYLOAD:", transactionData);

        // Use createTransactionInSupabase function instead of direct insert
        const transactionResult = await createTransactionInSupabase(
          transactionData,
          [], // No images for schedule-based transactions
          userId,
        );

        if (!transactionResult.success) {
          console.warn(
            "⚠️  Transaction creation failed:",
            transactionResult.error,
          );
        } else {
          createdTransactionId = transactionResult.id;
          console.log(
            "✅ Transaction created successfully with ID:",
            createdTransactionId,
          );

          // ============================================
          // STEP 5: LINK TRANSACTION TO SCHEDULE
          // ============================================
          if (createdTransactionId) {
            const updateResult = await updateSchedule(
              userId,
              createdScheduleId.toString(),
              { transaction_id: createdTransactionId }, // Link transaction to schedule
            );

            if (updateResult.success) {
              console.log(
                "✅ Schedule updated with transaction_id:",
                createdTransactionId,
              );
            } else {
              console.warn(
                "⚠️  Failed to link transaction to schedule:",
                updateResult.error,
              );
            }
          }
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Unknown error";
        console.warn("⚠️  Error creating transaction:", errorMsg);
        // Don't fail the operation - schedule is still created
      }
    }

    // ============================================
    // FINAL RESULT
    // ============================================
    return {
      success: true,
      scheduleId: createdScheduleId,
      transactionId: createdTransactionId, // Include transaction ID if created
      message: scheduleId
        ? "Schedule updated successfully"
        : "Schedule created successfully",
      requestData, // Return request data for confirmation
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("❌ Error in submitScheduleAction:", errorMessage);
    return {
      success: false,
      error: errorMessage,
    };
  }
}
