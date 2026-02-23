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
  currency: string;
  description: string | null;
  notes: string | null;
  status: "success" | "pending" | "cancelled" | "processing";
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
    console.log("📋 [TRANSACTIONS] Fetching transactions for user:", userId);

    // First, fetch transactions
    const { data, error } = await (supabase as any)
      .from("transactions")
      .select("*")
      .eq("user_id", userId)
      .order("transaction_date", { ascending: false });

    if (error) {
      console.error("❌ [TRANSACTIONS] Fetch error:", error.message);
      throw new Error(error.message);
    }

    console.log(
      `✅ [TRANSACTIONS] Fetched ${data?.length || 0} transactions for user`,
    );

    return {
      success: true,
      data: data as Transaction[],
    };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    console.error("❌ [TRANSACTIONS] Error:", errorMessage);
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
    console.log("📋 [TRANSACTIONS] Fetching transaction:", id);

    const { data, error } = await (supabase as any)
      .from("transactions")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error("❌ [TRANSACTIONS] Fetch error:", error.message);
      throw new Error(error.message);
    }

    console.log("✅ [TRANSACTIONS] Fetched transaction:", id);

    return {
      success: true,
      data: data || undefined,
    };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    console.error("❌ [TRANSACTIONS] Error:", errorMessage);
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
    } = request;

    // Determine sort column and direction
    let sortColumn = "transaction_date";
    let sortOrder: "asc" | "desc" = "desc";

    if (sortBy === "oldest") {
      sortColumn = "transaction_date";
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
    });

    if (!result.success) {
      console.error("❌ [TRANSACTIONS] Fetch error:", result.error);
      throw new Error(result.error || "Failed to fetch transactions");
    }

    const data = result.data as Transaction[];
    const count = result.count || 0;

    console.log(
      `✅ [TRANSACTIONS] Fetched page ${pageParam} with ${data?.length || 0} transactions`,
    );

    return {
      success: true,
      data: data as Transaction[],
      total: count,
      currentPage: pageParam,
      pageSize,
      totalPages: Math.ceil(count / pageSize),
    };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    console.error("❌ [TRANSACTIONS] Error:", errorMessage);
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
    console.error("❌ [TRANSACTIONS] Error fetching user role:", error);
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
    console.log(
      "\n🔄 [WORKFLOW APPROVE] Started",
      "\n├─ transactionId:",
      transactionId,
      "\n├─ userId:",
      userId,
      "\n└─ notes:",
      notes,
    );

    // ✅ Server-side role verification
    console.log("👤 [WORKFLOW APPROVE] Verifying user role...");
    const userRole = await getUserRole(userId);
    console.log("✅ [WORKFLOW APPROVE] User role verified:", userRole);
    if (userRole !== "owner") {
      throw new Error(
        `Permission denied: Only owner can approve. Your role: ${userRole}`,
      );
    }

    // Fetch transaction to verify status
    console.log("📋 [WORKFLOW APPROVE] Fetching transaction from database...");
    const { data: transaction, error: fetchError } = await (supabase as any)
      .from("transactions")
      .select("*")
      .eq("id", transactionId)
      .single();

    console.log(
      "📊 [WORKFLOW APPROVE] Database query result:",
      "\n├─ fetchError:",
      fetchError,
      "\n└─ transaction:",
      transaction,
    );

    if (fetchError || !transaction) {
      console.error(
        "❌ [WORKFLOW APPROVE] Transaction lookup failed:",
        "\n├─ Error:",
        fetchError,
        "\n├─ TransactionId searched:",
        transactionId,
        "\n└─ Transaction found:",
        !!transaction,
      );
      throw new Error(
        `Transaction not found (ID: ${transactionId}, Error: ${fetchError?.message || "No transaction returned"})`,
      );
    }
    console.log(
      "✅ [WORKFLOW APPROVE] Transaction found, status:",
      transaction.status,
    );

    if (transaction.status !== "pending") {
      throw new Error(
        `Transaction cannot be approved from ${transaction.status} status`,
      );
    }

    // Update transaction
    console.log("💾 [WORKFLOW APPROVE] Updating transaction in database...");
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
      console.error(
        "❌ [WORKFLOW APPROVE] Update failed:",
        updateError.message,
      );
      throw updateError;
    }

    console.log(
      "✅ [WORKFLOW APPROVE] Successfully approved transaction",
      transactionId,
      "by user:",
      userId,
    );
    return { success: true, message: "Transaction approved successfully" };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error(
      "❌ [WORKFLOW APPROVE] Error:",
      errorMessage,
      "\n─ Full error:",
      error,
    );
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
    console.log(
      "\n🔄 [WORKFLOW REJECT] Started",
      "\n├─ transactionId:",
      transactionId,
      "\n├─ userId:",
      userId,
      "\n└─ reason:",
      reason,
    );

    // ✅ Server-side role verification
    console.log("👤 [WORKFLOW REJECT] Verifying user role...");
    const userRole = await getUserRole(userId);
    console.log("✅ [WORKFLOW REJECT] User role verified:", userRole);
    if (userRole !== "owner") {
      throw new Error(
        `Permission denied: Only owner can reject. Your role: ${userRole}`,
      );
    }

    // Fetch transaction to verify status
    console.log("📋 [WORKFLOW REJECT] Fetching transaction from database...");
    const { data: transaction, error: fetchError } = await (supabase as any)
      .from("transactions")
      .select("*")
      .eq("id", transactionId)
      .single();

    console.log(
      "📊 [WORKFLOW REJECT] Database query result:",
      "\n├─ fetchError:",
      fetchError,
      "\n└─ transaction:",
      transaction,
    );

    if (fetchError || !transaction) {
      console.error(
        "❌ [WORKFLOW REJECT] Transaction lookup failed:",
        "\n├─ Error:",
        fetchError,
        "\n├─ TransactionId searched:",
        transactionId,
        "\n└─ Transaction found:",
        !!transaction,
      );
      throw new Error(
        `Transaction not found (ID: ${transactionId}, Error: ${fetchError?.message || "No transaction returned"})`,
      );
    }
    console.log(
      "✅ [WORKFLOW REJECT] Transaction found, status:",
      transaction.status,
    );

    if (transaction.status !== "pending") {
      throw new Error(
        `Transaction cannot be rejected from ${transaction.status} status`,
      );
    }

    // Update transaction
    console.log("💾 [WORKFLOW REJECT] Updating transaction in database...");
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
      console.error("❌ [WORKFLOW REJECT] Update failed:", updateError.message);
      throw updateError;
    }

    console.log(
      "✅ [WORKFLOW REJECT] Successfully rejected transaction",
      transactionId,
      "by user:",
      userId,
    );
    return { success: true, message: "Transaction rejected successfully" };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error(
      "❌ [WORKFLOW REJECT] Error:",
      errorMessage,
      "\n─ Full error:",
      error,
    );
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
): Promise<{
  success: boolean;
  message?: string;
  error?: string;
}> {
  try {
    console.log(
      "\n🔄 [WORKFLOW PAY] Started",
      "\n├─ transactionId:",
      transactionId,
      "\n├─ userId:",
      userId,
      "\n└─ bankReference:",
      bankReference,
    );

    // ✅ Server-side role verification
    console.log("👤 [WORKFLOW PAY] Verifying user role...");
    const userRole = await getUserRole(userId);
    console.log("✅ [WORKFLOW PAY] User role verified:", userRole);
    if (userRole !== "admin") {
      throw new Error(
        `Permission denied: Only admin can pay. Your role: ${userRole}`,
      );
    }

    // Fetch transaction to verify status
    console.log("📋 [WORKFLOW PAY] Fetching transaction from database...");
    const { data: transaction, error: fetchError } = await (supabase as any)
      .from("transactions")
      .select("*")
      .eq("id", transactionId)
      .single();

    console.log(
      "📊 [WORKFLOW PAY] Database query result:",
      "\n├─ fetchError:",
      fetchError,
      "\n└─ transaction:",
      transaction,
    );

    if (fetchError || !transaction) {
      console.error(
        "❌ [WORKFLOW PAY] Transaction lookup failed:",
        "\n├─ Error:",
        fetchError,
        "\n├─ TransactionId searched:",
        transactionId,
        "\n└─ Transaction found:",
        !!transaction,
      );
      throw new Error(
        `Transaction not found (ID: ${transactionId}, Error: ${fetchError?.message || "No transaction returned"})`,
      );
    }
    console.log(
      "✅ [WORKFLOW PAY] Transaction found, status:",
      transaction.status,
    );

    if (transaction.status !== "approved") {
      throw new Error(
        `Transaction cannot be paid from ${transaction.status} status`,
      );
    }

    // Update transaction
    console.log("💾 [WORKFLOW PAY] Updating transaction in database...");
    const { error: updateError } = await (supabase as any)
      .from("transactions")
      .update({
        status: "paid",
        status_changed_at: new Date().toISOString(),
        status_changed_by: userId,
        processed_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
        description: bankReference
          ? `Paid with reference: ${bankReference}`
          : "Payment processed",
        updated_at: new Date().toISOString(),
      })
      .eq("id", transactionId);

    if (updateError) {
      console.error("❌ [WORKFLOW PAY] Update failed:", updateError.message);
      throw updateError;
    }

    console.log(
      "✅ [WORKFLOW PAY] Successfully paid transaction",
      transactionId,
      "by user:",
      userId,
    );
    return { success: true, message: "Transaction paid successfully" };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error(
      "❌ [WORKFLOW PAY] Error:",
      errorMessage,
      "\n─ Full error:",
      error,
    );
    return { success: false, error: errorMessage };
  }
}
