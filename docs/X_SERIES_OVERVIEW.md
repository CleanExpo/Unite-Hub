# Guardian X-Series: Network Intelligence Suite Overview

**Status**: Production Ready (X01–X05)
**Release Date**: December 2025
**Version**: 1.1

---

## Overview

The **X-Series** is a privacy-preserving network intelligence suite that extends Guardian with:
- **X01**: Anonymized hourly telemetry ingestion and cohort benchmarking
- **X02**: Anomaly detection and benchmark snapshots
- **X03**: Pattern-based early-warning signals
- **X04**: Governance controls and unified console
- **X05**: Data retention policies, lifecycle cleanup, and compliance audit trails

All X-series features are **opt-in**, **privacy-preserving**, and **non-breaking** to Guardian core.

---

## Architecture at a Glance

```
┌─────────────────────────────────────────────────────────┐
│ Unified Network Intelligence Console (X04)              │
│ - Feature flags, governance audit trail, KPIs           │
└──────────────────────┬──────────────────────────────────┘
                       │
        ┌──────────────┼──────────────┐
        │              │              │
   ┌────▼─────┐   ┌────▼─────┐   ┌────▼─────┐
   │ X01       │   │ X02       │   │ X03       │
   │ Telemetry │   │ Anomalies │   │ Early     │
   │ & Benches │   │           │   │ Warnings  │
   └───────────┘   └───────────┘   └───────────┘
        │              │              │
        └──────────────┼──────────────┘
                       │
        ┌──────────────▼──────────────┐
        │ Supabase RLS Tables         │
        │ (Tenant-scoped, audited)    │
        └─────────────────────────────┘
```

---

## Phase Breakdown

| Phase | Component | Purpose | Status | Key Tables |
|-------|-----------|---------|--------|------------|
| **X01** | Network Telemetry | Hourly metric ingestion; cohort benchmarks | ✅ Complete | `guardian_network_telemetry_hourly`, `guardian_network_benchmark_snapshots` |
| **X02** | Network Anomalies | Anomaly detection; benchmark analysis | ✅ Complete | `guardian_network_anomaly_signals`, `guardian_network_benchmark_snapshots` |
| **X03** | Early Warnings | Pattern-based signal derivation; tenant matching | ✅ Complete | `guardian_network_pattern_signatures`, `guardian_network_early_warnings` |
| **X04** | Governance & Console | Feature flags, audit trail, unified dashboard | ✅ Complete | `guardian_network_feature_flags`, `guardian_network_governance_events` |
| **X05** | Lifecycle & Compliance | Retention policies, cleanup, audit trails | ✅ Complete | `guardian_network_retention_policies`, `guardian_network_lifecycle_audit` |

---

## Data Flow

### Telemetry Path (X01)
```
Tenant Metrics (hourly)
        ↓
Ingest → Hash Fingerprint (anonymize tenant identity)
        ↓
Store in guardian_network_telemetry_hourly (anonymized)
        ↓
Aggregate into cohorts (by region/size/vertical)
        ↓
Store in guardian_network_benchmark_snapshots (per-tenant view)
```

### Anomaly Detection Path (X02)
```
guardian_network_telemetry_hourly + historical data
        ↓
Compare tenant metrics vs. cohort baseline
        ↓
Detect anomalies (elevated, suppressed, shift, volatility)
        ↓
Store in guardian_network_anomaly_signals (tenant-scoped)
        ↓
Expose via /api/guardian/network/anomalies (gated by flag)
```

### Pattern Derivation & Early Warnings Path (X03)
```
guardian_network_anomaly_signals (aggregated by cohort)
        ↓
Extract coarse-grained features (no tenant IDs)
        ↓
Mine patterns (alert bursts, risk clustering, etc.)
        ↓
Store in guardian_network_pattern_signatures (global, read-only)
        ↓
Match tenant anomalies to patterns
        ↓
Store in guardian_network_early_warnings (tenant-scoped)
        ↓
Expose via /api/guardian/network/early-warnings (gated by flag)
```

### Governance Path (X04)
```
Admin changes feature flag
        ↓
Log governance event (actor, timestamp, state change)
        ↓
Store in guardian_network_governance_events (tenant-scoped)
        ↓
Gating logic checks flag before X01–X03 operations
        ↓
Tenant sees updated feature flag status in console
```

---

## Privacy Guarantees

### No Cross-Tenant Data Leakage
- **X01**: Tenant hash obscures identity; metrics aggregated only into cohorts
- **X02**: Anomalies are per-tenant; benchmarks show cohort averages only
- **X03**: Pattern signatures contain no tenant identifiers; early warnings are per-tenant
- **X04**: Feature flags and governance events are isolated by RLS

### Anonymity & K-Anonymity
- Cohort keys (global, region:*, size:*, vertical:*) have no individual tenant association
- No way to reverse-map cohort metrics back to a specific tenant
- Minimum cohort size not enforced in v1 (recommended: ≥5 tenants per cohort)

### No PII Storage
- Telemetry: coarse-grained metric values only
- Anomalies: metric families, keys, severity (no payload data)
- Patterns: feature vectors with aggregates (no raw metrics or tenant hashes)
- Governance: event type, context, sanitized details (no email, password, API keys)

### Audit Trail
- All X-series flag changes logged with actor ID and timestamp
- Compliance teams can review tenant opt-in/out history
- Immutable append-only event log

---

## Feature Flags (X04)

Each X-series feature is **opt-in** via feature flags in `guardian_network_feature_flags`:

| Flag | Affects | Default | Recommendation |
|------|---------|---------|-----------------|
| `enable_network_telemetry` | X01 ingestion | `false` | Enable for all prod tenants |
| `enable_network_benchmarks` | X01/X02 benchmarks | `false` | Enable if telemetry enabled |
| `enable_network_anomalies` | X02 detection | `false` | Enable if benchmarks enabled |
| `enable_network_early_warnings` | X03 warnings | `false` | Enable for high-SLA customers |
| `enable_ai_hints` | AI suggestions in console | `false` | Optional enhancement |
| `enable_cohort_metadata_sharing` | Region/vertical cohorts | `false` | Enable for better cohorts |

### Integration Points
- **X01**: Skip telemetry ingestion if `enable_network_telemetry=false`
- **X02**: Return 4xx if `enable_network_benchmarks=false` or `enable_network_anomalies=false`
- **X03**: Skip early warning generation if `enable_network_early_warnings=false`
- **Cohorts**: Use 'global' only if `enable_cohort_metadata_sharing=false`

---

## API Surface

### X01 & X02 Endpoints
- `GET /api/guardian/network/benchmarks` — Tenant's benchmark snapshots
- `GET /api/guardian/network/anomalies` — Tenant's anomalies (X02)
- `POST /api/cron/detect-network-anomalies` — Anomaly detection job

### X03 Endpoints
- `GET /api/guardian/network/early-warnings` — Tenant's early warnings
- `PATCH /api/guardian/network/early-warnings` — Update warning status
- `GET /api/guardian/network/patterns` — Pattern catalog

### X04 Endpoints
- `GET /api/guardian/admin/network/settings` — Read feature flags
- `PATCH /api/guardian/admin/network/settings` — Update feature flags
- `GET /api/guardian/admin/network/governance` — Governance events
- `GET /api/guardian/admin/network/overview` — Unified dashboard

---

## Database Schema Summary

### Tenant-Scoped Tables (RLS Enabled)
- `guardian_network_telemetry_hourly` — Anonymized hourly metrics (X01)
- `guardian_network_anomaly_signals` — Per-tenant anomalies (X02)
- `guardian_network_benchmark_snapshots` — Per-tenant benchmarks (X01/X02)
- `guardian_network_early_warnings` — Per-tenant early warnings (X03)
- `guardian_network_feature_flags` — Tenant feature flags (X04)
- `guardian_network_governance_events` — Audit trail (X04)

### Global Tables (No RLS)
- `guardian_network_pattern_signatures` — Anonymized pattern signatures (X03)

---

## Testing & Validation

### Test Coverage
- **X01**: Telemetry ingestion, fingerprinting, aggregation (30+ tests)
- **X02**: Anomaly detection, benchmark snapshots (25+ tests)
- **X03**: Feature extraction, pattern mining, matching (17+ tests)
- **X04**: Feature flags, governance logging, console (25+ tests)

**Total**: 97+ comprehensive tests

### Validation Checklist
- [ ] RLS policies enforced for all tenant-scoped tables
- [ ] Telemetry ingestion verified for test tenants
- [ ] Benchmarks calculated correctly (vs. cohort baselines)
- [ ] Anomalies detected and categorized properly
- [ ] Pattern signatures generated and early warnings matched
- [ ] Feature flags gating X01–X03 correctly
- [ ] Governance events logged and auditable
- [ ] Console loads and reflects flag state
- [ ] No cross-tenant data leakage
- [ ] Performance acceptable (benchmarks < 1s, anomalies < 5s, warnings < 2s)

---

## Rollout Strategy

### Phase 1: Internal Testing (Dev/Staging)
1. Apply all X01–X04 migrations
2. Enable all feature flags for test tenants
3. Verify end-to-end telemetry → anomalies → warnings flow
4. Operator QA of console and governance

### Phase 2: Beta (Selected Prod Tenants)
1. Create opt-in cohort (e.g., 10–20 high-SLA customers)
2. Enable X01 telemetry for beta cohort
3. Monitor anomaly detection accuracy
4. Gather feedback on early warning usefulness

### Phase 3: General Availability
1. Enable feature flags for all production tenants
2. Document tenant onboarding process
3. Train operators on governance event review
4. Monitor performance and compliance

---

## Operational Monitoring

### Key Metrics
- Telemetry ingestion rate (rows/hour per tenant)
- Anomaly detection latency (P50, P95, P99)
- Early warning generation latency
- Feature flag adoption (% tenants with X01 enabled, etc.)
- Governance event volume (opt-in/out rate)

### Alerts
- Telemetry ingestion failures > 5% of expected
- Anomaly detection latency > 10s
- RLS policy violations (deny count spike)
- Governance event storage failures

---

## Future Enhancements

1. **Minimum Cohort Size**: Enforce k-anonymity (e.g., ≥5 tenants per cohort)
2. **Differential Privacy**: Add noise to cohort aggregates for stronger privacy
3. **Tenant Self-Service**: Allow tenants to toggle features in their settings
4. **Cost Attribution**: Track telemetry ingestion costs per tenant
5. **ML-Based Patterns**: Use clustering algorithms instead of hand-coded heuristics
6. **Custom Cohorts**: Let tenants define custom cohort keys (e.g., customer type)
7. **Alert Rules**: Allow tenants to define custom early warning triggers

---

## Documentation Index

- [X01: Network Telemetry](./PHASE_X01_GUARDIAN_NETWORK_TELEMETRY.md)
- [X02: Network Anomalies & Benchmarks](./PHASE_X02_GUARDIAN_NETWORK_ANOMALY_DETECTION.md)
- [X03: Network Early-Warning Signals](./PHASE_X03_GUARDIAN_NETWORK_EARLY_WARNING_SIGNALS_AND_HINTS.md)
- [X04: Network Intelligence Console & Governance](./PHASE_X04_GUARDIAN_NETWORK_INTELLIGENCE_CONSOLE_AND_GOVERNANCE.md)
- [X05: Network Lifecycle & Compliance](./PHASE_X05_GUARDIAN_NETWORK_LIFECYCLE_AND_COMPLIANCE.md)

---

## Support & Questions

For questions about the X-series:
1. Check the phase-specific documentation linked above
2. Review test files in `tests/guardian/x*.test.ts` for implementation details
3. Consult governance event logs for audit trail questions
4. Contact the Guardian team for privacy/compliance concerns
