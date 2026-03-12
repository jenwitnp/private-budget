import { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/lib/supabaseClient";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Get search query
    const { q } = req.query;
    if (!q || typeof q !== "string" || !q.trim()) {
      return res.status(200).json({ success: true, data: [] });
    }

    // Query schedule table by key_word using filter with ilike (case-insensitive)
    const { data, error } = await (supabase as any)
      .from("schedule")
      .select(
        `
        id, user_id, scheduled_date, time_start, time_end, title, address,
        district_id, sub_district_id, note, status, created_at, updated_at,
        key_word,
        users (id, first_name, last_name)
      `,
      )
      .filter("key_word", "ilike", `%${q}%`)
      .order("scheduled_date", { ascending: true })
      .limit(10);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    // Format response
    const formattedData = (data || []).map((schedule: any) => {
      const firstName = schedule.users?.first_name || "";
      const lastName = schedule.users?.last_name || "";
      const userName = `${firstName} ${lastName}`.trim();
      return {
        id: schedule.id,
        scheduled_date: schedule.scheduled_date,
        time_start: schedule.time_start,
        time_end: schedule.time_end,
        title: schedule.title,
        address: schedule.address,
        district_id: schedule.district_id,
        sub_district_id: schedule.sub_district_id,
        note: schedule.note,
        status: schedule.status,
        key_word: schedule.key_word,
        user_name: userName || "Unknown User",
      };
    });

    return res.status(200).json({
      success: true,
      data: formattedData,
      count: formattedData.length,
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return res.status(500).json({ error: errorMessage });
  }
}
