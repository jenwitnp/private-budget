import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/lib/supabaseClient";

export type MemberSearchResult = {
  id: string;
  first_name: string;
  last_name: string;
  level: string;
  district: string | null;
  subdistrict: string | null;
  village_no: number | null;
  house_no: string | null;
  district_id: number | null;
  sub_district_id: number | null;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<MemberSearchResult[]>,
) {
  if (req.method !== "GET") {
    return res.status(405).json([]);
  }

  const q = (req.query.q as string)?.trim();
  if (!q || q.length < 1) return res.status(200).json([]);

  const { data, error } = await (supabase as any).rpc("search_members", { q });

  if (error) {
    console.error("[members/search] rpc error:", error);
    return res.status(200).json([]);
  }

  return res.status(200).json(data || []);
}
