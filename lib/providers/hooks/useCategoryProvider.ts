import { useContext } from "react";
import { CategoryContext } from "../contexts/CategoryContext";
import type { CategoryData } from "../contexts/CategoryContext";

export function useCategoryProvider() {
  const context = useContext(CategoryContext);

  if (!context) {
    throw new Error("useCategoryProvider must be used within CategoryProvider");
  }

  return context;
}

// Hook for consuming category context
export function useCategories() {
  const context = useContext(CategoryContext);

  if (!context) {
    throw new Error("useCategories must be used within CategoryProvider");
  }

  return context;
}

// Hook for getting active categories only
export function useActiveCategories() {
  const { categories, isLoading, error } = useCategories();

  const activeCategories = categories.filter((cat) => cat.is_active);

  return {
    categories: activeCategories,
    data: activeCategories, // Alias for React Query compatibility
    isLoading,
    error,
  };
}
