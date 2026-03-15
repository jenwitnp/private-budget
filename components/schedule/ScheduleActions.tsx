import { useState } from "react";
import { useSession } from "next-auth/react";
import type { Schedule } from "@/server/schedule.server";
import { ImageUploadModal } from "./ImageUploadModal";

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
  const { data: session } = useSession();
  const [showImageModal, setShowImageModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Determine visibility based on transaction status
  const hasApprovedOrPaidTransaction =
    schedule.transaction_status === "approved" ||
    schedule.transaction_status === "paid";
  const hasRejectedTransaction = schedule.transaction_status === "rejected";

  // Hide all buttons if rejected
  if (hasRejectedTransaction) {
    return null;
  }

  // Handle delete with loading state
  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete(schedule.id);
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle edit with loading state
  const handleEdit = async () => {
    setIsEditing(true);
    try {
      await onEdit(undefined, schedule);
    } finally {
      setIsEditing(false);
    }
  };

  const buttonClasses = {
    base: compact
      ? "py-1.5 px-2 font-medium text-xs transition-all duration-200 flex items-center justify-center gap-1 hover:scale-105 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
      : "py-2.5 px-3 font-medium text-sm transition-all duration-200 flex items-center justify-center gap-2 hover:scale-105 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100",
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
      <>
        <div
          className={`flex gap-2 ${compact ? "pt-1" : "pt-2 border-t border-slate-200"}`}
        >
          <button
            onClick={() => setShowImageModal(true)}
            disabled={showImageModal}
            className={`w-full ${buttonClasses.base} ${buttonClasses.outline.purple} rounded-lg`}
          >
            <i
              className={`fa-solid fa-camera ${compact ? "" : "text-lg"} ${
                showImageModal ? "animate-spin" : ""
              }`}
            ></i>
            อัพรูป
          </button>
        </div>
        {session?.user?.id && (
          <ImageUploadModal
            isOpen={showImageModal}
            onClose={() => setShowImageModal(false)}
            schedule={schedule}
            userId={session.user.id}
          />
        )}
      </>
    );
  }

  // Default: show all three buttons
  return (
    <>
      <div
        className={`flex gap-2 ${compact ? "pt-1" : "pt-2 border-t border-slate-200"}`}
      >
        <button
          onClick={() => setShowImageModal(true)}
          disabled={showImageModal}
          className={`flex-1 ${buttonClasses.base} ${buttonClasses.outline.purple} rounded-lg`}
        >
          <i
            className={`fa-solid fa-camera ${compact ? "" : "text-lg"} ${
              showImageModal ? "animate-spin" : ""
            }`}
          ></i>
          อัพรูป
        </button>
        <button
          onClick={handleEdit}
          disabled={isEditing}
          className={`flex-1 ${buttonClasses.base} ${buttonClasses.outline.blue} rounded-lg`}
        >
          <i
            className={`fa-solid fa-edit ${compact ? "" : "text-lg"} ${
              isEditing ? "animate-spin" : ""
            }`}
          ></i>
          {isEditing ? "กำลังแก้ไข" : "แก้ไข"}
        </button>
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className={`flex-1 ${buttonClasses.base} ${buttonClasses.outline.red} rounded-lg`}
        >
          <i
            className={`fa-solid fa-trash ${compact ? "" : "text-lg"} ${
              isDeleting ? "animate-spin" : ""
            }`}
          ></i>
          {isDeleting ? "กำลังลบ" : "ลบ"}
        </button>
      </div>
      {session?.user?.id && (
        <ImageUploadModal
          isOpen={showImageModal}
          onClose={() => setShowImageModal(false)}
          schedule={schedule}
          userId={session.user.id}
        />
      )}
    </>
  );
}
