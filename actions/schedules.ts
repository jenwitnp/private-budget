"use server";

import { getScheduleStats } from "@/server/schedule.server";

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
    console.error("[SCHEDULES_ACTION] Error fetching stats:", errorMessage);
    throw error;
  }
}
