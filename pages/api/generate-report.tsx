import type { NextApiRequest, NextApiResponse } from "next";
import React from "react";
import path from "path";
import fs from "fs";
import { renderToStream, Font } from "@react-pdf/renderer";
import { getTransactionsAction } from "@/actions/transactions";
import { TransactionHistoryReportTemplate } from "@/lib/pdf/TransactionHistoryReportTemplate";
import { buildApiFilters } from "@/lib/helpers/transaction-query-helper";
import type { ClientTransaction } from "@/server/transactions.server";

// Register local Sarabun fonts using base64 data URLs for server-side rendering
const fontPath = path.join(process.cwd(), "fonts/Sarabun");
try {
  const regularFontBuffer = fs.readFileSync(
    path.join(fontPath, "Sarabun-Regular.ttf"),
  );
  const boldFontBuffer = fs.readFileSync(
    path.join(fontPath, "Sarabun-Bold.ttf"),
  );

  const regularFontBase64 = regularFontBuffer.toString("base64");
  const boldFontBase64 = boldFontBuffer.toString("base64");

  Font.register({
    family: "Sarabun",
    fonts: [
      {
        src: `data:font/ttf;base64,${regularFontBase64}`,
        fontWeight: "normal",
      },
      {
        src: `data:font/ttf;base64,${boldFontBase64}`,
        fontWeight: "bold",
      },
    ],
  });
  console.log("[Report API] ✅ Sarabun fonts registered successfully");
} catch (error) {
  console.error("[Report API] ⚠️ Error registering fonts:", error);
}

/**
 * API Route for generating transaction history report as PDF
 * Accepts filters as query parameters and returns a PDF stream
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const startTime = Date.now();
  console.group("📊 [REPORT API] ===== REQUEST START =====");
  console.log("Method:", req.method);
  console.log("URL:", req.url);
  console.log("Query params:", JSON.stringify(req.query, null, 2));
  console.groupEnd();

  if (req.method !== "GET") {
    console.error("❌ [REPORT API] Invalid method:", req.method);
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Extract filters from query parameters
    const {
      searchTerm = "",
      statusFilter = "all",
      dateStart = "",
      dateEnd = "",
      categoryId = "",
      districtId = "",
      subDistrictId = "",
    } = req.query;

    console.group("📋 [REPORT API] Query Parameters Extracted");
    console.log("searchTerm:", searchTerm, typeof searchTerm);
    console.log("statusFilter:", statusFilter, typeof statusFilter);
    console.log("dateStart:", dateStart, typeof dateStart);
    console.log("dateEnd:", dateEnd, typeof dateEnd);
    console.log("categoryId:", categoryId, typeof categoryId);
    console.log("districtId:", districtId, typeof districtId);
    console.log("subDistrictId:", subDistrictId, typeof subDistrictId);
    console.groupEnd();

    // Build API filter object for transactions action
    const apiFilters: Record<string, string | boolean> = {};

    console.log("[REPORT API] Building API filters...");

    if (statusFilter && statusFilter !== "all") {
      apiFilters.status = statusFilter as string;
      console.log("✓ Added status filter:", statusFilter);
    }

    if (categoryId) {
      apiFilters.category_id = categoryId as string;
      console.log("✓ Added category_id filter:", categoryId);
    }

    if (districtId) {
      apiFilters.district_id = districtId as string;
      console.log("✓ Added district_id filter:", districtId);
    }

    if (subDistrictId) {
      apiFilters.sub_district_id = subDistrictId as string;
      console.log("✓ Added sub_district_id filter:", subDistrictId);
    }

    console.log(
      "[REPORT API] Final apiFilters:",
      JSON.stringify(apiFilters, null, 2),
    );

    // Build date range filters with Thailand timezone conversion (UTC+7)
    let gte: Record<string, string> = {};
    let lte: Record<string, string> = {};

    if (dateStart || dateEnd) {
      const { gte: dateGte, lte: dateLte } = buildApiFilters(
        {
          statusFilter: statusFilter as string,
          dateStart: (dateStart as string) || "",
          dateEnd: (dateEnd as string) || "",
          categoryId: categoryId as string,
          districtId: districtId as string,
          subDistrictId: subDistrictId as string,
        },
        () => "created_at", // Use created_at column for date range
      );
      gte = dateGte;
      lte = dateLte;
      console.log("✓ Date filters with Thailand timezone conversion (UTC+7)");
      if (Object.keys(gte).length > 0)
        console.log("  GTE:", JSON.stringify(gte, null, 2));
      if (Object.keys(lte).length > 0)
        console.log("  LTE:", JSON.stringify(lte, null, 2));
    }

    // Fetch transactions with filters
    console.log("[REPORT API] Calling getTransactionsAction...");
    const actionPayload = {
      pageParam: 1,
      pageSize: 1000,
      search: (searchTerm as string) || "",
      filters: apiFilters,
      gte,
      lte,
      sortBy: "newest" as const,
      user: null,
    };
    console.log(
      "[REPORT API] Action payload:",
      JSON.stringify(actionPayload, null, 2),
    );

    const response = await getTransactionsAction(actionPayload);

    console.group("[REPORT API] getTransactionsAction Response");
    console.log("success:", response.success);
    console.log("data type:", typeof response.data);
    console.log("data is array:", Array.isArray(response.data));
    if (response.data) {
      console.log(
        "data length:",
        Array.isArray(response.data) ? response.data.length : "not array",
      );
    }
    console.log("error:", response.error);
    console.groupEnd();

    if (!response.success || !response.data) {
      const errorMsg = response.error || "Unknown error";
      console.error("❌ [REPORT API] Transaction fetch failed");
      console.error("Error details:", errorMsg);
      return res.status(400).json({
        error: "Failed to fetch transactions",
        details: errorMsg,
        timestamp: new Date().toISOString(),
      });
    }

    const transactions = response.data as ClientTransaction[];
    console.log(
      `✅ [REPORT API] Successfully fetched ${transactions.length} transactions`,
    );

    if (transactions.length === 0) {
      console.warn(
        "[REPORT API] ⚠️ Warning: No transactions found matching filters",
      );
    } else {
      console.log(
        "[REPORT API] First transaction:",
        JSON.stringify(transactions[0], null, 2),
      );
    }

    // Create report data object
    console.log("[REPORT API] Creating report data object...");
    const generatedReportData = {
      transactions,
      filters: {
        searchTerm: (searchTerm as string) || undefined,
        statusFilter: (statusFilter as string) || "all",
        dateStart: (dateStart as string) || undefined,
        dateEnd: (dateEnd as string) || undefined,
        categoryId: (categoryId as string) || undefined,
        districtId: (districtId as string) || undefined,
        subDistrictId: (subDistrictId as string) || undefined,
      },
      generatedAt: new Date().toISOString(),
    };
    console.log("[REPORT API] Report data created successfully");

    // Create PDF document
    console.log("[REPORT API] Creating PDF document via renderToStream...");
    const doc = <TransactionHistoryReportTemplate data={generatedReportData} />;

    let stream;
    try {
      stream = await renderToStream(doc);
      console.log("[REPORT API] ✅ PDF stream created successfully");
    } catch (renderError) {
      console.error("❌ [REPORT API] renderToStream failed:", renderError);
      console.error(
        "Error message:",
        renderError instanceof Error ? renderError.message : "unknown",
      );
      console.error(
        "Error stack:",
        renderError instanceof Error ? renderError.stack : "no stack",
      );
      throw renderError;
    }

    // Set response headers
    const filename = `transaction-report-${new Date().toISOString().split("T")[0]}.pdf`;
    const isPreviewMode = req.query.preview === "true";
    const dispositionType = isPreviewMode ? "inline" : "attachment";

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `${dispositionType}; filename="${filename}"`,
    );
    console.log(
      "[REPORT API] Response headers set - filename:",
      filename,
      "- mode:",
      isPreviewMode ? "PREVIEW" : "DOWNLOAD",
    );

    // Pipe stream to response
    console.log("[REPORT API] Piping PDF stream to response...");

    stream.on("error", (error) => {
      console.error("❌ [REPORT API] Stream error:", error);
    });

    stream.on("end", () => {
      const duration = Date.now() - startTime;
      console.log(
        `✅ [REPORT API] ===== REQUEST COMPLETE in ${duration}ms =====`,
      );
    });

    stream.pipe(res);
  } catch (error) {
    const duration = Date.now() - startTime;
    console.group(`❌ [REPORT API] ===== EXCEPTION (${duration}ms) =====`);
    console.error("Error object:", error);
    console.error("Error type:", typeof error);
    console.error("Error constructor:", error?.constructor?.name);

    if (error instanceof Error) {
      console.error("Message:", error.message);
      console.error("Stack:", error.stack);
      console.error("Cause:", (error as any).cause);
    }
    console.groupEnd();

    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;

    res.status(500).json({
      error: "Failed to generate report",
      details: errorMessage,
      stack: process.env.NODE_ENV === "development" ? errorStack : undefined,
      timestamp: new Date().toISOString(),
      duration: `${duration}ms`,
    });
  }
}
