import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getUserSettings,
  updateSettings,
  changePassword,
  type UserSettings,
  type UpdateSettingsInput,
  type ChangePasswordInput,
} from "@/server/settings.server";

const QUERY_KEY = ["userSettings"];

/**
 * Fetch user settings
 */
export function useUserSettings(userId: string | null) {
  return useQuery({
    queryKey: [...QUERY_KEY, userId],
    queryFn: async () => {
      if (!userId) throw new Error("User ID is required");
      const result = await getUserSettings(userId);
      if (!result.success)
        throw new Error(result.error || "Failed to fetch settings");
      return result.data;
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
  });
}

/**
 * Update user settings
 */
export function useUpdateSettings(userId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateSettingsInput) => {
      if (!userId) throw new Error("User ID is required");
      const result = await updateSettings(userId, input);
      if (!result.success)
        throw new Error(result.error || "Failed to update settings");
      return result.data;
    },
    onSuccess: (data) => {
      if (userId) {
        queryClient.setQueryData([...QUERY_KEY, userId], data);
      }
    },
    onError: (error) => {
      console.error("❌ Update settings error:", error);
    },
  });
}

/**
 * Change password
 */
export function useChangePassword(userId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: ChangePasswordInput) => {
      if (!userId) throw new Error("User ID is required");
      const result = await changePassword(userId, input);

      if (!result.success) {
        const errorMessage =
          result.error?.trim() || "Failed to change password";
        console.error("❌ [CHANGE_PASSWORD] Error:", errorMessage);
        throw new Error(errorMessage);
      }

      console.log("✅ [CHANGE_PASSWORD] Success");
      return result;
    },
    onSuccess: () => {
      if (userId) {
        queryClient.invalidateQueries({
          queryKey: [...QUERY_KEY, userId],
        });
      }
    },
    onError: (error) => {
      console.error(
        "❌ Change password error:",
        error instanceof Error ? error.message : error,
      );
    },
  });
}
