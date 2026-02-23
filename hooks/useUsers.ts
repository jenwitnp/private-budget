import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  type User,
  type CreateUserInput,
  type UpdateUserInput,
} from "@/server/users.server";

const QUERY_KEY = ["users"];

/**
 * Get all users
 */
export function useUsers(options = {}) {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      const result = await getUsers();
      if (!result.success) throw new Error(result.error);
      return result.data || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    ...options,
  });
}

/**
 * Get single user by ID
 */
export function useUser(id: string | null) {
  return useQuery({
    queryKey: [...QUERY_KEY, id],
    queryFn: async () => {
      if (!id) throw new Error("User ID required");
      const result = await getUserById(id);
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    enabled: !!id,
  });
}

/**
 * Create new user
 */
export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateUserInput) => {
      console.log("🚀 useCreateUser - Sending:", input);
      const result = await createUser(input);
      console.log("✅ useCreateUser - Response:", result);
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEY,
      });
    },
    onError: (error) => {
      console.error("❌ Create user error:", error);
    },
  });
}

/**
 * Update user
 */
export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      input,
    }: {
      id: string;
      input: UpdateUserInput;
    }) => {
      console.log("🚀 useUpdateUser - Sending:", { id, input });
      const result = await updateUser(id, input);
      console.log("✅ useUpdateUser - Response:", result);
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEY,
      });
    },
    onError: (error) => {
      console.error("❌ Update user error:", error);
    },
  });
}

/**
 * Delete user
 */
export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      console.log("🚀 useDeleteUser - Deleting:", id);
      const result = await deleteUser(id);
      console.log("✅ useDeleteUser - Response:", result);
      if (!result.success) throw new Error(result.error);
      return result.data || true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEY,
      });
    },
    onError: (error) => {
      console.error("❌ Delete user error:", error);
    },
  });
}
