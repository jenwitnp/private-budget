"use client";

import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { signOut, useSession } from "next-auth/react";
import { hasPermission, UserRole } from "@/lib/auth/roles";
import { menuItems, adminItems, type MenuItem } from "@/lib/config/menuItems";
import { useTransactionStats } from "@/hooks/useTransactionStats";
import { fetchComplaintStatsAction } from "@/actions/complaints";

interface MenuTileProps {
  item: MenuItem;
  isActive: boolean;
  onClick?: () => void;
  count?: number;
}

interface GridMenuProps {
  onClose?: () => void;
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

export function GridMenu({ onClose }: GridMenuProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const userRole = session?.user?.role as UserRole;

  // Fetch transaction stats to get pending count
  const { data: stats } = useTransactionStats({});

  // Fetch complaint stats to get pending count
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
      {/* Main Grid Menu */}
      <div className="max-w-7xl mx-auto">
        {/* User Menu */}
        <div className="mb-10">
          <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <i className="fa-solid fa-home text-blue-900"></i>
            เมนูหลัก
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {menuItems.map((item) => (
              <MenuTile
                key={item.href}
                item={item}
                isActive={router.pathname === item.href}
                count={
                  item.href === "/history"
                    ? stats?.pending
                    : item.href === "/complaints"
                      ? complaintStats?.pending
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
              bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold rounded-2xl
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
