import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { useEffect, useState, useRef, useCallback } from "react";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import type { InfiniteData } from "@tanstack/react-query";
import Layout from "@/components/layout/Layout";
import { Card } from "@/components/ui/Card";
import { TransactionFilters } from "@/components/TransactionFilters";
import { TransactionStatsGrid } from "@/components/TransactionStatsGrid";
import { FilterToggleButton } from "@/components/FilterToggleButton";
import { WithdrawButton } from "@/components/WithdrawButton";
import { WithdrawModal } from "@/components/modals/WithdrawModal";
import { ReportModal } from "@/components/modals/ReportModal";
import { TransactionCard } from "@/components/TransactionCard";
import { ToastContainer } from "@/components/ToastContainer";
import { usePermissions, useUserRole } from "@/lib/permissions/hooks";
import type { UserRole } from "@/lib/permissions/config";
import { getTransactionsAction } from "@/actions/transactions";
import { fetchTransactionStatsAction } from "@/actions/stats";
import { useToast } from "@/hooks/useToast";
import { useQuery } from "@tanstack/react-query";
import { WorkflowProvider } from "@/lib/context/WorkflowContext";
import {
  parseTransactionFiltersFromQuery,
  buildApiFilters,
} from "@/lib/helpers/transaction-query-helper";
import { requireAuth } from "@/lib/auth/withAuth";
import type { WithdrawFormData } from "@/types/withdrawal";
import type { ClientTransaction } from "@/server/transactions.server";

type TransactionResponse = Awaited<ReturnType<typeof getTransactionsAction>>;

// ✅ Inner component that uses the workflow context
function _HistoryPageContent({
  filters,
  setFilters,
  error,
  setError,
  userRole,
}: {
  filters: any;
  setFilters: (filters: any) => void;
  error: string | null;
  setError: (error: string | null) => void;
  userRole?: UserRole;
}) {
  // ✅ Workflow context is now used directly within TransactionCard
  const { data: session } = useSession();
  const router = useRouter();
  const { toasts, removeToast } = useToast();
  const queryClient = useQueryClient();

  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isFiltersExpanded, setIsFiltersExpanded] = useState(false);

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

  // Helper: Build URL from filters
  const buildFilterUrl = useCallback((updatedFilters: typeof filters) => {
    const filterObject = {
      searchTerm: updatedFilters.searchTerm,
      statusFilter: updatedFilters.statusFilter,
      dateStart: updatedFilters.dateStart,
      dateEnd: updatedFilters.dateEnd,
      categoryId: updatedFilters.categoryId,
      districtId: updatedFilters.districtId,
      subDistrictId: updatedFilters.subDistrictId,
    };

    const params = new URLSearchParams();
    params.append("filters", JSON.stringify(filterObject));

    return `/history?${params.toString()}`;
  }, []);

  // Handle status filter changes - update both state and URL
  const handleStatusFilterClick = useCallback(
    (newStatus: string) => {
      const newFilters = { ...filters, statusFilter: newStatus };
      setFilters(newFilters);
      router.push(buildFilterUrl(newFilters));
    },
    [filters, router, buildFilterUrl],
  );

  // Get status label in Thai
  const getStatusLabel = (status: string): string => {
    const statusMap: Record<string, string> = {
      all: "ทั้งหมด",
      pending: "รออนุมัติ",
      approved: "อนุมัติแล้ว",
      rejected: "ปฎิเสธ",
      paid: "ชำระแล้ว",
    };
    return statusMap[status] || "ทั้งหมด";
  };

  // Fetch transaction stats for all statuses using RPC function
  console.log("🔍 [History] Query enabled check:", {
    hasUserId: !!session?.user?.id,
    hasUserRole: !!userRole,
    userId: session?.user?.id,
    userRole,
  });

  const { data: statsResponse, isLoading: statsLoading } = useQuery({
    queryKey: [
      "transaction-stats",
      session?.user?.id,
      userRole,
      JSON.stringify(filters),
    ],
    queryFn: async () => {
      console.log("📊 [History] Fetching stats with:", {
        userId: session?.user?.id,
        userRole,
        search: filters.searchTerm || undefined,
        categoryId: filters.categoryId || undefined, // UUID string
        districtId: filters.districtId
          ? parseInt(filters.districtId)
          : undefined, // BIGINT
        subDistrictId: filters.subDistrictId
          ? parseInt(filters.subDistrictId)
          : undefined, // BIGINT
      });

      const result = await fetchTransactionStatsAction(
        session?.user?.id,
        userRole,
        filters.searchTerm || undefined,
        filters.categoryId || undefined, // categoryId is UUID (keep as string)
        filters.districtId ? parseInt(filters.districtId) : undefined, // districtId is BIGINT
        filters.subDistrictId ? parseInt(filters.subDistrictId) : undefined, // subDistrictId is BIGINT
        filters.dateStart || undefined,
        filters.dateEnd || undefined,
      );

      console.log("📊 [History] Fetch result:", result);
      return result;
    },
    enabled: !!session?.user?.id && !!userRole,
  });

  const stats = statsResponse?.success ? statsResponse.data : null;

  console.log("🔍 [History] Stats Debug:", {
    statsResponse,
    statsSuccess: statsResponse?.success,
    stats,
    statsLoading,
    statsError: statsResponse?.error,
    showCondition: !!stats && !statsLoading,
  });

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
      setIsWithdrawModalOpen(false);

      // ✅ Invalidate with precise query key matching current filters
      // This ensures the new transaction is fetched with correct parameters
      const transactionQueryKey = [
        "transactions",
        session?.user?.id,
        JSON.stringify(filters),
      ];

      await queryClient.invalidateQueries({
        queryKey: transactionQueryKey,
        exact: true,
      });

      // Also invalidate stats to update the counter (include userRole for consistency)
      await queryClient.invalidateQueries({
        queryKey: [
          "transaction-stats",
          session?.user?.id,
          userRole,
          JSON.stringify(filters),
        ],
        exact: true,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Error";
      setError(errorMessage);
    }
  };

  return (
    <Layout>
      {/* Toast Container */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      {/* Header with Action Button */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-800">
          {getStatusLabel(filters.statusFilter)}{" "}
          {data?.pages[0]?.total ? `${data.pages[0].total} รายการ` : ""}
        </h1>
        <div className="flex items-center gap-2">
          {/* Filter Toggle Button - Mobile Only */}
          <FilterToggleButton
            isExpanded={isFiltersExpanded}
            onClick={() => setIsFiltersExpanded(!isFiltersExpanded)}
            filters={filters}
          />
          {/* Withdraw Button */}
          <WithdrawButton onClick={() => setIsWithdrawModalOpen(true)} />
          {/* Report Button */}
          <button
            onClick={() => setIsReportModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors shadow-sm"
          >
            <i className="fas fa-file-pdf"></i>
            รายงาน
          </button>
        </div>
      </div>

      {/* Status Stats Grid */}
      {stats && !statsLoading && (
        <TransactionStatsGrid
          stats={stats}
          userRole={userRole}
          onStatusClick={handleStatusFilterClick}
        />
      )}

      {/* Stats Loading State */}
      {statsLoading && (
        <div className="mb-6 h-32 bg-slate-100 rounded-lg animate-pulse"></div>
      )}

      {/* Filter Section */}
      <TransactionFilters
        isFiltersExpanded={isFiltersExpanded}
        setIsFiltersExpanded={setIsFiltersExpanded}
      />

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

      {/* Report Modal */}
      <ReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        currentFilters={filters}
      />
    </Layout>
  );
}

// ✅ Wrapper with WorkflowContext provider
export default function HistoryPage() {
  const queryClient = useQueryClient();
  const permissions = usePermissions();
  const userRole = useUserRole();
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
        userRole={userRole}
      />
    </WorkflowProvider>
  );
}

export const getServerSideProps = requireAuth;
