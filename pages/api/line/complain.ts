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
    return false;
  }

  const hash = createHmac("sha256", channelSecret)
    .update(body)
    .digest("base64");

  const isValid = hash === signature;

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
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Step 1: Verify webhook signature
    const signature = req.headers["x-line-signature"] as string;
    const body =
      typeof req.body === "string" ? req.body : JSON.stringify(req.body);

    if (!signature) {
      return res.status(401).json({ error: "Missing X-Line-Signature header" });
    }

    const isValid = verifyLineSignature(body, signature);
    if (!isValid) {
      return res.status(401).json({ error: "Invalid signature" });
    }

    // Step 2: Parse webhook body
    let webhookBody: LineWebhookBody;

    try {
      webhookBody =
        typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    } catch (parseError) {
      const parseErrorMsg =
        parseError instanceof Error ? parseError.message : "Unknown";
      return res
        .status(400)
        .json({ error: `Failed to parse body: ${parseErrorMsg}` });
    }

    // Step 3: Process each event
    for (let i = 0; i < webhookBody.events.length; i++) {
      const event = webhookBody.events[i];
      await processLineEvent(event);
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return res.status(500).json({ error: errorMessage });
  }
}

/**
 * Process individual LINE webhook event
 * Handles message events and stores complaints in database
 */
async function processLineEvent(event: LineWebhookEvent): Promise<void> {
  try {
    // Only process message events
    if (event.type !== "message") {
      return;
    }

    // Get LINE user ID
    const lineUserId = event.source?.userId;
    if (!lineUserId) {
      return;
    }

    // Only process text messages for complaints
    if (event.message?.type !== "text") {
      return;
    }

    const complaintText = event.message.text?.trim();
    if (!complaintText) {
      return;
    }

    const category = categorizeComplaint(complaintText);

    // Step 1: Try to find user by LINE ID
    let userId: string | null = null;

    try {
      const { data: userResult, error: userError } = await (
        supabase.from("users") as any
      )
        .select("id")
        .eq("line_user_id", lineUserId)
        .single();

      if (userError && userError.code !== "PGRST116") {
        // Error other than "not found"
      }

      if (userResult) {
        userId = userResult.id;
      }
    } catch (userLookupError) {
      // Silent fail on user lookup
    }

    // Step 2: Insert complaint into database
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
        return;
      }
    } catch (insertException) {
      return;
    }
  } catch (error) {
    // Silent fail
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
