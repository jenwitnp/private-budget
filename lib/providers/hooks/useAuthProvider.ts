import { useSession } from "next-auth/react";
import { useContext, useCallback } from "react";
import { AuthContext } from "../contexts/AuthContext";

export function useAuthProvider() {
  const { data: session, status } = useSession();
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuthProvider must be used within AuthProvider");
  }

  const isLoading = status === "loading";
  const isAuthenticated = status === "authenticated";

  return {
    session,
    isLoading,
    isAuthenticated,
    status,
  };
}

// Hook for consuming auth context without next-auth dependency
export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}
