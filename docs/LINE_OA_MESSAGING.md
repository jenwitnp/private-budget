# LINE Official Account (OA) Integration Guide

This guide explains how to set up LINE OA messaging links in the complaints system.

## Overview

Users can now click a button on complaint cards to send a message directly to your LINE Official Account. This enables seamless communication between the web platform and LINE OA.

## Setup

### 1. Get Your LINE OA ID

1. Go to [LINE Official Account Manager](https://manager.line.biz/)
2. Navigate to your account settings
3. Find your **Bot ID** (looks like: `@1234567890abcdef1234567890abcdef`)

### 2. Configure Environment Variables

Add the LINE OA ID to your `.env.local` file:

```env
NEXT_PUBLIC_LINE_OA_ID=@your_oa_id_here
```

Replace `@your_oa_id_here` with your actual LINE OA Bot ID.

**Example:**

```env
NEXT_PUBLIC_LINE_OA_ID=@ABC123DEF456
```

### 3. Deploy Changes

After adding the environment variable:

- **Local Development**: Restart your dev server (`npm run dev`)
- **Production**: Deploy to Vercel and set the environment variable in the Vercel Dashboard

## Features

### Complaint Card

- A green **LINE** button appears next to the "View Detail" button
- Clicking it opens the LINE OA conversation with the specific customer (using their LINE user ID)
- Allows direct messaging to that customer through LINE OA

### Detail Modal

- When viewing complaint details, a "Chat on LINE" badge appears next to status badges
- Clicking it also opens the LINE OA conversation with that customer

## URL Format

The links include the customer's LINE user ID for direct communication:

```
https://line.me/R/oaMessage/{OA_ID}/?userId={LINE_USER_ID}
```

Example:

```
https://line.me/R/oaMessage/@ABC123DEF456/?userId=U1234567890abcdef1234567890abcdef
```

This allows you to:

- Identify which complaint the conversation is related to
- Track conversations by customer
- Provide personalized support based on complaint history

## Troubleshooting

### Buttons Don't Appear

- Check that `NEXT_PUBLIC_LINE_OA_ID` is set in `.env.local`
- Make sure the dev server was restarted after adding the variable
- Verify the OA ID format is correct (should start with `@`)

### Links Don't Work

- Ensure your OA ID is correct in LINE Manager
- Try importing the OA in LINE app first manually
- Verify you're using the Bot ID, not the User ID

## Code Reference

The LINE OA configuration is managed in:

- `lib/config/lineOA.ts` - Configuration file
- `pages/complaints.tsx` - Component integration

Key helper functions:

```typescript
LINE_OA_CONFIG.getMessageUrl(); // Get the full LINE OA message URL
LINE_OA_CONFIG.isConfigured(); // Check if OA ID is configured
```

## Security Notes

- `NEXT_PUBLIC_LINE_OA_ID` is intentionally public (exposed to the browser)
- No sensitive data is sent to LINE through these links
- Users control whether to add/block the OA in their LINE app
