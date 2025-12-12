# Guardian Z-Series Documentation Index

**Complete Reference for Z01-Z15 Guardian Meta Stack**

---

## Quick Navigation

### Entry Points

| For | Start Here |
|-----|-----------|
| **New engineers** | [README_GUARDIAN_META_STACK.md](README_GUARDIAN_META_STACK.md) (10-minute quickstart) |
| **Operators** | [Z_SERIES_OPERATOR_RUNBOOK.md](Z_SERIES_OPERATOR_RUNBOOK.md) (daily operations guide) |
| **Architects** | [Z_SERIES_COMPATIBILITY_MATRIX.md](Z_SERIES_COMPATIBILITY_MATRIX.md) (dependencies & schema) |
| **Release planning** | [Z_SERIES_RELEASE_CHECKLIST.md](Z_SERIES_RELEASE_CHECKLIST.md) (deployment steps) |
| **Status overview** | [Z_SERIES_OVERVIEW.md](Z_SERIES_OVERVIEW.md) (high-level summary) |

---

## Phase Documentation (Z01-Z15)

### Foundation & Observation Layer (Z01-Z09)

**Z01: Capability Manifest & Readiness Scoring**
- [PHASE_Z01_GUARDIAN_CAPABILITY_MANIFEST_AND_READINESS_SCORING.md](PHASE_Z01_GUARDIAN_CAPABILITY_MANIFEST_AND_READINESS_SCORING.md)
- Scope: Global capability definitions + tenant readiness assessment
- Tables: `guardian_capability_manifest`, `guardian_tenant_readiness_scores`
- Status: ✅ Complete

**Z02: Guided Uplift Planner & Adoption Playbooks**
- [PHASE_Z02_GUARDIAN_GUIDED_UPLIFT_PLANNER_AND_ADOPTION_PLAYBOOKS.md](PHASE_Z02_GUARDIAN_GUIDED_UPLIFT_PLANNER_AND_ADOPTION_PLAYBOOKS.md)
- Scope: Tenant-scoped uplift plans + adoption playbooks
- Tables: `guardian_tenant_uplift_plans`, `guardian_tenant_adoption_playbooks`
- Status: ✅ Complete

**Z03: Editions & Fit Scoring**
- [PHASE_Z03_GUARDIAN_EDITIONS_AND_FIT_SCORING.md](PHASE_Z03_GUARDIAN_EDITIONS_AND_FIT_SCORING.md)
- Scope: Guardian editions (Essentials, Pro, Enterprise) + fit scoring
- Tables: `guardian_editions`, `guardian_tenant_edition_fits`
- Status: ✅ Complete

**Z04: Executive Reporting & Timeline**
- [PHASE_Z04_GUARDIAN_EXECUTIVE_REPORTING_AND_TIMELINE.md](PHASE_Z04_GUARDIAN_EXECUTIVE_REPORTING_AND_TIMELINE.md)
- Scope: Executive-grade scoring + historical timelines
- Tables: `guardian_tenant_executive_scores`, `guardian_meta_snapshots`
- Status: ✅ Complete

**Z05: Adoption Signals & In-App Coach**
- [PHASE_Z05_GUARDIAN_ADOPTION_SIGNALS_AND_INAPP_COACH.md](PHASE_Z05_GUARDIAN_ADOPTION_SIGNALS_AND_INAPP_COACH.md)
- Scope: Real-time adoption metrics + contextual coaching
- Tables: `guardian_adoption_signals`, `guardian_inapp_coach_hints`
- Status: ✅ Complete

**Z06: Meta Lifecycle & Data Hygiene Console**
- [PHASE_Z06_GUARDIAN_META_LIFECYCLE_AND_DATA_HYGIENE_CONSOLE.md](PHASE_Z06_GUARDIAN_META_LIFECYCLE_AND_DATA_HYGIENE_CONSOLE.md)
- Scope: Data retention policies + hygiene reporting
- Tables: `guardian_meta_data_retention_policies`, `guardian_meta_hygiene_reports`
- Status: ✅ Complete

**Z07: Meta Integration & Success Toolkit**
- [PHASE_Z07_GUARDIAN_META_INTEGRATION_AND_SUCCESS_TOOLKIT.md](PHASE_Z07_GUARDIAN_META_INTEGRATION_AND_SUCCESS_TOOLKIT.md)
- Scope: CRM integrations + success tracking
- Tables: `guardian_meta_integrations`, `guardian_meta_success_stories`
- Status: ✅ Complete

**Z08: Program Goals, OKRs & KPI Alignment**
- [PHASE_Z08_GUARDIAN_PROGRAM_GOALS_OKRS_AND_KPI_ALIGNMENT.md](PHASE_Z08_GUARDIAN_PROGRAM_GOALS_OKRS_AND_KPI_ALIGNMENT.md)
- Scope: Goals + OKRs + KPI definitions and tracking
- Tables: `guardian_meta_goals`, `guardian_meta_okrs`, `guardian_meta_kpis`
- Status: ✅ Complete

**Z09: Playbook Library & Knowledge Hub**
- [PHASE_Z09_GUARDIAN_PLAYBOOK_LIBRARY_AND_KNOWLEDGE_HUB.md](PHASE_Z09_GUARDIAN_PLAYBOOK_LIBRARY_AND_KNOWLEDGE_HUB.md)
- Scope: Reusable playbooks + knowledge base
- Tables: `guardian_meta_playbooks`, `guardian_meta_knowledge_articles`
- Status: ✅ Complete

### Governance & Control Layer (Z10-Z11)

**Z10: Meta Governance, Safeguards & Release Gate**
- [PHASE_Z10_GUARDIAN_META_GOVERNANCE_SAFEGUARDS_AND_RELEASE_GATE.md](PHASE_Z10_GUARDIAN_META_GOVERNANCE_SAFEGUARDS_AND_RELEASE_GATE.md)
- Scope: Feature flags + governance policies + release gating
- Tables: `guardian_meta_feature_flags`, `guardian_meta_governance_prefs`, `guardian_meta_audit_log`
- Key Policies: `aiUsagePolicy`, `externalSharingPolicy`, `dataRetentionDays`
- Status: ✅ Complete

**Z11: Meta Packaging, Export Bundles & Transfer Kit**
- [PHASE_Z11_GUARDIAN_META_PACKAGING_EXPORT_BUNDLES_AND_TRANSFER_KIT.md](PHASE_Z11_GUARDIAN_META_PACKAGING_EXPORT_BUNDLES_AND_TRANSFER_KIT.md)
- Scope: Portable Z01-Z10 export bundles + transfer kits (CS, Exec, Implementation)
- Tables: `guardian_meta_export_bundles`, `guardian_meta_export_bundle_items`
- Features: Canonical JSON + SHA-256 checksums, PII scrubbing, preset bundles
- Status: ✅ Complete

### Operations & Automation Layer (Z12-Z14)

**Z12: Meta Continuous Improvement Loop**
- [PHASE_Z12_GUARDIAN_META_CONTINUOUS_IMPROVEMENT_LOOP.md](PHASE_Z12_GUARDIAN_META_CONTINUOUS_IMPROVEMENT_LOOP.md)
- Scope: Improvement cycles + action tracking + outcome measurement
- Tables: `guardian_meta_improvement_cycles`, `guardian_meta_improvement_actions`, `guardian_meta_improvement_outcomes`
- Features: Pattern-driven + AI-assisted recommendations (optional)
- Status: ✅ Complete

**Z13: Meta Automation Triggers & Scheduled Evaluations**
- [PHASE_Z13_GUARDIAN_META_AUTOMATION_TRIGGERS_AND_SCHEDULED_EVALUATIONS.md](PHASE_Z13_GUARDIAN_META_AUTOMATION_TRIGGERS_AND_SCHEDULED_EVALUATIONS.md)
- Scope: Schedules + triggers + automation task runner
- Tables: `guardian_meta_automation_schedules`, `guardian_meta_automation_triggers`, `guardian_meta_automation_executions`
- Features: Deterministic scheduling, metric-based triggers, 5 task types (kpi_eval, readiness, improvement_outcome, export_bundle, meta_backup)
- Status: ✅ Complete

**Z14: Meta Status Page & Stakeholder Views**
- [PHASE_Z14_GUARDIAN_META_STATUS_PAGE_AND_STAKEHOLDER_VIEWS.md](PHASE_Z14_GUARDIAN_META_STATUS_PAGE_AND_STAKEHOLDER_VIEWS.md)
- Scope: Role-safe status snapshots + stakeholder-specific views
- Tables: `guardian_meta_status_snapshots`
- Features: 3 view types (operator, leadership, CS), 4 period labels, optional AI narrative
- Status: ✅ Complete

### Safety & Recovery Layer (Z15-Z16)

**Z15: Meta Backups, Rollback & Safe Restore**
- [PHASE_Z15_GUARDIAN_META_BACKUPS_ROLLBACK_AND_SAFE_RESTORE.md](PHASE_Z15_GUARDIAN_META_BACKUPS_ROLLBACK_AND_SAFE_RESTORE.md)
- Scope: Deterministic backups + preview-first restores + allowlist enforcement
- Tables: `guardian_meta_backup_sets`, `guardian_meta_backup_items`, `guardian_meta_restore_runs`
- Features: 14 backup scopes, SHA-256 checksums, PII scrubbing, explicit confirmation required
- Status: ✅ Complete

**Z16: Z-Series Finalization, Compatibility Matrix & Release Bundle**
- Scope: Unified docs + validation gate + release checklist
- Key Documents: Z_SERIES_COMPATIBILITY_MATRIX.md, Z_SERIES_OVERVIEW.md, Z_SERIES_OPERATOR_RUNBOOK.md, Z_SERIES_RELEASE_CHECKLIST.md, README_GUARDIAN_META_STACK.md
- Status: 🟡 In Progress (T01 complete, T02-T06 pending)

---

## Architecture & Reference

### Core Reference Documents

| Document | Purpose |
|----------|---------|
| [Z_SERIES_OVERVIEW.md](Z_SERIES_OVERVIEW.md) | High-level summary of all Z phases + consoles & data safety |
| [Z_SERIES_COMPATIBILITY_MATRIX.md](Z_SERIES_COMPATIBILITY_MATRIX.md) | Dependencies, tables, APIs, UI routes, Z13 hooks, Z11/Z15 scopes |
| [Z_SERIES_ARCHITECTURE_MAP.md](Z_SERIES_ARCHITECTURE_MAP.md) | Layered architecture diagram + data flow + security boundaries |
| [README_GUARDIAN_META_STACK.md](README_GUARDIAN_META_STACK.md) | 10-minute quickstart for new engineers |

### Operational Guides

| Document | Purpose |
|----------|---------|
| [Z_SERIES_OPERATOR_RUNBOOK.md](Z_SERIES_OPERATOR_RUNBOOK.md) | Daily operations, troubleshooting, health checks |
| [Z_SERIES_RELEASE_CHECKLIST.md](Z_SERIES_RELEASE_CHECKLIST.md) | Pre-production verification, deployment steps, rollback procedures |

---

## Consoles & UI Routes

### Admin Consoles (All Require Admin Role)

| Console | Route | Purpose | Z Phase |
|---------|-------|---------|---------|
| **Readiness** | `/guardian/admin/readiness` | Capability assessment + historical trends | Z01 |
| **Uplift** | `/guardian/admin/uplift` | Uplift plan CRUD + adoption playbooks | Z02 |
| **Editions** | `/guardian/admin/editions` | Edition fit scoring + pricing | Z03 |
| **Executive** | `/guardian/admin/executive` | Executive scoring dashboard | Z04 |
| **Adoption** | `/guardian/admin/adoption` | Real-time adoption signals + coaching | Z05 |
| **Lifecycle** | `/guardian/admin/lifecycle` | Data retention policies + hygiene | Z06 |
| **Integrations** | `/guardian/admin/integrations` | CRM + third-party integrations | Z07 |
| **Goals** | `/guardian/admin/goals` | Goals/OKRs/KPIs management | Z08 |
| **Playbooks** | `/guardian/admin/playbooks` | Playbook library + knowledge hub | Z09 |
| **Governance** | `/guardian/admin/governance` | Feature flags + governance policies + Z-series validation | Z10 |
| **Exports** | `/guardian/admin/exports` | Export bundles + transfer kits | Z11 |
| **Improvement** | `/guardian/admin/improvement` | Improvement cycles + actions + outcomes | Z12 |
| **Automation** | `/guardian/admin/automation` | Schedules + triggers + executions | Z13 |
| **Status** | `/guardian/admin/status` | Status page + snapshots | Z14 |
| **Backups** | `/guardian/admin/backups` | Backup CRUD + restore preview/apply | Z15 |

---

## Data Flow Architecture

```
Guardian Z-Series Layered Architecture
=====================================

┌─────────────────────────────────────────────────────────────────────┐
│  Observation & Planning Layer (Z01-Z09)                             │
│  ─ Z01 Readiness + Z02 Uplift + Z03 Editions + Z04 Executive        │
│  ─ Z05 Adoption + Z06 Lifecycle + Z07 Integrations                  │
│  ─ Z08 Goals/OKRs/KPIs + Z09 Playbooks                              │
│  ─ Input: Core Guardian runtime (G/H/I/X tables read-only)          │
│  ─ Output: Scores, plans, playbooks, signals                        │
└────────────────┬────────────────────────────────────────────────────┘
                 │ (Z01-Z09 data)
                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│  Governance & Control Layer (Z10)                                   │
│  ─ Feature flags, AI policy, data sharing policy, audit logging      │
│  ─ Controls: ALL Z-series behavior (AI enabled, export restrictions) │
│  ─ Gates: Release readiness validation                              │
└────────────────┬────────────────────────────────────────────────────┘
                 │ (Policies)
    ┌────────────┼────────────┐
    │            │            │
    ▼            ▼            ▼
┌─────────────┐ ┌──────────────┐ ┌───────────────────┐
│  Z11        │ │   Z12-Z14    │ │   Z15             │
│ Exports &   │ │  Operations  │ │  Backups &        │
│ Transfer    │ │  (Automation)│ │  Recovery         │
│  Kit        │ │              │ │  (Safety Layer)   │
└─────────────┘ └──────────────┘ └───────────────────┘
    │                  │                 │
    └──────────────────┼─────────────────┘
                       │
                       ▼
                  [Core Guardian]
              (G/H/I/X tables)
```

---

## Non-Breaking Guarantees

✅ **Z-Series NEVER**:
- Modifies core Guardian G/H/I/X tables (alerts, incidents, rules, network)
- Changes alerting behavior or incident lifecycle
- Exports raw alert/incident payloads or PII
- Weakens existing RLS policies
- Introduces new auth models

✅ **Verified For Each Phase**:
- Read-only access to core Guardian tables
- All writes to `guardian_meta_*` tables only
- Full RLS enforcement (tenant_id isolation)
- PII scrubbing on exports/backups
- Comprehensive audit logging (Z10)

---

## Quick Setup & Validation

### Pre-Production Checklist
1. ✅ All migrations applied (601-610)
2. ✅ All RLS policies enabled
3. ✅ Z10 governance defaults configured
4. ✅ Z13 automation defaults created
5. ✅ Tests passing (235+)
6. ✅ TypeScript compiling (0 errors)
7. ✅ Z-series validation gate passing
8. ✅ Audit logging functional

See [Z_SERIES_RELEASE_CHECKLIST.md](Z_SERIES_RELEASE_CHECKLIST.md) for full deployment steps.

---

## Support & Troubleshooting

### Common Issues

**Z13 Automation Not Running**
- Check: `guardian_meta_automation_schedules` next_run_at calculation
- Fix: Ensure scheduler runner (metaTaskRunner.ts) is configured
- See: [Z_SERIES_OPERATOR_RUNBOOK.md](Z_SERIES_OPERATOR_RUNBOOK.md)

**Backups Growing Large**
- Check: Backup scope size + PII scrubbing effectiveness
- Fix: Exclude large scopes (status snapshots, raw exports)
- See: [PHASE_Z15_GUARDIAN_META_BACKUPS_ROLLBACK_AND_SAFE_RESTORE.md](PHASE_Z15_GUARDIAN_META_BACKUPS_ROLLBACK_AND_SAFE_RESTORE.md)

**Export Bundle Validation Warnings**
- Check: Content for email patterns, IP addresses, URLs
- Fix: Review exportScrubber + validateExportContent rules
- See: [PHASE_Z11_GUARDIAN_META_PACKAGING_EXPORT_BUNDLES_AND_TRANSFER_KIT.md](PHASE_Z11_GUARDIAN_META_PACKAGING_EXPORT_BUNDLES_AND_TRANSFER_KIT.md)

### Health Checks

```bash
npm run integrity:check          # Founder OS health check (includes Z-series)
npm run test -- z01_             # Test specific phase
npm run typecheck                # TypeScript validation
```

---

## Version & Status

**Z-Series Version**: 1.0.0 (Z01-Z15 complete)
**Last Updated**: 2025-12-12
**Status**: ✅ Z01-Z15 Production-Ready (Z16 in progress)
**Node**: 20.x (required)
**Database**: PostgreSQL 14+ (Supabase)

---

## Contributing & Maintenance

- **Add new Z phases**: Update this index + compatibility matrix + operator runbook
- **Update docs**: Keep phase docs in sync with code (review on each PR)
- **Add tests**: Minimum 40 tests per Z phase + integration tests
- **Governance changes**: Update Z10 + audit logging + all dependent phases

---

**For questions or issues**: Check [Z_SERIES_OPERATOR_RUNBOOK.md](Z_SERIES_OPERATOR_RUNBOOK.md) or review relevant phase documentation.
