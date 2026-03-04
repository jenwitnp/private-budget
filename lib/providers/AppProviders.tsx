"use client";

import { ReactNode } from "react";
import { SessionProvider } from "next-auth/react";
import { QueryClientProvider } from "@tanstack/react-query";
import { getQueryClient } from "@/lib/getQueryClient";
import { AuthProvider } from "./contexts/AuthContext";
import { CategoryProvider } from "./contexts/CategoryContext";
import { DistrictProvider } from "./contexts/DistrictContext";
import { TransactionProvider } from "./contexts/TransactionContext";
import { SessionProviderWrapper } from "./SessionProviderWrapper";

interface AppProvidersProps {
  children: ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  const queryClient = getQueryClient();

  return (
    <SessionProvider>
      <QueryClientProvider client={queryClient}>
        <SessionProviderWrapper>
          <CategoryProvider>
            <DistrictProvider>
              <TransactionProvider>{children}</TransactionProvider>
            </DistrictProvider>
          </CategoryProvider>
        </SessionProviderWrapper>
      </QueryClientProvider>
    </SessionProvider>
  );
}
