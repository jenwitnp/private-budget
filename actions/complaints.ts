"use server";

import {
  getAllComplaints,
  getComplaintById,
  getComplaintStats,
  updateComplaintStatus,
  addComplaintReply,
  getComplaintReplies,
  type Complaint,
} from "@/server/complaints.server";

/**
 * Fetch all complaints with optional filters
 */
export async function fetchComplaintsAction(
  status?: string,
  category?: string,
  page: number = 1,
  pageSize: number = 10,
) {
  try {
    const result = await getAllComplaints(status, category);

    if (!result.success) {
      throw new Error(result.error || "Failed to fetch complaints");
    }

    const allComplaints = result.data || [];

    // Manual pagination
    const totalCount = allComplaints.length;
    const totalPages = Math.ceil(totalCount / pageSize);
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedComplaints = allComplaints.slice(startIndex, endIndex);

    return {
      success: true,
      data: paginatedComplaints as Complaint[],
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        pageSize,
      },
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error(
      "[COMPLAINTS_ACTION] Error fetching complaints:",
      errorMessage,
    );
    throw error;
  }
}

/**
 * Fetch single complaint with replies
 */
export async function fetchComplaintDetailAction(complaintId: string) {
  try {
    const complaintResult = await getComplaintById(complaintId);

    if (!complaintResult.success) {
      throw new Error(complaintResult.error || "Failed to fetch complaint");
    }

    const complaint = complaintResult.data;

    // Fetch replies
    const repliesResult = await getComplaintReplies(complaintId);

    return {
      success: true,
      data: {
        complaint,
        replies: repliesResult.data || [],
      },
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error(
      "[COMPLAINTS_ACTION] Error fetching complaint detail:",
      errorMessage,
    );
    throw error;
  }
}

/**
 * Fetch complaint statistics
 */
export async function fetchComplaintStatsAction() {
  try {
    const result = await getComplaintStats();

    if (!result.success) {
      throw new Error(result.error || "Failed to fetch stats");
    }

    return {
      success: true,
      stats: result.stats,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("[COMPLAINTS_ACTION] Error fetching stats:", errorMessage);
    throw error;
  }
}

/**
 * Update complaint status
 */
export async function updateComplaintStatusAction(
  complaintId: string,
  newStatus: "pending" | "in_progress" | "resolved" | "closed",
  notes?: string,
) {
  try {
    const result = await updateComplaintStatus(complaintId, newStatus, notes);

    if (!result.success) {
      throw new Error(result.error || "Failed to update complaint");
    }

    return {
      success: true,
      data: result.data,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error(
      "[COMPLAINTS_ACTION] Error updating complaint:",
      errorMessage,
    );
    throw error;
  }
}

/**
 * Reply to complaint
 */
export async function replyToComplaintAction(
  complaintId: string,
  replyText: string,
  userId?: string,
) {
  try {
    if (!replyText || replyText.trim().length === 0) {
      throw new Error("Reply text cannot be empty");
    }

    const result = await addComplaintReply(
      complaintId,
      replyText.trim(),
      userId,
    );

    if (!result.success) {
      throw new Error(result.error || "Failed to add reply");
    }

    return {
      success: true,
      data: result.data,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error(
      "[COMPLAINTS_ACTION] Error replying to complaint:",
      errorMessage,
    );
    throw error;
  }
}
