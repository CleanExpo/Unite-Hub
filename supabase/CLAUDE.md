# Database & Migrations Guide

## IMPORTANT: Before ANY migration
1. Check `.claude/SCHEMA_REFERENCE.md` for existing tables
2. Run `\i scripts/rls-diagnostics.sql` in Supabase SQL Editor
3. Use IF NOT EXISTS guards for idempotency

## Exemplar Files
- `migrations/469_synthex_business_registry.sql` - Complete SQL Pre-Flight pattern
- `migrations/300_founder_tables.sql` - RLS policy patterns
- `migrations/001_initial_schema.sql` - Core schema structure

## DO: Migration Template

```sql
-- =============================================================================
-- D[XX]: [Migration Title]
-- Phase: [Project Phase]
-- Prefix: [unique_prefix]_*
-- =============================================================================
-- SQL Pre-Flight Checklist:
-- [ ] Dependencies with IF NOT EXISTS
-- [ ] ENUMs with DO blocks and pg_type checks
-- [ ] Unique prefix: [prefix]_*
-- [ ] Column naming to avoid type conflicts
-- [ ] RLS with current_setting('app.tenant_id', true)::uuid
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. ENUM Types (with existence checks)
-- -----------------------------------------------------------------------------

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'my_status_enum') THEN
    CREATE TYPE my_status_enum AS ENUM ('active', 'inactive', 'archived');
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- 2. Tables (with IF NOT EXISTS)
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS my_table (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL,
  status my_status_enum DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 3. Indexes
-- -----------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_my_table_tenant
  ON my_table(tenant_id);

CREATE INDEX IF NOT EXISTS idx_my_table_workspace
  ON my_table(workspace_id);

-- -----------------------------------------------------------------------------
-- 4. RLS Policies
-- -----------------------------------------------------------------------------

ALTER TABLE my_table ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tenant_isolation" ON my_table;
CREATE POLICY "tenant_isolation" ON my_table
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- -----------------------------------------------------------------------------
-- 5. Triggers (with IF NOT EXISTS checks)
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_my_table_updated_at ON my_table;
CREATE TRIGGER update_my_table_updated_at
  BEFORE UPDATE ON my_table
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

## DO: RLS Policy Patterns

```sql
-- Tenant isolation (most common)
CREATE POLICY "tenant_isolation" ON my_table
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Workspace + user isolation
CREATE POLICY "workspace_user_isolation" ON my_table
  USING (
    workspace_id = current_setting('app.workspace_id', true)::uuid
    AND user_id = auth.uid()
  );

-- Read-only for all, write for owner
CREATE POLICY "read_all_write_owner" ON my_table
  FOR SELECT USING (true);
CREATE POLICY "write_owner_only" ON my_table
  FOR ALL USING (user_id = auth.uid());
```

## DON'T: Anti-patterns

- **CREATE TYPE without check**: Will fail on re-run
  ```sql
  -- BAD
  CREATE TYPE my_enum AS ENUM ('a', 'b');

  -- GOOD
  DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'my_enum') THEN
      CREATE TYPE my_enum AS ENUM ('a', 'b');
    END IF;
  END $$;
  ```

- **RLS without tenant isolation**: Security vulnerability
- **Missing indexes on FKs**: Performance degradation
- **No ON DELETE CASCADE**: Orphaned records

## Migration Naming Convention

```
[sequence]_[feature]_[action].sql

Examples:
469_synthex_business_registry.sql
470_add_tenant_audit_log.sql
471_fix_rls_policies.sql
```

## Search Commands

```bash
rg "CREATE TABLE" supabase/migrations/ | tail -20       # Recent tables
rg "CREATE POLICY" supabase/migrations/ -A 3           # RLS patterns
rg "synthex_" supabase/migrations/ | head -30          # Synthex prefix
rg "IF NOT EXISTS" supabase/migrations/ | tail -10     # Idempotent patterns
```

## Pre-Migration Checklist

```bash
# 1. Check schema reference
cat .claude/SCHEMA_REFERENCE.md | grep "table_name"

# 2. Run diagnostics in Supabase SQL Editor
\i scripts/rls-diagnostics.sql

# 3. Test migration locally (if possible)
# Copy SQL to Supabase Dashboard → SQL Editor → Run
```

## Common Gotchas

1. **ENUM already exists**: Always use DO block with pg_type check
2. **Table exists but columns differ**: Use ALTER TABLE, not CREATE TABLE
3. **RLS blocks admin**: Add bypass policy for service role
4. **Migration order matters**: Dependencies must be created first
