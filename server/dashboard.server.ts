import { supabase } from "@/lib/supabaseClient";

export interface DistrictTotal {
  district_id: number;
  district_name: string;
  total_amount: number;
  paid_count: number;
  transaction_count: number;
}

export interface SubDistrictTotal {
  sub_district_id: number;
  sub_district_name: string;
  district_name: string;
  total_amount: number;
  paid_count: number;
  transaction_count: number;
}

export interface CategoryTotal {
  category_id: string;
  category_name: string;
  total_amount: number;
  paid_count: number;
  transaction_count: number;
}

export interface DashboardSummary {
  total_paid_amount: number;
  total_transactions: number;
  total_paid_transactions: number;
  total_pending_transactions: number;
  total_districts: number;
  total_categories: number;
  average_transaction_amount: number;
}

/**
 * Fetch dashboard summary statistics
 */
export async function getDashboardSummary(): Promise<DashboardSummary | null> {
  try {
    const { data, error } = await (
      supabase.rpc("get_dashboard_summary") as any
    ).single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("[❌ Dashboard] Error fetching summary:", error);
    return null;
  }
}

/**
 * Fetch district totals with paid amounts
 */
export async function getDistrictTotals(): Promise<DistrictTotal[]> {
  try {
    const { data, error } = await (supabase.rpc("get_district_totals") as any);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("[❌ Dashboard] Error fetching district totals:", error);
    return [];
  }
}

/**
 * Fetch sub_district totals with paid amounts
 */
export async function getSubDistrictTotals(): Promise<SubDistrictTotal[]> {
  try {
    const { data, error } = await (supabase.rpc(
      "get_sub_district_totals",
    ) as any);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("[❌ Dashboard] Error fetching sub_district totals:", error);
    return [];
  }
}

/**
 * Fetch category totals with paid amounts
 */
export async function getCategoryTotals(): Promise<CategoryTotal[]> {
  try {
    const { data, error } = await (supabase.rpc("get_category_totals") as any);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("[❌ Dashboard] Error fetching category totals:", error);
    return [];
  }
}
