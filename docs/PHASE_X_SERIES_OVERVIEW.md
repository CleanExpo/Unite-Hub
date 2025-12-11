# Guardian X-Series Overview

**Status**: X01 Complete, X02+ In Planning
**Last Updated**: 2025-12-11
**Current Phase**: X01 — Privacy-Preserving Network Telemetry Foundation

## Vision

The **X-Series** extends Guardian's reach beyond individual tenant anomaly detection to enable **cross-tenant network intelligence** while maintaining absolute privacy guarantees.

Each X-series module builds on prior work:
- **Privacy-first design**: Tenant IDs are irreversibly hashed; no raw identifiers exposed
- **De-identified metrics**: Only coarse-grained aggregates (counts, percentiles, averages)
- **K-anonymity enforcement**: Minimum cohort size thresholds prevent inference attacks
- **Operational value**: Benchmarks, anomaly detection, competitive intelligence

## X01: Privacy-Preserving Network Telemetry Foundation ✅

**Status**: Complete (37 tests, 100% pass)
**Release**: 2025-12-11

### What It Does
- **Tenant Fingerprinting**: Irreversible HMAC-SHA256 hashing with server-side secrets
- **Hourly Telemetry Extraction**: Coarse metrics from Guardian & I-series tables (alerts, incidents, risk, QA, performance)
- **Daily Aggregation**: Percentile computation (p50, p75, p90, p95, p99) per cohort
- **Benchmark API**: Read-only, aggregated network intelligence (k-anonymity enforced)

### Key Files
- **Schema**: `supabase/migrations/590_guardian_x01_network_telemetry_foundation.sql` (3 tables, 0 RLS)
- **Services**:
  - `tenantFingerprintService.ts` — HMAC hashing + cohort metadata
  - `telemetryExtractor.ts` — Read-only metric aggregation
  - `telemetryIngestionService.ts` — Orchestration + bulk ingestion
  - `dailyAggregationService.ts` — Percentile computation + k-anonymity
- **API**: `GET /api/guardian/network/benchmarks` (filtering, aggregation, validation)
- **Tests**: `tests/guardian/x01_network_telemetry_foundation.test.ts` (37 tests, all passing)
- **Docs**: `docs/PHASE_X01_GUARDIAN_NETWORK_TELEMETRY_FOUNDATION.md` (comprehensive)

### Architecture
```
Guardian & I-Series Tables
         │
         ▼
[Fingerprint] → [Extract] → [Ingest] → [Hourly Table]
         │                                    │
         └────────────────────────┬──────────┘
                                  ▼
                           [Daily Aggregate]
                           (p50, p75, p90, p95, p99)
                                  │
                                  ▼
                           [Benchmark API]
                           (read-only, k-anon enforced)
```

### Privacy Guarantees
✅ **Tenant Identification Prevention**: No tenant IDs in X-series tables; only irreversible hashes
✅ **Data De-Identification**: Only coarse metrics (no rule names, domains, or PII)
✅ **K-Anonymity**: Minimum sample size enforcement (default: 5 tenants per cohort)
✅ **Cryptographic Assurance**: HMAC-SHA256 with server-side secret ensures hashes are deterministic but irreversible

### Operational Workflows
**Hourly Ingestion (every hour, 5 min past)**:
```bash
POST /api/cron/ingest-network-telemetry
# Ingests last hour of metrics for all active tenants
```

**Daily Aggregation (01:00 UTC)**:
```bash
POST /api/cron/aggregate-network-telemetry
# Computes percentiles for previous day, enforces k-anonymity
```

**Weekly Cleanup (Sunday 02:00 UTC)**:
```bash
POST /api/cron/cleanup-network-telemetry
# Deletes telemetry older than 90 days
```

**API Usage**:
```bash
GET /api/guardian/network/benchmarks
  ?cohortKey=region:apac
  &metricFamily=alerts
  &metricKey=alerts.total
  &startDate=2025-01-01
  &endDate=2025-01-31
  &minSampleSize=5
  &limit=100
```

## X02: Multi-Tenant Anomaly Detection (Planned)

**Expected**: Q1 2026

### Concept
Extend Guardian's anomaly detection to identify outliers within peer cohorts:
- **Percentile-based thresholds**: Flag tenants outside p95 range
- **Trend analysis**: Detect positive/negative trends across cohorts
- **Peer comparison**: "Your SaaS company processes 40% more incidents than median for your size band"

### Key Components
- Anomaly scoring service (comparing tenant metrics to cohort percentiles)
- Trend detection algorithm (Week-over-week, Month-over-month changes)
- Alert API for cross-tenant anomalies (privacy-respecting)
- Dashboard showing peer percentile bands

### Privacy Model
- No tenant IDs in anomaly alerts (only cohort + percentile info)
- Thresholds set on aggregate statistics, not individual events
- Opt-in per tenant (explicit enrollment in network intelligence)

## X03: Benchmarking & Competitive Intelligence (Planned)

**Expected**: Q1 2026

### Concept
Public-facing (opt-in) competitive benchmarks for industry sectors:
- "Average SaaS company in APAC detects 120 incidents/month"
- "Median response time to critical alert: 15 minutes"
- "Top performers block 95% of threats in first hour"

### Key Components
- Cohort-scoped benchmark reports (no tenant attribution)
- Time-series trend analysis (how baselines shift quarter-to-quarter)
- Vertical-specific dashboards (healthcare, fintech, retail, etc.)
- Email digest: "Your vertical's top 3 trends this month"

### Privacy Model
- Only anonymized, aggregated benchmarks published
- Minimum 20-tenant cohorts for any published benchmark
- Report generation from daily aggregates (no raw telemetry)
- Explicit opt-out available at tenant level

## X04: Proactive Network Defense (Planned)

**Expected**: Q2 2026

### Concept
Use cross-tenant intelligence to detect emerging threats:
- "3 SaaS companies in your region detected unusual API rate spike" → alert all SaaS companies
- "Healthcare sector detected new attack pattern" → trigger enhanced monitoring in healthcare cohort
- Shared threat intelligence (anonymized threat indicators)

### Key Components
- Threat pattern correlation service (cluster similar anomalies across tenants)
- Cohort-scoped alert mechanism (warn peer companies without attribution)
- Threat indicator API (hash-based signatures, no raw indicators)
- Automated response playbooks (escalation, monitoring, rules)

### Privacy Model
- Threat patterns described only in aggregated terms (no specific company data)
- Alerts reference only cohort identifiers, never individual tenants
- Threat indicators hashed (cannot be reversed to identify source)
- Strict access control (only Guardian operators + enrolled tenants)

## X05: Network-Wide Hypothesis Testing (Planned)

**Expected**: Q2-Q3 2026

### Concept
Support Guardian experiments across the network:
- "Does adding this rule reduce false positives?" → A/B test across cohort
- "Does slower SLA (5 min vs 1 min) reduce alert fatigue?" → measure impact
- "New ML model detects 20% more threats?" → validate on peer companies (opt-in)

### Key Components
- Experiment framework with network-wide rollout capabilities
- Metric aggregation for concurrent experiments
- Statistical significance testing (power analysis per cohort)
- Privacy-respecting comparison (cohort-level reporting, never tenant-level)

### Privacy Model
- Experiments opt-in only (explicit tenant consent)
- Results reported as cohort effects ("medium SaaS companies see 15% improvement")
- No tenant-identifying metadata in experiment results
- Automatic redaction if cohort size falls below minimum

---

## Implementation Roadmap

| Phase | Module | Status | Target |
|-------|--------|--------|--------|
| I01–I09 | Simulation, Regression, Chaos, Gatekeeper, Training, Coverage, Drift, Performance | ✅ Complete | 2025-12-10 |
| I10 | Unified QA Console | ✅ Complete | 2025-12-10 |
| **X01** | **Network Telemetry Foundation** | **✅ Complete** | **2025-12-11** |
| X02 | Multi-Tenant Anomaly Detection | Planned | Q1 2026 |
| X03 | Benchmarking & Competitive Intelligence | Planned | Q1 2026 |
| X04 | Proactive Network Defense | Planned | Q2 2026 |
| X05 | Network-Wide Hypothesis Testing | Planned | Q2-Q3 2026 |

## Design Principles (All X-Series Modules)

1. **Privacy First**: No individual tenant data exposed; only aggregates
2. **Irreversibility**: Hashes cannot be reversed; one-way transformation only
3. **K-Anonymity**: Minimum cohort sizes prevent re-identification
4. **Transparency**: Operators can explain why a tenant is flagged
5. **Opt-In**: Network intelligence features require explicit tenant enrollment
6. **Audit Trail**: All X-series operations logged (without revealing tenant IDs)
7. **Retention Limits**: Hourly telemetry retained 90 days; daily aggregates 365 days; beyond that, permanently deleted

## Configuration Management

### Environment Variables
```bash
GUARDIAN_TENANT_HASH_SECRET=<64-hex-char-secret>
  # Used for HMAC-SHA256 tenant hashing
  # Never logged, never exposed in responses
  # Rotate: 1. Generate new secret, 2. Run hash recompute job, 3. Update env

GUARDIAN_NETWORK_MIN_SAMPLE_SIZE=5
  # Default k-anonymity threshold (can override per API call)

GUARDIAN_NETWORK_RETENTION_HOURS=2160
  # Hourly telemetry retention (default: 90 days)
```

### Supabase RLS
X-series tables **intentionally have NO RLS**:
- Privacy enforced via aggregation (not row-level filtering)
- Hashes alone cannot identify tenants (irreversible)
- Admin operators can inspect aggregates for debugging
- Sensitive data never stored (only counts, percentiles, hashes)

## Monitoring & Compliance

### Metrics to Track
- Ingestion latency (target: < 100ms per tenant)
- Aggregation duration (target: < 5 minutes daily)
- API response time (target: < 500ms p95)
- Hash collision detection (target: 0 collisions)
- K-anonymity violations (target: 0)

### Audit & Compliance
- All X01 operations logged: ingestion counts, aggregation summaries, API queries
- Logs sanitized: never include tenant IDs, raw metrics, or secrets
- Monthly audit report: verify k-anonymity thresholds, retention compliance
- Annual privacy review: external audit of hash irreversibility, de-identification

## Related Documentation

- [Guardian Core Architecture](./GUARDIAN_ARCHITECTURE.md)
- [Guardian I-Series Overview](./PHASE_I_SERIES_OVERVIEW.md)
- [Guardian X01 Detailed Specification](./PHASE_X01_GUARDIAN_NETWORK_TELEMETRY_FOUNDATION.md)

---

**Guardian X-Series** — Privacy-Preserving Cross-Tenant Intelligence (v0.1, 2025-12-11)
