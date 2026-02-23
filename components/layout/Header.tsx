"use client";

import { useSession, signOut } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { getRoleDisplayName } from "@/lib/auth/roles";

export function Header() {
  const { data: session } = useSession();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  // Get display name from session
  const displayName =
    session?.user?.name ||
    `${(session?.user as any)?.first_name || ""} ${(session?.user as any)?.last_name || ""}`.trim() ||
    (session?.user as any)?.username ||
    "ผู้ใช้";

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/login" });
  };

  return (
    <>
      {/* Mobile Header */}
      <header className="flex md:hidden items-center justify-between p-4 bg-white border-b shadow-sm z-20">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-md bg-emerald-500 flex items-center justify-center text-white">
            <i className="fa-solid fa-wallet text-sm"></i>
          </div>
          <h1 className="font-bold text-slate-800">Budget</h1>
        </div>
        <button
          onClick={() => setShowMobileMenu(!showMobileMenu)}
          className="text-slate-500 hover:text-slate-700 transition-colors"
        >
          <i
            className={`fa-solid ${showMobileMenu ? "fa-x" : "fa-bars"} text-xl`}
          ></i>
        </button>
      </header>

      {/* Desktop Header */}
      <header className="hidden md:flex items-center justify-between px-8 py-5 bg-white border-b border-slate-200">
        <h2 className="text-2xl font-bold text-slate-800">แดชบอร์ด</h2>
        <div className="flex items-center gap-6">
          <button className="relative text-slate-400 hover:text-slate-600 transition-colors">
            <i className="fa-solid fa-bell text-xl"></i>
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
          </button>
          <div className="relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center gap-3 pl-6 border-l border-slate-200 hover:opacity-70 transition-opacity"
            >
              <div className="text-right hidden lg:block">
                <p className="text-sm font-bold text-slate-700">
                  {displayName}
                </p>
                <p className="text-xs text-slate-500">
                  {getRoleDisplayName(session?.user?.role as any)}
                </p>
              </div>
              <div
                className={`w-10 h-10 rounded-full border-2 border-white shadow-sm overflow-hidden flex items-center justify-center text-white font-bold ${
                  session?.user?.role === "owner"
                    ? "bg-purple-500"
                    : session?.user?.role === "admin"
                      ? "bg-blue-500"
                      : "bg-emerald-500"
                }`}
              >
                {displayName?.charAt(0).toUpperCase() || "U"}
              </div>
            </button>

            {/* Dropdown Menu */}
            {showDropdown && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-slate-100 z-20">
                <div className="p-4 border-b border-slate-100">
                  <p className="text-sm font-bold text-slate-700">
                    {displayName}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    @{(session?.user as any)?.username}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    {getRoleDisplayName(session?.user?.role as any)}
                  </p>
                </div>
                <Link
                  href="/settings"
                  className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                  onClick={() => setShowDropdown(false)}
                >
                  <i className="fa-solid fa-gear mr-2"></i>
                  ตั้งค่า
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-sm text-red-700 hover:bg-red-50 border-t border-slate-100"
                >
                  <i className="fa-solid fa-sign-out mr-2"></i>
                  ออกจากระบบ
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {showMobileMenu && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/50"
          onClick={() => setShowMobileMenu(false)}
        >
          <nav className="absolute left-0 top-20 bottom-0 w-64 bg-slate-900 text-white overflow-y-auto">
            <div className="p-4 space-y-2">
              {/* Menu Items */}
              <Link
                href="/"
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-all"
                onClick={() => setShowMobileMenu(false)}
              >
                <i className="fa-solid fa-chart-pie"></i>
                <span>ภาพรวม (Dashboard)</span>
              </Link>
              <Link
                href="/history"
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-all"
                onClick={() => setShowMobileMenu(false)}
              >
                <i className="fa-solid fa-money-bill-transfer"></i>
                <span>ประวัติการถอน</span>
              </Link>
              <Link
                href="/accounts"
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-all"
                onClick={() => setShowMobileMenu(false)}
              >
                <i className="fa-solid fa-landmark"></i>
                <span>บัญชีธนาคาร</span>
              </Link>
              <Link
                href="/settings"
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-all"
                onClick={() => setShowMobileMenu(false)}
              >
                <i className="fa-solid fa-user-gear"></i>
                <span>ตั้งค่าบัญชี</span>
              </Link>

              {/* Admin Section */}
              {(session?.user?.role === "owner" ||
                session?.user?.role === "admin") && (
                <>
                  <div className="my-4 border-t border-slate-700"></div>
                  <div className="px-4 py-2 text-xs uppercase font-semibold text-slate-500">
                    <i className="fa-solid fa-shield mr-2"></i>
                    ผู้ดูแลระบบ
                  </div>
                  <Link
                    href="/admin/users"
                    className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-all"
                    onClick={() => setShowMobileMenu(false)}
                  >
                    <i className="fa-solid fa-users"></i>
                    <span>จัดการผู้ใช้งาน</span>
                  </Link>
                  <Link
                    href="/admin/categories"
                    className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-all"
                    onClick={() => setShowMobileMenu(false)}
                  >
                    <i className="fa-solid fa-list"></i>
                    <span>จัดการหมวดหมู่</span>
                  </Link>
                  <Link
                    href="/admin/transactions"
                    className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-all"
                    onClick={() => setShowMobileMenu(false)}
                  >
                    <i className="fa-solid fa-list"></i>
                    <span>จัดการรายการทั้งหมด</span>
                  </Link>
                  <Link
                    href="/admin/reports"
                    className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-all"
                    onClick={() => setShowMobileMenu(false)}
                  >
                    <i className="fa-solid fa-chart-line"></i>
                    <span>รายงาน</span>
                  </Link>
                </>
              )}

              {/* Divider & Logout */}
              <div className="my-4 border-t border-slate-700"></div>
              <button
                onClick={() => {
                  handleLogout();
                  setShowMobileMenu(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-red-400 transition-colors"
              >
                <i className="fa-solid fa-right-from-bracket"></i>
                <span>ออกจากระบบ</span>
              </button>
            </div>
          </nav>
        </div>
      )}
    </>
  );
}
