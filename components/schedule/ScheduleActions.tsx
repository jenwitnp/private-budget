import type { Schedule } from "@/server/schedule.server";

interface ScheduleActionsProps {
  schedule: Schedule;
  onEdit: (date?: string, schedule?: Schedule) => void;
  onDelete: (id: string) => void;
  compact?: boolean;
}

export function ScheduleActions({
  schedule,
  onEdit,
  onDelete,
  compact = false,
}: ScheduleActionsProps) {
  // Determine visibility based on transaction status
  const hasApprovedOrPaidTransaction =
    schedule.transaction_status === "approved" ||
    schedule.transaction_status === "paid";
  const hasRejectedTransaction = schedule.transaction_status === "rejected";

  // Hide all buttons if rejected
  if (hasRejectedTransaction) {
    return null;
  }

  const buttonClasses = {
    base: compact
      ? "py-1.5 px-2 font-medium text-xs transition-all duration-200 flex items-center justify-center gap-1 hover:scale-105 active:scale-95"
      : "py-2.5 px-3 font-medium text-sm transition-all duration-200 flex items-center justify-center gap-2 hover:scale-105 active:scale-95",
    outline: {
      purple:
        "border-2 border-purple-500 text-purple-500 hover:bg-purple-50 rounded-lg",
      blue: "border-2 border-blue-500 text-blue-500 hover:bg-blue-50 rounded-lg",
      red: "border-2 border-red-500 text-red-500 hover:bg-red-50 rounded-lg",
    },
  };

  // If approved or paid, show only camera button (full width)
  if (hasApprovedOrPaidTransaction) {
    return (
      <div
        className={`flex gap-2 ${compact ? "pt-1" : "pt-2 border-t border-slate-200"}`}
      >
        <button
          onClick={() => {}}
          className={`w-full ${buttonClasses.base} ${buttonClasses.outline.purple} rounded-lg`}
        >
          <i className={`fa-solid fa-camera ${compact ? "" : "text-lg"}`}></i>
          อัพรูป
        </button>
      </div>
    );
  }

  // Default: show all three buttons
  return (
    <div
      className={`flex gap-2 ${compact ? "pt-1" : "pt-2 border-t border-slate-200"}`}
    >
      <button
        onClick={() => {}}
        className={`flex-1 ${buttonClasses.base} ${buttonClasses.outline.purple} rounded-lg`}
      >
        <i className={`fa-solid fa-camera ${compact ? "" : "text-lg"}`}></i>
        อัพรูป
      </button>
      <button
        onClick={() => onEdit(undefined, schedule)}
        className={`flex-1 ${buttonClasses.base} ${buttonClasses.outline.blue} rounded-lg`}
      >
        <i className={`fa-solid fa-edit ${compact ? "" : "text-lg"}`}></i>
        แก้ไข
      </button>
      <button
        onClick={() => onDelete(schedule.id)}
        className={`flex-1 ${buttonClasses.base} ${buttonClasses.outline.red} rounded-lg`}
      >
        <i className={`fa-solid fa-trash ${compact ? "" : "text-lg"}`}></i>
        ลบ
      </button>
    </div>
  );
}
