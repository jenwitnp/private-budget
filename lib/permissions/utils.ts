/**
 * Permission utility functions
 * Centralized permission checking logic
 */

import {
  UserRole,
  PermissionKey,
  PERMISSIONS,
  ACTION_RULES,
  UI_PERMISSIONS,
  FEATURE_PERMISSIONS,
} from "./config";

/**
 * Check if user has a specific permission
 * @param role - User's role
 * @param permission - Permission to check
 * @returns boolean - Whether user has permission
 */
export function hasPermission(
  role: UserRole,
  permission: PermissionKey,
): boolean {
  return PERMISSIONS[role]?.includes(permission) ?? false;
}

/**
 * Check if user can perform an action with context
 * Use for complex permission logic
 * @param actionName - Action to check (from ACTION_RULES)
 * @param role - User's role
 * @param context - Additional context (transaction status, user IDs, etc.)
 * @returns boolean - Whether user can perform action
 */
export function canPerformAction(
  actionName: string,
  role: UserRole,
  context?: any,
): boolean {
  const rule = ACTION_RULES[actionName];
  if (!rule) {
    console.warn(`No rule defined for action: ${actionName}`);
    return false;
  }
  return rule(role, context);
}

/**
 * Check if UI element should be visible for user
 * @param uiElement - UI element name (from UI_PERMISSIONS)
 * @param role - User's role
 * @returns boolean - Whether element should be shown
 */
export function shouldShowUI(uiElement: string, role: UserRole): boolean {
  return UI_PERMISSIONS[uiElement]?.[role] ?? false;
}

/**
 * Check if user has access to a feature
 * @param featureName - Feature name (from FEATURE_PERMISSIONS)
 * @param role - User's role
 * @returns boolean - Whether feature is enabled for user
 */
export function hasFeatureAccess(featureName: string, role: UserRole): boolean {
  return FEATURE_PERMISSIONS[featureName]?.[role] ?? false;
}

/**
 * Check multiple permissions (AND logic)
 * User must have ALL permissions
 * @param role - User's role
 * @param permissions - Permissions to check
 * @returns boolean - Whether user has all permissions
 */
export function hasAllPermissions(
  role: UserRole,
  permissions: PermissionKey[],
): boolean {
  return permissions.every((permission) => hasPermission(role, permission));
}

/**
 * Check multiple permissions (OR logic)
 * User must have AT LEAST ONE permission
 * @param role - User's role
 * @param permissions - Permissions to check
 * @returns boolean - Whether user has at least one permission
 */
export function hasAnyPermission(
  role: UserRole,
  permissions: PermissionKey[],
): boolean {
  return permissions.some((permission) => hasPermission(role, permission));
}

/**
 * Get all permissions for a user
 * @param role - User's role
 * @returns PermissionKey[] - List of all permissions
 */
export function getUserPermissions(role: UserRole): PermissionKey[] {
  return PERMISSIONS[role] ?? [];
}

/**
 * Check if user can view a transaction
 * Respects row-level security (user can only view own, owner/admin can view all)
 * @param userRole - User's role
 * @param userId - Current user's ID
 * @param transactionUserId - Transaction owner's ID
 * @returns boolean - Whether user can view transaction
 */
export function canViewTransaction(
  userRole: UserRole,
  userId: string,
  transactionUserId: string,
): boolean {
  return canPerformAction("view_transaction", userRole, {
    userId,
    transactionUserId,
  });
}

/**
 * Check if user can approve transaction
 * @param userRole - User's role
 * @param transactionStatus - Current transaction status
 * @returns boolean - Whether user can approve
 */
export function canApproveTransaction(
  userRole: UserRole,
  transactionStatus: string,
): boolean {
  return canPerformAction("approve_transaction", userRole, {
    status: transactionStatus,
  });
}

/**
 * Check if user can reject transaction
 * @param userRole - User's role
 * @param transactionStatus - Current transaction status
 * @returns boolean - Whether user can reject
 */
export function canRejectTransaction(
  userRole: UserRole,
  transactionStatus: string,
): boolean {
  return canPerformAction("reject_transaction", userRole, {
    status: transactionStatus,
  });
}

/**
 * Check if user can pay transaction
 * @param userRole - User's role
 * @param transactionStatus - Current transaction status
 * @returns boolean - Whether user can pay
 */
export function canPayTransaction(
  userRole: UserRole,
  transactionStatus: string,
): boolean {
  return canPerformAction("pay_transaction", userRole, {
    status: transactionStatus,
  });
}

/**
 * Check if user can create a transaction
 * @param userRole - User's role
 * @returns boolean - Whether user can create
 */
export function canCreateTransaction(userRole: UserRole): boolean {
  return hasPermission(userRole, "create_transaction");
}

/**
 * Get filtered transactions based on user role
 * For client-side filtering (server should also enforce this)
 * @param transactions - Array of transactions
 * @param userRole - User's role
 * @param userId - Current user's ID
 * @returns Transaction[] - Filtered transactions
 */
export function filterTransactionsByRole(
  transactions: any[],
  userRole: UserRole,
  userId: string,
): any[] {
  if (userRole === "user") {
    // User can only see their own transactions
    return transactions.filter((tx) => tx.user_id === userId);
  }
  // owner and admin can see all
  return transactions;
}

/**
 * Create a permission context for a user
 * Useful for passing around permission info in React context
 * @param role - User's role
 * @param userId - User ID
 * @returns PermissionContext - Object with permission info
 */
export function createPermissionContext(role: UserRole, userId: string) {
  return {
    role,
    userId,
    permissions: getUserPermissions(role),
    hasPermission: (permission: PermissionKey) =>
      hasPermission(role, permission),
    hasAllPermissions: (permissions: PermissionKey[]) =>
      hasAllPermissions(role, permissions),
    hasAnyPermission: (permissions: PermissionKey[]) =>
      hasAnyPermission(role, permissions),
    canViewTransaction: (transactionUserId: string) =>
      canViewTransaction(role, userId, transactionUserId),
    canApproveTransaction: (status: string) =>
      canApproveTransaction(role, status),
    canRejectTransaction: (status: string) =>
      canRejectTransaction(role, status),
    canPayTransaction: (status: string) => canPayTransaction(role, status),
  };
}

export type PermissionContext = ReturnType<typeof createPermissionContext>;
