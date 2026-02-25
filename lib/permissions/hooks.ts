/**
 * React hooks for permission checking
 * Use in components for permission-based rendering
 */

"use client";

import { useMemo } from "react";
import { useSession } from "next-auth/react";
import { UserRole, PermissionKey } from "./config";
import {
  hasPermission,
  hasAllPermissions,
  hasAnyPermission,
  canViewTransaction,
  canApproveTransaction,
  canRejectTransaction,
  canPayTransaction,
  canCreateTransaction,
  getUserPermissions,
  createPermissionContext,
  PermissionContext,
} from "./utils";

/**
 * Hook to get current user's role
 * For now, assumes role is stored in session.user.role
 * Can be extended to fetch from database
 * @returns UserRole - Current user's role (default: 'user')
 */
export function useUserRole(): UserRole {
  const { data: session } = useSession();
  // TODO: In future, fetch role from user_roles table
  // For now, default to 'user' role
  return (session?.user?.role as UserRole) || "user";
}

/**
 * Main permissions hook - use this in most components
 * Provides all permission checking methods
 * @returns PermissionContext - Object with all permission methods
 */
export function usePermissions(): PermissionContext {
  const { data: session } = useSession();
  const userRole = useUserRole();

  return useMemo(() => {
    const userId = session?.user?.id || "";
    return createPermissionContext(userRole, userId);
  }, [userRole, session?.user?.id]);
}

/**
 * Check if user has a specific permission
 * @param permission - Permission to check
 * @returns boolean - Whether user has permission
 */
export function useHasPermission(permission: PermissionKey): boolean {
  const role = useUserRole();
  return hasPermission(role, permission);
}

/**
 * Check if user can view all transactions
 * Different from viewing own transactions
 * @returns boolean - Whether user can view all transactions
 */
export function useCanViewAllTransactions(): boolean {
  const role = useUserRole();
  return role === "owner" || role === "admin";
}

/**
 * Check if user can approve transactions
 * @returns boolean - Whether user can approve
 */
export function useCanApprove(): boolean {
  const role = useUserRole();
  return role === "owner";
}

/**
 * Check if user can reject transactions
 * @returns boolean - Whether user can reject
 */
export function useCanReject(): boolean {
  const role = useUserRole();
  return role === "owner";
}

/**
 * Check if user can pay transactions
 * @returns boolean - Whether user can pay
 */
export function useCanPay(): boolean {
  const role = useUserRole();
  return role === "admin" || role === "owner";
}

/**
 * Check if user can create transactions
 * @returns boolean - Whether user can create
 */
export function useCanCreate(): boolean {
  const role = useUserRole();
  return canCreateTransaction(role);
}

/**
 * Check if user can perform action on specific transaction
 * @param action - 'view' | 'approve' | 'reject' | 'pay'
 * @param status - Transaction status
 * @returns boolean - Whether user can perform action
 */
export function useCanPerformAction(
  action: "view" | "approve" | "reject" | "pay",
  status?: string,
): boolean {
  const role = useUserRole();

  switch (action) {
    case "approve":
      return canApproveTransaction(role, status || "");
    case "reject":
      return canRejectTransaction(role, status || "");
    case "pay":
      return canPayTransaction(role, status || "");
    default:
      return false;
  }
}

/**
 * Get all permissions for current user
 * @returns PermissionKey[] - List of permissions
 */
export function useGetPermissions(): PermissionKey[] {
  const role = useUserRole();
  return getUserPermissions(role);
}

/**
 * Check if user should see workflow actions
 * Useful for showing/hiding action buttons
 * @returns Object with visibility flags
 */
export function useWorkflowVisibility() {
  const role = useUserRole();

  return useMemo(
    () => ({
      canApprove: role === "owner",
      canReject: role === "owner",
      canPay: role === "admin" || role === "owner",
      canView: true, // Everyone can view their transactions
      showWorkflowSection: role === "owner" || role === "admin",
    }),
    [role],
  );
}

/**
 * Check if user has access to a feature
 * @param featureName - Feature name
 * @returns boolean - Whether feature is accessible
 */
export function useHasFeatureAccess(featureName: string): boolean {
  const role = useUserRole();
  // TODO: Implement feature access check
  return true; // Placeholder
}

/**
 * Hook for role-based rendering
 * @param allowedRoles - Array of roles that can see content
 * @returns boolean - Whether to show content
 */
export function useCanRender(allowedRoles: UserRole[]): boolean {
  const role = useUserRole();
  return allowedRoles.includes(role);
}
