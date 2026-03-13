import { Card } from "@/components/ui/Card";
import type { Schedule } from "@/server/schedule.server";

interface ScheduleCardProps {
  schedule: Schedule;
  onEdit: (date?: string, schedule?: Schedule) => void;
  onDelete: (id: string) => void;
  compact?: boolean;
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

export function ScheduleCard({
  schedule,
  onEdit,
  onDelete,
  compact = false,
}: ScheduleCardProps) {
  const statusDisplay = getStatusDisplay(
    schedule.status,
    schedule.scheduled_date,
  );

  if (compact) {
    return (
      <Card className="p-3 border border-slate-200 hover:shadow-md transition-shadow">
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
                  วันที่สร้าง {formatThaiDate(schedule.created_at)}
                </span>
              </div>
            </div>
          )}

          {/* Title */}
          {schedule.title && (
            <p className="text-sm font-semibold text-slate-800 line-clamp-1">
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
                  {schedule.time_start} - {schedule.time_end}
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

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <button
              onClick={() => onEdit(undefined, schedule)}
              className="flex-1 py-1.5 px-2 text-blue-600 hover:bg-blue-50 rounded font-medium text-xs transition-colors flex items-center justify-center gap-1"
            >
              <i className="fa-solid fa-edit"></i>
              แก้ไข
            </button>
            <button
              onClick={() => onDelete(schedule.id)}
              className="flex-1 py-1.5 px-2 text-red-600 hover:bg-red-50 rounded font-medium text-xs transition-colors flex items-center justify-center gap-1"
            >
              <i className="fa-solid fa-trash"></i>
              ลบ
            </button>
          </div>
        </div>
      </Card>
    );
  }

  return (
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
                วันที่สร้าง {formatThaiDate(schedule.created_at)}
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
                {schedule.time_start} - {schedule.time_end}
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

        {/* Actions */}
        <div className="flex gap-2 pt-2 border-t border-slate-200">
          <button
            onClick={() => onEdit(undefined, schedule)}
            className="flex-1 py-2 px-3 text-blue-600 hover:bg-blue-50 rounded-lg font-medium text-sm transition-colors flex items-center justify-center gap-2"
          >
            <i className="fa-solid fa-edit"></i>
            แก้ไข
          </button>
          <button
            onClick={() => onDelete(schedule.id)}
            className="flex-1 py-2 px-3 text-red-600 hover:bg-red-50 rounded-lg font-medium text-sm transition-colors flex items-center justify-center gap-2"
          >
            <i className="fa-solid fa-trash"></i>
            ลบ
          </button>
        </div>
      </div>
    </Card>
  );
}
