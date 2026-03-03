import type { NextApiRequest, NextApiResponse } from "next";
import { renderToStream } from "@react-pdf/renderer";
import { supabase } from "@/lib/supabaseClient";
import {
  getTransactionImages,
  getTransactionDetailById,
} from "@/server/transactions.server";
import { TransactionReceiptTemplate } from "@/lib/pdf/TransactionReceiptTemplate";
import { Font } from "@react-pdf/renderer";
import path from "path";
import fs from "fs";

// Register custom fonts once at module load
const fontPath = path.join(process.cwd(), "fonts/Sarabun");
try {
  Font.register({
    family: "Sarabun",
    fonts: [
      {
        src: path.join(fontPath, "Sarabun-Regular.ttf"),
        fontWeight: "normal",
      },
      {
        src: path.join(fontPath, "Sarabun-Bold.ttf"),
        fontWeight: "bold",
      },
    ],
  });
  console.log("✅ Sarabun fonts registered for React PDF");
} catch (error) {
  console.error("Failed to register Sarabun fonts:", error);
}

/**
 * Download image from URL and convert to base64 data URL
 */
async function downloadImageAsDataUrl(
  url: string,
): Promise<string | undefined> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.error(`Failed to download image: ${response.statusText}`);
      return undefined;
    }

    const buffer = await response.arrayBuffer();
    const base64 = Buffer.from(buffer).toString("base64");

    // Detect image type from content-type header
    const contentType = response.headers.get("content-type") || "image/jpeg";
    return `data:${contentType};base64,${base64}`;
  } catch (error) {
    console.error(`Error downloading image from ${url}:`, error);
    return undefined;
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { id, preview } = req.query;

    if (!id || typeof id !== "string") {
      return res.status(400).json({ error: "Transaction ID required" });
    }

    const isPreview = preview === "true";
    console.log(
      `📄 [PDF] Generating PDF for transaction: ${id}${isPreview ? " (PREVIEW)" : " (DOWNLOAD)"}`,
    );

    // Fetch transaction details using server function
    const txResult = await getTransactionDetailById(id);

    if (!txResult.success || !txResult.data) {
      console.error(
        `❌ [PDF] Failed to fetch transaction ${id}:`,
        txResult.error,
      );
      return res
        .status(404)
        .json({ error: `Transaction not found: ${txResult.error}` });
    }

    const transaction = txResult.data;

    console.log(`✅ [PDF] Transaction found:`, {
      id: transaction.id,
      number: transaction.transaction_number,
      amount: transaction.amount,
    });

    // Fetch transaction images
    const imgResult = await getTransactionImages(id);
    let images = imgResult.data || [];

    // Download images and convert to data URLs
    console.log(`📸 [PDF] Processing ${images.length} images...`);
    const processedImages = await Promise.all(
      images.map(async (img) => {
        const dataUrl = await downloadImageAsDataUrl(img.url);
        return {
          ...img,
          dataUrl,
        };
      }),
    );

    // Filter out failed downloads
    const successfulImages = processedImages.filter((img) => img.dataUrl);
    console.log(
      `✅ [PDF] Successfully processed ${successfulImages.length}/${images.length} images`,
    );

    // Map database fields to component interface (snake_case to camelCase)
    const mappedTransaction = {
      id: transaction.id,
      transaction_number: transaction.transaction_number,
      item_name: transaction.item_name,
      amount: transaction.amount,
      displayAmount: transaction.net_amount || transaction.amount,
      net_amount: transaction.net_amount,
      currency: transaction.currency,
      status: transaction.status,
      payment_method: transaction.payment_method,
      fee_amount: transaction.fee_amount,
      description: transaction.description,
      transaction_date: transaction.transaction_date,
      category_name: transaction.category_name,
      district_name: transaction.district_name,
      sub_district_name: transaction.sub_district_name,
      user_full_name: transaction.user_full_name,
      created_by_name: transaction.created_by_name,
      approved_by_name: transaction.approved_by_name,
      paid_by_name: transaction.paid_by_name,
    };

    // Set response headers
    res.setHeader("Content-Type", "application/pdf");
    const disposition = isPreview
      ? "inline"
      : `attachment; filename="TRX-${mappedTransaction.transaction_number}.pdf"`;
    res.setHeader("Content-Disposition", disposition);

    // Create React PDF component
    const pdfComponent = (
      <TransactionReceiptTemplate
        transaction={mappedTransaction}
        images={successfulImages}
      />
    );

    // Render to stream and pipe to response
    const stream = await renderToStream(pdfComponent);
    stream.pipe(res);

    stream.on("end", () => {
      console.log(
        `✅ [PDF] PDF generated and sent successfully for transaction: ${id}`,
      );
    });

    stream.on("error", (error) => {
      console.error("[PDF] Stream error:", error);
      if (!res.headersSent) {
        res.status(500).json({ error: "Failed to generate PDF" });
      }
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("[PDF] Error generating PDF:", errorMessage);
    if (!res.headersSent) {
      res.status(500).json({ error: errorMessage });
    }
  }
}
