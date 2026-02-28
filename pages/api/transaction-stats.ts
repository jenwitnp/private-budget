import type { NextApiRequest, NextApiResponse } from "next";
import { fetchData } from "@/lib/supabase/query";
import type { TransactionDetailWithCategories } from "@/server/transactions.server";

interface StatsResponse {
  success: boolean;
  data?: {
    pending: number;
    approved: number;
    rejected: number;
    paid: number;
  };
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<StatsResponse>,
) {
  if (req.method !== "GET") {
    return res
      .status(405)
      .json({ success: false, error: "Method not allowed" });
  }

  try {
    // Extract filters from query parameters
    const {
      search = "",
      categoryId,
      districtId,
      subDistrictId,
      dateStart,
      dateEnd,
    } = req.query;

    // Ensure search is a string, not an array
    const searchString = Array.isArray(search) ? search[0] : (search as string);

    // Build filters object
    const filters: Record<string, any> = {};
    const gte: Record<string, any> = {};
    const lte: Record<string, any> = {};

    if (categoryId) {
      filters.category_id = categoryId;
    }
    if (districtId) {
      filters.districts_id = districtId;
    }
    if (subDistrictId) {
      filters.sub_districts_id = subDistrictId;
    }

    // Helper: Convert Thai local date to UTC datetime bounds
    // Thailand is UTC+7, so local midnight is UTC-7 hours
    const getUTCStartOfDay = (localDateStr: string): string => {
      const [year, month, day] = (localDateStr as string)
        .split("-")
        .map(Number);
      const localDate = new Date(year, month - 1, day, 0, 0, 0);
      const utcDate = new Date(localDate.getTime() - 7 * 60 * 60 * 1000);
      return utcDate.toISOString().replace("Z", "");
    };

    const getUTCEndOfDay = (localDateStr: string): string => {
      const [year, month, day] = (localDateStr as string)
        .split("-")
        .map(Number);
      const nextDayLocal = new Date(year, month - 1, day + 1, 0, 0, 0);
      const utcDate = new Date(nextDayLocal.getTime() - 7 * 60 * 60 * 1000);
      return utcDate.toISOString().replace("Z", "");
    };

    // Add date range filters with timezone conversion
    if (dateStart && dateEnd) {
      gte.created_at = getUTCStartOfDay(dateStart as string);
      lte.created_at = getUTCEndOfDay(dateEnd as string);
    } else if (dateStart) {
      gte.created_at = getUTCStartOfDay(dateStart as string);
      lte.created_at = getUTCEndOfDay(dateStart as string);
    } else if (dateEnd) {
      lte.created_at = getUTCEndOfDay(dateEnd as string);
    }

    // Fetch all statuses in parallel
    const [pendingResult, approvedResult, rejectedResult, paidResult] =
      await Promise.all([
        fetchData<TransactionDetailWithCategories>(
          "transactions_detail_with_categories",
          {
            filters: { ...filters, status: "pending" },
            search: searchString
              ? [
                  { column: "transaction_number", query: searchString },
                  { column: "description", query: searchString },
                  { column: "notes", query: searchString },
                ]
              : [],
            sort: ["created_at", "desc"],
            page: 1,
            pageSize: 1,
            total: { count: "exact" },
            lte,
            gte,
          },
        ),
        fetchData<TransactionDetailWithCategories>(
          "transactions_detail_with_categories",
          {
            filters: { ...filters, status: "approved" },
            search: searchString
              ? [
                  { column: "transaction_number", query: searchString },
                  { column: "description", query: searchString },
                  { column: "notes", query: searchString },
                ]
              : [],
            sort: ["created_at", "desc"],
            page: 1,
            pageSize: 1,
            total: { count: "exact" },
            lte,
            gte,
          },
        ),
        fetchData<TransactionDetailWithCategories>(
          "transactions_detail_with_categories",
          {
            filters: { ...filters, status: "rejected" },
            search: searchString
              ? [
                  { column: "transaction_number", query: searchString },
                  { column: "description", query: searchString },
                  { column: "notes", query: searchString },
                ]
              : [],
            sort: ["created_at", "desc"],
            page: 1,
            pageSize: 1,
            total: { count: "exact" },
            lte,
            gte,
          },
        ),
        fetchData<TransactionDetailWithCategories>(
          "transactions_detail_with_categories",
          {
            filters: { ...filters, status: "paid" },
            search: searchString
              ? [
                  { column: "transaction_number", query: searchString },
                  { column: "description", query: searchString },
                  { column: "notes", query: searchString },
                ]
              : [],
            sort: ["created_at", "desc"],
            page: 1,
            pageSize: 1,
            total: { count: "exact" },
            lte,
            gte,
          },
        ),
      ]);

    console.group("📊 [API] Transaction Stats");
    console.log("Pending:", pendingResult.count || 0);
    console.log("Approved:", approvedResult.count || 0);
    console.log("Rejected:", rejectedResult.count || 0);
    console.log("Paid:", paidResult.count || 0);
    console.groupEnd();

    return res.status(200).json({
      success: true,
      data: {
        pending: pendingResult.count || 0,
        approved: approvedResult.count || 0,
        rejected: rejectedResult.count || 0,
        paid: paidResult.count || 0,
      },
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to fetch stats";
    console.error("❌ Stats API Error:", errorMessage);
    return res.status(500).json({
      success: false,
      error: errorMessage,
    });
  }
}
