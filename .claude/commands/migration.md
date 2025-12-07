Create database migration for: $ARGUMENTS

Follow these steps:

1. Check `.claude/SCHEMA_REFERENCE.md` for existing tables
2. Read `supabase/CLAUDE.md` for migration patterns
3. Determine next migration sequence number:
   ```bash
   ls supabase/migrations/ | tail -1
   ```
4. Create migration file: `supabase/migrations/[XXX]_[description].sql`
5. Include these elements:
   - SQL Pre-Flight Checklist header
   - ENUM types with DO block and pg_type check
   - Tables with IF NOT EXISTS
   - Indexes on foreign keys
   - RLS policies with tenant isolation
   - Triggers for updated_at (if applicable)
6. Output SQL for review before running
7. Instructions: Copy SQL to Supabase Dashboard → SQL Editor → Run

IMPORTANT: Do NOT automatically run migrations. Output SQL for manual execution.

Reference exemplar: `supabase/migrations/469_synthex_business_registry.sql`
