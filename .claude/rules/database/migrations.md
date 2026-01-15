# Database Migration Rules

**Status**: ⏳ To be migrated from CLAUDE.md
**Last Updated**: 2026-01-15

---

## Migration Process

**Location**: `supabase/migrations/`

### How to Apply

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

## Schema Reference

**MANDATORY**: Before writing ANY SQL migration, check `.claude/SCHEMA_REFERENCE.md`

This document contains:
- Actual table schemas (profiles, user_profiles, user_organizations)
- Custom types (user_role ENUM)
- Supabase restrictions (no auth schema access)
- Correct role check patterns
- Pre-migration checklist

### Common Mistakes to Avoid

- `profiles.role` uses `user_role` ENUM ('FOUNDER', 'STAFF', 'CLIENT', 'ADMIN')
- `user_profiles` does NOT have a role column
- Functions must be in `public` schema, NOT `auth`

## Database Commands

```bash
npm run check:db  # Verify schema
```

**Migrations**: Go to Supabase Dashboard → SQL Editor

---

**To be migrated from**: CLAUDE.md lines 513-558
