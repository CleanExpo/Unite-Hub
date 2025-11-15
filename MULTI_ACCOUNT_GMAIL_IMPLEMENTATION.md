# Multi-Account Gmail Integration - Implementation Guide

## Overview

This implementation adds support for connecting multiple Gmail accounts per workspace in Unite-Hub. Users can:

- Connect unlimited Gmail accounts
- Label accounts (Personal, Work, Sales, etc.)
- Set one account as primary for sending emails
- Enable/disable sync per account
- Sync emails from all accounts into a unified inbox
- Send emails from specific accounts

## Architecture

### Database Schema

**New Table: `email_integrations`**
- Supports multiple accounts per workspace
- Tracks OAuth tokens, sync status, and errors
- Enforces unique constraint: one email per workspace
- Database trigger ensures only one primary account per workspace

**New Tables:**
- `sent_emails` - Track sent emails with open/click metrics
- `email_opens` - Track email opens
- `email_clicks` - Track email clicks

### Service Layer

**File:** `src/lib/integrations/gmail-multi-account.ts`

Key functions:
- `getGmailAuthUrl()` - Generate OAuth URL with account selection
- `handleGmailCallback()` - Handle OAuth, check for duplicates, set primary
- `syncGmailEmails()` - Sync emails from one account
- `syncAllGmailAccounts()` - Sync from all enabled accounts
- `sendEmailViaGmail()` - Send from specific or primary account
- `setPrimaryAccount()` - Set primary account
- `toggleSync()` - Enable/disable sync
- `disconnectGmailAccount()` - Soft delete account

### API Routes

All routes in `src/app/api/integrations/gmail/`:

1. **POST `/connect-multi`** - Generate OAuth URL
   - Body: `{ orgId, workspaceId }`
   - Returns: `{ authUrl }`

2. **GET `/callback-multi`** - Handle OAuth callback
   - Query: `code`, `state`
   - Redirects to settings page with success message

3. **GET `/list`** - List all accounts for workspace
   - Query: `workspaceId`
   - Returns: `{ integrations: [...] }`

4. **POST `/update-label`** - Update account label
   - Body: `{ integrationId, label }`

5. **POST `/set-primary`** - Set primary account
   - Body: `{ workspaceId, integrationId }`

6. **POST `/toggle-sync`** - Enable/disable sync
   - Body: `{ integrationId, enabled }`

7. **POST `/disconnect`** - Disconnect account
   - Body: `{ integrationId }`

8. **POST `/sync-all`** - Sync all accounts
   - Body: `{ workspaceId }`
   - Returns: `{ totalImported, results, errors }`

### UI Components

**Page:** `src/app/dashboard/settings/integrations/page.tsx`

Features:
- List all connected Gmail accounts
- Show account labels, primary badge, sync status
- Edit account labels (dialog)
- Toggle sync enabled/disabled (switch)
- Set primary account (star icon)
- Disconnect account (trash icon)
- Add another account (button)
- Sync all accounts (button)

## Installation Steps

### 1. Run Database Migration

```bash
# Apply migration to Supabase
cd Unite-Hub
# Upload supabase/migrations/004_email_integrations.sql to Supabase Dashboard
# OR use Supabase CLI:
supabase db push
```

This creates:
- `email_integrations` table
- `sent_emails` table
- `email_opens` table
- `email_clicks` table
- Indexes for performance
- RLS policies
- Database triggers for primary account enforcement

### 2. Update Database Wrapper

**File:** `src/lib/db.ts`

Add these methods to `db.emailIntegrations`:

```typescript
// REPLACE existing emailIntegrations object with code from:
// src/lib/db-email-integrations-patch.ts

// Key additions:
// - getByEmail(workspaceId, provider, emailAddress)
// - getPrimary(workspaceId)
// - Fix supabaseServer calls to use getSupabaseServer()
```

**IMPORTANT:** Search for all uses of `supabaseServer` and replace with:
```typescript
const supabaseServer = getSupabaseServer();
```

### 3. Update OAuth Callback Route

**Option A:** Update existing route to use workspaceId

Update `src/app/api/integrations/gmail/callback/route.ts`:
```typescript
// Change redirect to use new callback-multi route
// OR update to handle workspace_id in state
```

**Option B:** Use new routes exclusively

Update Settings page to use `/api/integrations/gmail/connect-multi`

### 4. Update Settings Navigation

Add "Integrations" link to dashboard navigation:

**File:** `src/app/dashboard/layout.tsx`

```typescript
{
  name: "Settings",
  href: "/dashboard/settings/integrations",
  icon: Settings,
}
```

### 5. Update Email Sync Cron Job

If you have a cron job or scheduled task for email sync:

```typescript
// OLD: Sync single integration
await syncGmailEmails(integrationId);

// NEW: Sync all accounts in workspace
import { syncAllGmailAccounts } from "@/lib/integrations/gmail-multi-account";
const results = await syncAllGmailAccounts(workspaceId);
```

## Usage Examples

### Connect New Gmail Account

```typescript
// User clicks "Connect Gmail" button
const res = await fetch("/api/integrations/gmail/connect-multi", {
  method: "POST",
  body: JSON.stringify({ orgId, workspaceId }),
});
const { authUrl } = await res.json();
window.location.href = authUrl; // Redirect to Google OAuth
```

### List Connected Accounts

```typescript
const res = await fetch(`/api/integrations/gmail/list?workspaceId=${workspaceId}`);
const { integrations } = await res.json();

// integrations = [
//   {
//     id: "uuid",
//     email_address: "john@company.com",
//     account_label: "Work",
//     is_primary: true,
//     sync_enabled: true,
//     ...
//   }
// ]
```

### Send Email from Specific Account

```typescript
import { sendEmailViaGmail } from "@/lib/integrations/gmail-multi-account";

// Send from primary account
await sendEmailViaGmail(workspaceId, "recipient@example.com", "Subject", "Body");

// Send from specific account
await sendEmailViaGmail(
  workspaceId,
  "recipient@example.com",
  "Subject",
  "Body",
  { integrationId: "specific-account-id" }
);
```

### Sync All Accounts

```typescript
const res = await fetch("/api/integrations/gmail/sync-all", {
  method: "POST",
  body: JSON.stringify({ workspaceId }),
});
const { totalImported, results, hasErrors } = await res.json();

console.log(`Imported ${totalImported} emails`);
if (hasErrors) {
  console.error("Some accounts failed:", results.filter(r => r.error));
}
```

## Data Flow

### OAuth Connection Flow

```
1. User clicks "Connect Gmail"
   ↓
2. POST /api/integrations/gmail/connect-multi
   ↓
3. Generate OAuth URL with state={ orgId, workspaceId }
   ↓
4. Redirect to Google (prompt=select_account)
   ↓
5. User selects Google account
   ↓
6. Google redirects to /api/integrations/gmail/callback-multi?code=xxx&state=yyy
   ↓
7. handleGmailCallback()
   - Exchange code for tokens
   - Get Gmail profile (email address)
   - Check if email already exists in workspace
   - If exists: Update tokens
   - If new: Create integration (first account = primary)
   ↓
8. Redirect to settings page with success message
```

### Email Sync Flow

```
1. User clicks "Sync All Accounts"
   ↓
2. POST /api/integrations/gmail/sync-all
   ↓
3. Get all integrations where sync_enabled = true
   ↓
4. For each integration:
   - Refresh token if expired
   - Fetch unread emails from Gmail API
   - Extract sender info
   - Create/update contact
   - Create email record (linked to integration_id)
   - Mark as read in Gmail
   ↓
5. Update last_sync_at timestamp
   ↓
6. Return results { totalImported, errors }
```

### Sending Email Flow

```
1. User composes email and clicks "Send"
   ↓
2. UI allows selecting which account to send from
   ↓
3. Call sendEmailViaGmail(workspaceId, to, subject, body, { integrationId })
   ↓
4. If integrationId provided: Use that account
   If not: Use primary account (is_primary = true)
   ↓
5. Set OAuth credentials
   ↓
6. Send via Gmail API
   ↓
7. Track sent email in sent_emails table
   ↓
8. Add tracking pixel for open tracking (optional)
```

## Testing Checklist

### Manual Testing

- [ ] Connect first Gmail account (should be set as primary)
- [ ] Connect second Gmail account (should NOT be primary)
- [ ] Edit account label (e.g., "Personal" → "Work Email")
- [ ] Set second account as primary (first should lose primary badge)
- [ ] Toggle sync off for an account
- [ ] Sync all accounts (should skip disabled account)
- [ ] Disconnect an account
- [ ] Try to connect same email again (should update tokens, not create duplicate)
- [ ] Send email from primary account
- [ ] Send email from specific account
- [ ] Verify emails are tagged with correct integration_id

### Edge Cases

- [ ] Connect account when no accounts exist (should be primary)
- [ ] Disconnect primary account (should auto-set another as primary?)
- [ ] Disable sync on primary account (sending should still work)
- [ ] Token expiration (should auto-refresh)
- [ ] Gmail API rate limit (should handle gracefully)
- [ ] Missing refresh token (should show error)
- [ ] Revoked OAuth access (should mark account as inactive)

### Security Testing

- [ ] Verify RLS policies prevent cross-workspace access
- [ ] Ensure access tokens not returned to client
- [ ] Test OAuth state parameter tampering
- [ ] Verify workspace_id validation in all routes

## Migration from Single to Multi-Account

If you have existing single-account integrations:

### Option A: Automatic Migration Script

```typescript
// scripts/migrate-to-multi-account.ts
import { db } from "@/lib/db";

async function migrateSingleAccounts() {
  const orgs = await db.organizations.listAll();

  for (const org of orgs.data) {
    // Get legacy integration (if exists)
    const legacyIntegrations = await db.emailIntegrations.getByOrg(org.id);

    for (const integration of legacyIntegrations) {
      // Ensure workspace_id is set
      if (!integration.workspace_id) {
        const workspaces = await db.workspaces.listByOrg(org.id);
        if (workspaces.length > 0) {
          await db.emailIntegrations.update(integration.id, {
            workspace_id: workspaces[0].id,
            is_primary: true, // Existing account becomes primary
            sync_enabled: true,
            account_label: "Primary Gmail",
          });
        }
      }
    }
  }
}
```

### Option B: Manual Migration

1. Export existing integrations
2. Add workspace_id to each
3. Set is_primary = true for first account per workspace
4. Re-import

## Troubleshooting

### "No integrations found" error

**Cause:** workspace_id not set or wrong workspace queried

**Fix:**
```typescript
// Verify workspace_id is UUID, not "default-org"
console.log(currentOrganization?.org_id);

// Should be: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
// Not: "default-org"
```

### Duplicate email error

**Cause:** Trying to connect same email twice to same workspace

**Expected:** Should update existing integration, not create duplicate

**Fix:** Check `handleGmailCallback()` logic for `getByEmail()` check

### Sync returns 0 emails but Gmail has unread messages

**Possible causes:**
- Token expired (should auto-refresh)
- sync_enabled = false
- Gmail API query incorrect
- RLS policy blocking query

**Debug:**
```typescript
// Check integration
const integration = await db.emailIntegrations.getById(integrationId);
console.log({
  email: integration.email_address,
  sync_enabled: integration.sync_enabled,
  token_expires_at: integration.token_expires_at,
  last_sync_at: integration.last_sync_at,
  sync_error: integration.sync_error,
});
```

### Primary account not enforced

**Cause:** Database trigger not created

**Fix:**
```sql
-- Verify trigger exists
SELECT * FROM pg_trigger WHERE tgname = 'enforce_single_primary_integration';

-- If missing, re-run migration:
-- supabase/migrations/004_email_integrations.sql
```

## Performance Considerations

### Sync Performance

- Default: 20 emails per account per sync
- With 5 accounts: 100 emails max per sync
- Increase `maxResults` if needed (max 500 per Gmail API call)

### Database Indexes

All critical indexes created by migration:
- `idx_email_integrations_workspace_id`
- `idx_email_integrations_email_address`
- `idx_email_integrations_is_primary`
- `idx_sent_emails_integration_id`

### Caching

Consider caching:
- Integration list (5-minute cache)
- Primary account lookup (in-memory cache)

## Future Enhancements

### V2 Features

- **Unified Inbox UI:** Show emails from all accounts in one view
- **Per-Account Filters:** Filter contacts by which account received emails
- **Send From UI:** Dropdown to select sending account
- **Account Quotas:** Track Gmail API quota per account
- **Incremental Sync:** Use `historyId` for faster syncs
- **Real-time Sync:** Pub/Sub notifications from Gmail
- **Multi-Provider:** Add Outlook, Office 365, IMAP support

### Optimization Ideas

- **Batch Processing:** Process multiple accounts in parallel
- **Smart Sync:** Only sync accounts with new emails (check historyId)
- **Webhook Integration:** Gmail push notifications instead of polling
- **Account Analytics:** Track emails sent/received per account

## Support

For issues or questions:

1. Check this guide first
2. Review error logs in `sync_error` field
3. Test with fresh OAuth (disconnect + reconnect)
4. Verify database migration applied correctly
5. Check Supabase logs for RLS policy blocks

## Summary

This implementation provides a complete multi-account Gmail integration system with:

✅ Unlimited Gmail accounts per workspace
✅ Account labeling and primary account selection
✅ Per-account sync control
✅ Unified email sync from all accounts
✅ Send from specific accounts
✅ Proper error handling and sync status tracking
✅ Clean, modern UI for account management
✅ Database-enforced constraints (unique emails, single primary)
✅ Full OAuth 2.0 flow with account selection

**Status:** Ready for production use after migration and testing
