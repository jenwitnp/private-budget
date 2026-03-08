import { useCallback } from "react";
import { useAppToast } from "@/hooks/useAppToast";

/**
 * Hook for handling form submissions with automatic toast notifications
 *
 * @param onSuccess - Callback function that gets called on successful submission
 * @param successMessage - Message to show on success (default: "Saved successfully!")
 * @param errorMessage - Message to show on error (can be string or function)
 *
 * @example
 * const { handleSubmit } = useFormWithToast(
 *   async (data) => await saveData(data),
 *   "Account saved!",
 *   (err) => `Error: ${err.message}`
 * );
 *
 * <form onSubmit={async (e) => {
 *   e.preventDefault();
 *   await handleSubmit(formData);
 * }}>
 */
export function useFormWithToast(
  onSuccess: (data?: any) => Promise<any>,
  successMessage: string = "Saved successfully!",
  errorMessage: string | ((error: Error) => string) = "Failed to save",
) {
  const { showToast } = useAppToast();

  const handleSubmit = useCallback(
    async (data?: any) => {
      try {
        const result = await onSuccess(data);
        showToast(successMessage, "success");
        return result;
      } catch (error) {
        const message =
          typeof errorMessage === "function"
            ? errorMessage(
                error instanceof Error ? error : new Error(String(error)),
              )
            : errorMessage;
        showToast(message, "error");
        throw error;
      }
    },
    [onSuccess, successMessage, errorMessage, showToast],
  );

  return { handleSubmit };
}
