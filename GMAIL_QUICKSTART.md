# Gmail Integration - Quick Start Guide

Get up and running with email ingestion in 10 minutes.

---

## Prerequisites

- Node.js 18+ installed
- Google account (contact@unite-group.in)
- Convex account
- Git repository cloned

---

## Step 1: Install Dependencies (1 min)

```bash
npm install
```

---

## Step 2: Google Cloud Setup (5 min)

1. **Create Project**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create new project: "Unite-Hub-Gmail"

2. **Enable Gmail API**
   - Navigate to APIs & Services > Library
   - Search "Gmail API" and click Enable

3. **Create OAuth Credentials**
   - Go to APIs & Services > Credentials
   - Create OAuth 2.0 Client ID
   - Add redirect URI: `http://localhost:3008/api/email/oauth/callback`
   - Save Client ID and Client Secret

---

## Step 3: Environment Setup (2 min)

Create `.env.local`:

```bash
# Google OAuth
GOOGLE_CLIENT_ID=your-client-id-here
GOOGLE_CLIENT_SECRET=your-client-secret-here
GOOGLE_REDIRECT_URI=http://localhost:3008/api/email/oauth/callback

# Gmail
GMAIL_INBOX_EMAIL=contact@unite-group.in

# Convex
NEXT_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud

# Default Org
DEFAULT_ORG_ID=your-org-id
```

---

## Step 4: Deploy Convex Schema (1 min)

```bash
npx convex deploy
```

This deploys:
- clientEmails functions
- emailThreads functions
- clients functions
- autoReplies functions

---

## Step 5: Start Development Server (1 min)

```bash
npm run dev
```

Server starts at: `http://localhost:3008`

---

## Step 6: Authorize Gmail Access (2 min)

1. **Open browser:**
   ```
   http://localhost:3008/api/email/oauth/authorize
   ```

2. **Sign in** with Gmail account

3. **Grant permissions** to Unite-Hub

4. **Copy tokens** from server console:
   ```
   Access Token: ya29.a0AfH6...
   Refresh Token: 1//0gZ...
   ```

5. **Add tokens to `.env.local`:**
   ```bash
   GMAIL_ACCESS_TOKEN=ya29.a0AfH6...
   GMAIL_REFRESH_TOKEN=1//0gZ...
   ```

6. **Restart server:**
   ```bash
   # Stop server (Ctrl+C)
   npm run dev
   ```

---

## Step 7: Test Email Sync (1 min)

Send test email to `contact@unite-group.in`, then:

```bash
curl -X POST http://localhost:3008/api/email/sync \
  -H "Content-Type: application/json" \
  -d '{"orgId": "your-org-id"}'
```

Expected response:
```json
{
  "success": true,
  "processed": 1,
  "errors": 0
}
```

---

## Verify Installation

### Check Database
Open Convex dashboard and verify:
- New client created in `clients` table
- Email stored in `emailThreads` table
- Email address in `clientEmails` table

### Check API
```bash
# Get client emails
curl http://localhost:3008/api/clients/CLIENT_ID/emails
```

---

## Common Issues

**"Gmail credentials not configured"**
- Verify tokens are in `.env.local`
- Restart development server

**"Client not found"**
- Ensure DEFAULT_ORG_ID is set
- Check organization exists in Convex

**"Token expired"**
- Token expires after 1 hour
- System auto-refreshes using refresh token
- If issues persist, re-authorize

---

## Next Steps

1. **Setup Webhooks** (optional)
   - See `GMAIL_SETUP.md` Step 4
   - Real-time email notifications

2. **Build UI**
   - Client dashboard
   - Email inbox view
   - Email composer

3. **Implement AI Features**
   - Auto-reply generation
   - Email categorization
   - Sentiment analysis

4. **Add Email Templates**
   - Welcome emails
   - Follow-up sequences
   - Campaign templates

---

## API Endpoints Ready to Use

```bash
# OAuth
GET  /api/email/oauth/authorize
GET  /api/email/oauth/callback

# Email Operations
POST /api/email/webhook
POST /api/email/parse
POST /api/email/sync
POST /api/email/send
POST /api/email/link
DELETE /api/email/link

# Client Queries
GET  /api/clients/[id]/emails
```

---

## Documentation

- **Setup Guide:** `GMAIL_SETUP.md` (detailed setup)
- **API Reference:** `API_DOCUMENTATION.md` (all endpoints)
- **Library Docs:** `lib/gmail/README.md` (code usage)
- **Summary:** `GMAIL_INTEGRATION_SUMMARY.md` (overview)

---

**Total Setup Time: ~10 minutes**
**Ready to process emails!** 🚀
