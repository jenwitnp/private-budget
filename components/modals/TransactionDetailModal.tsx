"use client";

import { Modal } from "@/components/ui/Modal";
import { TransactionDetailContent } from "@/components/TransactionDetailContent";
import type { TransactionDetailWithCategories } from "@/server/transactions.server";

interface TransactionDetailModalProps {
  isOpen: boolean;
  transactionId: string | null;
  transaction?: TransactionDetailWithCategories | null;
  onClose: () => void;
}

export function TransactionDetailModal({
  isOpen,
  transactionId,
  transaction,
  onClose,
}: TransactionDetailModalProps) {
  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="รายละเอียดรายการ"
      size="xl"
      isLoading={!transaction}
    >
      <div className="max-h-[80vh] overflow-y-auto">
        <TransactionDetailContent
          transaction={transaction as any}
          isLoading={!transaction}
          error={transaction ? null : new Error("Loading...")}
        />
      </div>
    </Modal>
  );
}
