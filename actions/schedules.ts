"use server";

import { getScheduleStats, searchSchedules } from "@/server/schedule.server";

/**
 * Fetch schedule stats for the menu badge
 */
export async function fetchScheduleStatsAction() {
  try {
    const result = await getScheduleStats();

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
    throw error;
  }
}

/**
 * Search schedules by title, date, or location
 */
export async function searchSchedulesAction(userId: string, query: string) {
  try {
    const result = await searchSchedules(userId, query);

    if (!result.success) {
      throw new Error(result.error || "Failed to search schedules");
    }

    return {
      success: true,
      data: result.data || [],
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    throw error;
  }
}
