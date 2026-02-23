"use server";

import { getTransactions } from "@/server/transactions.server";
import type {
  GetTransactionsRequest,
  GetTransactionsResponse,
} from "@/server/transactions.server";

/**
 * Server action to fetch transactions with filters and pagination
 */
export async function getTransactionsAction(
  request: GetTransactionsRequest,
): Promise<
  GetTransactionsResponse & { currentPage?: number; totalPages?: number }
> {
  try {
    // Get user data from request parameter
    console.log("📋 [getTransactionsAction] User Data:", {
      userId: request.user?.id,
      userEmail: request.user?.email,
      userName: request.user?.name,
      userRole: request.user?.role,
      isAuthenticated: !!request.user?.id,
    });

    const query: GetTransactionsRequest = {
      user: request.user,
      pageParam: 1,
      search: "",
      filters: {},
      sortBy: "newest",
      pageSize: 12,
    };

    const result = await getTransactions(query);

    if (!result.success) {
      throw new Error(result.error || "Failed to fetch transactions");
    }

    return {
      success: true,
      data: result.data,
      total: result.total,
      currentPage: result.currentPage,
      pageSize: result.pageSize,
      totalPages: result.totalPages,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to fetch transactions";
    console.error("❌ [getTransactionsAction] Error:", errorMessage);
    return {
      success: false,
      error: errorMessage,
      data: [],
      total: 0,
      currentPage: request.pageParam || 1,
      pageSize: request.pageSize || 10,
      totalPages: 0,
    };
  }
}
