"use client";

import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { signOut, useSession } from "next-auth/react";
import { hasPermission, UserRole } from "@/lib/auth/roles";
import { menuItems, adminItems } from "@/lib/config/menuItems";
import { fetchTransactionStatsAction } from "@/actions/stats";
import { fetchComplaintStatsAction } from "@/actions/complaints";

export function Sidebar() {
  const router = useRouter();
  const { data: session } = useSession();
  const userRole = session?.user?.role as UserRole;

  // Fetch transaction stats using RPC with permission filtering
  const { data: transactionStats } = useQuery({
    queryKey: ["transaction-stats-menu", session?.user?.id, userRole],
    queryFn: async () => {
      if (!session?.user?.id || !userRole) return null;
      const result = await fetchTransactionStatsAction(
        session.user.id,
        userRole,
      );
      return result.success ? result.data : null;
    },
    enabled: !!session?.user?.id && !!userRole,
  });

  // Fetch complaint stats (all users, no permission filtering)
  const [complaintStats, setComplaintStats] = useState<{
    pending: number;
  } | null>(null);

  useEffect(() => {
    const loadComplaintStats = async () => {
      try {
        const result = await fetchComplaintStatsAction();
        if (result.success && result.stats) {
          setComplaintStats({ pending: result.stats.pending });
        }
      } catch (err) {
        console.error("Error loading complaint stats:", err);
      }
    };
    loadComplaintStats();
  }, []);

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
          <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center text-blue-900 shadow-lg">
            <i className="fa-solid fa-wallet text-xl"></i>
          </div>
          <h1 className="text-xl font-bold tracking-wide">เบิกคัพ</h1>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-2">
        {menuItems
          .filter(
            (item) =>
              !item.hideForRoles || !item.hideForRoles.includes(userRole),
          )
          .map((item) => {
            const isActive = router.pathname === item.href;
            const count =
              item.href === "/history"
                ? transactionStats?.pending
                : item.href === "/complaints"
                  ? complaintStats?.pending
                  : undefined;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative flex items-center gap-4 px-4 py-3 rounded-xl transition-all ${
                  isActive
                    ? "bg-slate-800 text-slate-400 shadow-sm border-l-4 border-blue-500"
                    : "text-slate-100 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <i
                  className={`fa-solid ${item.icon} w-6 text-blue-700 text-center`}
                ></i>
                <span className="font-medium text-white">{item.label}</span>

                {/* Notification Badge */}
                {count !== undefined && count > 0 && (
                  <div className="ml-auto flex items-center justify-center w-6 h-6 bg-red-500 text-white text-xs font-bold rounded-full">
                    {count > 99 ? "99+" : count}
                  </div>
                )}
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
                        ? "bg-slate-800 text-blue-400 shadow-sm border-l-4 border-blue-500"
                        : "text-slate-400 hover:bg-slate-800 hover:text-white"
                    }`}
                  >
                    <i
                      className={`fa-solid ${item.icon} text-blue-700 w-6 text-center`}
                    ></i>
                    <span className="font-medium text-white">{item.label}</span>
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
