import { QueryClient } from "@tanstack/react-query";

/**
 * Create a new QueryClient instance for server-side rendering
 * Each request gets its own instance to avoid data leakage across requests
 * @returns A new QueryClient instance with optimized defaults
 */
export function getQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Disable automatic refetching on window focus in SSR environment
        staleTime: 60 * 1000, // 1 minute
        gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
      },
    },
  });
}
