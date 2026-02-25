/**
 * Type definitions for database views
 * Generated from: transactions_detail.sql and transactions_detail_with_categories.sql
 */

/**
 * Complete transaction detail from transactions_detail view
 * Includes all related information: user, bank account, location, workflow
 */
export interface TransactionDetail {
  // Transaction basic info
  id: string;
  transaction_number: string;
  amount: number;
  currency: string;
  status: "pending" | "approved" | "rejected" | "paid";
  item_name: string | null;
  description: string | null;
  notes: string | null;
  payment_method: string | null;
  transaction_date: string;
  created_at: string;
  updated_at: string;

  // User information (transaction creator)
  user_id: string;
  user_username: string;
  user_first_name: string | null;
  user_last_name: string | null;
  user_full_name: string | null;
  user_email: string | null;
  user_phone: string | null;
  user_id_card: string | null;
  user_role: "owner" | "admin" | "user" | null;

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

  // Location information - Districts
  district_id: number | null;
  district_name: string | null;
  province: string | null;

  // Location information - Sub-districts
  sub_district_id: number | null;
  sub_district_name: string | null;
  villages_count: number | null;

  // Approval workflow
  approved_by_id: string | null;
  approved_by_name: string | null;
  approved_by_username: string | null;
  approved_at: string | null;

  // Rejection workflow
  rejected_by_id: string | null;
  rejected_by_name: string | null;
  rejected_by_username: string | null;
  rejected_at: string | null;

  // Payment workflow
  paid_by_id: string | null;
  paid_by_name: string | null;
  paid_by_username: string | null;
  paid_at: string | null;

  // Creation audit
  created_by_id: string | null;
  created_by_name: string | null;

  // Transaction status details
  fee_amount: number | null;
  net_amount: number | null;
  error_code: string | null;
  error_message: string | null;
  ip_address: string | null;
  user_agent: string | null;
}

/**
 * Enhanced transaction detail with category information
 * From: transactions_detail_with_categories view
 * Extends TransactionDetail with category fields
 */
export interface TransactionDetailWithCategory extends TransactionDetail {
  // Category information (optional)
  category_id: string | null;
  category_name: string | null;
  category_description: string | null;
  category_color: string | null;
  category_icon: string | null;
}

/**
 * Summary type for list views
 * Shows key transaction fields without all details
 */
export interface TransactionSummary {
  id: string;
  transaction_number: string;
  user_full_name: string | null;
  amount: number;
  status: string;
  district_name: string | null;
  bank_name: string | null;
  account_number: string | null;
  transaction_date: string;
  approved_by_name: string | null;
  approved_at: string | null;
}

/**
 * Approval audit trail type
 * Shows the workflow history for a transaction
 */
export interface TransactionAuditTrail {
  id: string;
  transaction_number: string;
  user_full_name: string | null;
  amount: number;
  status: string;
  created_at: string;
  approved_by_name: string | null;
  approved_at: string | null;
  rejected_by_name: string | null;
  rejected_at: string | null;
  paid_by_name: string | null;
  paid_at: string | null;
}

/**
 * Bank account statistics type
 * Used for bank account usage analytics
 */
export interface BankAccountStats {
  bank_name: string | null;
  account_number: string | null;
  account_holder_name: string | null;
  usage_count: number;
  total_amount: number;
  avg_amount: number;
  last_used: string | null;
}

/**
 * User activity statistics type
 * Used for user analytics and reporting
 */
export interface UserActivityStats {
  user_full_name: string | null;
  user_email: string | null;
  total_transactions: number;
  total_amount: number;
  paid_count: number;
  pending_count: number;
  last_transaction: string | null;
}

/**
 * Category statistics type
 * Used for category analytics (requires category support)
 */
export interface CategoryStats {
  category_name: string | null;
  category_color: string | null;
  count: number;
  total_amount: number;
  max_transaction_date: string | null;
}

/**
 * Location-based transaction type
 * Used for regional/district analytics
 */
export interface LocationTransactionStats {
  province: string | null;
  district_name: string | null;
  sub_district_name: string | null;
  transaction_count: number;
  total_amount: number;
  avg_amount: number;
}

/**
 * Helper type for query builders
 * Defines which fields are available in each view
 */
export type TransactionDetailFields = keyof TransactionDetail;
export type TransactionDetailWithCategoryFields =
  keyof TransactionDetailWithCategory;
