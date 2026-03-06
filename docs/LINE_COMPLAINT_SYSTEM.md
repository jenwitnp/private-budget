# LINE OA Complaint System - Setup Guide

## Overview

This system receives complaint messages from LINE Official Account (OA) and stores them in a Supabase database for tracking and management.

## Table of Contents

1. [Database Setup](#database-setup)
2. [Environment Configuration](#environment-configuration)
3. [LINE OA Configuration](#line-oa-configuration)
4. [Webhook Endpoint](#webhook-endpoint)
5. [Testing](#testing)
6. [API Reference](#api-reference)

---

## Database Setup

### Step 1: Execute SQL Migration

Run the SQL migration to create the complaints table in Supabase:

```sql
-- File: sql/complaints.sql
-- Execute this in Supabase SQL Editor
```

This creates:

- `complaints` table - stores complaint messages from LINE OA
- `complaint_replies` table - stores replies/responses to complaints
- Indexes for performance optimization
- Trigger for automatic timestamp updates

### Table Schema

**complaints table:**

```typescript
{
  id: UUID (primary key)
  line_user_id: string (LINE user ID)
  user_id: UUID (linked to users table if user exists)
  complaint_text: string (the complaint message)
  category: string (auto-categorized: payment, delay, documentation, service, system)
  status: enum (pending, in_progress, resolved, closed)
  priority: string (low, normal, high)
  attachment_url: string (image/file URL if provided)
  notes: string (internal notes)
  replied_by: UUID (staff member who replied)
  replied_at: timestamp
  resolved_at: timestamp
  created_at: timestamp
  updated_at: timestamp
}
```

---

## Environment Configuration

### Step 1: Get LINE Channel Credentials

1. Go to [LINE Developers Console](https://developers.line.biz/)
2. Create a new Messaging API channel (or use existing)
3. Copy:
   - **Channel Access Token** → `LINE_CHANNEL_ACCESS_TOKEN`
   - **Channel Secret** → `LINE_CHANNEL_SECRET`

### Step 2: Add to .env.local

```bash
# Line OA Integration
LINE_CHANNEL_ACCESS_TOKEN=your_channel_access_token_here
LINE_CHANNEL_SECRET=your_channel_secret_here
LINE_OA_WEBHOOK_URL=https://yourdomain.com/api/line/complain
```

---

## LINE OA Configuration

### Step 1: Set Webhook URL

1. Go to [LINE Developers Console](https://developers.line.biz/)
2. Select your channel
3. Go to **Messaging API** settings
4. Find **Webhook URL** section
5. Set webhook URL to: `https://yourdomain.com/api/line/complain`
6. Click **Verify** to test it
7. Enable **Use webhook**

### Step 2: Configure Auto-Reply (Optional)

You can disable auto-reply from LINE to avoid duplicate messages, or keep it and let the webhook also send acknowledgments.

### Step 3: Test Connection

Click "Test" button in LINE Developers Console to verify webhook is working.

---

## Webhook Endpoint

### API Route

```
POST /api/line/complain
```

### Headers Required

- `X-Line-Signature` - HMAC-SHA256 signature for verification
- `Content-Type` - application/json

### Request Body (from LINE)

```json
{
  "events": [
    {
      "type": "message",
      "message": {
        "type": "text",
        "text": "I have a complaint about..."
      },
      "source": {
        "userId": "U1234567890...",
        "type": "user"
      },
      "replyToken": "reply_token_here",
      "timestamp": 1234567890000
    }
  ],
  "destination": "xxxxxxxxxx"
}
```

### Response

```json
{
  "success": true
}
```

### What Happens When Webhook Receives a Message:

1. **Signature Verification** - Verifies the request is from LINE
2. **Event Processing** - Extracts complaint text and user ID
3. **Auto-Categorization** - Categorizes the complaint based on keywords
4. **Database Storage** - Stores complaint in `complaints` table
5. **User Linking** - Tries to link complaint to existing user (optional)
6. **Auto-Reply** - Sends acknowledgment message back to LINE user

---

## Testing

### Manual Testing with cURL

```bash
# 1. Get a valid reply token from LINE first
# Send a message to your LINE OA account

# 2. Prepare test payload
curl -X POST https://yourdomain.com/api/line/complain \
  -H "Content-Type: application/json" \
  -H "X-Line-Signature: YOUR_SIGNATURE_HERE" \
  -d '{
    "events": [{
      "type": "message",
      "message": {
        "type": "text",
        "text": "This is a test complaint about payment delay"
      },
      "source": {
        "userId": "U1234567890abc123def456ghi789jkl",
        "type": "user"
      },
      "replyToken": "your_reply_token",
      "timestamp": 1234567890000
    }],
    "destination": "xxxxxxxxxx"
  }'
```

### Using LINE Official Account

1. Send a message to your LINE OA account
2. Check Supabase `complaints` table - new complaint should appear
3. Check if auto-categorization worked
4. Verify auto-reply message was sent back

---

## API Reference

### Server Functions (lib/server/complaints.server.ts)

#### Get All Complaints

```typescript
getAllComplaints(status?: string, category?: string)
// Returns: { success: boolean; data?: Complaint[] }
```

#### Get Complaint by ID

```typescript
getComplaintById(id: string)
// Returns: { success: boolean; data?: Complaint }
```

#### Get Complaints by User ID

```typescript
getComplaintsByUserId(userId: string)
// Returns: { success: boolean; data?: Complaint[] }
```

#### Get Complaints by LINE User ID

```typescript
getComplaintsByLineUserId(lineUserId: string)
// Returns: { success: boolean; data?: Complaint[] }
```

#### Update Complaint Status

```typescript
updateComplaintStatus(
  id: string,
  status: "pending" | "in_progress" | "resolved" | "closed",
  notes?: string
)
// Returns: { success: boolean; data?: Complaint }
```

#### Add Reply to Complaint

```typescript
addComplaintReply(
  complaintId: string,
  replyText: string,
  fromUserId?: string
)
// Returns: { success: boolean; data?: any }
```

#### Get Complaint Replies

```typescript
getComplaintReplies(complaintId: string)
// Returns: { success: boolean; data?: any[] }
```

#### Get Complaint Stats

```typescript
getComplaintStats();
// Returns: { success: boolean; stats?: { total, pending, in_progress, resolved, closed } }
```

---

## Features

### Auto-Categorization

Complaints are automatically categorized based on keywords:

| Category          | Keywords                  |
| ----------------- | ------------------------- |
| **payment**       | เงิน, จำนวน, ปริมาณ       |
| **delay**         | ความล่าช้า, ช้า, รอ       |
| **documentation** | เอกสาร, ใบหนังสือ, ข้อมูล |
| **service**       | พนักงาน, บริการ, ท่าที    |
| **system**        | ระบบ, เว็บ, แอป           |

### Auto-Reply

When a complaint is received, the system sends an automatic acknowledgment:

- Message: "ขอบคุณที่ส่งข้อร้องเรียน เรากำลังดำเนินการตรวจสอบ"
- Translation: "Thank you for submitting your complaint. We are processing it."

### Signature Verification

Uses HMAC-SHA256 to verify all webhooks are from LINE (prevents spoofing)

---

## Troubleshooting

### Webhook Not Receiving Events

1. Check webhook URL is correct and publicly accessible
2. Verify `X-Line-Signature` header is being sent
3. Check environment variables are set correctly
4. Review server logs for errors

### Complaints Not Appearing in Database

1. Check Supabase connectivity
2. Verify `complaints` table exists and has correct schema
3. Check complaint text is not empty
4. Review logs for auto-reply errors

### Auto-Reply Not Sending

1. Verify `LINE_CHANNEL_ACCESS_TOKEN` is correct
2. Check `replyToken` is valid (expires quickly)
3. Review LINE API response in logs
4. Check if LINE message has a valid `replyToken`

---

## Future Enhancements

- [ ] Image/file attachment support
- [ ] Automatic response routing based on category
- [ ] Sentiment analysis for complaint priority
- [ ] Integration with admin dashboard
- [ ] Email notifications for new complaints
- [ ] Bulk complaint export feature

---

## References

- [LINE Messaging API Documentation](https://developers.line.biz/en/reference/line-messaging-api/)
- [Webhook Signature Validation](https://developers.line.biz/en/reference/line-messaging-api/#signature-validation)
- [LINE Official Account](https://business.line.biz/)
