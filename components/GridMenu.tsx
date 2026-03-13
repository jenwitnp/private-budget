"use client";

import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { signOut, useSession } from "next-auth/react";
import { hasPermission, UserRole } from "@/lib/auth/roles";
import { menuItems, adminItems, type MenuItem } from "@/lib/config/menuItems";
import { fetchTransactionStatsAction } from "@/actions/stats";
import { fetchComplaintStatsAction } from "@/actions/complaints";
import { fetchScheduleStatsAction } from "@/actions/schedules";
import { UserProfile } from "@/components/UserProfile";

interface MenuTileProps {
  item: MenuItem;
  isActive: boolean;
  onClick?: () => void;
  count?: number;
}

interface GridMenuProps {
  onClose?: () => void;
  UserProfile?: boolean;
}

function MenuTile({ item, isActive, count }: MenuTileProps) {
  return (
    <Link href={item.href}>
      <div
        className={`
          relative flex flex-col items-center justify-center p-6 rounded-2xl
          transition-all duration-300 cursor-pointer overflow-hidden
          group hover:shadow-xl hover:scale-105
          ${
            isActive
              ? `bg-linear-to-br ${item.color} text-white shadow-lg scale-100`
              : "bg-white border-2 border-slate-200 text-slate-600 hover:border-slate-300"
          }
        `}
      >
        {/* Background glow effect on hover */}
        <div
          className={`
            absolute inset-0 opacity-0 group-hover:opacity-10
            transition-opacity duration-300
            ${isActive ? "bg-white" : `bg-linear-to-br ${item.color}`}
          `}
        />

        {/* Icon */}
        <div className="relative z-10 mb-3">
          <i
            className={`fa-solid ${item.icon} text-4xl transition-transform duration-300 group-hover:scale-110`}
          />
        </div>

        {/* Label */}
        <div className="relative z-10 text-center">
          <p className="text-sm font-bold text-nowrap">{item.label}</p>
          <p className="text-xs opacity-75 mt-0.5 text-nowrap">
            {item.shortLabel}
          </p>
        </div>

        {/* Active indicator */}
        {isActive && (
          <div className="absolute top-2 right-2 w-3 h-3 bg-white rounded-full shadow-lg" />
        )}

        {/* Notification Badge */}
        {count !== undefined && count > 0 && (
          <div className="absolute top-2 left-2 z-50 flex items-center justify-center w-6 h-6 bg-red-500 text-white text-xs font-bold rounded-full shadow-lg">
            {count > 99 ? "99+" : count}
          </div>
        )}
      </div>
    </Link>
  );
}

export function GridMenu({
  onClose,
  UserProfile: showUserProfile = true,
}: GridMenuProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const userRole = session?.user?.role as UserRole;

  // Get display name from session
  const displayName =
    session?.user?.name ||
    `${(session?.user as any)?.first_name || ""} ${(session?.user as any)?.last_name || ""}`.trim() ||
    (session?.user as any)?.username ||
    "ผู้ใช้";

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

  // Fetch schedule stats (all users, no permission filtering)
  const [scheduleStats, setScheduleStats] = useState<{
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

  useEffect(() => {
    const loadScheduleStats = async () => {
      try {
        const result = await fetchScheduleStatsAction();
        if (result.success && result.stats) {
          setScheduleStats({ pending: result.stats.pending });
        }
      } catch (err) {
        console.error("Error loading schedule stats:", err);
      }
    };
    loadScheduleStats();
  }, []);

  const handleLogout = async () => {
    onClose?.();
    await signOut({ redirect: true, callbackUrl: "/auth/login" });
  };

  const canViewMenu = (permission: string) => {
    return userRole && hasPermission(userRole, permission);
  };

  const visibleAdminItems = adminItems.filter((item) =>
    canViewMenu(item.permission),
  );

  return (
    <div className="w-full">
      {/* User Profile Section */}
      {showUserProfile && (
        <div className="mb-8 p-4 bg-white rounded-xl border border-slate-200">
          <UserProfile displayName={displayName} session={session} />
        </div>
      )}

      {/* Main Grid Menu */}
      <div className="max-w-7xl mx-auto">
        {/* User Menu */}
        <div className="mb-10">
          <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <i className="fa-solid fa-home text-blue-900"></i>
            เมนูหลัก
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {menuItems
              .filter(
                (item) =>
                  !item.hideForRoles || !item.hideForRoles.includes(userRole),
              )
              .map((item) => (
                <MenuTile
                  key={item.href}
                  item={item}
                  isActive={router.pathname === item.href}
                  count={
                    item.href === "/history"
                      ? transactionStats?.pending
                      : item.href === "/complaints"
                        ? complaintStats?.pending
                        : item.href === "/schedule"
                          ? scheduleStats?.pending
                          : undefined
                  }
                />
              ))}
          </div>
        </div>

        {/* Admin Menu */}
        {visibleAdminItems.length > 0 && (
          <div className="mb-10">
            <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <i className="fa-solid fa-shield text-red-500"></i>
              เมนูผู้ดูแลระบบ
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {visibleAdminItems.map((item) => (
                <MenuTile
                  key={item.href}
                  item={item}
                  isActive={router.pathname === item.href}
                />
              ))}
            </div>
          </div>
        )}

        {/* Logout Button */}
        <div className="mt-12 pt-8 border-t-2 border-slate-200">
          <button
            onClick={handleLogout}
            className="w-full md:w-auto flex items-center justify-center gap-3 px-8 py-4 
              bg-linear-to-r from-red-500 to-red-600 text-white font-semibold rounded-2xl
              hover:shadow-lg hover:scale-105 transition-all duration-300"
          >
            <i className="fa-solid fa-right-from-bracket text-xl"></i>
            <span>ออกจากระบบ</span>
          </button>
        </div>
      </div>
    </div>
  );
}
