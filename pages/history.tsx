import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { useEffect, useState, useRef, useCallback } from "react";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import type { InfiniteData } from "@tanstack/react-query";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/Card";
import { Input, Select } from "@/components/ui/Forms";
import { TransactionFilters } from "@/components/TransactionFilters";
import { WithdrawModal } from "@/components/modals/WithdrawModal";
import { ApprovalModal } from "@/components/modals/ApprovalModal";
import { RejectionModal } from "@/components/modals/RejectionModal";
import { PaymentModal } from "@/components/modals/PaymentModal";
import { TransactionCard } from "@/components/TransactionCard";
import { ToastContainer } from "@/components/ToastContainer";
import { useUserRole, usePermissions } from "@/lib/permissions/hooks";
import { getTransactionsAction } from "@/actions/transactions";
import { useToast } from "@/hooks/useToast";
import {
  parseTransactionFiltersFromQuery,
  buildApiFilters,
} from "@/lib/helpers/transaction-query-helper";
import type { WithdrawFormData } from "@/types/withdrawal";
import type { Transaction } from "@/components/TransactionCard";

type TransactionResponse = Awaited<ReturnType<typeof getTransactionsAction>>;

export default function HistoryPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const userRole = useUserRole();
  const permissions = usePermissions();
  const queryClient = useQueryClient();
  const { toasts, showToast, removeToast } = useToast();

  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filter states combined into single object
  const [filters, setFilters] = useState({
    searchTerm: "",
    statusFilter: "all" as "all" | "pending" | "approved" | "rejected" | "paid",
    dateStart: "",
    dateEnd: "",
    categoryId: "",
    districtId: "",
    subDistrictId: "",
  });

  // Workflow action states
  const [workflowAction, setWorkflowAction] = useState<{
    type: "approve" | "reject" | "pay" | null;
    transactionId: string | null;
  }>({ type: null, transactionId: null });

  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (session?.user?.email === "unauthorized") {
      router.push("/auth/login");
    }
  }, [session, router]);

  // Map status to appropriate date column
  const getDateColumnByStatus = (status: string): string => {
    switch (status) {
      case "pending":
        return "created_at";
      case "approved":
        return "approved_at";
      case "rejected":
        return "rejected_at";
      case "paid":
        return "paid_at";
      default:
        return "created_at";
    }
  };

  // Parse filters from URL query parameters
  useEffect(() => {
    if (router.isReady) {
      const parsedFilters = parseTransactionFiltersFromQuery(
        router.query as Record<string, string | string[] | undefined>,
      );

      setFilters(parsedFilters);
    }
  }, [router.isReady, router.query]);

  // Infinite query for transactions
  const {
    data,
    isLoading,
    error: fetchError,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery<
    TransactionResponse,
    Error,
    InfiniteData<TransactionResponse>,
    string[],
    number
  >({
    queryKey: ["transactions", session?.user?.id, JSON.stringify(filters)],
    queryFn: async ({ pageParam }) => {
      // Build API filters from UI filter state
      const { apiFilters, gte, lte } = buildApiFilters(
        filters,
        getDateColumnByStatus,
      );

      const requestPayload = {
        user: session?.user || null,
        pageParam,
        search: filters.searchTerm,
        filters: Object.keys(apiFilters).length > 0 ? apiFilters : {},
        gte: Object.keys(gte).length > 0 ? gte : {},
        lte: Object.keys(lte).length > 0 ? lte : {},
        sortBy: "newest" as const,
        pageSize: 6,
      };

      return getTransactionsAction(requestPayload);
    },
    getNextPageParam: (lastPage) =>
      lastPage.currentPage && lastPage.totalPages
        ? lastPage.currentPage < lastPage.totalPages
          ? (lastPage.currentPage || 0) + 1
          : undefined
        : undefined,
    initialPageParam: 1,
    enabled: !!session?.user,
  });

  // Flatten all transactions from all pages
  const transactions: Transaction[] = (data?.pages || [])
    .flatMap((page) => page.data || [])
    .map(
      (tx: any) =>
        ({
          id: tx.id,
          transactionNumber: tx.transaction_number,
          account: tx.account || "N/A",
          amount: tx.amount,
          itemName: tx.item_name,
          status: tx.status as "pending" | "approved" | "rejected" | "paid",
          date: tx.transaction_date,
          bankAccount: tx.bankAccount || "N/A",
        }) as Transaction,
    );

  // Intersection observer for infinite scroll
  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: "100px",
      threshold: 0.1,
    };

    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    }, observerOptions);

    if (sentinelRef.current) {
      observer.observe(sentinelRef.current);
    }

    return () => {
      if (sentinelRef.current) {
        observer.unobserve(sentinelRef.current);
      }
    };
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

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

  // Handle successful action completion
  const handleActionSuccess = (actionType: string) => {
    console.log(`✅ ${actionType} action completed successfully`);
    // Invalidate transactions cache to refetch with updated status
    queryClient.invalidateQueries({ queryKey: ["transactions"] });
    // Close modal
    setWorkflowAction({ type: null, transactionId: null });
    // Show success toast
    showToast(`${actionType} สำเร็จ`, "success", 3000);
  };

  // Handle action error
  const handleActionError = (actionType: string, error: string) => {
    console.log(`❌ ${actionType} action failed:`, error);
    // Close modal
    setWorkflowAction({ type: null, transactionId: null });
    // Show error toast
    showToast(`${actionType} ล้มเหลว: ${error}`, "error", 5000);
  };

  return (
    <DashboardLayout>
      {/* Toast Container */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />

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
      <TransactionFilters />

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

      {/* Transaction Cards - Infinite Scroll */}
      {!isLoading && !fetchError && (
        <>
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
                    {filters.searchTerm ||
                    filters.statusFilter !== "all" ||
                    filters.dateStart ||
                    filters.dateEnd ||
                    filters.categoryId ||
                    filters.districtId ||
                    filters.subDistrictId
                      ? "ไม่พบรายการที่ค้นหา"
                      : "ไม่มีรายการ"}
                  </h3>
                  <p className="text-sm text-slate-500 text-center mb-6">
                    {filters.searchTerm ||
                    filters.statusFilter !== "all" ||
                    filters.dateStart ||
                    filters.dateEnd ||
                    filters.categoryId ||
                    filters.districtId ||
                    filters.subDistrictId
                      ? "ลองปรับตัวกรองและค้นหาใหม่"
                      : "ยังไม่มีรายการถอนเงิน กรุณาคลิกปุ่มถอนเงินเพื่อสร้างรายการใหม่"}
                  </p>
                  {!filters.searchTerm &&
                    filters.statusFilter === "all" &&
                    !filters.dateStart &&
                    !filters.dateEnd &&
                    !filters.categoryId &&
                    !filters.districtId &&
                    !filters.subDistrictId && (
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

          {/* Sentinel element for infinite scroll trigger */}
          <div ref={sentinelRef} className="flex justify-center py-8">
            {isFetchingNextPage && (
              <div className="flex items-center gap-2 text-slate-600">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-emerald-500"></div>
                <span>กำลังโหลดเพิ่มเติม...</span>
              </div>
            )}
          </div>
        </>
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
        onSuccess={() => handleActionSuccess("อนุมัติ")}
        onError={(error) => handleActionError("อนุมัติ", error)}
        queryClient={queryClient}
      />

      {/* Rejection Modal */}
      <RejectionModal
        isOpen={workflowAction.type === "reject"}
        transactionId={workflowAction.transactionId || ""}
        onClose={() => setWorkflowAction({ type: null, transactionId: null })}
        onSuccess={() => handleActionSuccess("ปฏิเสธ")}
        onError={(error) => handleActionError("ปฏิเสธ", error)}
        queryClient={queryClient}
      />

      {/* Payment Modal */}
      <PaymentModal
        isOpen={workflowAction.type === "pay"}
        transactionId={workflowAction.transactionId || ""}
        onClose={() => setWorkflowAction({ type: null, transactionId: null })}
        onSuccess={() => handleActionSuccess("ชำระแล้ว")}
        onError={(error) => handleActionError("ชำระแล้ว", error)}
        queryClient={queryClient}
      />
    </DashboardLayout>
  );
}
