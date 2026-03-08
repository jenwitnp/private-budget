import { supabase } from "@/lib/supabaseClient";

export interface Complaint {
  id: string;
  line_user_id: string;
  user_id: string | null;
  complaint_text: string;
  category: string | null;
  status: "pending" | "in_progress" | "resolved" | "closed";
  priority: string | null;
  attachment_url: string | null;
  notes: string | null;
  replied_by: string | null;
  replied_at: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Get all complaints (admin view)
 */
export async function getAllComplaints(
  status?: string,
  category?: string,
): Promise<{
  success: boolean;
  data?: Complaint[];
  error?: string;
}> {
  try {
    let query: any = (supabase.from("complaints") as any)
      .select("*")
      .order("created_at", {
        ascending: false,
      });

    if (status) {
      query = query.eq("status", status);
    }

    if (category) {
      query = query.eq("category", category);
    }

    const { data, error } = await query;

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: (data || []) as Complaint[] };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    return { success: false, error: errorMessage };
  }
}

/**
 * Get complaint by ID
 */
export async function getComplaintById(id: string): Promise<{
  success: boolean;
  data?: Complaint;
  error?: string;
}> {
  try {
    const { data, error } = await (supabase.from("complaints") as any)
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: data as Complaint };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    return { success: false, error: errorMessage };
  }
}

/**
 * Get complaints by user ID
 */
export async function getComplaintsByUserId(userId: string): Promise<{
  success: boolean;
  data?: Complaint[];
  error?: string;
}> {
  try {
    const { data, error } = await (supabase.from("complaints") as any)
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: (data || []) as Complaint[] };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    return { success: false, error: errorMessage };
  }
}

/**
 * Get complaints by LINE user ID
 */
export async function getComplaintsByLineUserId(lineUserId: string): Promise<{
  success: boolean;
  data?: Complaint[];
  error?: string;
}> {
  try {
    const { data, error } = await (supabase.from("complaints") as any)
      .select("*")
      .eq("line_user_id", lineUserId)
      .order("created_at", { ascending: false });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: (data || []) as Complaint[] };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    return { success: false, error: errorMessage };
  }
}

/**
 * Update complaint status
 */
export async function updateComplaintStatus(
  id: string,
  status: "pending" | "in_progress" | "resolved" | "closed",
  notes?: string,
): Promise<{
  success: boolean;
  data?: Complaint;
  error?: string;
}> {
  try {
    const updateData: any = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (notes) {
      updateData.notes = notes;
    }

    if (status === "resolved") {
      updateData.resolved_at = new Date().toISOString();
    }

    const { data, error } = await (supabase.from("complaints") as any)
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: data as Complaint };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    return { success: false, error: errorMessage };
  }
}

/**
 * Add reply to complaint
 */
export async function addComplaintReply(
  complaintId: string,
  replyText: string,
  fromUserId?: string,
): Promise<{
  success: boolean;
  data?: any;
  error?: string;
}> {
  try {
    const { data, error } = await (supabase.from("complaint_replies") as any)
      .insert([
        {
          complaint_id: complaintId,
          reply_text: replyText,
          from_user_id: fromUserId || null,
          from_line: !fromUserId,
          created_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    return { success: false, error: errorMessage };
  }
}

/**
 * Get complaint replies
 */
export async function getComplaintReplies(complaintId: string): Promise<{
  success: boolean;
  data?: any[];
  error?: string;
}> {
  try {
    const { data: result, error } = await (
      supabase.from("complaint_replies") as any
    )
      .select("*")
      .eq("complaint_id", complaintId)
      .order("created_at", { ascending: true });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: result || [] };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    return { success: false, error: errorMessage };
  }
}

/**
 * Get complaint stats (for dashboard)
 */
export async function getComplaintStats(): Promise<{
  success: boolean;
  stats?: {
    total: number;
    pending: number;
    in_progress: number;
    resolved: number;
    closed: number;
  };
  error?: string;
}> {
  try {
    // Get total complaints
    const { count: total, error: totalError } = await (
      supabase.from("complaints") as any
    ).select("*", { count: "exact", head: true });

    if (totalError) {
      return { success: false, error: totalError.message };
    }

    // Get count by status
    const { count: pendingCount } = await (supabase.from("complaints") as any)
      .select("*", { count: "exact", head: true })
      .eq("status", "pending");

    const { count: inProgressCount } = await (
      supabase.from("complaints") as any
    )
      .select("*", { count: "exact", head: true })
      .eq("status", "in_progress");

    const { count: resolvedCount } = await (supabase.from("complaints") as any)
      .select("*", { count: "exact", head: true })
      .eq("status", "resolved");

    const { count: closedCount } = await (supabase.from("complaints") as any)
      .select("*", { count: "exact", head: true })
      .eq("status", "closed");

    return {
      success: true,
      stats: {
        total: total || 0,
        pending: pendingCount || 0,
        in_progress: inProgressCount || 0,
        resolved: resolvedCount || 0,
        closed: closedCount || 0,
      },
    };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    return { success: false, error: errorMessage };
  }
}
