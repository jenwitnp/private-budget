"use client";

import { ReactNode } from "react";
import { useDistrictProvider } from "@/lib/providers/hooks/useDistrictProvider";
import { useCategoryProvider } from "@/lib/providers/hooks/useCategoryProvider";

interface LayoutProvidersProps {
  children: ReactNode;
}

/**
 * LayoutProviders component
 * Used to wrap layout and page content with data providers
 * Initializes and caches key data (districts, categories) at the layout level
 */
export function LayoutProviders({ children }: LayoutProvidersProps) {
  // Initialize district and category providers
  // These hooks will fetch and cache data in the context
  useDistrictProvider();
  useCategoryProvider();

  return <>{children}</>;
}
