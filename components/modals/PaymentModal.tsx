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
import type { ClientTransaction } from "@/server/transactions.server";
import { Modal } from "@/components/ui/Modal";
import { CurrencyInput } from "@/components/form/CurrencyInput";
import { Select } from "@/components/form/Select";
import { TransactionDetailContent } from "@/components/TransactionDetailContent";
import { payTransactionAction } from "@/actions/workflow";
import { formatCurrency } from "@/lib/helpers/formatCurrency";
import { useActiveBankAccounts } from "@/hooks/useBankAccounts";

interface PaymentModalProps {
  isOpen: boolean;
  transactionId: string;
  transaction?: ClientTransaction | null; // ✅ Accept pre-fetched transaction
  onClose: () => void;
  onSuccess?: () => void;
  onError?: (error: string) => void;
  onTransactionUpdate?: (
    transactionId: string,
    newStatus: "pending" | "approved" | "rejected" | "paid",
    displayAmount?: number,
  ) => void;
  queryClient?: QueryClient;
}

interface PaymentFormData {
  net_amount?: string;
  payment_method?: string;
  bankAccountId?: string;
}

export function PaymentModal({
  isOpen,
  transactionId,
  transaction, // ✅ Use pre-fetched transaction
  onClose,
  onSuccess,
  onError,
  onTransactionUpdate,
  queryClient,
}: PaymentModalProps) {
  const { data: session } = useSession();
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<PaymentFormData>({
    defaultValues: {
      net_amount: "0.00",
      payment_method: transaction?.payment_method || "",
      bankAccountId: transaction?.bank_account_id || "",
    },
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get payment method from form
  const paymentMethodValue = watch("payment_method");

  // Fetch bank accounts for the user
  const { data: bankAccounts, isLoading: bankAccountsLoading } =
    useActiveBankAccounts(session?.user?.id || null);

  // Reset form when modal opens fresh
  useEffect(() => {
    if (isOpen) {
      reset({ net_amount: "0.00" });
    }
  }, [isOpen, reset]);

  // Set amount value when transaction loads (after form reset)
  useEffect(() => {
    if (isOpen && transaction) {
      if (transaction.amount) {
        const formattedAmount = formatCurrency(transaction.amount, 2);
        console.log("[PaymentModal] Setting net_amount:", formattedAmount);
        setValue("net_amount", formattedAmount);
      }
      if (transaction.payment_method) {
        setValue("payment_method", transaction.payment_method);
      }
      if (transaction.bank_account_id) {
        setValue("bankAccountId", transaction.bank_account_id);
      }
    }
  }, [isOpen, transaction, setValue]);

  const onSubmit = async (data: PaymentFormData) => {
    try {
      setIsLoading(true);
      setError(null);

      if (!session?.user?.id) {
        throw new Error("User session not found");
      }

      // Clean net_amount: remove currency symbol and commas
      const cleanNetAmount = data.net_amount
        ? String(data.net_amount)
            .replace(/฿/g, "") // Remove Thai baht symbol
            .replace(/,/g, "") // Remove commas
        : data.net_amount;

      await payTransactionAction(
        transactionId,
        session.user.id,
        session.user.role || "",
        undefined, // bankReference (optional)
        cleanNetAmount, // Send cleaned value
        data.payment_method, // Payment method
        data.bankAccountId, // Bank account ID
      );

      // ✅ Update cache surgically (only this transaction re-renders)
      if (onTransactionUpdate) {
        // Convert cleanNetAmount to number for displayAmount
        const displayAmount = cleanNetAmount
          ? parseFloat(String(cleanNetAmount))
          : undefined;
        onTransactionUpdate(transactionId, "paid", displayAmount);
      } else if (queryClient) {
        // Fallback: invalidate if no update callback provided
        queryClient.invalidateQueries({ queryKey: ["transactions"] });
      }

      // ✅ Close modal first, form will reset via isOpen useEffect on next open
      onSuccess?.();
      onClose();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Error processing payment";
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setIsLoading(false);
      // Reset form state on error (clear for next attempt)
      reset({ net_amount: "0.00" });
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="ยืนยันการชำระเงิน"
      isLoading={isLoading}
      size="lg"
    >
      <div className="max-h-[85vh] overflow-y-auto">
        {/* Transaction Details Section */}
        {transaction && (
          <>
            <TransactionDetailContent
              transaction={transaction as any}
              isLoading={false}
              error={null}
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

                {/* Payment Method */}
                <div className="mt-6 pt-6 border-t border-slate-200">
                  <h4 className="text-sm font-bold text-slate-800 mb-4">
                    <i className="fas fa-credit-card text-blue-600 mr-2"></i>
                    เลือกวิธีการชำระเงิน
                  </h4>

                  <Select
                    label="ประเภทการชำระ"
                    register={register("payment_method")}
                    error={errors.payment_method}
                    options={[
                      { value: "cash", label: "เงินสด" },
                      { value: "transfer", label: "โอนเงิน" },
                    ]}
                    placeholder="-- เลือกประเภท --"
                  />

                  {/* Bank Account - Show only if transfer selected */}
                  {paymentMethodValue === "transfer" && (
                    <div className="mt-4">
                      <Select
                        label="บัญชีธนาคาร"
                        register={register("bankAccountId")}
                        error={errors.bankAccountId}
                        options={
                          bankAccounts?.map((account) => ({
                            value: account.id,
                            label: `${account.bank_name} - ${account.account_number}`,
                          })) || []
                        }
                        placeholder={
                          bankAccountsLoading
                            ? "กำลังโหลด..."
                            : "-- เลือกบัญชีธนาคาร --"
                        }
                        disabled={bankAccountsLoading}
                      />
                    </div>
                  )}
                </div>
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
