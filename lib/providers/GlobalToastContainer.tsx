"use client";

import { useAppToast } from "@/hooks/useAppToast";
import { ToastContainer } from "@/components/ToastContainer";

/**
 * Global Toast Container Wrapper
 * Displays all toasts from the ToastContext anywhere in the app
 * This component should be placed inside the ToastProvider
 */
export function GlobalToastContainer() {
  const { toasts, removeToast } = useAppToast();

  return <ToastContainer toasts={toasts} onRemove={removeToast} />;
}
