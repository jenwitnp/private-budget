"use server";

import { supabase } from "@/lib/supabaseClient";
import { fetchData, type SearchConfig } from "@/lib/supabase/query";
import { getServerSession } from "next-auth";

export interface Transaction {
  id: string;
  transaction_number: string;
  user_id: string;
  bank_account_id: string | null;
  amount: number;
  net_amount?: number | null;
  displayAmount?: number;
  currency: string;
  description: string | null;
  notes: string | null;
  status: "pending" | "approved" | "rejected" | "paid";
  transaction_date: string;
  created_at: string;
  updated_at: string;
  districts_id: number | null;
  sub_districts_id: number | null;
}

export interface TransactionWithBankDetails extends Transaction {
  account?: string;
  bankAccount?: string;
}

/**
 * Request parameters for fetching transactions
 */
export interface GetTransactionsRequest {
  user: { id?: string; role?: string; email?: string; name?: string } | null;
  pageParam?: number;
  pageSize?: number;
  search?: string;
  filters?: Record<string, any>;
  sortBy?: "newest" | "oldest" | "amount_asc" | "amount_desc";
  lte?: Record<string, any>;
  gte?: Record<string, any>;
}

/**
 * Response for fetching transactions
 */
export interface GetTransactionsResponse {
  success: boolean;
  data?: Transaction[];
  total?: number;
  currentPage?: number;
  pageSize?: number;
  totalPages?: number;
  error?: string;
}

/**
 * Fetch all transactions for a user
 */
export async function getTransactionsByUser(userId: string): Promise<{
  success: boolean;
  data?: Transaction[];
  error?: string;
}> {
  try {
    // First, fetch transactions
    const { data, error } = await (supabase as any)
      .from("transactions")
      .select("*")
      .eq("user_id", userId)
      .order("transaction_date", { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return {
      success: true,
      data: data as Transaction[],
    };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Fetch single transaction by ID
 */
export async function getTransactionById(id: string): Promise<{
  success: boolean;
  data?: Transaction;
  error?: string;
}> {
  try {
    const { data, error } = await (supabase as any)
      .from("transactions")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return {
      success: true,
      data: data || undefined,
    };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Fetch transactions with pagination and filtering
 */
export async function getTransactions(
  request: GetTransactionsRequest,
): Promise<GetTransactionsResponse> {
  try {
    const {
      pageParam = 1,
      pageSize = 3,
      search = "",
      filters = {},
      sortBy = "newest",
      lte = {},
      gte = {},
    } = request;

    // Determine sort column and direction
    let sortColumn = "transaction_date";
    let sortOrder: "asc" | "desc" = "desc";

    if (sortBy === "oldest") {
      sortColumn = "created_at";
      sortOrder = "asc";
    } else if (sortBy === "amount_asc") {
      sortColumn = "amount";
      sortOrder = "asc";
    } else if (sortBy === "amount_desc") {
      sortColumn = "amount";
      sortOrder = "desc";
    }

    // Convert search string to SearchConfig format
    const searchConfig: SearchConfig[] = search
      ? [
          { column: "transaction_number", query: search },
          { column: "description", query: search },
          { column: "notes", query: search },
        ]
      : [];

    const result = await fetchData<Transaction>("transactions", {
      filters: { ...filters },
      search: searchConfig,
      sort: [sortColumn, sortOrder],
      page: pageParam,
      pageSize,
      total: { count: "exact" },
      lte,
      gte,
    });

    if (!result.success) {
      throw new Error(result.error || "Failed to fetch transactions");
    }

    const data = result.data as Transaction[];
    const count = result.count || 0;

    // Compute displayAmount: show net_amount if status is 'paid' and net_amount differs from amount
    const dataWithDisplayAmount = data.map((tx) => ({
      ...tx,
      displayAmount:
        tx.status === "paid" &&
        tx.net_amount != null &&
        tx.net_amount !== tx.amount
          ? tx.net_amount
          : tx.amount,
    }));

    return {
      success: true,
      data: dataWithDisplayAmount as Transaction[],
      total: count,
      currentPage: pageParam,
      pageSize,
      totalPages: Math.ceil(count / pageSize),
    };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Fetch transactions with pagination (legacy function for backward compatibility)
 */
export async function getTransactionsPaginated(
  userId: string,
  page: number = 1,
  pageSize: number = 10,
): Promise<GetTransactionsResponse> {
  return getTransactions({ user: { id: userId }, pageParam: page, pageSize });
}

/**
 * Helper: Verify user role from database
 */
async function getUserRole(userId: string): Promise<string> {
  try {
    const { data: user, error } = await (supabase as any)
      .from("users")
      .select("role")
      .eq("id", userId)
      .single();

    if (error || !user) {
      throw new Error("User not found");
    }

    return user.role;
  } catch (error) {
    throw new Error("Failed to verify user permissions");
  }
}

/**
 * Approve a transaction - changes status from 'pending' to 'approved'
 * Only owner can approve - role verified on server
 */
export async function approveTransaction(
  transactionId: string,
  userId: string,
  notes?: string,
): Promise<{
  success: boolean;
  message?: string;
  error?: string;
}> {
  try {
    // ✅ Server-side role verification
    const userRole = await getUserRole(userId);
    if (userRole !== "owner") {
      throw new Error(
        `Permission denied: Only owner can approve. Your role: ${userRole}`,
      );
    }

    // Fetch transaction to verify status
    const { data: transaction, error: fetchError } = await (supabase as any)
      .from("transactions")
      .select("*")
      .eq("id", transactionId)
      .single();

    if (fetchError || !transaction) {
      throw new Error(
        `Transaction not found (ID: ${transactionId}, Error: ${fetchError?.message || "No transaction returned"})`,
      );
    }

    if (transaction.status !== "pending") {
      throw new Error(
        `Transaction cannot be approved from ${transaction.status} status`,
      );
    }

    // Update transaction
    const { error: updateError } = await (supabase as any)
      .from("transactions")
      .update({
        status: "approved",
        approved_by: userId,
        approved_at: new Date().toISOString(),
        notes: notes || null,
        status_changed_at: new Date().toISOString(),
        status_changed_by: userId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", transactionId);

    if (updateError) {
      throw updateError;
    }
    return { success: true, message: "Transaction approved successfully" };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return { success: false, error: errorMessage };
  }
}

/**
 * Reject a transaction - changes status from 'pending' to 'rejected'
 * Only owner can reject - role verified on server
 */
export async function rejectTransaction(
  transactionId: string,
  userId: string,
  reason: string,
): Promise<{
  success: boolean;
  message?: string;
  error?: string;
}> {
  try {
    // ✅ Server-side role verification
    const userRole = await getUserRole(userId);
    if (userRole !== "owner") {
      throw new Error(
        `Permission denied: Only owner can reject. Your role: ${userRole}`,
      );
    }

    // Fetch transaction to verify status
    const { data: transaction, error: fetchError } = await (supabase as any)
      .from("transactions")
      .select("*")
      .eq("id", transactionId)
      .single();

    if (fetchError || !transaction) {
      throw new Error(
        `Transaction not found (ID: ${transactionId}, Error: ${fetchError?.message || "No transaction returned"})`,
      );
    }

    if (transaction.status !== "pending") {
      throw new Error(
        `Transaction cannot be rejected from ${transaction.status} status. Only 'pending' transactions can be rejected.`,
      );
    }

    // Update transaction
    const { error: updateError } = await (supabase as any)
      .from("transactions")
      .update({
        status: "rejected",
        rejected_by: userId,
        rejected_at: new Date().toISOString(),
        error_message: reason,
        failed_at: new Date().toISOString(),
        status_changed_at: new Date().toISOString(),
        status_changed_by: userId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", transactionId);

    if (updateError) {
      throw updateError;
    }
    return { success: true, message: "Transaction rejected successfully" };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return { success: false, error: errorMessage };
  }
}

/**
 * Pay a transaction - changes status from 'approved' to 'paid'
 * Only admin can pay - role verified on server
 */
export async function payTransaction(
  transactionId: string,
  userId: string,
  bankReference?: string,
  netAmount?: string,
): Promise<{
  success: boolean;
  message?: string;
  error?: string;
}> {
  try {
    // ✅ Server-side role verification
    const userRole = await getUserRole(userId);
    if (userRole == "user") {
      throw new Error(
        `Permission denied: Only admin can pay. Your role: ${userRole}`,
      );
    }

    // Fetch transaction to verify status
    const { data: transaction, error: fetchError } = await (supabase as any)
      .from("transactions")
      .select("*")
      .eq("id", transactionId)
      .single();

    if (fetchError || !transaction) {
      throw new Error(
        `Transaction not found (ID: ${transactionId}, Error: ${fetchError?.message || "No transaction returned"})`,
      );
    }

    if (transaction.status !== "approved") {
      throw new Error(
        `Transaction cannot be paid from ${transaction.status} status`,
      );
    }

    // Update transaction
    const { error: updateError } = await (supabase as any)
      .from("transactions")
      .update({
        status: "paid",
        status_changed_at: new Date().toISOString(),
        status_changed_by: userId,
        processed_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
        net_amount: netAmount ? parseFloat(netAmount) : null,
        description: bankReference
          ? `Paid with reference: ${bankReference}`
          : "Payment processed",
        updated_at: new Date().toISOString(),
      })
      .eq("id", transactionId);

    if (updateError) {
      throw updateError;
    }
    return { success: true, message: "Transaction paid successfully" };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return { success: false, error: errorMessage };
  }
}
