# How to Run Migration 041 - Create client_emails Table

## Problem

The `client_emails` table is referenced throughout the codebase (email integrations, Gmail/Outlook sync) but was never properly created in the database schema.

**Missing Table**: `client_emails`

**Used By**:
- Gmail integration (`src/lib/integrations/gmail.ts`)
- Outlook integration (`src/lib/integrations/outlook.ts`)
- Email processing agents
- Contact detail page (`src/app/dashboard/contacts/[id]/page.tsx`)

## Impact

- **Breaking Change**: No - creates new table
- **Data Loss**: No - new table, no existing data
- **Downtime Required**: No - migration runs in seconds
- **Affects**: Email integration features (currently broken)

## Migration Steps

### Option 1: Supabase Dashboard (Recommended)

1. **Go to Supabase Dashboard**
   - Navigate to: https://supabase.com/dashboard
   - Select your project: Unite-Hub

2. **Open SQL Editor**
   - Click "SQL Editor" in left sidebar
   - Click "New query"

3. **Copy/Paste Migration SQL**
   - Open: `supabase/migrations/041_create_client_emails_table.sql`
   - Copy entire contents
   - Paste into SQL Editor

4. **Run Migration**
   - Click "Run" button
   - Wait for success message

5. **Verify Results**
   ```sql
   -- Check table exists
   SELECT table_name FROM information_schema.tables
   WHERE table_name = 'client_emails';
   -- Expected: client_emails

   -- Check table structure
   \d client_emails;
   -- Expected: 14 columns with proper types

   -- Check RLS enabled
   SELECT tablename, rowsecurity FROM pg_tables
   WHERE tablename = 'client_emails';
   -- Expected: rowsecurity = true
   ```

### Option 2: Supabase CLI

```bash
# Navigate to project directory
cd Unite-Hub

# Run migration
supabase db push

# Verify
supabase db diff
```

## What This Migration Does

1. **Creates client_emails table** with 14 columns:
   - `id` - UUID primary key
   - `workspace_id` - Links to workspace (required)
   - `org_id` - Links to organization (required)
   - `integration_id` - Links to email_integrations (optional)
   - `provider_message_id` - Unique message ID from Gmail/Outlook
   - `from_email` - Sender email address
   - `to_emails` - Array of recipient emails
   - `subject` - Email subject line
   - `snippet` - Email preview text
   - `contact_id` - Links to contact (optional)
   - `direction` - 'inbound' or 'outbound'
   - `is_read` - Read/unread status
   - `ai_sentiment` - AI-analyzed sentiment (positive/neutral/negative)
   - `received_at` - When email was received
   - `created_at` - When record was created
   - `updated_at` - When record was last updated

2. **Creates 7 indexes** for query performance:
   - workspace_id, org_id, contact_id, integration_id
   - received_at (DESC), direction, is_read

3. **Adds updated_at trigger** to automatically update timestamps

4. **Enables Row Level Security** with 3 policies:
   - Users can view emails in their workspaces
   - Users can insert emails in their workspaces
   - Users can update emails in their workspaces

5. **Adds unique constraint** on (workspace_id, provider_message_id) to prevent duplicates

## Schema Details

```sql
CREATE TABLE client_emails (
  id UUID PRIMARY KEY,
  workspace_id UUID NOT NULL,       -- Links to workspaces
  org_id UUID NOT NULL,              -- Links to organizations
  integration_id UUID,               -- Links to email_integrations
  provider_message_id TEXT NOT NULL, -- Gmail/Outlook message ID
  from_email TEXT NOT NULL,          -- Sender
  to_emails TEXT[],                  -- Recipients
  subject TEXT,                      -- Subject line
  snippet TEXT,                      -- Preview
  contact_id UUID,                   -- Links to contacts
  direction TEXT NOT NULL,           -- inbound/outbound
  is_read BOOLEAN,                   -- Read status
  ai_sentiment TEXT,                 -- AI sentiment analysis
  received_at TIMESTAMPTZ NOT NULL,  -- Received timestamp
  created_at TIMESTAMPTZ NOT NULL,   -- Created timestamp
  updated_at TIMESTAMPTZ NOT NULL,   -- Updated timestamp
  UNIQUE(workspace_id, provider_message_id)
);
```

## Post-Migration Testing

1. **Test Gmail Integration**
   - Go to `/dashboard/settings` → Integrations
   - Connect Gmail account
   - Sync emails
   - Verify emails appear in database:
     ```sql
     SELECT COUNT(*) FROM client_emails;
     ```

2. **Test Contact Email History**
   - Navigate to `/dashboard/contacts/[id]`
   - Check "Email History" section
   - Verify emails display correctly

3. **Test Email Search**
   - Search for emails by subject/sender
   - Verify results return correctly

## Rollback (If Needed)

If you need to rollback this migration:

```sql
-- WARNING: This will delete all synced email data
DROP TABLE IF EXISTS client_emails CASCADE;
```

## Dependencies

This migration requires these tables to exist:
- `workspaces` ✅ (from migration 001)
- `organizations` ✅ (from migration 001)
- `contacts` ✅ (from migration 001)
- `email_integrations` ✅ (from migration 004)
- `user_organizations` ✅ (from migration 003)

If any dependency is missing, create it first before running this migration.

## Files Modified

- `supabase/migrations/041_create_client_emails_table.sql` (NEW)

## Related Issues

- P0-6: Fix database schema - client_emails table
- Production Readiness Audit Issue #6
- Gmail integration broken (no table to store emails)
- Outlook integration broken (no table to store emails)

---

**Created**: 2025-01-18
**Status**: Ready to run
**Estimated Time**: < 1 minute
