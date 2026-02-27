/**
 * Permission guard components
 * Use for conditional rendering based on permissions
 */

"use client";

import React, { ReactNode } from "react";
import { usePermissions, useCanRender, useUserRole } from "./hooks";
import { UserRole, PermissionKey } from "./config";

interface PermissionGuardProps {
  permission: PermissionKey;
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Guard component - shows children only if user has permission
 * @example
 * <PermissionGuard permission="approve_transaction">
 *   <button onClick={handleApprove}>Approve</button>
 * </PermissionGuard>
 */
export function PermissionGuard({
  permission,
  children,
  fallback = null,
}: PermissionGuardProps) {
  const permissions = usePermissions();

  if (!permissions.hasPermission(permission)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

interface RoleGuardProps {
  roles: UserRole[];
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Role-based guard component
 * Shows children only if user has one of the allowed roles
 * @example
 * <RoleGuard roles={['owner', 'admin']}>
 *   <AdminPanel />
 * </RoleGuard>
 */
export function RoleGuard({
  roles,
  children,
  fallback = null,
}: RoleGuardProps) {
  const canRender = useCanRender(roles);

  if (!canRender) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

interface ActionGuardProps {
  action: "approve" | "reject" | "pay" | "view";
  status?: string;
  userId?: string;
  transactionUserId?: string;
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Action-based guard component
 * Shows children only if user can perform the action
 * @example
 * <ActionGuard action="approve" status={transaction.status}>
 *   <button onClick={handleApprove}>Approve</button>
 * </ActionGuard>
 */
export function ActionGuard({
  action,
  status,
  userId,
  transactionUserId,
  children,
  fallback = null,
}: ActionGuardProps) {
  const permissions = usePermissions();
  const userRole = useUserRole();

  let canPerform = false;

  if (action === "view" && userId && transactionUserId) {
    canPerform = permissions.canViewTransaction(transactionUserId);
  } else if (action === "approve" && status) {
    canPerform = permissions.canApproveTransaction(status);
  } else if (action === "reject" && status) {
    canPerform = permissions.canRejectTransaction(status);
  } else if (action === "pay" && status) {
    canPerform = permissions.canPayTransaction(status);
  }

  if (!canPerform) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

interface FeatureGuardProps {
  feature: string;
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Feature-based guard component
 * Shows children only if user has access to feature
 * @example
 * <FeatureGuard feature="transactions">
 *   <TransactionPanel />
 * </FeatureGuard>
 */
export function FeatureGuard({
  feature,
  children,
  fallback = null,
}: FeatureGuardProps) {
  const role = useUserRole();
  // TODO: Implement feature access check
  const hasAccess = true; // Placeholder

  if (!hasAccess) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

interface ConditionalGuardProps {
  condition: boolean;
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Generic conditional guard
 * Shows children based on boolean condition
 * Useful for combining multiple permission checks
 * @example
 * <ConditionalGuard condition={canApprove && status === 'processing'}>
 *   <button>Approve</button>
 * </ConditionalGuard>
 */
export function ConditionalGuard({
  condition,
  children,
  fallback = null,
}: ConditionalGuardProps) {
  if (!condition) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
