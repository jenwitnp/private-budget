"use server";

import { supabase } from "@/lib/supabaseClient";

export interface Schedule {
  id: string;
  user_id: string;
  user_name?: string;
  first_name?: string;
  last_name?: string;
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
  transaction_id?: string;
}

/**
 * Thai month names for date formatting
 */
const THAI_MONTHS = {
  1: "ม.ค",
  2: "ก.พ",
  3: "มี.ค",
  4: "เม.ย",
  5: "พ.ค",
  6: "มิ.ย",
  7: "ก.ค",
  8: "ส.ค",
  9: "ก.ย",
  10: "ต.ค",
  11: "พ.ย",
  12: "ธ.ค",
};

/**
 * Generate searchable keyword from schedule data
 * Combines title, date, district, and sub-district into a single search string
 * Example: "ประชุมรัฐสภา 13 เม.ย 2569 อำเภอท่าบ่อ ตำบลกองนาง"
 */
function generateScheduleKeyword(
  title: string | null | undefined,
  scheduledDate: string,
  districtName: string | null | undefined,
  subDistrictName: string | null | undefined,
): string {
  const parts: string[] = [];

  // Add title
  if (title) {
    parts.push(title);
  }

  // Add formatted date (e.g., "13 เม.ย 2569")
  try {
    const date = new Date(scheduledDate);
    const day = date.getDate();
    const month = (THAI_MONTHS as any)[date.getMonth() + 1] || "?";
    const thaiYear = date.getFullYear() + 543;
    parts.push(`${day} ${month} ${thaiYear}`);
  } catch (err) {
    parts.push(scheduledDate);
  }

  // Add district name
  if (districtName) {
    parts.push(`อำเภอ${districtName}`);
  }

  // Add sub-district name
  if (subDistrictName) {
    parts.push(`ตำบล${subDistrictName}`);
  }

  // Join with space
  return parts.join(" ");
}

/**
 * Get all schedules for a specific month (shared work calendar)
 */
export async function getSchedulesByMonth(
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
        first_name: firstName,
        last_name: lastName,
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
 * Get all schedules by date (shared work calendar)
 */
export async function getSchedulesByDate(date: string): Promise<{
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
        first_name: firstName,
        last_name: lastName,
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
    // Parse IDs
    const districtId = input.district_id
      ? parseInt(input.district_id, 10)
      : null;
    const subDistrictId = input.sub_district_id
      ? parseInt(input.sub_district_id, 10)
      : null;

    // Fetch district and sub-district names for keyword generation
    let districtName = null;
    let subDistrictName = null;

    if (districtId) {
      const { data: districtData, error: districtError } = await (
        supabase as any
      )
        .from("districts")
        .select("name")
        .eq("id", districtId)
        .single();

      if (!districtError && districtData) {
        districtName = districtData.name;
      }
    }

    if (subDistrictId) {
      const { data: subDistrictData, error: subDistrictError } = await (
        supabase as any
      )
        .from("sub_districts")
        .select("name")
        .eq("id", subDistrictId)
        .single();

      if (!subDistrictError && subDistrictData) {
        subDistrictName = subDistrictData.name;
      }
    }

    // Generate searchable keyword
    const keyword = generateScheduleKeyword(
      input.title || null,
      input.scheduled_date,
      districtName,
      subDistrictName,
    );

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
      key_word: keyword,
    };

    const { data, error } = await (supabase as any)
      .from("schedule")
      .insert([insertPayload])
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
    // First, fetch the current schedule to get existing values
    const { data: currentSchedule, error: fetchError } = await (supabase as any)
      .from("schedule")
      .select(
        `
        id, user_id, scheduled_date, title, district_id, sub_district_id,
        districts (name),
        sub_districts (name)
      `,
      )
      .eq("id", scheduleId)
      .eq("user_id", userId)
      .single();

    if (fetchError || !currentSchedule) {
      return {
        success: false,
        error: "Schedule not found or unauthorized",
      };
    }

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
    if (input.transaction_id !== undefined)
      updatePayload.transaction_id = input.transaction_id || null;

    // Generate new keyword based on updated values
    const titleForKeyword =
      input.title !== undefined ? input.title : currentSchedule.title || null;
    const dateForKeyword =
      input.scheduled_date !== undefined
        ? input.scheduled_date
        : currentSchedule.scheduled_date;

    // Fetch updated district and sub-district names if IDs changed
    let districtName = currentSchedule.districts?.name || null;
    let subDistrictName = currentSchedule.sub_districts?.name || null;

    if (input.district_id !== undefined) {
      const districtId = input.district_id
        ? parseInt(input.district_id, 10)
        : null;
      if (districtId) {
        const { data: districtData } = await (supabase as any)
          .from("districts")
          .select("name")
          .eq("id", districtId)
          .single();
        districtName = districtData?.name || null;
      } else {
        districtName = null;
      }
    }

    if (input.sub_district_id !== undefined) {
      const subDistrictId = input.sub_district_id
        ? parseInt(input.sub_district_id, 10)
        : null;
      if (subDistrictId) {
        const { data: subDistrictData } = await (supabase as any)
          .from("sub_districts")
          .select("name")
          .eq("id", subDistrictId)
          .single();
        subDistrictName = subDistrictData?.name || null;
      } else {
        subDistrictName = null;
      }
    }

    // Generate updated keyword
    const keyword = generateScheduleKeyword(
      titleForKeyword,
      dateForKeyword,
      districtName,
      subDistrictName,
    );

    updatePayload.key_word = keyword;

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

    if (error) {
      return { success: false, error: error.message };
    }

    // Format data with user name and related data
    const firstName = data?.users?.first_name || "";
    const lastName = data?.users?.last_name || "";
    const userName = `${firstName} ${lastName}`.trim();
    const formattedData = {
      ...data,
      user_name: userName || "Unknown User",
      first_name: firstName,
      last_name: lastName,
      district_name: data?.districts?.name,
      sub_district_name: data?.sub_districts?.name,
    };

    return { success: true, data: formattedData };
  } catch (err) {
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
 * Search all schedules by keyword field (shared work calendar)
 * Uses pre-computed key_word field for fast search
 */
export async function searchSchedules(query: string): Promise<{
  success: boolean;
  data?: Schedule[];
  error?: string;
}> {
  try {
    if (!query.trim()) {
      return { success: true, data: [] };
    }

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
      .limit(10);

    if (error) {
      return { success: false, error: error.message };
    }

    // Filter by key_word field (pre-computed search text)
    const lowerQuery = query.toLowerCase();
    const filtered = (data || []).filter((schedule: any) => {
      const keywordText = (schedule.key_word || "").toLowerCase();
      return keywordText.includes(lowerQuery);
    });

    const formattedData = filtered.map((schedule: any) => {
      const firstName = schedule.users?.first_name || "";
      const lastName = schedule.users?.last_name || "";
      const userName = `${firstName} ${lastName}`.trim();
      return {
        ...schedule,
        user_name: userName || "Unknown User",
        first_name: firstName,
        last_name: lastName,
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
 * Get all upcoming schedules (shared work calendar)
 */
export async function getUpcomingSchedules(daysAhead: number = 7): Promise<{
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
        first_name: firstName,
        last_name: lastName,
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
