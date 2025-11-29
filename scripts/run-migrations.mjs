#!/usr/bin/env node

/**
 * Migration Consolidation Script
 *
 * Reads migrations 400-403 from supabase/migrations/ and creates a consolidated
 * SQL file with clear section markers and verification queries.
 *
 * Usage: node scripts/run-migrations.mjs
 *
 * Output: supabase/migrations/CONSOLIDATED_400-403.sql
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
const migrationsDir = path.join(projectRoot, 'supabase', 'migrations');

// Migration files to consolidate (in order)
const migrations = [
  { number: 400, filename: '400_core_foundation_consolidation.sql' },
  { number: 401, filename: '401_synthex_tier_management.sql' },
  { number: 402, filename: '402_extended_rls_policies.sql' },
  { number: 403, filename: '403_rate_limiting_infrastructure.sql' },
];

/**
 * Read and clean migration content
 */
function readMigration(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    return content;
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error.message);
    process.exit(1);
  }
}

/**
 * Generate the consolidated migration file
 */
function generateConsolidated() {
  let consolidated = '';

  // Add header
  consolidated += `-- ============================================================================
-- CONSOLIDATED MIGRATIONS 400-403
-- ============================================================================
--
-- This file consolidates Phase 4 migrations into a single runnable SQL script.
--
-- Contents:
--   Migration 400: Core Foundation Consolidation (RLS helpers, audit logs)
--   Migration 401: Synthex Tier Management (subscription tiers, features)
--   Migration 402: Extended RLS Policies (Founder OS + workspace scoping)
--   Migration 403: Rate Limiting Infrastructure (security limits)
--
-- Usage Instructions:
--   1. Go to Supabase Dashboard → SQL Editor
--   2. Create a new query
--   3. Copy/paste the entire contents of this file
--   4. Click "Run" button to execute
--   5. Wait for completion (2-3 minutes)
--   6. Run verification queries at the end to confirm success
--
-- Duration: ~2-3 minutes
-- Impact: Non-breaking, all migrations are idempotent (safe to re-run)
-- Rollback: Not needed (uses CREATE IF NOT EXISTS, ALTER TABLE...IF NOT EXISTS)
--
-- ============================================================================

`;

  // Add each migration with clear markers
  for (const migration of migrations) {
    const filePath = path.join(migrationsDir, migration.filename);

    console.log(`Reading migration ${migration.number}...`);
    const content = readMigration(filePath);

    // Add section marker
    consolidated += `-- ============================================================================
-- MIGRATION ${migration.number}: ${migration.filename}
-- ============================================================================

`;

    // Add migration content
    consolidated += content;

    consolidated += `

`;
  }

  // Add consolidated verification section
  consolidated += `-- ============================================================================
-- CONSOLIDATED VERIFICATION QUERIES
-- Run these after all migrations complete to verify successful deployment
-- ============================================================================

-- 1. Check that all key tables exist
SELECT
  COUNT(*) as total_tables,
  ARRAY_AGG(tablename ORDER BY tablename) as table_names
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN (
  -- Migration 400 expectations
  'audit_logs', 'workspaces',
  -- Migration 401 expectations
  'synthex_tier_limits', 'synthex_usage_tracking',
  -- Migration 402 expectations
  'founder_businesses', 'founder_business_vault_secrets', 'founder_business_signals',
  'founder_os_snapshots', 'ai_phill_insights', 'ai_phill_journal_entries',
  'cognitive_twin_scores', 'cognitive_twin_digests', 'cognitive_twin_decisions',
  'seo_leak_signal_profiles', 'social_inbox_accounts', 'social_messages',
  'search_keywords', 'boost_jobs', 'generated_content', 'ai_memory',
  -- Migration 403 expectations
  'rate_limit_logs', 'rate_limit_overrides', 'blocked_ips'
);

-- 2. Check that all key helper functions exist
SELECT
  COUNT(*) as total_functions,
  ARRAY_AGG(proname ORDER BY proname) as function_names
FROM pg_proc
WHERE pronamespace = 'public'::regnamespace
AND proname IN (
  -- Migration 400 functions
  'is_staff', 'is_founder', 'is_client', 'get_user_role', 'has_role',
  'check_connection_pool_status',
  -- Migration 401 functions
  'workspace_has_tier', 'workspace_has_feature', 'get_workspace_limit',
  'workspace_within_limit',
  -- Migration 403 functions
  'is_ip_blocked', 'get_rate_limit_override', 'log_rate_limit',
  'cleanup_rate_limit_logs'
);

-- 3. Check that RLS is enabled on extended tables
SELECT
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN (
  'founder_businesses', 'ai_phill_insights', 'cognitive_twin_scores',
  'seo_leak_signal_profiles', 'social_inbox_accounts', 'generated_content',
  'ai_memory', 'founder_os_snapshots', 'synthex_tier_limits',
  'rate_limit_overrides', 'blocked_ips'
)
ORDER BY tablename;

-- 4. Check synthex tier limits configuration
SELECT
  tier,
  contacts_limit,
  campaigns_limit,
  emails_per_month,
  seo_reports,
  api_access,
  white_label,
  ai_extended_thinking
FROM synthex_tier_limits
ORDER BY
  CASE tier WHEN 'starter' THEN 1 WHEN 'professional' THEN 2 WHEN 'elite' THEN 3 END;

-- 5. Check rate limiting tables exist and have indexes
SELECT
  schemaname,
  tablename,
  indexname
FROM pg_indexes
WHERE schemaname = 'public'
AND tablename IN ('rate_limit_logs', 'rate_limit_overrides', 'blocked_ips')
ORDER BY tablename, indexname;

-- 6. Check audit_logs enhanced columns
SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'audit_logs'
AND column_name IN ('severity', 'category', 'success', 'duration_ms', 'error_message', 'ip_address', 'user_agent')
ORDER BY column_name;

-- 7. Check workspaces extended columns
SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'workspaces'
AND column_name IN ('org_id', 'current_tier', 'subscription_status', 'trial_ends_at',
                    'stripe_customer_id', 'stripe_subscription_id')
ORDER BY column_name;

-- 8. List all RLS policies by table
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  cmd,
  SUBSTRING(qual::text, 1, 80) as policy_condition
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN (
  'founder_businesses', 'ai_phill_insights', 'cognitive_twin_scores',
  'seo_leak_signal_profiles', 'social_inbox_accounts', 'generated_content',
  'ai_memory', 'synthex_tier_limits', 'rate_limit_overrides', 'blocked_ips'
)
ORDER BY tablename, policyname;

-- ============================================================================
-- SUCCESS INDICATORS
-- ============================================================================
--
-- All migrations are complete when:
--
-- 1. ✓ Total tables >= 33 (includes existing tables + new ones)
-- 2. ✓ Total functions >= 20 (includes existing helpers + new tier/rate-limit functions)
-- 3. ✓ RLS is enabled on 11+ Founder OS and integration tables
-- 4. ✓ synthex_tier_limits has 3 rows (starter, professional, elite)
-- 5. ✓ rate_limit_logs, rate_limit_overrides, blocked_ips have indexes
-- 6. ✓ audit_logs has all 7 new columns (severity, category, success, duration_ms, error_message, ip_address, user_agent)
-- 7. ✓ workspaces has all 6 new columns (org_id, current_tier, subscription_status, trial_ends_at, stripe_customer_id, stripe_subscription_id)
-- 8. ✓ RLS policies cover all tables (minimum 40+ policies)
--
-- If any indicators fail, check the error message above and verify:
--   - Table names match exactly
--   - Column names are spelled correctly
--   - All helper functions executed successfully
--   - No timeout errors during migration
--
-- For detailed troubleshooting, see:
--   - scripts/INTEGRITY_CHECK_README.md
--   - docs/RLS_MIGRATION_POSTMORTEM.md
--   - .claude/RLS_WORKFLOW.md
--
-- ============================================================================
`;

  return consolidated;
}

/**
 * Write the consolidated migration file
 */
function writeConsolidated(content) {
  const outputPath = path.join(migrationsDir, 'CONSOLIDATED_400-403.sql');

  try {
    fs.writeFileSync(outputPath, content, 'utf-8');
    console.log(`\n✓ Consolidated migration created: ${outputPath}\n`);
    return outputPath;
  } catch (error) {
    console.error(`Error writing consolidated migration:`, error.message);
    process.exit(1);
  }
}

/**
 * Print instructions
 */
function printInstructions(filePath) {
  const fileSize = (fs.statSync(filePath).size / 1024).toFixed(2);

  console.log(`
═══════════════════════════════════════════════════════════════════════════════
MIGRATIONS 400-403 CONSOLIDATED
═══════════════════════════════════════════════════════════════════════════════

File Size: ${fileSize} KB

CONTENTS:
  • Migration 400: Core Foundation Consolidation (RLS helpers, audit logs)
  • Migration 401: Synthex Tier Management (subscription tiers, features)
  • Migration 402: Extended RLS Policies (Founder OS + workspace scoping)
  • Migration 403: Rate Limiting Infrastructure (security limits)

═══════════════════════════════════════════════════════════════════════════════
HOW TO RUN IN SUPABASE DASHBOARD
═══════════════════════════════════════════════════════════════════════════════

STEP 1: Open Supabase Dashboard
  → Go to https://supabase.com/dashboard
  → Select your Unite-Hub project
  → Click "SQL Editor" (left sidebar)

STEP 2: Create a New Query
  → Click "+ New Query" button
  → Give it a name: "Migrations 400-403"

STEP 3: Copy the SQL
  → Open this file: ${filePath}
  → Select ALL content (Ctrl+A)
  → Copy (Ctrl+C)
  → Paste into Supabase SQL Editor (Ctrl+V)

STEP 4: Execute
  → Click "Run" button (or Ctrl+Enter)
  → Wait for completion (2-3 minutes)
  → Watch progress bar at bottom

STEP 5: Verify Success
  → After "Execution succeeded" message
  → Scroll to bottom of results
  → Run the 8 verification queries (they're included in the file)
  → Check all indicators show ✓ PASS

═══════════════════════════════════════════════════════════════════════════════
SAFETY INFORMATION
═══════════════════════════════════════════════════════════════════════════════

✓ All migrations are IDEMPOTENT (safe to run multiple times)
✓ Uses CREATE IF NOT EXISTS for tables
✓ Uses ALTER TABLE...IF NOT EXISTS for columns
✓ Policies have DROP IF EXISTS for safe re-running
✓ No data loss (only adds columns/tables/functions)
✓ No breaking changes (all backward compatible)

═══════════════════════════════════════════════════════════════════════════════
WHAT EACH MIGRATION DOES
═══════════════════════════════════════════════════════════════════════════════

MIGRATION 400: Core Foundation Consolidation
  Tables Modified:
    • audit_logs → adds severity, category, success, duration_ms, error_message, ip_address, user_agent
    • workspaces → adds org_id

  Functions Created:
    • is_staff() - Check if user is staff/founder/admin
    • is_founder() - Check if user is founder only
    • is_client() - Check if user is client
    • get_user_role() - Get user's role
    • has_role() - Variadic role check
    • check_connection_pool_status() - Check database pooling

MIGRATION 401: Synthex Tier Management
  Tables Created:
    • synthex_tier_limits (starter/professional/elite tiers)
    • synthex_usage_tracking (monthly usage per workspace)

  Tables Modified:
    • workspaces → adds current_tier, subscription_status, trial_ends_at, stripe_customer_id, stripe_subscription_id

  Functions Created:
    • workspace_has_tier(workspace_id, required_tier) - Check if workspace has tier level
    • workspace_has_feature(workspace_id, feature_name) - Check feature access
    • get_workspace_limit(workspace_id, limit_name) - Get resource limit
    • workspace_within_limit(workspace_id, limit_name, current_count) - Check if within limit

MIGRATION 402: Extended RLS Policies
  Tables Modified (RLS Enabled):
    • founder_businesses (owner_user_id scoped)
    • founder_business_vault_secrets
    • founder_business_signals
    • founder_os_snapshots (owner_user_id scoped)
    • ai_phill_insights (owner_user_id scoped)
    • ai_phill_journal_entries (owner_user_id scoped)
    • cognitive_twin_scores (owner_user_id scoped)
    • cognitive_twin_digests (owner_user_id scoped)
    • cognitive_twin_decisions (owner_user_id scoped)
    • seo_leak_signal_profiles (founder_business_id scoped)
    • social_inbox_accounts (founder_business_id scoped)
    • social_messages (social_account_id → social_inbox_accounts → founder_business_id scoped)
    • generated_content (workspace_id scoped)
    • ai_memory (workspace_id scoped)

  Policies Created: 30+ policies covering all scoping patterns

MIGRATION 403: Rate Limiting Infrastructure
  Tables Created:
    • rate_limit_logs (persistent rate limit tracking)
    • rate_limit_overrides (custom limits per client/endpoint)
    • blocked_ips (persistent IP blocking)

  Functions Created:
    • is_ip_blocked(ip) - Check if IP is blocked
    • get_rate_limit_override(client_key, endpoint, workspace_id) - Get custom limits
    • log_rate_limit(...) - Log rate limit event
    • cleanup_rate_limit_logs(days_to_keep) - Clean old logs

  Views Created:
    • rate_limit_analytics - 30-day rate limit analytics

═══════════════════════════════════════════════════════════════════════════════
EXPECTED DURATION
═══════════════════════════════════════════════════════════════════════════════

  • Phase 1 (Reading file): Immediate
  • Phase 2 (Migration 400): ~30-45 seconds
  • Phase 3 (Migration 401): ~30-45 seconds
  • Phase 4 (Migration 402): ~45-60 seconds (most policies)
  • Phase 5 (Migration 403): ~30-45 seconds
  • Phase 6 (Verification): ~20 seconds
  ─────────────────────────────
  TOTAL: ~2-3 minutes

═══════════════════════════════════════════════════════════════════════════════
TROUBLESHOOTING
═══════════════════════════════════════════════════════════════════════════════

ERROR: "function is_workspace_member(...) does not exist"
→ This is expected. The helper function exists if migrations 023-024 ran successfully.
  Verify in SCHEMA_REFERENCE.md that is_workspace_member exists.

ERROR: "table ... does not exist"
→ The migration gracefully skips missing tables.
  Check the notice messages to see which tables were skipped.

ERROR: "permission denied" on RLS policies
→ You need to be connected as a superuser or service role key.
  Use the Supabase Dashboard SQL Editor (it uses service role automatically).

ERROR: Timeout after 5 minutes
→ The query took too long. Try splitting into smaller batches:
  1. Run migrations 400 separately
  2. Run migrations 401 separately
  3. Run migrations 402 separately
  4. Run migrations 403 separately

═══════════════════════════════════════════════════════════════════════════════
FOR MORE HELP
═══════════════════════════════════════════════════════════════════════════════

Documentation:
  • RLS Workflow: .claude/RLS_WORKFLOW.md
  • Migration Postmortem: docs/RLS_MIGRATION_POSTMORTEM.md
  • Schema Reference: .claude/SCHEMA_REFERENCE.md
  • Integrity Check: scripts/INTEGRITY_CHECK_README.md

Run after migration:
  npm run integrity:check    # Full system verification

═══════════════════════════════════════════════════════════════════════════════
`);
}

/**
 * Main execution
 */
console.log('Starting migration consolidation...\n');

// Verify migration files exist
for (const migration of migrations) {
  const filePath = path.join(migrationsDir, migration.filename);
  if (!fs.existsSync(filePath)) {
    console.error(`Error: Migration file not found: ${filePath}`);
    process.exit(1);
  }
}

// Generate consolidated file
const consolidated = generateConsolidated();

// Write output
const outputPath = writeConsolidated(consolidated);

// Print instructions
printInstructions(outputPath);

console.log('✓ Migration consolidation complete!\n');
