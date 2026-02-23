import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/Card";
import { Input, Select } from "@/components/ui/Forms";
import { WithdrawModal } from "@/components/modals/WithdrawModal";
import { ApprovalModal } from "@/components/modals/ApprovalModal";
import { RejectionModal } from "@/components/modals/RejectionModal";
import { PaymentModal } from "@/components/modals/PaymentModal";
import { TransactionCard } from "@/components/TransactionCard";
import { useUserRole, usePermissions } from "@/lib/permissions/hooks";
import { useTransactions } from "@/hooks/useTransactions";
import type { WithdrawFormData } from "@/types/withdrawal";
import type { Transaction } from "@/components/TransactionCard";

export default function HistoryPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const userRole = useUserRole();
  const permissions = usePermissions();

  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    | "all"
    | "pending"
    | "approved"
    | "rejected"
    | "paid"
    | "success"
    | "failed"
    | "cancelled"
  >("all");
  const [daysFilter, setDaysFilter] = useState<number | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);

  // Workflow action states
  const [workflowAction, setWorkflowAction] = useState<{
    type: "approve" | "reject" | "pay" | null;
    transactionId: string | null;
  }>({ type: null, transactionId: null });

  useEffect(() => {
    if (session?.user?.email === "unauthorized") {
      router.push("/auth/login");
    }
  }, [session, router]);

  // Fetch transactions from Supabase
  const {
    data: transactionsResult,
    isLoading,
    error: fetchError,
  } = useTransactions(session?.user || null);

  const rawTransactions = transactionsResult?.data || [];
  const totalTransactions = transactionsResult?.total || 0;

  // Transform transactions to match Transaction interface
  const transactions = (rawTransactions as any[]).map(
    (tx) =>
      ({
        id: tx.id, // ✅ UUID primary key for all operations
        transactionNumber: tx.transaction_number, // Display value
        account: tx.account || "N/A",
        amount: tx.amount,
        status: tx.status as
          | "pending"
          | "approved"
          | "rejected"
          | "paid"
          | "success"
          | "failed"
          | "cancelled",
        date: tx.transaction_date,
        bankAccount: tx.bankAccount || "N/A",
      }) as Transaction,
  );

  const handleWithdrawSubmit = async (data: WithdrawFormData) => {
    try {
      console.log("Withdraw data:", data);
      // TODO: Call API to create transaction - already handled by actions/withdrawal.ts
      setIsWithdrawModalOpen(false);
      // Refresh transactions
      window.location.reload();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Error";
      setError(errorMessage);
    }
  };

  // Workflow action handlers
  const handleApprove = async (transactionId: string) => {
    if (!permissions.canApproveTransaction("pending")) {
      setError("คุณไม่มีสิทธิ์อนุมัติรายการนี้");
      return;
    }
    setWorkflowAction({ type: "approve", transactionId });
    console.log("🔵 Opening approval modal for:", transactionId);
  };

  const handleReject = async (transactionId: string) => {
    if (!permissions.canRejectTransaction("pending")) {
      setError("คุณไม่มีสิทธิ์ปฏิเสธรายการนี้");
      return;
    }
    setWorkflowAction({ type: "reject", transactionId });
    console.log("🔴 Opening rejection modal for:", transactionId);
  };

  const handlePay = async (transactionId: string) => {
    if (!permissions.canPayTransaction("approved")) {
      setError("คุณไม่มีสิทธิ์ทำการชำระเงินรายการนี้");
      return;
    }
    setWorkflowAction({ type: "pay", transactionId });
    console.log("💚 Opening payment modal for:", transactionId);
  };

  return (
    <DashboardLayout>
      {/* Header with Action Button */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-slate-800">ประวัติการถอน</h1>
        <button
          onClick={() => setIsWithdrawModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-lg transition-colors shadow-sm"
        >
          <i className="fa-solid fa-arrow-right-from-bracket"></i>
          ถอนเงิน
        </button>
      </div>

      {/* Filter Section */}
      <Card className="mb-6">
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1 w-full">
            <Input
              label="ค้นหา"
              icon="fa-search"
              placeholder="ค้นหาตามเลขที่รายการ, จำนวนเงิน..."
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="w-full md:w-48">
            <Select
              label="สถานะ"
              value={statusFilter}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                setStatusFilter(
                  (e.target.value as
                    | "all"
                    | "pending"
                    | "approved"
                    | "rejected"
                    | "paid"
                    | "success"
                    | "failed"
                    | "cancelled") || "all",
                )
              }
              options={[
                { value: "all", label: "ทั้งหมด" },
                { value: "pending", label: "รอดำเนินการ" },
                { value: "approved", label: "อนุมัติแล้ว" },
                { value: "rejected", label: "ปฏิเสธ" },
                { value: "paid", label: "ชำระแล้ว" },
                { value: "success", label: "สำเร็จ" },
                { value: "failed", label: "ล้มเหลว" },
                { value: "cancelled", label: "ยกเลิก" },
              ]}
            />
          </div>
          <div className="w-full md:w-48">
            <Select
              label="ช่วงเวลา"
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                setDaysFilter(
                  e.target.value ? parseInt(e.target.value) : undefined,
                )
              }
              options={[
                { value: "30", label: "30 วันล่าสุด" },
                { value: "60", label: "60 วันล่าสุด" },
                { value: "90", label: "90 วันล่าสุด" },
                { value: "", label: "ทั้งหมด" },
              ]}
            />
          </div>
        </div>
      </Card>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
            <p className="text-slate-600">กำลังโหลดรายการ...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {(fetchError || error) && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
          <i className="fa-solid fa-exclamation-circle mr-2"></i>
          {fetchError?.message || error || "เกิดข้อผิดพลาดในการโหลดข้อมูล"}
        </div>
      )}

      {/* Transaction Cards - Mobile First */}
      {!isLoading && !fetchError && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5 lg:gap-6">
          {transactions.length > 0 ? (
            transactions.map((tx) => (
              <TransactionCard
                key={tx.id}
                transaction={tx}
                onApprove={handleApprove}
                onReject={handleReject}
                onPay={handlePay}
              />
            ))
          ) : (
            /* Empty State */
            <Card>
              <div className="flex flex-col items-center justify-center py-12 px-4 md:col-span-2 lg:col-span-3">
                <div className="mb-4">
                  <i className="fas fa-inbox text-4xl text-slate-300"></i>
                </div>
                <h3 className="text-lg font-semibold text-slate-600 mb-2">
                  {searchTerm || statusFilter !== "all"
                    ? "ไม่พบรายการที่ค้นหา"
                    : "ไม่มีรายการ"}
                </h3>
                <p className="text-sm text-slate-500 text-center mb-6">
                  {searchTerm || statusFilter !== "all"
                    ? "ลองปรับตัวกรองและค้นหาใหม่"
                    : "ยังไม่มีรายการถอนเงิน กรุณาคลิกปุ่มถอนเงินเพื่อสร้างรายการใหม่"}
                </p>
                {!searchTerm && statusFilter === "all" && (
                  <button
                    onClick={() => setIsWithdrawModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-lg transition-colors"
                  >
                    <i className="fa-solid fa-plus"></i>
                    สร้างรายการใหม่
                  </button>
                )}
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Withdraw Modal */}
      <WithdrawModal
        isOpen={isWithdrawModalOpen}
        onClose={() => setIsWithdrawModalOpen(false)}
        onSubmit={handleWithdrawSubmit}
      />

      {/* Approval Modal */}
      <ApprovalModal
        isOpen={workflowAction.type === "approve"}
        transactionId={workflowAction.transactionId || ""}
        onClose={() => setWorkflowAction({ type: null, transactionId: null })}
        onSuccess={() => {
          // Refresh transactions
          window.location.reload();
        }}
      />

      {/* Rejection Modal */}
      <RejectionModal
        isOpen={workflowAction.type === "reject"}
        transactionId={workflowAction.transactionId || ""}
        onClose={() => setWorkflowAction({ type: null, transactionId: null })}
        onSuccess={() => {
          // Refresh transactions
          window.location.reload();
        }}
      />

      {/* Payment Modal */}
      <PaymentModal
        isOpen={workflowAction.type === "pay"}
        transactionId={workflowAction.transactionId || ""}
        onClose={() => setWorkflowAction({ type: null, transactionId: null })}
        onSuccess={() => {
          // Refresh transactions
          window.location.reload();
        }}
      />
    </DashboardLayout>
  );
}
