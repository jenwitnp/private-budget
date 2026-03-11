# LINE Official Account (OA) Manager Chat Integration Guide

This guide explains how to integrate LINE OA Manager chat console for admins to communicate with customers directly through the LINE OA Manager dashboard.

## Overview

Instead of sending personal LINE messages, admins can now click a button to open the LINE OA Manager chat console and chat with specific customers. This provides a professional channel for business communications.

**Link Format:**

```
https://manager.line.biz/account/{OA_ID}/chat/{USER_ID}
```

Example:

```
https://manager.line.biz/account/374yziyi/chat/U0ec973ebdf8b65262a4aef60f1d720d0
```

## Setup

### 1. Get Your LINE OA Basic ID

1. Go to [LINE Official Account Manager](https://manager.line.biz/)
2. Navigate to your account settings
3. Find your **Basic ID** (format: `374yziyi` - without the @ symbol)

### 2. Configure Environment Variables

Add the LINE OA ID to your `.env.local` file (with @ symbol):

```env
NEXT_PUBLIC_LINE_OA_ID=@374yziyi
```

### 3. Deploy Changes

After adding the environment variable:

- **Local Development**: Restart your dev server (`npm run dev`)
- **Production**: Deploy to Vercel and set the environment variable in the Vercel Dashboard

## Features

### Complaint Card

- A green **LINE Chat** button appears next to the "View Detail" button
- Clicking it opens LINE OA Manager chat with the specific customer
- Allows direct admin-to-customer communication within the OA Manager

### Detail Modal

- When viewing complaint details, an "Admin Chat" badge appears next to status badges
- Clicking it opens the same manager chat console
- Professional communication channel for resolving complaints

## How It Works

1. Admin views a complaint with a customer's LINE info
2. Admin clicks the **LINE Chat** or **Admin Chat** button
3. Browser opens LINE OA Manager with that customer's chat window
4. Admin can send messages, resolve issues, and provide support
5. Conversation history is maintained in the OA Manager

## URL Structure

```
https://manager.line.biz/account/{OA_ID_WITHOUT_AT}/chat/{LINE_USER_ID}
```

**Components:**

- `OA_ID_WITHOUT_AT`: Your LINE Basic ID (e.g., `374yziyi`)
- `LINE_USER_ID`: Customer's LINE user ID (e.g., `U0ec973ebdf8b65262a4aef60f1d720d0`)

## Code Reference

The configuration is managed in:

- `lib/config/lineOA.ts` - Configuration and URL generation
- `pages/complaints.tsx` - Component integration

Key helper functions:

```typescript
LINE_OA_CONFIG.getManagerChatUrl(userId); // Get manager chat URL for a user
LINE_OA_CONFIG.getOAIdWithoutAt(); // Get OA ID without @ symbol
LINE_OA_CONFIG.isConfigured(); // Check if OA ID is configured
```

## Requirements

- Admin must be logged into LINE Official Account Manager
- Customer must have a valid LINE user ID (stored in complaints)
- LINE OA must be properly configured with customer

## Security Notes

- `NEXT_PUBLIC_LINE_OA_ID` is intentionally public (exposed to the browser)
- No sensitive data is sent to LINE through these links
- Only authenticated admins can access the manager dashboard
- User IDs are obtained from legitimate complaint records

## Security Notes

- `NEXT_PUBLIC_LINE_OA_ID` is intentionally public (exposed to the browser)
- No sensitive data is sent to LINE through these links
- Users control whether to add/block the OA in their LINE app
