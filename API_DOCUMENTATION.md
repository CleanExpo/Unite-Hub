# Unite-Hub Gmail API Documentation

Complete API reference for Gmail email ingestion system.

## Base URL
- Development: `http://localhost:3008`
- Production: `https://unite-hub.com`

---

## OAuth & Authentication

### Initiate OAuth Flow
**GET** `/api/email/oauth/authorize`

Redirects user to Google OAuth consent screen.

**Query Parameters:**
- `orgId` (optional): Organization ID to associate with the integration

**Response:**
Redirects to Google OAuth consent screen

**Example:**
```bash
curl http://localhost:3008/api/email/oauth/authorize?orgId=org_123
```

---

### OAuth Callback
**GET** `/api/email/oauth/callback`

Handles OAuth callback from Google.

**Query Parameters:**
- `code`: Authorization code from Google
- `state`: State data passed to OAuth flow
- `error`: Error code (if authorization failed)

**Response:**
Redirects to integration settings page with success/error status

**Example:**
```
http://localhost:3008/api/email/oauth/callback?code=4/0AY0e-g7...&state=%7B%22orgId%22%3A%22org_123%22%7D
```

---

## Email Operations

### Receive Webhook Notification
**POST** `/api/email/webhook`

Receives Gmail push notifications via Google Cloud Pub/Sub.

**Headers:**
- `Content-Type: application/json`

**Request Body:**
```json
{
  "message": {
    "data": "base64-encoded-notification-data",
    "messageId": "message-id",
    "publishTime": "2024-01-01T00:00:00Z"
  },
  "subscription": "projects/PROJECT_ID/subscriptions/gmail-webhook-sub"
}
```

**Response:**
```json
{
  "success": true,
  "processed": 3,
  "messages": [
    {
      "emailThreadId": "kt5d7g8h9j0k1l2m3n4",
      "clientId": "jg7h8i9j0k1l2m3n4o5",
      "isNewClient": false
    }
  ]
}
```

**Example:**
```bash
curl -X POST http://localhost:3008/api/email/webhook \
  -H "Content-Type: application/json" \
  -d '{"message":{"data":"eyJlbWFpbEFkZHJlc3MiOiJjb250YWN0QHVuaXRlLWdyb3VwLmluIiwiaGlzdG9yeUlkIjoiMTIzNDU2Nzg5MCJ9"}}'
```

---

### Parse Email
**POST** `/api/email/parse`

Parse email content from Gmail message ID.

**Headers:**
- `Content-Type: application/json`

**Request Body:**
```json
{
  "messageId": "18c5d9a7f8b3e2d1",
  "accessToken": "ya29.a0AfH6...",
  "refreshToken": "1//0gZ..."
}
```

**Response:**
```json
{
  "success": true,
  "email": {
    "messageId": "18c5d9a7f8b3e2d1",
    "threadId": "18c5d9a7f8b3e2d0",
    "sender": {
      "email": "client@example.com",
      "name": "John Doe"
    },
    "subject": "Inquiry about services",
    "body": {
      "html": "<p>Hello, I'm interested...</p>",
      "plain": "Hello, I'm interested..."
    },
    "receivedAt": 1704067200000,
    "attachments": [
      {
        "filename": "document.pdf",
        "mimeType": "application/pdf",
        "size": 102400,
        "attachmentId": "ANGjdJ8..."
      }
    ],
    "headers": {
      "from": "John Doe <client@example.com>",
      "to": "contact@unite-group.in",
      "date": "Mon, 1 Jan 2024 00:00:00 +0000",
      "messageId": "<CAB...@mail.gmail.com>"
    }
  }
}
```

**Example:**
```bash
curl -X POST http://localhost:3008/api/email/parse \
  -H "Content-Type: application/json" \
  -d '{
    "messageId": "18c5d9a7f8b3e2d1",
    "accessToken": "ya29.a0AfH6...",
    "refreshToken": "1//0gZ..."
  }'
```

---

### Sync Emails
**POST** `/api/email/sync`

Manually trigger sync of unread emails from Gmail.

**Headers:**
- `Content-Type: application/json`

**Request Body:**
```json
{
  "orgId": "jf6g7h8i9j0k1l2m3n4"
}
```

**Response:**
```json
{
  "success": true,
  "processed": 15,
  "errors": 0
}
```

**Example:**
```bash
curl -X POST http://localhost:3008/api/email/sync \
  -H "Content-Type: application/json" \
  -d '{"orgId": "jf6g7h8i9j0k1l2m3n4"}'
```

---

### Send Email
**POST** `/api/email/send`

Send email via Gmail API.

**Headers:**
- `Content-Type: application/json`

**Request Body:**
```json
{
  "clientId": "jg7h8i9j0k1l2m3n4o5",
  "to": "client@example.com",
  "subject": "Welcome to Unite-Hub",
  "bodyHtml": "<h1>Welcome!</h1><p>Thank you for joining...</p>",
  "bodyPlain": "Welcome! Thank you for joining...",
  "cc": ["manager@example.com"],
  "bcc": ["tracking@unite-group.in"],
  "replyTo": "support@unite-group.in",
  "enableTracking": true
}
```

**Response:**
```json
{
  "success": true,
  "messageId": "18c5d9a7f8b3e2d1",
  "threadId": "18c5d9a7f8b3e2d0",
  "emailThreadId": "kt5d7g8h9j0k1l2m3n4",
  "trackingPixelId": "1704067200000_abc123xyz"
}
```

**Example:**
```bash
curl -X POST http://localhost:3008/api/email/send \
  -H "Content-Type: application/json" \
  -d '{
    "clientId": "jg7h8i9j0k1l2m3n4o5",
    "to": "client@example.com",
    "subject": "Welcome to Unite-Hub",
    "bodyHtml": "<h1>Welcome!</h1>",
    "enableTracking": true
  }'
```

---

### Link Email to Client
**POST** `/api/email/link`

Link email address to existing client account.

**Headers:**
- `Content-Type: application/json`

**Request Body:**
```json
{
  "clientId": "jg7h8i9j0k1l2m3n4o5",
  "emailAddress": "john.doe@example.com",
  "label": "work",
  "isPrimary": false
}
```

**Response:**
```json
{
  "success": true,
  "clientEmail": {
    "id": "ke6f7g8h9i0j1k2l3m4",
    "clientId": "jg7h8i9j0k1l2m3n4o5",
    "emailAddress": "john.doe@example.com",
    "isPrimary": false,
    "label": "work"
  }
}
```

**Error Responses:**
```json
// Email already linked to this client
{
  "error": "Email already linked to this client"
}

// Email linked to another client
{
  "error": "Email already linked to another client",
  "existingClientId": "jh8i9j0k1l2m3n4o5p6"
}
```

**Example:**
```bash
curl -X POST http://localhost:3008/api/email/link \
  -H "Content-Type: application/json" \
  -d '{
    "clientId": "jg7h8i9j0k1l2m3n4o5",
    "emailAddress": "john.doe@example.com",
    "label": "work",
    "isPrimary": false
  }'
```

---

### Unlink Email from Client
**DELETE** `/api/email/link`

Unlink email address from client account.

**Headers:**
- `Content-Type: application/json`

**Request Body:**
```json
{
  "clientEmailId": "ke6f7g8h9i0j1k2l3m4"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Email unlinked successfully"
}
```

**Error Responses:**
```json
// Cannot delete primary email
{
  "error": "Cannot delete primary email. Set another email as primary first."
}
```

**Example:**
```bash
curl -X DELETE http://localhost:3008/api/email/link \
  -H "Content-Type: application/json" \
  -d '{"clientEmailId": "ke6f7g8h9i0j1k2l3m4"}'
```

---

## Client Email Queries

### Get Client Emails
**GET** `/api/clients/[id]/emails`

Get all emails for a specific client.

**Path Parameters:**
- `id`: Client ID

**Query Parameters:**
- `page` (default: 1): Page number
- `limit` (default: 20): Results per page
- `sortBy` (default: "receivedAt"): Sort field
- `sortOrder` (default: "desc"): Sort direction (asc/desc)
- `unreadOnly` (default: false): Filter unread emails only

**Response:**
```json
{
  "success": true,
  "client": {
    "id": "jg7h8i9j0k1l2m3n4o5",
    "name": "John Doe",
    "businessName": "Doe Industries",
    "primaryEmail": "john@doeindustries.com"
  },
  "emails": [
    {
      "id": "kt5d7g8h9j0k1l2m3n4",
      "senderEmail": "john@doeindustries.com",
      "senderName": "John Doe",
      "subject": "Inquiry about services",
      "messageBody": "<p>Hello...</p>",
      "messageBodyPlain": "Hello...",
      "receivedAt": 1704067200000,
      "isRead": false,
      "autoReplySent": false,
      "attachments": [],
      "gmailMessageId": "18c5d9a7f8b3e2d1",
      "gmailThreadId": "18c5d9a7f8b3e2d0"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "totalPages": 3,
    "totalEmails": 47
  },
  "stats": {
    "totalEmails": 47,
    "unreadCount": 5,
    "repliedCount": 42,
    "emailAddresses": [
      {
        "email": "john@doeindustries.com",
        "isPrimary": true,
        "label": "work",
        "verified": true
      },
      {
        "email": "jdoe@gmail.com",
        "isPrimary": false,
        "label": "personal",
        "verified": false
      }
    ]
  }
}
```

**Example:**
```bash
curl http://localhost:3008/api/clients/jg7h8i9j0k1l2m3n4o5/emails?page=1&limit=20&unreadOnly=true
```

---

## Error Responses

All endpoints follow consistent error response format:

```json
{
  "error": "Error message description"
}
```

### Common HTTP Status Codes

- `200 OK` - Success
- `400 Bad Request` - Invalid request parameters
- `401 Unauthorized` - Missing or invalid authentication
- `404 Not Found` - Resource not found
- `409 Conflict` - Resource conflict (e.g., duplicate email)
- `500 Internal Server Error` - Server error

---

## Rate Limits

- **Email Sync:** 50 emails per request
- **Batch Operations:** 100 emails per batch
- **Gmail API:** 250 quota units per user per second
- **Webhook Processing:** Unlimited (push-based)

---

## Webhook Setup

### 1. Create Pub/Sub Topic
```bash
gcloud pubsub topics create gmail-webhook
```

### 2. Grant Permissions
```bash
gcloud pubsub topics add-iam-policy-binding gmail-webhook \
  --member=serviceAccount:gmail-api-push@system.gserviceaccount.com \
  --role=roles/pubsub.publisher
```

### 3. Create Subscription
```bash
gcloud pubsub subscriptions create gmail-webhook-sub \
  --topic=gmail-webhook \
  --push-endpoint=https://unite-hub.com/api/email/webhook
```

### 4. Setup Gmail Watch
Gmail watch expires after 7 days. Renew regularly:

```typescript
import { setupGmailWebhook } from '@/lib/gmail';

const result = await setupGmailWebhook(accessToken, refreshToken, {
  topicName: 'projects/PROJECT_ID/topics/gmail-webhook',
  labelIds: ['INBOX'],
});

console.log('Watch expires:', new Date(result.expiration));
```

---

## Authentication

Most endpoints require OAuth tokens or server-side authentication.

### Server-Side (Internal APIs)
Use environment variables:
- `GMAIL_ACCESS_TOKEN`
- `GMAIL_REFRESH_TOKEN`

### Client-Side (Webhook)
Webhook notifications are authenticated via:
1. Pub/Sub message verification
2. Email address validation
3. History ID validation

---

## Data Models

### Client
```typescript
{
  _id: string;
  orgId: string;
  clientName: string;
  businessName: string;
  primaryEmail: string;
  status: "active" | "onboarding" | "inactive";
  packageTier: "starter" | "professional";
}
```

### Client Email
```typescript
{
  _id: string;
  clientId: string;
  emailAddress: string;
  isPrimary: boolean;
  label: string;
  verified: boolean;
  linkedAt: number;
}
```

### Email Thread
```typescript
{
  _id: string;
  clientId: string;
  senderEmail: string;
  senderName: string;
  subject: string;
  messageBody: string;
  messageBodyPlain: string;
  attachments: Attachment[];
  receivedAt: number;
  isRead: boolean;
  autoReplySent: boolean;
  gmailMessageId: string;
  gmailThreadId: string;
}
```

### Auto Reply
```typescript
{
  _id: string;
  emailThreadId: string;
  clientId: string;
  questionsGenerated: string[];
  autoReplyContent: string;
  sentAt: number;
  responseReceived: boolean;
}
```

---

## Testing with Postman

Import collection:
```json
{
  "info": {
    "name": "Unite-Hub Gmail API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Email Operations",
      "item": [
        {
          "name": "Sync Emails",
          "request": {
            "method": "POST",
            "url": "{{baseUrl}}/api/email/sync",
            "body": {
              "mode": "raw",
              "raw": "{\"orgId\": \"{{orgId}}\"}"
            }
          }
        }
      ]
    }
  ]
}
```

---

## SDK Usage

### TypeScript/JavaScript
```typescript
import { gmailClient, sendEmail, processEmailByMessageId } from '@/lib/gmail';

// Send email
const result = await sendEmail(accessToken, refreshToken, {
  to: 'client@example.com',
  subject: 'Hello',
  bodyHtml: '<p>Hello!</p>',
});

// Process email
const processed = await processEmailByMessageId(
  messageId,
  accessToken,
  refreshToken,
  orgId
);
```

---

## Support

For implementation help:
- See `GMAIL_SETUP.md` for setup instructions
- See `lib/gmail/README.md` for library documentation
- Check server logs for debugging

---

## Changelog

### v1.0.0 (2024-01-01)
- Initial release
- OAuth 2.0 authentication
- Email ingestion and parsing
- Webhook notifications
- Email sending
- Multi-email client management
- Attachment handling

---

**API Documentation Version:** 1.0.0
**Last Updated:** January 2024
