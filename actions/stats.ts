"use server";

import { supabase } from "@/lib/supabaseClient";
import type { UserRole } from "@/lib/permissions/config";

export interface TransactionStatsResponse {
  success: boolean;
  data?: {
    pending: number;
    approved: number;
    rejected: number;
    paid: number;
  };
  error?: string;
}

/**
 * Server action to fetch transaction statistics using RPC function
 * Includes permission validation with user context from client
 *
 * Permission Logic (enforced at database level):
 * - 'owner' and 'admin' roles: See all transactions
 * - 'user' role: See only their own transactions
 *
 * @param userId - Current user's ID from session (UUID format)
 * @param userRole - Current user's role from session ('user', 'owner', 'admin')
 * @param search - Search term for transaction_number, description, notes
 * @param categoryId - Filter by category ID (UUID)
 * @param districtId - Filter by district ID (BIGINT)
 * @param subDistrictId - Filter by sub-district ID (BIGINT)
 * @param dateStart - Start date for filtering (ISO format)
 * @param dateEnd - End date for filtering (ISO format)
 */
export async function fetchTransactionStatsAction(
  userId?: string,
  userRole?: UserRole,
  search?: string,
  categoryId?: string,
  districtId?: string | number,
  subDistrictId?: string | number,
  dateStart?: string,
  dateEnd?: string,
): Promise<TransactionStatsResponse> {
  try {
    console.log("📊 [fetchTransactionStatsAction] Permission Check:", {
      userId,
      userRole,
    });

    // Validate user has role and ID
    if (!userRole || !userId) {
      console.warn("⚠️  [fetchTransactionStatsAction] Missing userRole/userId");
      return {
        success: false,
        error: "Unauthorized: Missing user information",
      };
    }

    // Convert string IDs to appropriate types for RPC
    const categoryUuid = categoryId ? (categoryId as string) : null;
    const districtBigint = districtId
      ? typeof districtId === "string"
        ? parseInt(districtId)
        : districtId
      : null;
    const subDistrictBigint = subDistrictId
      ? typeof subDistrictId === "string"
        ? parseInt(subDistrictId)
        : subDistrictId
      : null;

    console.log("📊 [fetchTransactionStatsAction] Calling RPC with filters:", {
      search,
      categoryId: categoryUuid,
      districtId: districtBigint,
      subDistrictId: subDistrictBigint,
      dateStart,
      dateEnd,
      userRole,
      userId,
    });

    const { data, error } = await supabase.rpc("get_transaction_stats", {
      p_user_role: userRole,
      p_user_id: userId,
      p_search: search || "",
      p_category_id: categoryUuid || null,
      p_district_id: districtBigint || null,
      p_sub_district_id: subDistrictBigint || null,
      p_date_start: dateStart || null,
      p_date_end: dateEnd || null,
    });

    if (error) {
      console.error("❌ [fetchTransactionStatsAction] RPC Error:", error);
      throw new Error(error.message || "Failed to fetch transaction stats");
    }

    // RPC returns array with one object
    const stats = Array.isArray(data) ? data[0] : data;

    console.log("✅ [fetchTransactionStatsAction] Stats fetched:", {
      pending: stats?.pending,
      approved: stats?.approved,
      rejected: stats?.rejected,
      paid: stats?.paid,
      userRole,
    });

    return {
      success: true,
      data: {
        pending: stats?.pending || 0,
        approved: stats?.approved || 0,
        rejected: stats?.rejected || 0,
        paid: stats?.paid || 0,
      },
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Failed to fetch transaction stats";
    console.error("❌ [fetchTransactionStatsAction] Error:", errorMessage);
    return {
      success: false,
      error: errorMessage,
    };
  }
}
