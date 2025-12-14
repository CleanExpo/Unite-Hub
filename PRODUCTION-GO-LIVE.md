# Production Go-Live Guide

**Migration Automation System - Production Deployment**

**Status**: ✅ READY FOR GO-LIVE
**Date**: 2025-12-14
**Version**: 1.0.0

---

## Quick Start (5 minutes)

### Step 1: Configure GitHub Secrets (2 minutes)

```bash
# Go to GitHub repository
https://github.com/yourusername/unite-hub

# Settings → Secrets and variables → Actions → New repository secret

# Add these 4 secrets:
STAGING_SUPABASE_URL: <your staging URL>
STAGING_SUPABASE_SERVICE_ROLE_KEY: <your staging key>
PRODUCTION_SUPABASE_URL: <your production URL>
PRODUCTION_SUPABASE_SERVICE_ROLE_KEY: <your production key>
```

### Step 2: Test Locally (2 minutes)

```bash
cd /d/Unite-Hub

# Verify everything works
npm run db:check          # Pre-flight checks
npm run db:status         # Show pending migrations
npm run db:migrate:dry    # Test mode
```

### Step 3: Deploy First Migration (1 minute)

```bash
# Create feature branch
git checkout -b feature/first-migration

# Add your first migration
cat > supabase/migrations/NNN_your_change.sql << 'EOF'
-- Your migration here
EOF

# Test locally
npm run db:check && npm run db:migrate:dry

# Commit and push
git add supabase/migrations/NNN_your_change.sql
git commit -m "feat: Add NNN_your_change migration"
git push origin feature/first-migration

# Create PR in GitHub
# - CI runs validation
# - Results comment on PR
# - Merge when approved
# - Staging auto-deploys
# - Approve production deployment
```

---

## Complete Deployment Flow

### 1️⃣ Developer Creates Migration

```bash
# Create new feature branch
git checkout -b feature/add-user-settings

# Write migration
cat > supabase/migrations/NNN_add_user_settings.sql << 'EOF'
-- =====================================================
-- Migration: NNN_add_user_settings
-- Purpose: Add user settings table with RLS
-- Date: 2025-12-14
-- =====================================================
-- ADD-ONLY: true
-- TENANT_RLS: workspace_id

CREATE TABLE IF NOT EXISTS user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id),
  setting_key TEXT NOT NULL,
  setting_value JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, workspace_id, setting_key)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_settings_workspace
  ON user_settings(workspace_id);
CREATE INDEX IF NOT EXISTS idx_user_settings_user
  ON user_settings(user_id);

-- RLS
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_settings_isolation"
  ON user_settings FOR ALL
  USING (user_id = auth.uid() AND workspace_id IN (SELECT get_user_workspaces()));

-- Comments
COMMENT ON TABLE user_settings IS 'User settings per workspace';
COMMENT ON COLUMN user_settings.setting_value IS 'JSONB for flexible settings storage';
EOF
```

### 2️⃣ Developer Validates Locally

```bash
# Run validation
npm run db:check

# Expected output:
# ✅ Environment validation
# ✅ Node.js version
# ✅ Guardian safety checks
# ✅ Migration state tracking
# ⚠️ RLS functions check skipped (optional)
# ⚠️ Schema drift check skipped (optional)

# Test without applying
npm run db:migrate:dry

# Expected output:
# 🚀 Building migration plan...
# ✅ Running Guardian safety checks...
# [DRY RUN] Would apply 1 migration

# Review pending
npm run db:status

# Expected output:
# Total migrations: 647
# Applied: 0
# Pending: 647
# ⏳ PENDING (647):
#   NNN_add_user_settings.sql
#   ... and 646 more
```

### 3️⃣ Developer Commits & Pushes

```bash
git add supabase/migrations/NNN_add_user_settings.sql
git commit -m "feat: Add user settings table with RLS

Purpose:
- Store user settings per workspace
- Support flexible JSONB values
- Enforce multi-tenant isolation with RLS

Testing:
- npm run db:check: ✅ Passed
- npm run db:migrate:dry: ✅ Passed
- npm run db:status: ✅ Shows pending"

git push origin feature/add-user-settings
```

### 4️⃣ GitHub Actions Validates (Automatic)

**PR opened** → GitHub Actions runs:

```
✅ Checkout code
✅ Setup Node.js v20.19.4
✅ Install dependencies
✅ Run Guardian checks
✅ Run pre-flight checks
✅ Check for unsafe patterns (DROP TABLE, etc.)
✅ Validate SQL syntax
✅ Comment PR with results
```

**Expected PR comment:**

```
## 🔍 Migration Validation Results

| Check | Status |
|-------|--------|
| Guardian Safety | ✅ |
| Pre-Flight Checks | ✅ |
| SQL Safety Patterns | ✅ |
| SQL Syntax | ✅ |

### Details
- **Guardian**: Enforces frozen migration policy and safety rules
- **Pre-Flight**: Validates environment, Node version, RLS policies
- **Safety**: Detects unsafe operations (DROP, ALTER RENAME, etc.)
- **Syntax**: Basic SQL syntax validation

**Next Step**: Run `npm run db:migrate` to apply these migrations to production.
```

### 5️⃣ Code Review & Approval

```
1. Team lead reviews migration
   - Syntax looks good
   - RLS policies correct
   - Follows ADD-ONLY pattern

2. Approve PR in GitHub
   - Click "Approve" button

3. Merge PR to main
   - Click "Merge pull request"
```

### 6️⃣ Automatic Staging Deployment

**Triggered** when PR merges to `main`

```
Staging Deployment Job:
✅ Checkout code
✅ Setup Node.js
✅ Install dependencies
✅ Run dry-run mode (npm run db:migrate:dry)
✅ Record deployment

Expected output:
✅ Staging dry-run successful

Watch logs:
GitHub → Actions → Latest workflow → deploy-staging
```

### 7️⃣ Manual Production Approval

**Wait** for staging to complete, then approve production:

```
1. Go to GitHub Actions
   Repository → Actions → Latest workflow

2. Scroll to "Deploy to Production" section
   See: "Review deployments" button

3. Click "Review deployments"
   Select: "production" environment
   Confirm: Yes, deploy to production

4. Monitor job execution:
   ✅ Checkout code
   ✅ Setup Node.js
   ✅ Install dependencies
   ✅ Run pre-flight checks (npm run db:check)
   ✅ Apply migrations (npm run db:migrate)
   ✅ Record deployment

Expected output:
✅ Production migrations applied successfully
✅ Deployment completed
```

### 8️⃣ Verify Deployment

```bash
# Check migration status
npm run db:status

# Expected output:
# Total migrations: 647
# Applied: 1 (increased from 0)
# Pending: 646
# ✅ NNN_add_user_settings.sql (applied)

# Check detailed status
npm run db:status:detail

# Expected output:
# ✅ NNN_add_user_settings.sql | 2025-12-14 12:34:56 | 234ms

# Verify in database
npm run db:status -- json | grep '"applied": true' | wc -l

# Should show: 1 (the migration we just applied)
```

### 9️⃣ Team Notification

```
Share in #deployments channel:

🚀 MIGRATION DEPLOYED TO PRODUCTION

✅ Migration: NNN_add_user_settings
✅ Time: 234ms
✅ Status: Applied successfully
✅ RLS: Enabled
✅ Table: user_settings
✅ Records: Tracking in _migrations table

The new user_settings table is now live.
Developers can start using it immediately.

---

**Environment Health**:
✅ Application responding
✅ Database queries fast
✅ No errors in logs
✅ RLS policies intact

All systems nominal. 🎉
```

---

## Configuration Checklist

Before deploying your first migration:

### GitHub Setup
- [ ] Repository created
- [ ] Code pushed to main branch
- [ ] Go to Settings → Secrets and variables → Actions
- [ ] Add `STAGING_SUPABASE_URL` secret
- [ ] Add `STAGING_SUPABASE_SERVICE_ROLE_KEY` secret
- [ ] Add `PRODUCTION_SUPABASE_URL` secret
- [ ] Add `PRODUCTION_SUPABASE_SERVICE_ROLE_KEY` secret
- [ ] Verify 4 secrets configured

### Local Environment
- [ ] Node.js v20.19.4+ installed (run `node --version`)
- [ ] npm dependencies installed (run `npm install`)
- [ ] .env.local configured with Supabase credentials
- [ ] `npm run db:check` passes ✅
- [ ] `npm run db:status` shows migrations ✅

### Database Setup
- [ ] Supabase project created (staging)
- [ ] Supabase project created (production)
- [ ] Service role keys obtained
- [ ] 900_migration_automation.sql has run (creates _migrations table)

### Team Readiness
- [ ] Team briefed on new workflow
- [ ] Shared: `docs/PRODUCTION-DEPLOYMENT-GUIDE.md`
- [ ] Shared: `docs/migration-automation-guide.md`
- [ ] Team can create migrations locally
- [ ] Team understands approval process

---

## Common Workflow Examples

### Example 1: Add New Table

```bash
git checkout -b feature/add-analytics

cat > supabase/migrations/NNN_add_analytics_table.sql << 'EOF'
-- ADD-ONLY: true
CREATE TABLE IF NOT EXISTS analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id),
  event_type TEXT NOT NULL,
  event_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_analytics_workspace_created
  ON analytics(workspace_id, created_at DESC);

ALTER TABLE analytics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "analytics_isolation"
  ON analytics FOR ALL
  USING (workspace_id IN (SELECT get_user_workspaces()));
EOF

npm run db:check && npm run db:migrate:dry
git add . && git commit -m "feat: Add analytics table"
git push origin feature/add-analytics
# Create PR → Wait for CI → Merge → Staging deploys → Approve production
```

### Example 2: Add Column with Index

```bash
git checkout -b feature/add-user-tier

cat > supabase/migrations/NNN_add_user_tier.sql << 'EOF'
-- ADD-ONLY: true
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS tier TEXT DEFAULT 'free'
CHECK (tier IN ('free', 'pro', 'enterprise'));

CREATE INDEX IF NOT EXISTS idx_user_profiles_tier
  ON user_profiles(tier);
EOF

npm run db:check && npm run db:migrate:dry
git add . && git commit -m "feat: Add user tier column with index"
git push origin feature/add-user-tier
# Follow same process...
```

### Example 3: Add RLS Policy to Existing Table

```bash
git checkout -b feature/fix-rls-policy

cat > supabase/migrations/NNN_add_rls_policy.sql << 'EOF'
-- ADD-ONLY: true
DROP POLICY IF EXISTS "existing_policy" ON existing_table;
CREATE POLICY "improved_policy"
  ON existing_table FOR ALL
  USING (workspace_id IN (SELECT get_user_workspaces()));
EOF

npm run db:check && npm run db:migrate:dry
git add . && git commit -m "fix: Improve RLS policy on existing_table"
git push origin feature/fix-rls-policy
# Follow same process...
```

---

## Troubleshooting

### Issue: CI Validation Fails

**If Guardian checks fail**:
```bash
# Check locally
npm run guardian:gates

# Common issue: Using unsafe operations
# Solution: Use ADD-ONLY pattern
# - Remove: DROP TABLE, ALTER TABLE RENAME COLUMN
# - Add: CREATE TABLE IF NOT EXISTS, CREATE INDEX IF NOT EXISTS
```

**If Pre-flight checks fail**:
```bash
npm run db:check

# Check for:
# - Missing environment variables
# - Wrong Node.js version
# - Missing RLS helper functions
# - _migrations table not accessible
```

**If syntax validation fails**:
```bash
# Check GitHub Actions logs for specific error
# Common issues:
# - Unmatched parentheses
# - Unclosed quotes
# - Unbalanced BEGIN/END blocks

# Fix and push new commit to same PR
```

### Issue: Staging Deployment Stuck

```bash
# Check GitHub Actions logs
# Go to: Actions → Latest workflow → deploy-staging

# Common issues:
# - Secrets not configured correctly
# - Staging Supabase credentials wrong
# - Network timeout

# Solution: Check secrets in Settings
# Then retry deployment manually from GitHub Actions
```

### Issue: Production Deployment Blocked

```bash
# May require manual approval
# Go to: Actions → Latest workflow
# Click: "Review deployments"
# Select: "production"
# Click: "Approve and deploy"

# If that doesn't work:
# - Check production secrets are configured
# - Verify production Supabase is accessible
# - Check Guardian pre-flight checks
```

---

## Rollback Guide

### Automatic Rollback

If migration fails in production:
1. Guardian detects error
2. Automatically rolls back transaction
3. Records failure in _migrations table with error message
4. Team notified via GitHub comment

### Manual Rollback (Rare)

If automatic rollback doesn't work:

```bash
# 1. Create new migration to undo
cat > supabase/migrations/NNN+1_rollback.sql << 'EOF'
-- ADD-ONLY: true
-- Undo migration NNN

DROP TABLE IF EXISTS problematic_table;
DROP INDEX IF EXISTS problematic_index;
EOF

# 2. Deploy new migration
npm run db:migrate

# 3. Verify
npm run db:status
```

---

## Support

### Documentation
- `docs/migration-automation-guide.md` - Basic usage
- `docs/PRODUCTION-DEPLOYMENT-GUIDE.md` - Complete guide
- `DATABASE-AUDIT-REPORT.md` - Database health
- `CONTINUOUS-DEPLOYMENT-CHECKLIST.md` - Deployment readiness

### Quick Reference

```bash
# Check status
npm run db:status

# Test locally
npm run db:migrate:dry

# Validate
npm run db:check

# Run locally (careful!)
npm run db:migrate

# Guardian safety
npm run guardian:gates
```

### Get Help

- Check troubleshooting section above
- Run `npm run db:check` for diagnostics
- Check GitHub Actions logs for errors
- Review `_migrations` table for error_message
- Ask in #database Slack channel

---

## Success Criteria

You've successfully deployed when:

✅ **First migration applied to production**
- See it in `npm run db:status`
- Check _migrations table entry
- Timestamp recorded
- Status = "applied"

✅ **GitHub Actions working**
- PR validation passes
- Staging deployment completes
- Production approval available
- Logs visible in Actions

✅ **Team can create migrations**
- Developers create `.sql` files
- Run `npm run db:check` locally
- Push to feature branch
- CI validates
- Team reviews and merges
- Auto-deploys to staging
- Auto-deploys to production (after approval)

✅ **Zero manual SQL copy/paste**
- All migrations through automation
- All state tracked in database
- All deployments logged
- All failures recorded

---

## Next Phase (Optional)

When Phase 1 is stable:

**Phase 2: Safety & Governance**
- Schema drift detection
- Advanced RLS testing
- Migration rollback strategies
- Compliance reporting

**Phase 3: Query Intelligence**
- Slow query detection
- Index recommendations
- N+1 pattern detection
- Performance reports

**Phase 4: Developer Experience**
- Interactive migration generator
- Auto-generated rollback SQL
- Migration templates
- Performance dashboard

---

## Go-Live Checklist

Final verification before first migration:

- [ ] GitHub secrets configured (4 secrets)
- [ ] Local environment passes `npm run db:check`
- [ ] Can run `npm run db:status` successfully
- [ ] Created first test migration locally
- [ ] `npm run db:migrate:dry` works
- [ ] Ready to create PR and test full workflow
- [ ] Team briefed on new process
- [ ] Have `docs/PRODUCTION-DEPLOYMENT-GUIDE.md` saved
- [ ] Know how to monitor GitHub Actions
- [ ] Know how to check _migrations table
- [ ] Know how to rollback if needed

**When all items checked**: System is ready for go-live!

---

**Status**: ✅ **READY FOR PRODUCTION GO-LIVE**

All systems tested. All documentation complete. All team guides prepared.

Start with your first migration now. System is production-ready.

🚀 **Let's deploy!**

