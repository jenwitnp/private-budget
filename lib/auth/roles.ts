/**
 * Role-based access control definitions
 */

export type UserRole = "owner" | "admin" | "user";

/**
 * Permission matrix for each role
 */
export const rolePermissions: Record<UserRole, string[]> = {
  owner: [
    "all", // Owner has all permissions
    "approve_withdrawals",
    "manage_users",
    "manage_admins",
    "create_user",
    "create_transaction",
    "view_all_transactions",
    "view_all_users",
    "system_settings",
  ],
  admin: [
    "create_user",
    "create_transaction",
    "view_all_transactions",
    "view_all_users",
    "manage_users",
  ],
  user: ["create_transaction", "view_own_transactions", "view_own_profile"],
};

/**
 * Check if a role has a specific permission
 */
export function hasPermission(role: UserRole, permission: string): boolean {
  const permissions = rolePermissions[role];
  return permissions.includes("all") || permissions.includes(permission);
}

/**
 * Check if a role can perform an action
 */
export function canPerformAction(role: UserRole, action: string): boolean {
  const actionToPermission: Record<string, string> = {
    "approve-withdrawals": "approve_withdrawals",
    "manage-users": "manage_users",
    "manage-admins": "manage_admins",
    "create-user": "create_user",
    "create-transaction": "create_transaction",
    "view-all-transactions": "view_all_transactions",
    "view-all-users": "view_all_users",
    "system-settings": "system_settings",
    "view-own-transactions": "view_own_transactions",
    "view-own-profile": "view_own_profile",
  };

  const permission = actionToPermission[action];
  return permission ? hasPermission(role, permission) : false;
}

/**
 * Get role display name in Thai
 */
export function getRoleDisplayName(role: UserRole): string {
  const roleNames: Record<UserRole, string> = {
    owner: "เจ้าของ",
    admin: "ผู้ดูแลระบบ",
    user: "ผู้ใช้ทั่วไป",
  };
  return roleNames[role];
}

/**
 * Get role description in Thai
 */
export function getRoleDescription(role: UserRole): string {
  const descriptions: Record<UserRole, string> = {
    owner: "มีสิทธิ์ทั้งหมด - อนุมัติธุรกรรม, จัดการผู้ใช้, การตั้งค่าระบบ",
    admin: "สร้างผู้ใช้, สร้างธุรกรรม, ดูธุรกรรมทั้งหมด",
    user: "สร้างธุรกรรม, ดูธุรกรรมของตัวเอง",
  };
  return descriptions[role];
}
