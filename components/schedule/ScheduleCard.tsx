import { Card } from "@/components/ui/Card";
import type { Schedule } from "@/server/schedule.server";
import type { TransactionDetailWithCategories } from "@/server/transactions.server";
import { getTransactionDetailById } from "@/server/transactions.server";
import { useState, useEffect } from "react";
import type { QueryClient } from "@tanstack/react-query";
import { ApproveRejectModal } from "@/components/modals/ApproveRejectModal";
import { ScheduleActions } from "@/components/schedule/ScheduleActions";
import { ImagesGalleryModal } from "@/components/schedule/ImagesGalleryModal";
import { fetchScheduleImagesAction } from "@/actions/schedule-images";

interface ScheduleCardProps {
  schedule: Schedule;
  onEdit: (date?: string, schedule?: Schedule) => void;
  onDelete: (id: string) => void;
  compact?: boolean;
  queryClient?: QueryClient;
}

// Helper function to determine if date is overdue
const isDatePassed = (dateString: string): boolean => {
  const scheduleDate = new Date(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return scheduleDate < today;
};

// Helper function to format date to Thai format
const formatThaiDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString("th-TH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

// Helper function to format date and time to Thai format
const formatThaiDateTime = (dateString: string): string => {
  const date = new Date(dateString);
  const dateFormatted = date.toLocaleDateString("th-TH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
  const timeFormatted = date.toLocaleTimeString("th-TH", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  return `${dateFormatted} ${timeFormatted}`;
};

// Helper function to get status display
const getStatusDisplay = (status: string, dateString: string) => {
  if (status === "completed") {
    return {
      text: "เสร็จสิ้น",
      bg: "bg-green-100",
      text_color: "text-green-700",
    };
  } else if (status === "cancelled") {
    return { text: "ยกเลิก", bg: "bg-red-100", text_color: "text-red-700" };
  } else if (status === "active" && isDatePassed(dateString)) {
    return {
      text: "เลยกำหนด",
      bg: "bg-orange-100",
      text_color: "text-orange-700",
    };
  }
  return {
    text: "กำลังดำเนินการ",
    bg: "bg-blue-100",
    text_color: "text-blue-700",
  };
};

// Helper function to format time to HH:MM
const formatTime = (timeString: string): string => {
  if (!timeString) return "";
  // Extract HH:MM from time string (handles both "HH:MM" and "HH:MM:SS" formats)
  return timeString.substring(0, 5);
};

export function ScheduleCard({
  schedule,
  onEdit,
  onDelete,
  compact = false,
  queryClient,
}: ScheduleCardProps) {
  const statusDisplay = getStatusDisplay(
    schedule.status,
    schedule.scheduled_date,
  );
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [transactionDetail, setTransactionDetail] =
    useState<TransactionDetailWithCategories | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [showImagesGallery, setShowImagesGallery] = useState(false);
  const [imagesCount, setImagesCount] = useState(0);
  const [loadingImagesCount, setLoadingImagesCount] = useState(false);

  // Fetch images count when component mounts
  useEffect(() => {
    fetchImagesCount();
  }, [schedule.id]);

  const fetchImagesCount = async () => {
    try {
      setLoadingImagesCount(true);
      const result = await fetchScheduleImagesAction(schedule.id);
      if (result.success && result.images) {
        setImagesCount(result.images.length);
      }
    } catch (err) {
      console.error("Failed to fetch images count:", err);
    } finally {
      setLoadingImagesCount(false);
    }
  };

  const handleWithdrawalClick = async () => {
    if (schedule.transaction_status === "pending" && schedule.transaction_id) {
      setIsLoadingDetail(true);
      try {
        const result = await getTransactionDetailById(schedule.transaction_id);
        if (result.success && result.data) {
          setTransactionDetail(result.data);
          setShowApprovalModal(true);
        }
      } catch (error) {
        console.error("Failed to load transaction detail:", error);
      } finally {
        setIsLoadingDetail(false);
      }
    }
  };

  const handleApprovalSuccess = () => {
    setRefreshKey((prev) => prev + 1);
    setTransactionDetail(null);
  };

  if (compact) {
    return (
      <>
        <Card className="p-3 border mb-4 border-slate-200 hover:shadow-md transition-shadow">
          <div className="space-y-2">
            {/* User Name and Created Date */}
            {(schedule.first_name || schedule.last_name) && (
              <div className="text-xs justify-between text-slate-500 font-medium flex items-center gap-2 pb-2 border-b border-slate-200">
                <div>
                  <i className="fa-solid fa-user-circle text-slate-600 mr-1"></i>
                  <span>
                    {schedule.first_name} {schedule.last_name}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400">
                    วันที่สร้าง {formatThaiDateTime(schedule.created_at)}
                  </span>
                </div>
              </div>
            )}

            {/* Title */}
            {schedule.title && (
              <p className="text-sm font-semibold text-slate-800 line-clamp-1">
                {schedule.title}
              </p>
            )}

            {/* Time and Status */}
            <div className="flex justify-between items-start gap-2">
              <div className="flex-1">
                {schedule.time_start && schedule.time_end && (
                  <p className="text-sm font-semibold text-slate-700">
                    <i className="fa-solid fa-clock mr-2 text-blue-600"></i>
                    {formatTime(schedule.time_start)} -{" "}
                    {formatTime(schedule.time_end)}
                  </p>
                )}
              </div>
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${statusDisplay.bg} ${statusDisplay.text_color}`}
              >
                {statusDisplay.text}
              </span>
            </div>

            {/* Address */}
            {schedule.address && (
              <p className="text-sm text-slate-600 line-clamp-1">
                <i className="fa-solid fa-map-pin mr-2 text-red-600"></i>
                {schedule.address}
              </p>
            )}

            {/* Location Tags */}
            {(schedule.district_name || schedule.sub_district_name) && (
              <div className="flex gap-1 flex-wrap">
                {schedule.district_name && (
                  <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-700 rounded">
                    {schedule.district_name}
                  </span>
                )}
                {schedule.sub_district_name && (
                  <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-700 rounded">
                    {schedule.sub_district_name}
                  </span>
                )}
              </div>
            )}

            {/* Note */}
            {schedule.note && (
              <p className="text-xs text-slate-500 line-clamp-2 italic">
                {schedule.note}
              </p>
            )}

            {/* Images Badge */}
            {imagesCount > 0 && (
              <button
                onClick={() => setShowImagesGallery(true)}
                disabled={loadingImagesCount}
                className="w-full bg-purple-50 border border-purple-200 rounded-lg p-2 text-sm font-medium text-purple-700 hover:bg-purple-100 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <i className="fa-solid fa-image"></i>
                รูปภาพ ({imagesCount})
              </button>
            )}

            {/* Withdrawal Information */}
            {schedule.transaction_id && (
              <button
                onClick={handleWithdrawalClick}
                disabled={
                  schedule.transaction_status !== "pending" || isLoadingDetail
                }
                className={`w-full border-t border-slate-200 pt-2 mt-2 rounded transition-all ${
                  schedule.transaction_status === "pending"
                    ? "bg-yellow-50 -mx-3 px-3 py-2 hover:bg-yellow-100 cursor-pointer"
                    : "cursor-default"
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1">
                    <span className="text-md text-slate-600 font-medium">
                      ฿
                      {(
                        schedule.transaction_net_amount ||
                        schedule.transaction_amount ||
                        0
                      ).toLocaleString("th-TH")}
                    </span>
                  </div>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap ${
                      schedule.transaction_status === "paid"
                        ? "bg-green-100 text-green-700"
                        : schedule.transaction_status === "approved"
                          ? "bg-blue-100 text-blue-700"
                          : schedule.transaction_status === "rejected"
                            ? "bg-red-100 text-red-700"
                            : "bg-yellow-200 text-yellow-800 font-bold animate-pulse"
                    }`}
                  >
                    {schedule.transaction_status === "paid" && "จ่ายแล้ว"}
                    {schedule.transaction_status === "approved" && "อนุมัติ"}
                    {schedule.transaction_status === "rejected" && "ปฏิเสธ"}
                    {schedule.transaction_status === "pending" && "รอดำเนินการ"}
                  </span>
                </div>
                {schedule.transaction_status === "pending" && (
                  <div className="text-xs text-yellow-600 mt-1 flex items-center gap-1">
                    {isLoadingDetail ? (
                      <>
                        <span className="inline-block w-3 h-3 border-2 border-yellow-700 border-t-transparent rounded-full animate-spin" />
                        <span>กำลังโหลด...</span>
                      </>
                    ) : (
                      <>
                        <span>คลิกเพื่อดำเนินการ</span>
                      </>
                    )}
                  </div>
                )}
              </button>
            )}

            {/* Actions */}
            <ScheduleActions
              schedule={schedule}
              onEdit={onEdit}
              onDelete={onDelete}
              compact
            />
          </div>
        </Card>

        {/* Approve/Reject Modal */}
        {schedule.transaction_id && transactionDetail && (
          <ApproveRejectModal
            key={refreshKey}
            isOpen={showApprovalModal}
            transactionId={schedule.transaction_id}
            transaction={transactionDetail as any}
            queryClient={queryClient}
            onClose={() => {
              setShowApprovalModal(false);
              setTransactionDetail(null);
            }}
            onSuccess={handleApprovalSuccess}
          />
        )}

        {/* Images Gallery Modal */}
        <ImagesGalleryModal
          isOpen={showImagesGallery}
          schedule={schedule}
          onClose={() => setShowImagesGallery(false)}
        />
      </>
    );
  }

  return (
    <>
      <Card className="p-4 border border-slate-200 hover:shadow-md transition-shadow">
        <div className="space-y-3">
          {/* User Name and Created Date */}
          {(schedule.first_name || schedule.last_name) && (
            <div className="text-xs justify-between text-slate-500 font-medium flex items-center gap-2 pb-2 border-b border-slate-200">
              <div>
                <i className="fa-solid fa-user-circle text-slate-600 mr-1"></i>
                <span>
                  {schedule.first_name} {schedule.last_name}
                </span>
              </div>
              <div>
                <span className="text-slate-400">
                  วันที่สร้าง {formatThaiDateTime(schedule.created_at)}
                </span>
              </div>
            </div>
          )}

          {/* Title */}
          {schedule.title && (
            <p className="text-lg font-bold text-slate-800">
              <i className="fa-solid fa-tag mr-2 text-emerald-600"></i>
              {schedule.title}
            </p>
          )}

          {/* Time and Status */}
          <div className="flex justify-between items-start gap-2">
            <div className="flex-1">
              {schedule.time_start && schedule.time_end && (
                <p className="text-sm font-semibold text-slate-700">
                  <i className="fa-solid fa-clock mr-2 text-blue-600"></i>
                  {formatTime(schedule.time_start)} -{" "}
                  {formatTime(schedule.time_end)}
                </p>
              )}
            </div>
            <span
              className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${statusDisplay.bg} ${statusDisplay.text_color}`}
            >
              {statusDisplay.text}
            </span>
          </div>

          {/* Address */}
          {schedule.address && (
            <div>
              <p className="text-sm text-slate-600">
                <i className="fa-solid fa-map-pin mr-2 text-red-600"></i>
                {schedule.address}
              </p>
            </div>
          )}

          {/* District and Sub-district */}
          {(schedule.district_name || schedule.sub_district_name) && (
            <div className="flex gap-2 flex-wrap">
              {schedule.district_name && (
                <span className="text-xs px-2 py-1 bg-slate-100 text-slate-700 rounded">
                  {schedule.district_name}
                </span>
              )}
              {schedule.sub_district_name && (
                <span className="text-xs px-2 py-1 bg-slate-100 text-slate-700 rounded">
                  {schedule.sub_district_name}
                </span>
              )}
            </div>
          )}

          {/* Note */}
          {schedule.note && (
            <div>
              <p className="text-sm text-slate-600 italic border-l-2 border-slate-300 pl-2">
                {schedule.note}
              </p>
            </div>
          )}

          {/* Images Badge */}
          {imagesCount > 0 && (
            <button
              onClick={() => setShowImagesGallery(true)}
              disabled={loadingImagesCount}
              className="w-full bg-purple-50 border border-purple-200 rounded-lg p-3 text-sm font-medium text-purple-700 hover:bg-purple-100 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <i className="fa-solid fa-image"></i>
              ดูรูปภาพ ({imagesCount})
            </button>
          )}

          {/* Withdrawal Information */}
          {schedule.transaction_id && (
            <button
              onClick={handleWithdrawalClick}
              disabled={
                schedule.transaction_status !== "pending" || isLoadingDetail
              }
              className={`w-full border-t border-slate-200 pt-2 mt-2 rounded transition-all ${
                schedule.transaction_status === "pending"
                  ? "bg-yellow-50 -mx-3 px-3 py-2 hover:bg-yellow-100 cursor-pointer"
                  : "cursor-default"
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <i className="fa-solid fa-money-bill text-emerald-600"></i>
                  <span className="text-sm text-slate-600 font-medium">
                    ฿
                    {(
                      schedule.transaction_net_amount ||
                      schedule.transaction_amount ||
                      0
                    ).toLocaleString("th-TH")}
                  </span>
                </div>
                <span
                  className={`text-sm px-3 py-1 rounded-full font-medium whitespace-nowrap ${
                    schedule.transaction_status === "paid"
                      ? "bg-green-100 text-green-700"
                      : schedule.transaction_status === "approved"
                        ? "bg-blue-100 text-blue-700"
                        : schedule.transaction_status === "rejected"
                          ? "bg-red-100 text-red-700"
                          : "bg-yellow-200 text-yellow-800 font-bold animate-pulse"
                  }`}
                >
                  {schedule.transaction_status === "paid" && "จ่ายแล้ว"}
                  {schedule.transaction_status === "approved" && "อนุมัติ"}
                  {schedule.transaction_status === "rejected" && "ปฏิเสธ"}
                  {schedule.transaction_status === "pending" && "รอดำเนินการ"}
                </span>
              </div>
              {schedule.transaction_status === "pending" && (
                <div className="text-sm text-yellow-700 mt-2 flex items-center gap-2">
                  {isLoadingDetail ? (
                    <>
                      <i className="fa-solid fa-spinner animate-spin"></i>
                      <span>กำลังโหลด...</span>
                    </>
                  ) : (
                    <>
                      <i className="fa-solid fa-arrow-pointer"></i>
                      <span>คลิกเพื่อดำเนินการ (อนุมัติ/ปฏิเสธ)</span>
                    </>
                  )}
                </div>
              )}
            </button>
          )}

          {/* Actions */}
          <ScheduleActions
            schedule={schedule}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        </div>
      </Card>

      {/* Approve/Reject Modal */}
      {schedule.transaction_id && transactionDetail && (
        <ApproveRejectModal
          key={refreshKey}
          isOpen={showApprovalModal}
          transactionId={schedule.transaction_id}
          transaction={transactionDetail as any}
          queryClient={queryClient}
          onClose={() => {
            setShowApprovalModal(false);
            setTransactionDetail(null);
          }}
          onSuccess={handleApprovalSuccess}
        />
      )}

      {/* Images Gallery Modal */}
      <ImagesGalleryModal
        isOpen={showImagesGallery}
        schedule={schedule}
        onClose={() => setShowImagesGallery(false)}
      />
    </>
  );
}
