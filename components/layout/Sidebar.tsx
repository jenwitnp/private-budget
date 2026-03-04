"use client";

import Link from "next/link";
import { useRouter } from "next/router";
import { signOut, useSession } from "next-auth/react";
import { hasPermission, UserRole } from "@/lib/auth/roles";

const menuItems = [
  {
    href: "/",
    label: "ภาพรวม (Dashboard)",
    icon: "fa-chart-pie",
    permission: "view_own_transactions",
  },
  {
    href: "/history",
    label: "ประวัติการถอน",
    icon: "fa-money-bill-transfer",
    permission: "view_own_transactions",
  },
  {
    href: "/accounts",
    label: "บัญชีธนาคาร",
    icon: "fa-landmark",
    permission: "view_own_profile",
  },
  {
    href: "/settings",
    label: "ตั้งค่าบัญชี",
    icon: "fa-user-gear",
    permission: "view_own_profile",
  },
];

const adminItems = [
  {
    href: "/admin/users",
    label: "จัดการผู้ใช้งาน",
    icon: "fa-users",
    permission: "create_user",
  },
  {
    href: "/admin/categories",
    label: "จัดการหมวดหมู่",
    icon: "fa-list",
    permission: "create_user",
  },
  {
    href: "/admin/transactions",
    label: "จัดการรายการทั้งหมด",
    icon: "fa-list",
    permission: "view_all_transactions",
  },
  {
    href: "/admin/reports",
    label: "รายงาน",
    icon: "fa-chart-line",
    permission: "view_all_transactions",
  },
];

export function Sidebar() {
  const router = useRouter();
  const { data: session } = useSession();
  const userRole = session?.user?.role as UserRole;

  const handleLogout = async () => {
    await signOut({ redirect: true, callbackUrl: "/login" });
  };

  const canViewMenu = (permission: string) => {
    return userRole && hasPermission(userRole, permission);
  };

  return (
    <aside className="hidden md:flex flex-col w-64 bg-slate-900 text-white transition-all duration-300 shadow-xl z-20">
      {/* Logo */}
      <div className="flex items-center justify-center h-20 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-linear-to-br from-emerald-500 to-teal-400 flex items-center justify-center text-white shadow-lg">
            <i className="fa-solid fa-wallet text-xl"></i>
          </div>
          <h1 className="text-xl font-bold tracking-wide">Budget</h1>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-2">
        {menuItems.map((item) => {
          // if (!canViewMenu(item.permission)) return null;
          const isActive = router.pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all ${
                isActive
                  ? "bg-slate-800 text-emerald-400 shadow-sm border-l-4 border-emerald-500"
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <i className={`fa-solid ${item.icon} w-6 text-center`}></i>
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}

        {userRole &&
          (hasPermission(userRole, "create_user") ||
            hasPermission(userRole, "view_all_transactions")) && (
            <>
              <div className="my-4 border-t border-slate-700"></div>
              <div className="px-4 py-2 text-xs uppercase font-semibold text-slate-500 tracking-wider">
                <i className="fa-solid fa-shield mr-2"></i>
                ผู้ดูแลระบบ
              </div>
              {adminItems.map((item) => {
                if (!canViewMenu(item.permission)) return null;
                const isActive = router.pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all ${
                      isActive
                        ? "bg-slate-800 text-emerald-400 shadow-sm border-l-4 border-emerald-500"
                        : "text-slate-400 hover:bg-slate-800 hover:text-white"
                    }`}
                  >
                    <i className={`fa-solid ${item.icon} w-6 text-center`}></i>
                    <span className="font-medium">{item.label}</span>
                  </Link>
                );
              })}
            </>
          )}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-slate-700">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-4 py-2 text-slate-400 hover:text-red-400 transition-colors"
        >
          <i className="fa-solid fa-right-from-bracket"></i>
          <span>ออกจากระบบ</span>
        </button>
      </div>
    </aside>
  );
}
