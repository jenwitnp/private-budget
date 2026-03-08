import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import type { InfiniteData } from "@tanstack/react-query";
import Layout from "@/components/layout/Layout";
import { Card } from "@/components/ui/Card";
import {
  fetchComplaintsAction,
  fetchComplaintStatsAction,
  updateComplaintStatusAction,
  replyToComplaintAction,
  fetchComplaintDetailAction,
} from "@/actions/complaints";
import type { Complaint } from "@/server/complaints.server";
import { requireAuth } from "@/lib/auth/withAuth";

interface ComplaintStats {
  total: number;
  pending: number;
  in_progress: number;
  resolved: number;
  closed: number;
}

interface ComplaintReply {
  id: string;
  complaint_id: string;
  reply_text: string;
  user_id?: string;
  from_admin: boolean;
  created_at: string;
}

interface ComplaintResponse {
  success: boolean;
  data: Complaint[];
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    pageSize: number;
  };
}

export default function ComplaintsPage() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const sentinelRef = useRef<HTMLDivElement>(null);

  // State
  const [stats, setStats] = useState<ComplaintStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(
    null,
  );
  const [complaintReplies, setComplaintReplies] = useState<ComplaintReply[]>(
    [],
  );
  const [replyText, setReplyText] = useState("");
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [replyLoading, setReplyLoading] = useState(false);

  // Load stats
  useEffect(() => {
    const loadStats = async () => {
      try {
        const statsResult = await fetchComplaintStatsAction();
        if (statsResult.success) {
          setStats(statsResult.stats!);
        }
      } catch (err) {
        console.error("Error loading stats:", err);
      }
    };
    loadStats();
  }, [filterStatus, filterCategory]);

  // Infinite query for complaints
  const {
    data,
    isLoading,
    error: fetchError,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery<
    ComplaintResponse,
    Error,
    InfiniteData<ComplaintResponse>,
    string[],
    number
  >({
    queryKey: ["complaints", session?.user?.id, filterStatus, filterCategory],
    queryFn: async ({ pageParam }) => {
      const status = filterStatus === "all" ? undefined : filterStatus;
      const category = filterCategory === "all" ? undefined : filterCategory;
      return fetchComplaintsAction(status, category, pageParam, 10);
    },
    getNextPageParam: (lastPage) => {
      if (
        lastPage.pagination &&
        lastPage.pagination.currentPage < lastPage.pagination.totalPages
      ) {
        return lastPage.pagination.currentPage + 1;
      }
      return undefined;
    },
    initialPageParam: 1,
    enabled: !!session?.user,
  });

  // Flatten all complaints from all pages
  const complaints = (data?.pages || []).flatMap(
    (page) => page.data || [],
  ) as Complaint[];

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

  const handleViewDetail = async (complaint: Complaint) => {
    setLoadingDetail(true);
    try {
      const result = await fetchComplaintDetailAction(complaint.id);
      if (result.success && result.data) {
        setSelectedComplaint(complaint);
        setComplaintReplies(result.data.replies || []);
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to load complaint detail";
      setError(errorMessage);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleUpdateStatus = async (complaintId: string, newStatus: string) => {
    try {
      const result = await updateComplaintStatusAction(
        complaintId,
        newStatus as any,
      );

      if (result.success) {
        // Update cache with new status (surgical update - only affected complaints update)
        const queryKey = [
          "complaints",
          session?.user?.id,
          filterStatus,
          filterCategory,
        ];
        queryClient.setQueryData(
          queryKey,
          (oldData: InfiniteData<ComplaintResponse> | undefined) => {
            if (!oldData) return oldData;

            return {
              ...oldData,
              pages: oldData.pages.map((page) => ({
                ...page,
                data: page.data.map((complaint) =>
                  complaint.id === complaintId
                    ? { ...complaint, status: newStatus as any }
                    : complaint,
                ),
              })),
            };
          },
        );

        if (selectedComplaint?.id === complaintId) {
          setSelectedComplaint({
            ...selectedComplaint,
            status: newStatus as any,
          });
        }
        setError(null);
      } else {
        throw new Error("Failed to update status");
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to update status";
      setError(errorMessage);
      console.error("Error updating status:", err);
    }
  };

  const handleReply = async (complaintId: string) => {
    if (!replyText.trim()) return;

    setReplyLoading(true);
    try {
      const result = await replyToComplaintAction(
        complaintId,
        replyText,
        session?.user?.id,
      );

      if (result.success) {
        setReplyText("");
        // Reload complaint details with new reply
        const detailResult = await fetchComplaintDetailAction(complaintId);
        if (detailResult.success && detailResult.data) {
          setComplaintReplies(detailResult.data.replies || []);
        }
      } else {
        throw new Error("Failed to add reply");
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to add reply";
      setError(errorMessage);
      console.error("Error adding reply:", err);
    } finally {
      setReplyLoading(false);
    }
  };

  const statusBadgeColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: "bg-amber-100 text-amber-800",
      in_progress: "bg-blue-100 text-blue-800",
      resolved: "bg-emerald-100 text-emerald-800",
      closed: "bg-slate-100 text-slate-800",
    };
    return colors[status] || "bg-slate-100 text-slate-800";
  };

  const statusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: "รอดำเนินการ",
      in_progress: "กำลังดำเนินการ",
      resolved: "แก้ไขแล้ว",
      closed: "ปิดแล้ว",
    };
    return labels[status] || status;
  };

  const categoryBadgeColor = (category: string) => {
    const colors: Record<string, string> = {
      payment: "bg-red-100 text-red-800",
      delay: "bg-orange-100 text-orange-800",
      documentation: "bg-yellow-100 text-yellow-800",
      service: "bg-purple-100 text-purple-800",
      system: "bg-indigo-100 text-indigo-800",
      local_infrastructure: "bg-teal-100 text-teal-800",
      building_maintenance: "bg-cyan-100 text-cyan-800",
      cleanliness: "bg-green-100 text-green-800",
      administrative: "bg-pink-100 text-pink-800",
      safety: "bg-rose-100 text-rose-800",
      utilities: "bg-lime-100 text-lime-800",
      traffic: "bg-fuchsia-100 text-fuchsia-800",
      health: "bg-violet-100 text-violet-800",
      education: "bg-sky-100 text-sky-800",
      อื่นๆ: "bg-gray-100 text-gray-800",
    };
    return colors[category] || "bg-gray-100 text-gray-800";
  };

  const categoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      payment: "การจ่ายเงิน",
      delay: "ความล่าช้า",
      documentation: "เอกสาร",
      service: "บริการ",
      system: "ระบบ",
      local_infrastructure: "โครงสร้างท้องถิ่น",
      building_maintenance: "รักษาอาคาร",
      cleanliness: "ความสะอาด",
      administrative: "บริหาร",
      safety: "ความปลอดภัย",
      utilities: "สาธารณูปโภค",
      traffic: "จราจร",
      health: "สุขภาพ",
      education: "การศึกษา",
      อื่นๆ: "อื่นๆ",
    };
    return labels[category] || category;
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-slate-800">
            ข้อร้องเรียนทั้งหมด
          </h1>
          <span className="text-sm text-slate-600">
            รวม {stats?.total || 0} รายการ
          </span>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div
            className="mb-6 overflow-x-auto"
            style={
              {
                scrollbarWidth: "none",
                msOverflowStyle: "none",
              } as React.CSSProperties & {
                scrollbarWidth: string;
                msOverflowStyle: string;
              }
            }
          >
            <style>{`
              div[class*="overflow-x-auto"] {
                -webkit-scrollbar: none;
              }
              div[class*="overflow-x-auto"]::-webkit-scrollbar {
                display: none;
              }
            `}</style>
            <div className="flex gap-3 md:gap-4 md:grid md:grid-cols-5 pt-1 pb-1 flex-nowrap">
              <Card className="text-center p-4 md:p-4 shrink-0 w-28 md:w-auto">
                <p className="text-sm text-slate-600 font-medium">
                  ร้องเรียนทั้งหมด
                </p>
                <p className="text-2xl font-bold text-slate-900 mt-2">
                  {stats.total}
                </p>
              </Card>
              <Card className="text-center p-4 md:p-4 shrink-0 w-28 md:w-auto">
                <p className="text-sm text-amber-600 font-medium">
                  รอดำเนินการ
                </p>
                <p className="text-2xl font-bold text-amber-600 mt-2">
                  {stats.pending}
                </p>
              </Card>
              <Card className="text-center p-4 md:p-4 shrink-0 w-28 md:w-auto">
                <p className="text-sm text-blue-600 font-medium">
                  กำลังดำเนินการ
                </p>
                <p className="text-2xl font-bold text-blue-600 mt-2">
                  {stats.in_progress}
                </p>
              </Card>
              <Card className="text-center p-4 md:p-4 shrink-0 w-28 md:w-auto">
                <p className="text-sm text-emerald-600 font-medium">
                  ได้รับการแก้ไขแล้ว
                </p>
                <p className="text-2xl font-bold text-emerald-600 mt-2">
                  {stats.resolved}
                </p>
              </Card>
              <Card className="text-center p-4 md:p-4 shrink-0 w-28 md:w-auto">
                <p className="text-sm text-slate-600 font-medium">
                  ปิดงานไปแล้ว
                </p>
                <p className="text-2xl font-bold text-slate-600 mt-2">
                  {stats.closed}
                </p>
              </Card>
            </div>
          </div>
        )}

        {/* Filters */}
        <Card className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                สถานะ
              </label>
              <select
                value={filterStatus}
                onChange={(e) => {
                  setFilterStatus(e.target.value);
                }}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="all">ทั้งหมด</option>
                <option value="pending">รอดำเนินการ</option>
                <option value="in_progress">กำลังดำเนินการ</option>
                <option value="resolved">แก้ไขแล้ว</option>
                <option value="closed">ปิดแล้ว</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                หมวดหมู่
              </label>
              <select
                value={filterCategory}
                onChange={(e) => {
                  setFilterCategory(e.target.value);
                }}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="all">ทั้งหมด</option>
                <option value="payment">การจ่ายเงิน</option>
                <option value="delay">ความล่าช้า</option>
                <option value="documentation">เอกสาร</option>
                <option value="service">บริการ</option>
                <option value="system">ระบบ</option>
                <option value="local_infrastructure">โครงสร้างท้องถิ่น</option>
                <option value="building_maintenance">รักษาอาคาร</option>
                <option value="cleanliness">ความสะอาด</option>
                <option value="administrative">บริหาร</option>
                <option value="safety">ความปลอดภัย</option>
                <option value="utilities">สาธารณูปโภค</option>
                <option value="traffic">จราจร</option>
                <option value="health">สุขภาพ</option>
                <option value="education">การศึกษา</option>
                <option value="อื่นๆ">อื่นๆ</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Error Message */}
        {(error || fetchError) && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            <i className="fa-solid fa-exclamation-circle mr-2"></i>
            {error || fetchError?.message || "Failed to load data"}
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
              <p className="text-slate-600">กำลังโหลดข้อร้องเรียน...</p>
            </div>
          </div>
        )}

        {/* Complaints List */}
        {!isLoading && !fetchError && (
          <>
            {complaints.length === 0 ? (
              <Card className="py-12 text-center">
                <i className="fas fa-inbox text-4xl text-slate-300 mb-4 block"></i>
                <p className="text-slate-600">ไม่มีข้อร้องเรียน</p>
              </Card>
            ) : (
              <div className="space-y-4">
                {complaints.map((complaint) => (
                  <Card
                    key={complaint.id}
                    className="p-4 hover:shadow-md transition"
                  >
                    <div className="flex items-start justify-between gap-4 flex-wrap md:flex-nowrap">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                          <span className="text-sm font-mono text-slate-500">
                            #{complaint.id.substring(0, 8)}
                          </span>
                          <span
                            className={`px-2.5 py-1 rounded-full text-xs font-semibold ${statusBadgeColor(complaint.status)}`}
                          >
                            {statusLabel(complaint.status)}
                          </span>
                          {complaint.category && (
                            <span
                              className={`px-2.5 py-1 rounded-full text-xs font-semibold ${categoryBadgeColor(complaint.category)}`}
                            >
                              {categoryLabel(complaint.category)}
                            </span>
                          )}
                        </div>

                        <p className="text-sm md:text-base font-medium text-slate-800 mb-2 line-clamp-2">
                          {complaint.complaint_text}
                        </p>

                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-3 text-xs text-slate-600">
                          <div>
                            <span className="font-medium">วันที่</span>
                            <p>
                              {new Date(
                                complaint.created_at,
                              ).toLocaleDateString("th-TH")}
                            </p>
                          </div>
                          <div>
                            <span className="font-medium">เวลา</span>
                            <p>
                              {new Date(
                                complaint.created_at,
                              ).toLocaleTimeString("th-TH")}
                            </p>
                          </div>
                          {complaint.notes && (
                            <div>
                              <span className="font-medium">หมายเหตุ</span>
                              <p className="text-slate-500 truncate">
                                {complaint.notes}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 w-full md:w-auto">
                        {complaint.status !== "closed" && (
                          <select
                            value={complaint.status}
                            onChange={(e) =>
                              handleUpdateStatus(complaint.id, e.target.value)
                            }
                            className="px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          >
                            <option value="pending">รอดำเนินการ</option>
                            <option value="in_progress">กำลังดำเนินการ</option>
                            <option value="resolved">แก้ไขแล้ว</option>
                            <option value="closed">ปิดแล้ว</option>
                          </select>
                        )}
                        <button
                          onClick={() => handleViewDetail(complaint)}
                          className="px-3 py-1.5 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition whitespace-nowrap"
                        >
                          <i className="fa-solid fa-eye mr-1"></i>
                          ดูรายละเอียด
                        </button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}

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

        {/* Detail Modal */}
        {selectedComplaint && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
            <Card className="w-full max-w-2xl my-8">
              {/* Header */}
              <div className="p-6 border-b border-slate-200">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex-1">
                    <h2 className="text-xl font-bold text-slate-900">
                      ข้อร้องเรียน #{selectedComplaint.id.substring(0, 8)}
                    </h2>
                    <div className="flex items-center gap-2 mt-2">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-semibold ${statusBadgeColor(selectedComplaint.status)}`}
                      >
                        {statusLabel(selectedComplaint.status)}
                      </span>
                      {selectedComplaint.category && (
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-semibold ${categoryBadgeColor(selectedComplaint.category)}`}
                        >
                          {categoryLabel(selectedComplaint.category)}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedComplaint(null)}
                    className="text-slate-500 hover:text-slate-700"
                  >
                    <i className="fa-solid fa-times text-xl"></i>
                  </button>
                </div>

                {/* Status Update */}
                {selectedComplaint.status !== "closed" && (
                  <div className="mt-4">
                    <select
                      value={selectedComplaint.status}
                      onChange={(e) =>
                        handleUpdateStatus(selectedComplaint.id, e.target.value)
                      }
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                    >
                      <option value="pending">รอดำเนินการ</option>
                      <option value="in_progress">กำลังดำเนินการ</option>
                      <option value="resolved">แก้ไขแล้ว</option>
                      <option value="closed">ปิดแล้ว</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-6 space-y-4 max-h-96 overflow-y-auto">
                {/* Complaint Details */}
                <div>
                  <h3 className="font-semibold text-slate-900 mb-2">
                    รายละเอียด
                  </h3>
                  <p className="text-slate-700 leading-relaxed">
                    {selectedComplaint.complaint_text}
                  </p>
                </div>

                {/* Meta Info */}
                <div className="bg-slate-50 rounded-lg p-3 text-sm text-slate-600 space-y-1">
                  <p>
                    <span className="font-medium">LINE User ID:</span>{" "}
                    <span className="font-mono text-xs break-all">
                      {selectedComplaint.line_user_id}
                    </span>
                  </p>
                  <p>
                    <span className="font-medium">วันที่:</span>{" "}
                    {new Date(selectedComplaint.created_at).toLocaleString(
                      "th-TH",
                    )}
                  </p>
                  {selectedComplaint.notes && (
                    <p>
                      <span className="font-medium">หมายเหตุ:</span>{" "}
                      {selectedComplaint.notes}
                    </p>
                  )}
                </div>

                {/* Replies */}
                {loadingDetail ? (
                  <div className="text-center py-4">
                    <p className="text-slate-600 text-sm">
                      กำลังโหลดการตอบกลับ...
                    </p>
                  </div>
                ) : complaintReplies.length > 0 ? (
                  <div className="space-y-3">
                    <h3 className="font-semibold text-slate-900">
                      การตอบกลับ ({complaintReplies.length})
                    </h3>
                    <div className="space-y-2 bg-slate-50 rounded-lg p-3">
                      {complaintReplies.map((reply) => (
                        <div
                          key={reply.id}
                          className={`p-3 rounded ${
                            reply.from_admin
                              ? "bg-emerald-50 border-l-4 border-emerald-500"
                              : "bg-slate-100"
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-semibold text-slate-600">
                              {reply.from_admin ? "แอดมิน" : "ผู้ร้องเรียน"}
                            </span>
                            <span className="text-xs text-slate-500">
                              {new Date(reply.created_at).toLocaleString(
                                "th-TH",
                              )}
                            </span>
                          </div>
                          <p className="text-sm text-slate-800">
                            {reply.reply_text}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>

              {/* Reply Form */}
              <div className="p-6 border-t border-slate-200 space-y-3">
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="พิมพ์คำตอบของคุณที่นี่..."
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none text-sm"
                  rows={3}
                />

                <div className="flex gap-2">
                  <button
                    onClick={() => handleReply(selectedComplaint.id)}
                    disabled={!replyText.trim() || replyLoading}
                    className="flex-1 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg transition"
                  >
                    {replyLoading ? (
                      <>
                        <i className="fa-solid fa-spinner animate-spin mr-2"></i>
                        ส่ง
                      </>
                    ) : (
                      <>
                        <i className="fa-solid fa-paper-plane mr-2"></i>
                        ส่ง
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => setSelectedComplaint(null)}
                    className="flex-1 px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-medium rounded-lg transition"
                  >
                    ปิด
                  </button>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </Layout>
  );
}

export const getServerSideProps = requireAuth;
