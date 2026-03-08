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
 * Convert Thai local date to ISO string with timezone offset (+07:00)
 * Send timezone-aware ISO string directly to database
 * Example: "2026-03-08T00:00:00+07:00" tells DB this is Thai local time
 */
function getThaiDateStart(localDateStr: string): string {
  // Format: "2026-03-08T00:00:00+07:00"
  return `${localDateStr}T00:00:00+07:00`;
}

/**
 * Convert Thai local date to ISO string with timezone offset (+07:00) at end of day
 * Example: "2026-03-08T23:59:59+07:00"
 */
function getThaiDateEnd(localDateStr: string): string {
  // Format: "2026-03-08T23:59:59+07:00"
  return `${localDateStr}T23:59:59+07:00`;
}

/**
 * Server action to fetch transaction statistics using RPC function
 * Includes permission validation with user context from client
 *
 * Permission Logic (enforced at database level):
 * - 'owner' and 'admin' roles: See all transactions
 * - 'user' role: See only their own transactions
 *
 * ⚠️  CRITICAL: Date parameters are converted to UTC with timezone offset
 * to match the transactions query behavior and database storage format.
 *
 * @param userId - Current user's ID from session (UUID format)
 * @param userRole - Current user's role from session ('user', 'owner', 'admin')
 * @param search - Search term for transaction_number, description, notes
 * @param categoryId - Filter by category ID (UUID)
 * @param districtId - Filter by district ID (BIGINT)
 * @param subDistrictId - Filter by sub-district ID (BIGINT)
 * @param dateStart - Start date for filtering (YYYY-MM-DD format, converted to UTC)
 * @param dateEnd - End date for filtering (YYYY-MM-DD format, converted to UTC)
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

    // ⚠️  CRITICAL: Convert Thai local dates to timezone-aware ISO strings
    // Send as "2026-03-08T00:00:00+07:00" to let database handle timezone offset
    let rpcDateStart: string | null = null;
    let rpcDateEnd: string | null = null;

    if (dateStart && dateEnd) {
      // Date range query with timezone-aware ISO strings
      rpcDateStart = getThaiDateStart(dateStart);
      rpcDateEnd = getThaiDateEnd(dateEnd);
    } else if (dateStart) {
      // Single date: capture entire Thai local day
      rpcDateStart = getThaiDateStart(dateStart);
      rpcDateEnd = getThaiDateEnd(dateStart);
    } else if (dateEnd) {
      // Only end date
      rpcDateEnd = getThaiDateEnd(dateEnd);
    }

    console.log("📊 [fetchTransactionStatsAction] Calling RPC with filters:", {
      search,
      categoryId: categoryUuid,
      districtId: districtBigint,
      subDistrictId: subDistrictBigint,
      dateStart: rpcDateStart,
      dateEnd: rpcDateEnd,
      userRole,
      userId,
    });

    const { data, error } = await (supabase.rpc as any)(
      "get_transaction_stats",
      {
        p_user_role: userRole,
        p_user_id: userId,
        p_search: search || "",
        p_category_id: categoryUuid || null,
        p_district_id: districtBigint || null,
        p_sub_district_id: subDistrictBigint || null,
        p_date_start: rpcDateStart || null,
        p_date_end: rpcDateEnd || null,
      },
    );

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
