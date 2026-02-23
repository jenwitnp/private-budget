/**
 * Permission System Architecture
 *
 * This file defines all permissions and their role mappings.
 * Easily extensible for adding new permissions in the future.
 */

export type UserRole = "user" | "owner" | "admin";

export type TransactionPermission =
  | "view_own_transactions"
  | "view_all_transactions"
  | "approve_transaction"
  | "reject_transaction"
  | "pay_transaction"
  | "create_transaction";

export type PermissionKey = TransactionPermission;

/**
 * Permission matrix: Define which roles have which permissions
 * Easy to modify and extend for future permissions
 */
export const PERMISSIONS: Record<UserRole, PermissionKey[]> = {
  user: ["view_own_transactions", "create_transaction"],

  owner: [
    "view_own_transactions",
    "view_all_transactions",
    "create_transaction",
    "approve_transaction",
    "reject_transaction",
  ],

  admin: [
    "view_own_transactions",
    "view_all_transactions",
    "create_transaction",
    "pay_transaction",
  ],
};

/**
 * Feature-based permissions for future extensibility
 * Example: Can add 'reports', 'settings', 'users', etc.
 */
export const FEATURE_PERMISSIONS: Record<string, Record<UserRole, boolean>> = {
  // Transactions feature
  transactions: {
    user: true,
    owner: true,
    admin: true,
  },

  // Reports feature (example for future)
  reports: {
    user: false,
    owner: true,
    admin: true,
  },

  // User management (example for future)
  user_management: {
    user: false,
    owner: false,
    admin: true,
  },
};

/**
 * Action-specific rules for complex permission logic
 * Use this for business logic that can't be simply role-based
 */
export const ACTION_RULES: Record<
  string,
  (role: UserRole, context?: any) => boolean
> = {
  /**
   * Can user view a specific transaction?
   * Rules:
   * - User can only see their own
   * - Owner and admin can see all
   */
  view_transaction: (
    role: UserRole,
    context?: { userId?: string; transactionUserId?: string },
  ) => {
    if (role === "user") {
      // User can only view if it's their own transaction
      return context?.userId === context?.transactionUserId;
    }
    return true; // owner and admin can view all
  },

  /**
   * Can user approve transaction?
   * Rules:
   * - Only owner can approve
   * - Transaction must be in 'pending' status
   */
  approve_transaction: (role: UserRole, context?: { status?: string }) => {
    if (role !== "owner") return false;
    return context?.status === "pending";
  },

  /**
   * Can user reject transaction?
   * Rules:
   * - Only owner can reject
   * - Transaction must be in 'pending' or 'approved' status
   */
  reject_transaction: (role: UserRole, context?: { status?: string }) => {
    if (role !== "owner") return false;
    return context?.status === "pending" || context?.status === "approved";
  },

  /**
   * Can user pay transaction?
   * Rules:
   * - Only admin can pay
   * - Transaction must be in 'approved' status
   */
  pay_transaction: (role: UserRole, context?: { status?: string }) => {
    if (role !== "admin") return false;
    return context?.status === "approved";
  },
};

/**
 * UI-related permission constants
 * For showing/hiding buttons, menus, etc.
 */
export const UI_PERMISSIONS: Record<string, Record<UserRole, boolean>> = {
  show_approve_button: {
    user: false,
    owner: true,
    admin: false,
  },

  show_reject_button: {
    user: false,
    owner: true,
    admin: false,
  },

  show_pay_button: {
    user: false,
    owner: false,
    admin: true,
  },

  show_create_withdrawal: {
    user: true,
    owner: true,
    admin: false,
  },

  show_admin_panel: {
    user: false,
    owner: false,
    admin: true,
  },

  show_owner_panel: {
    user: false,
    owner: true,
    admin: false,
  },
};
