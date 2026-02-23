import {
  useQuery,
  useMutation,
  useQueryClient,
  UseQueryOptions,
} from "@tanstack/react-query";
import {
  getAllCategories,
  getActiveCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  reorderCategories,
  Category,
  CreateCategoryInput,
} from "@/server/categories.server";

const QUERY_KEY = ["categories"];

/**
 * Fetch active categories only (for dropdown/select)
 */
export function useActiveCategories(
  options?: UseQueryOptions<Category[], Error>,
) {
  return useQuery<Category[], Error>({
    queryKey: [...QUERY_KEY, "active"],
    queryFn: async () => {
      const data = await getActiveCategories();
      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
    ...options,
  });
}

/**
 * Fetch all categories
 */
export function useCategories(options?: UseQueryOptions<Category[], Error>) {
  return useQuery<Category[], Error>({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      const result = await getAllCategories();
      if (!result.success) {
        throw new Error(result.error || "Failed to fetch categories");
      }
      return result.data || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
    ...options,
  });
}

/**
 * Fetch single category
 */
export function useCategory(id: string) {
  return useQuery<Category, Error>({
    queryKey: [...QUERY_KEY, id],
    queryFn: async () => {
      const result = await getCategoryById(id);
      if (!result.success) {
        throw new Error(result.error || "Failed to fetch category");
      }
      if (!result.data) {
        throw new Error("Category not found");
      }
      return result.data;
    },
    enabled: !!id,
  });
}

/**
 * Create category mutation
 */
export function useCreateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateCategoryInput) => {
      const result = await createCategory(input);
      if (!result.success) {
        throw new Error(result.error || "Failed to create category");
      }
      return result.data;
    },
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
    onError: (error: Error) => {
      console.error("❌ Create category error:", error.message);
    },
  });
}

/**
 * Update category mutation
 */
export function useUpdateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      input,
    }: {
      id: string;
      input: Partial<CreateCategoryInput>;
    }) => {
      const result = await updateCategory(id, input);
      if (!result.success) {
        throw new Error(result.error || "Failed to update category");
      }
      return result.data;
    },
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
    onError: (error: Error) => {
      console.error("❌ Update category error:", error.message);
    },
  });
}

/**
 * Delete category mutation
 */
export function useDeleteCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const result = await deleteCategory(id);
      if (!result.success) {
        throw new Error(result.error || "Failed to delete category");
      }
    },
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
    onError: (error: Error) => {
      console.error("❌ Delete category error:", error.message);
    },
  });
}

/**
 * Reorder categories mutation
 */
export function useReorderCategories() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      updates: Array<{ id: string; display_order: number }>,
    ) => {
      const result = await reorderCategories(updates);
      if (!result.success) {
        throw new Error(result.error || "Failed to reorder categories");
      }
    },
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
    onError: (error: Error) => {
      console.error("❌ Reorder categories error:", error.message);
    },
  });
}
