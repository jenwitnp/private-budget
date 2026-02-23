"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

export default function UnauthorizedPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-4">
      <div className="text-center">
        {/* Icon */}
        <div className="mb-6">
          <i className="fa-solid fa-lock text-6xl text-red-500"></i>
        </div>

        {/* Message */}
        <h1 className="text-4xl font-bold text-white mb-2">
          ไม่มีสิทธิ์เข้าถึง
        </h1>
        <p className="text-slate-400 text-lg mb-8">
          คุณไม่มีสิทธิ์ในการเข้าถึงหน้านี้
        </p>

        {/* Buttons */}
        <div className="flex gap-4 justify-center">
          <button
            onClick={() => router.back()}
            className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
          >
            <i className="fa-solid fa-arrow-left mr-2"></i>
            กลับไป
          </button>
          <Link
            href="/"
            className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors"
          >
            <i className="fa-solid fa-home mr-2"></i>
            หน้าหลัก
          </Link>
        </div>
      </div>
    </div>
  );
}
