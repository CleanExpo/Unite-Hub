# Production Deployment Guide

**Migration Automation System - Production Deployment**

**Last Updated**: 2025-12-14
**Status**: ✅ Ready for Production
**Version**: 1.0.0

---

## Quick Start

```bash
# 1. Create and test migration locally
npm run db:check          # Validate environment
npm run db:migrate:dry    # Test without applying
npm run db:status         # Review pending migrations

# 2. Push to GitHub (triggers CI/CD)
git add supabase/migrations/NNN_*.sql
git commit -m "feat: Add new migration

- Description of changes
- Impact: What changes
- Testing: How tested"
git push origin feature-branch

# 3. Create PR (CI runs validation)
# - Guardian checks run
# - Pre-flight validation runs
# - SQL safety checks run
# - Results comment on PR

# 4. Merge to main (auto-deploys)
# - Staging deployment runs (dry-run)
# - Production deployment runs (applies migrations)
# - Status recorded in database
```

---

## CI/CD Pipeline Overview

```
Developer
    ↓
Create Migration (001-999, 900-999 range)
    ↓
Push to Feature Branch
    ↓
┌───────────────────────────────────┐
│ Pull Request Opened (GitHub)      │
└─────────────┬─────────────────────┘
              ↓
┌─────────────────────────────────────────────────────────┐
│ JOB 1: Validate Migrations (validate-migrations)        │
├─────────────────────────────────────────────────────────┤
│ ✅ Guardian Safety Checks                               │
│    - Verify frozen migrations not modified              │
│    - Check for unsafe operations                        │
│    - Validate ADD-ONLY compliance                       │
│                                                         │
│ ✅ Pre-Flight Checks                                    │
│    - Environment variables present                      │
│    - Node.js version >= 20.19.4                        │
│    - RLS helper functions exist                         │
│    - Migration state table accessible                   │
│                                                         │
│ ✅ SQL Safety Pattern Detection                         │
│    - Detect DROP TABLE/COLUMN without IF EXISTS        │
│    - Detect ALTER TABLE RENAME COLUMN                  │
│    - Detect unbalanced BEGIN/END blocks                │
│                                                         │
│ ✅ SQL Syntax Validation                                │
│    - Check for unmatched parentheses                    │
│    - Verify unclosed quotes                            │
│    - Validate SQL structure                            │
│                                                         │
│ 📋 Comment on PR with results                          │
└──────────────────┬───────────────────────────────────────┘
                   ↓
┌─────────────────────────────────────────────────────────┐
│ DECISION POINT: All checks pass?                        │
├─────────────────────────────────────────────────────────┤
│ ❌ NO → PR marked as blocked, requires fixes           │
│ ✅ YES → Ready for merge                               │
└──────────────────┬───────────────────────────────────────┘
                   ↓
            Code Review + Approval
                   ↓
          Merge to Main Branch
                   ↓
┌──────────────────────────────────────────────────────────┐
│ JOB 2: Deploy to Staging (deploy-staging)              │
├──────────────────────────────────────────────────────────┤
│ Environment: staging                                    │
│ Database: Staging Supabase instance                     │
│                                                         │
│ Steps:                                                   │
│ 1. Checkout code                                       │
│ 2. Setup Node.js v20.19.4                             │
│ 3. Install dependencies                                │
│ 4. Run dry-run mode (npm run db:migrate:dry)          │
│    → Validates migrations without applying             │
│    → Tests all checks against staging database         │
│ 5. Record deployment                                   │
│                                                         │
│ Output: Deployment logs in GitHub Actions             │
│ Approval: Automatic (no manual review needed)          │
└──────────────────┬───────────────────────────────────────┘
                   ↓
          Staging Validation Complete
                   ↓
┌──────────────────────────────────────────────────────────┐
│ JOB 3: Deploy to Production (deploy-production)        │
├──────────────────────────────────────────────────────────┤
│ Environment: production                                 │
│ Database: Production Supabase instance                  │
│ ⚠️  REQUIRES MANUAL APPROVAL IN GITHUB                 │
│                                                         │
│ Steps:                                                   │
│ 1. Checkout code                                       │
│ 2. Setup Node.js v20.19.4                             │
│ 3. Install dependencies                                │
│ 4. Run pre-flight checks (npm run db:check)           │
│    → Validates production environment                  │
│    → Checks RLS policies, schema state                │
│    → Blocks if Guardian safety checks fail             │
│ 5. Apply migrations (npm run db:migrate)              │
│    → Executes all pending migrations                   │
│    → Records state in _migrations table                │
│    → Auto-rollback on failure                         │
│ 6. Record deployment timestamp                         │
│                                                         │
│ Output: Migration results in _migrations table         │
│ Monitoring: Automated - check app health after         │
│ Rollback: Automatic via Guardian if failure            │
└──────────────────┬───────────────────────────────────────┘
                   ↓
          ✅ Production Deployment Complete
                   ↓
         Status recorded in _migrations table
    Timestamp, duration, SHA256, applied_by: 'ci'
```

---

## Required GitHub Secrets

Configure these in GitHub Settings → Secrets and variables → Actions:

### Staging Environment Secrets
```
STAGING_SUPABASE_URL
STAGING_SUPABASE_SERVICE_ROLE_KEY
STAGING_URL                          (optional, for environment link)
```

### Production Environment Secrets
```
PRODUCTION_SUPABASE_URL
PRODUCTION_SUPABASE_SERVICE_ROLE_KEY
PRODUCTION_URL                       (optional, for environment link)
```

### Setup Instructions

1. **Go to Repository Settings**
   - Navigate to: `Settings` → `Secrets and variables` → `Actions`

2. **Add Staging Secrets**
   - Click "New repository secret"
   - Name: `STAGING_SUPABASE_URL`
   - Value: Your staging Supabase project URL
   - Click "Add secret"
   - Repeat for `STAGING_SUPABASE_SERVICE_ROLE_KEY`

3. **Add Production Secrets**
   - Click "New repository secret"
   - Name: `PRODUCTION_SUPABASE_URL`
   - Value: Your production Supabase project URL
   - Click "Add secret"
   - Repeat for `PRODUCTION_SUPABASE_SERVICE_ROLE_KEY`

4. **Verify All Secrets Added**
   ```
   ✅ STAGING_SUPABASE_URL
   ✅ STAGING_SUPABASE_SERVICE_ROLE_KEY
   ✅ PRODUCTION_SUPABASE_URL
   ✅ PRODUCTION_SUPABASE_SERVICE_ROLE_KEY
   ```

---

## Deployment Workflow

### For Developers

**Step 1: Create Migration File**

```bash
# Create numbered migration file
cat > supabase/migrations/NNN_description.sql << 'EOF'
-- =====================================================
-- Migration: NNN_description
-- Purpose: What this does
-- Date: 2025-12-14
-- =====================================================
-- ADD-ONLY: true
-- TENANT_RLS: workspace_id (if applicable)

-- Your SQL here
CREATE TABLE IF NOT EXISTS new_table (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_table_workspace
  ON new_table(workspace_id);

-- RLS
ALTER TABLE new_table ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation"
  ON new_table FOR ALL
  USING (workspace_id IN (SELECT get_user_workspaces()));
EOF
```

**Step 2: Validate Locally**

```bash
# Check all pre-flight conditions
npm run db:check

# Simulate applying migrations (dry-run)
npm run db:migrate:dry

# Review pending migrations
npm run db:status

# View detailed table
npm run db:status:detail
```

**Step 3: Commit & Push**

```bash
git add supabase/migrations/NNN_description.sql
git commit -m "feat: Add NNN_description migration

- Add new_table for storing X
- Enable RLS for multi-tenancy
- Add composite indexes for performance

Testing:
- Ran npm run db:check: ✅ Passed
- Ran npm run db:migrate:dry: ✅ Passed
- Verified with db:status: ✅ Shows pending"

git push origin feature-branch
```

**Step 4: Create Pull Request**

```
Title: Add migration NNN_description

Description:
- What: Adding new_table with RLS
- Why: Required for feature X
- How: ADD-ONLY migration with idempotent SQL
- Testing: Dry-run passed, pre-flight checks passed

Pre-deployment checklist:
- [x] npm run db:check passed
- [x] npm run db:migrate:dry passed
- [x] Migration follows ADD-ONLY pattern
- [x] RLS policies included
- [x] Indexes added for performance
```

GitHub Actions will automatically:
1. Run Guardian checks
2. Run pre-flight validation
3. Check SQL safety patterns
4. Comment with results

**Step 5: Get Approval & Merge**

```bash
# After review approval from team
git merge --no-ff feature-branch main

# This triggers:
# 1. Staging deployment (dry-run)
# 2. Production deployment (with approval)
```

---

## Approval Gates

### Pull Request Review Gate
- **Required**: Code review from team lead
- **Check**: Guardian + pre-flight + syntax validation
- **Action**: Comment feedback on PR

### Staging Deployment Gate
- **Automatic**: Runs after merge to main
- **Check**: Dry-run against staging database
- **Output**: Logs in GitHub Actions

### Production Deployment Gate
- **Manual Approval**: Required in GitHub
- **How to Approve**:
  1. Go to GitHub Actions → Latest workflow run
  2. Scroll to "deploy-production" job
  3. Click "Review deployments" button
  4. Select "production" environment
  5. Click "Approve and deploy"
- **Check**: Pre-flight validation before applying
- **Rollback**: Automatic if failures detected

---

## Monitoring & Verification

### During Deployment

```bash
# Watch GitHub Actions logs
# 1. Go to repository → Actions
# 2. Find latest workflow run for your PR
# 3. Click to view detailed logs
# 4. Check "deploy-production" job status
```

### After Deployment

**Verify in Database**

```bash
# Check applied migrations
npm run db:status

# Should show:
# - Total migrations: 646+
# - Applied: (number that was pending)
# - Pending: (reduced count)
# - Drifted: 0
```

**Check Application Health**

```bash
# Monitor error logs
- Check Supabase dashboard for errors
- Monitor application logs
- Check database performance metrics

# Run Guardian verification
npm run guardian:gates

# Should output:
✅ Migration state verified
✅ Frozen migrations intact
✅ RLS policies active
```

---

## Rollback Procedures

### Automatic Rollback (Production Deployment Failed)

If `npm run db:migrate` fails:

1. **Guardian triggers rollback**
   - Detects migration failure
   - Checks error message
   - Initiates rollback SQL

2. **Database state reverted**
   - Previous applied state restored
   - _migrations table updated with 'rolled_back' status
   - Error message recorded

3. **GitHub notification**
   - Deployment marked as failed
   - Comment added to PR with error details
   - Team notified of failure

### Manual Rollback (Rare)

If automatic rollback doesn't work:

```bash
# 1. Identify failed migration
npm run db:status | grep failed

# 2. Create new migration to undo
cat > supabase/migrations/NNN+1_rollback_NNN.sql << 'EOF'
-- =====================================================
-- Migration: NNN+1_rollback_NNN
-- Purpose: Undo migration NNN that failed
-- Date: 2025-12-14
-- =====================================================
-- ADD-ONLY: true

-- Undo the changes from migration NNN
DROP TABLE IF EXISTS problematic_table;
DROP INDEX IF EXISTS problematic_index;

-- Verify RLS policies still intact
-- [Add verification checks]
EOF

# 3. Deploy new rollback migration
npm run db:migrate
```

---

## Troubleshooting

### Issue: Guardian Checks Fail

**Symptoms**: PR shows ❌ Guardian Safety

**Solution**:
```bash
# 1. Run locally
npm run guardian:gates

# 2. Check for unsafe operations
grep -E "DROP TABLE|ALTER.*RENAME|DROP COLUMN" supabase/migrations/NNN_*.sql

# 3. Fix migration to be ADD-ONLY
# Remove unsafe operations, use idempotent patterns

# 4. Commit fix
git add supabase/migrations/NNN_*.sql
git commit -m "fix: Use ADD-ONLY pattern in migration NNN"
git push origin feature-branch
```

### Issue: Pre-Flight Checks Fail

**Symptoms**: PR shows ⚠️ Pre-Flight Checks

**Solution**:
```bash
# 1. Run locally
npm run db:check

# 2. Check specific issues
# - Environment variables: echo $SUPABASE_SERVICE_ROLE_KEY
# - Node version: node --version (should be >= 20.19)
# - RLS functions: npm run db:check (shows details)

# 3. Fix environment or migration as needed
```

### Issue: SQL Syntax Fails

**Symptoms**: PR shows ❌ SQL Syntax

**Solution**:
```bash
# 1. Review error message in GitHub Actions logs
# 2. Common issues:
#    - Unmatched parentheses
#    - Unclosed quotes
#    - Unbalanced BEGIN/END

# 3. Fix SQL syntax
vim supabase/migrations/NNN_*.sql

# 4. Test locally
npm run db:migrate:dry

# 5. Push fix
git add supabase/migrations/NNN_*.sql
git commit -m "fix: SQL syntax in migration NNN"
```

### Issue: Production Deployment Blocked

**Symptoms**: Stuck at "Review deployments" step

**Solution**:
```bash
# 1. Check GitHub Actions logs
#    - Are staging checks passing?
#    - Are production secrets configured?

# 2. Verify secrets in Settings
#    - PRODUCTION_SUPABASE_URL ✅
#    - PRODUCTION_SUPABASE_SERVICE_ROLE_KEY ✅

# 3. Manually approve deployment
#    - Go to workflow run
#    - Click "Review deployments"
#    - Select "production"
#    - Click "Approve and deploy"
```

---

## Performance & Safety

### Safety Features

1. **Dry-Run Staging**: All migrations tested before production
2. **Pre-Flight Checks**: Environment validation before apply
3. **Guardian Integration**: Unsafe operations blocked
4. **RLS Validation**: Ensures row-level security intact
5. **State Tracking**: Every migration recorded in database
6. **Automatic Rollback**: Failures trigger rollback
7. **Error Recording**: Stack trace saved for analysis

### Performance Optimization

1. **Parallel Validation**: All checks run simultaneously
2. **Early Exit**: Stops on first critical error
3. **Caching**: Node modules cached between runs
4. **Selective Deployment**: Only runs when migrations change

---

## Best Practices

### ✅ DO

- ✅ One logical change per migration
- ✅ Use ADD-ONLY pattern (no DROP/ALTER RENAME)
- ✅ Include idempotent SQL (IF NOT EXISTS)
- ✅ Add RLS policies on all tables
- ✅ Create indexes for performance
- ✅ Run npm run db:check before pushing
- ✅ Run npm run db:migrate:dry before deploying
- ✅ Document migration purpose in comments
- ✅ Wait for staging to pass before approving production
- ✅ Monitor application after deployment

### ❌ DON'T

- ❌ Drop columns, tables, or rename columns (Guardian blocks this)
- ❌ Skip RLS on new tables
- ❌ Mix DDL and DML in single migration
- ❌ Use unparameterized dynamic SQL
- ❌ Manually apply migrations outside CI/CD
- ❌ Modify applied migrations (Guardian prevents this)
- ❌ Push migrations without running db:check
- ❌ Approve production without reviewing staging logs
- ❌ Assume deployment succeeded without verification
- ❌ Deploy during business hours without monitoring

---

## Deployment Checklist

Before deploying to production:

- [ ] Migration file created with proper naming (NNN_description.sql)
- [ ] SQL uses idempotent patterns (CREATE TABLE IF NOT EXISTS, etc.)
- [ ] RLS policies included for all new tables
- [ ] Indexes added for performance-critical columns
- [ ] Comments document purpose and impact
- [ ] npm run db:check passes locally ✅
- [ ] npm run db:migrate:dry passes locally ✅
- [ ] npm run db:status shows migration as pending ✅
- [ ] Committed with clear message and testing notes
- [ ] PR created with description
- [ ] Code review approval received
- [ ] Guardian checks pass on PR ✅
- [ ] Pre-flight checks pass on PR ✅
- [ ] SQL safety checks pass on PR ✅
- [ ] Merged to main branch
- [ ] Staging deployment completed successfully ✅
- [ ] Production approval gates reviewed
- [ ] Production deployment triggered
- [ ] db:status shows migration as applied ✅
- [ ] Application health verified
- [ ] Team notified of deployment

---

## Support & Questions

**Documentation**:
- See `docs/migration-automation-guide.md` for basic usage
- See `DATABASE-AUDIT-REPORT.md` for database health
- See `.claude/rules/database-migrations.md` for RLS patterns

**Troubleshooting**:
- Run `npm run db:check` for diagnostics
- Check GitHub Actions logs for detailed error messages
- Review error_message column in _migrations table
- Ask in #database Slack channel

**Emergency Hotline**:
- Critical production issue: Contact database admin
- Create GitHub issue with [MIGRATION] label

---

**Status**: ✅ **PRODUCTION READY**

