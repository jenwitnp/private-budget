/**
 * Rejection Modal Component
 * Modal for rejecting a pending transaction with reason
 */

"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { useSession } from "next-auth/react";
import { Modal } from "@/components/ui/Modal";
import { Textarea } from "@/components/form/Textarea";
import { rejectTransactionAction } from "@/actions/workflow";

interface RejectionModalProps {
  isOpen: boolean;
  transactionId: string;
  onClose: () => void;
  onSuccess?: () => void;
}

interface RejectionFormData {
  reason: string;
}

export function RejectionModal({
  isOpen,
  transactionId,
  onClose,
  onSuccess,
}: RejectionModalProps) {
  const { data: session } = useSession();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RejectionFormData>();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (data: RejectionFormData) => {
    try {
      setIsLoading(true);
      setError(null);

      if (!session?.user?.id) {
        throw new Error("User session not found");
      }

      await rejectTransactionAction(
        transactionId,
        session.user.id,
        session.user.role || "",
        data.reason,
      );

      reset();
      onSuccess?.();
      onClose();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Error rejecting transaction";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="ปฏิเสธรายการ"
      isLoading={isLoading}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="w-full max-w-md">
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            <i className="fas fa-exclamation-circle mr-2"></i>
            {error}
          </div>
        )}

        <div className="mb-6">
          <p className="text-sm text-slate-600 mb-4">
            คุณกำลังจะปฏิเสธรายการถอนเงินนี้ โปรดระบุเหตุผล
          </p>

          <Textarea
            label="เหตุผล"
            register={register("reason", {
              required: "กรุณาระบุเหตุผลในการปฏิเสธ",
            })}
            placeholder="ระบุเหตุผลในการปฏิเสธรายการ..."
            error={errors.reason}
            rows={4}
            required
          />
        </div>

        <div className="flex gap-3 pt-6 border-t border-slate-200">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 px-4 py-2.5 border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ยกเลิก
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                กำลังประมวลผล...
              </>
            ) : (
              "ปฏิเสธ"
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
