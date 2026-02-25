import { useQuery, UseQueryOptions } from "@tanstack/react-query";
import type { Transaction } from "@/server/transactions.server";
import { getTransactionsAction } from "@/actions/transactions";

const QUERY_KEY = ["transactions"];

/**
 * Fetch transactions for current user with pagination
 */
export function useTransactions(
  user: { id?: string; role?: string } | null,
  page: number = 1,
  pageSize: number = 10,
  options?: UseQueryOptions<{ data: Transaction[]; total: number }, Error>,
) {
  return useQuery<{ data: Transaction[]; total: number }, Error>({
    queryKey: [...QUERY_KEY, user?.id, page, pageSize],
    queryFn: async () => {
      if (!user?.id) {
        return { data: [], total: 0 };
      }
      const result = await getTransactionsAction({
        user,
        pageParam: page,
        pageSize,
      });
      if (!result.success) {
        throw new Error(result.error || "Failed to fetch transactions");
      }
      return { data: result.data || [], total: result.total || 0 };
    },
    enabled: !!user?.id,
    staleTime: 3 * 60 * 1000, // 3 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    ...options,
  });
}

/**
 * Fetch transactions with filters and pagination
 */
export function useFilteredTransactions(
  user: { id?: string; role?: string } | null,
  page: number = 1,
  pageSize: number = 10,
  statusFilter?: "all" | "pending" | "approved" | "rejected" | "paid",
  daysFilter?: number,
  options?: UseQueryOptions<{ data: Transaction[]; total: number }, Error>,
) {
  return useQuery<{ data: Transaction[]; total: number }, Error>({
    queryKey: [
      ...QUERY_KEY,
      user?.id,
      page,
      pageSize,
      statusFilter,
      daysFilter,
    ],
    queryFn: async () => {
      if (!user?.id) {
        return { data: [], total: 0 };
      }
      const result = await getTransactionsAction({
        user,
        pageParam: page,
        pageSize,
      });
      if (!result.success) {
        throw new Error(result.error || "Failed to fetch transactions");
      }

      let transactions = result.data || [];

      // Filter by status
      if (statusFilter && statusFilter !== "all") {
        transactions = transactions.filter((t) => t.status === statusFilter);
      }

      // Filter by days
      if (daysFilter && daysFilter > 0) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysFilter);
        transactions = transactions.filter(
          (t) => new Date(t.transaction_date) >= cutoffDate,
        );
      }

      return { data: transactions, total: result.total || 0 };
    },
    enabled: !!user?.id,
    staleTime: 3 * 60 * 1000, // 3 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    ...options,
  });
}
