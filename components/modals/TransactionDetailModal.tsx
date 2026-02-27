"use client";

import { useTransactionDetail } from "@/hooks/useTransactionDetail";
import { Modal } from "@/components/ui/Modal";
import { TransactionDetailContent } from "@/components/TransactionDetailContent";

interface TransactionDetailModalProps {
  isOpen: boolean;
  transactionId: string | null;
  onClose: () => void;
}

export function TransactionDetailModal({
  isOpen,
  transactionId,
  onClose,
}: TransactionDetailModalProps) {
  const {
    data: transaction,
    isLoading,
    error,
  } = useTransactionDetail(isOpen ? transactionId : null);

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="รายละเอียดรายการ" size="xl">
      <div className="max-h-[80vh] overflow-y-auto">
        <TransactionDetailContent
          transaction={transaction!}
          isLoading={isLoading}
          error={error as Error | null}
        />
      </div>
    </Modal>
  );
}
