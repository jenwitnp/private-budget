/**
 * Approval Modal Component
 * Modal for approving a pending transaction
 * Shows full transaction details before approval action
 */

"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useSession } from "next-auth/react";
import type { QueryClient } from "@tanstack/react-query";
import type { ClientTransaction } from "@/server/transactions.server";
import { Modal } from "@/components/ui/Modal";
import { Textarea } from "@/components/form/Textarea";
import { TransactionDetailContent } from "@/components/TransactionDetailContent";
import { approveTransactionAction } from "@/actions/workflow";

interface ApprovalModalProps {
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

interface ApprovalFormData {
  notes?: string;
}

export function ApprovalModal({
  isOpen,
  transactionId,
  transaction, // ✅ Use pre-fetched transaction
  onClose,
  onSuccess,
  onError,
  onTransactionUpdate,
  queryClient,
}: ApprovalModalProps) {
  const { data: session } = useSession();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ApprovalFormData>();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset form when modal opens fresh
  useEffect(() => {
    if (isOpen) {
      reset();
    }
  }, [isOpen, reset]);

  const onSubmit = async (data: ApprovalFormData) => {
    try {
      setIsLoading(true);
      setError(null);

      if (!session?.user?.id) {
        throw new Error("User session not found");
      }

      await approveTransactionAction(
        transactionId,
        session.user.id,
        session.user.role || "",
        data.notes,
      );

      // ✅ Update cache surgically (only this transaction re-renders)
      if (onTransactionUpdate) {
        onTransactionUpdate(transactionId, "approved");
      } else if (queryClient) {
        // Fallback: invalidate if no update callback provided
        queryClient.invalidateQueries({ queryKey: ["transactions"] });
      }

      // ✅ Close modal first, form will reset via isOpen useEffect on next open
      onSuccess?.();
      onClose();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Error approving transaction";
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
      title="อนุมัติรายการ"
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

            {/* Approval Form Section */}
            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-800 mb-4">
                  <i className="fas fa-check-circle text-blue-600 mr-2"></i>
                  ยืนยันการอนุมัติ
                </h3>

                {error && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                    <i className="fas fa-exclamation-circle mr-2"></i>
                    {error}
                  </div>
                )}

                {/* <p className="text-sm text-slate-600 mb-4">
                  คุณกำลังจะอนุมัติรายการถอนเงินนี้
                  ท่านสามารถเพิ่มหมายเหตุได้หากจำเป็น
                </p>

                <Textarea
                  label="หมายเหตุ"
                  register={register("notes")}
                  placeholder="เพิ่มหมายเหตุเกี่ยวกับการอนุมัติ..."
                  error={errors.notes}
                  rows={3}
                /> */}
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
                  className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      กำลังประมวลผล...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-check-circle"></i>
                      อนุมัติ
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
