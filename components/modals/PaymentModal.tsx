/**
 * Payment Modal Component
 * Modal for marking a transaction as paid
 * Shows full transaction details before payment confirmation
 */

"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useSession } from "next-auth/react";
import type { QueryClient } from "@tanstack/react-query";
import { Modal } from "@/components/ui/Modal";
import { CurrencyInput } from "@/components/form/CurrencyInput";
import { TransactionDetailContent } from "@/components/TransactionDetailContent";
import { useTransactionDetail } from "@/hooks/useTransactionDetail";
import { payTransactionAction } from "@/actions/workflow";
import { formatCurrency } from "@/lib/helpers/formatCurrency";

interface PaymentModalProps {
  isOpen: boolean;
  transactionId: string;
  onClose: () => void;
  onSuccess?: () => void;
  onError?: (error: string) => void;
  queryClient?: QueryClient;
}

interface PaymentFormData {
  bankReference?: string;
  net_amount?: string;
}

export function PaymentModal({
  isOpen,
  transactionId,
  onClose,
  onSuccess,
  onError,
  queryClient,
}: PaymentModalProps) {
  const { data: session } = useSession();
  const {
    data: transaction,
    isLoading: transactionLoading,
    error: transactionError,
  } = useTransactionDetail(isOpen ? transactionId : null);
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<PaymentFormData>({
    defaultValues: {
      bankReference: "0.00",
    },
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Set initial value when transaction loads
  useEffect(() => {
    if (transaction?.amount) {
      const formattedAmount = formatCurrency(transaction.amount, 2);
      setValue("bankReference", formattedAmount);
      setValue("net_amount", formattedAmount);
    }
  }, [transaction?.amount, setValue]);

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
        data.net_amount,
      );

      // Invalidate cache to refetch transactions
      if (queryClient) {
        queryClient.invalidateQueries({ queryKey: ["transactions"] });
      }

      reset();
      onSuccess?.();
      onClose();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Error processing payment";
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="ยืนยันการชำระเงิน"
      isLoading={isLoading || transactionLoading}
      size="lg"
    >
      <div className="max-h-[85vh] overflow-y-auto">
        {/* Transaction Details Section */}
        {transaction && (
          <>
            <TransactionDetailContent
              transaction={transaction}
              isLoading={transactionLoading}
              error={transactionError as Error | null}
            />

            {/* Divider */}
            <div className="border-t border-slate-200 my-6"></div>

            {/* Payment Form Section */}
            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-800 mb-4">
                  <i className="fas fa-money-bill text-emerald-600 mr-2"></i>
                  ยืนยันการชำระเงิน
                </h3>

                {error && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                    <i className="fas fa-exclamation-circle mr-2"></i>
                    {error}
                  </div>
                )}

                <p className="text-sm text-slate-600 mb-4">
                  คุณกำลังจะยืนยันการชำระเงินสำหรับรายการนี้
                </p>

                <div className="bg-emerald-50 rounded-lg p-4 mb-4 border border-emerald-200">
                  <p className="text-sm font-medium text-emerald-900 mb-2">
                    จำนวนเงินที่จะชำระ
                  </p>
                  <p className="text-2xl font-bold text-emerald-600 font-num">
                    ฿{formatCurrency(transaction.amount || 0, 2)}
                  </p>
                </div>

                <CurrencyInput
                  label="ยืนยันยอดเบิก"
                  placeholder="0.00"
                  register={register("net_amount", {
                    required: "กรุณายืนยันยอด",
                  })}
                  error={errors.net_amount}
                  prefix="฿"
                  decimalsLimit={2}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t border-slate-200">
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
                    <>
                      <i className="fas fa-check-circle"></i>
                      ชำระเงิน
                    </>
                  )}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </Modal>
  );
}
