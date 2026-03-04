"use client";

import { createContext } from "react";
import { Session } from "next-auth";

interface AuthContextType {
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export type { AuthContextType };

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined,
);

interface AuthProviderProps {
  children: React.ReactNode;
  session: Session | null;
  isLoading?: boolean;
}

export function AuthProvider({
  children,
  session,
  isLoading = false,
}: AuthProviderProps) {
  const value: AuthContextType = {
    session,
    isLoading,
    isAuthenticated: !!session,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
