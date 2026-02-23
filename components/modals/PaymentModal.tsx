/**
 * Payment Modal Component
 * Modal for marking a transaction as paid
 */

"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { useSession } from "next-auth/react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Forms";
import { payTransactionAction } from "@/actions/workflow";

interface PaymentModalProps {
  isOpen: boolean;
  transactionId: string;
  onClose: () => void;
  onSuccess?: () => void;
}

interface PaymentFormData {
  bankReference?: string;
}

export function PaymentModal({
  isOpen,
  transactionId,
  onClose,
  onSuccess,
}: PaymentModalProps) {
  const { data: session } = useSession();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PaymentFormData>();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (data: PaymentFormData) => {
    try {
      setIsLoading(true);
      setError(null);

      if (!session?.user?.id) {
        throw new Error("User session not found");
      }

      await payTransactionAction(
        transactionId,
        session.user.id,
        session.user.role || "",
        data.bankReference,
      );

      reset();
      onSuccess?.();
      onClose();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Error processing payment";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="ยืนยันการชำระเงิน"
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
            คุณกำลังจะยืนยันการชำระเงินสำหรับรายการนี้
          </p>

          <Input
            label="หมายเลขอ้างอิงธนาคาร"
            placeholder="เช่น: TRF20240115001234"
            type="text"
            icon="fa-receipt"
            {...register("bankReference")}
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
            className="flex-1 px-4 py-2.5 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                กำลังประมวลผล...
              </>
            ) : (
              "ชำระเงินแล้ว"
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
