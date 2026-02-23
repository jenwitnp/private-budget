import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getBankAccounts,
  getActiveBankAccounts,
  getBankAccountById,
  createBankAccount,
  updateBankAccount,
  setPrimaryBankAccount,
  deleteBankAccount,
  type BankAccount,
  type CreateBankAccountInput,
} from "@/server/bank-accounts.server";

const QUERY_KEY = ["bankAccounts"];

/**
 * Get all bank accounts for current user
 */
export function useBankAccounts(userId: string | null, options = {}) {
  return useQuery({
    queryKey: [...QUERY_KEY, userId],
    queryFn: async () => {
      if (!userId) throw new Error("User ID required");
      const result = await getBankAccounts(userId);
      if (!result.success) throw new Error(result.error);
      return result.data || [];
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    ...options,
  });
}

/**
 * Get active bank accounts for current user (for dropdown/select)
 */
export function useActiveBankAccounts(userId: string | null) {
  return useQuery({
    queryKey: [...QUERY_KEY, userId, "active"],
    queryFn: async () => {
      if (!userId) throw new Error("User ID required");
      return await getActiveBankAccounts(userId);
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Get single bank account by ID
 */
export function useBankAccount(id: string | null) {
  return useQuery({
    queryKey: [...QUERY_KEY, id],
    queryFn: async () => {
      if (!id) throw new Error("Account ID required");
      const result = await getBankAccountById(id);
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    enabled: !!id,
  });
}

/**
 * Create new bank account
 */
export function useCreateBankAccount(userId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateBankAccountInput) => {
      if (!userId) throw new Error("User ID required");
      console.log("🚀 useCreateBankAccount - Sending:", { userId, input });
      const result = await createBankAccount(userId, input);
      console.log("✅ useCreateBankAccount - Response:", result);
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    onSuccess: () => {
      if (userId) {
        queryClient.invalidateQueries({
          queryKey: [...QUERY_KEY, userId],
        });
      }
    },
    onError: (error) => {
      console.error("❌ Create bank account error:", error);
    },
  });
}

/**
 * Update bank account
 */
export function useUpdateBankAccount(userId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      input,
    }: {
      id: string;
      input: Partial<CreateBankAccountInput>;
    }) => {
      const result = await updateBankAccount(id, input);
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    onSuccess: () => {
      if (userId) {
        queryClient.invalidateQueries({
          queryKey: [...QUERY_KEY, userId],
        });
      }
    },
    onError: (error) => {
      console.error("Update bank account error:", error);
    },
  });
}

/**
 * Delete bank account
 */
export function useDeleteBankAccount(
  userId: string | null,
  userRole?: "owner" | "admin" | "user",
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const result = await deleteBankAccount(id, userId || undefined, userRole);
      if (!result.success) throw new Error(result.error);
      return result;
    },
    onSuccess: () => {
      if (userId) {
        queryClient.invalidateQueries({
          queryKey: [...QUERY_KEY, userId],
        });
      }
    },
    onError: (error) => {
      console.error("Delete bank account error:", error);
    },
  });
}

/**
 * Set primary bank account
 */
export function useSetPrimaryBankAccount(userId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (accountId: string) => {
      if (!userId) throw new Error("User ID required");
      const result = await setPrimaryBankAccount(userId, accountId);
      if (!result.success) throw new Error(result.error);
      return result;
    },
    onSuccess: () => {
      if (userId) {
        queryClient.invalidateQueries({
          queryKey: [...QUERY_KEY, userId],
        });
      }
    },
    onError: (error) => {
      console.error("Set primary bank account error:", error);
    },
  });
}
