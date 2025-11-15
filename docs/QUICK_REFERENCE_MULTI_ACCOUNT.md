# Multi-Account Gmail - Quick Reference

## Installation (5 Minutes)

```bash
# 1. Apply database migration
# Upload supabase/migrations/004_email_integrations.sql to Supabase Dashboard

# 2. Update db.ts
# Add methods from src/lib/db-email-integrations-patch.ts

# 3. Start dev server
npm run dev

# 4. Navigate to settings
# http://localhost:3008/dashboard/settings/integrations
```

## Common Code Snippets

### Connect Gmail Account

```typescript
const res = await fetch("/api/integrations/gmail/connect-multi", {
  method: "POST",
  body: JSON.stringify({ orgId, workspaceId }),
});
const { authUrl } = await res.json();
window.location.href = authUrl;
```

### List All Accounts

```typescript
const res = await fetch(`/api/integrations/gmail/list?workspaceId=${workspaceId}`);
const { integrations } = await res.json();

integrations.forEach(account => {
  console.log(account.email_address, account.is_primary);
});
```

### Sync All Accounts

```typescript
const res = await fetch("/api/integrations/gmail/sync-all", {
  method: "POST",
  body: JSON.stringify({ workspaceId }),
});
const { totalImported, hasErrors } = await res.json();
```

### Send Email from Specific Account

```typescript
import { sendEmailViaGmail } from "@/lib/integrations/gmail-multi-account";

// From primary account
await sendEmailViaGmail(workspaceId, "to@example.com", "Subject", "Body");

// From specific account
await sendEmailViaGmail(
  workspaceId,
  "to@example.com",
  "Subject",
  "Body",
  { integrationId: "account-uuid" }
);
```

### Set Primary Account

```typescript
await fetch("/api/integrations/gmail/set-primary", {
  method: "POST",
  body: JSON.stringify({ workspaceId, integrationId }),
});
```

### Update Account Label

```typescript
await fetch("/api/integrations/gmail/update-label", {
  method: "POST",
  body: JSON.stringify({ integrationId, label: "Work Email" }),
});
```

### Toggle Sync

```typescript
await fetch("/api/integrations/gmail/toggle-sync", {
  method: "POST",
  body: JSON.stringify({ integrationId, enabled: true }),
});
```

### Disconnect Account

```typescript
await fetch("/api/integrations/gmail/disconnect", {
  method: "POST",
  body: JSON.stringify({ integrationId }),
});
```

## Database Queries

### Get Primary Account

```typescript
const primary = await db.emailIntegrations.getPrimary(workspaceId);
```

### Get Account by Email

```typescript
const account = await db.emailIntegrations.getByEmail(
  workspaceId,
  "gmail",
  "user@example.com"
);
```

### Get All Accounts

```typescript
const accounts = await db.emailIntegrations.getByWorkspace(workspaceId);
```

### Create Sent Email Record

```typescript
await db.sentEmails.create({
  workspace_id: workspaceId,
  contact_id: contactId,
  integration_id: integrationId,
  from_email: "sender@example.com",
  to_email: "recipient@example.com",
  subject: "Subject",
  body: "Body",
});
```

## Environment Variables

```env
# Required for Gmail integration
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
NEXT_PUBLIC_URL=http://localhost:3008

# Supabase (already configured)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## Troubleshooting

### No accounts showing up
```typescript
// Debug workspace ID
console.log(currentOrganization?.org_id);
// Should be UUID, not "default-org"
```

### Duplicate email error
```typescript
// Check if account exists
const existing = await db.emailIntegrations.getByEmail(
  workspaceId,
  "gmail",
  emailAddress
);
if (existing) {
  // Update instead of create
  await db.emailIntegrations.update(existing.id, { ...newData });
}
```

### Sync returns 0 emails
```typescript
// Check account status
const account = await db.emailIntegrations.getById(integrationId);
console.log({
  sync_enabled: account.sync_enabled,
  is_active: account.is_active,
  sync_error: account.sync_error,
  token_expires_at: account.token_expires_at,
});
```

### Primary not enforced
```sql
-- Verify trigger exists
SELECT * FROM pg_trigger
WHERE tgname = 'enforce_single_primary_integration';
```

## Testing Commands

### Check Migration Applied

```sql
-- Run in Supabase SQL Editor
SELECT * FROM email_integrations LIMIT 1;
```

### Manual Account Creation

```sql
INSERT INTO email_integrations (
  workspace_id,
  org_id,
  provider,
  email_address,
  account_label,
  is_primary,
  sync_enabled,
  is_active,
  access_token,
  refresh_token
) VALUES (
  'your-workspace-uuid',
  'your-org-uuid',
  'gmail',
  'test@example.com',
  'Test Account',
  true,
  true,
  true,
  'test-access-token',
  'test-refresh-token'
);
```

### Check Account Count

```sql
SELECT workspace_id, COUNT(*) as account_count
FROM email_integrations
WHERE is_active = true
GROUP BY workspace_id;
```

## UI Components

### Import Statements

```typescript
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
```

### Toast Notifications

```typescript
const { toast } = useToast();

// Success
toast({
  title: "Success",
  description: "Account connected successfully",
});

// Error
toast({
  title: "Error",
  description: error.message,
  variant: "destructive",
});
```

## File Locations

```
Database:
  supabase/migrations/004_email_integrations.sql

Service Layer:
  src/lib/integrations/gmail-multi-account.ts
  src/lib/db.ts (update required)
  src/lib/db-email-integrations-patch.ts (reference)

API Routes:
  src/app/api/integrations/gmail/connect-multi/route.ts
  src/app/api/integrations/gmail/callback-multi/route.ts
  src/app/api/integrations/gmail/list/route.ts
  src/app/api/integrations/gmail/update-label/route.ts
  src/app/api/integrations/gmail/set-primary/route.ts
  src/app/api/integrations/gmail/toggle-sync/route.ts
  src/app/api/integrations/gmail/disconnect/route.ts
  src/app/api/integrations/gmail/sync-all/route.ts

UI:
  src/app/dashboard/settings/integrations/page.tsx

Documentation:
  MULTI_ACCOUNT_GMAIL_IMPLEMENTATION.md (full guide)
  MULTI_ACCOUNT_SUMMARY.md (overview)
  docs/multi-account-gmail-architecture.md (diagrams)
```

## Key Tables

```
email_integrations  - Account storage
sent_emails         - Sent email tracking
email_opens         - Open tracking
email_clicks        - Click tracking
emails              - Received emails
contacts            - Contact records
```

## Key Indexes

```
idx_email_integrations_workspace_id
idx_email_integrations_is_primary
idx_email_integrations_email_address
idx_sent_emails_integration_id
idx_sent_emails_workspace_id
```

## Database Constraints

```sql
-- Unique email per workspace
UNIQUE(workspace_id, provider, email_address)

-- Only one primary account (enforced by trigger)
-- See: ensure_single_primary_integration()
```

## API Response Formats

### List Accounts Response

```json
{
  "integrations": [
    {
      "id": "uuid",
      "email_address": "user@example.com",
      "account_label": "Work",
      "provider": "gmail",
      "is_primary": true,
      "sync_enabled": true,
      "is_active": true,
      "last_sync_at": "2025-11-15T10:30:00Z",
      "sync_error": null,
      "created_at": "2025-11-15T09:00:00Z"
    }
  ]
}
```

### Sync All Response

```json
{
  "success": true,
  "totalImported": 25,
  "results": [
    {
      "integrationId": "uuid-1",
      "email": "work@example.com",
      "imported": 15,
      "total": 15
    },
    {
      "integrationId": "uuid-2",
      "email": "personal@example.com",
      "imported": 10,
      "total": 10
    }
  ],
  "hasErrors": false,
  "errors": []
}
```

## Performance Tips

1. **Batch Sync:** Use `/sync-all` instead of individual syncs
2. **Index Usage:** Always filter by `workspace_id` first
3. **Token Refresh:** Happens automatically, don't manually trigger
4. **Pagination:** Use `limit` parameter for large account lists

## Security Checklist

- [ ] RLS policies enabled on all tables
- [ ] Access tokens never sent to client
- [ ] Workspace ID validated in all routes
- [ ] OAuth state parameter verified
- [ ] Refresh tokens encrypted in database

## Next Steps After Installation

1. Test first account connection
2. Test second account connection
3. Verify primary account badge
4. Test sync functionality
5. Test send from different accounts
6. Review error handling
7. Add to production after testing

## Support Resources

- Full Guide: `MULTI_ACCOUNT_GMAIL_IMPLEMENTATION.md`
- Summary: `MULTI_ACCOUNT_SUMMARY.md`
- Architecture: `docs/multi-account-gmail-architecture.md`
- Setup Script: `scripts/setup-multi-account-gmail.sh`

---

**Quick Reference Version:** 1.0.0
**Last Updated:** 2025-11-15
