import { useContext } from "react";
import { ToastContext } from "@/lib/providers/contexts/ToastContext";

/**
 * Hook to access global toast notifications from anywhere in the app
 *
 * @example
 * const { showToast } = useAppToast();
 * showToast("Saved successfully!", "success");
 * showToast("An error occurred", "error");
 */
export function useAppToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error("useAppToast must be used within ToastProvider");
  }

  return context;
}
