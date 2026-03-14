/**
 * Approve/Reject Modal Component
 * Modal for approving or rejecting a pending transaction
 * Shows full transaction details with both action buttons
 */

"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import type { QueryClient } from "@tanstack/react-query";
import type { ClientTransaction } from "@/server/transactions.server";
import { useAppToast } from "@/hooks/useAppToast";
import { Modal } from "@/components/ui/Modal";
import { TransactionDetailContent } from "@/components/TransactionDetailContent";
import {
  approveTransactionAction,
  rejectTransactionAction,
} from "@/actions/workflow";
import { getTransactionDetailById } from "@/server/transactions.server";
import { ActionGuard } from "@/lib/permissions/guards";
import { useUserRole } from "@/lib/permissions/hooks";

interface ApproveRejectModalProps {
  isOpen: boolean;
  transactionId: string;
  transaction?: ClientTransaction | null;
  onClose: () => void;
  onSuccess?: () => void;
  onError?: (error: string) => void;
  onTransactionUpdate?: (
    transactionId: string,
    newStatus: "pending" | "approved" | "rejected" | "paid",
    displayAmount?: number,
    updatedFields?: Partial<ClientTransaction>,
  ) => void;
  queryClient?: QueryClient;
}

export function ApproveRejectModal({
  isOpen,
  transactionId,
  transaction,
  onClose,
  onSuccess,
  onError,
  onTransactionUpdate,
  queryClient,
}: ApproveRejectModalProps) {
  const { data: session } = useSession();
  const { showToast } = useAppToast();
  const userRole = useUserRole();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedAction, setSelectedAction] = useState<
    "approve" | "reject" | null
  >(null);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setSelectedAction(null);
      setError(null);
    }
  }, [isOpen]);

  const handleApprove = async () => {
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
      );

      if (onTransactionUpdate) {
        const freshResult = await getTransactionDetailById(transactionId);
        onTransactionUpdate(transactionId, "approved", undefined, {
          approvedByName: freshResult?.data?.approved_by_name,
        });
      }

      if (queryClient) {
        // Invalidate all schedule queries to refresh the data
        queryClient.invalidateQueries({ queryKey: ["schedules"] });
      }

      showToast("อนุมัติรายการสำเร็จ!", "success");
      onSuccess?.();
      onClose();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Error approving transaction";
      setError(errorMessage);
      showToast(errorMessage, "error");
      onError?.(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReject = async () => {
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
        "ไม่ระบุเหตุผล",
      );

      if (onTransactionUpdate) {
        const freshResult = await getTransactionDetailById(transactionId);
        onTransactionUpdate(transactionId, "rejected", undefined, {
          rejectedByName: freshResult?.data?.rejected_by_name,
        });
      }

      if (queryClient) {
        // Invalidate all schedule queries to refresh the data
        queryClient.invalidateQueries({ queryKey: ["schedules"] });
      }

      showToast("ปฏิเสธรายการสำเร็จ!", "success");
      onSuccess?.();
      onClose();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Error rejecting transaction";
      setError(errorMessage);
      showToast(errorMessage, "error");
      onError?.(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="ดำเนินการกับรายการ"
      isLoading={isLoading}
      size="lg"
      footer={
        transaction && (
          <div className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                <i className="fas fa-exclamation-circle mr-2"></i>
                {error}
              </div>
            )}

            {!selectedAction && (
              <div>
                <h3 className="text-sm font-bold text-slate-800 mb-4">
                  <i className="fas fa-list-check text-blue-600 mr-2"></i>
                  เลือกการดำเนินการ
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {/* Approve Button - with Permission Guard */}
                  <ActionGuard
                    action="approve"
                    status="pending"
                    fallback={
                      <button
                        type="button"
                        disabled
                        className="px-4 py-3 border-2 border-slate-200 text-slate-400 rounded-lg font-medium bg-slate-50 cursor-not-allowed flex items-center justify-center gap-2 opacity-50"
                      >
                        <i className="fas fa-check-circle text-lg"></i>
                        <span>อนุมัติ</span>
                      </button>
                    }
                  >
                    <button
                      type="button"
                      onClick={() => setSelectedAction("approve")}
                      disabled={isLoading}
                      className="px-4 py-3 border-2 border-blue-300 text-blue-700 rounded-lg font-medium hover:bg-blue-50 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <i className="fas fa-check-circle text-lg"></i>
                      <span>อนุมัติ</span>
                    </button>
                  </ActionGuard>

                  {/* Reject Button - with Permission Guard */}
                  <ActionGuard
                    action="reject"
                    status="pending"
                    fallback={
                      <button
                        type="button"
                        disabled
                        className="px-4 py-3 border-2 border-slate-200 text-slate-400 rounded-lg font-medium bg-slate-50 cursor-not-allowed flex items-center justify-center gap-2 opacity-50"
                      >
                        <i className="fas fa-times-circle text-lg"></i>
                        <span>ปฏิเสธ</span>
                      </button>
                    }
                  >
                    <button
                      type="button"
                      onClick={() => setSelectedAction("reject")}
                      disabled={isLoading}
                      className="px-4 py-3 border-2 border-red-300 text-red-700 rounded-lg font-medium hover:bg-red-50 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <i className="fas fa-times-circle text-lg"></i>
                      <span>ปฏิเสธ</span>
                    </button>
                  </ActionGuard>
                </div>
              </div>
            )}

            {selectedAction === "approve" && (
              <div className="border-l-4 border-blue-500 bg-blue-50 p-4 rounded">
                <h4 className="font-medium text-blue-900 mb-2">
                  <i className="fas fa-check-circle mr-2"></i>
                  ยืนยันการอนุมัติ
                </h4>
                <p className="text-sm text-blue-800 mb-4">
                  คุณแน่ใจหรือไม่ที่จะอนุมัติการเบิกเงินนี้?
                </p>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedAction(null)}
                    disabled={isLoading}
                    className="flex-1 px-4 py-2.5 border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    ย้อนกลับ
                  </button>

                  {/* Approve Confirmation Button - with Permission Guard */}
                  <ActionGuard
                    action="approve"
                    status="pending"
                    fallback={
                      <button
                        type="button"
                        disabled
                        className="flex-1 px-4 py-2.5 bg-slate-400 text-white rounded-lg font-medium cursor-not-allowed flex items-center justify-center gap-2 opacity-50"
                      >
                        <i className="fas fa-lock"></i>
                        ไม่มีสิทธิ
                      </button>
                    }
                  >
                    <button
                      type="button"
                      onClick={handleApprove}
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
                          ยืนยันอนุมัติ
                        </>
                      )}
                    </button>
                  </ActionGuard>
                </div>
              </div>
            )}

            {selectedAction === "reject" && (
              <div className="border-l-4 border-red-500 bg-red-50 p-4 rounded">
                <h4 className="font-medium text-red-900 mb-2">
                  <i className="fas fa-times-circle mr-2"></i>
                  ยืนยันการปฏิเสธ
                </h4>
                <p className="text-sm text-red-800 mb-4">
                  คุณแน่ใจหรือไม่ที่จะปฏิเสธการเบิกเงินนี้?
                </p>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedAction(null)}
                    disabled={isLoading}
                    className="flex-1 px-4 py-2.5 border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    ย้อนกลับ
                  </button>

                  {/* Reject Confirmation Button - with Permission Guard */}
                  <ActionGuard
                    action="reject"
                    status="pending"
                    fallback={
                      <button
                        type="button"
                        disabled
                        className="flex-1 px-4 py-2.5 bg-slate-400 text-white rounded-lg font-medium cursor-not-allowed flex items-center justify-center gap-2 opacity-50"
                      >
                        <i className="fas fa-lock"></i>
                        ไม่มีสิทธิ
                      </button>
                    }
                  >
                    <button
                      type="button"
                      onClick={handleReject}
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
                          ยืนยันปฏิเสธ
                        </>
                      )}
                    </button>
                  </ActionGuard>
                </div>
              </div>
            )}
          </div>
        )
      }
    >
      {/* Transaction Details - Only in content area */}
      {transaction && (
        <TransactionDetailContent
          transaction={transaction as any}
          isLoading={false}
          error={null}
        />
      )}
    </Modal>
  );
}
