"use client";

import { Session } from "next-auth";
import { getRoleDisplayName } from "@/lib/auth/roles";

interface UserProfileProps {
  displayName: string;
  session: Session | null;
}

export function UserProfile({ displayName, session }: UserProfileProps) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-lg bg-blue-900 flex items-center justify-center text-white font-bold text-sm">
        {displayName?.charAt(0).toUpperCase() || "U"}
      </div>
      <div className="flex-1">
        <h3 className="font-bold text-slate-800 text-sm">{displayName}</h3>
        <p className="text-xs text-slate-500">
          {getRoleDisplayName(session?.user?.role as any)}
        </p>
      </div>
    </div>
  );
}
