"use client";

import { ReactNode } from "react";
import { SessionProvider } from "next-auth/react";
import { QueryClientProvider } from "@tanstack/react-query";
import { getQueryClient } from "@/lib/getQueryClient";
import { AuthProvider } from "./contexts/AuthContext";
import { CategoryProvider } from "./contexts/CategoryContext";
import { DistrictProvider } from "./contexts/DistrictContext";
import { TransactionProvider } from "./contexts/TransactionContext";
import { ToastProvider } from "./contexts/ToastContext";
import { SessionProviderWrapper } from "./SessionProviderWrapper";
import { GlobalToastContainer } from "./GlobalToastContainer";

interface AppProvidersProps {
  children: ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  const queryClient = getQueryClient();

  return (
    <SessionProvider>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <SessionProviderWrapper>
            <CategoryProvider>
              <DistrictProvider>
                <TransactionProvider>
                  <GlobalToastContainer />
                  {children}
                </TransactionProvider>
              </DistrictProvider>
            </CategoryProvider>
          </SessionProviderWrapper>
        </ToastProvider>
      </QueryClientProvider>
    </SessionProvider>
  );
}
