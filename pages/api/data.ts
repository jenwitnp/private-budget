import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/lib/supabaseClient";

interface ResponseData {
  success: boolean;
  table?: string;
  count?: number;
  data?: any[];
  schema?: any[];
  error?: string;
  message?: string;
}

/**
 * API endpoint to fetch table data for analysis and mockup generation
 * Query params:
 * - table: 'users' | 'bank_accounts' | 'categories' | 'districts' | 'sub_districts' | 'transactions'
 * - limit: number (default: 10, max: 100)
 * - schema: boolean (if true, returns table schema instead of data)
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>,
) {
  // Only allow GET requests
  if (req.method !== "GET") {
    return res.status(405).json({
      success: false,
      error: "Method not allowed",
    });
  }

  const { table, limit = "10", schema = "false" } = req.query;

  // Validate table name
  const validTables = [
    "users",
    "bank_accounts",
    "categories",
    "districts",
    "sub_districts",
    "transactions",
  ];

  if (!table || typeof table !== "string" || !validTables.includes(table)) {
    return res.status(400).json({
      success: false,
      error: `Invalid table. Must be one of: ${validTables.join(", ")}`,
      message: `Available tables: ${validTables.join(", ")}`,
    });
  }

  // Parse limit
  const parsedLimit = Math.min(
    Math.max(parseInt(limit as string) || 10, 1),
    100,
  );
  const shouldGetSchema = schema === "true";

  try {
    console.log(
      `📊 [API Data] Fetching from table: ${table}, limit: ${parsedLimit}, schema: ${shouldGetSchema}`,
    );

    // If schema requested, get table structure
    if (shouldGetSchema) {
      const { data, error } = await (supabase as any)
        .from(table)
        .select("*")
        .limit(1);

      if (error) {
        throw new Error(error.message);
      }

      // Get column names and types from first row
      const schema = data && data.length > 0 ? Object.keys(data[0]) : [];

      return res.status(200).json({
        success: true,
        table,
        message: `Schema for ${table}`,
        schema: schema.map((col) => ({
          name: col,
          type: typeof data[0][col],
        })),
      });
    }

    // Fetch table data
    const { data, error, count } = await (supabase as any)
      .from(table)
      .select("*", { count: "exact" })
      .limit(parsedLimit);

    if (error) {
      throw new Error(error.message);
    }

    console.log(
      `✅ [API Data] Fetched ${data?.length || 0} rows from ${table} (total count: ${count})`,
    );

    return res.status(200).json({
      success: true,
      table,
      count: count || 0,
      data: data || [],
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error(`❌ [API Data] Error:`, errorMessage);

    return res.status(500).json({
      success: false,
      error: errorMessage,
    });
  }
}
