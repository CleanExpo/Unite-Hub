# Migration Audit — 08/03/2026

## Executive Summary

The `supabase/migrations/` directory contains **417 live migration files** and **38 archived files** (totalling 455), far exceeding any manageable migration history for a product of this scale. The critical finding is **93 excess files from duplicate numeric prefixes** — meaning at least 93 migrations share a sequence number with another migration, producing undefined execution order in Supabase's sequential runner. Additionally, the archived directory contains evidence of repeated failed RLS attempts (14 variants of migration `020`) and destructive operations (`021_NUCLEAR_RESET`, `022_FORCE_CLEAN`) that indicate the schema history is not trustworthy. The only safe remediation is a schema consolidation: extract the current live schema, write a single canonical baseline migration, and discard the accumulated history.

---

## Scale Statistics

| Metric | Count |
|--------|-------|
| Live migration files (in `migrations/`, excl. `_archived_migrations/`) | 417 |
| Archived migration files (in `_archived_migrations/`) | 38 |
| Total SQL files in migration directory | 455 |
| Loose SQL files in project root | 0 |
| Numeric prefix collisions (duplicate sequence numbers) | **93 excess files** |
| Distinct sequence numbers with duplicates | 20+ |

---

## Findings

### CRITICAL (blocks Phase 2)

| Finding | Files | Recommendation |
|---------|-------|----------------|
| 93 migrations share a numeric prefix with another migration | See table below | Schema consolidation mandatory — current history is not safe to replay |
| `020_implement_real_rls_policies.sql` has 14 variants in archive | `_archived_migrations/020_implement_real_rls_policies_*.sql` | RLS was never stabilised — audit current live RLS state before proceeding |
| `021_NUCLEAR_RESET.sql` and `022_FORCE_CLEAN.sql` in archive | `_archived_migrations/` | Destructive resets in migration history indicate schema was wiped at least twice |
| Migrations jump from `015` to `019` — gaps `016`, `017`, `018` missing | `migrations/` directory | Migration sequence has unexplained gaps — history is incomplete |

### Duplicate Prefix Detail (Live Migrations)

The following sequence numbers each have **3 or more** files in the live migrations folder:

| Prefix | File Count | Example Files |
|--------|-----------|---------------|
| `100` | 3 | `100_multi_agent_system.sql`, `100_unified_automation_matrix.sql`, `100_website_audits.sql` |
| `148` | 3 | `148_founder_ops_tasks.sql`, `148_signal_purity_engine.sql`, `148_unified_frontend_console.sql` |
| `150` | 3 | `150_autonomous_tenant_expansion.sql`, `150_founder_ops_archive_bridge.sql`, `150_load_aware_decision_pipeline.sql` |
| `151` | 3 | `151_autonomous_cross_engine_harmonisation.sql`, `151_founder_flight_deck_v2.sql`, `151_search_console_cache.sql` |
| `152` | 3 | `152_autonomous_global_system_seal.sql`, `152_multi_agency_broadcast_engine.sql`, `152_search_console_tokens.sql` |
| `153` | 3 | `153_campaign_blueprints.sql`, `153_client_sites_secrets_vault.sql`, `153_narrative_intelligence_engine.sql` |
| `040` | 3 | Multiple |
| `030` | 3 | `030_media_storage_bucket.sql` + 2 others |
| `028` | 3 | `028_mindmap_feature.sql` + 2 others |
| `019` | 3 | `019_fix_organization_id_type.sql` + archived variants |
| `014` | 3 | `014_fix_username_constraint.sql`, `014_oauth_states.sql` + archived |

Additionally, prefixes `300`–`403` range have 2-file collisions across a broad numeric range, indicating parallel development tracks were merged without sequence reconciliation.

### HIGH (address in Phase 2)

| Finding | Files | Recommendation |
|---------|-------|----------------|
| `_archived_migrations/` contains 38 files that may reference tables that were dropped and recreated | `_archived_migrations/*.sql` | Do not re-run archived migrations — they are confirmed broken |
| Migration `023_CREATE_FUNCTIONS_ONLY.sql` and `024_TEST_ONE_POLICY.sql` have test/debug names in live history | Live migrations | Indicates experimental SQL was committed as permanent migrations |
| Migration `026_FINAL_DATABASE_SECURITY.sql` and `026_performance_indexes.sql` are both numbered `026` | Live migrations | Execution order undefined — one of these may silently fail |

### MEDIUM (address in Phase 3–4)

| Finding | Files | Recommendation |
|---------|-------|----------------|
| No rollback scripts present for any migration | `migrations/` | Add `.down.sql` companions for any future migrations |
| Migration naming convention is inconsistent (some use `SCREAMING_SNAKE`, some `snake_case`, some descriptive prose) | Various | Standardise naming before Phase 2 migration work |

### INFO

| Finding | Location | Recommendation |
|---------|----------|----------------|
| `_archived_migrations/` directory exists, indicating someone attempted cleanup previously | `migrations/_archived_migrations/` | Good precedent — continue with full consolidation |

---

## Statistics

- Total migration files audited: **455** (417 live + 38 archived)
- Safe to replay: **Unknown** — sequence collisions make this unverifiable without a clean environment
- Recommended for archival/deletion: **≥93** (duplicate files) + **38** (already archived)
- Target state: **1 canonical baseline migration** + incremental future migrations

---

## Recommended Actions (Priority Order)

1. **Do not run `supabase db reset`** in any environment until schema consolidation is complete — the duplicate prefixes will cause unpredictable results
2. Export the current live Supabase schema using `supabase db dump --schema public` to capture the actual running state
3. Write `000_baseline_schema.sql` from the dumped schema — this becomes the single source of truth
4. Archive the entire `migrations/` directory to `_archived_migrations/legacy_pre_consolidation/`
5. Going forward, enforce monotonically increasing 6-digit timestamps (e.g. `20260308120000_add_contacts_index.sql`) — never sequential integers
6. Delete `_archived_migrations/021_NUCLEAR_RESET.sql` and `022_FORCE_CLEAN.sql` after baseline is confirmed working
