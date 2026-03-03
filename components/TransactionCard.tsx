"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import React from "react";
import { Card } from "@/components/ui/Card";
import { StatusBadge } from "@/components/StatusBadge";
import { ActionButton } from "@/components/ActionButton";
import { useWorkflowVisibility, useUserRole } from "@/lib/permissions/hooks";
import { ActionGuard } from "@/lib/permissions/guards";
import { useWorkflow } from "@/lib/context/WorkflowContext";

export interface Transaction {
  id: string; // UUID primary key
  transactionNumber: string; // Display value (TRX format)
  account: string;
  amount: number;
  displayAmount?: number; // Computed amount (net_amount when paid and different)
  status: "pending" | "approved" | "rejected" | "paid";
  date: string;
  bankAccount: string;
  userId?: string;
  itemName: string;
  createdByName?: string; // Who requested the withdrawal
  approvedByName?: string; // Who approved the transaction
  paidByName?: string; // Who paid the transaction
  paymentMethod?: string; // 'cash' or 'transfer'
  categoryName?: string; // Category name
  districtName?: string; // District name
  thumbnail?: string | null; // First image URL if exists
}

interface TransactionCardProps {
  transaction: Transaction;
}

function _TransactionCard({ transaction: tx }: TransactionCardProps) {
  const router = useRouter();
  const workflow = useWorkflowVisibility();
  const userRole = useUserRole();
  const {
    handleApprove,
    handleReject,
    handlePay,
    handleOpenDetail,
    workflowAction,
  } = useWorkflow();
  const [isOpeningPreview, setIsOpeningPreview] = useState(false);

  // Optimistic update state
  const [optimisticStatus, setOptimisticStatus] = useState<string | null>(null);
  const [loadingAction, setLoadingAction] = useState<
    "approve" | "reject" | "pay" | null
  >(null);

  // ✅ Clear loading state when modal closes (user closes without action)
  useEffect(() => {
    if (workflowAction.type === null && loadingAction !== null) {
      setLoadingAction(null);
      setOptimisticStatus(null);
    }
  }, [workflowAction.type]);

  // Display status - use optimistic if available, otherwise use actual
  const displayStatus = (optimisticStatus ||
    tx.status) as Transaction["status"];

  // Logging handler for workflow actions
  const logAction = (action: "approve" | "reject" | "pay") => {
    const logData = {
      timestamp: new Date().toISOString(),
      action,
      userRole,
      transactionId: tx.id,
      transactionStatus: tx.status,
      optimisticStatus,
      transactionAmount: tx.amount,
    };
  };

  // Handle approve with optimistic update
  const handleApproveClick = () => {
    logAction("approve");
    setOptimisticStatus("approved");
    setLoadingAction("approve");
    handleApprove(tx.id, tx as any);
  };

  // Handle reject with optimistic update
  const handleRejectClick = () => {
    logAction("reject");
    setOptimisticStatus("rejected");
    setLoadingAction("reject");
    handleReject(tx.id, tx as any);
  };

  // Handle pay with optimistic update
  const handlePayClick = () => {
    logAction("pay");
    setOptimisticStatus("paid");
    setLoadingAction("pay");
    handlePay(tx.id, tx as any);
  };

  // Callback to revert optimistic update on error
  const revertOptimisticUpdate = () => {
    setOptimisticStatus(null);
    setLoadingAction(null);
  };

  // Callback when modal closes (success or cancel)
  const handleModalClose = () => {
    setLoadingAction(null);
  };

  // Handle PDF preview - navigate to preview page with transaction ID
  const handlePreviewPDF = async () => {
    try {
      setIsOpeningPreview(true);
      console.log(`🔍 [PREVIEW] Opening PDF preview for transaction: ${tx.id}`);
      await router.push(`/pdf-preview?previewId=${tx.id}`);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      console.error("[PREVIEW] Failed to open preview:", errorMessage);
      alert(`Preview failed: ${errorMessage}`);
    } finally {
      setIsOpeningPreview(false);
    }
  };

  // Status to badge color mapping
  const statusColorMap: Record<string, { bg: string; text: string }> = {
    disabled: { bg: "bg-slate-100", text: "text-state-400" },
    pending: { bg: "bg-amber-100", text: "text-amber-400" },
    approved: { bg: "bg-purple-100", text: "text-purple-400" },
    rejected: { bg: "bg-red-100", text: "text-red-400" },
    paid: { bg: "bg-emerald-100", text: "text-emerald-400" },
  };

  const statusColor = statusColorMap[tx.status] || {
    bg: "bg-slate-100",
    text: "text-slate-400",
  };

  // Determine which workflow buttons to show based on status
  const isApprove = tx.status === "approved";
  const isReject = tx.status === "rejected";
  const isPay = tx.status === "paid";

  // Reject button can be performed on "pending" and "approved" statuses

  let rejectColor = {
    bg: "bg-slate-100",
    text: "text-slate-400",
  };
  let approvedColor = {
    bg: "bg-slate-100",
    text: "text-slate-400",
  };
  let paidColor = {
    bg: "bg-slate-100",
    text: "text-slate-400",
  };

  if (isApprove) {
    rejectColor = statusColorMap["disabled"];
    approvedColor = statusColorMap["approved"];
    paidColor = statusColorMap["disabled"];
  } else if (isReject) {
    rejectColor = statusColorMap["rejected"];
    approvedColor = statusColorMap["disabled"];
    paidColor = statusColorMap["disabled"];
  } else if (isPay) {
    rejectColor = statusColorMap["disabled"];
    approvedColor = statusColorMap["approved"];
    paidColor = statusColorMap["paid"];
  } else {
    rejectColor = statusColorMap["disabled"];
    approvedColor = statusColorMap["disabled"];
    paidColor = statusColorMap["disabled"];
  }

  return (
    <Card className="hover:shadow-md transition-shadow duration-200">
      {/* Mobile: Compact Card Layout */}
      <div className="p-4 md:p-6">
        {/* Top Row: Transaction ID and Status */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex-1 min-w-0">
            <p className="text-xs text-slate-500 font-medium mb-1">
              เลขที่รายการ
            </p>
            <p className="text-sm md:text-base font-bold text-slate-800 font-num break-all">
              {tx.transactionNumber}
            </p>
          </div>
          <div className="relative">
            <StatusBadge status={displayStatus} />
            {optimisticStatus && (
              <div className="absolute inset-0 animate-pulse opacity-50">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold text-white blur-sm">
                  ⏳
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Bank Account */}
        <div className="mb-4 pb-4 border-b border-slate-100">
          <p className="text-xs text-slate-500 font-medium mb-1.5">
            ชื่อรายการ
          </p>
          <p className="text-sm md:text-base font-semibold text-slate-800 mb-1">
            {tx.itemName}
          </p>
          <div className="flex items-center justify-between gap-3 mb-2">
            <p className="text-xs text-slate-500 font-num font-medium">
              {tx.paymentMethod === "cash" ? "เงินสด" : "โอน"} -{" "}
              {tx.categoryName} {tx.districtName ? `- ${tx.districtName}` : ""}{" "}
              {tx.districtName ? `- ${tx.districtName}` : ""}
            </p>
            {tx.thumbnail && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 whitespace-nowrap">
                <i className="fas fa-file-pdf"></i>
                มีภาพประกอบ
              </span>
            )}
          </div>
        </div>
        <div className="mb-4 flex justify-between pb-4 border-b border-slate-100">
          <div>
            <p className="text-xs text-slate-500 font-medium mb-1.5">
              ผู้ขอเบิก
            </p>

            <p className="text-xs text-slate-800 font-num font-medium">
              {tx.createdByName?.trim() || "N/A"}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium mb-1.5">
              ผู้อนุมัติ
            </p>

            <p className="text-xs text-slate-800 font-num font-medium">
              {tx.approvedByName?.trim() || "N/A"}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium mb-1.5">
              ผู้จ่ายเงิน
            </p>

            <p className="text-xs text-slate-800 font-num font-medium">
              {tx.paidByName?.trim() || "N/A"}
            </p>
          </div>
        </div>

        {/* Amount and Date Row */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-xs text-slate-500 font-medium mb-1.5">
              จำนวนเงิน
            </p>
            <p className="text-lg md:text-xl font-bold text-emerald-600 font-num">
              ฿{(tx.displayAmount || tx.amount).toLocaleString("th-TH")}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-500 font-medium mb-1.5">
              วันที่เวลา
            </p>
            <p className="text-lg md:text-xl font-bold text-slate-700 font-num">
              {new Date(tx.date).toLocaleString("th-TH", {
                year: "numeric",
                month: "numeric",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
                hour12: false,
              })}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2">
          {/* View and Download - Always Available */}
          <div className="flex gap-2">
            <button
              onClick={() => handleOpenDetail(tx.id)}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 font-medium rounded-lg transition-colors text-sm md:text-base"
            >
              <i className="fas fa-eye"></i>
              ดูรายละเอียด
            </button>
            <button
              onClick={handlePreviewPDF}
              disabled={isOpeningPreview}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-50 hover:bg-emerald-100 disabled:opacity-50 disabled:cursor-not-allowed text-emerald-700 font-medium rounded-lg transition-colors text-sm md:text-base"
            >
              {isOpeningPreview ? (
                <>
                  <i className="fas fa-spinner animate-spin"></i>
                  กำลังเปิด...
                </>
              ) : (
                <>
                  <i className="fas fa-eye"></i>
                  ดูรูป PDF
                </>
              )}
            </button>
          </div>

          {/* Workflow Actions - Permission-based (Only show for owner/admin) */}
          {userRole !== "user" && (
            <div className="flex gap-2 pt-2 border-t border-slate-100">
              {/* Approve Button */}
              <ActionGuard
                action="approve"
                status={tx.status}
                fallback={
                  <ActionButton
                    icon="fa-check"
                    label="อนุมัติ"
                    action="approve"
                    status={tx.status}
                    isEnabled={false}
                    isLoading={false}
                    statusColor={approvedColor}
                  />
                }
              >
                <ActionButton
                  icon="fa-check"
                  label="อนุมัติ"
                  action="approve"
                  status={tx.status}
                  isEnabled={true}
                  isLoading={loadingAction === "approve"}
                  statusColor={approvedColor}
                  onClick={handleApproveClick}
                />
              </ActionGuard>

              {/* Reject Button */}
              <ActionGuard
                action="reject"
                status={tx.status}
                fallback={
                  <ActionButton
                    icon="fa-times"
                    label="ปฏิเสธ"
                    action="reject"
                    status={tx.status}
                    isEnabled={false}
                    isLoading={false}
                    statusColor={rejectColor}
                  />
                }
              >
                <ActionButton
                  icon="fa-times"
                  label="ปฏิเสธ"
                  action="reject"
                  status={tx.status}
                  isEnabled={true}
                  isLoading={loadingAction === "reject"}
                  statusColor={rejectColor}
                  onClick={handleRejectClick}
                />
              </ActionGuard>

              {/* Pay Button */}
              <ActionGuard
                action="pay"
                status={tx.status}
                fallback={
                  <ActionButton
                    icon="fa-money-bill"
                    label={tx.status === "paid" ? "ชำระแล้ว" : "ชำระ"}
                    action="pay"
                    status={tx.status}
                    isEnabled={false}
                    isLoading={false}
                    statusColor={paidColor}
                  />
                }
              >
                <ActionButton
                  icon="fa-money-bill"
                  label="ชำระ"
                  action="pay"
                  status={tx.status}
                  isEnabled={true}
                  isLoading={loadingAction === "pay"}
                  statusColor={paidColor}
                  onClick={handlePayClick}
                />
              </ActionGuard>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

// ✅ Memoized export - prevents re-renders when props haven't changed
export const TransactionCard = React.memo(_TransactionCard);
