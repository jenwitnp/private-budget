"use client";

import { Card } from "@/components/ui/Card";
import { useWorkflowVisibility, useUserRole } from "@/lib/permissions/hooks";
import { ActionGuard } from "@/lib/permissions/guards";

export interface Transaction {
  id: string; // UUID primary key
  transactionNumber: string; // Display value (TRX format)
  account: string;
  amount: number;
  status:
    | "pending"
    | "approved"
    | "rejected"
    | "paid"
    | "success"
    | "failed"
    | "cancelled";
  date: string;
  bankAccount: string;
  userId?: string;
}

interface TransactionCardProps {
  transaction: Transaction;
  onApprove?: (transactionId: string) => void;
  onReject?: (transactionId: string) => void;
  onPay?: (transactionId: string) => void;
}

export function TransactionCard({
  transaction: tx,
  onApprove,
  onReject,
  onPay,
}: TransactionCardProps) {
  const workflow = useWorkflowVisibility();
  const userRole = useUserRole();

  // Logging handler for workflow actions
  const logAction = (action: "approve" | "reject" | "pay") => {
    const logData = {
      timestamp: new Date().toISOString(),
      action,
      userRole,
      transactionId: tx.id,
      transactionStatus: tx.status,
      transactionAmount: tx.amount,
    };

    console.group(`🔐 Workflow Action: ${action.toUpperCase()}`);
    console.log("%cUser Role:", "color: #3b82f6; font-weight: bold;", userRole);
    console.log(
      "%cTransaction ID:",
      "color: #8b5cf6; font-weight: bold;",
      tx.id,
    );
    console.log(
      "%cTransaction Status:",
      "color: #f59e0b; font-weight: bold;",
      tx.status,
    );
    console.log(
      "%cAction Details:",
      "color: #10b981; font-weight: bold;",
      logData,
    );
    console.groupEnd();
  };

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
          <span
            className={`shrink-0 text-xs md:text-sm px-3 md:px-3.5 py-1.5 rounded-full font-semibold whitespace-nowrap flex items-center gap-1.5 ${
              tx.status === "paid"
                ? "bg-emerald-50 text-emerald-700"
                : tx.status === "success"
                  ? "bg-blue-50 text-blue-700"
                  : tx.status === "pending"
                    ? "bg-amber-50 text-amber-700"
                    : tx.status === "approved"
                      ? "bg-purple-50 text-purple-700"
                      : tx.status === "rejected" ||
                          tx.status === "failed" ||
                          tx.status === "cancelled"
                        ? "bg-red-50 text-red-700"
                        : "bg-slate-50 text-slate-700"
            }`}
          >
            <i
              className={`fas text-xs ${
                tx.status === "paid"
                  ? "fa-check-double"
                  : tx.status === "success"
                    ? "fa-check-circle"
                    : tx.status === "pending"
                      ? "fa-clock"
                      : tx.status === "approved"
                        ? "fa-thumbs-up"
                        : tx.status === "rejected" || tx.status === "failed"
                          ? "fa-times-circle"
                          : tx.status === "cancelled"
                            ? "fa-ban"
                            : "fa-info-circle"
              }`}
            ></i>
            {tx.status === "paid"
              ? "ชำระแล้ว"
              : tx.status === "success"
                ? "สำเร็จ"
                : tx.status === "pending"
                  ? "รอดำเนินการ"
                  : tx.status === "approved"
                    ? "อนุมัติแล้ว"
                    : tx.status === "rejected"
                      ? "ปฏิเสธ"
                      : tx.status === "failed"
                        ? "ล้มเหลว"
                        : tx.status === "cancelled"
                          ? "ยกเลิก"
                          : "ไม่ทราบ"}
          </span>
        </div>

        {/* Bank Account */}
        <div className="mb-4 pb-4 border-b border-slate-100">
          <p className="text-xs text-slate-500 font-medium mb-1.5">
            บัญชีธนาคาร
          </p>
          <p className="text-sm md:text-base font-semibold text-slate-800 mb-1">
            {tx.account}
          </p>
          <p className="text-xs text-slate-500 font-num font-medium">
            {tx.bankAccount}
          </p>
        </div>

        {/* Amount and Date Row */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-xs text-slate-500 font-medium mb-1.5">
              จำนวนเงิน
            </p>
            <p className="text-lg md:text-xl font-bold text-emerald-600 font-num">
              ฿{tx.amount.toLocaleString("th-TH")}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-500 font-medium mb-1.5">วันที่</p>
            <p className="text-lg md:text-xl font-bold text-slate-700 font-num">
              {new Date(tx.date).toLocaleDateString("th-TH")}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2">
          {/* View and Download - Always Available */}
          <div className="flex gap-2">
            <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 font-medium rounded-lg transition-colors text-sm md:text-base">
              <i className="fas fa-eye"></i>
              ดูรายละเอียด
            </button>
            <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-medium rounded-lg transition-colors text-sm md:text-base">
              <i className="fas fa-download"></i>
              ดาวน์โหลด
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
                  <button
                    disabled
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-slate-100 text-slate-400 font-medium rounded-lg text-xs md:text-sm cursor-not-allowed opacity-50"
                    title={`Status: ${tx.status} | Role: ${userRole} | Cannot approve`}
                  >
                    <i className="fas fa-check"></i>
                    อนุมัติ
                  </button>
                }
              >
                <button
                  onClick={() => {
                    logAction("approve");
                    onApprove?.(tx.id);
                  }}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium rounded-lg transition-colors text-xs md:text-sm"
                  title={`User Role: ${userRole} | Status: ${tx.status}`}
                >
                  <i className="fas fa-check"></i>
                  อนุมัติ
                </button>
              </ActionGuard>

              {/* Reject Button */}
              <ActionGuard
                action="reject"
                status={tx.status}
                fallback={
                  <button
                    disabled
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-slate-100 text-slate-400 font-medium rounded-lg text-xs md:text-sm cursor-not-allowed opacity-50"
                    title={`Status: ${tx.status} | Role: ${userRole} | Cannot reject`}
                  >
                    <i className="fas fa-times"></i>
                    ปฏิเสธ
                  </button>
                }
              >
                <button
                  onClick={() => {
                    logAction("reject");
                    onReject?.(tx.id);
                  }}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-50 hover:bg-red-100 text-red-700 font-medium rounded-lg transition-colors text-xs md:text-sm"
                  title={`User Role: ${userRole} | Status: ${tx.status}`}
                >
                  <i className="fas fa-times"></i>
                  ปฏิเสธ
                </button>
              </ActionGuard>

              {/* Pay Button */}
              <ActionGuard
                action="pay"
                status={tx.status}
                fallback={
                  <button
                    disabled
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-slate-100 text-slate-400 font-medium rounded-lg text-xs md:text-sm cursor-not-allowed opacity-50"
                    title={`Status: ${tx.status} | Role: ${userRole} | Cannot pay`}
                  >
                    <i className="fas fa-money-bill"></i>
                    ชำระแล้ว
                  </button>
                }
              >
                <button
                  onClick={() => {
                    logAction("pay");
                    onPay?.(tx.id);
                  }}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-medium rounded-lg transition-colors text-xs md:text-sm"
                  title={`User Role: ${userRole} | Status: ${tx.status}`}
                >
                  <i className="fas fa-money-bill"></i>
                  ชำระแล้ว
                </button>
              </ActionGuard>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
