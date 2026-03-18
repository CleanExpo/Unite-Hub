# Database Architecture

**Platform**: Supabase PostgreSQL
**Status**: ⏳ To be migrated from CLAUDE.md
**Last Updated**: 2026-01-15

---

## Schema Overview

**Total Tables**: 15 core tables (see `data/database-schema.yaml`)

### Core Tables
- `organizations` - Top-level org entities
- `users` - User accounts
- `user_profiles` - Extended user data
- `user_organizations` - User-org relationships
- `workspaces` - Team workspaces

### Contact & Email
- `contacts` - CRM contacts (with ai_score)
- `emails` - Email messages
- `email_opens` - Open tracking
- `email_clicks` - Click tracking
- `integrations` - OAuth integrations (Gmail, etc.)

### Campaigns
- `campaigns` - Email campaigns
- `drip_campaigns` - Drip sequences
- `campaign_steps` - Sequence steps
- `campaign_enrollments` - Contact enrollments
- `campaign_execution_logs` - Step execution history

### Content & AI
- `generatedContent` - AI-generated content drafts
- `aiMemory` - Agent memory storage
- `auditLogs` - System audit trail

## Critical Pattern: Workspace Isolation

**ALL database queries MUST be scoped to workspace**:

```typescript
// ❌ WRONG - Returns data from all workspaces
const { data } = await supabase
  .from("contacts")
  .select("*");

// ✅ CORRECT - Scoped to user's workspace
const { data } = await supabase
  .from("contacts")
  .select("*")
  .eq("workspace_id", workspaceId);
```

### Getting workspaceId

```typescript
// In API routes
const workspaceId = req.nextUrl.searchParams.get("workspaceId");

// In React components
const { currentOrganization } = useAuth();
const workspaceId = currentOrganization?.org_id;
```

## Migrations

**Location**: `supabase/migrations/`

**How to Apply**:
1. Create migration file: `00X_description.sql`
2. Go to Supabase Dashboard → SQL Editor
3. Copy/paste SQL and run
4. **Important**: Supabase caches schema. After migration:
   - Wait 1-5 minutes for auto-refresh, OR
   - Run: `SELECT * FROM table_name LIMIT 1;` to force cache refresh

### Pattern for Idempotent Constraints

```sql
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'constraint_name') THEN
    ALTER TABLE table_name ADD CONSTRAINT constraint_name CHECK (condition);
  END IF;
END $$;
```

## RLS (Row Level Security)

**CRITICAL**: Before ANY RLS-related work:

### Step 1: Run Diagnostics (30 seconds)

```sql
-- In Supabase SQL Editor
\i scripts/rls-diagnostics.sql
```

### Step 2: Follow 3-Step Process

See `.claude/rules/database/rls-workflow.md` for complete workflow:
- Create helper functions FIRST (migration 023)
- Test on ONE table (migration 024)
- Apply to all tables (migration 025)

**Common Error**:
```
Error: "operator does not exist: uuid = text"
Root Cause: Helper functions don't exist in database
Solution: Run diagnostics, create functions (023), THEN policies
```

**DO NOT skip diagnostics. DO NOT create policies before functions exist.**

## Schema Reference

**MANDATORY**: Before writing ANY SQL migration, check `.claude/SCHEMA_REFERENCE.md`

Contains:
- Actual table schemas (profiles, user_profiles, user_organizations)
- Custom types (user_role ENUM)
- Supabase restrictions (no auth schema access)
- Correct role check patterns
- Pre-migration checklist

**Common Mistakes to Avoid**:
- `profiles.role` uses `user_role` ENUM ('FOUNDER', 'STAFF', 'CLIENT', 'ADMIN')
- `user_profiles` does NOT have a role column
- Functions must be in `public` schema, NOT `auth`

---

**To be migrated from**: CLAUDE.md lines 426-476
**Related**: `rules/database/migrations.md`, `rules/database/rls-workflow.md`
