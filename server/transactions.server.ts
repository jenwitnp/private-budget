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

/**
 * Client-formatted transaction (returned by getTransactions)
 * This is the single source of truth for client data structure
 */
export interface ClientTransaction {
  id: string;
  transactionNumber: string;
  account: string;
  amount: number;
  displayAmount: number;
  itemName: string;
  status: "pending" | "approved" | "rejected" | "paid";
  date: string;
  bankAccount: string;
  userId?: string;
  createdByName?: string;
  approvedByName?: string;
  paidByName?: string;
  paymentMethod?: string;
  categoryName?: string;
  districtName?: string;
}

export interface TransactionWithBankDetails extends Transaction {
  account?: string;
  bankAccount?: string;
}

/**
 * Detailed transaction view with full category and user information
 * This is the enriched view combining transactions with related entities
 */
export interface TransactionDetailWithCategories {
  // Core transaction fields
  id: string;
  transaction_number: string;
  amount: number;
  net_amount: number | null;
  fee_amount: number | null;
  currency: string;
  status: "pending" | "approved" | "rejected" | "paid";
  item_name: string;
  description: string | null;
  notes: string | null;
  payment_method: string | null;
  transaction_date: string;
  created_at: string;
  updated_at: string;

  // User information
  user_id: string;
  user_username: string;
  user_first_name: string;
  user_last_name: string;
  user_full_name: string;
  user_email: string;
  user_phone: string | null;
  user_id_card: string | null;
  user_role: string;

  // Bank account information
  bank_account_id: string | null;
  account_number: string | null;
  account_name: string | null;
  bank: string | null;
  bank_name: string | null;
  branch_name: string | null;
  account_holder_name: string | null;
  account_holder_id_card: string | null;
  bank_account_is_primary: boolean | null;
  bank_account_is_active: boolean | null;
  bank_account_verified: boolean | null;
  account_balance: number | null;

  // District information
  district_id: number | null;
  district_name: string | null;
  province: string | null;

  // Sub-district information
  sub_district_id: number | null;
  sub_district_name: string | null;
  villages_count: number | null;

  // Category information
  category_id: string | null;
  category_name: string | null;
  category_description: string | null;
  category_color: string | null;
  category_icon: string | null;

  // Approval information
  approved_by_id: string | null;
  approved_by_name: string | null;
  approved_by_username: string | null;
  approved_at: string | null;

  // Rejection information
  rejected_by_id: string | null;
  rejected_by_name: string | null;
  rejected_by_username: string | null;
  rejected_at: string | null;

  // Payment information
  paid_by_id: string | null;
  paid_by_name: string | null;
  paid_by_username: string | null;
  paid_at: string | null;

  // Created by information
  created_by_id: string | null;
  created_by_name: string | null;

  // Error information
  error_code: string | null;
  error_message: string | null;
  ip_address: string | null;
  user_agent: string | null;
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
  data?: ClientTransaction[];
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

    const result = await fetchData<TransactionDetailWithCategories>(
      "transactions_detail_with_categories",
      {
        filters: { ...filters },
        search: searchConfig,
        sort: [sortColumn, sortOrder],
        page: pageParam,
        pageSize,
        total: { count: "exact" },
        lte,
        gte,
      },
    );

    if (!result.success) {
      throw new Error(result.error || "Failed to fetch transactions");
    }

    const data = result.data as TransactionDetailWithCategories[];
    const count = result.count || 0;

    // ✅ SINGLE SOURCE OF TRUTH: All formatting happens here on the server
    // Transform database format to component format
    const formattedData = data.map((tx) => {
      const displayAmount =
        tx.status === "paid" &&
        tx.net_amount != null &&
        tx.net_amount !== tx.amount
          ? tx.net_amount
          : tx.amount;

      // Helper to clean empty/whitespace strings
      const cleanName = (name: string | null | undefined): string | undefined => {
        const trimmed = name?.trim();
        return trimmed ? trimmed : undefined;
      };

      return {
        id: tx.id,
        transactionNumber: tx.transaction_number,
        account: tx.account_name || tx.description || "N/A",
        amount: tx.amount,
        displayAmount,
        itemName: tx.item_name || "N/A",
        status: tx.status as "pending" | "approved" | "rejected" | "paid",
        date: tx.transaction_date,
        bankAccount: tx.account_holder_name || tx.account_number || "N/A",
        userId: tx.user_id,
        createdByName: cleanName(tx.created_by_name),
        approvedByName: cleanName(tx.approved_by_name),
        paidByName: cleanName(tx.paid_by_name),
        paymentMethod: tx.payment_method || undefined,
        categoryName: tx.category_name || "N/A",
        districtName: tx.district_name || "N/A",
      };
    });

    return {
      success: true,
      data: formattedData as ClientTransaction[],
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

    // Parse net_amount
    let parsedNetAmount: number | null = null;
    if (netAmount) {
      // Remove currency symbol (฿) and commas if present
      const cleanAmount = String(netAmount)
        .replace(/฿/g, "") // Remove Thai baht symbol
        .replace(/,/g, ""); // Remove commas

      parsedNetAmount = parseFloat(cleanAmount);

      if (isNaN(parsedNetAmount)) {
        parsedNetAmount = null;
      }
    }

    // Prepare update payload
    const updatePayload = {
      status: "paid",
      status_changed_at: new Date().toISOString(),
      status_changed_by: userId,
      processed_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
      net_amount: parsedNetAmount,
      description: bankReference
        ? `Paid with reference: ${bankReference}`
        : "Payment processed",
      updated_at: new Date().toISOString(),
    };

    // Update transaction
    const { error: updateError } = await (supabase as any)
      .from("transactions")
      .update(updatePayload)
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
