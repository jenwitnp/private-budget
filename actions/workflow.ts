import {
  approveTransaction,
  rejectTransaction,
  payTransaction,
} from "@/server/transactions.server";

/**
 * Approve a transaction - wrapper that calls transactions.server
 * @param transactionId - Transaction ID to approve
 * @param userId - User ID of the approver
 * @param userRole - User role (from client session)
 * @param notes - Optional approval notes
 */
export async function approveTransactionAction(
  transactionId: string,
  userId: string,
  userRole: string,
  notes?: string,
) {
  try {
    if (!userId) {
      throw new Error("Unauthorized: User ID required");
    }

    if (!userRole) {
      throw new Error("Unauthorized: User role required");
    }

    console.log(
      "\n📤 [WORKFLOW.CLIENT APPROVE] Action started",
      "\n├─ transactionId:",
      transactionId,
      "\n├─ userId:",
      userId,
      "\n├─ userRole:",
      userRole,
      "\n└─ notes:",
      notes,
    );

    // Verify role on client side first
    if (userRole !== "owner") {
      throw new Error(
        `Permission denied: Only owner can approve. Your role: ${userRole}`,
      );
    }

    console.log(
      "📞 [WORKFLOW.CLIENT APPROVE] Calling server function approveTransaction...",
    );

    // Call server function that handles database update
    const result = await approveTransaction(transactionId, userId, notes);

    console.log(
      "✅ [WORKFLOW.CLIENT APPROVE] Server response:",
      "\n├─ success:",
      result.success,
      "\n├─ message:",
      result.message,
      "\n└─ error:",
      result.error,
    );

    if (!result.success) {
      throw new Error(result.error || "Failed to approve transaction");
    }

    return { success: true, message: result.message };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Error approving transaction";
    console.error(
      "❌ [WORKFLOW.CLIENT APPROVE] Error:",
      errorMessage,
      "\nFull error:",
      error,
    );
    throw error;
  }
}

/**
 * Reject a transaction - wrapper that calls transactions.server
 * @param transactionId - Transaction ID to reject
 * @param userId - User ID of the rejecter
 * @param userRole - User role (from client session)
 * @param reason - Rejection reason
 */
export async function rejectTransactionAction(
  transactionId: string,
  userId: string,
  userRole: string,
  reason: string,
) {
  try {
    if (!userId) {
      throw new Error("Unauthorized: User ID required");
    }

    if (!userRole) {
      throw new Error("Unauthorized: User role required");
    }

    // Verify role on client side first
    if (userRole !== "owner") {
      throw new Error(
        `Permission denied: Only owner can reject. Your role: ${userRole}`,
      );
    }

    console.log(
      "\n📤 [WORKFLOW.CLIENT REJECT] Action started",
      "\n├─ transactionId:",
      transactionId,
      "\n├─ userId:",
      userId,
      "\n└─ reason:",
      reason,
    );

    console.log(
      "📞 [WORKFLOW.CLIENT REJECT] Calling server function rejectTransaction...",
    );

    // Call server function that handles role verification + database update
    const result = await rejectTransaction(transactionId, userId, reason);

    console.log(
      "✅ [WORKFLOW.CLIENT REJECT] Server response:",
      "\n├─ success:",
      result.success,
      "\n├─ message:",
      result.message,
      "\n└─ error:",
      result.error,
    );

    if (!result.success) {
      throw new Error(result.error || "Failed to reject transaction");
    }

    return { success: true, message: result.message };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Error rejecting transaction";
    console.error(
      "❌ [WORKFLOW.CLIENT REJECT] Error:",
      errorMessage,
      "\nFull error:",
      error,
    );
    throw error;
  }
}

/**
 * Pay a transaction - wrapper that calls transactions.server
 * @param transactionId - Transaction ID to pay
 * @param userId - User ID of the admin paying
 * @param userRole - User role (from client session)
 * @param bankReference - Optional bank reference for payment
 * @param netAmount - Confirmed amount to pay
 */
export async function payTransactionAction(
  transactionId: string,
  userId: string,
  userRole: string,
  bankReference?: string,
  netAmount?: string,
) {
  try {
    if (!userId) {
      throw new Error("Unauthorized: User ID required");
    }

    if (!userRole) {
      throw new Error("Unauthorized: User role required");
    }

    // Verify role on client side first
    if (userRole == "user") {
      throw new Error(
        `Permission denied: Only admin can pay. Your role: ${userRole}`,
      );
    }

    console.log(
      "\n📤 [WORKFLOW.CLIENT PAY] Action started",
      "\n├─ transactionId:",
      transactionId,
      "\n├─ userId:",
      userId,
      "\n└─ bankReference:",
      bankReference,
    );

    console.log(
      "📞 [WORKFLOW.CLIENT PAY] Calling server function payTransaction...",
    );

    // Call server function that handles role verification + database update
    const result = await payTransaction(
      transactionId,
      userId,
      bankReference,
      netAmount,
    );

    console.log(
      "✅ [WORKFLOW.CLIENT PAY] Server response:",
      "\n├─ success:",
      result.success,
      "\n├─ message:",
      result.message,
      "\n└─ error:",
      result.error,
    );

    if (!result.success) {
      throw new Error(result.error || "Failed to pay transaction");
    }

    return { success: true, message: result.message };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Error paying transaction";
    console.error(
      "❌ [WORKFLOW.CLIENT PAY] Error:",
      errorMessage,
      "\nFull error:",
      error,
    );
    throw error;
  }
}
