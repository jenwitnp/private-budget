import type { NextApiRequest, NextApiResponse } from "next";
import { getSupabaseAdmin } from "@/lib/supabaseClient";
import type { MemberSearchResult } from "./search";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<MemberSearchResult | null>,
) {
  if (req.method !== "GET") {
    return res.status(405).json(null);
  }

  const { id } = req.query;
  if (!id || typeof id !== "string") {
    return res.status(400).json(null);
  }

  const supabaseAdmin = getSupabaseAdmin();

  const { data, error } = await (supabaseAdmin as any)
    .from("members")
    .select(
      "id, first_name, last_name, level, district, subdistrict, village_no, house_no, district_id, sub_district_id",
    )
    .eq("id", id)
    .single();

  if (error || !data) {
    return res.status(200).json(null);
  }

  return res.status(200).json(data);
}
