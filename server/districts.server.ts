"use server";

import { supabase } from "@/lib/supabaseClient";

export interface District {
  id: string;
  name: string;
  province: string;
}

export interface SubDistrict {
  id: string;
  district_id: string;
  name: string;
  villages_count: number;
}

/**
 * Get all districts for a specific province
 * @param province - Province name (e.g., "นครพนม")
 */
export async function getDistrictsByProvince(
  province: string,
): Promise<District[]> {
  const { data, error } = await (supabase as any)
    .from("districts")
    .select("id, name, province")
    .eq("province", province)
    .order("name", { ascending: true });

  if (error) {
    console.error("❌ Error fetching districts:", error);
    throw new Error(`Failed to fetch districts: ${error.message}`);
  }

  return data || [];
}

/**
 * Get all sub-districts for a specific district
 * @param districtId - District ID
 */
export async function getSubDistrictsByDistrict(
  districtId: string,
): Promise<SubDistrict[]> {
  const { data, error } = await (supabase as any)
    .from("sub_districts")
    .select("id, district_id, name, villages_count")
    .eq("district_id", districtId)
    .order("name", { ascending: true });

  if (error) {
    console.error("❌ Error fetching sub-districts:", error);
    throw new Error(`Failed to fetch sub-districts: ${error.message}`);
  }

  return data || [];
}

/**
 * Get all districts (no province filter)
 */
export async function getAllDistricts(): Promise<District[]> {
  const { data, error } = await (supabase as any)
    .from("districts")
    .select("id, name, province")
    .order("province, name", { ascending: true });

  if (error) {
    console.error("❌ Error fetching all districts:", error);
    throw new Error(`Failed to fetch districts: ${error.message}`);
  }

  return data || [];
}
