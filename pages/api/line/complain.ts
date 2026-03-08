import type { NextApiRequest, NextApiResponse } from "next";
import { createHmac } from "crypto";
import { supabase } from "@/lib/supabaseClient";

interface LineWebhookEvent {
  type: string;
  message?: {
    type: string;
    id: string;
    text?: string;
  };
  source?: {
    userId: string;
    type: string;
  };
  replyToken?: string;
  timestamp: number;
}

interface LineWebhookBody {
  events: LineWebhookEvent[];
  destination: string;
}

/**
 * Verify LINE webhook signature
 * Reference: https://developers.line.biz/en/reference/line-messaging-api/#signature-validation
 */
function verifyLineSignature(body: string, signature: string): boolean {
  const channelSecret = process.env.LINE_CHANNEL_SECRET;

  if (!channelSecret) {
    console.error("❌ [WEBHOOK] LINE_CHANNEL_SECRET not configured");
    return false;
  }

  const hash = createHmac("sha256", channelSecret)
    .update(body)
    .digest("base64");

  const isValid = hash === signature;

  if (!isValid) {
    console.error(
      "❌ [WEBHOOK] Invalid LINE signature. Expected:",
      hash,
      "Got:",
      signature,
    );
  }

  return isValid;
}

/**
 * Handle LINE webhook for complaints
 * Receives messages from LINE OA and stores them as complaints
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("📨 [WEBHOOK] New request received");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  if (req.method !== "POST") {
    console.error(`❌ [WEBHOOK] Invalid method: ${req.method}`);
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Debug: Log headers
    console.log("[DEBUG] Headers:", JSON.stringify(req.headers, null, 2));

    // Step 1: Verify webhook signature
    const signature = req.headers["x-line-signature"] as string;
    const body =
      typeof req.body === "string" ? req.body : JSON.stringify(req.body);

    console.log(
      "[DEBUG] Signature header:",
      signature ? "✅ Present" : "❌ Missing",
    );
    console.log("[DEBUG] Body type:", typeof req.body);
    console.log("[DEBUG] Body length:", body.length);
    console.log("[DEBUG] Raw body:", body.substring(0, 500));

    if (!signature) {
      console.error("❌ [WEBHOOK] Missing X-Line-Signature header");
      return res.status(401).json({ error: "Missing X-Line-Signature header" });
    }

    const isValid = verifyLineSignature(body, signature);
    if (!isValid) {
      console.error("❌ [WEBHOOK] Invalid signature");
      return res.status(401).json({ error: "Invalid signature" });
    }

    console.log("✅ [WEBHOOK] Signature verified");

    // Step 2: Parse webhook body
    console.log("[DEBUG] Attempting to parse webhook body...");
    let webhookBody: LineWebhookBody;

    try {
      webhookBody =
        typeof req.body === "string" ? JSON.parse(req.body) : req.body;
      console.log("[DEBUG] Parsed successfully");
    } catch (parseError) {
      const parseErrorMsg =
        parseError instanceof Error ? parseError.message : "Unknown";
      console.error("[DEBUG] Failed to parse body:", parseErrorMsg);
      console.error("[DEBUG] Body content:", body);
      return res
        .status(400)
        .json({ error: `Failed to parse body: ${parseErrorMsg}` });
    }

    console.log("[DEBUG] Webhook body structure:", {
      has_events: !!webhookBody.events,
      events_count: webhookBody.events?.length || 0,
      destination: webhookBody.destination,
    });

    console.log(
      `📨 [WEBHOOK] Received ${webhookBody.events?.length || 0} event(s)`,
    );

    if (!webhookBody.events || webhookBody.events.length === 0) {
      console.warn("⚠️ [WEBHOOK] No events in webhook body");
      console.log(
        "[DEBUG] Full webhook body:",
        JSON.stringify(webhookBody, null, 2),
      );
      return res
        .status(200)
        .json({ success: true, message: "No events to process" });
    }

    // Step 3: Process each event
    console.log("[DEBUG] Processing events...");
    for (let i = 0; i < webhookBody.events.length; i++) {
      const event = webhookBody.events[i];
      console.log(`[DEBUG] Event ${i + 1}/${webhookBody.events.length}:`, {
        type: event.type,
        has_message: !!event.message,
        message_type: event.message?.type,
        has_source: !!event.source,
        user_id: event.source?.userId,
      });
      await processLineEvent(event);
    }

    // Return 200 OK to LINE
    console.log("✅ [WEBHOOK] All events processed, returning 200 OK");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
    return res.status(200).json({ success: true });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("[WEBHOOK] ❌ Error processing LINE webhook:", errorMessage);
    if (error instanceof Error) {
      console.error("[WEBHOOK] Stack trace:", error.stack);
    }
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
    return res.status(500).json({ error: errorMessage });
  }
}

/**
 * Process individual LINE webhook event
 * Handles message events and stores complaints in database
 */
async function processLineEvent(event: LineWebhookEvent): Promise<void> {
  try {
    console.log("\n[EVENT] ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("[EVENT] Processing event...");
    console.log("[EVENT] Event data:", JSON.stringify(event, null, 2));

    // Only process message events
    if (event.type !== "message") {
      console.log(`⏭️ [EVENT] Skipping non-message event: ${event.type}`);
      return;
    }

    console.log("[EVENT] ✅ Event type is 'message'");

    // Get LINE user ID
    const lineUserId = event.source?.userId;
    console.log("[EVENT] LINE user ID:", lineUserId || "❌ MISSING");

    if (!lineUserId) {
      console.warn("⚠️ [EVENT] Missing userId in event");
      return;
    }

    // Only process text messages for complaints
    console.log("[EVENT] Message type:", event.message?.type);
    if (event.message?.type !== "text") {
      console.log(
        `⏭️ [EVENT] Skipping non-text message: ${event.message?.type}`,
      );
      return;
    }

    console.log("[EVENT] ✅ Message type is 'text'");

    const complaintText = event.message.text?.trim();
    console.log("[EVENT] Complaint text:", complaintText || "❌ EMPTY");

    if (!complaintText) {
      console.warn("⚠️ [EVENT] Empty complaint message");
      return;
    }

    const category = categorizeComplaint(complaintText);
    console.log("[EVENT] Auto-categorized as:", category || "uncategorized");

    console.log(`📝 [EVENT] Processing complaint from ${lineUserId}`);
    console.log(`           Message: ${complaintText.substring(0, 100)}...`);

    // Step 1: Try to find user by LINE ID
    console.log("[EVENT] [STEP 1] Searching for user by LINE ID...");
    let userId: string | null = null;

    try {
      const { data: userResult, error: userError } = await (
        supabase.from("users") as any
      )
        .select("id")
        .eq("line_user_id", lineUserId)
        .single();

      if (userError) {
        console.warn(`[EVENT] User lookup error: ${userError.message}`);
      }

      if (userResult) {
        userId = userResult.id;
        console.log(`✅ [EVENT] User found: ${userId}`);
      } else {
        console.log(
          `ℹ️ [EVENT] No user found with LINE ID: ${lineUserId}. Storing without user_id`,
        );
      }
    } catch (userLookupError) {
      const errorMsg =
        userLookupError instanceof Error ? userLookupError.message : "Unknown";
      console.warn(`[EVENT] Exception during user lookup: ${errorMsg}`);
    }

    // Step 2: Insert complaint into database
    console.log("[EVENT] [STEP 2] Inserting complaint into database...");
    console.log("[EVENT] Complaint data:", {
      line_user_id: lineUserId,
      user_id: userId,
      complaint_text: complaintText.substring(0, 50) + "...",
      status: "pending",
      category: category,
      created_at: new Date(event.timestamp).toISOString(),
    });

    try {
      const { data: insertedComplaint, error: insertError } = await (
        supabase.from("complaints") as any
      )
        .insert([
          {
            line_user_id: lineUserId,
            user_id: userId,
            complaint_text: complaintText,
            status: "pending",
            category: category,
            created_at: new Date(event.timestamp).toISOString(),
          },
        ])
        .select("id");

      if (insertError) {
        console.error(
          "❌ [EVENT] Failed to insert complaint:",
          insertError.message,
        );
        console.error("[EVENT] Error details:", insertError);
        return;
      }

      const complaintId = insertedComplaint?.[0]?.id;
      console.log(`✅ [EVENT] Complaint stored successfully!`);
      console.log(`   Complaint ID: ${complaintId}`);
    } catch (insertException) {
      const errorMsg =
        insertException instanceof Error ? insertException.message : "Unknown";
      console.error("[EVENT] Exception during insert:", errorMsg);
      if (insertException instanceof Error) {
        console.error("[EVENT] Stack trace:", insertException.stack);
      }
      return;
    }

    // Step 3: Send acknowledgment back to LINE
    console.log("[EVENT] [STEP 3] Sending acknowledgment to LINE...");
    await sendLineReply(
      event.replyToken || "",
      "ขอบคุณที่ส่งข้อร้องเรียน เรากำลังดำเนินการตรวจสอบ",
    );

    console.log("[EVENT] ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("[EVENT] ❌ Error processing LINE event:", errorMessage);
    if (error instanceof Error) {
      console.error("[EVENT] Stack trace:", error.stack);
    }
    console.log("[EVENT] ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
  }
}

/**
 * Categorize complaint based on keywords
 */
function categorizeComplaint(text: string): string | null {
  const lowerText = text.toLowerCase();

  if (
    lowerText.includes("เงิน") ||
    lowerText.includes("จำนวน") ||
    lowerText.includes("ปริมาณ")
  ) {
    return "payment";
  }
  if (
    lowerText.includes("ความล่าช้า") ||
    lowerText.includes("ช้า") ||
    lowerText.includes("รอ")
  ) {
    return "delay";
  }
  if (
    lowerText.includes("เอกสาร") ||
    lowerText.includes("ใบหนังสือ") ||
    lowerText.includes("ข้อมูล")
  ) {
    return "documentation";
  }
  if (
    lowerText.includes("พนักงาน") ||
    lowerText.includes("บริการ") ||
    lowerText.includes("ท่าทีการ")
  ) {
    return "service";
  }
  if (
    lowerText.includes("ระบบ") ||
    lowerText.includes("เว็บ") ||
    lowerText.includes("แอป")
  ) {
    return "system";
  }
  // Government & Local Authority Issues
  if (
    lowerText.includes("เทศบาล") ||
    lowerText.includes("สิ่งแวดล้อม") ||
    lowerText.includes("อาคารสาธารณะ") ||
    lowerText.includes("สถานที่สาธารณะ") ||
    lowerText.includes("สวนสาธารณะ") ||
    lowerText.includes("ถนน") ||
    lowerText.includes("ท่อน้ำ") ||
    lowerText.includes("ระบายน้ำ")
  ) {
    return "local_infrastructure";
  }
  // Government Building/Office Issues
  if (
    lowerText.includes("ห้องน้ำ") ||
    lowerText.includes("มื้อหน้าต่าง") ||
    lowerText.includes("เก้าอี้") ||
    lowerText.includes("โต๊ะ") ||
    lowerText.includes("ไฟฟ้า") ||
    lowerText.includes("แอร์") ||
    lowerText.includes("น้ำประปา") ||
    lowerText.includes("อาคารเสื่อม")
  ) {
    return "building_maintenance";
  }
  // Public Cleanliness & Environment
  if (
    lowerText.includes("ขยะ") ||
    lowerText.includes("ความสะอาด") ||
    lowerText.includes("สิ่งปนเปื้อน") ||
    lowerText.includes("มลพิษ") ||
    lowerText.includes("ควัน") ||
    lowerText.includes("ฝุ่น") ||
    lowerText.includes("เศษ") ||
    lowerText.includes("ท่อม้วน")
  ) {
    return "cleanliness";
  }
  // Administrative & Bureaucratic Issues
  if (
    lowerText.includes("ใบอนุญาต") ||
    lowerText.includes("ลงนาม") ||
    lowerText.includes("อนุมัติ") ||
    lowerText.includes("ลำเบียง") ||
    lowerText.includes("ขั้นตอน") ||
    lowerText.includes("กฎหมาย") ||
    lowerText.includes("ระเบียบ") ||
    lowerText.includes("หลักเกณฑ์")
  ) {
    return "administrative";
  }
  // Public Safety & Security
  if (
    lowerText.includes("ความปลอดภัย") ||
    lowerText.includes("ระเบิด") ||
    lowerText.includes("อาชญากรรม") ||
    lowerText.includes("ขโมย") ||
    lowerText.includes("ภัยเหตุ") ||
    lowerText.includes("จราจร") ||
    lowerText.includes("อันตราย") ||
    lowerText.includes("ไฟไหม้")
  ) {
    return "safety";
  }
  // Utilities & Public Services
  if (
    lowerText.includes("ไฟ") ||
    lowerText.includes("น้ำ") ||
    lowerText.includes("ค่าน้ำ") ||
    lowerText.includes("ค่าไฟ") ||
    lowerText.includes("โทรศัพท์") ||
    lowerText.includes("อินเตอร์เน็ต") ||
    lowerText.includes("สัญญาณ") ||
    lowerText.includes("ปกติบริการ") ||
    lowerText.includes("ท่อประปา") ||
    lowerText.includes("ประปา") ||
    lowerText.includes("ท่อน้ำ") ||
    lowerText.includes("น้ำประปา")
  ) {
    return "utilities";
  }
  // Traffic & Transportation
  if (
    lowerText.includes("จราจร") ||
    lowerText.includes("ถนน") ||
    lowerText.includes("สัญญาณไฟ") ||
    lowerText.includes("ทางเดิน") ||
    lowerText.includes("ทางเท้า") ||
    lowerText.includes("ขนส่ง") ||
    lowerText.includes("รถบัส") ||
    lowerText.includes("จักรยาน")
  ) {
    return "traffic";
  }
  // Health & Hospital Services
  if (
    lowerText.includes("โรงพยาบาล") ||
    lowerText.includes("สุขภาพ") ||
    lowerText.includes("แพทย์") ||
    lowerText.includes("ยาเสพติด") ||
    lowerText.includes("คลินิก") ||
    lowerText.includes("ฉีดวัคซีน") ||
    lowerText.includes("ตรวจสุขภาพ")
  ) {
    return "health";
  }
  // Education Issues
  if (
    lowerText.includes("โรงเรียน") ||
    lowerText.includes("ศึกษา") ||
    lowerText.includes("นักเรียน") ||
    lowerText.includes("ครู") ||
    lowerText.includes("ห้องเรียน") ||
    lowerText.includes("อุปกรณ์การเรียน") ||
    lowerText.includes("ลูกเรียน")
  ) {
    return "education";
  }

  // Default to "Other" if no category matches
  return "อื่นๆ";
}

/**
 * Send reply message back to LINE OA
 */
async function sendLineReply(
  replyToken: string,
  message: string,
): Promise<void> {
  console.log("[REPLY] ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  if (!replyToken) {
    console.warn("⚠️ [REPLY] No replyToken provided, skipping LINE reply");
    console.log("[REPLY] ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
    return;
  }

  try {
    const channelAccessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;

    console.log("[REPLY] Channel token present:", !!channelAccessToken);
    console.log("[REPLY] ReplyToken:", replyToken.substring(0, 20) + "...");
    console.log("[REPLY] Message:", message);

    if (!channelAccessToken) {
      console.warn(
        "⚠️ [REPLY] LINE_CHANNEL_ACCESS_TOKEN not configured, skipping reply",
      );
      console.log("[REPLY] ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
      return;
    }

    const payload = {
      replyToken,
      messages: [
        {
          type: "text",
          text: message,
        },
      ],
    };

    console.log("[REPLY] Sending payload to LINE API...");
    console.log("[REPLY] Endpoint: https://api.line.me/v2/bot/message/reply");

    // Create AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    try {
      const response = await fetch("https://api.line.me/v2/bot/message/reply", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${channelAccessToken}`,
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      console.log("[REPLY] Response status:", response.status);
      console.log("[REPLY] Response ok:", response.ok);

      const responseText = await response.text();
      if (responseText) {
        console.log("[REPLY] Response body:", responseText);
      }

      if (!response.ok) {
        console.warn(
          "⚠️ [REPLY] LINE API returned non-200 status:",
          response.statusText,
        );
        console.warn("[REPLY] Full error response:", responseText);
      } else {
        console.log("✅ [REPLY] Sent reply to LINE user successfully");
      }
    } catch (fetchError) {
      clearTimeout(timeoutId);

      if (
        (fetchError as any) instanceof Error &&
        (fetchError as any).name === "AbortError"
      ) {
        console.warn("⚠️ [REPLY] LINE API request timeout (10s)");
      } else {
        const errorMessage =
          fetchError instanceof Error ? fetchError.message : String(fetchError);
        console.warn("⚠️ [REPLY] Failed to send LINE reply:", errorMessage);
        // Log full error for debugging
        if (fetchError instanceof Error) {
          console.warn("[REPLY] Error details:", {
            name: fetchError.name,
            message: fetchError.message,
            cause: (fetchError as any).cause,
          });
        }
      }
      // Don't rethrow - we want the webhook to return 200 OK even if reply fails
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.warn("[REPLY] ⚠️ Unexpected error in sendLineReply:", errorMessage);
    if (error instanceof Error) {
      console.warn("[REPLY] Stack trace:", error.stack);
    }
  }

  console.log("[REPLY] ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
}
