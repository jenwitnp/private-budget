"use server";

import { getTransactions } from "@/server/transactions.server";
import type {
  GetTransactionsRequest,
  GetTransactionsResponse,
} from "@/server/transactions.server";
import { hasPermission } from "@/lib/permissions/utils";
import type { UserRole } from "@/lib/permissions/config";

/**
 * Server action to fetch transactions with filters and pagination
 * Enforces permission-based filtering:
 * - If user has "view_all_transactions", show all transactions
 * - If user only has "view_own_transactions", filter to their own transactions
 */
export async function getTransactionsAction(
  request: GetTransactionsRequest,
): Promise<
  GetTransactionsResponse & { currentPage?: number; totalPages?: number }
> {
  try {
    const userRole = request.user?.role as UserRole | undefined;
    const userId = request.user?.id;

    console.log("📋 [getTransactionsAction] Initial Request:", {
      pageParam: request.pageParam,
      pageSize: request.pageSize,
      filters: request.filters,
      search: request.search,
      sortBy: request.sortBy,
    });

    console.log("👤 [getTransactionsAction] User from Request:", {
      userId,
      userRole,
      hasViewAll: userRole
        ? hasPermission(userRole, "view_all_transactions")
        : false,
    });

    // If user doesn't have "view_all_transactions" permission, filter by their own ID
    if (
      userRole &&
      userId &&
      hasPermission(userRole, "view_all_transactions") === false
    ) {
      // Inject user_id filter to show only their own transactions
      request.filters = {
        ...request.filters,
        user_id: userId,
      };
      console.log(
        "🔒 [getTransactionsAction] Permission restricted - Injected filter:",
        {
          created_by: userId,
          updatedFilters: request.filters,
        },
      );
    } else {
      console.log(
        "🔓 [getTransactionsAction] User has view_all_transactions permission - No filter injection",
      );
    }

    console.log(
      "📤 [getTransactionsAction] Final Request to getTransactions:",
      {
        pageParam: request.pageParam,
        pageSize: request.pageSize,
        filters: request.filters,
        search: request.search,
        sortBy: request.sortBy,
      },
    );

    const result = await getTransactions(request);

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
