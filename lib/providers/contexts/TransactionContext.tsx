"use client";

import { createContext } from "react";
// Note: ClientTransaction is a client-side type, imported only for typing
// The actual import from transactions.server is in API routes

export interface ClientTransaction {
  id: string;
  transactionNumber: string;
  account: string;
  amount: number;
  displayAmount: number;
  itemName: string;
  status: "pending" | "approved" | "rejected" | "paid";
  date: string;
  bankAccount: string;
  userId?: string;
  createdByName?: string;
  approvedByName?: string;
  paidByName?: string;
  paymentMethod?: string;
  categoryName?: string;
  districtName?: string;
  thumbnail?: string | null;
}

interface TransactionFilters {
  searchTerm?: string;
  statusFilter?: "all" | "pending" | "approved" | "rejected" | "paid";
  dateStart?: string;
  dateEnd?: string;
  categoryId?: string;
  districtId?: string;
  subDistrictId?: string;
}

export type { TransactionFilters };

interface TransactionContextType {
  // Data
  transactions: ClientTransaction[];
  selectedTransaction: ClientTransaction | null;

  // State
  isLoading: boolean;
  error: string | null;

  // Actions
  setSelectedTransaction: (tx: ClientTransaction | null) => void;
  refetchTransactions: (filters?: TransactionFilters) => Promise<void>;
  updateTransaction: (id: string, data: Partial<ClientTransaction>) => void;
  deleteTransaction: (id: string) => void;

  // Filters
  currentFilters: TransactionFilters;
  setFilters: (filters: TransactionFilters) => void;
}

export type { TransactionContextType };

export const TransactionContext = createContext<
  TransactionContextType | undefined
>(undefined);

interface TransactionProviderProps {
  children: React.ReactNode;
  initialTransactions?: ClientTransaction[];
  initialFilters?: TransactionFilters;
}

export function TransactionProvider({
  children,
  initialTransactions = [],
  initialFilters = {},
}: TransactionProviderProps) {
  const value: TransactionContextType = {
    transactions: initialTransactions,
    selectedTransaction: null,
    isLoading: false,
    error: null,
    setSelectedTransaction: () => {},
    refetchTransactions: async () => {},
    updateTransaction: () => {},
    deleteTransaction: () => {},
    currentFilters: initialFilters,
    setFilters: () => {},
  };

  return (
    <TransactionContext.Provider value={value}>
      {children}
    </TransactionContext.Provider>
  );
}
