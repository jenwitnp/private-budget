"use server";

import { supabase } from "@/lib/supabaseClient";

export interface BankAccount {
  id: string;
  user_id: string;
  account_number: string;
  account_name: string;
  account_type: "savings" | "checking" | "fixed";
  bank: string;
  bank_name?: string;
  branch_name?: string;
  account_holder_name?: string;
  account_holder_id?: string;
  is_primary: boolean;
  is_active: boolean;
  verified: boolean;
  verified_at?: string;
  account_balance: number;
  created_at: string;
  updated_at: string;
}

export interface CreateBankAccountInput {
  account_number: string;
  account_name: string;
  account_type: "savings" | "checking" | "fixed";
  bank: string;
  bank_name?: string;
  branch_name?: string;
  account_holder_name?: string;
  account_holder_id?: string;
}

/**
 * Get all bank accounts for current user
 */
export async function getBankAccounts(userId: string): Promise<{
  success: boolean;
  data?: BankAccount[];
  error?: string;
}> {
  try {
    console.log("📋 [BANK_ACCOUNTS] Fetching accounts for user:", userId);

    const { data, error } = await (supabase as any)
      .from("bank_accounts")
      .select("*")
      .eq("user_id", userId)
      .is("deleted_at", null)
      .order("is_primary", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) {
      console.error("❌ [BANK_ACCOUNTS] Fetch error:", error.message);
      return { success: false, error: error.message };
    }

    console.log(`✅ [BANK_ACCOUNTS] Fetched ${data?.length || 0} accounts`);
    return { success: true, data: data || [] };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    console.error("❌ [BANK_ACCOUNTS] Error:", errorMessage);
    return { success: false, error: errorMessage };
  }
}

/**
 * Get active bank accounts for current user (for dropdown/select)
 */
export async function getActiveBankAccounts(
  userId: string,
): Promise<BankAccount[]> {
  try {
    console.log(
      "📋 [BANK_ACCOUNTS] Fetching active accounts for user:",
      userId,
    );

    const { data, error } = await (supabase as any)
      .from("bank_accounts")
      .select("*")
      .eq("user_id", userId)
      .eq("is_active", true)
      .is("deleted_at", null)
      .order("is_primary", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) {
      console.error("❌ [BANK_ACCOUNTS] Fetch error:", error.message);
      throw new Error(error.message);
    }

    console.log(
      `✅ [BANK_ACCOUNTS] Fetched ${data?.length || 0} active accounts`,
    );
    return data || [];
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    console.error("❌ [BANK_ACCOUNTS] Error:", errorMessage);
    throw err;
  }
}

/**
 * Get single bank account by ID
 */
export async function getBankAccountById(id: string): Promise<{
  success: boolean;
  data?: BankAccount;
  error?: string;
}> {
  try {
    console.log("📋 [BANK_ACCOUNTS] Fetching account:", id);

    const { data, error } = await (supabase as any)
      .from("bank_accounts")
      .select("*")
      .eq("id", id)
      .is("deleted_at", null)
      .single();

    if (error) {
      console.error("❌ [BANK_ACCOUNTS] Fetch error:", error.message);
      return { success: false, error: error.message };
    }

    console.log("✅ [BANK_ACCOUNTS] Account fetched:", data?.account_name);
    return { success: true, data };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    console.error("❌ [BANK_ACCOUNTS] Error:", errorMessage);
    return { success: false, error: errorMessage };
  }
}

/**
 * Create new bank account
 */
export async function createBankAccount(
  userId: string,
  input: CreateBankAccountInput,
): Promise<{
  success: boolean;
  data?: BankAccount;
  error?: string;
}> {
  try {
    console.log("➕ [BANK_ACCOUNTS] Creating account:", {
      userId,
      input,
      bankValue: input.bank,
      bankType: typeof input.bank,
    });

    if (!input.account_number || input.account_number.trim() === "") {
      return { success: false, error: "Account number is required" };
    }

    if (!input.bank || input.bank.trim() === "") {
      return { success: false, error: "Bank is required" };
    }

    // Check if account already exists
    const { data: existing } = await (supabase as any)
      .from("bank_accounts")
      .select("id")
      .eq("user_id", userId)
      .eq("account_number", input.account_number)
      .is("deleted_at", null)
      .single();

    if (existing) {
      return { success: false, error: "This account number already exists" };
    }

    // Check if user has primary account
    const { data: hasPrimary } = await (supabase as any)
      .from("bank_accounts")
      .select("id")
      .eq("user_id", userId)
      .eq("is_primary", true)
      .is("deleted_at", null)
      .single();

    const isPrimary = !hasPrimary;

    console.log("📝 [BANK_ACCOUNTS] Inserting data:", {
      user_id: userId,
      account_name: input.account_name,
      bank: input.bank,
      is_primary: isPrimary,
    });

    const { data, error } = await (supabase as any)
      .from("bank_accounts")
      .insert([
        {
          user_id: userId,
          ...input,
          is_primary: isPrimary,
          is_active: true,
          verified: false,
          account_balance: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("❌ [BANK_ACCOUNTS] Create error:", error.message);
      return { success: false, error: error.message };
    }

    console.log("✅ [BANK_ACCOUNTS] Account created:", data?.account_name);
    return { success: true, data };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    console.error("❌ [BANK_ACCOUNTS] Error:", errorMessage);
    return { success: false, error: errorMessage };
  }
}

/**
 * Update bank account
 */
export async function updateBankAccount(
  id: string,
  input: Partial<CreateBankAccountInput>,
): Promise<{
  success: boolean;
  data?: BankAccount;
  error?: string;
}> {
  try {
    console.log("✏️  [BANK_ACCOUNTS] Updating account:", id);

    const { data, error } = await (supabase as any)
      .from("bank_accounts")
      .update({
        ...input,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("❌ [BANK_ACCOUNTS] Update error:", error.message);
      return { success: false, error: error.message };
    }

    console.log("✅ [BANK_ACCOUNTS] Account updated:", data?.account_name);
    return { success: true, data };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    console.error("❌ [BANK_ACCOUNTS] Error:", errorMessage);
    return { success: false, error: errorMessage };
  }
}

/**
 * Set account as primary
 */
export async function setPrimaryBankAccount(
  userId: string,
  accountId: string,
): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    console.log("⭐ [BANK_ACCOUNTS] Setting primary account:", accountId);

    // Remove primary from other accounts
    const { error: updateError } = await (supabase as any)
      .from("bank_accounts")
      .update({ is_primary: false })
      .eq("user_id", userId)
      .eq("is_primary", true);

    if (updateError) {
      console.error("❌ [BANK_ACCOUNTS] Error:", updateError.message);
      return { success: false, error: updateError.message };
    }

    // Set as primary
    const { error: setPrimaryError } = await (supabase as any)
      .from("bank_accounts")
      .update({ is_primary: true })
      .eq("id", accountId);

    if (setPrimaryError) {
      console.error("❌ [BANK_ACCOUNTS] Error:", setPrimaryError.message);
      return { success: false, error: setPrimaryError.message };
    }

    console.log("✅ [BANK_ACCOUNTS] Primary account updated");
    return { success: true };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    console.error("❌ [BANK_ACCOUNTS] Error:", errorMessage);
    return { success: false, error: errorMessage };
  }
}

/**
 * Soft delete bank account
 * Owner/Admin can delete any account, users can only delete their own
 */
export async function deleteBankAccount(
  id: string,
  userId?: string,
  userRole?: "owner" | "admin" | "user",
): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    console.log(
      "🗑️  [BANK_ACCOUNTS] Deleting account:",
      id,
      "by user:",
      userId,
      "role:",
      userRole,
    );

    // If user role is provided and not owner/admin, verify account ownership
    if (userRole && userRole !== "owner" && userRole !== "admin" && userId) {
      const { data: account } = await (supabase as any)
        .from("bank_accounts")
        .select("user_id")
        .eq("id", id)
        .single();

      if (!account || account.user_id !== userId) {
        console.warn("퉪️  [BANK_ACCOUNTS] Unauthorized delete attempt");
        return {
          success: false,
          error: "Unauthorized: You can only delete your own accounts",
        };
      }
    }

    const { error } = await (supabase as any)
      .from("bank_accounts")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id);

    if (error) {
      console.error("❌ [BANK_ACCOUNTS] Delete error:", error.message);
      return { success: false, error: error.message };
    }

    console.log("✅ [BANK_ACCOUNTS] Account deleted:", id);
    return { success: true };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    console.error("❌ [BANK_ACCOUNTS] Error:", errorMessage);
    return { success: false, error: errorMessage };
  }
}
