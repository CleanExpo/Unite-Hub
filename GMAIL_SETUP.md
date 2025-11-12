# Gmail API Integration Setup Guide

## Complete Setup Instructions for Unite-Hub Email Ingestion

### Prerequisites
- Google Cloud Project
- Gmail account (contact@unite-group.in)
- Node.js and npm installed
- Convex account and deployment

---

## Step 1: Google Cloud Console Setup

### 1.1 Create Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Name: "Unite-Hub-Gmail"

### 1.2 Enable Gmail API
1. Navigate to **APIs & Services** > **Library**
2. Search for "Gmail API"
3. Click **Enable**

### 1.3 Configure OAuth Consent Screen
1. Go to **APIs & Services** > **OAuth consent screen**
2. Select **External** (or Internal if using Google Workspace)
3. Fill in:
   - App name: "Unite-Hub CRM"
   - User support email: your-email@unite-group.in
   - Developer contact: your-email@unite-group.in
4. Click **Save and Continue**
5. Add scopes:
   - `https://www.googleapis.com/auth/gmail.readonly`
   - `https://www.googleapis.com/auth/gmail.send`
   - `https://www.googleapis.com/auth/gmail.modify`
   - `https://www.googleapis.com/auth/gmail.metadata`
6. Add test users (your Gmail account)
7. Click **Save and Continue**

### 1.4 Create OAuth Credentials
1. Go to **APIs & Services** > **Credentials**
2. Click **Create Credentials** > **OAuth 2.0 Client ID**
3. Application type: **Web application**
4. Name: "Unite-Hub Gmail Integration"
5. Authorized redirect URIs:
   - `http://localhost:3008/api/email/oauth/callback` (development)
   - `https://your-domain.com/api/email/oauth/callback` (production)
6. Click **Create**
7. **Save Client ID and Client Secret** - you'll need these!

---

## Step 2: Environment Variables Setup

### 2.1 Add to `.env.local`
```bash
# Google OAuth & Gmail API
GOOGLE_CLIENT_ID=your-client-id-from-step-1.4
GOOGLE_CLIENT_SECRET=your-client-secret-from-step-1.4
GOOGLE_REDIRECT_URI=http://localhost:3008/api/email/oauth/callback

# Gmail Inbox
GMAIL_INBOX_EMAIL=contact@unite-group.in

# Convex
NEXT_PUBLIC_CONVEX_URL=https://your-convex-deployment.convex.cloud

# Default Organization ID (get from Convex dashboard)
DEFAULT_ORG_ID=your-default-org-id
```

---

## Step 3: OAuth Authorization Flow

### 3.1 Start the Application
```bash
npm run dev
```

### 3.2 Authorize Gmail Access
1. Open browser: `http://localhost:3008/api/email/oauth/authorize`
2. Sign in with Gmail account (contact@unite-group.in)
3. Grant permissions to Unite-Hub
4. You'll be redirected back to your app

### 3.3 Capture Tokens
After authorization, check your server console for:
- Access Token
- Refresh Token
- Expiry Date

### 3.4 Add Tokens to Environment
```bash
GMAIL_ACCESS_TOKEN=ya29.a0AfH6...
GMAIL_REFRESH_TOKEN=1//0gZ...
```

**Important:** Store these securely! Never commit to git.

---

## Step 4: Setup Gmail Push Notifications (Optional)

### 4.1 Enable Pub/Sub API
1. In Google Cloud Console, enable **Cloud Pub/Sub API**

### 4.2 Create Pub/Sub Topic
```bash
gcloud pubsub topics create gmail-webhook
```

### 4.3 Grant Gmail Permissions
```bash
gcloud pubsub topics add-iam-policy-binding gmail-webhook \
  --member=serviceAccount:gmail-api-push@system.gserviceaccount.com \
  --role=roles/pubsub.publisher
```

### 4.4 Create Subscription
```bash
gcloud pubsub subscriptions create gmail-webhook-sub \
  --topic=gmail-webhook \
  --push-endpoint=https://your-domain.com/api/email/webhook
```

### 4.5 Add to Environment
```bash
GOOGLE_CLOUD_PROJECT_ID=your-project-id
GOOGLE_PUBSUB_TOPIC=projects/your-project-id/topics/gmail-webhook
```

---

## Step 5: Test the Integration

### 5.1 Manual Email Sync
```bash
curl -X POST http://localhost:3008/api/email/sync \
  -H "Content-Type: application/json" \
  -d '{"orgId": "your-org-id"}'
```

### 5.2 Send Test Email
Send an email to `contact@unite-group.in` and verify it appears in:
1. Server console logs
2. Convex dashboard (emailThreads table)
3. Client dashboard (if UI is built)

### 5.3 Test Email Parsing
```bash
curl -X POST http://localhost:3008/api/email/parse \
  -H "Content-Type: application/json" \
  -d '{
    "messageId": "gmail-message-id",
    "accessToken": "your-access-token",
    "refreshToken": "your-refresh-token"
  }'
```

---

## Step 6: Production Deployment

### 6.1 Update OAuth Redirect URIs
1. Go to Google Cloud Console > Credentials
2. Edit your OAuth 2.0 Client
3. Add production redirect URI:
   - `https://unite-hub.com/api/email/oauth/callback`

### 6.2 Update Environment Variables
Set production variables in your hosting platform (Vercel, etc.):
```bash
GOOGLE_REDIRECT_URI=https://unite-hub.com/api/email/oauth/callback
NEXT_PUBLIC_URL=https://unite-hub.com
```

### 6.3 Setup Webhook Endpoint
Ensure your webhook endpoint is publicly accessible:
- `https://unite-hub.com/api/email/webhook`

### 6.4 Re-authorize in Production
1. Visit: `https://unite-hub.com/api/email/oauth/authorize`
2. Complete OAuth flow
3. Update production environment with new tokens

---

## API Endpoints Reference

### OAuth & Setup
- `GET /api/email/oauth/authorize` - Start OAuth flow
- `GET /api/email/oauth/callback` - OAuth callback handler

### Email Operations
- `POST /api/email/webhook` - Gmail push notification webhook
- `POST /api/email/parse` - Parse email by message ID
- `POST /api/email/sync` - Manual sync of unread emails
- `POST /api/email/send` - Send email via Gmail
- `POST /api/email/link` - Link email to client account
- `DELETE /api/email/link` - Unlink email from client

### Client Email Queries
- `GET /api/clients/[id]/emails` - Get all emails for a client

---

## Troubleshooting

### Token Expired Error
- Tokens expire after 1 hour
- Refresh token is used to get new access token
- System handles this automatically

### Webhook Not Receiving Notifications
1. Check Pub/Sub subscription is active
2. Verify push endpoint is publicly accessible
3. Check webhook endpoint logs
4. Ensure Gmail watch is active (renew every 7 days)

### Email Not Syncing
1. Verify Gmail API is enabled
2. Check access token is valid
3. Ensure scopes include `gmail.readonly`
4. Check server logs for errors

### Client Auto-Creation Issues
1. Verify DEFAULT_ORG_ID is set
2. Check Convex schema is deployed
3. Ensure clientEmails table exists

---

## Security Best Practices

1. **Never commit credentials to git**
   - Use `.env.local` (gitignored)
   - Use environment variables in production

2. **Rotate tokens regularly**
   - Re-authorize every 6 months
   - Monitor for unauthorized access

3. **Use HTTPS in production**
   - Secure OAuth redirects
   - Protect webhook endpoint

4. **Validate webhook notifications**
   - Verify sender is Google
   - Check email address matches expected

5. **Rate limiting**
   - Implement API rate limits
   - Monitor Gmail API quotas

---

## Gmail API Quotas

- **Daily API calls:** 1,000,000,000 per day
- **Per-user rate limit:** 250 quota units per second
- **Batch requests:** 100 requests per batch

Monitor usage in Google Cloud Console > APIs & Services > Dashboard

---

## Support Resources

- [Gmail API Documentation](https://developers.google.com/gmail/api)
- [OAuth 2.0 Guide](https://developers.google.com/identity/protocols/oauth2)
- [Pub/Sub Documentation](https://cloud.google.com/pubsub/docs)
- [Convex Documentation](https://docs.convex.dev)

---

## Next Steps

1. Complete OAuth setup
2. Test email ingestion
3. Build client dashboard UI
4. Implement AI-powered auto-replies
5. Setup email tracking and analytics
6. Add attachment processing
7. Implement email templates

---

**Setup completed successfully!** Your Gmail integration is ready for email ingestion at contact@unite-group.in.
