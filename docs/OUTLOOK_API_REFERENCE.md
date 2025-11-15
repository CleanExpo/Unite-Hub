# Outlook Integration API Reference

Complete API reference for Unite-Hub's Outlook/Microsoft 365 integration endpoints.

---

## Table of Contents

1. [Authentication Flow](#authentication-flow)
2. [Account Management](#account-management)
3. [Email Operations](#email-operations)
4. [Calendar Operations](#calendar-operations)
5. [Error Handling](#error-handling)
6. [Rate Limits](#rate-limits)
7. [Code Examples](#code-examples)

---

## Authentication Flow

### 1. Initiate Connection

**Endpoint:** `POST /api/integrations/outlook/connect`

**Description:** Generates Microsoft OAuth URL for user authorization.

**Request Body:**
```json
{
  "orgId": "uuid-of-organization"
}
```

**Response:**
```json
{
  "authUrl": "https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=..."
}
```

**Example:**
```typescript
const connectOutlook = async (orgId: string) => {
  const response = await fetch('/api/integrations/outlook/connect', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orgId })
  });

  const { authUrl } = await response.json();
  window.location.href = authUrl; // Redirect to Microsoft login
};
```

---

### 2. Handle OAuth Callback

**Endpoint:** `GET /api/integrations/outlook/callback`

**Description:** Processes OAuth callback from Microsoft, exchanges code for tokens, stores integration.

**Query Parameters:**
- `code` (string, required) - Authorization code from Microsoft
- `state` (string, required) - Base64 encoded orgId

**Response:** Redirects to dashboard
```
/dashboard/settings?outlook_connected=true&integration={integration_id}
```

**Error Redirect:**
```
/dashboard/settings?error=outlook_connection_failed
```

**Note:** This endpoint is called automatically by Microsoft OAuth flow. Do not call directly.

---

## Account Management

### 3. List All Accounts

**Endpoint:** `GET /api/integrations/outlook/accounts`

**Description:** Retrieves all Outlook accounts connected to an organization.

**Query Parameters:**
- `orgId` (string, required) - Organization UUID

**Response:**
```json
{
  "success": true,
  "accounts": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "accountEmail": "user@company.com",
      "isActive": true,
      "lastSyncAt": "2025-11-15T10:30:00.000Z",
      "tokenExpiresAt": "2025-11-15T12:00:00.000Z",
      "createdAt": "2025-11-01T08:00:00.000Z"
    }
  ]
}
```

**Example:**
```typescript
const getOutlookAccounts = async (orgId: string) => {
  const response = await fetch(
    `/api/integrations/outlook/accounts?orgId=${orgId}`
  );
  return response.json();
};
```

---

### 4. Sync All Accounts

**Endpoint:** `POST /api/integrations/outlook/accounts`

**Description:** Syncs emails from all active Outlook accounts for an organization.

**Request Body:**
```json
{
  "action": "sync_all",
  "orgId": "uuid-of-organization"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Synced 2/3 Outlook accounts",
  "totalImported": 45,
  "results": [
    {
      "integrationId": "uuid-1",
      "accountEmail": "user1@company.com",
      "success": true,
      "imported": 20,
      "total": 25
    },
    {
      "integrationId": "uuid-2",
      "accountEmail": "user2@company.com",
      "success": true,
      "imported": 25,
      "total": 30
    }
  ]
}
```

---

### 5. Toggle Account Active Status

**Endpoint:** `POST /api/integrations/outlook/accounts`

**Description:** Enable or disable an Outlook account without deleting it.

**Request Body:**
```json
{
  "action": "toggle",
  "orgId": "uuid-of-organization",
  "integrationId": "uuid-of-integration",
  "isActive": false
}
```

**Response:**
```json
{
  "success": true,
  "message": "Outlook account deactivated"
}
```

---

### 6. Set Primary Account

**Endpoint:** `POST /api/integrations/outlook/accounts`

**Description:** Sets an account as the primary sending account. Only one account can be primary.

**Request Body:**
```json
{
  "action": "set_primary",
  "orgId": "uuid-of-organization",
  "integrationId": "uuid-of-integration"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Primary Outlook account updated"
}
```

---

### 7. Label Account

**Endpoint:** `POST /api/integrations/outlook/accounts`

**Description:** Add a custom label to an account for organization purposes.

**Request Body:**
```json
{
  "action": "label",
  "orgId": "uuid-of-organization",
  "integrationId": "uuid-of-integration",
  "label": "Sales Team"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Account label updated"
}
```

---

## Email Operations

### 8. Sync Emails (Single Account)

**Endpoint:** `POST /api/integrations/outlook/sync`

**Description:** Syncs unread emails from a specific Outlook account.

**Request Body:**
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

**Example:**
```typescript
const syncOutlookEmails = async (integrationId: string) => {
  const response = await fetch('/api/integrations/outlook/sync', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ integrationId })
  });
  return response.json();
};
```

**Process:**
1. Fetches up to 20 unread emails from inbox
2. Extracts sender information
3. Creates/updates contact records
4. Creates email records in database
5. Marks emails as read in Outlook
6. Updates last sync timestamp

---

### 9. Send Email

**Endpoint:** `POST /api/integrations/outlook/send`

**Description:** Sends an email through Outlook account.

**Request Body:**
```json
{
  "integrationId": "uuid-of-integration",
  "to": "recipient@example.com",
  "subject": "Meeting Follow-up",
  "body": "<p>Thank you for meeting with us today...</p>",
  "trackingPixelId": "optional-tracking-pixel-id"
}
```

**Response:**
```json
{
  "success": true,
  "messageId": "AAMkAGI1..."
}
```

**Example:**
```typescript
const sendEmail = async (
  integrationId: string,
  to: string,
  subject: string,
  body: string
) => {
  const response = await fetch('/api/integrations/outlook/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      integrationId,
      to,
      subject,
      body
    })
  });
  return response.json();
};
```

**Notes:**
- Body must be HTML format
- Tracking pixel is automatically appended if `trackingPixelId` provided
- Email is saved to Sent Items folder

---

### 10. Disconnect Account

**Endpoint:** `POST /api/integrations/outlook/disconnect`

**Description:** Disconnects an Outlook account (sets `is_active = false`). Does not delete historical data.

**Request Body:**
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

## Calendar Operations

### 11. Get Calendar Events

**Endpoint:** `GET /api/integrations/outlook/calendar/events`

**Description:** Retrieves calendar events from Outlook within a date range.

**Query Parameters:**
- `integrationId` (string, required) - Integration UUID
- `startDate` (ISO 8601, optional) - Start date (default: now)
- `endDate` (ISO 8601, optional) - End date (default: 7 days from start)

**Response:**
```json
{
  "success": true,
  "events": [
    {
      "id": "AAMkAGI1...",
      "subject": "Product Demo",
      "start": {
        "dateTime": "2025-11-20T14:00:00.000Z",
        "timeZone": "UTC"
      },
      "end": {
        "dateTime": "2025-11-20T15:00:00.000Z",
        "timeZone": "UTC"
      },
      "location": {
        "displayName": "Conference Room A"
      },
      "attendees": [
        {
          "emailAddress": {
            "address": "client@example.com",
            "name": "John Doe"
          },
          "type": "required"
        }
      ],
      "organizer": {
        "emailAddress": {
          "address": "user@company.com",
          "name": "Jane Smith"
        }
      }
    }
  ]
}
```

**Example:**
```typescript
const getCalendarEvents = async (
  integrationId: string,
  startDate?: Date,
  endDate?: Date
) => {
  const params = new URLSearchParams({ integrationId });
  if (startDate) params.append('startDate', startDate.toISOString());
  if (endDate) params.append('endDate', endDate.toISOString());

  const response = await fetch(
    `/api/integrations/outlook/calendar/events?${params}`
  );
  return response.json();
};
```

---

### 12. Create Calendar Event

**Endpoint:** `POST /api/integrations/outlook/calendar/create`

**Description:** Creates a new calendar event in Outlook.

**Request Body:**
```json
{
  "integrationId": "uuid-of-integration",
  "subject": "Client Meeting",
  "start": "2025-11-20T10:00:00Z",
  "end": "2025-11-20T11:00:00Z",
  "location": "Zoom",
  "body": "<p>Discuss Q4 goals and upcoming projects</p>",
  "attendees": [
    "client@example.com",
    "teammate@company.com"
  ]
}
```

**Response:**
```json
{
  "success": true,
  "eventId": "AAMkAGI1...",
  "webLink": "https://outlook.office365.com/calendar/..."
}
```

**Example:**
```typescript
const createCalendarEvent = async (
  integrationId: string,
  eventData: {
    subject: string;
    start: Date;
    end: Date;
    location?: string;
    body?: string;
    attendees?: string[];
  }
) => {
  const response = await fetch('/api/integrations/outlook/calendar/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      integrationId,
      ...eventData,
      start: eventData.start.toISOString(),
      end: eventData.end.toISOString()
    })
  });
  return response.json();
};
```

**Notes:**
- All times should be in UTC
- Body supports HTML format
- Attendees are automatically sent meeting invitations
- Event is created in user's default calendar

---

## Error Handling

### Error Response Format

All endpoints return errors in this format:

```json
{
  "error": "Error message describing what went wrong"
}
```

### HTTP Status Codes

| Status | Meaning | Common Causes |
|--------|---------|---------------|
| `200` | Success | Request completed successfully |
| `400` | Bad Request | Missing required fields, invalid data |
| `401` | Unauthorized | Not authenticated, session expired |
| `404` | Not Found | Integration not found, resource doesn't exist |
| `500` | Server Error | Internal error, API call failed |

### Common Errors

#### 1. Unauthorized (401)
```json
{
  "error": "Unauthorized"
}
```
**Solution:** User needs to log in or refresh session.

---

#### 2. Integration Not Found (404)
```json
{
  "error": "Integration not found"
}
```
**Solution:** Verify integration ID exists and belongs to user's organization.

---

#### 3. Token Expired (500)
```json
{
  "error": "Failed to sync emails"
}
```
**Common in console:**
```
Token refresh failed: invalid_grant
```
**Solution:**
- Token refresh will be attempted automatically
- If refresh fails, user needs to reconnect account
- Check `token_expires_at` field in database

---

#### 4. Missing Permissions (500)
```json
{
  "error": "Failed to get calendar events"
}
```
**Common in console:**
```
Forbidden: Insufficient privileges to complete the operation
```
**Solution:**
- Verify all required permissions granted in Azure AD
- Request admin consent if in enterprise environment
- User may need to re-authorize with new permissions

---

#### 5. Rate Limited (429)

Microsoft Graph returns rate limit errors. The API should handle these with exponential backoff.

**Solution:**
- Wait and retry with exponential backoff
- Reduce request frequency
- Consider caching frequently accessed data

---

## Rate Limits

### Microsoft Graph API Limits

- **Per-user limit**: 10,000 requests per 10 minutes
- **Per-app limit**: 100,000 requests per 10 minutes

### Best Practices

1. **Cache responses** where appropriate
2. **Use delta queries** for incremental sync
3. **Implement exponential backoff** for retries
4. **Monitor rate limit headers**:
   - `RateLimit-Limit`
   - `RateLimit-Remaining`
   - `RateLimit-Reset`

---

## Code Examples

### React Component: Connect Outlook Button

```typescript
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

export function ConnectOutlookButton({ orgId }: { orgId: string }) {
  const [loading, setLoading] = useState(false);

  const handleConnect = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/integrations/outlook/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orgId })
      });

      const { authUrl } = await response.json();
      window.location.href = authUrl;
    } catch (error) {
      console.error('Failed to connect Outlook:', error);
      setLoading(false);
    }
  };

  return (
    <Button onClick={handleConnect} disabled={loading}>
      {loading ? 'Connecting...' : 'Connect Outlook'}
    </Button>
  );
}
```

---

### Server Action: Sync Emails from All Accounts

```typescript
'use server';

export async function syncAllOutlookAccounts(orgId: string) {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_URL}/api/integrations/outlook/accounts`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'sync_all',
        orgId
      })
    }
  );

  return response.json();
}
```

---

### Scheduled Sync Job

```typescript
// Example using a cron job or scheduled task
import { db } from '@/lib/db';
import { syncAllOutlookAccounts } from '@/lib/services/outlook-sync';

export async function scheduledOutlookSync() {
  // Get all organizations
  const { data: orgs } = await db.organizations.listAll();

  for (const org of orgs) {
    try {
      console.log(`Syncing Outlook for org: ${org.id}`);
      const result = await syncAllOutlookAccounts(org.id);
      console.log(`Synced ${result.totalImported} emails`);
    } catch (error) {
      console.error(`Failed to sync org ${org.id}:`, error);
    }
  }
}
```

---

### Calendar Event Creation Form

```typescript
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';

interface CalendarEventForm {
  subject: string;
  start: string;
  end: string;
  location?: string;
  body?: string;
  attendees?: string;
}

export function CreateCalendarEventForm({ integrationId }: { integrationId: string }) {
  const { register, handleSubmit } = useForm<CalendarEventForm>();
  const [loading, setLoading] = useState(false);

  const onSubmit = async (data: CalendarEventForm) => {
    setLoading(true);
    try {
      const response = await fetch('/api/integrations/outlook/calendar/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          integrationId,
          subject: data.subject,
          start: data.start,
          end: data.end,
          location: data.location,
          body: data.body,
          attendees: data.attendees?.split(',').map(e => e.trim())
        })
      });

      const result = await response.json();
      console.log('Event created:', result.eventId);
      alert('Calendar event created successfully!');
    } catch (error) {
      console.error('Failed to create event:', error);
      alert('Failed to create calendar event');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('subject')} placeholder="Event subject" required />
      <input {...register('start')} type="datetime-local" required />
      <input {...register('end')} type="datetime-local" required />
      <input {...register('location')} placeholder="Location (optional)" />
      <textarea {...register('body')} placeholder="Description (optional)" />
      <input {...register('attendees')} placeholder="Attendees (comma-separated)" />
      <button type="submit" disabled={loading}>
        {loading ? 'Creating...' : 'Create Event'}
      </button>
    </form>
  );
}
```

---

## Additional Resources

- **Microsoft Graph API Documentation**: https://docs.microsoft.com/en-us/graph/
- **Calendar API Reference**: https://docs.microsoft.com/en-us/graph/api/resources/calendar
- **Mail API Reference**: https://docs.microsoft.com/en-us/graph/api/resources/message
- **OAuth 2.0 Flow**: https://docs.microsoft.com/en-us/azure/active-directory/develop/v2-oauth2-auth-code-flow

---

**Last Updated**: 2025-11-15
**Version**: 1.0.0
**Maintained By**: Backend Architecture Team
