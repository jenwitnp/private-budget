"use server";

import { supabase } from "@/lib/supabaseClient";

export interface Schedule {
  id: string;
  user_id: string;
  user_name?: string;
  scheduled_date: string;
  time_start?: string;
  time_end?: string;
  title?: string;
  address?: string;
  district_id?: string;
  sub_district_id?: string;
  district_name?: string;
  sub_district_name?: string;
  note?: string;
  status: "active" | "completed" | "cancelled";
  created_at: string;
  updated_at: string;
}

export interface CreateScheduleInput {
  scheduled_date: string;
  time_start?: string;
  time_end?: string;
  title?: string;
  address?: string;
  district_id?: string;
  sub_district_id?: string;
  note?: string;
  status?: "active" | "completed" | "cancelled";
}

export interface UpdateScheduleInput {
  scheduled_date?: string;
  time_start?: string;
  time_end?: string;
  title?: string;
  address?: string;
  district_id?: string;
  sub_district_id?: string;
  note?: string;
  status?: "active" | "completed" | "cancelled";
}

/**
 * Get user's schedules for a specific month
 */
export async function getSchedulesByMonth(
  userId: string,
  year: number,
  month: number,
): Promise<{
  success: boolean;
  data?: Schedule[];
  error?: string;
}> {
  try {
    const startDate = new Date(year, month - 1, 1).toISOString().split("T")[0];
    const endDate = new Date(year, month, 0).toISOString().split("T")[0];

    const { data, error } = await (supabase as any)
      .from("schedule")
      .select(
        `
        id, user_id, scheduled_date, time_start, time_end, title, address, 
        district_id, sub_district_id, note, status, created_at, updated_at,
        users (first_name, last_name),
        districts (name),
        sub_districts (name)
      `,
      )
      .eq("user_id", userId)
      .gte("scheduled_date", startDate)
      .lte("scheduled_date", endDate)
      .order("scheduled_date", { ascending: true });

    if (error) {
      return { success: false, error: error.message };
    }

    const formattedData = (data || []).map((schedule: any) => {
      const firstName = schedule.users?.first_name || "";
      const lastName = schedule.users?.last_name || "";
      const userName = `${firstName} ${lastName}`.trim();
      return {
        ...schedule,
        user_name: userName || "Unknown User",
        district_name: schedule.districts?.name,
        sub_district_name: schedule.sub_districts?.name,
      };
    });

    return { success: true, data: formattedData };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    return { success: false, error: errorMessage };
  }
}

/**
 * Get schedule by date
 */
export async function getSchedulesByDate(
  userId: string,
  date: string,
): Promise<{
  success: boolean;
  data?: Schedule[];
  error?: string;
}> {
  try {
    const { data, error } = await (supabase as any)
      .from("schedule")
      .select(
        `
        id, user_id, scheduled_date, time_start, time_end, title, address,
        district_id, sub_district_id, note, status, created_at, updated_at,
        users (first_name, last_name),
        districts (name),
        sub_districts (name)
      `,
      )
      .eq("user_id", userId)
      .eq("scheduled_date", date)
      .order("time_start", { ascending: true });

    if (error) {
      return { success: false, error: error.message };
    }

    const formattedData = (data || []).map((schedule: any) => {
      const firstName = schedule.users?.first_name || "";
      const lastName = schedule.users?.last_name || "";
      const userName = `${firstName} ${lastName}`.trim();
      return {
        ...schedule,
        user_name: userName || "Unknown User",
        district_name: schedule.districts?.name,
        sub_district_name: schedule.sub_districts?.name,
      };
    });

    return { success: true, data: formattedData };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    return { success: false, error: errorMessage };
  }
}

/**
 * Create new schedule
 */
export async function createSchedule(
  userId: string,
  input: CreateScheduleInput,
): Promise<{
  success: boolean;
  data?: Schedule;
  error?: string;
}> {
  try {
    console.log("\n=== CREATE SCHEDULE START ===");
    console.log("User ID:", userId);
    console.log("Input received:", input);

    // Parse IDs
    const districtId = input.district_id
      ? parseInt(input.district_id, 10)
      : null;
    const subDistrictId = input.sub_district_id
      ? parseInt(input.sub_district_id, 10)
      : null;

    console.log("Parsed IDs:", { districtId, subDistrictId });

    const insertPayload = {
      user_id: userId,
      scheduled_date: input.scheduled_date,
      time_start: input.time_start || null,
      time_end: input.time_end || null,
      title: input.title || null,
      address: input.address || null,
      district_id: districtId,
      sub_district_id: subDistrictId,
      note: input.note || null,
      status: input.status || "active",
    };

    console.log("Insert payload:", insertPayload);

    const { data, error } = await (supabase as any)
      .from("schedule")
      .insert([insertPayload])
      .select()
      .single();

    console.log("Supabase response:", { data, error });

    if (error) {
      console.error("❌ Supabase error:", error);
      return { success: false, error: error.message };
    }

    console.log("✅ Schedule created successfully:", data);
    return { success: true, data };
  } catch (err) {
    console.error("❌ Exception in createSchedule:", err);
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    return { success: false, error: errorMessage };
  }
}

/**
 * Update schedule
 */
export async function updateSchedule(
  userId: string,
  scheduleId: string,
  input: UpdateScheduleInput,
): Promise<{
  success: boolean;
  data?: Schedule;
  error?: string;
}> {
  try {
    console.log("\n=== UPDATE SCHEDULE START ===");
    console.log("Schedule ID:", scheduleId);
    console.log("User ID:", userId);
    console.log("Input:", input);

    const updatePayload: any = {};

    if (input.scheduled_date !== undefined)
      updatePayload.scheduled_date = input.scheduled_date;
    if (input.time_start !== undefined)
      updatePayload.time_start = input.time_start;
    if (input.time_end !== undefined) updatePayload.time_end = input.time_end;
    if (input.title !== undefined) updatePayload.title = input.title;
    if (input.address !== undefined) updatePayload.address = input.address;
    if (input.district_id !== undefined)
      updatePayload.district_id = input.district_id
        ? parseInt(input.district_id, 10)
        : null;
    if (input.sub_district_id !== undefined)
      updatePayload.sub_district_id = input.sub_district_id
        ? parseInt(input.sub_district_id, 10)
        : null;
    if (input.note !== undefined) updatePayload.note = input.note;
    if (input.status !== undefined) updatePayload.status = input.status;

    console.log("Update payload:", updatePayload);

    const { data, error } = await (supabase as any)
      .from("schedule")
      .update(updatePayload)
      .eq("id", scheduleId)
      .eq("user_id", userId)
      .select(
        `
        id, user_id, scheduled_date, time_start, time_end, title, address,
        district_id, sub_district_id, note, status, created_at, updated_at,
        users (first_name, last_name),
        districts (name),
        sub_districts (name)
      `,
      )
      .single();

    console.log("Supabase response:", { data, error });

    if (error) {
      console.error("❌ Update error:", error);
      return { success: false, error: error.message };
    }

    // Format data with user name and related data
    const firstName = data?.users?.first_name || "";
    const lastName = data?.users?.last_name || "";
    const userName = `${firstName} ${lastName}`.trim();
    const formattedData = {
      ...data,
      user_name: userName || "Unknown User",
      district_name: data?.districts?.name,
      sub_district_name: data?.sub_districts?.name,
    };

    console.log("✅ Schedule updated successfully:", formattedData);
    return { success: true, data: formattedData };
  } catch (err) {
    console.error("❌ Exception in updateSchedule:", err);
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    return { success: false, error: errorMessage };
  }
}

/**
 * Delete schedule
 */
export async function deleteSchedule(
  userId: string,
  scheduleId: string,
): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const { error } = await (supabase as any)
      .from("schedule")
      .delete()
      .eq("id", scheduleId)
      .eq("user_id", userId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    return { success: false, error: errorMessage };
  }
}

/**
 * Get upcoming schedules for a user
 */
export async function getUpcomingSchedules(
  userId: string,
  daysAhead: number = 7,
): Promise<{
  success: boolean;
  data?: Schedule[];
  error?: string;
}> {
  try {
    const today = new Date().toISOString().split("T")[0];
    const futureDate = new Date(Date.now() + daysAhead * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];

    const { data, error } = await (supabase as any)
      .from("schedule")
      .select(
        `
        id, user_id, scheduled_date, time_start, time_end, title, address,
        district_id, sub_district_id, note, status, created_at, updated_at,
        users (first_name, last_name),
        districts (name),
        sub_districts (name)
      `,
      )
      .eq("user_id", userId)
      .gte("scheduled_date", today)
      .lte("scheduled_date", futureDate)
      .eq("status", "active")
      .order("scheduled_date", { ascending: true });

    if (error) {
      return { success: false, error: error.message };
    }

    const formattedData = (data || []).map((schedule: any) => {
      const firstName = schedule.users?.first_name || "";
      const lastName = schedule.users?.last_name || "";
      const userName = `${firstName} ${lastName}`.trim();
      return {
        ...schedule,
        user_name: userName || "Unknown User",
        district_name: schedule.districts?.name,
        sub_district_name: schedule.sub_districts?.name,
      };
    });

    return { success: true, data: formattedData };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    return { success: false, error: errorMessage };
  }
}

/**
 * Get schedule stats for the menu badge
 * Returns count of active schedules with date >= today
 */
export async function getScheduleStats(): Promise<{
  success: boolean;
  stats?: {
    pending: number;
  };
  error?: string;
}> {
  try {
    const today = new Date().toISOString().split("T")[0];

    const { count, error } = await (supabase.from("schedule") as any)
      .select("*", { count: "exact", head: true })
      .eq("status", "active")
      .gte("scheduled_date", today);

    if (error) {
      return { success: false, error: error.message };
    }

    return {
      success: true,
      stats: {
        pending: count || 0,
      },
    };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    return { success: false, error: errorMessage };
  }
}
