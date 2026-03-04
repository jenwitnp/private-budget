"use client";

import { ReactNode } from "react";
import { useSession } from "next-auth/react";
import { AuthProvider } from "./contexts/AuthContext";

interface SessionProviderWrapperProps {
  children: ReactNode;
}

/**
 * SessionProviderWrapper
 * Bridges SessionProvider and AuthProvider by extracting the session
 * and passing it to AuthProvider
 */
export function SessionProviderWrapper({
  children,
}: SessionProviderWrapperProps) {
  const { data: session, status } = useSession();

  return (
    <AuthProvider session={session} isLoading={status === "loading"}>
      {children}
    </AuthProvider>
  );
}
