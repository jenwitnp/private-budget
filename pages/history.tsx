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
import { TransactionCard } from "@/components/TransactionCard";
import { ToastContainer } from "@/components/ToastContainer";
import { usePermissions } from "@/lib/permissions/hooks";
import { getTransactionsAction } from "@/actions/transactions";
import { useToast } from "@/hooks/useToast";
import { WorkflowProvider } from "@/lib/context/WorkflowContext";
import {
  parseTransactionFiltersFromQuery,
  buildApiFilters,
} from "@/lib/helpers/transaction-query-helper";
import type { WithdrawFormData } from "@/types/withdrawal";
import type { Transaction } from "@/components/TransactionCard";
import type { ClientTransaction } from "@/server/transactions.server";

type TransactionResponse = Awaited<ReturnType<typeof getTransactionsAction>>;

// ✅ Inner component that uses the workflow context
function _HistoryPageContent({
  filters,
  setFilters,
  error,
  setError,
}: {
  filters: any;
  setFilters: (filters: any) => void;
  error: string | null;
  setError: (error: string | null) => void;
}) {
  // ✅ Workflow context is now used directly within TransactionCard
  const { data: session } = useSession();
  const router = useRouter();
  const { toasts, removeToast } = useToast();

  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);

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

  // Flatten all transactions from all pages (already fully formatted by server)
  const transactions = (data?.pages || []).flatMap(
    (page) => page.data || [],
  ) as ClientTransaction[];

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
                <TransactionCard key={tx.id} transaction={tx} />
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
    </DashboardLayout>
  );
}

// ✅ Wrapper with WorkflowContext provider
export default function HistoryPage() {
  const queryClient = useQueryClient();
  const permissions = usePermissions();
  const { data: session } = useSession();
  const { showToast } = useToast();

  // Shared state
  const [filters, setFilters] = useState({
    searchTerm: "",
    statusFilter: "all" as "all" | "pending" | "approved" | "rejected" | "paid",
    dateStart: "",
    dateEnd: "",
    categoryId: "",
    districtId: "",
    subDistrictId: "",
  });
  const [error, setError] = useState<string | null>(null);

  return (
    <WorkflowProvider
      queryClient={queryClient}
      permissions={permissions}
      session={session}
      filters={filters}
      showToast={showToast}
      setError={setError}
    >
      <_HistoryPageContent
        filters={filters}
        setFilters={setFilters}
        error={error}
        setError={setError}
      />
    </WorkflowProvider>
  );
}
