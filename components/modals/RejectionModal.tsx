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
import type { ClientTransaction } from "@/server/transactions.server";
import { Modal } from "@/components/ui/Modal";
import { Textarea } from "@/components/form/Textarea";
import { TransactionDetailContent } from "@/components/TransactionDetailContent";
import { rejectTransactionAction } from "@/actions/workflow";

interface RejectionModalProps {
  isOpen: boolean;
  transactionId: string;
  transaction?: ClientTransaction | null; // ✅ Accept pre-fetched transaction
  onClose: () => void;
  onSuccess?: () => void;
  onError?: (error: string) => void;
  onTransactionUpdate?: (
    transactionId: string,
    newStatus: "pending" | "approved" | "rejected" | "paid",
    displayAmount?: number,
  ) => void;
  queryClient?: QueryClient;
}

interface RejectionFormData {
  reason: string;
}

export function RejectionModal({
  isOpen,
  transactionId,
  transaction, // ✅ Use pre-fetched transaction
  onClose,
  onSuccess,
  onError,
  onTransactionUpdate,
  queryClient,
}: RejectionModalProps) {
  const { data: session } = useSession();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RejectionFormData>();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset form when modal opens fresh
  useEffect(() => {
    if (isOpen) {
      reset();
    }
  }, [isOpen, reset]);

  const onSubmit = async (data: RejectionFormData) => {
    try {
      setIsLoading(true);
      setError(null);

      if (!session?.user?.id) {
        throw new Error("User session not found");
      }

      await rejectTransactionAction(
        transactionId,
        session.user.id,
        session.user.role || "",
        data.reason,
      );

      // ✅ Update cache surgically (only this transaction re-renders)
      if (onTransactionUpdate) {
        onTransactionUpdate(transactionId, "rejected");
      } else if (queryClient) {
        // Fallback: invalidate if no update callback provided
        queryClient.invalidateQueries({ queryKey: ["transactions"] });
      }

      // ✅ Close modal first, form will reset via isOpen useEffect on next open
      onSuccess?.();
      onClose();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Error rejecting transaction";
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setIsLoading(false);
      // Reset form state on error (clear for next attempt)
      reset();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="ปฏิเสธรายการ"
      isLoading={isLoading}
      size="lg"
    >
      <div className="max-h-[85vh] overflow-y-auto">
        {/* Transaction Details Section */}
        {transaction && (
          <>
            <TransactionDetailContent
              transaction={transaction as any}
              isLoading={false}
              error={null}
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
