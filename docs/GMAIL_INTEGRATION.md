# Gmail Integration

Unite-Hub integrates with Gmail to automatically sync emails and send messages directly through your Gmail account.

## Features

- **Email Sync**: Automatically import unread emails into Unite-Hub
- **Contact Auto-Creation**: Automatically create contacts from email senders
- **Send Emails**: Send emails directly through Gmail API
- **OAuth 2.0 Authentication**: Secure authentication using Google OAuth

## Setup

### 1. Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select an existing one
3. Enable the Gmail API:
   - Navigate to "APIs & Services" > "Library"
   - Search for "Gmail API"
   - Click "Enable"

### 2. Configure OAuth Consent Screen

1. Go to "APIs & Services" > "OAuth consent screen"
2. Choose "External" user type (or "Internal" for Google Workspace)
3. Fill in the required information:
   - App name: `Unite-Hub`
   - User support email: Your email
   - Developer contact: Your email
4. Add scopes:
   - `https://www.googleapis.com/auth/gmail.readonly`
   - `https://www.googleapis.com/auth/gmail.send`
5. Add test users (if using External type)

### 3. Create OAuth 2.0 Credentials

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth client ID"
3. Application type: "Web application"
4. Name: `Unite-Hub Gmail Integration`
5. Authorized redirect URIs:
   - For local development: `http://localhost:3000/api/integrations/gmail/callback`
   - For production: `https://yourdomain.com/api/integrations/gmail/callback`
6. Click "Create"
7. Copy the Client ID and Client Secret

### 4. Configure Environment Variables

Add to your `.env.local`:

```env
# Gmail Integration
GMAIL_CLIENT_ID=your-client-id.apps.googleusercontent.com
GMAIL_CLIENT_SECRET=your-client-secret
GMAIL_REDIRECT_URI=http://localhost:3000/api/integrations/gmail/callback
```

### 5. Restart Development Server

```bash
npm run dev
```

## API Endpoints

### Get Authorization URL

**GET** `/api/integrations/gmail/authorize`

Returns the Google OAuth authorization URL for the user to grant permissions.

**Response:**
```json
{
  "authUrl": "https://accounts.google.com/o/oauth2/v2/auth?..."
}
```

**Usage:**
```typescript
const response = await fetch('/api/integrations/gmail/authorize');
const { authUrl } = await response.json();
window.location.href = authUrl; // Redirect user to Google
```

### OAuth Callback

**GET** `/api/integrations/gmail/callback?code=...`

Handles the OAuth callback from Google and exchanges the authorization code for access tokens.

This endpoint is called automatically by Google after the user grants permissions.

### Sync Emails

**POST** `/api/integrations/gmail/sync`

Syncs unread emails from Gmail into Unite-Hub.

**Request:**
```json
{
  "accessToken": "ya29.a0AfH6SMBx...",
  "workspaceId": "workspace-uuid"
}
```

**Response:**
```json
{
  "success": true,
  "synced": 15,
  "message": "Successfully synced 15 emails"
}
```

### Send Email

**POST** `/api/integrations/gmail/send`

Sends an email through Gmail.

**Request:**
```json
{
  "accessToken": "ya29.a0AfH6SMBx...",
  "to": "recipient@example.com",
  "subject": "Meeting Follow-up",
  "body": "Hi there,\n\nThank you for the meeting...",
  "workspaceId": "workspace-uuid"
}
```

**Response:**
```json
{
  "success": true,
  "messageId": "18c5e8f9a2b3d4e5",
  "message": "Email sent successfully"
}
```

## Implementation Details

### Email Sync Process

1. Authenticates with Gmail API using OAuth token
2. Fetches up to 20 unread emails
3. Extracts email metadata (from, to, subject, body)
4. Creates email records in the database
5. Automatically creates or updates contact records
6. Logs sync operation to audit logs

### Contact Auto-Creation

When syncing emails:
- Extracts sender email address using regex
- Checks if contact already exists in the workspace
- Creates new contact if not exists with:
  - Email address
  - Name (extracted from "From" header)
  - Default AI score of 0.5
  - Status: "contact"

### Security

- Uses OAuth 2.0 for secure authentication
- Access tokens are stored securely (implement token storage in your app)
- All API requests require valid access tokens
- Audit logging for all operations

## Usage Examples

### Complete Authentication Flow

```typescript
// 1. Get authorization URL
async function startGmailAuth() {
  const response = await fetch('/api/integrations/gmail/authorize');
  const { authUrl } = await response.json();

  // Redirect user to Google
  window.location.href = authUrl;
}

// 2. User grants permissions and is redirected back to your app
// The callback route handles token exchange

// 3. Store the access token (from URL params or session)
const urlParams = new URLSearchParams(window.location.search);
const accessToken = urlParams.get('access_token');
localStorage.setItem('gmail_token', accessToken);
```

### Sync Emails

```typescript
async function syncGmailEmails(workspaceId: string) {
  const accessToken = localStorage.getItem('gmail_token');

  const response = await fetch('/api/integrations/gmail/sync', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      accessToken,
      workspaceId,
    }),
  });

  const result = await response.json();
  console.log(`Synced ${result.synced} emails`);
}
```

### Send Email

```typescript
async function sendGmailEmail(
  to: string,
  subject: string,
  body: string,
  workspaceId: string
) {
  const accessToken = localStorage.getItem('gmail_token');

  const response = await fetch('/api/integrations/gmail/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      accessToken,
      to,
      subject,
      body,
      workspaceId,
    }),
  });

  const result = await response.json();
  console.log('Email sent:', result.messageId);
}
```

## Token Management

### Important Security Considerations

1. **Never Store Access Tokens in LocalStorage in Production**
   - Use secure HTTP-only cookies
   - Store in database with encryption
   - Associate with user sessions

2. **Implement Token Refresh**
   - Access tokens expire after 1 hour
   - Use refresh tokens to get new access tokens
   - Store refresh tokens securely

3. **Token Storage Example** (for production):

```typescript
// Store tokens in database associated with user
await db.users.updateGmailTokens(userId, {
  access_token: tokens.access_token,
  refresh_token: tokens.refresh_token,
  expiry_date: tokens.expiry_date,
});
```

## Scheduled Email Sync

For automated email syncing, create a cron job or scheduled task:

```typescript
// Example: pages/api/cron/sync-emails.ts
import { syncGmailEmails } from "@/lib/integrations/gmail";

export default async function handler(req, res) {
  // Verify cron secret
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Get all workspaces with Gmail integration
  const workspaces = await db.workspaces.withGmailEnabled();

  for (const workspace of workspaces) {
    try {
      await syncGmailEmails(workspace.gmail_token, workspace.id);
    } catch (error) {
      console.error(`Failed to sync workspace ${workspace.id}:`, error);
    }
  }

  res.json({ success: true });
}
```

## Error Handling

### Common Errors

**Invalid Grant**
```
Error: invalid_grant
```
- Refresh token has been revoked
- User needs to re-authenticate

**Insufficient Permissions**
```
Error: Insufficient Permission
```
- Missing required OAuth scopes
- Re-authorize with correct scopes

**Rate Limiting**
```
Error: User rate limit exceeded
```
- Gmail API has usage quotas
- Implement exponential backoff
- Consider reducing sync frequency

## Best Practices

1. **Sync Frequency**
   - Don't sync more than once every 5 minutes
   - Respect Gmail API quotas (250 quota units/user/second)

2. **Batch Processing**
   - Process emails in batches of 20-50
   - Implement pagination for large mailboxes

3. **Error Recovery**
   - Implement retry logic with exponential backoff
   - Log all errors for debugging
   - Notify users of persistent failures

4. **Contact Deduplication**
   - The `createIfNotExists` method prevents duplicates
   - Match on email address + workspace ID

5. **Audit Logging**
   - All sync and send operations are logged
   - Use for debugging and compliance

## Limitations

- Maximum 20 emails per sync request (adjustable in code)
- Only processes unread emails
- Gmail API has daily quotas (check Google Cloud Console)
- Access tokens expire after 1 hour
- Requires user to grant OAuth permissions

## Future Enhancements

Planned features:
- Auto-reply functionality
- Email threading and conversation tracking
- Label/folder synchronization
- Advanced search filters
- Attachment handling
- Email templates
- Scheduled sending
- Read receipt tracking
- Integration with contact intelligence system

## Troubleshooting

### "redirect_uri_mismatch" Error

Ensure your redirect URI in Google Cloud Console exactly matches:
- `http://localhost:3000/api/integrations/gmail/callback` (development)
- `https://yourdomain.com/api/integrations/gmail/callback` (production)

### "Access denied" Error

1. Check OAuth consent screen is configured
2. Verify scopes are added correctly
3. Add test users if using "External" type
4. Check user granted all required permissions

### "Token has been expired or revoked"

1. Implement refresh token flow
2. Prompt user to re-authenticate
3. Check token storage is working correctly

### No Emails Syncing

1. Verify access token is valid
2. Check Gmail account has unread emails
3. Verify workspace ID is correct
4. Check audit logs for errors
5. Review API quota limits in Google Cloud Console

## Resources

- [Gmail API Documentation](https://developers.google.com/gmail/api)
- [Google OAuth 2.0 Guide](https://developers.google.com/identity/protocols/oauth2)
- [Gmail API Quotas](https://developers.google.com/gmail/api/reference/quota)
- [Google Cloud Console](https://console.cloud.google.com)
