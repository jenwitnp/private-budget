import { useContext, useCallback, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { TransactionContext } from "../contexts/TransactionContext";
import type {
  ClientTransaction,
  TransactionFilters,
} from "../contexts/TransactionContext";

interface FetchTransactionsResponse {
  transactions: ClientTransaction[];
  success: boolean;
}

async function fetchTransactions(
  filters?: TransactionFilters,
): Promise<ClientTransaction[]> {
  const queryParams = new URLSearchParams();

  if (filters?.searchTerm) {
    queryParams.append("search", filters.searchTerm);
  }
  if (filters?.statusFilter && filters.statusFilter !== "all") {
    queryParams.append("status", filters.statusFilter);
  }
  if (filters?.dateStart) {
    queryParams.append("dateStart", filters.dateStart);
  }
  if (filters?.dateEnd) {
    queryParams.append("dateEnd", filters.dateEnd);
  }
  if (filters?.categoryId) {
    queryParams.append("categoryId", filters.categoryId);
  }
  if (filters?.districtId) {
    queryParams.append("districtId", filters.districtId);
  }
  if (filters?.subDistrictId) {
    queryParams.append("subDistrictId", filters.subDistrictId);
  }

  const url = `/api/transactions${queryParams.toString() ? "?" + queryParams.toString() : ""}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("Failed to fetch transactions");
  }

  const data: FetchTransactionsResponse = await response.json();
  return data.transactions;
}

export function useTransactionProvider(initialFilters?: TransactionFilters) {
  const context = useContext(TransactionContext);
  const queryClient = useQueryClient();

  if (!context) {
    throw new Error(
      "useTransactionProvider must be used within TransactionProvider",
    );
  }

  const [filters, setFilters] = useState<TransactionFilters>(
    initialFilters || context.currentFilters,
  );
  const [selectedTransaction, setSelectedTransaction] =
    useState<ClientTransaction | null>(null);

  const { data, isLoading, error, refetch } = useQuery<ClientTransaction[]>({
    queryKey: ["transactions", filters],
    queryFn: () => fetchTransactions(filters),
    staleTime: 1000 * 60 * 2, // 2 minutes
    gcTime: 1000 * 60 * 5, // 5 minutes
  });

  const updateMutation = useMutation({
    mutationFn: async (data: {
      id: string;
      updates: Partial<ClientTransaction>;
    }) => {
      const response = await fetch(`/api/transactions/${data.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data.updates),
      });

      if (!response.ok) {
        throw new Error("Failed to update transaction");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/transactions/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete transaction");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
    },
  });

  const refetchTransactions = useCallback(
    async (newFilters?: TransactionFilters) => {
      if (newFilters) {
        setFilters(newFilters);
      }
      await refetch();
    },
    [refetch],
  );

  const updateTransaction = useCallback(
    (id: string, updates: Partial<ClientTransaction>) => {
      updateMutation.mutate({ id, updates });
    },
    [updateMutation],
  );

  const deleteTransaction = useCallback(
    (id: string) => {
      deleteMutation.mutate(id);
    },
    [deleteMutation],
  );

  return {
    transactions: data || context.transactions,
    selectedTransaction,
    isLoading: isLoading || context.isLoading,
    error: error?.message || context.error,
    setSelectedTransaction,
    refetchTransactions,
    updateTransaction,
    deleteTransaction,
    currentFilters: filters,
    setFilters,
  };
}

// Hook for consuming transaction context
export function useTransactions() {
  const context = useContext(TransactionContext);

  if (!context) {
    throw new Error("useTransactions must be used within TransactionProvider");
  }

  return context;
}
