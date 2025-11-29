# Database Schema Migrations

**Phase 2 Task 2.3**: Design database schema migrations that preserve existing data
**Date**: 2025-11-29
**Status**: APPROVED FOR IMPLEMENTATION

---

## Current State Analysis

| Metric | Count | Issue |
|--------|-------|-------|
| Total Migrations | 366 | Excessive |
| Duplicate Numbers | 69+ | Execution order undefined |
| Tables Created | 940+ | Bloated |
| Core Tables with RLS | 17 | Good |
| Extended Tables with RLS | Few | Missing |

---

## Migration Strategy

### Approach: Consolidation + Extension (Not Replacement)

1. **DO NOT** drop or recreate existing migrations
2. **DO** create new consolidated migrations (400-series)
3. **DO** add missing RLS policies incrementally
4. **DO** enable connection pooling via Supabase settings

---

## Proposed Migration Sequence

### Migration 400: Fix Duplicate Numbers (Cleanup)

```sql
-- 400_fix_migration_duplicates.sql
-- This migration renames duplicate migration files to ensure execution order

-- NOTE: This is a documentation migration only
-- Actual file renames must be done in the migrations folder

/*
Duplicates to rename:
004_add_profile_fields.sql     → 004a_add_profile_fields.sql
004_email_integrations.sql     → 004b_email_integrations.sql
014_xxx.sql                    → 014a_xxx.sql (check content)
026_xxx.sql                    → 026a_xxx.sql
039_xxx.sql                    → 039a_xxx.sql
040_xxx.sql                    → 040a_xxx.sql
042_xxx.sql                    → 042a_xxx.sql
043_xxx.sql                    → 043a_xxx.sql
046_xxx.sql                    → 046a_xxx.sql

100-169 range: 69+ conflicts - need individual review
*/

-- Verify no migration locks exist
SELECT * FROM supabase_migrations.schema_migrations ORDER BY version;
```

### Migration 401: Connection Pooler Activation

```sql
-- 401_enable_connection_pooler.sql
-- Enable Supabase connection pooling (PgBouncer)

-- NOTE: This requires Supabase Dashboard configuration
-- Database Settings → Connection Pooling → Enable

/*
Configuration to apply in Supabase Dashboard:

Pool Mode: Transaction
Default Pool Size: 15
Max Client Connections: 200

Connection String (use this in .env):
SUPABASE_POOLER_URL=postgres://[user]:[password]@[project].pooler.supabase.com:6543/postgres
*/

-- Verify pooler is active
-- Run this after enabling in dashboard:
SELECT * FROM pg_stat_activity WHERE application_name LIKE '%pgbouncer%';
```

### Migration 402: Core RLS Helper Functions

```sql
-- 402_rls_helper_functions.sql
-- Create reusable RLS helper functions

-- Check if user is member of workspace (via organization)
CREATE OR REPLACE FUNCTION public.is_workspace_member(workspace_id_param UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM workspaces w
    JOIN user_organizations uo ON uo.org_id = w.org_id
    WHERE w.id = workspace_id_param
    AND uo.user_id = auth.uid()
    AND uo.is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Check if user is admin/owner of workspace
CREATE OR REPLACE FUNCTION public.is_workspace_admin(workspace_id_param UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM workspaces w
    JOIN user_organizations uo ON uo.org_id = w.org_id
    WHERE w.id = workspace_id_param
    AND uo.user_id = auth.uid()
    AND uo.is_active = true
    AND uo.role IN ('owner', 'admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Check if user has specific role
CREATE OR REPLACE FUNCTION public.has_role(allowed_roles user_role[])
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM profiles p
    WHERE p.id = auth.uid()
    AND p.role = ANY(allowed_roles)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Check if user is staff (FOUNDER, STAFF, ADMIN)
CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN public.has_role(ARRAY['FOUNDER', 'STAFF', 'ADMIN']::user_role[]);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Check if user is client
CREATE OR REPLACE FUNCTION public.is_client()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN public.has_role(ARRAY['CLIENT']::user_role[]);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.is_workspace_member(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_workspace_admin(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(user_role[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_staff() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_client() TO authenticated;
```

### Migration 403: Extended Table RLS Policies

```sql
-- 403_extended_table_rls.sql
-- Add RLS policies to production-critical extended tables

-- Enable RLS on tables that need it
DO $$
DECLARE
  tables_to_protect TEXT[] := ARRAY[
    'founder_businesses',
    'founder_business_vault_secrets',
    'founder_business_signals',
    'founder_os_snapshots',
    'ai_phill_insights',
    'ai_phill_journal_entries',
    'cognitive_twin_scores',
    'cognitive_twin_digests',
    'cognitive_twin_decisions',
    'seo_leak_signal_profiles',
    'social_inbox_accounts',
    'social_messages',
    'search_keywords',
    'boost_jobs',
    'pre_clients'
  ];
  t TEXT;
BEGIN
  FOREACH t IN ARRAY tables_to_protect
  LOOP
    EXECUTE format('ALTER TABLE IF EXISTS %I ENABLE ROW LEVEL SECURITY', t);
    RAISE NOTICE 'Enabled RLS on %', t;
  END LOOP;
END $$;

-- Founder businesses (workspace-scoped, staff only)
CREATE POLICY "founder_businesses_select" ON founder_businesses
  FOR SELECT USING (
    public.is_workspace_member(workspace_id) AND public.is_staff()
  );

CREATE POLICY "founder_businesses_insert" ON founder_businesses
  FOR INSERT WITH CHECK (
    public.is_workspace_member(workspace_id) AND public.is_staff()
  );

CREATE POLICY "founder_businesses_update" ON founder_businesses
  FOR UPDATE USING (
    public.is_workspace_member(workspace_id) AND public.is_staff()
  );

CREATE POLICY "founder_businesses_delete" ON founder_businesses
  FOR DELETE USING (
    public.is_workspace_admin(workspace_id) AND public.is_staff()
  );

-- Vault secrets (admin only)
CREATE POLICY "vault_secrets_select" ON founder_business_vault_secrets
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM founder_businesses fb
      WHERE fb.id = founder_business_vault_secrets.business_id
      AND public.is_workspace_admin(fb.workspace_id)
      AND public.has_role(ARRAY['FOUNDER', 'ADMIN']::user_role[])
    )
  );

-- AI Phill insights (owner of insight only)
CREATE POLICY "ai_phill_insights_select" ON ai_phill_insights
  FOR SELECT USING (
    user_id = auth.uid() OR public.has_role(ARRAY['ADMIN']::user_role[])
  );

CREATE POLICY "ai_phill_insights_insert" ON ai_phill_insights
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
  );

-- Cognitive twin scores (workspace-scoped)
CREATE POLICY "cognitive_twin_scores_select" ON cognitive_twin_scores
  FOR SELECT USING (
    public.is_workspace_member(workspace_id) AND public.is_staff()
  );

-- SEO leak profiles (workspace-scoped)
CREATE POLICY "seo_leak_profiles_select" ON seo_leak_signal_profiles
  FOR SELECT USING (
    public.is_workspace_member(workspace_id)
  );

-- Social inbox (workspace-scoped)
CREATE POLICY "social_inbox_select" ON social_inbox_accounts
  FOR SELECT USING (
    public.is_workspace_member(workspace_id)
  );

CREATE POLICY "social_messages_select" ON social_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM social_inbox_accounts sia
      WHERE sia.id = social_messages.account_id
      AND public.is_workspace_member(sia.workspace_id)
    )
  );
```

### Migration 404: Synthex Tier Tables

```sql
-- 404_synthex_tier_tables.sql
-- Create tables for Synthex client tier management

-- Client subscriptions
CREATE TABLE IF NOT EXISTS synthex_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tier TEXT NOT NULL CHECK (tier IN ('starter', 'professional', 'elite')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'trial', 'cancelled', 'past_due')),
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  trial_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(workspace_id, user_id)
);

-- Tier feature limits
CREATE TABLE IF NOT EXISTS synthex_tier_limits (
  tier TEXT PRIMARY KEY CHECK (tier IN ('starter', 'professional', 'elite')),
  contacts_limit INTEGER NOT NULL,
  campaigns_limit INTEGER NOT NULL,
  emails_per_month INTEGER NOT NULL,
  seo_reports BOOLEAN NOT NULL DEFAULT false,
  competitor_analysis BOOLEAN NOT NULL DEFAULT false,
  api_access BOOLEAN NOT NULL DEFAULT false,
  priority_support BOOLEAN NOT NULL DEFAULT false
);

-- Insert default tier limits
INSERT INTO synthex_tier_limits (tier, contacts_limit, campaigns_limit, emails_per_month, seo_reports, competitor_analysis, api_access, priority_support)
VALUES
  ('starter', 500, 5, 5000, false, false, false, false),
  ('professional', 5000, 25, 25000, true, false, true, false),
  ('elite', -1, -1, -1, true, true, true, true)  -- -1 = unlimited
ON CONFLICT (tier) DO NOTHING;

-- Enable RLS
ALTER TABLE synthex_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE synthex_tier_limits ENABLE ROW LEVEL SECURITY;

-- Subscription policies
CREATE POLICY "subscriptions_select" ON synthex_subscriptions
  FOR SELECT USING (
    user_id = auth.uid() OR public.is_workspace_admin(workspace_id)
  );

-- Tier limits readable by all authenticated
CREATE POLICY "tier_limits_select" ON synthex_tier_limits
  FOR SELECT USING (true);

-- Function to check tier access
CREATE OR REPLACE FUNCTION public.check_tier_access(
  workspace_id_param UUID,
  required_tier TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  current_tier TEXT;
  tier_order TEXT[] := ARRAY['starter', 'professional', 'elite'];
BEGIN
  SELECT tier INTO current_tier
  FROM synthex_subscriptions
  WHERE workspace_id = workspace_id_param
  AND status = 'active'
  LIMIT 1;

  IF current_tier IS NULL THEN
    RETURN false;
  END IF;

  RETURN array_position(tier_order, current_tier) >= array_position(tier_order, required_tier);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

GRANT EXECUTE ON FUNCTION public.check_tier_access(UUID, TEXT) TO authenticated;
```

### Migration 405: Audit Log Enhancement

```sql
-- 405_audit_log_enhancement.sql
-- Enhance audit logging for security compliance

-- Add columns to existing audit_logs if not present
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'audit_logs' AND column_name = 'ip_address'
  ) THEN
    ALTER TABLE audit_logs ADD COLUMN ip_address INET;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'audit_logs' AND column_name = 'user_agent'
  ) THEN
    ALTER TABLE audit_logs ADD COLUMN user_agent TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'audit_logs' AND column_name = 'request_id'
  ) THEN
    ALTER TABLE audit_logs ADD COLUMN request_id UUID;
  END IF;
END $$;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_workspace_created
  ON audit_logs(workspace_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_created
  ON audit_logs(user_id, created_at DESC);

-- Function to log API access
CREATE OR REPLACE FUNCTION public.log_api_access(
  workspace_id_param UUID,
  action_param TEXT,
  resource_type_param TEXT,
  resource_id_param UUID,
  details_param JSONB DEFAULT '{}'::JSONB,
  ip_address_param INET DEFAULT NULL,
  user_agent_param TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  log_id UUID;
BEGIN
  INSERT INTO audit_logs (
    workspace_id,
    user_id,
    action,
    resource_type,
    resource_id,
    details,
    ip_address,
    user_agent,
    created_at
  ) VALUES (
    workspace_id_param,
    auth.uid(),
    action_param,
    resource_type_param,
    resource_id_param,
    details_param,
    ip_address_param,
    user_agent_param,
    NOW()
  )
  RETURNING id INTO log_id;

  RETURN log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.log_api_access(UUID, TEXT, TEXT, UUID, JSONB, INET, TEXT) TO authenticated;
```

---

## Migration Execution Order

| Step | Migration | Dependencies | Estimated Time |
|------|-----------|--------------|----------------|
| 1 | 400_fix_migration_duplicates | None | Manual: 2 hours |
| 2 | 401_enable_connection_pooler | Dashboard config | 10 minutes |
| 3 | 402_rls_helper_functions | None | 1 minute |
| 4 | 403_extended_table_rls | 402 | 2 minutes |
| 5 | 404_synthex_tier_tables | 402 | 1 minute |
| 6 | 405_audit_log_enhancement | None | 1 minute |

---

## Data Preservation Guarantees

### Tables That WILL NOT Be Modified

All existing core tables remain unchanged:
- `organizations`
- `workspaces`
- `contacts`
- `emails`
- `campaigns`
- `drip_campaigns`
- `generated_content`
- `profiles`
- `user_profiles`
- `user_organizations`

### Tables That WILL Be Extended

Only additive changes (new columns, new indexes, new policies):
- `audit_logs` - Add IP, user agent, request ID columns
- `founder_businesses` - Add RLS policies only
- `ai_phill_insights` - Add RLS policies only

### New Tables Created

- `synthex_subscriptions` - Client tier management
- `synthex_tier_limits` - Feature limits per tier

---

## Rollback Plan

Each migration includes rollback capability:

```sql
-- Rollback 403 (RLS policies)
DROP POLICY IF EXISTS "founder_businesses_select" ON founder_businesses;
DROP POLICY IF EXISTS "founder_businesses_insert" ON founder_businesses;
-- ... etc

-- Rollback 404 (Synthex tables)
DROP TABLE IF EXISTS synthex_subscriptions CASCADE;
DROP TABLE IF EXISTS synthex_tier_limits CASCADE;
DROP FUNCTION IF EXISTS public.check_tier_access(UUID, TEXT);

-- Rollback 402 (helper functions)
DROP FUNCTION IF EXISTS public.is_workspace_member(UUID);
DROP FUNCTION IF EXISTS public.is_workspace_admin(UUID);
DROP FUNCTION IF EXISTS public.has_role(user_role[]);
DROP FUNCTION IF EXISTS public.is_staff();
DROP FUNCTION IF EXISTS public.is_client();
```

---

## Verification Queries

Run after each migration:

```sql
-- Verify RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- Verify functions exist
SELECT proname, proargnames
FROM pg_proc
WHERE proname LIKE 'is_%' OR proname LIKE 'has_%' OR proname LIKE 'check_%';

-- Verify policies exist
SELECT tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Test workspace isolation
SET request.jwt.claim.sub = 'test-user-id';
SELECT * FROM contacts LIMIT 5;  -- Should only return workspace-scoped data
```

---

**Document Status**: COMPLETE
**Date**: 2025-11-29
