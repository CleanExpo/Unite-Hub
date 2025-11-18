# 📨 Email Management Agent

## Agent Overview

**Agent Name:** Email Management Agent
**Agent ID:** `unite-hub.email-agent`
**Type:** Core Infrastructure Agent
**Priority:** P0 (Critical - Week 1)
**Status:** 🟡 Specification Complete - Implementation Pending
**Model:** `claude-sonnet-4-5-20250929` (standard operations), `claude-haiku-4-5-20251001` (quick sends)

### Database Tables Used

This agent manages 5 core email infrastructure tables:

1. **`email_integrations`** - Gmail/Outlook/SMTP account connections
2. **`sent_emails`** - Outbound email tracking
3. **`email_opens`** - Open event tracking (pixel tracking)
4. **`email_clicks`** - Click event tracking (link tracking)
5. **`emails`** - Inbound email storage (from Gmail sync)

### Related Tables (Read-Only Access)

- **`contacts`** - Contact email addresses for sending
- **`campaigns`** - Campaign email blasts
- **`drip_campaigns`** - Multi-step email sequences
- **`campaign_enrollments`** - Campaign recipient lists

---

## Purpose & Scope

### Responsibilities

The Email Agent is the **foundational email infrastructure** for Unite-Hub, handling:

#### 1. Email Account Management (OAuth Integrations)
- Connect Gmail accounts via OAuth 2.0
- Connect Outlook accounts via OAuth 2.0
- Configure SMTP accounts (custom domains)
- Manage multiple email accounts per workspace
- Designate primary sending account
- Token refresh and expiration handling

#### 2. Outbound Email Sending
- Send transactional emails (welcome, password reset, notifications)
- Send campaign emails (blasts, drip sequences)
- Send personalized emails (sales outreach)
- Multi-provider support: SendGrid → Resend → Gmail SMTP fallback
- Intelligent retry logic with exponential backoff
- Rate limiting per provider and workspace

#### 3. Email Tracking & Analytics
- Open tracking (invisible pixel)
- Click tracking (link rewriting)
- Reply detection and threading
- Bounce handling
- Unsubscribe handling (one-click unsubscribe)
- Real-time event processing (webhooks)

#### 4. Inbound Email Sync (Gmail Integration)
- Sync emails from connected Gmail accounts
- Incremental sync (using Gmail historyId)
- Full sync (initial import)
- Email parsing and metadata extraction
- Thread grouping and conversation tracking
- Attachment handling

#### 5. Deliverability Optimization
- SPF/DKIM/DMARC validation
- Sender reputation monitoring
- Bounce rate tracking (alert if > 2%)
- Spam complaint tracking (alert if > 0.1%)
- Send time optimization (respect timezones)
- Email warmup for new accounts (gradual volume ramp)

#### 6. Compliance & Security
- Australian Spam Act 2003 compliance
- CAN-SPAM Act compliance (US)
- GDPR email consent tracking
- One-click unsubscribe (RFC 8058)
- Data encryption at rest and in transit
- PII redaction in logs

---

## Database Schema Mapping

### TypeScript Interfaces

```typescript
// ===== EMAIL INTEGRATIONS TABLE (OAuth Accounts) =====
interface EmailIntegration {
  id: string; // UUID
  workspace_id: string; // UUID - REQUIRED for multi-tenancy
  org_id: string; // UUID - Organization owner

  // Provider info
  provider: 'gmail' | 'outlook' | 'smtp';
  email_address: string; // actual@email.com
  account_label?: string; // User-defined label (e.g., "Sales", "Support")

  // Account settings
  is_primary: boolean; // Primary sending account (only one per workspace)
  sync_enabled: boolean; // Enable inbound email sync
  is_active: boolean; // Soft delete flag

  // OAuth tokens (encrypted at rest)
  access_token: string; // OAuth access token
  refresh_token?: string; // OAuth refresh token
  token_expires_at?: string; // ISO timestamp

  // Sync metadata
  last_sync_at?: string; // ISO timestamp of last successful sync
  last_history_id?: string; // Gmail historyId for incremental sync
  sync_error?: string; // Last sync error message

  // Timestamps
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
}

// ===== SENT EMAILS TABLE (Outbound Email Tracking) =====
interface SentEmail {
  id: string; // UUID
  workspace_id: string; // UUID - REQUIRED for multi-tenancy
  contact_id?: string; // UUID - References contacts.id (if sent to contact)
  integration_id?: string; // UUID - Which account sent it

  // Email details
  to_email: string; // Recipient email
  from_email: string; // Sender email
  subject: string;
  body: string; // Plain text version
  body_html?: string; // HTML version (optional)

  // Campaign association (if part of campaign)
  campaign_id?: string; // References campaigns.id
  drip_campaign_id?: string; // References drip_campaigns.id
  campaign_step_id?: string; // References campaign_steps.id

  // Tracking metrics
  opens: number; // Total open count
  clicks: number; // Total click count
  first_open_at?: string; // ISO timestamp of first open
  first_click_at?: string; // ISO timestamp of first click

  // Provider metadata
  provider: 'sendgrid' | 'resend' | 'smtp'; // Which provider sent it
  provider_message_id?: string; // Provider's message ID

  // Gmail metadata (if sent via Gmail)
  gmail_message_id?: string; // Gmail message ID
  gmail_thread_id?: string; // Gmail thread ID (for threading)

  // Delivery status
  status: 'pending' | 'sent' | 'delivered' | 'bounced' | 'failed';
  bounced_at?: string; // ISO timestamp if bounced
  bounce_reason?: string; // Bounce error message

  // Timestamps
  sent_at: string; // ISO timestamp when sent
  created_at: string; // ISO timestamp
}

// ===== EMAIL OPENS TABLE (Open Event Tracking) =====
interface EmailOpen {
  id: string; // UUID
  sent_email_id: string; // UUID - References sent_emails.id

  // Tracking metadata (from pixel request)
  ip_address?: string; // Visitor IP (e.g., "203.123.45.67")
  user_agent?: string; // Browser user agent
  country?: string; // Geo-location (from IP)
  city?: string; // Geo-location (from IP)
  device_type?: 'desktop' | 'mobile' | 'tablet'; // Parsed from user agent

  // Timestamp
  opened_at: string; // ISO timestamp
}

// ===== EMAIL CLICKS TABLE (Click Event Tracking) =====
interface EmailClick {
  id: string; // UUID
  sent_email_id: string; // UUID - References sent_emails.id

  // Click details
  link_url: string; // Original URL that was clicked
  tracked_url: string; // Rewritten tracking URL

  // Tracking metadata
  ip_address?: string;
  user_agent?: string;
  country?: string;
  city?: string;
  device_type?: 'desktop' | 'mobile' | 'tablet';

  // Timestamp
  clicked_at: string; // ISO timestamp
}

// ===== EMAILS TABLE (Inbound Email Storage) =====
interface Email {
  id: string; // UUID
  workspace_id: string; // UUID - REQUIRED for multi-tenancy
  contact_id?: string; // UUID - Auto-linked to contact (if found)
  integration_id: string; // UUID - Which account received it

  // Email headers
  from: string; // Sender email
  to: string; // Recipient email (our email address)
  subject: string;

  // Email body
  body: string; // Plain text version
  body_html?: string; // HTML version

  // Threading
  gmail_message_id?: string; // Gmail message ID
  gmail_thread_id?: string; // Gmail thread ID
  in_reply_to?: string; // Email this is replying to
  references?: string[]; // Email thread references

  // AI processing (for Email Processor Agent)
  ai_summary?: string; // AI-generated summary
  ai_intent?: 'inquiry' | 'proposal' | 'complaint' | 'question' | 'followup' | 'meeting';
  ai_sentiment?: 'positive' | 'neutral' | 'negative';
  is_processed: boolean; // Has Email Processor Agent handled this?

  // Metadata
  has_attachments: boolean;
  attachment_count: number;

  // Timestamps
  received_at: string; // ISO timestamp when email was received
  created_at: string; // ISO timestamp when synced to our DB
  updated_at: string; // ISO timestamp
}

// ===== EMAIL SEND REQUEST (Input Type) =====
interface EmailSendRequest {
  // Required fields
  to: string | string[]; // Recipient(s)
  subject: string;
  body: string; // Plain text

  // Optional fields
  body_html?: string; // HTML version
  from?: string; // Override default sender
  from_name?: string; // Sender display name
  reply_to?: string; // Reply-to address
  cc?: string | string[];
  bcc?: string | string[];

  // Tracking options
  track_opens?: boolean; // Default: true
  track_clicks?: boolean; // Default: true

  // Campaign association
  contact_id?: string;
  campaign_id?: string;
  drip_campaign_id?: string;
  campaign_step_id?: string;

  // Provider selection
  provider?: 'sendgrid' | 'resend' | 'smtp' | 'auto'; // Default: 'auto'

  // Scheduling
  send_at?: string; // ISO timestamp (future scheduling)

  // Personalization (merge tags)
  merge_vars?: Record<string, string>; // {{ tag }} replacements

  // Metadata
  workspace_id: string; // REQUIRED
  integration_id?: string; // Specific account to send from (default: primary)
}

// ===== EMAIL SEND RESULT (Output Type) =====
interface EmailSendResult {
  success: boolean;
  email_id?: string; // References sent_emails.id
  provider: 'sendgrid' | 'resend' | 'smtp';
  provider_message_id?: string;
  fallback_used: boolean; // True if primary provider failed
  error?: {
    code: string; // Error code (e.g., EMAIL_001)
    message: string;
    provider_error?: any; // Original provider error
  };
  tracking_urls?: {
    open_pixel: string; // Tracking pixel URL
    unsubscribe: string; // One-click unsubscribe URL
  };
}
```

---

## Core Functions

### 1. Send Email

**Function:** `sendEmail(request: EmailSendRequest): Promise<EmailSendResult>`

**Purpose:** Send an email with tracking and automatic provider fallback

**Input:**
```typescript
{
  to: "john@example.com",
  subject: "Welcome to Unite-Hub!",
  body: "Hi John, welcome aboard!",
  body_html: "<h1>Hi John</h1><p>Welcome aboard!</p>",
  track_opens: true,
  track_clicks: true,
  workspace_id: "uuid",
  merge_vars: {
    "first_name": "John",
    "company": "Acme Corp"
  }
}
```

**Output:**
```typescript
{
  success: true,
  email_id: "uuid",
  provider: "sendgrid",
  provider_message_id: "<msg123@sendgrid.net>",
  fallback_used: false,
  tracking_urls: {
    open_pixel: "https://track.unite-hub.com/o/abc123",
    unsubscribe: "https://track.unite-hub.com/u/abc123"
  }
}
```

**Business Logic:**

1. **Validate Input:**
   ```typescript
   // Check required fields
   if (!to || !subject || !body) {
     throw new Error('EMAIL_001: Missing required fields');
   }

   // Validate email format
   const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
   if (!emailRegex.test(to)) {
     throw new Error('EMAIL_002: Invalid email address');
   }

   // Check workspace rate limit (100 emails/minute)
   const allowed = await checkRateLimit(workspace_id);
   if (!allowed) {
     throw new Error('EMAIL_003: Rate limit exceeded');
   }
   ```

2. **Apply Personalization (Merge Tags):**
   ```typescript
   let personalizedBody = body;
   let personalizedSubject = subject;

   if (merge_vars) {
     for (const [tag, value] of Object.entries(merge_vars)) {
       const regex = new RegExp(`{{\\s*${tag}\\s*}}`, 'g');
       personalizedBody = personalizedBody.replace(regex, value);
       personalizedSubject = personalizedSubject.replace(regex, value);
     }
   }
   ```

3. **Add Tracking (if enabled):**
   ```typescript
   const trackingId = generateTrackingId(); // Random UUID

   if (track_opens) {
     // Inject invisible 1x1 pixel at end of HTML body
     body_html += `<img src="https://track.unite-hub.com/o/${trackingId}" width="1" height="1" alt="" />`;
   }

   if (track_clicks) {
     // Rewrite all links to go through tracking proxy
     body_html = rewriteLinksForTracking(body_html, trackingId);
   }

   // Add one-click unsubscribe header (RFC 8058)
   const unsubscribeUrl = `https://track.unite-hub.com/u/${trackingId}`;
   headers['List-Unsubscribe'] = `<${unsubscribeUrl}>`;
   headers['List-Unsubscribe-Post'] = 'List-Unsubscribe=One-Click';
   ```

4. **Select Provider & Send:**
   ```typescript
   const providers = getProviderOrder(request.provider); // ['sendgrid', 'resend', 'smtp']

   let lastError: any;
   let fallbackUsed = false;

   for (const provider of providers) {
     try {
       const result = await sendViaProvider(provider, emailData);

       // Success! Store in database
       const email = await storeSentEmail({
         ...request,
         provider,
         provider_message_id: result.messageId,
         status: 'sent',
         tracking_id: trackingId
       });

       return {
         success: true,
         email_id: email.id,
         provider,
         provider_message_id: result.messageId,
         fallback_used,
         tracking_urls: {
           open_pixel: `https://track.unite-hub.com/o/${trackingId}`,
           unsubscribe: unsubscribeUrl
         }
       };
     } catch (error) {
       lastError = error;
       fallbackUsed = true;
       logger.warn(`Provider ${provider} failed:`, error.message);
       // Try next provider
     }
   }

   // All providers failed
   throw new Error(`EMAIL_004: All providers failed. Last error: ${lastError.message}`);
   ```

5. **Store in Database:**
   ```sql
   INSERT INTO sent_emails (
     workspace_id, contact_id, integration_id,
     to_email, from_email, subject, body, body_html,
     campaign_id, drip_campaign_id, campaign_step_id,
     provider, provider_message_id, status,
     tracking_id, sent_at
   ) VALUES (
     $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, NOW()
   ) RETURNING *;
   ```

**Error Codes:**
- `EMAIL_001` - Missing required fields (to, subject, body)
- `EMAIL_002` - Invalid email address format
- `EMAIL_003` - Rate limit exceeded
- `EMAIL_004` - All providers failed

---

### 2. Track Email Open

**Function:** `trackEmailOpen(tracking_id: string, metadata: TrackingMetadata): Promise<void>`

**Purpose:** Record an email open event (triggered by pixel request)

**Input:**
```typescript
{
  tracking_id: "abc123",
  metadata: {
    ip_address: "203.123.45.67",
    user_agent: "Mozilla/5.0 ...",
    timestamp: "2025-11-18T10:30:00Z"
  }
}
```

**Output:**
```typescript
{
  success: true,
  first_open: true // True if this was the first open
}
```

**Business Logic:**

1. **Find Sent Email:**
   ```sql
   SELECT * FROM sent_emails WHERE tracking_id = $1;
   ```

2. **Parse Metadata:**
   ```typescript
   const { country, city } = await geolocateIP(ip_address);
   const device_type = parseDeviceType(user_agent);
   ```

3. **Record Open Event:**
   ```sql
   INSERT INTO email_opens (
     sent_email_id, ip_address, user_agent, country, city, device_type, opened_at
   ) VALUES ($1, $2, $3, $4, $5, $6, NOW());
   ```

4. **Update Sent Email Metrics:**
   ```sql
   UPDATE sent_emails
   SET
     opens = opens + 1,
     first_open_at = CASE
       WHEN first_open_at IS NULL THEN NOW()
       ELSE first_open_at
     END
   WHERE id = $1;
   ```

5. **Trigger Downstream Events:**
   ```typescript
   // Notify Campaign Agent if this is a campaign email
   if (email.drip_campaign_id) {
     await campaignAgent.handleEmailEvent({
       event_type: 'opened',
       email_id: email.id,
       contact_email: email.to_email,
       timestamp: new Date().toISOString()
     });
   }

   // Update Contact Agent engagement score
   if (email.contact_id) {
     await contactAgent.updateEngagementScore(email.contact_id, {
       event: 'email_opened',
       weight: 5 // Points for opening email
     });
   }
   ```

---

### 3. Track Email Click

**Function:** `trackEmailClick(tracking_id: string, link_url: string, metadata: TrackingMetadata): Promise<string>`

**Purpose:** Record a click event and redirect to original URL

**Input:**
```typescript
{
  tracking_id: "abc123",
  link_url: "https://example.com/pricing",
  metadata: {
    ip_address: "203.123.45.67",
    user_agent: "Mozilla/5.0 ..."
  }
}
```

**Output:**
```typescript
{
  success: true,
  redirect_url: "https://example.com/pricing"
}
```

**Business Logic:**

1. **Find Sent Email:**
   ```sql
   SELECT * FROM sent_emails WHERE tracking_id = $1;
   ```

2. **Record Click Event:**
   ```sql
   INSERT INTO email_clicks (
     sent_email_id, link_url, ip_address, user_agent, country, city, device_type, clicked_at
   ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW());
   ```

3. **Update Sent Email Metrics:**
   ```sql
   UPDATE sent_emails
   SET
     clicks = clicks + 1,
     first_click_at = CASE
       WHEN first_click_at IS NULL THEN NOW()
       ELSE first_click_at
     END
   WHERE id = $1;
   ```

4. **Trigger Downstream Events:**
   ```typescript
   // Notify Campaign Agent
   if (email.drip_campaign_id) {
     await campaignAgent.handleEmailEvent({
       event_type: 'clicked',
       email_id: email.id,
       contact_email: email.to_email,
       metadata: { link_url }
     });
   }

   // Update Contact engagement score (clicks worth more than opens)
   if (email.contact_id) {
     await contactAgent.updateEngagementScore(email.contact_id, {
       event: 'email_clicked',
       weight: 10 // Points for clicking link
     });
   }
   ```

5. **Return Redirect URL:**
   ```typescript
   return {
     success: true,
     redirect_url: link_url // Original URL to redirect to
   };
   ```

---

### 4. Sync Gmail Emails (Inbound Sync)

**Function:** `syncGmailEmails(integration_id: string, options?: SyncOptions): Promise<SyncResult>`

**Purpose:** Sync emails from a connected Gmail account (cron job, runs hourly)

**Input:**
```typescript
{
  integration_id: "uuid",
  options: {
    mode: 'incremental' | 'full', // Default: 'incremental'
    limit: 100, // Max emails per sync
    since: "2025-11-18T00:00:00Z" // Only sync emails after this date (full sync)
  }
}
```

**Output:**
```typescript
{
  success: true,
  synced: 47, // New emails synced
  skipped: 3, // Already in database
  failed: 0,
  last_history_id: "12345678", // Updated Gmail historyId
  errors: []
}
```

**Business Logic:**

1. **Load Integration:**
   ```sql
   SELECT * FROM email_integrations WHERE id = $1 AND sync_enabled = true;
   ```

2. **Refresh OAuth Token (if expired):**
   ```typescript
   if (integration.token_expires_at < new Date()) {
     const newTokens = await refreshGmailToken(integration.refresh_token);
     await updateIntegration(integration.id, {
       access_token: newTokens.access_token,
       token_expires_at: newTokens.expires_at
     });
   }
   ```

3. **Fetch Emails from Gmail API:**
   ```typescript
   const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });

   let emails: GmailMessage[];

   if (options.mode === 'incremental' && integration.last_history_id) {
     // Incremental sync (only new emails since last sync)
     const history = await gmail.users.history.list({
       userId: 'me',
       startHistoryId: integration.last_history_id,
       historyTypes: ['messageAdded'],
       maxResults: options.limit
     });

     emails = history.data.history?.flatMap(h => h.messagesAdded || []) || [];
   } else {
     // Full sync (all emails in inbox)
     const messages = await gmail.users.messages.list({
       userId: 'me',
       maxResults: options.limit,
       q: options.since ? `after:${formatDate(options.since)}` : undefined
     });

     emails = messages.data.messages || [];
   }
   ```

4. **Parse and Store Each Email:**
   ```typescript
   let synced = 0, skipped = 0, failed = 0;

   for (const gmailMsg of emails) {
     try {
       // Fetch full message details
       const fullMsg = await gmail.users.messages.get({
         userId: 'me',
         id: gmailMsg.id,
         format: 'full'
       });

       // Check if already in database
       const existing = await checkEmailExists(fullMsg.id);
       if (existing) {
         skipped++;
         continue;
       }

       // Parse email headers
       const headers = parseHeaders(fullMsg.payload.headers);
       const from = headers.from;
       const to = headers.to;
       const subject = headers.subject;

       // Parse body (handle multipart MIME)
       const { body, body_html } = parseEmailBody(fullMsg.payload);

       // Try to link to contact
       const contact = await findContactByEmail(from, integration.workspace_id);

       // Store in database
       await storeEmail({
         workspace_id: integration.workspace_id,
         integration_id: integration.id,
         contact_id: contact?.id,
         from,
         to,
         subject,
         body,
         body_html,
         gmail_message_id: fullMsg.id,
         gmail_thread_id: fullMsg.threadId,
         has_attachments: (fullMsg.payload.parts?.length || 0) > 1,
         attachment_count: countAttachments(fullMsg.payload),
         received_at: new Date(parseInt(fullMsg.internalDate)),
         is_processed: false // Will be processed by Email Processor Agent
       });

       synced++;
     } catch (error) {
       failed++;
       logger.error(`Failed to sync email ${gmailMsg.id}:`, error);
     }
   }
   ```

5. **Update Integration Metadata:**
   ```sql
   UPDATE email_integrations
   SET
     last_sync_at = NOW(),
     last_history_id = $1,
     sync_error = NULL
   WHERE id = $2;
   ```

**Error Codes:**
- `EMAIL_005` - Gmail API authentication failed (token expired)
- `EMAIL_006` - Gmail API quota exceeded
- `EMAIL_007` - Integration not found or disabled

---

### 5. Connect Gmail Account (OAuth)

**Function:** `connectGmailAccount(workspace_id: string, auth_code: string): Promise<EmailIntegration>`

**Purpose:** Complete OAuth flow and save Gmail account connection

**Input:**
```typescript
{
  workspace_id: "uuid",
  auth_code: "4/0AY0e-g7...", // OAuth authorization code from redirect
  account_label: "Sales Team" // Optional user label
}
```

**Output:**
```typescript
{
  success: true,
  integration: {
    id: "uuid",
    provider: "gmail",
    email_address: "sales@company.com",
    is_primary: true,
    sync_enabled: true
  }
}
```

**Business Logic:**

1. **Exchange Auth Code for Tokens:**
   ```typescript
   const { tokens } = await oAuth2Client.getToken(auth_code);
   const { access_token, refresh_token, expiry_date } = tokens;
   ```

2. **Fetch User Profile (get email address):**
   ```typescript
   oAuth2Client.setCredentials(tokens);
   const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });

   const profile = await gmail.users.getProfile({ userId: 'me' });
   const email_address = profile.data.emailAddress;
   ```

3. **Check for Duplicate:**
   ```sql
   SELECT * FROM email_integrations
   WHERE workspace_id = $1 AND provider = 'gmail' AND email_address = $2;
   ```

4. **Determine if Primary:**
   ```sql
   SELECT COUNT(*) FROM email_integrations WHERE workspace_id = $1;
   ```
   - If count = 0 → This is the first account, set as primary

5. **Store Integration:**
   ```sql
   INSERT INTO email_integrations (
     workspace_id, org_id, provider, email_address, account_label,
     is_primary, sync_enabled, is_active,
     access_token, refresh_token, token_expires_at,
     created_at, updated_at
   ) VALUES (
     $1, $2, 'gmail', $3, $4, $5, true, true,
     $6, $7, $8, NOW(), NOW()
   ) RETURNING *;
   ```

6. **Trigger Initial Sync:**
   ```typescript
   // Sync last 30 days of emails in background
   await syncGmailEmails(integration.id, {
     mode: 'full',
     since: subDays(new Date(), 30),
     limit: 500
   });
   ```

**Error Codes:**
- `EMAIL_008` - Invalid OAuth authorization code
- `EMAIL_009` - Gmail account already connected
- `EMAIL_010` - Workspace not found

---

### 6. Handle Email Bounce

**Function:** `handleEmailBounce(provider_message_id: string, bounce_data: BounceData): Promise<void>`

**Purpose:** Process bounce webhooks from email providers

**Input:**
```typescript
{
  provider_message_id: "<msg123@sendgrid.net>",
  bounce_data: {
    type: 'hard' | 'soft', // Hard bounce = permanent, Soft = temporary
    reason: 'mailbox_full' | 'invalid_address' | 'spam_block' | 'server_error',
    description: "550 5.1.1 User unknown",
    timestamp: "2025-11-18T10:45:00Z"
  }
}
```

**Output:**
```typescript
{
  success: true,
  email_updated: true,
  contact_updated: true
}
```

**Business Logic:**

1. **Find Sent Email:**
   ```sql
   SELECT * FROM sent_emails WHERE provider_message_id = $1;
   ```

2. **Update Sent Email Status:**
   ```sql
   UPDATE sent_emails
   SET
     status = 'bounced',
     bounced_at = $1,
     bounce_reason = $2
   WHERE id = $3;
   ```

3. **Handle Hard Bounce (permanent failure):**
   ```typescript
   if (bounce_data.type === 'hard') {
     // Mark contact email as invalid
     if (email.contact_id) {
       await updateContact(email.contact_id, {
         email_status: 'invalid',
         email_bounced_at: bounce_data.timestamp
       });

       // Remove from all active campaigns
       await campaignAgent.unenrollContact(email.contact_id, {
         reason: 'hard_bounce',
         all_campaigns: true
       });
     }

     // Alert if bounce rate > 2% (deliverability issue)
     const bounceRate = await calculateBounceRate(email.workspace_id);
     if (bounceRate > 0.02) {
       await alertTeam({
         severity: 'critical',
         message: `Bounce rate is ${(bounceRate * 100).toFixed(2)}% (threshold: 2%)`,
         workspace_id: email.workspace_id
       });
     }
   }
   ```

4. **Handle Soft Bounce (temporary failure):**
   ```typescript
   if (bounce_data.type === 'soft') {
     // Retry up to 3 times
     const retryCount = email.metadata?.retry_count || 0;

     if (retryCount < 3) {
       // Schedule retry (exponential backoff: 1h, 4h, 12h)
       const delay = Math.pow(2, retryCount) * 3600; // seconds
       await scheduleEmailRetry(email.id, delay);
     } else {
       // Max retries reached, treat as permanent failure
       await updateContact(email.contact_id, {
         email_status: 'unreachable'
       });
     }
   }
   ```

**Error Codes:**
- `EMAIL_011` - Email not found (unknown provider_message_id)

---

### 7. Handle Unsubscribe

**Function:** `handleUnsubscribe(tracking_id: string, metadata?: UnsubscribeMetadata): Promise<void>`

**Purpose:** Process one-click unsubscribe requests (RFC 8058 compliant)

**Input:**
```typescript
{
  tracking_id: "abc123",
  metadata: {
    reason: "not_interested" | "too_frequent" | "spam" | "other",
    feedback: "Too many emails", // Optional user feedback
    ip_address: "203.123.45.67"
  }
}
```

**Output:**
```typescript
{
  success: true,
  contact_unsubscribed: true,
  campaigns_stopped: 3 // Number of active campaigns stopped
}
```

**Business Logic:**

1. **Find Sent Email:**
   ```sql
   SELECT * FROM sent_emails WHERE tracking_id = $1;
   ```

2. **Update Contact Subscription Status:**
   ```sql
   UPDATE contacts
   SET
     email_subscription_status = 'unsubscribed',
     unsubscribed_at = NOW(),
     unsubscribe_reason = $1
   WHERE id = $2;
   ```

3. **Stop All Active Campaigns:**
   ```sql
   UPDATE campaign_enrollments
   SET status = 'unsubscribed', updated_at = NOW()
   WHERE contact_id = $1 AND status = 'active';
   ```

4. **Log Unsubscribe Event:**
   ```sql
   INSERT INTO audit_logs (
     org_id, action, resource, resource_id, agent, status, details
   ) VALUES (
     $1, 'unsubscribe', 'contact', $2, 'email-agent', 'success',
     jsonb_build_object(
       'email_id', $3,
       'reason', $4,
       'feedback', $5,
       'ip_address', $6
     )
   );
   ```

5. **Update Metrics:**
   ```sql
   -- Increment unsubscribe count for campaign (if applicable)
   UPDATE drip_campaigns
   SET metrics = jsonb_set(
     metrics,
     '{unsubscribed}',
     ((metrics->>'unsubscribed')::int + 1)::text::jsonb
   )
   WHERE id = $1;
   ```

**Error Codes:**
- `EMAIL_012` - Contact not found
- `EMAIL_013` - Contact already unsubscribed

---

## API Endpoints

### 1. Send Email

**Endpoint:** `POST /api/email/send`

**Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "workspaceId": "uuid",
  "to": "john@example.com",
  "subject": "Welcome to Unite-Hub!",
  "body": "Hi {{first_name}}, welcome aboard!",
  "body_html": "<h1>Welcome!</h1>",
  "track_opens": true,
  "track_clicks": true,
  "merge_vars": {
    "first_name": "John"
  },
  "contact_id": "uuid",
  "provider": "auto"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "email_id": "uuid",
  "provider": "sendgrid",
  "provider_message_id": "<msg123@sendgrid.net>",
  "fallback_used": false,
  "tracking_urls": {
    "open_pixel": "https://track.unite-hub.com/o/abc123",
    "unsubscribe": "https://track.unite-hub.com/u/abc123"
  }
}
```

---

### 2. Track Open (Public Endpoint)

**Endpoint:** `GET /api/track/open/:tracking_id`

**Response:** Returns 1x1 transparent GIF

**Side Effects:** Records open event in `email_opens` table

---

### 3. Track Click (Public Endpoint)

**Endpoint:** `GET /api/track/click/:tracking_id`

**Query Params:**
```
?url=https://example.com/pricing
```

**Response:** 302 Redirect to original URL

**Side Effects:** Records click event in `email_clicks` table

---

### 4. Handle Unsubscribe (Public Endpoint)

**Endpoint:** `POST /api/track/unsubscribe/:tracking_id`

**Request Body:**
```json
{
  "reason": "too_frequent",
  "feedback": "I was receiving too many emails"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "You have been unsubscribed successfully"
}
```

---

### 5. Connect Gmail Account

**Endpoint:** `POST /api/email/integrations/gmail/connect`

**Request Body:**
```json
{
  "workspaceId": "uuid",
  "auth_code": "4/0AY0e-g7...",
  "account_label": "Sales Team"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "integration": {
    "id": "uuid",
    "provider": "gmail",
    "email_address": "sales@company.com",
    "is_primary": true,
    "sync_enabled": true,
    "created_at": "2025-11-18T10:00:00Z"
  }
}
```

---

### 6. Sync Gmail Emails (Internal/Cron)

**Endpoint:** `POST /api/email/integrations/:integration_id/sync`

**Headers:**
```
X-Cron-Secret: {secret}
```

**Request Body:**
```json
{
  "mode": "incremental",
  "limit": 100
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "synced": 47,
  "skipped": 3,
  "failed": 0,
  "last_history_id": "12345678",
  "errors": []
}
```

---

### 7. Handle Bounce Webhook

**Endpoint:** `POST /api/email/webhooks/bounce`

**Headers:**
```
X-Webhook-Signature: {signature} // Verify SendGrid/Resend signature
```

**Request Body:**
```json
{
  "provider_message_id": "<msg123@sendgrid.net>",
  "type": "hard",
  "reason": "invalid_address",
  "description": "550 5.1.1 User unknown",
  "timestamp": "2025-11-18T10:45:00Z"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "email_updated": true,
  "contact_updated": true
}
```

---

## Integration Points

### Inputs (What Triggers This Agent)

1. **Campaign Agent:**
   - Send campaign emails (drip sequences, blasts)
   - Input: `{ to, subject, body, campaign_id, contact_id }`

2. **User Actions (Dashboard UI):**
   - Send individual email to contact
   - Connect Gmail account (OAuth flow)
   - View email analytics (opens, clicks)

3. **Webhooks (External Services):**
   - Email opened (tracking pixel request)
   - Email clicked (tracking link request)
   - Email bounced (SendGrid/Resend webhook)
   - Email unsubscribed (one-click unsubscribe)

4. **Cron Jobs:**
   - Hourly: Sync Gmail emails (`syncGmailEmails()`)
   - Daily: Calculate deliverability metrics
   - Weekly: Email warmup for new accounts

### Outputs (What This Agent Provides)

1. **To Campaign Agent:**
   - Email sent confirmation: `{ email_id, status, sent_at }`
   - Email events: `{ event_type, email_id, contact_email, timestamp }`

2. **To Contact Agent:**
   - Engagement events: `{ contact_id, event: 'email_opened' | 'email_clicked', weight: number }`
   - Email validation: `{ contact_id, email_status: 'valid' | 'invalid' | 'unreachable' }`

3. **To Analytics Agent:**
   - Email performance: `{ workspace_id, sent, delivered, opened, clicked, bounced }`
   - Deliverability metrics: `{ bounce_rate, spam_rate, engagement_rate }`

4. **To Audit Logs:**
   - All email send events
   - All tracking events
   - Integration changes

---

## Business Rules

### 1. Rate Limiting

**Per-Workspace Limits:**
- **Free Plan:** 100 emails/day, 10 emails/minute
- **Pro Plan:** 10,000 emails/day, 100 emails/minute
- **Enterprise Plan:** Unlimited emails/day, 1,000 emails/minute

**Per-Provider Limits:**
- **SendGrid:** 100 emails/second (API limit)
- **Resend:** 10 emails/second (API limit)
- **Gmail SMTP:** 500 emails/day per account (Google limit)

**Implementation:**
```typescript
async function checkRateLimit(workspace_id: string, plan: string): Promise<boolean> {
  const limits = {
    starter: { daily: 100, per_minute: 10 },
    professional: { daily: 10000, per_minute: 100 },
    enterprise: { daily: Infinity, per_minute: 1000 }
  };

  const limit = limits[plan];

  // Check daily limit
  const dailySent = await getDailyEmailCount(workspace_id);
  if (dailySent >= limit.daily) {
    throw new Error('EMAIL_003: Daily email limit exceeded');
  }

  // Check per-minute limit (use Redis)
  const minuteKey = `rate:${workspace_id}:${Math.floor(Date.now() / 60000)}`;
  const minuteSent = await redis.incr(minuteKey);
  await redis.expire(minuteKey, 60);

  if (minuteSent > limit.per_minute) {
    throw new Error('EMAIL_003: Rate limit exceeded (100 emails/minute)');
  }

  return true;
}
```

---

### 2. Email Warmup (New Accounts)

**Purpose:** Gradually increase sending volume for new email accounts to build sender reputation

**Warmup Schedule:**
```typescript
const warmupSchedule = [
  { day: 1, limit: 10 },    // Day 1: 10 emails
  { day: 2, limit: 20 },    // Day 2: 20 emails
  { day: 3, limit: 40 },    // Day 3: 40 emails
  { day: 4, limit: 80 },    // Day 4: 80 emails
  { day: 5, limit: 150 },   // Day 5: 150 emails
  { day: 7, limit: 300 },   // Day 7: 300 emails
  { day: 10, limit: 500 },  // Day 10: 500 emails
  { day: 14, limit: 1000 }, // Day 14: Full volume
];

async function checkWarmupLimit(integration_id: string): Promise<number> {
  const integration = await getIntegration(integration_id);
  const accountAge = differenceInDays(new Date(), integration.created_at);

  // Find applicable warmup limit
  const warmup = warmupSchedule
    .reverse()
    .find(w => accountAge >= w.day);

  return warmup?.limit || warmupSchedule[warmupSchedule.length - 1].limit;
}
```

---

### 3. Bounce Handling

**Hard Bounce (Permanent Failure):**
- Mark contact email as `invalid`
- Remove from all active campaigns
- Alert team if bounce rate > 2%

**Soft Bounce (Temporary Failure):**
- Retry up to 3 times (1h, 4h, 12h delays)
- After 3 retries → Mark as `unreachable`

**Bounce Rate Alert Threshold:**
```typescript
async function calculateBounceRate(workspace_id: string): Promise<number> {
  const { sent, bounced } = await getEmailMetrics(workspace_id, {
    period: '7d' // Last 7 days
  });

  return sent > 0 ? bounced / sent : 0;
}

// Alert if > 2% (industry standard threshold)
if (bounceRate > 0.02) {
  await alertTeam({
    severity: 'critical',
    message: `Bounce rate: ${(bounceRate * 100).toFixed(2)}% (threshold: 2%)`,
    recommendation: 'Review email list quality, check SPF/DKIM/DMARC records'
  });
}
```

---

### 4. Unsubscribe Compliance

**One-Click Unsubscribe (RFC 8058):**
```typescript
// Add to all campaign emails
headers['List-Unsubscribe'] = `<https://track.unite-hub.com/u/${tracking_id}>`;
headers['List-Unsubscribe-Post'] = 'List-Unsubscribe=One-Click';
```

**Processing Time:** Unsubscribes must be processed within 5 business days (Australian Spam Act 2003)

**Re-subscription:** Contacts cannot be re-subscribed without explicit opt-in

---

## Performance Requirements

### Response Time Targets

| Operation | Target | Max Acceptable |
|-----------|--------|----------------|
| Send email | < 1s | 3s |
| Track open | < 50ms | 200ms |
| Track click | < 100ms | 300ms |
| Sync 100 Gmail emails | < 10s | 20s |
| Handle bounce webhook | < 200ms | 500ms |

### Throughput Requirements

| Metric | Target | Notes |
|--------|--------|-------|
| Emails sent per minute | 1,000+ | With provider fallback |
| Concurrent sends | 100+ | Parallel processing |
| Tracking events per second | 500+ | Opens + clicks |

### Database Optimization

**Critical Indexes:**
```sql
-- For tracking lookups (most frequent query)
CREATE INDEX idx_sent_emails_tracking_id ON sent_emails(tracking_id);

-- For email send history
CREATE INDEX idx_sent_emails_workspace_sent_at ON sent_emails(workspace_id, sent_at DESC);

-- For contact email lookup
CREATE INDEX idx_sent_emails_contact_id ON sent_emails(contact_id, sent_at DESC);

-- For campaign analytics
CREATE INDEX idx_sent_emails_campaign_composite
ON sent_emails(drip_campaign_id, status, sent_at DESC);
```

---

## Testing Strategy

### 1. Unit Tests

```typescript
describe('Email Agent - Core Functions', () => {
  describe('sendEmail', () => {
    test('should send email via primary provider', async () => {
      const result = await sendEmail({
        to: 'test@example.com',
        subject: 'Test',
        body: 'Hello',
        workspace_id: testWorkspaceId
      });

      expect(result.success).toBe(true);
      expect(result.provider).toBe('sendgrid');
      expect(result.email_id).toBeDefined();
    });

    test('should fallback to secondary provider on failure', async () => {
      // Mock SendGrid failure
      mockSendGridFailure();

      const result = await sendEmail({
        to: 'test@example.com',
        subject: 'Test',
        body: 'Hello',
        workspace_id: testWorkspaceId
      });

      expect(result.success).toBe(true);
      expect(result.provider).toBe('resend'); // Fallback
      expect(result.fallback_used).toBe(true);
    });

    test('should apply merge tags correctly', async () => {
      const result = await sendEmail({
        to: 'john@example.com',
        subject: 'Hi {{first_name}}!',
        body: 'Welcome, {{first_name}} from {{company}}',
        merge_vars: {
          first_name: 'John',
          company: 'Acme Corp'
        },
        workspace_id: testWorkspaceId
      });

      const email = await getSentEmail(result.email_id);
      expect(email.subject).toBe('Hi John!');
      expect(email.body).toContain('Welcome, John from Acme Corp');
    });
  });

  describe('trackEmailOpen', () => {
    test('should record first open', async () => {
      const email = await createTestEmail();

      const result = await trackEmailOpen(email.tracking_id, {
        ip_address: '203.123.45.67',
        user_agent: 'Mozilla/5.0...'
      });

      expect(result.first_open).toBe(true);

      const updated = await getSentEmail(email.id);
      expect(updated.opens).toBe(1);
      expect(updated.first_open_at).toBeDefined();
    });

    test('should record multiple opens', async () => {
      const email = await createTestEmail();

      await trackEmailOpen(email.tracking_id, {});
      await trackEmailOpen(email.tracking_id, {});

      const updated = await getSentEmail(email.id);
      expect(updated.opens).toBe(2);
    });
  });
});
```

---

### 2. Integration Tests

```typescript
describe('Email Agent - Provider Integration', () => {
  test('should send via SendGrid and receive webhook', async () => {
    const result = await sendEmail({
      to: 'test@example.com',
      subject: 'Test',
      body: 'Hello',
      workspace_id: testWorkspaceId,
      provider: 'sendgrid'
    });

    // Simulate SendGrid delivery webhook
    await handleDeliveryWebhook({
      provider_message_id: result.provider_message_id,
      status: 'delivered',
      timestamp: new Date().toISOString()
    });

    const email = await getSentEmail(result.email_id);
    expect(email.status).toBe('delivered');
  });
});
```

---

## Error Codes

| Code | Error | HTTP Status | Resolution |
|------|-------|-------------|------------|
| `EMAIL_001` | Missing required fields | 400 | Provide to, subject, and body |
| `EMAIL_002` | Invalid email address | 400 | Check email format |
| `EMAIL_003` | Rate limit exceeded | 429 | Wait 60 seconds or upgrade plan |
| `EMAIL_004` | All providers failed | 500 | Check provider status, verify API keys |
| `EMAIL_005` | Gmail authentication failed | 401 | Re-authenticate Gmail account |
| `EMAIL_006` | Gmail API quota exceeded | 429 | Wait for quota reset (daily limit) |
| `EMAIL_007` | Integration not found | 404 | Check integration_id, ensure not deleted |
| `EMAIL_008` | Invalid OAuth code | 400 | Re-initiate OAuth flow |
| `EMAIL_009` | Account already connected | 409 | Use existing integration |
| `EMAIL_010` | Workspace not found | 404 | Verify workspace_id |
| `EMAIL_011` | Email not found | 404 | Unknown provider_message_id |
| `EMAIL_012` | Contact not found | 404 | Contact deleted |
| `EMAIL_013` | Already unsubscribed | 409 | Idempotent operation |

---

## Australian Compliance

### 1. Spam Act 2003 Requirements

**All emails must include:**
```typescript
const complianceElements = {
  unsubscribe: 'https://track.unite-hub.com/u/{{tracking_id}}',
  sender_identity: 'Unite-Hub Pty Ltd',
  physical_address: '123 Marketing St, Sydney NSW 2000, Australia',
  from_email: 'campaigns@unite-hub.com'
};
```

**Validation:**
```typescript
function validateSpamActCompliance(email: EmailSendRequest): void {
  // Must have unsubscribe mechanism
  if (!email.body_html?.includes('unsubscribe')) {
    throw new Error('Missing unsubscribe link (Spam Act 2003)');
  }

  // Must have accurate sender info
  if (!email.from || !email.from_name) {
    throw new Error('Missing sender identity (Spam Act 2003)');
  }
}
```

---

### 2. Send Time Optimization (AEST/AEDT)

```typescript
import { zonedTimeToUtc, utcToZonedTime } from 'date-fns-tz';

function optimizeSendTime(scheduled_at: Date): Date {
  // Default: 9 AM Sydney time
  const sydneyTz = 'Australia/Sydney';
  const sydneyTime = utcToZonedTime(scheduled_at, sydneyTz);

  const hour = getHours(sydneyTime);

  // If outside business hours (9 AM - 5 PM), delay to 9 AM next day
  if (hour < 9 || hour >= 17) {
    const nextDay = addDays(sydneyTime, 1);
    const optimized = setHours(nextDay, 9);
    return zonedTimeToUtc(optimized, sydneyTz);
  }

  return scheduled_at;
}
```

---

## Security

### 1. Row Level Security (RLS)

```sql
-- Sent Emails: Users can only view emails in their workspace
CREATE POLICY "Users can view own workspace emails" ON sent_emails
  FOR SELECT
  USING (
    workspace_id IN (
      SELECT w.id FROM workspaces w
      JOIN user_organizations uo ON uo.org_id = w.org_id
      WHERE uo.user_id = auth.uid()
    )
  );
```

---

### 2. Token Encryption

```typescript
import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.EMAIL_TOKEN_ENCRYPTION_KEY; // 32-byte key
const ALGORITHM = 'aes-256-gcm';

function encryptToken(token: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);

  let encrypted = cipher.update(token, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag();

  // Return: iv:authTag:encrypted
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

function decryptToken(encryptedToken: string): string {
  const [ivHex, authTagHex, encrypted] = encryptedToken.split(':');

  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');

  const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}
```

---

## Monitoring & Metrics

### 1. Key Performance Indicators (KPIs)

```typescript
interface EmailHealthMetrics {
  // Sending health
  send_success_rate: number; // % (target: > 99%)
  avg_send_latency_ms: number; // (target: < 1000ms)
  provider_failover_rate: number; // % (alert if > 5%)

  // Deliverability health
  delivery_rate: number; // % (target: > 98%)
  bounce_rate: number; // % (alert if > 2%)
  spam_complaint_rate: number; // % (alert if > 0.1%)

  // Engagement health
  open_rate: number; // % (benchmark: 20-30%)
  click_rate: number; // % (benchmark: 2-5%)
  unsubscribe_rate: number; // % (alert if > 0.5%)

  // Infrastructure health
  gmail_sync_success_rate: number; // % (target: > 95%)
  token_refresh_success_rate: number; // % (target: > 99%)
}
```

---

## Future Enhancements

### Phase 2 (Q2 2026)
- **Email warmup automation** (AI-powered sending schedules)
- **SMTP custom domains** (send from client@yourdomain.com)
- **Advanced analytics** (cohort analysis, A/B testing)
- **Reply detection AI** (auto-categorize replies: interested, not_interested, out_of_office)

### Phase 3 (Q3-Q4 2026)
- **Multi-language support** (templates in 10+ languages)
- **Email verification API** (validate emails before sending)
- **Dedicated IP pools** (enterprise feature)
- **Custom tracking domains** (track.yourdomain.com)

---

**Status:** ✅ Specification Complete
**Next Steps:** Implement core functions → Build API endpoints → Integration testing
**Estimated Implementation:** 2-3 weeks (1 developer)
**Dependencies:** None (P0 foundational agent)

---

**Agent Specification Version:** 1.0.0
**Last Updated:** 2025-11-18
**Author:** Claude (Sonnet 4.5) via Unite-Hub Orchestrator
