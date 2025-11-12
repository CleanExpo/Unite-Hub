# Gmail API Setup Guide

Complete step-by-step guide to set up Gmail API integration for Unite-Hub CRM's email ingestion system.

## Overview

Unite-Hub uses Gmail API to:
- Monitor incoming emails to contact@unite-group.in
- Automatically process and categorize emails
- Send auto-replies with intelligent questions
- Track email threads and conversations
- Sync contact information from email senders

## Prerequisites

- Google Cloud Platform account
- Gmail account (contact@unite-group.in or your monitoring email)
- Admin access to your Google Workspace (if using Workspace)
- Unite-Hub application running locally or deployed

---

## Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click on the project dropdown at the top
3. Click "New Project"
4. Enter project details:
   - **Project Name**: `Unite-Hub-CRM` (or your preferred name)
   - **Organization**: Select your organization (if applicable)
5. Click "Create"
6. Wait for the project to be created (takes a few seconds)

---

## Step 2: Enable Gmail API

1. In the Google Cloud Console, ensure your new project is selected
2. Navigate to **APIs & Services** > **Library**
3. Search for "Gmail API"
4. Click on "Gmail API" from the results
5. Click the "Enable" button
6. Wait for the API to be enabled (takes a few seconds)

---

## Step 3: Configure OAuth Consent Screen

Before creating credentials, you must configure the OAuth consent screen.

### 3.1: Basic Configuration

1. Navigate to **APIs & Services** > **OAuth consent screen**
2. Select user type:
   - **Internal**: If using Google Workspace (recommended for production)
   - **External**: For testing or non-Workspace accounts
3. Click "Create"

### 3.2: App Information

Fill in the following details:

- **App name**: `Unite-Hub CRM`
- **User support email**: `contact@unite-group.in` (your support email)
- **App logo**: (Optional) Upload your company logo
- **Application home page**: `https://your-domain.com` (your production URL)
- **Application privacy policy link**: `https://your-domain.com/privacy`
- **Application terms of service link**: `https://your-domain.com/terms`
- **Authorized domains**: Add your domain (e.g., `unite-group.in`)
- **Developer contact information**: `contact@unite-group.in`

Click "Save and Continue"

### 3.3: Scopes Configuration

1. Click "Add or Remove Scopes"
2. Add the following Gmail API scopes:

   ```
   https://www.googleapis.com/auth/gmail.readonly
   https://www.googleapis.com/auth/gmail.send
   https://www.googleapis.com/auth/gmail.modify
   ```

   These scopes allow:
   - `gmail.readonly`: Read emails and metadata
   - `gmail.send`: Send emails on behalf of the user
   - `gmail.modify`: Mark emails as read, archive, etc.

3. Click "Update" then "Save and Continue"

### 3.4: Test Users (for External apps only)

If you selected "External" user type:
1. Click "Add Users"
2. Add email addresses that can test the app:
   - `contact@unite-group.in`
   - Add any developer/tester emails
3. Click "Save and Continue"

### 3.5: Review and Publish

1. Review all information
2. Click "Back to Dashboard"
3. For production use with External apps, click "Publish App" (requires verification for production use)

---

## Step 4: Create OAuth 2.0 Credentials

1. Navigate to **APIs & Services** > **Credentials**
2. Click "Create Credentials" > "OAuth client ID"
3. Configure OAuth client:

   - **Application type**: `Web application`
   - **Name**: `Unite-Hub Web Client`

   **Authorized JavaScript origins**:
   ```
   http://localhost:3008
   https://your-production-domain.com
   https://your-production-domain.vercel.app
   ```

   **Authorized redirect URIs**:
   ```
   http://localhost:3008/api/integrations/gmail/callback
   https://your-production-domain.com/api/integrations/gmail/callback
   https://your-production-domain.vercel.app/api/integrations/gmail/callback
   ```

4. Click "Create"
5. **IMPORTANT**: Copy your credentials:
   - **Client ID**: `xxxxxxxxxxxx.apps.googleusercontent.com`
   - **Client Secret**: `GOCSPX-xxxxxxxxxxxx`
6. Download the JSON file for backup (optional but recommended)

---

## Step 5: Configure Environment Variables

Add the following to your `.env.local` file:

```bash
# Gmail Integration
GMAIL_CLIENT_ID=your-client-id.apps.googleusercontent.com
GMAIL_CLIENT_SECRET=GOCSPX-xxxxxxxxxxxxxxxx
GMAIL_REDIRECT_URI=http://localhost:3008/api/integrations/gmail/callback

# Google OAuth (for NextAuth)
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxxxxxxxxxxxxx
GOOGLE_CALLBACK_URL=http://localhost:3008/api/integrations/gmail/callback
```

For production, update with production URLs:

```bash
GMAIL_REDIRECT_URI=https://your-domain.com/api/integrations/gmail/callback
GOOGLE_CALLBACK_URL=https://your-domain.com/api/integrations/gmail/callback
```

---

## Step 6: Set Up Gmail Push Notifications (Optional but Recommended)

Push notifications allow real-time email ingestion instead of polling.

### 6.1: Enable Cloud Pub/Sub API

1. In Google Cloud Console, go to **APIs & Services** > **Library**
2. Search for "Cloud Pub/Sub API"
3. Click "Enable"

### 6.2: Create a Pub/Sub Topic

1. Navigate to **Pub/Sub** > **Topics**
2. Click "Create Topic"
3. Enter topic details:
   - **Topic ID**: `gmail-inbox-events`
   - Leave other settings as default
4. Click "Create"

### 6.3: Grant Gmail Permission to Publish

1. Click on the topic you just created
2. Click "Permissions" tab
3. Click "Add Principal"
4. Add the following:
   - **Principal**: `serviceAccount:gmail-api-push@system.gserviceaccount.com`
   - **Role**: `Pub/Sub Publisher`
5. Click "Save"

### 6.4: Create a Pub/Sub Subscription

1. In your topic, go to "Subscriptions" tab
2. Click "Create Subscription"
3. Configure:
   - **Subscription ID**: `gmail-inbox-subscription`
   - **Delivery type**: `Push`
   - **Endpoint URL**: `https://your-domain.com/api/webhooks/gmail`
   - **Acknowledgement deadline**: 10 seconds
4. Click "Create"

### 6.5: Set Up Watch Request

After deployment, you'll need to set up a watch request via Gmail API. Add this to your initialization code or run manually:

```javascript
const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

await gmail.users.watch({
  userId: 'me',
  requestBody: {
    topicName: 'projects/your-project-id/topics/gmail-inbox-events',
    labelIds: ['INBOX'],
  },
});
```

Watch requests expire after 7 days, so set up a cron job to renew:

```javascript
// Run daily to ensure watch is active
// Add to your cron jobs or scheduled functions
```

---

## Step 7: Configure Webhook for Email Monitoring

### 7.1: Set Up Contact Email Filter (Alternative to Push)

If not using push notifications, set up periodic sync:

1. Create a cron job or scheduled function
2. Call the sync endpoint every 5-15 minutes:

```bash
curl -X POST https://your-domain.com/api/integrations/gmail/sync \
  -H "Authorization: Bearer YOUR_API_KEY"
```

### 7.2: Email Forwarding (Simple Alternative)

For immediate setup without API complexity:

1. In Gmail, go to Settings > Forwarding and POP/IMAP
2. Add forwarding address: Your webhook endpoint email
3. Set up an email parsing service like SendGrid Inbound Parse or Mailgun
4. Configure the parsing service to POST to your webhook

---

## Step 8: Test Email Ingestion

### 8.1: Authorize Gmail Integration

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Navigate to: `http://localhost:3008/dashboard/settings`
3. Find "Email Integrations" section
4. Click "Connect Gmail"
5. Follow OAuth flow:
   - Sign in with contact@unite-group.in
   - Review permissions
   - Click "Allow"
6. You should be redirected back to settings with "Connected" status

### 8.2: Send a Test Email

1. From any email account (not contact@unite-group.in), send an email to contact@unite-group.in
2. Subject: "Test: Partnership Opportunity with [Your Company]"
3. Body: Include text like:
   ```
   Hi Unite Group,

   I'm interested in exploring a partnership opportunity.
   I'd love to discuss how we can work together on marketing campaigns.

   When would be a good time to schedule a call?

   Best regards,
   Duncan Test
   ```

### 8.3: Verify Email Processing

1. Wait 1-2 minutes (or trigger manual sync)
2. Check Convex dashboard or your app:
   ```bash
   # Trigger manual sync
   curl -X POST http://localhost:3008/api/integrations/gmail/sync
   ```

3. Navigate to: `http://localhost:3008/dashboard/contacts`
4. You should see:
   - New contact created with sender's email
   - Email thread visible in contact details
   - AI analysis showing intents (e.g., "partnership", "meeting")
   - Sentiment analysis (likely "positive")

### 8.4: Verify Auto-Reply

1. Check the sender's inbox (Duncan's test email)
2. You should receive an auto-reply within a few minutes:
   ```
   Subject: Re: Partnership Opportunity with [Your Company]

   Hi Duncan,

   Thank you for reaching out about a partnership opportunity!

   To better understand how we can help you, could you provide more information about:

   1. What type of marketing campaigns are you interested in?
   2. What is your target audience?
   3. What are your primary marketing goals?

   Looking forward to hearing from you!

   Best regards,
   Unite Group Team
   ```

---

## Step 9: Monitor and Troubleshoot

### 9.1: Check Gmail API Quota

1. Go to Google Cloud Console > **APIs & Services** > **Dashboard**
2. Click on "Gmail API"
3. View quota usage:
   - **Quota limit**: 1 billion queries per day (default)
   - **Per-user rate limit**: 250 quota units per second
4. If you hit limits, request a quota increase

### 9.2: View API Logs

1. Navigate to **Logs Explorer** in Google Cloud Console
2. Filter by resource: `Gmail API`
3. Review logs for errors or issues

### 9.3: Test API Connection

Run this test script:

```javascript
import { google } from 'googleapis';

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GMAIL_REDIRECT_URI
);

// Set credentials from your integration
oauth2Client.setCredentials({
  access_token: 'YOUR_ACCESS_TOKEN',
  refresh_token: 'YOUR_REFRESH_TOKEN',
});

const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

// Test: Get profile
const profile = await gmail.users.getProfile({ userId: 'me' });
console.log('Email:', profile.data.emailAddress);
console.log('Total messages:', profile.data.messagesTotal);

// Test: List recent messages
const messages = await gmail.users.messages.list({
  userId: 'me',
  maxResults: 5,
});
console.log('Recent messages:', messages.data.messages);
```

---

## Troubleshooting

### Error: "Access Denied" or "insufficient_permissions"

**Cause**: OAuth scopes not properly configured

**Solution**:
1. Re-check OAuth consent screen scopes
2. Revoke existing tokens: https://myaccount.google.com/permissions
3. Re-authorize the application
4. Ensure scopes in code match consent screen:
   ```javascript
   const scopes = [
     'https://www.googleapis.com/auth/gmail.readonly',
     'https://www.googleapis.com/auth/gmail.send',
     'https://www.googleapis.com/auth/gmail.modify',
   ];
   ```

### Error: "invalid_grant"

**Cause**: Refresh token expired or revoked

**Solution**:
1. Token may have expired (lasts 6 months of inactivity)
2. Re-authorize with `prompt: 'consent'` to get new refresh token
3. Check if user revoked access
4. Generate new tokens through OAuth flow

### Error: "Quota exceeded"

**Cause**: Too many API requests

**Solution**:
1. Implement exponential backoff
2. Cache results when possible
3. Use push notifications instead of polling
4. Request quota increase from Google

### Emails Not Syncing

**Cause**: Multiple possible issues

**Solution**:
1. Check if integration is active in database
2. Verify token hasn't expired
3. Check `last_sync_at` timestamp
4. Manually trigger sync and check logs
5. Verify Gmail filters aren't blocking emails
6. Check if emails are marked as spam

### Auto-Reply Not Sending

**Cause**: Send scope missing or SMTP issues

**Solution**:
1. Verify `gmail.send` scope is authorized
2. Check email format and encoding
3. Review Gmail sending limits (500/day for regular Gmail)
4. Check spam folder of recipient
5. Verify OAuth token has send permissions

### Push Notifications Not Working

**Cause**: Pub/Sub configuration issues

**Solution**:
1. Verify Pub/Sub topic exists and has correct permissions
2. Check if watch request is active (expires after 7 days)
3. Renew watch request
4. Verify webhook endpoint is accessible
5. Check endpoint authentication
6. Review Pub/Sub subscription logs

---

## Security Best Practices

1. **Never commit credentials**: Always use environment variables
2. **Rotate tokens regularly**: Implement token rotation strategy
3. **Use HTTPS in production**: Ensure all callbacks use HTTPS
4. **Validate webhook requests**: Verify requests are from Google
5. **Implement rate limiting**: Protect your webhook endpoints
6. **Store tokens encrypted**: Encrypt access/refresh tokens in database
7. **Monitor API usage**: Set up alerts for unusual activity
8. **Limit scope access**: Only request necessary scopes
9. **Regular security audits**: Review OAuth permissions monthly

---

## Production Checklist

Before going live:

- [ ] OAuth consent screen published (for External apps)
- [ ] Production redirect URIs added to OAuth client
- [ ] Environment variables updated with production values
- [ ] HTTPS enabled on production domain
- [ ] Push notifications configured (or polling cron job)
- [ ] Watch request renewal cron job set up
- [ ] Error monitoring and alerts configured
- [ ] Token refresh mechanism tested
- [ ] Email sending limits understood (500/day for Gmail)
- [ ] Backup authentication method available
- [ ] API quota monitoring enabled
- [ ] Security audit completed
- [ ] Rate limiting implemented on webhooks
- [ ] Database backups configured
- [ ] Logging and monitoring in place

---

## Additional Resources

- [Gmail API Documentation](https://developers.google.com/gmail/api)
- [OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Gmail API Quotas](https://developers.google.com/gmail/api/reference/quota)
- [Push Notifications Guide](https://developers.google.com/gmail/api/guides/push)
- [Google Cloud Pub/Sub](https://cloud.google.com/pubsub/docs)

---

## Support

For issues specific to Unite-Hub Gmail integration:
- Check application logs: `npm run dev` console output
- Review Convex function logs in dashboard
- Contact: contact@unite-group.in
