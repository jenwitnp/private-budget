// Menu items configuration for the application
import type { UserRole } from "@/lib/permissions/config";

export const menuItems = [
  {
    href: "/dashboard",
    label: "ภาพรวม",
    shortLabel: "Dashboard",
    icon: "fa-chart-pie",
    permission: "view_own_transactions",
    color: "from-blue-500 to-blue-600",
    hideForRoles: ["user"] as UserRole[],
  },
  {
    href: "/history",
    label: "คำขอเบิก",
    shortLabel: "History",
    icon: "fa-money-bill-transfer",
    permission: "view_own_transactions",
    color: "from-emerald-500 to-emerald-600",
  },
  {
    href: "/accounts",
    label: "บัญชีธนาคาร",
    shortLabel: "Accounts",
    icon: "fa-landmark",
    permission: "view_own_profile",
    color: "from-purple-500 to-purple-600",
  },
  {
    href: "/settings",
    label: "ตั้งค่าบัญชี",
    shortLabel: "Settings",
    icon: "fa-user-gear",
    permission: "view_own_profile",
    color: "from-orange-500 to-orange-600",
  },
  {
    href: "/complaints",
    label: "เรื่องร้องเรียน",
    shortLabel: "Complaints",
    icon: "fa-message",
    permission: "view_own_profile",
    color: "from-rose-500 to-rose-600",
  },
];

export const adminItems = [
  {
    href: "/admin/users",
    label: "จัดการผู้ใช้",
    shortLabel: "Users",
    icon: "fa-users",
    permission: "create_user",
    color: "from-red-500 to-red-600",
  },
  {
    href: "/admin/categories",
    label: "จัดการหมวดหมู่",
    shortLabel: "Categories",
    icon: "fa-list",
    permission: "create_user",
    color: "from-pink-500 to-pink-600",
  },
  //   {
  //     href: "/admin/transactions",
  //     label: "จัดการรายการ",
  //     shortLabel: "Transactions",
  //     icon: "fa-receipt",
  //     permission: "view_all_transactions",
  //     color: "from-indigo-500 to-indigo-600",
  //   },
  //   {
  //     href: "/admin/reports",
  //     label: "รายงาน",
  //     shortLabel: "Reports",
  //     icon: "fa-chart-line",
  //     permission: "view_all_transactions",
  //     color: "from-cyan-500 to-cyan-600",
  //   },
];

export interface MenuItem {
  href: string;
  label: string;
  shortLabel: string;
  icon: string;
  permission: string;
  color: string;
  hideForRoles?: UserRole[];
}
