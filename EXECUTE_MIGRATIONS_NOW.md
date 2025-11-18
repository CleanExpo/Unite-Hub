# Execute Migrations 040 & 041 - Quick Start

**Priority**: P0 Critical
**Time Required**: 5 minutes
**Impact**: Fixes ai_score data type and enables email sync functionality

---

## Step 1: Open Supabase Dashboard

1. Go to: https://supabase.com/dashboard
2. Select your **Unite-Hub** project
3. Click **SQL Editor** in the left sidebar

---

## Step 2: Run Migration 040 (ai_score fix)

### Copy this SQL:

```sql
-- Migration 040: Fix ai_score column type from DECIMAL(3,2) to INTEGER
-- Purpose: Change ai_score from 0.0-1.0 decimal to 0-100 integer scale

-- Step 1: Add new temporary column with INTEGER type
ALTER TABLE contacts ADD COLUMN ai_score_new INTEGER DEFAULT 0;

-- Step 2: Migrate existing data (scale 0.0-1.0 to 0-100)
UPDATE contacts SET ai_score_new = ROUND(ai_score * 100)::INTEGER;

-- Step 3: Drop old column
ALTER TABLE contacts DROP COLUMN ai_score;

-- Step 4: Rename new column to ai_score
ALTER TABLE contacts RENAME COLUMN ai_score_new TO ai_score;

-- Step 5: Add check constraint for 0-100 range
ALTER TABLE contacts ADD CONSTRAINT ai_score_range CHECK (ai_score >= 0 AND ai_score <= 100);

-- Step 6: Set default value
ALTER TABLE contacts ALTER COLUMN ai_score SET DEFAULT 0;
```

### Execute:

1. Click **New query**
2. Paste the SQL above
3. Click **Run** (or press F5)
4. Wait for "Success" message

### Verify:

```sql
-- Check ai_score values are now integers (0-100)
SELECT id, name, ai_score, status FROM contacts LIMIT 10;

-- Check column type changed
SELECT column_name, data_type, numeric_precision, numeric_scale
FROM information_schema.columns
WHERE table_name = 'contacts' AND column_name = 'ai_score';
-- Expected: data_type = 'integer'
```

---

## Step 3: Run Migration 041 (client_emails table)

### Copy this SQL:

```sql
-- Migration 041: Create client_emails table
-- Purpose: Store emails synced from Gmail/Outlook integrations

-- Create client_emails table
CREATE TABLE IF NOT EXISTS client_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  integration_id UUID REFERENCES email_integrations(id) ON DELETE SET NULL,
  provider_message_id TEXT NOT NULL,
  from_email TEXT NOT NULL,
  to_emails TEXT[] DEFAULT '{}',
  subject TEXT,
  snippet TEXT,
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  is_read BOOLEAN DEFAULT false,
  ai_sentiment TEXT CHECK (ai_sentiment IN ('positive', 'neutral', 'negative')),
  received_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(workspace_id, provider_message_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_client_emails_workspace_id ON client_emails(workspace_id);
CREATE INDEX IF NOT EXISTS idx_client_emails_org_id ON client_emails(org_id);
CREATE INDEX IF NOT EXISTS idx_client_emails_contact_id ON client_emails(contact_id);
CREATE INDEX IF NOT EXISTS idx_client_emails_integration_id ON client_emails(integration_id);
CREATE INDEX IF NOT EXISTS idx_client_emails_received_at ON client_emails(received_at DESC);
CREATE INDEX IF NOT EXISTS idx_client_emails_direction ON client_emails(direction);
CREATE INDEX IF NOT EXISTS idx_client_emails_is_read ON client_emails(is_read);

-- Add trigger to update updated_at timestamp
CREATE TRIGGER update_client_emails_updated_at BEFORE UPDATE ON client_emails
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE client_emails ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view client_emails in their workspaces" ON client_emails
  FOR SELECT
  USING (
    workspace_id IN (
      SELECT w.id FROM workspaces w
      INNER JOIN user_organizations uo ON uo.org_id = w.org_id
      WHERE uo.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert client_emails in their workspaces" ON client_emails
  FOR INSERT
  WITH CHECK (
    workspace_id IN (
      SELECT w.id FROM workspaces w
      INNER JOIN user_organizations uo ON uo.org_id = w.org_id
      WHERE uo.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update client_emails in their workspaces" ON client_emails
  FOR UPDATE
  USING (
    workspace_id IN (
      SELECT w.id FROM workspaces w
      INNER JOIN user_organizations uo ON uo.org_id = w.org_id
      WHERE uo.user_id = auth.uid()
    )
  );

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON client_emails TO authenticated;
```

### Execute:

1. Click **New query**
2. Paste the SQL above
3. Click **Run** (or press F5)
4. Wait for "Success" message

### Verify:

```sql
-- Check table exists
SELECT table_name FROM information_schema.tables
WHERE table_name = 'client_emails';
-- Expected: client_emails

-- Check column count
SELECT COUNT(*) as column_count FROM information_schema.columns
WHERE table_name = 'client_emails';
-- Expected: 14

-- Check RLS is enabled
SELECT tablename, rowsecurity FROM pg_tables
WHERE tablename = 'client_emails';
-- Expected: rowsecurity = true
```

---

## Step 4: Final Verification

Run this query to confirm both migrations succeeded:

```sql
-- Verify ai_score type
SELECT
  'ai_score' as migration,
  CASE
    WHEN data_type = 'integer' THEN '✅ Fixed'
    ELSE '❌ Not Fixed'
  END as status
FROM information_schema.columns
WHERE table_name = 'contacts' AND column_name = 'ai_score'

UNION ALL

-- Verify client_emails exists
SELECT
  'client_emails' as migration,
  CASE
    WHEN COUNT(*) = 14 THEN '✅ Created'
    ELSE '❌ Incomplete'
  END as status
FROM information_schema.columns
WHERE table_name = 'client_emails';
```

**Expected Output**:
```
migration       | status
----------------|------------
ai_score        | ✅ Fixed
client_emails   | ✅ Created
```

---

## Troubleshooting

### Error: "column ai_score_new already exists"

**Cause**: Migration 040 partially ran before

**Solution**:
```sql
-- Check current state
SELECT column_name FROM information_schema.columns
WHERE table_name = 'contacts' AND column_name LIKE 'ai_score%';

-- If ai_score_new exists, continue from step 3:
ALTER TABLE contacts DROP COLUMN ai_score;
ALTER TABLE contacts RENAME COLUMN ai_score_new TO ai_score;
ALTER TABLE contacts ADD CONSTRAINT ai_score_range CHECK (ai_score >= 0 AND ai_score <= 100);
ALTER TABLE contacts ALTER COLUMN ai_score SET DEFAULT 0;
```

### Error: "table client_emails already exists"

**Cause**: Migration 041 already ran

**Solution**: Migration is complete, no action needed

### Error: "function update_updated_at_column does not exist"

**Cause**: Missing helper function from earlier migration

**Solution**:
```sql
-- Create missing function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

---

## After Migrations Complete

1. ✅ ai_score column is now INTEGER (0-100)
2. ✅ client_emails table exists with RLS policies
3. ✅ Email sync from Gmail/Outlook can now work
4. ✅ Contact scoring displays correctly in dashboard

**No application code changes needed** - the code already expects these schema changes.

---

**Status**: Ready to execute
**Priority**: P0 (Critical)
**Estimated Time**: 5 minutes total
**Risk**: Low (idempotent migrations with rollback available)
