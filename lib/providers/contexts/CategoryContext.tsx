"use client";

import { createContext, useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getActiveCategories } from "@/server/categories.server";
import type { Category } from "@/server/categories.server";

export interface CategoryData {
  id: string;
  name: string;
  is_active: boolean;
}

interface CategoryContextType {
  categories: CategoryData[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export type { CategoryContextType };

export const CategoryContext = createContext<CategoryContextType | undefined>(
  undefined,
);

interface CategoryProviderProps {
  children: React.ReactNode;
  initialCategories?: CategoryData[];
}

async function fetchCategories(): Promise<CategoryData[]> {
  const categories = await getActiveCategories();
  return categories.map((cat: Category) => ({
    id: cat.id,
    name: cat.name,
    is_active: cat.status === "active",
  }));
}

export function CategoryProvider({
  children,
  initialCategories = [],
}: CategoryProviderProps) {
  const [categories, setCategories] =
    useState<CategoryData[]>(initialCategories);
  const [error, setError] = useState<string | null>(null);

  // Use React Query for caching and data management
  const {
    data,
    isLoading,
    error: queryError,
    refetch,
  } = useQuery<CategoryData[]>({
    queryKey: ["categories"],
    queryFn: fetchCategories,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
  });

  // Update state when query data changes
  useEffect(() => {
    if (data) {
      setCategories(data);
      setError(null);
    } else if (queryError) {
      setError(
        queryError instanceof Error ? queryError.message : "Unknown error",
      );
    }
  }, [data, queryError]);

  const value: CategoryContextType = {
    categories,
    isLoading,
    error,
    refetch: async () => {
      await refetch();
    },
  };

  return (
    <CategoryContext.Provider value={value}>
      {children}
    </CategoryContext.Provider>
  );
}
