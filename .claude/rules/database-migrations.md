---
paths: supabase/migrations/**/*.sql
---

# Database Migrations

## Location & Naming
`supabase/migrations/NNN_description.sql`

## Idempotent Patterns

**ENUMs** (avoid "already exists" errors):
```sql
DO $$ BEGIN
  CREATE TYPE synthex_exp_status AS ENUM ('draft', 'running', 'paused', 'completed', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
```

**Tables**:
```sql
CREATE TABLE IF NOT EXISTS your_table (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id),
  created_at TIMESTAMP DEFAULT NOW()
);
```

**RLS Policies**:
```sql
-- Drop if exists, then create
DROP POLICY IF EXISTS "tenant_isolation" ON your_table;
CREATE POLICY "tenant_isolation" ON your_table
FOR ALL USING (workspace_id = get_current_workspace_id());
```

## Critical Rules

**RLS Policies**: All tables MUST have Row Level Security with `tenant_id`/`workspace_id` filtering

**Table Prefixes**:
- Unite-Hub core: No prefix
- Synthex: `synthex_*` 
- Founder tools: `founder_*`

**Before Migration**: 
1. Check existing schema: Read `docs/guides/schema-reference.md`
2. Run RLS diagnostics: `\i scripts/rls-diagnostics.sql`

**Apply**: Supabase Dashboard → SQL Editor → Paste migration → Run

## Common Migration Patterns

```sql
-- Add column safely
ALTER TABLE your_table 
ADD COLUMN IF NOT EXISTS new_column TEXT;

-- Add index safely  
CREATE INDEX IF NOT EXISTS idx_table_column ON your_table(column);

-- Update RLS
ALTER TABLE your_table ENABLE ROW LEVEL SECURITY;
