"use client";

import { createContext, useContext, useCallback, useState } from "react";
import type { QueryClient, InfiniteData } from "@tanstack/react-query";
import type { ClientTransaction } from "@/server/transactions.server";
import type { GetTransactionsResponse as TransactionResponse } from "@/server/transactions.server";
import type { TransactionDetailWithCategories } from "@/server/transactions.server";
import { getTransactionDetailById } from "@/server/transactions.server";
import { ApprovalModal } from "@/components/modals/ApprovalModal";
import { RejectionModal } from "@/components/modals/RejectionModal";
import { PaymentModal } from "@/components/modals/PaymentModal";
import { TransactionDetailModal } from "@/components/modals/TransactionDetailModal";

type WorkflowStatus = "pending" | "approved" | "rejected" | "paid";

interface WorkflowContextType {
  workflowAction: {
    type: "approve" | "reject" | "pay" | "detail" | null;
    transactionId: string | null;
    transaction?: ClientTransaction | null; // Cache full transaction data
  };
  setWorkflowAction: (action: {
    type: "approve" | "reject" | "pay" | "detail" | null;
    transactionId: string | null;
    transaction?: ClientTransaction | null;
  }) => void;
  handleApprove: (
    transactionId: string,
    transaction?: ClientTransaction,
  ) => void;
  handleReject: (
    transactionId: string,
    transaction?: ClientTransaction,
  ) => void;
  handlePay: (transactionId: string, transaction?: ClientTransaction) => void;
  handleOpenDetail: (transactionId: string) => void;
  handleActionSuccess: (actionType: string) => void;
  handleActionError: (actionType: string, error: string) => void;
  updateTransactionInCache: (
    transactionId: string,
    newStatus: WorkflowStatus,
    displayAmount?: number,
  ) => void;
  getTransactionDetail: (
    transactionId: string,
  ) => Promise<TransactionDetailWithCategories | null>;
}

const WorkflowContext = createContext<WorkflowContextType | undefined>(
  undefined,
);

interface WorkflowProviderProps {
  children: React.ReactNode;
  queryClient: QueryClient;
  permissions: any;
  session?: { user?: { id?: string; role?: string } };
  filters: any;
  showToast: (message: string, type: string, duration: number) => void;
  setError: (error: string | null) => void;
}

export function WorkflowProvider({
  children,
  queryClient,
  permissions,
  session,
  filters,
  showToast,
  setError,
}: WorkflowProviderProps) {
  const [workflowAction, setWorkflowAction] = useState<{
    type: "approve" | "reject" | "pay" | "detail" | null;
    transactionId: string | null;
    transaction?: ClientTransaction | null;
  }>({ type: null, transactionId: null, transaction: null });

  // ✅ Update specific transaction in cache (surgical update - only 1 card re-renders)
  const updateTransactionInCache = useCallback(
    (
      transactionId: string,
      newStatus: WorkflowStatus,
      displayAmount?: number,
    ) => {
      const queryKey = [
        "transactions",
        session?.user?.id,
        JSON.stringify(filters),
      ];

      queryClient.setQueryData(
        queryKey,
        (oldData: InfiniteData<TransactionResponse> | undefined) => {
          if (!oldData) return oldData;

          return {
            ...oldData,
            pages: oldData.pages.map((page) => ({
              ...page,
              data: page.data.map((tx) => {
                if (tx.id === transactionId) {
                  const updatedTx = { ...tx, status: newStatus };
                  // If displayAmount is provided (from payment), update it
                  if (displayAmount !== undefined) {
                    return { ...updatedTx, displayAmount };
                  }
                  return updatedTx;
                }
                return tx;
              }),
            })),
          };
        },
      );
    },
    [queryClient, session?.user?.id, filters],
  );

  // ✅ Fetch fresh transaction detail from server (single source for all modals)
  const getTransactionDetail = useCallback(
    async (
      transactionId: string,
    ): Promise<TransactionDetailWithCategories | null> => {
      try {
        const result = await getTransactionDetailById(transactionId);
        if (result.success && result.data) {
          return result.data;
        }
        return null;
      } catch (error) {
        console.error("Error fetching transaction detail:", error);
        return null;
      }
    },
    [],
  );

  // Workflow action handlers (memoized to ensure stable references)
  const handleApprove = useCallback(
    async (transactionId: string, transaction?: ClientTransaction) => {
      if (!permissions.canApproveTransaction("pending")) {
        setError("คุณไม่มีสิทธิ์อนุมัติรายการนี้");
        return;
      }
      try {
        const data = await getTransactionDetail(transactionId);
        setWorkflowAction({
          type: "approve",
          transactionId,
          transaction: data as any,
        });
      } catch (error) {
        console.error("Error fetching transaction detail:", error);
        setWorkflowAction({ type: "approve", transactionId, transaction });
      }
    },
    [permissions, setError, getTransactionDetail],
  );

  const handleReject = useCallback(
    async (transactionId: string, transaction?: ClientTransaction) => {
      if (!permissions.canRejectTransaction("pending")) {
        setError("คุณไม่มีสิทธิ์ปฏิเสธรายการนี้");
        return;
      }
      try {
        const data = await getTransactionDetail(transactionId);
        setWorkflowAction({
          type: "reject",
          transactionId,
          transaction: data as any,
        });
      } catch (error) {
        console.error("Error fetching transaction detail:", error);
        setWorkflowAction({ type: "reject", transactionId, transaction });
      }
    },
    [permissions, setError, getTransactionDetail],
  );

  const handlePay = useCallback(
    async (transactionId: string, transaction?: ClientTransaction) => {
      if (!permissions.canPayTransaction("approved")) {
        setError("คุณไม่มีสิทธิ์ทำการชำระเงินรายการนี้");
        return;
      }
      try {
        const data = await getTransactionDetail(transactionId);
        setWorkflowAction({
          type: "pay",
          transactionId,
          transaction: data as any,
        });
      } catch (error) {
        console.error("Error fetching transaction detail:", error);
        setWorkflowAction({ type: "pay", transactionId, transaction });
      }
    },
    [permissions, setError, getTransactionDetail],
  );

  const handleOpenDetail = useCallback(
    async (transactionId: string) => {
      try {
        const data = await getTransactionDetail(transactionId);
        setWorkflowAction({
          type: "detail",
          transactionId,
          transaction: data as any,
        });
      } catch (error) {
        console.error("Error fetching transaction detail:", error);
        setWorkflowAction({ type: "detail", transactionId });
      }
    },
    [getTransactionDetail],
  );

  // Handle successful action completion (cache updated by modal via updateTransactionInCache)
  const handleActionSuccess = useCallback(
    (actionType: string) => {
      console.log(`✅ ${actionType} action completed successfully`);
      // Close modal (cache already updated by modal)
      setWorkflowAction({ type: null, transactionId: null });
      // Show success toast
      showToast(`${actionType} สำเร็จ`, "success", 3000);
    },
    [showToast],
  );

  // Handle action error
  const handleActionError = useCallback(
    (actionType: string, error: string) => {
      console.log(`❌ ${actionType} action failed:`, error);
      // Close modal
      setWorkflowAction({ type: null, transactionId: null });
      // Show error toast
      showToast(`${actionType} ล้มเหลว: ${error}`, "error", 5000);
    },
    [showToast],
  );

  return (
    <WorkflowContext.Provider
      value={{
        workflowAction,
        setWorkflowAction,
        handleApprove,
        handleReject,
        handlePay,
        handleOpenDetail,
        handleActionSuccess,
        handleActionError,
        updateTransactionInCache,
        getTransactionDetail,
      }}
    >
      {children}

      {/* ✅ Modals managed by WorkflowProvider */}
      <ApprovalModal
        isOpen={workflowAction.type === "approve"}
        transactionId={workflowAction.transactionId || ""}
        transaction={workflowAction.transaction}
        onClose={() => setWorkflowAction({ type: null, transactionId: null })}
        onSuccess={() => handleActionSuccess("อนุมัติ")}
        onError={(error) => handleActionError("อนุมัติ", error)}
        onTransactionUpdate={updateTransactionInCache}
        queryClient={queryClient}
      />

      <RejectionModal
        isOpen={workflowAction.type === "reject"}
        transactionId={workflowAction.transactionId || ""}
        transaction={workflowAction.transaction}
        onClose={() => setWorkflowAction({ type: null, transactionId: null })}
        onSuccess={() => handleActionSuccess("ปฏิเสธ")}
        onError={(error) => handleActionError("ปฏิเสธ", error)}
        onTransactionUpdate={updateTransactionInCache}
        queryClient={queryClient}
      />

      <PaymentModal
        isOpen={workflowAction.type === "pay"}
        transactionId={workflowAction.transactionId || ""}
        transaction={workflowAction.transaction}
        onClose={() => setWorkflowAction({ type: null, transactionId: null })}
        onSuccess={() => handleActionSuccess("ชำระแล้ว")}
        onError={(error) => handleActionError("ชำระแล้ว", error)}
        onTransactionUpdate={updateTransactionInCache}
        queryClient={queryClient}
      />

      <TransactionDetailModal
        isOpen={workflowAction.type === "detail"}
        transactionId={workflowAction.transactionId}
        transaction={workflowAction.transaction as any}
        onClose={() => setWorkflowAction({ type: null, transactionId: null })}
      />
    </WorkflowContext.Provider>
  );
}

/**
 * Hook to access workflow context
 * Must be used within WorkflowProvider
 */
export function useWorkflow() {
  const context = useContext(WorkflowContext);
  if (!context) {
    throw new Error("useWorkflow must be used within WorkflowProvider");
  }
  return context;
}
