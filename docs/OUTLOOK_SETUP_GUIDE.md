# Outlook/Microsoft 365 Integration Setup Guide

This guide walks you through setting up multi-account Outlook integration for Unite-Hub.

---

## Table of Contents

1. [Azure AD App Registration](#azure-ad-app-registration)
2. [Environment Configuration](#environment-configuration)
3. [Required Permissions](#required-permissions)
4. [API Endpoints](#api-endpoints)
5. [Multi-Account Support](#multi-account-support)
6. [Calendar Integration](#calendar-integration)
7. [Testing](#testing)
8. [Troubleshooting](#troubleshooting)

---

## Azure AD App Registration

### Step 1: Create Azure AD Application

1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to **Azure Active Directory** > **App registrations**
3. Click **New registration**

### Step 2: Configure Application

**Basic Information:**
- **Name**: `Unite-Hub Outlook Integration`
- **Supported account types**: `Accounts in any organizational directory and personal Microsoft accounts`
- **Redirect URI**:
  - Platform: `Web`
  - URI: `http://localhost:3008/api/integrations/outlook/callback` (development)
  - URI: `https://yourdomain.com/api/integrations/outlook/callback` (production)

### Step 3: Get Client Credentials

1. After registration, copy the **Application (client) ID**
2. Go to **Certificates & secrets**
3. Click **New client secret**
4. Add description: `Unite-Hub Integration`
5. Choose expiration: `24 months` (recommended)
6. Click **Add** and **copy the secret value immediately** (it won't be shown again)

### Step 4: Configure API Permissions

1. Go to **API permissions**
2. Click **Add a permission**
3. Select **Microsoft Graph**
4. Choose **Delegated permissions**
5. Add the following permissions:

**Required Permissions:**
- `openid` - Sign in and read user profile
- `profile` - View users' basic profile
- `email` - View users' email address
- `offline_access` - Maintain access to data you have given it access to
- `Mail.Read` - Read user mail
- `Mail.ReadWrite` - Read and write access to user mail
- `Mail.Send` - Send mail as a user
- `Calendars.Read` - Read user calendars
- `Calendars.ReadWrite` - Read and write user calendars

6. Click **Grant admin consent** (if you're an admin)

### Step 5: Configure Authentication

1. Go to **Authentication**
2. Under **Implicit grant and hybrid flows**, enable:
   - ✅ **Access tokens** (for implicit flows)
   - ✅ **ID tokens** (for hybrid flows)
3. Click **Save**

---

## Environment Configuration

Add the following environment variables to your `.env.local` file:

```env
# Microsoft/Outlook Integration
MICROSOFT_CLIENT_ID=your-application-client-id-here
MICROSOFT_CLIENT_SECRET=your-client-secret-here

# Make sure NEXT_PUBLIC_URL is set
NEXT_PUBLIC_URL=http://localhost:3008
```

**Production Environment:**
```env
MICROSOFT_CLIENT_ID=your-application-client-id-here
MICROSOFT_CLIENT_SECRET=your-client-secret-here
NEXT_PUBLIC_URL=https://yourdomain.com
```

### Update Redirect URIs for Production

When deploying to production:
1. Go back to Azure AD App registration
2. Navigate to **Authentication**
3. Add production redirect URI: `https://yourdomain.com/api/integrations/outlook/callback`
4. Click **Save**

---

## Required Permissions

### Microsoft Graph Scopes

The integration uses the following Microsoft Graph API scopes:

| Scope | Purpose | Required |
|-------|---------|----------|
| `openid` | User authentication | ✅ Yes |
| `profile` | Basic user info | ✅ Yes |
| `email` | User email address | ✅ Yes |
| `offline_access` | Refresh tokens | ✅ Yes |
| `Mail.Read` | Read emails | ✅ Yes |
| `Mail.ReadWrite` | Modify emails (mark as read) | ✅ Yes |
| `Mail.Send` | Send emails | ✅ Yes |
| `Calendars.Read` | Read calendar events | ⚠️ Optional |
| `Calendars.ReadWrite` | Create calendar events | ⚠️ Optional |

### Admin Consent

Some organizations require admin consent for these permissions:
1. Ask your IT admin to grant consent in Azure AD
2. Alternatively, use the admin consent URL format:
```
https://login.microsoftonline.com/{tenant}/adminconsent
  ?client_id={client_id}
  &redirect_uri={redirect_uri}
```

---

## API Endpoints

### Connect Outlook Account

**Endpoint:** `POST /api/integrations/outlook/connect`

**Request:**
```json
{
  "orgId": "uuid-of-organization"
}
```

**Response:**
```json
{
  "authUrl": "https://login.microsoftonline.com/common/oauth2/v2.0/authorize?..."
}
```

**Usage:**
```typescript
const response = await fetch('/api/integrations/outlook/connect', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ orgId: 'your-org-id' })
});

const { authUrl } = await response.json();
window.location.href = authUrl; // Redirect user to Microsoft login
```

---

### OAuth Callback

**Endpoint:** `GET /api/integrations/outlook/callback`

**Query Parameters:**
- `code` - Authorization code from Microsoft
- `state` - Base64 encoded orgId

**Response:** Redirects to dashboard with integration ID

This endpoint is called automatically by Microsoft after user authorizes.

---

### Sync Emails

**Endpoint:** `POST /api/integrations/outlook/sync`

**Request:**
```json
{
  "integrationId": "uuid-of-integration"
}
```

**Response:**
```json
{
  "success": true,
  "imported": 15,
  "total": 20
}
```

---

### Send Email

**Endpoint:** `POST /api/integrations/outlook/send`

**Request:**
```json
{
  "integrationId": "uuid-of-integration",
  "to": "recipient@example.com",
  "subject": "Email subject",
  "body": "<p>HTML email body</p>",
  "trackingPixelId": "optional-tracking-id"
}
```

**Response:**
```json
{
  "success": true,
  "messageId": "AAMkAG..."
}
```

---

### Disconnect Account

**Endpoint:** `POST /api/integrations/outlook/disconnect`

**Request:**
```json
{
  "integrationId": "uuid-of-integration"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Outlook account disconnected"
}
```

---

### List All Accounts

**Endpoint:** `GET /api/integrations/outlook/accounts?orgId=uuid`

**Response:**
```json
{
  "success": true,
  "accounts": [
    {
      "id": "uuid",
      "accountEmail": "user@example.com",
      "isActive": true,
      "lastSyncAt": "2025-11-15T10:30:00Z",
      "tokenExpiresAt": "2025-11-15T12:00:00Z",
      "createdAt": "2025-11-01T08:00:00Z"
    }
  ]
}
```

---

### Manage Accounts

**Endpoint:** `POST /api/integrations/outlook/accounts`

**Sync All Accounts:**
```json
{
  "action": "sync_all",
  "orgId": "uuid-of-organization"
}
```

**Toggle Account:**
```json
{
  "action": "toggle",
  "orgId": "uuid-of-organization",
  "integrationId": "uuid-of-integration",
  "isActive": false
}
```

**Set Primary Account:**
```json
{
  "action": "set_primary",
  "orgId": "uuid-of-organization",
  "integrationId": "uuid-of-integration"
}
```

**Label Account:**
```json
{
  "action": "label",
  "orgId": "uuid-of-organization",
  "integrationId": "uuid-of-integration",
  "label": "Sales Team"
}
```

---

## Calendar Integration

### Get Calendar Events

**Endpoint:** `GET /api/integrations/outlook/calendar/events`

**Query Parameters:**
- `integrationId` - Integration ID (required)
- `startDate` - ISO 8601 date (optional, defaults to now)
- `endDate` - ISO 8601 date (optional, defaults to 7 days from now)

**Response:**
```json
{
  "success": true,
  "events": [
    {
      "id": "AAMkAG...",
      "subject": "Team Meeting",
      "start": {
        "dateTime": "2025-11-15T14:00:00",
        "timeZone": "UTC"
      },
      "end": {
        "dateTime": "2025-11-15T15:00:00",
        "timeZone": "UTC"
      },
      "location": {
        "displayName": "Conference Room A"
      },
      "attendees": [...]
    }
  ]
}
```

---

### Create Calendar Event

**Endpoint:** `POST /api/integrations/outlook/calendar/create`

**Request:**
```json
{
  "integrationId": "uuid-of-integration",
  "subject": "Client Meeting",
  "start": "2025-11-20T10:00:00Z",
  "end": "2025-11-20T11:00:00Z",
  "location": "Zoom",
  "body": "<p>Discuss Q4 goals</p>",
  "attendees": ["client@example.com"]
}
```

**Response:**
```json
{
  "success": true,
  "eventId": "AAMkAG...",
  "webLink": "https://outlook.office365.com/..."
}
```

---

## Multi-Account Support

Unite-Hub supports connecting multiple Outlook/Microsoft 365 accounts per organization.

### Features

1. **Multiple Account Connection**
   - Connect unlimited Outlook accounts
   - Each stored separately in `email_integrations` table
   - Independent sync status and tokens

2. **Account Labeling**
   - Label accounts for organization (e.g., "Sales Team", "Support Inbox")
   - Stored in `account_label` field

3. **Primary Account**
   - Set one account as primary for sending emails
   - Automatically selected if not specified
   - Stored in `is_primary` field

4. **Toggle Active Status**
   - Enable/disable accounts without deleting
   - Inactive accounts won't sync
   - Preserves historical data

5. **Unified Inbox**
   - All emails from all accounts flow to `emails` table
   - Linked to specific integration via foreign key
   - Contacts automatically created/updated

### Database Schema

The `email_integrations` table supports multi-account:

```sql
-- Fields used for multi-account support:
provider          -- 'outlook' for Microsoft accounts
account_email     -- User's email address
account_label     -- Custom label (e.g., "Marketing Team")
is_active         -- Whether account is enabled
is_primary        -- Whether this is the primary sending account
org_id            -- Organization ID
workspace_id      -- Workspace ID
```

---

## Testing

### Manual Testing Checklist

- [ ] Azure AD app registration complete
- [ ] Environment variables configured
- [ ] Connect first Outlook account
- [ ] Verify OAuth flow completes
- [ ] Check integration created in database
- [ ] Sync emails from account
- [ ] Verify emails appear in `emails` table
- [ ] Verify contacts created in `contacts` table
- [ ] Send test email via Outlook integration
- [ ] Connect second Outlook account
- [ ] Verify both accounts listed in UI
- [ ] Set primary account
- [ ] Toggle account active/inactive
- [ ] Test calendar events (optional)
- [ ] Test calendar creation (optional)

### Automated Testing

Create integration test:

```typescript
// test/integrations/outlook.test.ts
import { handleOutlookCallback } from '@/lib/integrations/outlook';

describe('Outlook Integration', () => {
  it('should handle OAuth callback', async () => {
    const integration = await handleOutlookCallback(mockCode, orgId);
    expect(integration).toBeDefined();
    expect(integration.provider).toBe('outlook');
  });

  it('should sync emails', async () => {
    const result = await syncOutlookEmails(integrationId);
    expect(result.imported).toBeGreaterThan(0);
  });

  it('should send email', async () => {
    const result = await sendEmailViaOutlook(
      integrationId,
      'test@example.com',
      'Test Subject',
      '<p>Test Body</p>'
    );
    expect(result.success).toBe(true);
  });
});
```

---

## Troubleshooting

### Common Issues

#### 1. "unauthorized_client" Error

**Cause:** Invalid client ID or secret

**Solution:**
- Verify `MICROSOFT_CLIENT_ID` matches Azure AD app
- Verify `MICROSOFT_CLIENT_SECRET` is correct
- Check redirect URI matches exactly

---

#### 2. "invalid_grant" Error

**Cause:** Authorization code already used or expired

**Solution:**
- Authorization codes are single-use
- User needs to re-authenticate
- Don't refresh page during OAuth flow

---

#### 3. "insufficient_permissions" Error

**Cause:** User hasn't consented to permissions

**Solution:**
- Add `prompt: 'consent'` to OAuth URL (already configured)
- Request admin consent if in enterprise environment
- Verify all required permissions added in Azure AD

---

#### 4. Token Refresh Fails

**Cause:** Refresh token expired or invalid

**Solution:**
- Refresh tokens expire after 90 days of inactivity
- User needs to re-authenticate
- Check `token_expires_at` in database

---

#### 5. Calendar API Returns 403

**Cause:** Missing calendar permissions

**Solution:**
- Verify `Calendars.Read` and `Calendars.ReadWrite` permissions added
- Request admin consent
- Re-authenticate user after adding permissions

---

#### 6. Emails Not Syncing

**Cause:** Multiple possible issues

**Solution:**
- Check integration `is_active = true`
- Verify access token not expired
- Check for errors in API logs
- Verify inbox has unread emails
- Test with `POST /api/integrations/outlook/sync`

---

### Debug Mode

Enable detailed logging:

```typescript
// src/lib/integrations/outlook.ts
// Add this at the top
const DEBUG = process.env.OUTLOOK_DEBUG === 'true';

// Add logging throughout
if (DEBUG) {
  console.log('Microsoft Graph API call:', endpoint, params);
}
```

Then set in `.env.local`:
```env
OUTLOOK_DEBUG=true
```

---

### Rate Limits

Microsoft Graph API has rate limits:
- **Per-user limit**: 10,000 requests per 10 minutes
- **Per-app limit**: 100,000 requests per 10 minutes

If you hit rate limits:
1. Implement exponential backoff
2. Cache responses where possible
3. Reduce sync frequency
4. Use delta queries for incremental sync

---

### Support Resources

- **Microsoft Graph Documentation**: https://docs.microsoft.com/en-us/graph/
- **Azure AD Documentation**: https://docs.microsoft.com/en-us/azure/active-directory/
- **Microsoft Graph Explorer**: https://developer.microsoft.com/en-us/graph/graph-explorer
- **OAuth 2.0 Spec**: https://oauth.net/2/

---

## Next Steps

After setting up Outlook integration:

1. **UI Integration**: Add Outlook connect button to dashboard settings
2. **Sync Scheduler**: Implement automated email sync (cron/scheduled tasks)
3. **Error Handling**: Add retry logic and error notifications
4. **Analytics**: Track email open rates, click rates via tracking pixels
5. **Advanced Features**:
   - Shared mailbox support
   - Email threading
   - Attachment handling
   - Email templates
   - Scheduled sending

---

**Last Updated**: 2025-11-15
**Version**: 1.0.0
**Maintained By**: Backend Architecture Team
