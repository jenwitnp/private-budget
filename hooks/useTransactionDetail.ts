"use client";

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import type { TransactionDetailWithCategory } from "@/lib/database.views";

/**
 * Hook to fetch complete transaction details from the view with category information
 */
export function useTransactionDetail(transactionId: string | null) {
  return useQuery({
    queryKey: ["transaction-detail", transactionId],
    queryFn: async () => {
      if (!transactionId) throw new Error("Transaction ID is required");

      const { data, error } = await (supabase as any)
        .from("transactions_detail_with_categories")
        .select("*")
        .eq("id", transactionId)
        .single();

      if (error) {
        console.error("❌ Error fetching transaction detail:", error);
        throw error;
      }

      console.log("✅ Transaction detail fetched:", data);
      return data as TransactionDetailWithCategory;
    },
    enabled: !!transactionId,
  });
}
