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
