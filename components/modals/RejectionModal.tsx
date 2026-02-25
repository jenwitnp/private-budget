/**
 * Rejection Modal Component
 * Modal for rejecting a pending transaction with reason
 * Shows full transaction details before rejection action
 */

"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useSession } from "next-auth/react";
import type { QueryClient } from "@tanstack/react-query";
import { Modal } from "@/components/ui/Modal";
import { Textarea } from "@/components/form/Textarea";
import { TransactionDetailContent } from "@/components/TransactionDetailContent";
import { useTransactionDetail } from "@/hooks/useTransactionDetail";
import { rejectTransactionAction } from "@/actions/workflow";

interface RejectionModalProps {
  isOpen: boolean;
  transactionId: string;
  onClose: () => void;
  onSuccess?: () => void;
  onError?: (error: string) => void;
  queryClient?: QueryClient;
}

interface RejectionFormData {
  reason: string;
}

export function RejectionModal({
  isOpen,
  transactionId,
  onClose,
  onSuccess,
  onError,
  queryClient,
}: RejectionModalProps) {
  const { data: session } = useSession();
  const {
    data: transaction,
    isLoading: transactionLoading,
    error: transactionError,
  } = useTransactionDetail(isOpen ? transactionId : null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RejectionFormData>();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Debug: Log transaction status when modal opens/data loads
  useEffect(() => {
    if (isOpen && transaction) {
      console.group("🔍 [RejectionModal] Transaction Loaded from Hook");
      console.log("Transaction ID:", transaction.id);
      console.log("Transaction Status:", transaction.status);
      console.log("Full Transaction:", transaction);
      console.groupEnd();
    }
  }, [isOpen, transaction]);

  const onSubmit = async (data: RejectionFormData) => {
    try {
      setIsLoading(true);
      setError(null);

      if (!session?.user?.id) {
        throw new Error("User session not found");
      }

      console.group("📤 [RejectionModal] Submitting Rejection");
      console.log("Transaction ID:", transactionId);
      console.log("Transaction Status FROM HOOK:", transaction?.status);
      console.log(
        "Expected Status: 'pending' | Actual Status:",
        transaction?.status,
      );
      console.log(
        "Match?",
        transaction?.status === "pending" ? "✅ YES" : "❌ NO",
      );
      console.log("User ID:", session.user.id);
      console.log("Reason:", data.reason);
      console.groupEnd();

      await rejectTransactionAction(
        transactionId,
        session.user.id,
        session.user.role || "",
        data.reason,
      );

      console.log("✅ [RejectionModal] Rejection successful");

      // Invalidate cache to refetch transactions
      if (queryClient) {
        console.log("🔄 [RejectionModal] Invalidating transactions cache");
        queryClient.invalidateQueries({ queryKey: ["transactions"] });
      }

      reset();
      onSuccess?.();
      onClose();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Error rejecting transaction";
      console.error("❌ [RejectionModal] Error:", errorMessage);
      console.group("⚠️  [RejectionModal] Submission Failed - Debug Info");
      console.log("Error Message:", errorMessage);
      console.log("Transaction Status from Hook:", transaction?.status);
      console.log("Expected: pending | Actual:", transaction?.status);
      console.groupEnd();
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="ปฏิเสธรายการ"
      isLoading={isLoading || transactionLoading}
      size="lg"
    >
      <div className="max-h-[85vh] overflow-y-auto">
        {/* Transaction Details Section */}
        {transaction && (
          <>
            <TransactionDetailContent
              transaction={transaction}
              isLoading={transactionLoading}
              error={transactionError as Error | null}
            />

            {/* Divider */}
            <div className="border-t border-slate-200 my-6"></div>

            {/* Rejection Form Section */}
            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-800 mb-4">
                  <i className="fas fa-times-circle text-red-600 mr-2"></i>
                  ยืนยันการปฏิเสธ
                </h3>

                {error && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                    <i className="fas fa-exclamation-circle mr-2"></i>
                    {error}
                  </div>
                )}

                <p className="text-sm text-slate-600 mb-4">
                  คุณกำลังจะปฏิเสธรายการถอนเงินนี้ โปรดระบุเหตุผล
                </p>

                <Textarea
                  label="เหตุผล"
                  register={register("reason", {
                    required: "กรุณาระบุเหตุผลในการปฏิเสธ",
                  })}
                  placeholder="ระบุเหตุผลในการปฏิเสธรายการ..."
                  error={errors.reason}
                  rows={3}
                  required
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isLoading}
                  className="flex-1 px-4 py-2.5 border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      กำลังประมวลผล...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-times-circle"></i>
                      ปฏิเสธ
                    </>
                  )}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </Modal>
  );
}
