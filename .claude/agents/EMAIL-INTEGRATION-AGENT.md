# EMAIL INTEGRATION AGENT SPECIFICATION

**Agent Name**: Email Integration Agent
**Agent Type**: Tier 1 - Input Processing Agent
**Priority**: P1 - Critical (Build First)
**Status**: Active Development
**Version**: 1.0.0
**Last Updated**: 2025-11-18

---

## 1. AGENT OVERVIEW

### Primary Database Tables
- `email_integrations` - OAuth connections to Gmail/Outlook accounts
- `client_emails` - Stored email messages (inbound/outbound)
- `contacts` - Link emails to CRM contacts

### Agent Purpose
The Email Integration Agent is the **primary data ingestion layer** for the Client Intelligence System. It connects to Gmail and Outlook via OAuth, fetches historical and real-time emails for specific contacts, parses email threads, and stores structured email data for AI analysis. This agent enables Unite-Hub to process months of email history (like Duncan's 4 months of communications) and automatically sync new messages as they arrive.

### Agent Responsibilities
1. **OAuth Connection Management**: Connect to Gmail/Outlook accounts, handle token refresh, maintain connection health
2. **Email Fetching**: Retrieve all emails for a specific contact (by email address or domain)
3. **Thread Parsing**: Reconstruct email conversation threads with proper ordering
4. **Email Storage**: Store emails in `client_emails` table with full metadata and content
5. **Real-time Monitoring**: Watch for new emails using push notifications (Gmail) or polling (Outlook)
6. **Attachment Handling**: Download and store email attachments with virus scanning
7. **Contact Linking**: Automatically link emails to existing CRM contacts or create new ones

---

## 2. PURPOSE & SCOPE

### Core Responsibilities

#### IN SCOPE ✅
- Gmail OAuth 2.0 integration (Google APIs)
- Outlook OAuth 2.0 integration (Microsoft Graph API)
- Fetch all historical emails for a contact (unlimited date range)
- Fetch emails by thread ID (conversation reconstruction)
- Real-time email monitoring (push notifications + polling)
- Email attachment download and storage
- Automatic contact creation/linking based on email address
- Email deduplication (prevent storing same email twice)
- Token refresh automation (handle expired OAuth tokens)
- Multi-account support (multiple Gmail/Outlook accounts per workspace)

#### OUT OF SCOPE ❌
- Email sending (handled by Email Agent)
- Email AI analysis (handled by AI Intelligence Extraction Agent)
- Email tracking pixels (opens/clicks) for sent emails (handled by Email Agent)
- Email templates and campaigns (handled by Campaign Agent)
- Spam filtering (rely on Gmail/Outlook's built-in spam detection)
- Email encryption/decryption (rely on provider's encryption)

### Integration Touchpoints
- **AI Intelligence Extraction Agent**: Provides raw email content for analysis
- **Contact Agent**: Creates/updates contacts based on email senders
- **Workflow Agent**: Triggers workflows on new email arrival
- **Analytics Agent**: Provides email metrics (total emails, response time, sentiment trends)

---

## 3. DATABASE SCHEMA MAPPING

### email_integrations Table
```typescript
interface EmailIntegration {
  id: string; // UUID
  workspace_id: string; // UUID - References workspaces.id
  org_id: string; // UUID - References organizations.id

  // Provider info
  provider: 'gmail' | 'outlook' | 'smtp'; // Email provider
  email_address: string; // Actual email (e.g., john@company.com)
  account_label?: string | null; // User-defined label (e.g., "Personal", "Work")

  // Account settings
  is_primary: boolean; // Primary account for sending
  sync_enabled: boolean; // Enable/disable sync for this account
  is_active: boolean; // Soft delete flag

  // OAuth tokens
  access_token: string; // Current access token
  refresh_token?: string | null; // Refresh token
  token_expires_at?: Date | null; // Token expiration timestamp

  // Sync metadata
  last_sync_at?: Date | null; // Last successful sync
  last_history_id?: string | null; // For incremental sync (Gmail historyId)
  sync_error?: string | null; // Last sync error message

  // Timestamps
  created_at: Date; // TIMESTAMPTZ
  updated_at: Date; // TIMESTAMPTZ
}

// Indexes:
// - idx_email_integrations_workspace_id ON email_integrations(workspace_id)
// - idx_email_integrations_org_id ON email_integrations(org_id)
// - idx_email_integrations_provider ON email_integrations(provider)
// - idx_email_integrations_email_address ON email_integrations(email_address)
// - UNIQUE(workspace_id, provider, email_address)
```

### client_emails Table
```typescript
interface ClientEmail {
  id: string; // UUID
  workspace_id: string; // UUID - References workspaces.id
  org_id: string; // UUID - References organizations.id

  // Email Source
  integration_id?: string | null; // UUID - References email_integrations.id
  provider_message_id: string; // Gmail Message-ID or Outlook message ID
  provider_thread_id?: string | null; // Gmail Thread-ID or Outlook conversation ID

  // Email Details
  from_email: string; // Sender email
  from_name?: string | null; // Sender name
  to_emails: string[]; // Array of recipient emails
  cc_emails: string[]; // Array of CC emails
  bcc_emails: string[]; // Array of BCC emails
  subject?: string | null; // Email subject
  body_html?: string | null; // HTML body
  body_text?: string | null; // Plain text body
  snippet?: string | null; // First 200 characters

  // Associations
  contact_id?: string | null; // UUID - References contacts.id

  // Email Metadata
  direction: 'inbound' | 'outbound'; // Email direction
  is_read: boolean; // Read status
  is_starred: boolean; // Starred status
  labels: string[]; // Gmail labels or Outlook categories

  // AI Processing
  is_analyzed: boolean; // Whether AI analysis is complete
  analysis_id?: string | null; // UUID - References email_intelligence.id

  // Timestamps
  received_at: Date; // TIMESTAMPTZ - When email was received
  sent_at?: Date | null; // TIMESTAMPTZ - When email was sent (outbound only)
  created_at: Date; // TIMESTAMPTZ
  updated_at: Date; // TIMESTAMPTZ
}

// Indexes:
// - idx_client_emails_workspace_id ON client_emails(workspace_id)
// - idx_client_emails_org_id ON client_emails(org_id)
// - idx_client_emails_contact_id ON client_emails(contact_id)
// - idx_client_emails_integration_id ON client_emails(integration_id)
// - idx_client_emails_direction ON client_emails(direction)
// - idx_client_emails_received_at ON client_emails(received_at DESC)
// - idx_client_emails_from_email ON client_emails(from_email)
// - idx_client_emails_provider_thread_id ON client_emails(provider_thread_id)
```

### contacts Table (Read-Only for this Agent)
```typescript
interface Contact {
  id: string; // UUID
  workspace_id: string; // UUID
  name: string; // Contact name
  email: string; // Primary email
  company?: string | null; // Company name
  phone?: string | null; // Phone number
  // ... other contact fields
}
```

---

## 4. CORE FUNCTIONS

### 4.1 connectEmailProvider()
**Purpose**: Connect a Gmail or Outlook account via OAuth 2.0.

**Input**:
```typescript
interface ConnectEmailProviderRequest {
  provider: 'gmail' | 'outlook'; // Email provider
  workspace_id: string; // UUID
  org_id: string; // UUID
  oauth_code: string; // OAuth authorization code from callback
  account_label?: string; // Optional user-defined label
  is_primary?: boolean; // Set as primary account (default: false)
}
```

**Output**:
```typescript
interface ConnectEmailProviderResult {
  success: boolean;
  integration_id: string; // UUID
  email_address: string; // Authenticated email address
  error?: string; // Error message if failed
}
```

**Business Logic**:
1. **Exchange OAuth code for tokens**:
   - Gmail: Call Google OAuth2 token endpoint
   - Outlook: Call Microsoft Graph OAuth2 token endpoint
2. **Fetch user's email address**:
   - Gmail: Call `gmail.users.getProfile(userId='me')`
   - Outlook: Call `GET /me` on Microsoft Graph
3. **Check for duplicates**: Check if integration exists for this email_address + workspace_id
   - If exists and is_active=false, reactivate and update tokens
   - If exists and is_active=true, return error "Account already connected"
4. **Insert into email_integrations**:
   - Store access_token, refresh_token, token_expires_at
   - Set sync_enabled=true, is_active=true
5. **If is_primary=true**: Unset is_primary on other integrations in same workspace
6. **Return integration_id and email_address**

**API Integrations**:
- **Gmail**: `googleapis` npm package
  - `google.auth.OAuth2` for token exchange
  - `gmail.users.getProfile()` for email address
- **Outlook**: Microsoft Graph API (`@microsoft/microsoft-graph-client`)
  - `POST https://login.microsoftonline.com/common/oauth2/v2.0/token`
  - `GET https://graph.microsoft.com/v1.0/me`

**Performance Requirements**:
- OAuth token exchange: < 2 seconds
- Database insert: < 100ms

**Error Codes**:
- `EMAIL_INT_001`: Invalid OAuth code
- `EMAIL_INT_002`: Account already connected
- `EMAIL_INT_003`: Failed to fetch user profile
- `EMAIL_INT_004`: Database insert failed

---

### 4.2 fetchAllEmails()
**Purpose**: Fetch all historical emails for a specific contact (or email address).

**Input**:
```typescript
interface FetchAllEmailsRequest {
  workspace_id: string; // UUID
  integration_id: string; // UUID - Which email account to use
  contact_email: string; // Email address to fetch emails from
  date_from?: Date; // Optional start date (default: fetch all)
  date_to?: Date; // Optional end date (default: now)
  max_results?: number; // Max emails to fetch (default: unlimited)
  include_attachments?: boolean; // Download attachments (default: false)
}
```

**Output**:
```typescript
interface FetchAllEmailsResult {
  success: boolean;
  total_emails_fetched: number; // Total emails fetched
  new_emails_stored: number; // New emails stored (excluding duplicates)
  duplicate_emails_skipped: number; // Duplicates skipped
  errors: {
    message_id: string;
    error: string;
  }[]; // Errors fetching specific emails
  processing_time_ms: number; // Total processing time
}
```

**Business Logic**:
1. **Fetch integration**: Get email_integrations record by integration_id
2. **Verify workspace**: Ensure integration belongs to workspace_id
3. **Build Gmail/Outlook query**:
   - Gmail: `from:${contact_email} OR to:${contact_email}` + date filters
   - Outlook: `from/emailAddress/address eq '${contact_email}' or toRecipients/any(r:r/emailAddress/address eq '${contact_email}')`
4. **Paginate through results**:
   - Gmail: Use `pageToken` for pagination (500 emails per page)
   - Outlook: Use `@odata.nextLink` for pagination (100 emails per page)
5. **For each email**:
   - Check if provider_message_id exists in client_emails (deduplication)
   - If exists, skip
   - If new, parse email and store in client_emails
6. **Link to contact**:
   - Look up contact by email address in contacts table
   - If found, set contact_id
   - If not found, create new contact (contact_id will be set by Contact Agent later)
7. **Handle rate limiting**:
   - Gmail: 250 quota units per second (pause if approaching limit)
   - Outlook: 10,000 requests per 10 minutes (pause if approaching limit)
8. **Return results**: Total fetched, new stored, duplicates skipped

**Performance Requirements**:
- Fetch rate: 50-100 emails per second (with rate limiting)
- Storage: < 50ms per email (batch inserts for speed)
- Max processing time: 30 minutes for 10,000 emails

**Error Codes**:
- `EMAIL_INT_005`: Integration not found
- `EMAIL_INT_006`: Integration expired (token needs refresh)
- `EMAIL_INT_007`: Gmail/Outlook API error
- `EMAIL_INT_008`: Rate limit exceeded

---

### 4.3 fetchEmailThread()
**Purpose**: Fetch all emails in a conversation thread.

**Input**:
```typescript
interface FetchEmailThreadRequest {
  workspace_id: string; // UUID
  integration_id: string; // UUID
  thread_id: string; // Gmail thread ID or Outlook conversation ID
}
```

**Output**:
```typescript
interface FetchEmailThreadResult {
  success: boolean;
  thread_id: string; // Thread ID
  emails: ClientEmail[]; // All emails in thread (ordered by received_at)
  total_emails: number; // Total emails in thread
  error?: string; // Error message if failed
}
```

**Business Logic**:
1. **Fetch integration**: Get email_integrations record
2. **Fetch thread from provider**:
   - Gmail: Call `gmail.users.threads.get(id=thread_id, format='full')`
   - Outlook: Call `GET /me/messages?$filter=conversationId eq '${thread_id}'`
3. **Parse all messages in thread**:
   - Extract sender, recipients, subject, body, timestamps
   - Determine direction (inbound if from contact, outbound if from user)
4. **Store emails**: Insert into client_emails with provider_thread_id set
5. **Order by received_at**: Return emails sorted chronologically
6. **Return thread data**: Return emails array with thread metadata

**Performance Requirements**:
- Fetch thread: < 2 seconds (typical thread has 5-10 emails)
- Storage: < 200ms for full thread

**Error Codes**:
- `EMAIL_INT_009`: Thread not found
- `EMAIL_INT_010`: Failed to fetch thread
- `EMAIL_INT_011`: Failed to parse thread

---

### 4.4 syncNewEmails()
**Purpose**: Fetch new emails since last sync (incremental sync).

**Input**:
```typescript
interface SyncNewEmailsRequest {
  workspace_id: string; // UUID
  integration_id: string; // UUID
  contact_email?: string; // Optional: sync specific contact only
}
```

**Output**:
```typescript
interface SyncNewEmailsResult {
  success: boolean;
  new_emails: number; // Number of new emails fetched
  last_sync_at: Date; // Updated last_sync_at timestamp
  next_history_id?: string; // Gmail historyId for next sync
  error?: string; // Error message if failed
}
```

**Business Logic**:
1. **Fetch integration**: Get email_integrations record
2. **Get last_history_id**: Use for incremental sync (Gmail only)
3. **Fetch new messages**:
   - Gmail: Call `gmail.users.history.list(startHistoryId=last_history_id)`
   - Outlook: Call `GET /me/messages?$filter=receivedDateTime gt ${last_sync_at}`
4. **Filter by contact_email** (if provided): Only fetch emails from/to this contact
5. **Store new emails**: Insert into client_emails
6. **Update integration**: Set last_sync_at=NOW(), last_history_id=new_history_id
7. **Return sync result**: Return new emails count

**Performance Requirements**:
- Sync time: < 5 seconds (typical sync fetches 0-20 new emails)
- Sync frequency: Every 5 minutes (real-time is handled by watchForNewEmails)

**Error Codes**:
- `EMAIL_INT_012`: Sync failed (API error)
- `EMAIL_INT_013`: History ID expired (need full sync)

---

### 4.5 watchForNewEmails()
**Purpose**: Set up real-time monitoring for new emails using push notifications (Gmail) or polling (Outlook).

**Input**:
```typescript
interface WatchForNewEmailsRequest {
  workspace_id: string; // UUID
  integration_id: string; // UUID
  webhook_url: string; // URL to receive push notifications
}
```

**Output**:
```typescript
interface WatchForNewEmailsResult {
  success: boolean;
  watch_id?: string; // Gmail watch ID or Outlook subscription ID
  expires_at: Date; // When watch expires (need to renew)
  error?: string; // Error message if failed
}
```

**Business Logic**:
1. **Gmail Push Notifications**:
   - Call `gmail.users.watch(userId='me', topicName='projects/unite-hub/topics/gmail-notifications')`
   - Store watch_id in email_integrations.metadata JSON
   - Set expiration (Gmail: 7 days, need to renew weekly)
2. **Outlook Webhooks**:
   - Call `POST /subscriptions` on Microsoft Graph
   - Subscribe to mailFolders/inbox/messages resource
   - Store subscription_id in email_integrations.metadata JSON
   - Set expiration (Outlook: 3 days, need to renew every 3 days)
3. **Handle webhook callbacks**:
   - When webhook fires, call syncNewEmails()
   - Log webhook event in audit_logs
4. **Renew watch before expiration**:
   - Set up cron job to renew 1 day before expiration
5. **Return watch details**: Return watch_id and expires_at

**Webhook Payload Handling**:
```typescript
async function handleEmailWebhook(payload: WebhookPayload): Promise<void> {
  // Gmail: Pub/Sub message with historyId
  if (payload.provider === 'gmail') {
    const { emailAddress, historyId } = payload;
    const integration = await getIntegrationByEmail(emailAddress);
    await syncNewEmails({ integration_id: integration.id });
  }

  // Outlook: Graph webhook with resource data
  if (payload.provider === 'outlook') {
    const { subscriptionId, resource } = payload;
    const integration = await getIntegrationBySubscriptionId(subscriptionId);
    await syncNewEmails({ integration_id: integration.id });
  }
}
```

**Performance Requirements**:
- Watch setup: < 1 second
- Webhook response time: < 500ms
- Notification latency: < 30 seconds (Gmail typically delivers within 10 seconds)

**Error Codes**:
- `EMAIL_INT_014`: Failed to set up watch
- `EMAIL_INT_015`: Webhook verification failed
- `EMAIL_INT_016`: Watch expired (needs renewal)

---

### 4.6 downloadAttachment()
**Purpose**: Download email attachment and store in file storage.

**Input**:
```typescript
interface DownloadAttachmentRequest {
  workspace_id: string; // UUID
  integration_id: string; // UUID
  message_id: string; // Gmail message ID or Outlook message ID
  attachment_id: string; // Attachment ID
}
```

**Output**:
```typescript
interface DownloadAttachmentResult {
  success: boolean;
  file_url: string; // S3/Supabase Storage URL
  file_name: string; // Original file name
  file_size: number; // File size in bytes
  mime_type: string; // MIME type
  virus_scan_status: 'clean' | 'infected' | 'pending'; // Virus scan result
  error?: string; // Error message if failed
}
```

**Business Logic**:
1. **Fetch attachment from provider**:
   - Gmail: Call `gmail.users.messages.attachments.get(id=attachment_id)`
   - Outlook: Call `GET /me/messages/${message_id}/attachments/${attachment_id}`
2. **Decode attachment**: Base64 decode attachment data
3. **Virus scan**: Scan with ClamAV or VirusTotal API
   - If infected, delete and return error
   - If clean, proceed to storage
4. **Upload to storage**:
   - Supabase Storage: Upload to `attachments/${workspace_id}/${message_id}/${file_name}`
   - Or AWS S3: Upload to `unite-hub-attachments/${workspace_id}/${message_id}/${file_name}`
5. **Return file URL**: Return public URL to attachment

**Performance Requirements**:
- Download time: < 5 seconds for 10MB file
- Virus scan: < 2 seconds
- Upload time: < 3 seconds for 10MB file

**Error Codes**:
- `EMAIL_INT_017`: Attachment not found
- `EMAIL_INT_018`: Virus detected in attachment
- `EMAIL_INT_019`: Storage upload failed
- `EMAIL_INT_020`: File size exceeds limit (max 25MB)

---

### 4.7 linkEmailToContact()
**Purpose**: Link an email to an existing contact or create a new contact.

**Input**:
```typescript
interface LinkEmailToContactRequest {
  email_id: string; // UUID - client_emails.id
  workspace_id: string; // UUID
  force_create_contact?: boolean; // Force create new contact if not found
}
```

**Output**:
```typescript
interface LinkEmailToContactResult {
  success: boolean;
  contact_id: string; // UUID
  contact_created: boolean; // True if new contact was created
  error?: string; // Error message if failed
}
```

**Business Logic**:
1. **Fetch email**: Get client_emails record by email_id
2. **Extract sender email**: Use from_email field
3. **Search for existing contact**: Query contacts table by email address
   - If found, set contact_id in client_emails
   - If not found and force_create_contact=true, create new contact
4. **Create contact** (if needed):
   - Extract name from from_name field
   - Set email, name, workspace_id
   - Insert into contacts table
5. **Update email**: Set contact_id in client_emails
6. **Return result**: Return contact_id and contact_created flag

**Performance Requirements**:
- Contact lookup: < 50ms (indexed query)
- Contact creation: < 100ms
- Email update: < 50ms

**Error Codes**:
- `EMAIL_INT_021`: Email not found
- `EMAIL_INT_022`: Contact creation failed
- `EMAIL_INT_023`: Multiple contacts found for email (ambiguous)

---

### 4.8 refreshAccessToken()
**Purpose**: Refresh expired OAuth access token using refresh token.

**Input**:
```typescript
interface RefreshAccessTokenRequest {
  integration_id: string; // UUID
}
```

**Output**:
```typescript
interface RefreshAccessTokenResult {
  success: boolean;
  new_access_token: string; // New access token
  expires_at: Date; // New expiration timestamp
  error?: string; // Error message if failed
}
```

**Business Logic**:
1. **Fetch integration**: Get email_integrations record
2. **Check if refresh token exists**: If not, return error "Re-authentication required"
3. **Call OAuth token refresh endpoint**:
   - Gmail: `POST https://oauth2.googleapis.com/token` with refresh_token
   - Outlook: `POST https://login.microsoftonline.com/common/oauth2/v2.0/token` with refresh_token
4. **Update integration**: Set new access_token and token_expires_at
5. **Return new token**: Return new access_token and expires_at

**Automatic Token Refresh**:
```typescript
// Check token expiration before every API call
async function ensureValidToken(integration_id: string): Promise<void> {
  const integration = await getIntegration(integration_id);

  if (!integration.token_expires_at || new Date() >= integration.token_expires_at) {
    // Token expired or expiring soon, refresh
    await refreshAccessToken({ integration_id });
  }
}
```

**Performance Requirements**:
- Token refresh: < 1 second
- Should be transparent to user (automatic)

**Error Codes**:
- `EMAIL_INT_024`: Refresh token expired (re-authentication required)
- `EMAIL_INT_025`: Token refresh failed (OAuth error)

---

## 5. API ENDPOINTS

### POST /api/integrations/email/connect
**Description**: Connect a Gmail or Outlook account via OAuth.

**Request**:
```json
{
  "provider": "gmail",
  "workspace_id": "550e8400-e29b-41d4-a716-446655440000",
  "org_id": "660e8400-e29b-41d4-a716-446655440000",
  "oauth_code": "4/0AY0e-g7...",
  "account_label": "Work Gmail",
  "is_primary": true
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "integration_id": "770e8400-e29b-41d4-a716-446655440000",
  "email_address": "john@unite-group.in"
}
```

**Error Response** (400 Bad Request):
```json
{
  "success": false,
  "error": "EMAIL_INT_002",
  "message": "Account already connected: john@unite-group.in"
}
```

---

### POST /api/integrations/email/fetch-all
**Description**: Fetch all historical emails for a contact.

**Request**:
```json
{
  "workspace_id": "550e8400-e29b-41d4-a716-446655440000",
  "integration_id": "770e8400-e29b-41d4-a716-446655440000",
  "contact_email": "duncan@techcorp.com.au",
  "date_from": "2024-07-01T00:00:00Z",
  "max_results": 1000,
  "include_attachments": false
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "total_emails_fetched": 847,
  "new_emails_stored": 823,
  "duplicate_emails_skipped": 24,
  "errors": [],
  "processing_time_ms": 42350
}
```

---

### POST /api/integrations/email/sync
**Description**: Sync new emails since last sync (incremental).

**Request**:
```json
{
  "workspace_id": "550e8400-e29b-41d4-a716-446655440000",
  "integration_id": "770e8400-e29b-41d4-a716-446655440000",
  "contact_email": "duncan@techcorp.com.au"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "new_emails": 12,
  "last_sync_at": "2025-11-18T14:35:00.000Z",
  "next_history_id": "47382914"
}
```

---

### POST /api/integrations/email/watch
**Description**: Set up real-time email monitoring (push notifications).

**Request**:
```json
{
  "workspace_id": "550e8400-e29b-41d4-a716-446655440000",
  "integration_id": "770e8400-e29b-41d4-a716-446655440000",
  "webhook_url": "https://unite-hub.com/api/webhooks/email"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "watch_id": "watch_1234567890",
  "expires_at": "2025-11-25T14:35:00.000Z"
}
```

---

### POST /api/integrations/email/webhook
**Description**: Receive Gmail/Outlook push notifications.

**Gmail Webhook Payload**:
```json
{
  "message": {
    "data": "eyJlbWFpbEFkZHJlc3MiOiAiam9obkB1bml0ZS1ncm91cC5pbiIsICJoaXN0b3J5SWQiOiAiNDczODI5MTQifQ==",
    "messageId": "1234567890",
    "publishTime": "2025-11-18T14:35:00.000Z"
  },
  "subscription": "projects/unite-hub/subscriptions/gmail-notifications"
}
```

**Outlook Webhook Payload**:
```json
{
  "value": [
    {
      "subscriptionId": "sub_abc123",
      "clientState": "secretClientValue",
      "changeType": "created",
      "resource": "users/john@unite-group.in/messages/AAMkAGI...",
      "resourceData": {
        "@odata.type": "#Microsoft.Graph.Message",
        "@odata.id": "users/john@unite-group.in/messages/AAMkAGI...",
        "id": "AAMkAGI..."
      }
    }
  ]
}
```

**Response** (200 OK):
```json
{
  "success": true
}
```

---

### GET /api/integrations/email/:integration_id/thread/:thread_id
**Description**: Fetch all emails in a conversation thread.

**Response** (200 OK):
```json
{
  "success": true,
  "thread_id": "17abc123def456",
  "emails": [
    {
      "id": "880e8400-e29b-41d4-a716-446655440000",
      "from_email": "duncan@techcorp.com.au",
      "from_name": "Duncan Smith",
      "to_emails": ["john@unite-group.in"],
      "subject": "Re: Q4 Marketing Strategy",
      "body_text": "Thanks for sending that over. I've reviewed the proposal...",
      "received_at": "2025-11-18T10:15:00.000Z",
      "direction": "inbound"
    },
    {
      "id": "990e8400-e29b-41d4-a716-446655440000",
      "from_email": "john@unite-group.in",
      "from_name": "John Doe",
      "to_emails": ["duncan@techcorp.com.au"],
      "subject": "Re: Q4 Marketing Strategy",
      "body_text": "Great! Let's schedule a call to discuss next steps...",
      "received_at": "2025-11-18T14:20:00.000Z",
      "direction": "outbound"
    }
  ],
  "total_emails": 2
}
```

---

### GET /api/integrations/email/:integration_id/contacts
**Description**: Get all contacts that have exchanged emails.

**Response** (200 OK):
```json
{
  "success": true,
  "contacts": [
    {
      "contact_id": "aa0e8400-e29b-41d4-a716-446655440000",
      "name": "Duncan Smith",
      "email": "duncan@techcorp.com.au",
      "total_emails": 847,
      "last_email_at": "2025-11-18T14:20:00.000Z",
      "direction": "both"
    }
  ],
  "total_contacts": 1
}
```

---

## 6. INTEGRATION POINTS

### Inputs (What This Agent Receives)

1. **From User** (via Dashboard):
   - OAuth authorization codes (after user clicks "Connect Gmail/Outlook")
   - Contact selection for email fetching
   - Date range filters for historical fetch

2. **From Workflow Agent**:
   - Trigger sync for specific contact when workflow executes
   - Trigger watch setup for real-time monitoring

3. **From External Providers**:
   - Gmail push notifications (via Pub/Sub webhook)
   - Outlook webhooks (via Microsoft Graph subscriptions)

### Outputs (What This Agent Provides)

1. **To AI Intelligence Extraction Agent**:
   - Raw email content (body_text, body_html)
   - Email metadata (sender, recipients, subject, timestamp)
   - Trigger analysis on new email arrival

2. **To Contact Agent**:
   - New contact creation requests (if email sender not in CRM)
   - Contact update requests (last_contacted_at, email_count)

3. **To Workflow Agent**:
   - New email event triggers (email.received, email.sent)
   - Email thread completion events

4. **To Analytics Agent**:
   - Email metrics (total emails, response time, email volume trends)
   - Contact engagement metrics (emails per contact, last contact date)

---

## 7. BUSINESS RULES

### OAuth Connection Rules

1. **One Integration Per Email Per Workspace**:
   - Cannot connect same email address twice to same workspace
   - Can connect to different workspace (multi-org support)
   - UNIQUE constraint: (workspace_id, provider, email_address)

2. **Primary Account Selection**:
   - Only ONE integration can be primary per workspace
   - When setting is_primary=true, automatically unset others
   - Primary account used for sending emails (Email Agent)

3. **Token Expiration Handling**:
   - Check token expiration before EVERY API call
   - Automatically refresh token if expired or expiring within 1 hour
   - If refresh fails, set sync_error and notify user to re-authenticate

### Email Fetching Rules

1. **Deduplication**:
   - ALWAYS check provider_message_id before storing email
   - If exists, skip (idempotency protection)
   - Gmail: Use Message-ID header
   - Outlook: Use message ID from API response

2. **Rate Limiting**:
   - Gmail: 250 quota units per second (1 list request = 1 unit, 1 get request = 5 units)
   - Outlook: 10,000 requests per 10 minutes
   - Implement exponential backoff on rate limit errors

3. **Date Range Filtering**:
   - If date_from specified, only fetch emails after that date
   - If date_to specified, only fetch emails before that date
   - If neither specified, fetch ALL emails (unlimited)

4. **Pagination**:
   - Gmail: Use nextPageToken, fetch 500 emails per page
   - Outlook: Use @odata.nextLink, fetch 100 emails per page
   - Continue until no more pages

### Contact Linking Rules

1. **Automatic Contact Creation**:
   - If email sender NOT found in contacts table, create new contact
   - Extract name from from_name field (or parse from email address if missing)
   - Set workspace_id, org_id, email, name
   - Leave other fields (phone, company) empty (user will fill later)

2. **Email Direction Detection**:
   - If from_email = integration.email_address → direction = 'outbound'
   - If from_email != integration.email_address → direction = 'inbound'
   - Used for analytics (response rate, outreach volume)

3. **Thread Reconstruction**:
   - Group emails by provider_thread_id
   - Order by received_at ASC (oldest first)
   - Display as conversation in UI

### Real-time Monitoring Rules

1. **Watch Renewal**:
   - Gmail watches expire after 7 days (need to renew every 6 days)
   - Outlook subscriptions expire after 3 days (need to renew every 2 days)
   - Set up cron job to auto-renew before expiration

2. **Webhook Verification**:
   - Gmail: Verify message signature using Google public key
   - Outlook: Verify validationToken on subscription creation
   - Reject webhooks with invalid signature

3. **Webhook Idempotency**:
   - Gmail may send duplicate notifications (same historyId)
   - Check if historyId already processed before syncing
   - Store processed historyIds in cache (Redis, 24 hour TTL)

---

## 8. PERFORMANCE REQUIREMENTS

### Response Time Targets

| Function | Target | Maximum | Notes |
|----------|--------|---------|-------|
| connectEmailProvider() | < 2s | 5s | OAuth token exchange |
| fetchAllEmails() | 2-5min | 30min | For 10,000 emails |
| fetchEmailThread() | < 2s | 5s | Typical thread has 5-10 emails |
| syncNewEmails() | < 5s | 15s | Typical sync fetches 0-20 emails |
| watchForNewEmails() | < 1s | 3s | Set up push notification |
| downloadAttachment() | < 10s | 30s | For 10MB file with virus scan |
| linkEmailToContact() | < 200ms | 500ms | Database lookup + insert |
| refreshAccessToken() | < 1s | 3s | OAuth token refresh |

### Scalability Targets

1. **Email Fetching Throughput**:
   - Fetch 50-100 emails per second (with rate limiting)
   - Store 100 emails per second (batch inserts)
   - Process 10,000 emails in < 5 minutes

2. **Concurrent Connections**:
   - Support 100 active OAuth connections per workspace
   - Handle 50 concurrent email fetch operations
   - Process 1,000 webhook notifications per minute

3. **Storage Requirements**:
   - Average email size: 50KB (text + HTML)
   - 10,000 emails = 500MB storage
   - Use database pagination for email lists (load 50 emails per page)

### Database Indexes (Critical for Performance)

**email_integrations**:
- `idx_email_integrations_workspace_id` ON `workspace_id` (workspace filtering)
- `idx_email_integrations_email_address` ON `email_address` (lookup by email)
- `idx_email_integrations_sync_enabled` ON `sync_enabled` (find accounts to sync)
- `UNIQUE(workspace_id, provider, email_address)` (deduplication)

**client_emails**:
- `idx_client_emails_workspace_id` ON `workspace_id` (workspace filtering)
- `idx_client_emails_contact_id` ON `contact_id` (get emails for contact)
- `idx_client_emails_from_email` ON `from_email` (find emails from sender)
- `idx_client_emails_received_at` ON `received_at DESC` (recent emails first)
- `idx_client_emails_provider_thread_id` ON `provider_thread_id` (thread reconstruction)
- **MISSING INDEX**: Add `idx_client_emails_provider_message_id` ON `provider_message_id` (deduplication check)

---

## 9. TESTING STRATEGY

### Unit Tests

**Test File**: `tests/agents/email-integration.test.ts`

```typescript
describe('Email Integration Agent', () => {
  describe('connectEmailProvider()', () => {
    it('should connect Gmail account via OAuth', async () => {
      const result = await connectEmailProvider({
        provider: 'gmail',
        workspace_id: TEST_WORKSPACE_ID,
        org_id: TEST_ORG_ID,
        oauth_code: 'test_auth_code',
        account_label: 'Test Gmail',
        is_primary: true,
      });

      expect(result.success).toBe(true);
      expect(result.integration_id).toBeDefined();
      expect(result.email_address).toContain('@');
    });

    it('should reject duplicate email connection', async () => {
      await connectEmailProvider(testConnection); // Connect once

      const result = await connectEmailProvider(testConnection); // Try again

      expect(result.success).toBe(false);
      expect(result.error).toContain('EMAIL_INT_002');
    });
  });

  describe('fetchAllEmails()', () => {
    it('should fetch historical emails for contact', async () => {
      const result = await fetchAllEmails({
        workspace_id: TEST_WORKSPACE_ID,
        integration_id: testIntegration.id,
        contact_email: 'test@example.com',
        max_results: 100,
      });

      expect(result.success).toBe(true);
      expect(result.total_emails_fetched).toBeGreaterThan(0);
      expect(result.new_emails_stored).toBeLessThanOrEqual(100);
    });

    it('should skip duplicate emails', async () => {
      await fetchAllEmails(testFetch); // Fetch once

      const result = await fetchAllEmails(testFetch); // Fetch again

      expect(result.duplicate_emails_skipped).toBe(result.total_emails_fetched);
      expect(result.new_emails_stored).toBe(0);
    });
  });

  describe('refreshAccessToken()', () => {
    it('should refresh expired access token', async () => {
      // Set token to expired
      await expireToken(testIntegration.id);

      const result = await refreshAccessToken({
        integration_id: testIntegration.id,
      });

      expect(result.success).toBe(true);
      expect(result.new_access_token).toBeDefined();
      expect(result.expires_at).toBeInstanceOf(Date);
    });

    it('should fail if refresh token expired', async () => {
      await expireRefreshToken(testIntegration.id);

      const result = await refreshAccessToken({
        integration_id: testIntegration.id,
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('EMAIL_INT_024');
    });
  });
});
```

### Integration Tests

**Test File**: `tests/integration/email-gmail.test.ts`

```typescript
describe('Gmail Integration', () => {
  it('should connect Gmail account end-to-end', async () => {
    // 1. Get OAuth URL
    const authUrl = await getGmailOAuthUrl();
    expect(authUrl).toContain('accounts.google.com/o/oauth2/v2/auth');

    // 2. Simulate OAuth callback (test environment)
    const oauth_code = await simulateGmailOAuth();

    // 3. Connect account
    const connection = await connectEmailProvider({
      provider: 'gmail',
      oauth_code,
      workspace_id: TEST_WORKSPACE_ID,
      org_id: TEST_ORG_ID,
    });

    expect(connection.success).toBe(true);

    // 4. Fetch emails
    const emails = await fetchAllEmails({
      workspace_id: TEST_WORKSPACE_ID,
      integration_id: connection.integration_id,
      contact_email: 'test@gmail.com',
      max_results: 50,
    });

    expect(emails.total_emails_fetched).toBeGreaterThan(0);
  });
});
```

---

## 10. ERROR CODES

| Error Code | Description | HTTP Status | Retry? |
|-----------|-------------|-------------|--------|
| EMAIL_INT_001 | Invalid OAuth code | 400 | No |
| EMAIL_INT_002 | Account already connected | 409 | No |
| EMAIL_INT_003 | Failed to fetch user profile | 500 | Yes |
| EMAIL_INT_004 | Database insert failed | 500 | Yes |
| EMAIL_INT_005 | Integration not found | 404 | No |
| EMAIL_INT_006 | Integration expired (token needs refresh) | 401 | Yes (after refresh) |
| EMAIL_INT_007 | Gmail/Outlook API error | 500 | Yes |
| EMAIL_INT_008 | Rate limit exceeded | 429 | Yes (after delay) |
| EMAIL_INT_009 | Thread not found | 404 | No |
| EMAIL_INT_010 | Failed to fetch thread | 500 | Yes |
| EMAIL_INT_011 | Failed to parse thread | 500 | Yes |
| EMAIL_INT_012 | Sync failed (API error) | 500 | Yes |
| EMAIL_INT_013 | History ID expired (need full sync) | 410 | Yes (with full sync) |
| EMAIL_INT_014 | Failed to set up watch | 500 | Yes |
| EMAIL_INT_015 | Webhook verification failed | 401 | No |
| EMAIL_INT_016 | Watch expired (needs renewal) | 410 | Yes (renew watch) |
| EMAIL_INT_017 | Attachment not found | 404 | No |
| EMAIL_INT_018 | Virus detected in attachment | 403 | No |
| EMAIL_INT_019 | Storage upload failed | 500 | Yes |
| EMAIL_INT_020 | File size exceeds limit (max 25MB) | 413 | No |
| EMAIL_INT_021 | Email not found | 404 | No |
| EMAIL_INT_022 | Contact creation failed | 500 | Yes |
| EMAIL_INT_023 | Multiple contacts found for email (ambiguous) | 409 | No |
| EMAIL_INT_024 | Refresh token expired (re-authentication required) | 401 | No |
| EMAIL_INT_025 | Token refresh failed (OAuth error) | 500 | Yes |

---

## 11. AUSTRALIAN COMPLIANCE

### Phone Number Formatting

1. **Email Signature Parsing**:
   - If email signature contains phone number, extract and format as +61
   - Example: "(02) 9123 4567" → "+61 2 9123 4567"
   - Example: "0400 123 456" → "+61 400 123 456"

### Timezone Handling (AEST/AEDT)

1. **Email Timestamps**:
   - Store received_at and sent_at in UTC (database TIMESTAMPTZ)
   - Display in AEST/AEDT in dashboard (convert on frontend)
   - Example: "2025-11-18T14:35:00.000Z" → "19 Nov 2025, 1:35 AM AEDT" (Sydney)

2. **Sync Scheduling**:
   - Schedule email syncs during business hours (9am-6pm AEST/AEDT)
   - Avoid syncing overnight (reduce API quota usage)

### Business Name Extraction

1. **Email Signature Parsing**:
   - Extract company name from email signature
   - Common Australian business suffixes: Pty Ltd, Pty Limited, Limited, Ltd
   - Example: "TechCorp Australia Pty Ltd" → Store in contact.company

---

## 12. SECURITY

### Row Level Security (RLS) Policies

**email_integrations** (RLS Enabled):
```sql
-- Users can view email integrations in their workspace
CREATE POLICY "Users can view email integrations in their workspace"
  ON email_integrations
  FOR SELECT
  USING (
    workspace_id IN (
      SELECT w.id
      FROM workspaces w
      INNER JOIN user_organizations uo ON uo.org_id = w.org_id
      WHERE uo.user_id = auth.uid()
    )
  );

-- Service role can manage email integrations
CREATE POLICY "Service role can manage email integrations"
  ON email_integrations
  FOR ALL
  USING (true);
```

**client_emails** (RLS Enabled):
```sql
-- Users can view emails in their workspace
CREATE POLICY "Users can view emails in their workspace"
  ON client_emails
  FOR SELECT
  USING (
    workspace_id IN (
      SELECT w.id
      FROM workspaces w
      INNER JOIN user_organizations uo ON uo.org_id = w.org_id
      WHERE uo.user_id = auth.uid()
    )
  );

-- Service role can manage emails
CREATE POLICY "Service role can manage emails"
  ON client_emails
  FOR ALL
  USING (true);
```

### OAuth Token Security

1. **Token Storage**:
   - ENCRYPT access_token and refresh_token in database
   - Use Supabase encryption (pgcrypto extension)
   - NEVER log tokens in audit_logs or error messages

2. **Token Rotation**:
   - Rotate access_token every 1 hour (automatic via refresh)
   - Rotate refresh_token every 30 days (re-authentication required)

3. **Scope Minimization**:
   - Gmail: Only request `gmail.readonly` scope (read-only access)
   - Outlook: Only request `Mail.Read` scope (no send/delete permissions)

### Email Content Security

1. **XSS Prevention**:
   - Sanitize body_html before displaying in UI
   - Use DOMPurify or similar library
   - Strip <script> tags, inline JavaScript, external resources

2. **Attachment Virus Scanning**:
   - ALWAYS scan attachments with ClamAV or VirusTotal
   - Quarantine infected files (do not store or display)
   - Log virus detections in audit_logs

---

## 13. MONITORING & METRICS

### Key Performance Indicators (KPIs)

1. **OAuth Connection Metrics**:
   - Total active integrations (by provider)
   - Failed connections (by error code)
   - Token refresh success rate

2. **Email Fetching Metrics**:
   - Total emails fetched (daily, weekly, monthly)
   - Average fetch time per 100 emails
   - Duplicate rate (duplicates / total fetched)
   - Fetch failure rate (by provider)

3. **Real-time Sync Metrics**:
   - Webhook notification latency (time from email sent to webhook received)
   - Sync success rate
   - Watch renewal success rate

4. **Storage Metrics**:
   - Total emails stored (by workspace)
   - Total storage used (GB)
   - Attachment storage used (GB)

### Prometheus Metrics

```typescript
import { Counter, Histogram, Gauge } from 'prom-client';

// OAuth connections counter
const oauthConnections = new Counter({
  name: 'email_oauth_connections_total',
  help: 'Total number of OAuth connections',
  labelNames: ['provider', 'status'], // status: success, failed
});

// Email fetch counter
const emailsFetched = new Counter({
  name: 'emails_fetched_total',
  help: 'Total number of emails fetched',
  labelNames: ['provider', 'workspace_id'],
});

// Email fetch duration histogram
const fetchDuration = new Histogram({
  name: 'email_fetch_duration_ms',
  help: 'Email fetch duration in milliseconds',
  labelNames: ['provider'],
  buckets: [1000, 5000, 10000, 30000, 60000, 120000],
});

// Active integrations gauge
const activeIntegrations = new Gauge({
  name: 'active_email_integrations',
  help: 'Number of active email integrations',
  labelNames: ['provider'],
});

// Webhook latency histogram
const webhookLatency = new Histogram({
  name: 'email_webhook_latency_ms',
  help: 'Time from email sent to webhook received',
  labelNames: ['provider'],
  buckets: [1000, 5000, 10000, 30000, 60000],
});
```

### Alerts

1. **Token Expiration Alert**:
   - Trigger: Integration token expiring within 24 hours and refresh failed
   - Action: Send email to user to re-authenticate
   - Severity: Warning

2. **Fetch Failure Alert**:
   - Trigger: Email fetch failure rate > 10% over 15 minutes
   - Action: Send Slack alert to #engineering-alerts
   - Severity: Warning

3. **Watch Expiration Alert**:
   - Trigger: Gmail watch expiring within 24 hours and renewal failed
   - Action: Send PagerDuty alert to on-call engineer
   - Severity: Critical

---

## 14. FUTURE ENHANCEMENTS

### Phase 2 (Q2 2026)

1. **Advanced Email Filtering**:
   - Filter emails by label/folder
   - Filter by sender domain (e.g., all emails from @techcorp.com.au)
   - Filter by date range and keywords

2. **Email Search**:
   - Full-text search across email body and subject
   - Search by sender, recipient, date range
   - PostgreSQL full-text search (tsvector)

3. **Bulk Operations**:
   - Bulk link emails to contacts (select multiple emails, assign to contact)
   - Bulk delete emails (with confirmation)
   - Bulk mark as read/unread

### Phase 3 (Q3-Q4 2026)

1. **Multi-Language Support**:
   - Detect email language (Google Translate API)
   - Translate non-English emails to English for AI analysis
   - Store original + translated version

2. **Email Categorization**:
   - AI-powered email categorization (sales, support, marketing, admin)
   - Auto-apply labels based on content
   - Priority detection (urgent, important, normal)

3. **Advanced Attachment Handling**:
   - OCR for scanned PDFs (extract text from images)
   - Image analysis (detect logos, products, charts)
   - Document parsing (extract data from invoices, contracts)

---

## AGENT METADATA

**Created**: 2025-11-18
**Last Updated**: 2025-11-18
**Version**: 1.0.0
**Status**: Active Development
**Owner**: Client Intelligence Team
**Dependencies**: Contact Agent, AI Intelligence Extraction Agent, Workflow Agent
**Related Docs**:
- `supabase/migrations/004_email_integrations.sql` - Email integrations table schema
- `supabase/migrations/038_core_saas_tables.sql` - client_emails table schema
- `docs/gmail-oauth-setup.md` - Gmail OAuth setup guide
- `docs/outlook-oauth-setup.md` - Outlook OAuth setup guide

---

**END OF EMAIL INTEGRATION AGENT SPECIFICATION**
