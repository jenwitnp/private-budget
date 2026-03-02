import type { NextApiRequest, NextApiResponse } from "next";
import PDFDocument from "pdfkit";
import { supabase } from "@/lib/supabaseClient";
import { getTransactionImages } from "@/server/transactions.server";
import path from "path";

/**
 * API Route for downloading transaction as PDF
 * Generates a landscape PDF with transaction details and images
 * Support for images with automatic downloading from signed URLs
 */

/**
 * Download image from URL and return as buffer
 */
async function downloadImage(url: string): Promise<Buffer | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.error(`Failed to download image: ${response.statusText}`);
      return null;
    }
    return await response.arrayBuffer().then((buf) => Buffer.from(buf));
  } catch (error) {
    console.error(`Error downloading image from ${url}:`, error);
    return null;
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
    const { id } = req.query;

    if (!id || typeof id !== "string") {
      return res.status(400).json({ error: "Transaction ID required" });
    }

    console.log(`📄 [PDF] Generating PDF for transaction: ${id}`);

    // Fetch transaction details from database
    const { data: transaction, error: txError } = await (supabase as any)
      .from("transactions")
      .select("*")
      .eq("id", id)
      .single();

    if (txError) {
      console.error(`❌ [PDF] Database error for transaction ${id}:`, {
        code: txError.code,
        message: txError.message,
        details: (txError as any).details,
      });
      return res
        .status(404)
        .json({ error: `Transaction not found: ${txError.message}` });
    }

    if (!transaction) {
      console.error(`❌ [PDF] Transaction not found in database: ${id}`);
      return res.status(404).json({ error: "Transaction not found" });
    }

    console.log(`✅ [PDF] Transaction found:`, {
      id: transaction.id,
      number: transaction.transaction_number,
      amount: transaction.amount,
    });

    // Fetch transaction images
    const imgResult = await getTransactionImages(id);
    const images = imgResult.data || [];

    console.log(`📸 [PDF] Found ${images.length} images to embed`);

    // Create PDF in landscape orientation
    const doc = new PDFDocument({
      size: "A4",
      layout: "landscape",
      margin: 20,
      bufferPages: true,
    });

    // Register Sarabun font for Thai text support
    const fontPath = path.join(process.cwd(), "fonts/Sarabun");
    doc.registerFont("Sarabun", path.join(fontPath, "Sarabun-Regular.ttf"));
    doc.registerFont("Sarabun-Bold", path.join(fontPath, "Sarabun-Bold.ttf"));

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="TRX-${transaction.transaction_number}.pdf"`,
    );

    doc.pipe(res);

    // ==================== HEADER SECTION ====================
    const pageWidth = doc.page.width - 40; // 40 = margins
    const pageHeight = doc.page.height;

    // Title
    doc.fontSize(20).font("Sarabun-Bold").text("TRANSACTION RECEIPT", {
      align: "center",
    });

    doc.moveDown(0.3);
    doc.fontSize(10).font("Sarabun").text("ใบเบิกเงิน", { align: "center" });

    doc.moveDown(0.5);

    // Transaction Number and Date
    doc
      .fontSize(11)
      .font("Sarabun-Bold")
      .text(`Transaction: ${transaction.transaction_number}`);
    doc
      .fontSize(10)
      .font("Sarabun")
      .text(
        `Date: ${new Date(transaction.transaction_date || new Date()).toLocaleDateString("en-US")}`,
      );

    doc.moveDown(0.5);
    doc
      .moveTo(20, doc.y)
      .lineTo(pageWidth + 20, doc.y)
      .stroke();
    doc.moveDown(0.5);

    // ==================== MAIN CONTENT (2 Column Layout) ====================
    const columnStartX = 20;
    const columnWidth = pageWidth / 2 - 5;
    const rightColumnX = 20 + columnWidth + 10;

    // LEFT COLUMN - Transaction Details
    doc.fontSize(11).font("Sarabun-Bold").text("TRANSACTION DETAILS");
    doc.fontSize(9).font("Sarabun");

    const fields = [
      { label: "Item Name:", value: transaction.item_name || "N/A" },
      {
        label: "Amount:",
        value: `฿ ${transaction.amount?.toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
      },
      {
        label: "Net Amount:",
        value: transaction.net_amount
          ? `฿ ${transaction.net_amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}`
          : "N/A",
      },
      { label: "Currency:", value: transaction.currency || "THB" },
      { label: "Status:", value: transaction.status || "pending" },
      { label: "Payment Method:", value: transaction.payment_method || "N/A" },
      {
        label: "Fee Amount:",
        value: transaction.fee_amount
          ? `฿ ${transaction.fee_amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}`
          : "0.00",
      },
    ];

    let currentY = doc.y;
    for (const field of fields) {
      doc.text(`${field.label} ${field.value}`, columnStartX, currentY);
      currentY += 15;
    }

    // RIGHT COLUMN - Description
    doc
      .fontSize(11)
      .font("Sarabun-Bold")
      .text("DESCRIPTION", rightColumnX, doc.y - (currentY - doc.y));
    doc.fontSize(9).font("Sarabun");

    if (transaction.description) {
      const descLines =
        doc.widthOfString(transaction.description) > columnWidth - 20
          ? transaction.description.substring(0, 100) + "..."
          : transaction.description;
      doc.text(descLines, rightColumnX, doc.y - (currentY - doc.y), {
        width: columnWidth - 10,
        height: 100,
      });
    } else {
      doc.text("No description", rightColumnX, doc.y - (currentY - doc.y));
    }

    doc.moveDown(2);
    doc
      .moveTo(20, doc.y)
      .lineTo(pageWidth + 20, doc.y)
      .stroke();
    doc.moveDown(0.5);

    // ==================== IMAGES SECTION ====================
    if (images.length > 0) {
      doc
        .fontSize(11)
        .font("Sarabun-Bold")
        .text(`TRANSACTION IMAGES (${images.length} photos)`);
      doc.moveDown(0.3);

      // Calculate image layout - 3 per row
      const imagesPerRow = 3;
      const imgWidth = (columnWidth * 2) / imagesPerRow - 5;
      const imgHeight = 100;
      const imgPadding = 10;

      let imgX = columnStartX;
      let imgY = doc.y;
      let imgIndex = 0;

      for (const image of images) {
        // Check if we need to add new page
        if (imgY + imgHeight + 30 > pageHeight - 20) {
          doc.addPage();
          imgY = 30;
          imgX = columnStartX;
        }

        try {
          // Download image from signed URL
          if (image.url) {
            console.log(
              `[PDF] Downloading image ${imgIndex + 1}: ${image.filename}`,
            );
            const imgBuffer = await downloadImage(image.url);

            if (imgBuffer) {
              // Successfully downloaded - embed image
              try {
                doc.image(imgBuffer, imgX, imgY, {
                  width: imgWidth,
                  height: imgHeight,
                  fit: [imgWidth, imgHeight],
                });
                console.log(
                  `✅ [PDF] Image ${imgIndex + 1} embedded: ${image.filename}`,
                );
              } catch (imageError) {
                console.error(
                  `Failed to embed image ${imgIndex + 1}:`,
                  imageError,
                );
                // Draw placeholder if embedding fails
                doc.rect(imgX, imgY, imgWidth, imgHeight).stroke("lightgray");
                doc
                  .fontSize(8)
                  .text(`Failed to load\n${image.filename}`, imgX, imgY + 40, {
                    width: imgWidth,
                    align: "center",
                  });
              }
            } else {
              // Failed to download - show placeholder
              doc.rect(imgX, imgY, imgWidth, imgHeight).stroke("lightgray");
              doc
                .fontSize(8)
                .text(
                  `[Image ${imgIndex + 1}]\n${image.filename}`,
                  imgX,
                  imgY + 40,
                  {
                    width: imgWidth,
                    align: "center",
                  },
                );
            }
          }
        } catch (error) {
          console.error(`Error processing image ${imgIndex + 1}:`, error);
          // Draw placeholder
          doc.rect(imgX, imgY, imgWidth, imgHeight).stroke("lightgray");
        }

        imgIndex++;
        imgX += imgWidth + imgPadding;

        // Move to next row
        if (imgIndex % imagesPerRow === 0) {
          imgY += imgHeight + imgPadding;
          imgX = columnStartX;
        }
      }
    }

    doc.moveDown(1);
    doc
      .moveTo(20, doc.y)
      .lineTo(pageWidth + 20, doc.y)
      .stroke();
    doc.moveDown(0.5);

    // ==================== FOOTER ====================
    doc
      .fontSize(8)
      .font("Sarabun")
      .text(
        `Generated: ${new Date().toLocaleString("en-US")} | ID: ${transaction.id}`,
        { align: "center" },
      );

    console.log(`✅ [PDF] PDF generated successfully for transaction: ${id}`);

    doc.end();
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("[PDF] Error generating PDF:", errorMessage);
    return res.status(500).json({ error: errorMessage });
  }
}
