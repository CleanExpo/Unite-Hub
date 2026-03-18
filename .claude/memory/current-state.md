# Current State
> Updated: 19/03/2026 AEST

## Active Task
Phase 12 DB migrations — partially applied in Supabase SQL editor.

## Completed This Session
- Phase 11 (all 5 P1 fixes): UNI-1587 to UNI-1591 ✅
  - Vault click-to-reveal (no bulk decrypt)
  - Social channel token revocation on disconnect
  - Reddit connect route auth guard
  - email_triage_results INSERT/UPDATE/DELETE RLS
  - Advisory execute → Xero ManualJournal via xero-bridge.ts
- Phase 12 migrations written (all 5 files in supabase/migrations/)
- generated_content table recreated with Nexus 2.0 schema ✅
- ON DELETE CASCADE applied to: brand_identities, email_campaigns, platform_analytics, social_engagements, video_assets, advisory_cases ✅

## Pending DB Migrations (run in Supabase SQL editor)
1. Block 1: generated_content CASCADE FK (DROP + ADD CONSTRAINT)
2. Block 2: advisory_cases.xero_entry_id column (UNI-1591)
3. Block 3: bookkeeper_transactions Xero encryption columns (UNI-1593)
4. Block 4: 5 performance indexes (UNI-1594)
5. Block 5: email_triage_results RLS policies (UNI-1590, idempotent DO $$ block)

## Pending Linear Issues
- UNI-1595: CSP hardening (unsafe-eval/inline)
- UNI-1596: Rate limiter → x-vercel-forwarded-for
- UNI-1597: CI build — 5 missing env vars
- UNI-1598: GitHub Actions — pin @master tags
- UNI-1599: Privacy Act APP 11 — user data deletion API
- UNI-1600: Remove unused deps (react-dropzone, next-themes)
- UNI-1601: Migrate Modal.tsx → Radix Dialog
- UNI-1602: Split google.ts (731 LOC)
- UNI-1603: /founder/graph — implement or remove

## Next Steps
1. User to finish running 5 SQL blocks in Supabase
2. Update orchestrator.ts to encrypt on write / decrypt on read for raw_xero_data
3. Continue with UNI-1595 (CSP hardening) next session

## Key Files Modified This Session
- src/app/api/vault/entries/route.ts — metadata only, no bulk decrypt
- src/app/api/vault/entries/[id]/route.ts — new per-entry decrypt endpoint
- src/components/founder/vault/VaultEntry.tsx — click-to-reveal
- src/components/founder/vault/VaultGrid.tsx — removed secret from interface
- src/lib/integrations/social/channels.ts — deleteChannel() with token revocation
- src/app/api/social/channels/[id]/route.ts — DELETE handler (new)
- src/components/founder/social/ConnectionStrip.tsx — wired disconnect
- src/app/api/social/reddit/connect/route.ts — auth guard added
- src/lib/advisory/xero-bridge.ts — new, executeAdvisoryAction()
- src/app/api/advisory/cases/[id]/execute/route.ts — calls xero-bridge
- supabase/migrations/20260319000000_email_triage_rls_complete.sql
- supabase/migrations/20260319000001_advisory_xero_entry_id.sql
- supabase/migrations/20260319000002_on_delete_cascade_fk_fixes.sql
- supabase/migrations/20260319000003_xero_raw_data_encryption.sql
- supabase/migrations/20260319000004_performance_indexes.sql
