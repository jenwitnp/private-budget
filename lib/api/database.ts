import { supabase, getSupabaseAdmin } from "@/lib/supabaseClient";
import { Database } from "@/lib/database.types";
import type {
  User,
  UserInsert,
  UserUpdate,
  BankAccount,
  BankAccountInsert,
  BankAccountUpdate,
  Transaction,
  TransactionInsert,
  TransactionUpdate,
} from "@/lib/database.types";

// ============================================================================
// USER OPERATIONS
// ============================================================================

export const getUserById = async (id: string): Promise<User | null> => {
  try {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error fetching user:", error);
    return null;
  }
};

export const getUserByEmail = async (email: string): Promise<User | null> => {
  try {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .single();

    if (error && error.code !== "PGRST116") throw error; // PGRST116 = no rows
    return data || null;
  } catch (error) {
    console.error("Error fetching user by email:", error);
    return null;
  }
};

export const updateUser = async (
  id: string,
  updates: UserUpdate,
): Promise<User | null> => {
  try {
    const { data, error } = await (supabase.from("users") as any)
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error updating user:", error);
    return null;
  }
};

export const updateUserBalance = async (
  userId: string,
  amount: number,
): Promise<boolean> => {
  try {
    // Update user balance directly in the users table
    const { data: user } = await (supabase.from("users") as any)
      .select("balance")
      .eq("id", userId)
      .single();

    if (!user) return false;

    const newBalance = (user.balance || 0) + amount;
    const { error } = await (supabase.from("users") as any)
      .update({ balance: newBalance })
      .eq("id", userId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Error updating user balance:", error);
    return false;
  }
};

export const getUserSummary = async (id: string) => {
  try {
    const { data, error } = await supabase
      .from("user_summary")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error fetching user summary:", error);
    return null;
  }
};

// ============================================================================
// BANK ACCOUNT OPERATIONS
// ============================================================================

export const getUserBankAccounts = async (
  userId: string,
): Promise<BankAccount[]> => {
  try {
    const { data, error } = await supabase
      .from("bank_accounts")
      .select("*")
      .eq("user_id", userId)
      .is("deleted_at", null)
      .order("is_primary", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error fetching bank accounts:", error);
    return [];
  }
};

export const getBankAccountById = async (
  id: string,
): Promise<BankAccount | null> => {
  try {
    const { data, error } = await supabase
      .from("bank_accounts")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error fetching bank account:", error);
    return null;
  }
};

export const createBankAccount = async (
  account: BankAccountInsert,
): Promise<BankAccount | null> => {
  try {
    const { data, error } = await (supabase.from("bank_accounts") as any)
      .insert(account)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error creating bank account:", error);
    return null;
  }
};

export const updateBankAccount = async (
  id: string,
  updates: BankAccountUpdate,
): Promise<BankAccount | null> => {
  try {
    const { data, error } = await (supabase.from("bank_accounts") as any)
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error updating bank account:", error);
    return null;
  }
};

export const deleteBankAccount = async (id: string): Promise<boolean> => {
  try {
    const { error } = await (supabase.from("bank_accounts") as any)
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Error deleting bank account:", error);
    return false;
  }
};

export const setPrimaryBankAccount = async (
  userId: string,
  accountId: string,
): Promise<boolean> => {
  try {
    // First, unset all primary accounts for user
    await (supabase.from("bank_accounts") as any)
      .update({ is_primary: false })
      .eq("user_id", userId);

    // Then set new primary account
    const { error } = await (supabase.from("bank_accounts") as any)
      .update({ is_primary: true })
      .eq("id", accountId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Error setting primary bank account:", error);
    return false;
  }
};

// ============================================================================
// TRANSACTION OPERATIONS
// ============================================================================

export const getUserTransactions = async (
  userId: string,
  limit: number = 20,
  offset: number = 0,
): Promise<Transaction[]> => {
  try {
    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .eq("user_id", userId)
      .order("transaction_date", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return [];
  }
};

export const getTransactionById = async (
  id: string,
): Promise<Transaction | null> => {
  try {
    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error fetching transaction:", error);
    return null;
  }
};

export const createTransaction = async (
  transaction: TransactionInsert,
): Promise<Transaction | null> => {
  try {
    // Generate transaction number
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000);
    const transactionNumber = `TRX${timestamp}${random}`;

    const { data, error } = await (supabase.from("transactions") as any)
      .insert({
        ...transaction,
        transaction_number: transactionNumber,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error creating transaction:", error);
    return null;
  }
};

export const updateTransactionStatus = async (
  id: string,
  status: Database["public"]["Enums"]["transaction_status"],
  userId: string,
): Promise<Transaction | null> => {
  try {
    const { data, error } = await (supabase.from("transactions") as any)
      .update({
        status: status,
        status_changed_at: new Date().toISOString(),
        status_changed_by: userId,
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    // Record audit trail
    if (data) {
      await (supabase.from("transaction_audit") as any).insert({
        transaction_id: id,
        new_status: status,
        changed_by: userId,
      });
    }

    return data;
  } catch (error) {
    console.error("Error updating transaction status:", error);
    return null;
  }
};

export const getTransactionsByBankAccount = async (
  bankAccountId: string,
  limit: number = 20,
): Promise<Transaction[]> => {
  try {
    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .eq("bank_account_id", bankAccountId)
      .order("transaction_date", { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error fetching transactions by bank account:", error);
    return [];
  }
};

export const getTransactionsByStatus = async (
  userId: string,
  status: Database["public"]["Enums"]["transaction_status"],
  limit: number = 20,
): Promise<Transaction[]> => {
  try {
    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .eq("user_id", userId)
      .eq("status", status)
      .order("transaction_date", { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error fetching transactions by status:", error);
    return [];
  }
};

// ============================================================================
// TRANSACTION SUMMARY OPERATIONS
// ============================================================================

export const getMonthlyTransactionSummary = async (
  userId: string,
): Promise<any[]> => {
  try {
    const { data, error } = await supabase
      .from("monthly_transaction_summary")
      .select("*")
      .eq("user_id", userId)
      .order("month", { ascending: false })
      .limit(12);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error fetching monthly summary:", error);
    return [];
  }
};

export const getDailyTransactionSummary = async (
  userId: string,
  days: number = 30,
): Promise<any[]> => {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
      .from("daily_transaction_summary")
      .select("*")
      .eq("user_id", userId)
      .gte("day", startDate.toISOString().split("T")[0])
      .order("day", { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error fetching daily summary:", error);
    return [];
  }
};

// ============================================================================
// WITHDRAWAL LIMITS OPERATIONS
// ============================================================================

export const getUserWithdrawalLimits = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from("withdrawal_limits")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (error && error.code !== "PGRST116") throw error;
    return data || null;
  } catch (error) {
    console.error("Error fetching withdrawal limits:", error);
    return null;
  }
};

export const checkWithdrawalLimit = async (
  userId: string,
  amount: number,
): Promise<{ allowed: boolean; reason?: string }> => {
  try {
    const limits = await getUserWithdrawalLimits(userId);

    if (!limits) {
      return { allowed: true };
    }

    if (limits.per_transaction_limit && amount > limits.per_transaction_limit) {
      return {
        allowed: false,
        reason: `Transaction exceeds per-transaction limit of ${limits.per_transaction_limit}`,
      };
    }

    if (limits.daily_used + amount > limits.daily_limit) {
      return {
        allowed: false,
        reason: `Transaction exceeds daily limit. Available: ${limits.daily_limit - limits.daily_used}`,
      };
    }

    if (limits.monthly_used + amount > limits.monthly_limit) {
      return {
        allowed: false,
        reason: `Transaction exceeds monthly limit. Available: ${limits.monthly_limit - limits.monthly_used}`,
      };
    }

    return { allowed: true };
  } catch (error) {
    console.error("Error checking withdrawal limits:", error);
    return { allowed: false, reason: "Error checking limits" };
  }
};

// ============================================================================
// NOTIFICATION OPERATIONS
// ============================================================================

export const createNotification = async (
  userId: string,
  title: string,
  message: string,
  type: string,
  relatedTransactionId?: string,
) => {
  try {
    const { data, error } = await (supabase.from("notifications") as any)
      .insert({
        user_id: userId,
        title,
        message,
        type,
        related_transaction_id: relatedTransactionId,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error creating notification:", error);
    return null;
  }
};

export const getUserNotifications = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return [];
  }
};

export const markNotificationAsRead = async (notificationId: string) => {
  try {
    const { error } = await (supabase.from("notifications") as any)
      .update({
        is_read: true,
        read_at: new Date().toISOString(),
      })
      .eq("id", notificationId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Error marking notification as read:", error);
    return false;
  }
};

// ============================================================================
// AUDIT LOG OPERATIONS
// ============================================================================

export const createAuditLog = async (
  action: string,
  entityType: string,
  entityId: string,
  changes: any,
  userId?: string,
) => {
  try {
    const { error } = await (supabase.from("audit_logs") as any).insert({
      user_id: userId,
      action,
      entity_type: entityType,
      entity_id: entityId,
      changes: changes,
    });

    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Error creating audit log:", error);
    return false;
  }
};

// ============================================================================
// ADMIN OPERATIONS
// ============================================================================

export const getAllUsers = async (limit: number = 50) => {
  try {
    const admin = getSupabaseAdmin();
    const { data, error } = await admin
      .from("users")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error fetching all users:", error);
    return [];
  }
};

export const updateUserStatus = async (
  userId: string,
  status: Database["public"]["Enums"]["user_status"],
) => {
  try {
    const admin = getSupabaseAdmin();
    const { data, error } = await (admin.from("users") as any)
      .update({ status })
      .eq("id", userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error updating user status:", error);
    return null;
  }
};

export const getUserTransactionHistory = async (userId: string) => {
  try {
    const admin = getSupabaseAdmin();
    const { data, error } = await admin
      .from("transactions")
      .select("*")
      .eq("user_id", userId)
      .order("transaction_date", { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error fetching user transaction history:", error);
    return [];
  }
};

// ============================================================================
// REAL-TIME SUBSCRIPTIONS (Optional)
// ============================================================================

export const subscribeToUserTransactions = (
  userId: string,
  callback: (data: Transaction) => void,
) => {
  return supabase
    .channel(`user_transactions_${userId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "transactions",
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        callback(payload.new as Transaction);
      },
    )
    .subscribe();
};

export const subscribeToNotifications = (
  userId: string,
  callback: (data: any) => void,
) => {
  return supabase
    .channel(`notifications_${userId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "notifications",
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        callback(payload.new);
      },
    )
    .subscribe();
};
