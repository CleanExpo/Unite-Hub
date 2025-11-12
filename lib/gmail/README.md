# Gmail API Integration Library

Production-ready Gmail API integration for Unite-Hub email ingestion system.

## Overview

This library provides a complete solution for:
- Gmail OAuth 2.0 authentication
- Email ingestion and parsing
- Webhook notifications (Push API)
- Email sending
- Attachment handling
- Multi-email client management

## Architecture

```
lib/gmail/
├── client.ts       # OAuth client & Gmail API initialization
├── parser.ts       # Email parsing (sender, subject, body, attachments)
├── webhook.ts      # Gmail push notification handlers
├── sender.ts       # Send emails via Gmail API
├── storage.ts      # Attachment upload/download
├── processor.ts    # Complete email processing pipeline
└── index.ts        # Exports
```

## Core Components

### 1. Gmail Client (`client.ts`)

Handles OAuth 2.0 authentication and Gmail API client management.

```typescript
import { gmailClient } from '@/lib/gmail';

// Get OAuth authorization URL
const authUrl = gmailClient.getAuthUrl('state-data');

// Exchange code for tokens
const credentials = await gmailClient.getTokensFromCode(code);

// Refresh expired tokens
const newCredentials = await gmailClient.refreshAccessToken(refreshToken);

// Get Gmail API client
const gmail = gmailClient.getGmailAPI(credentials);
```

### 2. Email Parser (`parser.ts`)

Parses Gmail messages into structured format.

```typescript
import { parseGmailMessage, downloadAttachment } from '@/lib/gmail';

// Parse Gmail message
const parsedEmail = parseGmailMessage(gmailMessage);

// Access parsed data
console.log(parsedEmail.senderEmail);
console.log(parsedEmail.subject);
console.log(parsedEmail.bodyPlain);
console.log(parsedEmail.attachments);

// Download attachment
const data = await downloadAttachment(gmail, messageId, attachmentId);
```

### 3. Webhook Handler (`webhook.ts`)

Manages Gmail push notifications via Google Cloud Pub/Sub.

```typescript
import { setupGmailWebhook, parseWebhookNotification } from '@/lib/gmail';

// Setup webhook (once)
const result = await setupGmailWebhook(accessToken, refreshToken, {
  topicName: 'projects/PROJECT_ID/topics/gmail-webhook',
  labelIds: ['INBOX'],
});

// Parse incoming webhook notification
const parsed = parseWebhookNotification(notification);
if (parsed) {
  console.log('New email:', parsed.emailAddress);
  console.log('History ID:', parsed.historyId);
}
```

### 4. Email Sender (`sender.ts`)

Send emails via Gmail API with full RFC 2822 support.

```typescript
import { sendEmail, sendAutoReply, addTrackingPixel } from '@/lib/gmail';

// Send email
const result = await sendEmail(accessToken, refreshToken, {
  to: 'client@example.com',
  subject: 'Welcome to Unite-Hub',
  bodyHtml: '<h1>Hello!</h1>',
  bodyPlain: 'Hello!',
});

// Send auto-reply
await sendAutoReply(
  accessToken,
  refreshToken,
  originalMessageId,
  originalThreadId,
  recipientEmail,
  'Re: Your inquiry',
  '<p>Thank you for your email...</p>'
);

// Add tracking pixel
const htmlWithTracking = addTrackingPixel(bodyHtml, trackingUrl);
```

### 5. Email Processor (`processor.ts`)

Complete pipeline for processing emails end-to-end.

```typescript
import { processEmailByMessageId, syncUnreadEmails } from '@/lib/gmail/processor';

// Process single email
const result = await processEmailByMessageId(
  messageId,
  accessToken,
  refreshToken,
  orgId
);

console.log('Email thread ID:', result.emailThreadId);
console.log('Client ID:', result.clientId);
console.log('Is new client:', result.isNewClient);

// Sync all unread emails
const syncResult = await syncUnreadEmails(accessToken, refreshToken, orgId);
console.log('Processed:', syncResult.processed);
```

## Usage Examples

### Complete Email Ingestion Flow

```typescript
import { gmailClient, parseGmailMessage, processEmail } from '@/lib/gmail';

// 1. Get Gmail API client
const gmail = gmailClient.getGmailAPI({
  accessToken: process.env.GMAIL_ACCESS_TOKEN,
  refreshToken: process.env.GMAIL_REFRESH_TOKEN,
});

// 2. Fetch message
const message = await gmail.users.messages.get({
  userId: 'me',
  id: messageId,
  format: 'full',
});

// 3. Parse message
const parsedEmail = parseGmailMessage(message.data);

// 4. Process and store
const result = await processEmail(
  parsedEmail,
  parsedEmail.attachments,
  orgId
);
```

### Webhook Integration

```typescript
// In your webhook endpoint (e.g., /api/email/webhook)
import { parseWebhookNotification, fetchNewMessages } from '@/lib/gmail';

export async function POST(req: NextRequest) {
  const notification = await req.json();

  // Parse notification
  const parsed = parseWebhookNotification(notification);
  if (!parsed) {
    return NextResponse.json({ error: 'Invalid notification' }, { status: 400 });
  }

  // Fetch new messages since last history ID
  const messageIds = await fetchNewMessages(
    accessToken,
    refreshToken,
    parsed.historyId
  );

  // Process each message
  for (const messageId of messageIds) {
    await processEmailByMessageId(messageId, accessToken, refreshToken, orgId);
  }

  return NextResponse.json({ success: true });
}
```

### Send Email with Tracking

```typescript
import { sendEmail, addTrackingPixel } from '@/lib/gmail';

// Generate tracking pixel
const trackingId = generateTrackingId();
const trackingUrl = `${process.env.NEXT_PUBLIC_URL}/api/tracking/pixel/${trackingId}`;

// Add tracking to HTML
const htmlWithTracking = addTrackingPixel(bodyHtml, trackingUrl);

// Send email
const result = await sendEmail(accessToken, refreshToken, {
  to: clientEmail,
  subject: 'Your personalized content',
  bodyHtml: htmlWithTracking,
  bodyPlain: stripHtml(bodyHtml),
});
```

## Data Structures

### ParsedEmail
```typescript
interface ParsedEmail {
  messageId: string;
  threadId: string;
  senderEmail: string;
  senderName: string;
  subject: string;
  bodyHtml: string;
  bodyPlain: string;
  receivedAt: number;
  attachments: EmailAttachment[];
  headers: EmailHeaders;
}
```

### EmailAttachment
```typescript
interface EmailAttachment {
  filename: string;
  mimeType: string;
  size: number;
  attachmentId: string;
  data?: string; // Base64 encoded
}
```

### EmailOptions (for sending)
```typescript
interface EmailOptions {
  to: string | string[];
  cc?: string | string[];
  bcc?: string | string[];
  subject: string;
  bodyHtml?: string;
  bodyPlain?: string;
  replyTo?: string;
  inReplyTo?: string;
  references?: string;
  attachments?: EmailAttachment[];
}
```

## Error Handling

All functions throw errors that should be caught:

```typescript
try {
  const result = await processEmailByMessageId(messageId, token, refresh, orgId);
} catch (error) {
  if (error.message.includes('token')) {
    // Handle token refresh error
  } else if (error.message.includes('quota')) {
    // Handle API quota exceeded
  } else {
    // Handle other errors
  }
}
```

## Rate Limiting

Gmail API has quotas:
- 250 quota units per user per second
- 1 billion quota units per day

The library includes built-in rate limiting:
- 100ms delay between emails when sending
- 200ms delay between processing emails

## Security

### OAuth Tokens
- Never expose tokens in client-side code
- Store refresh tokens securely (encrypted database or secret manager)
- Rotate tokens regularly

### Webhook Verification
```typescript
import { verifyGmailWebhook } from '@/lib/gmail';

const isValid = verifyGmailWebhook(notification, expectedEmail);
if (!isValid) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
```

### Email Validation
```typescript
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
if (!emailRegex.test(email)) {
  throw new Error('Invalid email format');
}
```

## Testing

### Local Testing
```bash
# Start dev server
npm run dev

# Test OAuth flow
curl http://localhost:3008/api/email/oauth/authorize

# Test email sync
curl -X POST http://localhost:3008/api/email/sync \
  -H "Content-Type: application/json" \
  -d '{"orgId": "test-org-id"}'
```

### Unit Testing
```typescript
import { parseGmailMessage } from '@/lib/gmail';

describe('parseGmailMessage', () => {
  it('should parse sender email correctly', () => {
    const message = createMockGmailMessage();
    const parsed = parseGmailMessage(message);
    expect(parsed.senderEmail).toBe('test@example.com');
  });
});
```

## Performance Optimization

### Batch Processing
```typescript
import { batchProcessEmails } from '@/lib/gmail/processor';

// Process multiple emails efficiently
const results = await batchProcessEmails(
  messageIds,
  accessToken,
  refreshToken,
  orgId
);
```

### Attachment Caching
Store downloaded attachments to avoid re-downloading:
```typescript
const cachedAttachment = await getFromCache(attachmentId);
if (!cachedAttachment) {
  const data = await downloadAttachment(gmail, messageId, attachmentId);
  await saveToCache(attachmentId, data);
}
```

## Troubleshooting

### Common Issues

**1. Token Expired**
```typescript
if (gmailClient.needsTokenRefresh(expiryDate)) {
  const newCredentials = await gmailClient.refreshAccessToken(refreshToken);
  // Update stored credentials
}
```

**2. Quota Exceeded**
- Monitor API usage in Google Cloud Console
- Implement exponential backoff
- Cache frequently accessed data

**3. Webhook Not Working**
- Verify Pub/Sub topic permissions
- Check webhook endpoint is publicly accessible
- Ensure watch is renewed every 7 days

## Dependencies

```json
{
  "googleapis": "^166.0.0",
  "convex": "^1.29.0"
}
```

## Environment Variables

Required:
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_REDIRECT_URI`
- `GMAIL_ACCESS_TOKEN`
- `GMAIL_REFRESH_TOKEN`
- `GMAIL_INBOX_EMAIL`
- `NEXT_PUBLIC_CONVEX_URL`
- `DEFAULT_ORG_ID`

Optional:
- `GOOGLE_CLOUD_PROJECT_ID`
- `GOOGLE_PUBSUB_TOPIC`

## License

Proprietary - Unite-Hub CRM System

## Support

For setup assistance, see `GMAIL_SETUP.md` in the project root.
