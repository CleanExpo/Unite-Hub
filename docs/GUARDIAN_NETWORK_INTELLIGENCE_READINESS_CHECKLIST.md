# Guardian Network Intelligence (X01–X04) Readiness Checklist

**Prepared for**: Operations & Release Team
**Date**: December 2025
**Purpose**: Verify production readiness of X-series Network Intelligence suite

---

## Pre-Deployment: Database & Infrastructure

- [ ] **Migrations Applied**
  - [ ] 590_guardian_workspace_rls_helper.sql (RLS helper function)
  - [ ] 591_guardian_x02_network_anomaly_signals.sql (X02 tables)
  - [ ] 592_guardian_x03_network_early_warnings.sql (X03 tables)
  - [ ] 593_guardian_x04_network_intelligence_governance.sql (X04 tables)
  - Command: `supabase db push` or apply via Supabase SQL Editor

- [ ] **RLS Policies Verified**
  - [ ] `guardian_network_telemetry_hourly` has tenant isolation RLS
  - [ ] `guardian_network_benchmark_snapshots` has tenant isolation RLS
  - [ ] `guardian_network_anomaly_signals` has tenant isolation RLS
  - [ ] `guardian_network_early_warnings` has tenant isolation RLS
  - [ ] `guardian_network_feature_flags` has tenant isolation RLS
  - [ ] `guardian_network_governance_events` has tenant isolation RLS
  - Command: `SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename LIKE 'guardian_network%'` → verify policies attached

- [ ] **Indexes Created**
  - [ ] Telemetry table: `idx_x01_telemetry_tenant_bucket`
  - [ ] Anomalies table: `idx_x02_anomalies_tenant_date`
  - [ ] Early warnings table: `idx_x03_warning_tenant_date`
  - [ ] Governance table: `idx_x04_governance_tenant_date`
  - Command: `\d guardian_network_*` → verify indexes listed

- [ ] **Database Capacity**
  - [ ] Estimated telemetry rows/day acceptable (e.g., 1M+ rows with good query performance)
  - [ ] Storage quota verified (check Supabase project settings)
  - [ ] Backup schedule confirmed (daily snapshots for audit trail)

---

## Deployment: Code & Services

- [ ] **X01–X04 Services Deployed**
  - [ ] `networkTenantFingerprintService.ts` — Tenant anonymization
  - [ ] `networkTelemetryIngestionService.ts` — X01 ingestion
  - [ ] `networkAnomalyDetectionService.ts` — X02 detection
  - [ ] `patternFeatureExtractor.ts`, `patternMiningService.ts`, `earlyWarningMatcher.ts` — X03 services
  - [ ] `networkFeatureFlagsService.ts` — X04 feature flags
  - [ ] `networkGovernanceLogger.ts` — X04 audit trail
  - [ ] `networkOverviewService.ts` — X04 dashboard aggregation

- [ ] **APIs Deployed**
  - [ ] `/api/guardian/network/benchmarks` (X01/X02)
  - [ ] `/api/guardian/network/anomalies` (X02)
  - [ ] `/api/guardian/network/early-warnings` (X03)
  - [ ] `/api/guardian/network/patterns` (X03)
  - [ ] `/api/guardian/admin/network/settings` (X04)
  - [ ] `/api/guardian/admin/network/governance` (X04)
  - [ ] `/api/guardian/admin/network/overview` (X04)
  - [ ] `/api/cron/detect-network-anomalies` (X02 job)
  - Command: `npm run build && npm run typecheck` → no errors

- [ ] **UI Deployed**
  - [ ] Network Intelligence console page: `/guardian/admin/network`
  - [ ] Dashboard loads without errors
  - [ ] All three tabs (Overview, Insights, Settings) render correctly
  - [ ] Feature flag toggles are functional

- [ ] **Environment Variables Set**
  - [ ] `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL
  - [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Anonymous key
  - [ ] `SUPABASE_SERVICE_ROLE_KEY` — Service role for RLS bypass (admin operations)
  - [ ] `ANTHROPIC_API_KEY` — For AI hint generation (optional in v1)

---

## Feature Flag Configuration

- [ ] **Default Flags Set (Conservative Model)**
  - [ ] All feature flags default to `false` (opt-in)
  - [ ] No tenant is automatically enrolled in telemetry ingestion
  - [ ] No tenant sees anomalies or early warnings by default
  - Command: Verify `guardian_network_feature_flags` table is empty or all `false`

- [ ] **Staging Environment Configuration**
  - [ ] At least one test tenant has all flags set to `true`
  - [ ] Feature flags set via `/api/guardian/admin/network/settings` PATCH
  - [ ] Governance events logged for each flag change

- [ ] **Production Environment Configuration**
  - [ ] Feature flags for production tenants remain `false` (opt-in only)
  - [ ] Documented process for tenant opt-in request (ticket, support team)
  - [ ] Operator SOP for enabling features per tenant request

---

## Functionality Testing

### X01: Telemetry Ingestion
- [ ] **Telemetry Ingestion Service**
  - [ ] `ingestHourlyTelemetryForTenant()` called successfully
  - [ ] No errors when `enable_network_telemetry=false` (skip ingestion)
  - [ ] Rows inserted into `guardian_network_telemetry_hourly` when enabled
  - [ ] Tenant hash obscures tenant identity (verify hash is deterministic, not reversible)
  - Command: Trigger manual ingestion for test tenant, query telemetry table

- [ ] **Telemetry Access Control**
  - [ ] Tenant can view their own telemetry via RLS
  - [ ] Tenant cannot view other tenants' telemetry (RLS enforces)
  - [ ] API returns 403 Forbidden if tenant tries to query another tenant's data

### X02: Anomaly Detection
- [ ] **Anomaly Detection Job**
  - [ ] Cron job `/api/cron/detect-network-anomalies` runs successfully
  - [ ] No errors when `enable_network_anomalies=false` (skip detection)
  - [ ] Anomalies detected and inserted into `guardian_network_anomaly_signals`
  - [ ] Severity levels correctly assigned (low, medium, high, critical)
  - Command: Check cron logs, query anomaly signal table

- [ ] **Benchmark Snapshots**
  - [ ] Cohort baselines computed correctly
  - [ ] `guardian_network_benchmark_snapshots` populated per tenant
  - [ ] Benchmark API returns cohort averages only (no individual tenant metrics visible)

- [ ] **Anomaly API Gating**
  - [ ] API `/api/guardian/network/anomalies` returns 4xx if `enable_network_anomalies=false`
  - [ ] API returns anomaly data if flag is `true`
  - [ ] Response includes tenant's own anomalies only (no cross-tenant data)

### X03: Early Warnings
- [ ] **Pattern Signature Generation**
  - [ ] Pattern mining job derives patterns from aggregated anomalies
  - [ ] Patterns stored in `guardian_network_pattern_signatures` (global, read-only)
  - [ ] No tenant IDs in pattern descriptions (anonymity verified)
  - Command: Query pattern signatures, verify structure

- [ ] **Early Warning Generation**
  - [ ] Early warning job matches tenant anomalies to patterns
  - [ ] Warnings inserted into `guardian_network_early_warnings` (tenant-scoped)
  - [ ] Match scores computed correctly (0–1 range)
  - [ ] No errors when `enable_network_early_warnings=false` (skip generation)

- [ ] **Early Warning API Gating**
  - [ ] API `/api/guardian/network/early-warnings` returns 4xx if `enable_network_early_warnings=false`
  - [ ] API returns early warnings if flag is `true`
  - [ ] Warning status update (PATCH) works; transitions to acknowledged/dismissed

### X04: Governance & Console
- [ ] **Feature Flag Management**
  - [ ] PATCH `/api/guardian/admin/network/settings` updates flags correctly
  - [ ] Flag updates logged in `guardian_network_governance_events` with actor ID
  - [ ] GET `/api/guardian/admin/network/settings` returns current flags
  - [ ] Cache invalidation works after flag change (next request fetches fresh data)

- [ ] **Governance Audit Trail**
  - [ ] GET `/api/guardian/admin/network/governance` returns events with filters
  - [ ] Events include timestamp, actor, event_type, context, details
  - [ ] Details are sanitized (no PII like email, password, API keys)
  - [ ] Pagination works (limit, offset parameters)

- [ ] **Network Intelligence Console**
  - [ ] `/guardian/admin/network` page loads without errors
  - [ ] Overview tab displays KPIs: anomalies (30d), open warnings, benchmarks, cohorts
  - [ ] Insights tab shows conditional data based on enabled flags
  - [ ] Settings tab renders toggles for all six feature flags
  - [ ] Toggling a flag via UI updates `/api/guardian/admin/network/settings` PATCH
  - [ ] Settings changes reflected in governance event history
  - [ ] Governance history panel displays recent events with actor and timestamp

- [ ] **Overview Aggregation**
  - [ ] GET `/api/guardian/admin/network/overview` returns complete dashboard model
  - [ ] Stats: anomaliesLast30d, earlyWarningsOpen, benchmarksAvailable, telemetryActiveSince
  - [ ] Cohorts used derived correctly from benchmark snapshots
  - [ ] Recent anomalies, warnings, governance events listed (limit 10 each)

---

## Privacy & Security Testing

- [ ] **RLS Isolation**
  - [ ] Tenant A cannot query Tenant B's telemetry (403 via RLS)
  - [ ] Tenant A cannot query Tenant B's anomalies (403 via RLS)
  - [ ] Tenant A cannot query Tenant B's early warnings (403 via RLS)
  - [ ] Tenant A cannot query Tenant B's feature flags (403 via RLS)
  - [ ] Tenant A cannot query Tenant B's governance events (403 via RLS)
  - Command: Use different workspace IDs in test queries, verify RLS denies access

- [ ] **Anonymity Verification**
  - [ ] Telemetry rows contain hash, not tenant ID
  - [ ] Pattern signatures contain no tenant identifiers
  - [ ] Early warning descriptions are anonymized (no tenant names)
  - [ ] Cohort keys use only public segments (region, size, vertical—no tenant mapping)

- [ ] **PII Sanitization**
  - [ ] Governance event details don't contain email, password, API keys
  - [ ] Details are truncated if oversized (verify max 500 chars)
  - [ ] Nested PII fields are filtered (e.g., nested email in metadata)
  - Command: Attempt to log event with email in details, query event, verify sanitized

- [ ] **Audit Trail Immutability**
  - [ ] Governance events are append-only (no updates or deletes)
  - [ ] Timestamps are server-generated, not client-provided
  - [ ] Actor ID immutable (cannot retroactively change who triggered event)

---

## Performance & Load Testing

- [ ] **Telemetry Ingestion Performance**
  - [ ] Ingestion of 100K hourly rows/day completes in < 10s
  - [ ] Query `guardian_network_telemetry_hourly` (indexed by tenant, bucket_date) returns < 100ms
  - [ ] Hash computation (tenant fingerprint) is deterministic and fast (< 1ms)

- [ ] **Anomaly Detection Performance**
  - [ ] Anomaly detection job for all tenants completes in < 5 minutes
  - [ ] Anomaly API query returns in < 1s (via index)
  - [ ] Benchmark snapshot aggregation completes in < 30s

- [ ] **Early Warning Performance**
  - [ ] Pattern mining completes for all cohorts in < 2 minutes
  - [ ] Early warning generation completes for all tenants in < 5 minutes
  - [ ] Early warning API query returns in < 500ms

- [ ] **Console Performance**
  - [ ] Network Intelligence console page loads in < 2s
  - [ ] Overview aggregation API (`/overview`) returns in < 1s
  - [ ] Flag toggle update PATCH returns in < 500ms
  - [ ] Governance event retrieval returns in < 800ms (even with 1K+ events)

---

## Operational Readiness

- [ ] **Monitoring & Alerts**
  - [ ] Dashboard created to monitor telemetry ingestion rate
  - [ ] Alert configured: telemetry ingestion failures > 5% → escalate
  - [ ] Alert configured: anomaly detection latency > 10s → escalate
  - [ ] Alert configured: RLS policy violations spike → investigate
  - [ ] Grafana/datadog dashboards link to Guardian project

- [ ] **Logging & Debugging**
  - [ ] Application logs capture X01–X04 service errors
  - [ ] Governance events queryable by event_type, context for debugging
  - [ ] Telemetry ingestion logs include row counts, hash timing, cohort assignments

- [ ] **Operator Documentation**
  - [ ] Created SOP: "How to Enable X-Series for a Tenant"
  - [ ] Created SOP: "How to Review Governance Event Audit Trail"
  - [ ] Created SOP: "How to Troubleshoot Anomaly Detection Failures"
  - [ ] Created SOP: "How to Interpret Console KPIs"
  - [ ] Operators trained on Network Intelligence console
  - [ ] Escalation path defined for X-series issues

- [ ] **Tenant Communication**
  - [ ] Customer documentation prepared: "Understanding Network Intelligence"
  - [ ] Privacy statement updated to reflect X-series data usage
  - [ ] Onboarding email template created for tenant opt-in requests
  - [ ] FAQ prepared: "Is my data shared with other customers?" (Answer: No)

---

## Final Validation (Pre-Go-Live)

- [ ] **End-to-End Test: One Tenant**
  1. [ ] Enable all feature flags for test tenant
  2. [ ] Trigger telemetry ingestion (X01)
  3. [ ] Verify telemetry rows appear in DB
  4. [ ] Trigger anomaly detection job (X02)
  5. [ ] Verify anomalies and benchmarks appear
  6. [ ] Trigger pattern mining and early warning jobs (X03)
  7. [ ] Verify early warnings appear in console
  8. [ ] Open Network Intelligence console, verify all tabs load data
  9. [ ] Toggle a feature flag, verify governance event logged
  10. [ ] Disable telemetry flag, verify new telemetry is NOT ingested
  11. [ ] Check governance event audit trail for all actions

- [ ] **Cross-Tenant Isolation Test**
  1. [ ] Create Test Tenant A and Test Tenant B
  2. [ ] Enable telemetry for Tenant A only
  3. [ ] Verify Tenant B has no telemetry ingestion
  4. [ ] Attempt Tenant B accessing Tenant A's data via API → 403 Forbidden
  5. [ ] Verify governance events for Tenant A isolated from Tenant B

- [ ] **Compliance Review**
  - [ ] Privacy team signs off on X-series data usage
  - [ ] Security team confirms RLS policies are correctly enforced
  - [ ] Legal team confirms customer communication is accurate
  - [ ] Compliance checklist completed (SOC 2, GDPR, etc.)

---

## Post-Deployment

- [ ] **Monitoring First 24 Hours**
  - [ ] Telemetry ingestion rate stable
  - [ ] Anomaly detection job completes successfully
  - [ ] Early warning generation job completes successfully
  - [ ] No RLS violations or security alerts
  - [ ] Console page has no JavaScript errors (check browser console)

- [ ] **Stakeholder Notification**
  - [ ] Ops team notified: X-series is live, feature flags are conservative (opt-in)
  - [ ] Product team notified: ready to promote X-series features to customers
  - [ ] Support team notified: refer X-series questions to ops/product
  - [ ] Customer success team notified: can offer X-series opt-in to customers

- [ ] **First Customer Opt-In**
  - [ ] Receive customer request to enable X-series features
  - [ ] Update feature flags via `/api/guardian/admin/network/settings`
  - [ ] Log governance event with customer context
  - [ ] Monitor customer's telemetry ingestion for 24 hours
  - [ ] Gather feedback on console usability and value

---

## Sign-Off

| Role | Name | Date | Sign-Off |
|------|------|------|----------|
| Database Admin | _______________ | __________ | ☐ |
| Release Engineer | _______________ | __________ | ☐ |
| Security Team | _______________ | __________ | __________ | ☐ |
| Ops Lead | _______________ | __________ | ☐ |
| Product Manager | _______________ | __________ | ☐ |

---

**Go/No-Go Decision**: ☐ GO | ☐ NO-GO (resolve blockers and recheck)

**Release Notes**: See `X_SERIES_OVERVIEW.md` and individual phase docs.
