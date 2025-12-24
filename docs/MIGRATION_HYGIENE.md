# Migration Hygiene (Supabase)

## Rules

- Only timestamped migrations live in `supabase/migrations/`:
  - `YYYYMMDDHHMMSS_name.sql`
- Anything else must be moved to `supabase/migrations/_quarantine_invalid_names/` and should not be executed by Supabase.

## Local commands

- Quarantine invalid files (safe rename via `git mv` when tracked):
  - `npm run migrations:quarantine`
- Validate hygiene (CI uses this):
  - `npm run migrations:check`

## Why

Mixed filename conventions in `supabase/migrations/` cause CI drift and can lead to skipped or mis-ordered migrations during automated deploys.

