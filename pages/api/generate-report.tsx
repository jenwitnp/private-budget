import type { NextApiRequest, NextApiResponse } from "next";
import React from "react";
import path from "path";
import fs from "fs";
import { renderToStream, Font } from "@react-pdf/renderer";
import { getTransactionsAction } from "@/actions/transactions";
import { TransactionHistoryReportTemplate } from "@/lib/pdf/TransactionHistoryReportTemplate";
import { buildApiFilters } from "@/lib/helpers/transaction-query-helper";
import { getActiveCategories } from "@/server/categories.server";
import {
  getAllDistricts,
  getSubDistrictsByDistrict,
} from "@/server/districts.server";
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
} catch (error) {
  // Silently fail on font registration
}

/**
 * API Route for generating transaction history report as PDF
 * Accepts filters as query parameters and returns a PDF stream
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Extract filters from query parameters and ensure they're strings (not arrays)
    const getQueryString = (value: string | string[] | undefined): string => {
      if (Array.isArray(value)) return value[0] || "";
      return value || "";
    };

    const searchTerm = getQueryString(req.query.searchTerm);
    const statusFilter = getQueryString(req.query.statusFilter) || "all";
    const dateStart = getQueryString(req.query.dateStart);
    const dateEnd = getQueryString(req.query.dateEnd);
    const categoryId = getQueryString(req.query.categoryId);
    const districtId = getQueryString(req.query.districtId);
    const subDistrictId = getQueryString(req.query.subDistrictId);

    // Build API filter object for transactions action
    const apiFilters: Record<string, string | boolean> = {};

    if (statusFilter && statusFilter !== "all") {
      apiFilters.status = statusFilter as string;
    }

    if (categoryId) {
      apiFilters.category_id = categoryId as string;
    }

    if (districtId) {
      apiFilters.district_id = districtId as string;
    }

    if (subDistrictId) {
      apiFilters.sub_district_id = subDistrictId as string;
    }

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
    }

    // Fetch transactions with filters
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

    const response = await getTransactionsAction(actionPayload);

    if (!response.success || !response.data) {
      const errorMsg = response.error || "Unknown error";
      return res.status(400).json({
        error: "Failed to fetch transactions",
        details: errorMsg,
        timestamp: new Date().toISOString(),
      });
    }

    const transactions = response.data as ClientTransaction[];

    // Create report data object

    let categoryName: string | undefined;
    let districtName: string | undefined;
    let subDistrictName: string | undefined;

    try {
      if (categoryId) {
        const categories = await getActiveCategories();
        const category = categories.find((c) => c.id === categoryId);
        categoryName = category?.name;
      }

      if (districtId) {
        const districts = await getAllDistricts();
        const district = districts.find((d) => {
          return String(d.id) === String(districtId);
        });
        districtName = district?.name;

        // Fetch sub-district name if both districtId and subDistrictId exist
        if (subDistrictId && districtId) {
          const subDistricts = await getSubDistrictsByDistrict(
            districtId as string,
          );
          const subDistrict = subDistricts.find((sd) => {
            return String(sd.id) === String(subDistrictId);
          });
          subDistrictName = subDistrict?.name;
        }
      }
    } catch (error) {
      // Silently continue if unable to fetch filter display names
    }

    const generatedReportData = {
      transactions,
      filters: {
        searchTerm: (searchTerm as string) || undefined,
        statusFilter: (statusFilter as string) || "all",
        dateStart: (dateStart as string) || undefined,
        dateEnd: (dateEnd as string) || undefined,
        categoryId: (categoryId as string) || undefined,
        categoryName,
        districtId: (districtId as string) || undefined,
        districtName,
        subDistrictId: (subDistrictId as string) || undefined,
        subDistrictName,
      },
      generatedAt: new Date().toISOString(),
    };

    // Create PDF document
    const doc = <TransactionHistoryReportTemplate data={generatedReportData} />;

    let stream;
    try {
      stream = await renderToStream(doc);
    } catch (renderError) {
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

    // Pipe stream to response
    stream.pipe(res);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;

    res.status(500).json({
      error: "Failed to generate report",
      details: errorMessage,
      stack: process.env.NODE_ENV === "development" ? errorStack : undefined,
      timestamp: new Date().toISOString(),
    });
  }
}
