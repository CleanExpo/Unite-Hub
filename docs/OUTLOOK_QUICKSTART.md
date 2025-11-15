# Outlook Integration - Quick Start Guide

Get started with Outlook/Microsoft 365 integration in 5 minutes.

---

## Prerequisites

- Active Azure AD/Microsoft 365 account
- Admin access to Azure Portal (or IT admin to help)
- Unite-Hub instance running

---

## Step 1: Register Azure AD Application (5 minutes)

### 1.1 Go to Azure Portal

Visit: https://portal.azure.com

### 1.2 Create App Registration

1. Navigate to: **Azure Active Directory** → **App registrations**
2. Click: **New registration**
3. Fill in:
   - **Name**: `Unite-Hub`
   - **Supported account types**: `Accounts in any organizational directory and personal Microsoft accounts`
   - **Redirect URI**:
     - Type: `Web`
     - URL: `http://localhost:3008/api/integrations/outlook/callback` (development)

4. Click: **Register**

### 1.3 Get Client Credentials

**Copy Application (client) ID:**
- Found on the Overview page
- Save this as `MICROSOFT_CLIENT_ID`

**Create Client Secret:**
1. Go to: **Certificates & secrets**
2. Click: **New client secret**
3. Description: `Unite-Hub Integration`
4. Expires: `24 months`
5. Click: **Add**
6. **COPY THE SECRET VALUE IMMEDIATELY** (it won't be shown again)
7. Save this as `MICROSOFT_CLIENT_SECRET`

### 1.4 Add API Permissions

1. Go to: **API permissions**
2. Click: **Add a permission**
3. Select: **Microsoft Graph**
4. Choose: **Delegated permissions**
5. Add these permissions:
   - ✅ `openid`
   - ✅ `profile`
   - ✅ `email`
   - ✅ `offline_access`
   - ✅ `Mail.Read`
   - ✅ `Mail.ReadWrite`
   - ✅ `Mail.Send`
   - ✅ `Calendars.Read` (optional - for calendar features)
   - ✅ `Calendars.ReadWrite` (optional - for calendar features)

6. Click: **Grant admin consent for [Your Organization]**
   - If you don't see this button, ask your IT admin to grant consent

---

## Step 2: Configure Environment Variables (1 minute)

Add to your `.env.local` file:

```env
# Microsoft/Outlook Integration
MICROSOFT_CLIENT_ID=your-application-client-id-here
MICROSOFT_CLIENT_SECRET=your-client-secret-here
```

**Restart your development server** to load the new variables:

```bash
# Stop the server (Ctrl+C)
# Start it again
npm run dev
```

---

## Step 3: Connect Your First Account (2 minutes)

### 3.1 Using the API

```typescript
// In your React component
const connectOutlook = async () => {
  const response = await fetch('/api/integrations/outlook/connect', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orgId: 'your-org-id' })
  });

  const { authUrl } = await response.json();
  window.location.href = authUrl; // Redirects to Microsoft login
};
```

### 3.2 Test the Connection

After successful OAuth flow, you'll be redirected back to:
```
http://localhost:3008/dashboard/settings?outlook_connected=true&integration=xxx
```

### 3.3 Verify Integration

Check the database:

```sql
SELECT * FROM email_integrations
WHERE provider = 'outlook'
ORDER BY created_at DESC
LIMIT 1;
```

You should see:
- `provider`: `outlook`
- `account_email`: Your email address
- `is_active`: `true`
- `access_token`: (encrypted token)
- `refresh_token`: (encrypted token)

---

## Step 4: Sync Your First Emails (1 minute)

### 4.1 Trigger Sync

```typescript
const syncEmails = async (integrationId: string) => {
  const response = await fetch('/api/integrations/outlook/sync', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ integrationId })
  });

  const result = await response.json();
  console.log(`Synced ${result.imported} emails`);
};
```

### 4.2 Check Synced Emails

```sql
SELECT
  e.subject,
  e.from_email,
  e.received_at,
  c.name as contact_name
FROM emails e
JOIN contacts c ON e.contact_id = c.id
ORDER BY e.received_at DESC
LIMIT 10;
```

---

## Step 5: Send Your First Email (1 minute)

```typescript
const sendEmail = async (integrationId: string) => {
  const response = await fetch('/api/integrations/outlook/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      integrationId,
      to: 'recipient@example.com',
      subject: 'Test Email from Unite-Hub',
      body: '<p>This is a test email sent via Outlook integration!</p>'
    })
  });

  const result = await response.json();
  console.log('Email sent:', result.messageId);
};
```

---

## Next Steps

### Connect Multiple Accounts

You can connect unlimited Outlook accounts per organization:

```typescript
// Connect second account
await connectOutlook(); // Same process, new authorization

// List all accounts
const response = await fetch(`/api/integrations/outlook/accounts?orgId=${orgId}`);
const { accounts } = await response.json();

// Sync all accounts
await fetch('/api/integrations/outlook/accounts', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    action: 'sync_all',
    orgId
  })
});
```

---

### Set Up Automated Sync

**Option 1: Next.js API Route Cron (Vercel)**

```typescript
// src/app/api/cron/sync-outlook/route.ts
import { syncAllOutlookAccounts } from '@/lib/services/outlook-sync';

export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  // Get all orgs and sync
  const orgs = await db.organizations.listAll();
  for (const org of orgs.data) {
    await syncAllOutlookAccounts(org.id);
  }

  return Response.json({ success: true });
}
```

**Add to `vercel.json`:**
```json
{
  "crons": [
    {
      "path": "/api/cron/sync-outlook",
      "schedule": "*/15 * * * *"
    }
  ]
}
```

---

**Option 2: External Cron Service**

Use services like:
- **Cron-job.org** - Free cron service
- **EasyCron** - Cron service with monitoring
- **GitHub Actions** - Run on schedule

```yaml
# .github/workflows/sync-outlook.yml
name: Sync Outlook Emails
on:
  schedule:
    - cron: '*/15 * * * *' # Every 15 minutes

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Sync
        run: |
          curl -X POST https://yourdomain.com/api/cron/sync-outlook \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}"
```

---

### Use Calendar Features

**Get upcoming meetings:**

```typescript
const getUpcomingMeetings = async (integrationId: string) => {
  const now = new Date();
  const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const response = await fetch(
    `/api/integrations/outlook/calendar/events?` +
    `integrationId=${integrationId}&` +
    `startDate=${now.toISOString()}&` +
    `endDate=${nextWeek.toISOString()}`
  );

  return response.json();
};
```

**Schedule a meeting:**

```typescript
const scheduleMeeting = async (integrationId: string) => {
  const response = await fetch('/api/integrations/outlook/calendar/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      integrationId,
      subject: 'Product Demo',
      start: new Date('2025-11-20T14:00:00Z').toISOString(),
      end: new Date('2025-11-20T15:00:00Z').toISOString(),
      location: 'Zoom',
      body: '<p>Discuss product features and pricing</p>',
      attendees: ['client@example.com']
    })
  });

  return response.json();
};
```

---

## Troubleshooting

### Common Issues

**❌ "unauthorized_client" error**

**Solution:**
- Verify `MICROSOFT_CLIENT_ID` matches Azure AD app
- Check redirect URI is exactly `http://localhost:3008/api/integrations/outlook/callback`

---

**❌ "invalid_grant" error**

**Solution:**
- Authorization codes are single-use
- Don't refresh page during OAuth flow
- User needs to re-authenticate

---

**❌ "insufficient_permissions" error**

**Solution:**
- Verify all permissions added in Azure AD
- Click "Grant admin consent"
- If in enterprise, ask IT admin to grant consent

---

**❌ Emails not syncing**

**Solution:**
1. Check integration is active:
   ```sql
   SELECT is_active FROM email_integrations WHERE id = 'your-integration-id';
   ```

2. Check token expiry:
   ```sql
   SELECT token_expires_at FROM email_integrations WHERE id = 'your-integration-id';
   ```

3. Manually trigger sync:
   ```typescript
   await fetch('/api/integrations/outlook/sync', {
     method: 'POST',
     body: JSON.stringify({ integrationId })
   });
   ```

---

**❌ Calendar API returns 403**

**Solution:**
- Add `Calendars.Read` and `Calendars.ReadWrite` permissions in Azure AD
- Grant admin consent
- User may need to re-authorize

---

## Production Deployment

### Update Redirect URI

1. Go to Azure Portal → App registrations → Your app
2. Navigate to **Authentication**
3. Add production redirect URI:
   ```
   https://yourdomain.com/api/integrations/outlook/callback
   ```
4. Click **Save**

### Update Environment Variables

In production `.env`:

```env
MICROSOFT_CLIENT_ID=your-client-id
MICROSOFT_CLIENT_SECRET=your-client-secret
NEXT_PUBLIC_URL=https://yourdomain.com
```

---

## Support

- **Setup Guide**: [docs/OUTLOOK_SETUP_GUIDE.md](OUTLOOK_SETUP_GUIDE.md)
- **API Reference**: [docs/OUTLOOK_API_REFERENCE.md](OUTLOOK_API_REFERENCE.md)
- **Microsoft Docs**: https://docs.microsoft.com/en-us/graph/

---

**Total Setup Time**: ~10 minutes
**Difficulty**: Easy
**Prerequisites**: Azure AD access

---

**Last Updated**: 2025-11-15
**Version**: 1.0.0
