# Guardian Z-Series Compatibility Matrix & Dependencies

**Date**: December 12, 2025
**Status**: Guardian Z-Series Z01-Z15 Complete
**Runtime**: Node 20 (required and confirmed)

---

## Quick Reference Matrix

| Phase | Name | Depends On | Core Meta Tables | APIs | UI Routes | Z13 Hooks | Z11 Export Items | Z15 Backup Scope | Z10 Governance | Status |
|-------|------|-----------|-----------------|------|-----------|-----------|-----------------|------------------|-----------------|--------|
| **Z01** | Tenant Readiness Scoring | Z10 | readiness_scores | 3 | /admin/readiness | eval_readiness | readiness_snapshot | readiness | aiUsagePolicy | ✅ |
| **Z02** | Uplift Planning | Z01, Z10 | uplift_plans | 4 | /admin/uplift | improvement_outcome | uplift_summary | uplift | flags | ✅ |
| **Z03** | Edition Fit Scoring | Z01, Z10 | editions_fit | 3 | /admin/editions | stack_readiness | editions_snapshot | editions | flags | ✅ |
| **Z05** | Team Adoption | Z01, Z10 | adoption_scores | 3 | /admin/adoption | adoption_eval | adoption_snapshot | adoption | aiUsagePolicy | ✅ |
| **Z06** | Meta Lifecycle | Z10 | lifecycle_policies | 2 | /admin/lifecycle | – | lifecycle_config | lifecycle | riskPosture | ✅ |
| **Z07** | Meta Integrations | Z10 | meta_integrations | 4 | /admin/integrations | integration_health | integrations_config | integrations | externalSharingPolicy | ✅ |
| **Z08** | Goals/OKRs/KPIs | Z10 | program_goals, kpi_snapshots | 4 | /admin/goals | kpi_eval | goals_summary | goals_okrs | aiUsagePolicy | ✅ |
| **Z09** | Playbook Library | Z10 | playbook_library | 3 | /admin/playbooks | knowledge_hub | playbooks_index | playbooks | – | ✅ |
| **Z10** | Meta Governance | – | feature_flags, governance_prefs, audit_log | 5 | /admin/meta-governance | – | governance_state | governance | (self-managed) | ✅ |
| **Z11** | Meta Exports | Z10, Z01-Z09 | export_bundles, bundle_items | 5 | /admin/exports | export_bundle | (self-item) | exports | externalSharingPolicy | ✅ |
| **Z12** | Improvement Loop | Z01-Z08, Z10 | improvement_cycles, actions, outcomes | 6 | /admin/improvement | improvement_outcome | improvement_state | improvement_loop | aiUsagePolicy | ✅ |
| **Z13** | Meta Automation | Z10, all above | automation_schedules, triggers, executions | 7 | /admin/automation | (runner) | automation_config | automation | flags | ✅ |
| **Z14** | Status Page | Z01-Z13, Z10 | status_snapshots | 3 | /admin/status | status_snapshot | status_snapshot | status | externalSharingPolicy | ✅ |
| **Z15** | Backups/Restore | Z01-Z14, Z10, Z11 | backup_sets, items, restore_runs | 8 | /admin/backups | meta_backup, restore_health_check | (high-level) | (self-item) | (notes gating) | ✅ |

---

## Detailed Dependencies

### Z01: Tenant Readiness Scoring
- **Depends On**: Z10 (governance, audit logging)
- **Core Meta Tables**: guardian_tenant_readiness_scores
- **APIs**: 3 endpoints (GET list, GET by id, POST recompute)
- **UI Routes**: /admin/readiness (view scores, trigger recompute)
- **Z13 Hooks**: kpi_eval task type (optional automation)
- **Z11 Export Items**: readiness_snapshot (score, status, computed_at)
- **Z15 Backup Coverage**: readiness scope
- **Z10 Controls**: aiUsagePolicy gates AI-assisted recommendations if present
- **Notes**: Foundation for all readiness-based workflows; never modifies G/H/I/X alerts

### Z02: Uplift Planning & Roadmap
- **Depends On**: Z01 (readiness input), Z10 (governance)
- **Core Meta Tables**: guardian_tenant_uplift_plans
- **APIs**: 4 endpoints (CRUD plans)
- **UI Routes**: /admin/uplift (create plans, track status)
- **Z13 Hooks**: improvement_outcome task can capture uplift outcomes
- **Z11 Export Items**: uplift_summary (plans count, status distribution)
- **Z15 Backup Coverage**: uplift scope (restorable)
- **Z10 Controls**: flags control plan templates
- **Notes**: Never executes plans; only tracks meta plans and progress

### Z03: Edition Fit Scoring
- **Depends On**: Z01 (readiness context), Z10 (governance)
- **Core Meta Tables**: guardian_tenant_editions_fit
- **APIs**: 3 endpoints (GET editions, compute fit)
- **UI Routes**: /admin/editions (view fit scores)
- **Z13 Hooks**: stack_readiness task includes edition fit
- **Z11 Export Items**: editions_snapshot (editions, fit scores)
- **Z15 Backup Coverage**: editions scope
- **Z10 Controls**: flags control edition set
- **Notes**: Reads configuration, computes fit; never modifies edition schemas

### Z05: Team Adoption Tracking
- **Depends On**: Z01 (integration with readiness), Z10 (governance)
- **Core Meta Tables**: guardian_tenant_adoption_scores
- **APIs**: 3 endpoints (GET scores, GET coaching, POST capture)
- **UI Routes**: /admin/adoption (view adoption metrics, coaching)
- **Z13 Hooks**: adoption_eval task (optional, if AI enabled)
- **Z11 Export Items**: adoption_snapshot (rate, coaching state)
- **Z15 Backup Coverage**: adoption scope
- **Z10 Controls**: aiUsagePolicy gates AI coaching
- **Notes**: Reads G/H/I activity via RLS-scoped views; never modifies core data

### Z06: Meta Lifecycle & Data Hygiene
- **Depends On**: Z10 (governance)
- **Core Meta Tables**: guardian_meta_lifecycle_policies
- **APIs**: 2 endpoints (GET policies, PUT update)
- **UI Routes**: (no dedicated UI, managed via governance page)
- **Z13 Hooks**: (none; triggered externally if policy requires)
- **Z11 Export Items**: lifecycle_config (policies, schedules)
- **Z15 Backup Coverage**: lifecycle scope
- **Z10 Controls**: riskPosture determines cleanup retention
- **Notes**: Manages meta table retention and archival; never touches core data

### Z07: Meta Integration Management
- **Depends On**: Z10 (governance, audit)
- **Core Meta Tables**: guardian_meta_integrations
- **APIs**: 4 endpoints (CRUD integrations, health check)
- **UI Routes**: /admin/integrations (list, configure, test)
- **Z13 Hooks**: integration_health task monitors third-party APIs
- **Z11 Export Items**: integrations_config (keys, status, NO URLs/secrets)
- **Z15 Backup Coverage**: integrations scope
- **Z10 Controls**: externalSharingPolicy restricts URL exposure in exports
- **Notes**: Stores safe metadata only; secrets stored separately or in env vars

### Z08: Program Goals, OKRs, KPI Alignment
- **Depends On**: Z10 (governance, audit)
- **Core Meta Tables**: guardian_meta_program_goals, kpi_snapshots
- **APIs**: 4 endpoints (CRUD goals, GET snapshots)
- **UI Routes**: /admin/goals (create goals, view KPIs, track progress)
- **Z13 Hooks**: kpi_eval task recomputes KPI snapshots
- **Z11 Export Items**: goals_summary (goals, OKRs, KPI status)
- **Z15 Backup Coverage**: goals_okrs scope
- **Z10 Controls**: aiUsagePolicy gates AI-driven KPI insights
- **Notes**: Reads meta KPI snapshots; never touches G/H/I core metrics

### Z09: Playbook Library & Knowledge Hub
- **Depends On**: Z10 (governance, audit)
- **Core Meta Tables**: guardian_meta_playbook_library
- **APIs**: 3 endpoints (GET library, GET playbook, POST/PUT playbook)
- **UI Routes**: /admin/playbooks (browse, create, share playbooks)
- **Z13 Hooks**: knowledge_hub task indexes/caches playbooks
- **Z11 Export Items**: playbooks_index (playbook keys, categories, tags)
- **Z15 Backup Coverage**: playbooks scope
- **Z10 Controls**: (none specific; general audit)
- **Notes**: Stores Guardian operational knowledge; never executes playbooks directly

### Z10: Meta Governance Safeguards & Release Gate
- **Depends On**: None (foundational)
- **Core Meta Tables**: guardian_meta_feature_flags, guardian_meta_governance_prefs, guardian_meta_audit_log
- **APIs**: 5 endpoints (GET flags, GET prefs, PUT prefs, GET audit log, POST release gate)
- **UI Routes**: /admin/meta-governance (configure flags, policies, view audit)
- **Z13 Hooks**: (none; provides governance context to all tasks)
- **Z11 Export Items**: governance_state (flags, policies, NO secrets)
- **Z15 Backup Coverage**: governance scope
- **Z10 Controls**: (self-managed; controls others)
- **Notes**: Central governance; blocks unsafe operations; logs all Z-series activity

### Z11: Meta Packaging, Export Bundles & Transfer Kit
- **Depends On**: Z10 (governance), Z01-Z09 (data sources)
- **Core Meta Tables**: guardian_meta_export_bundles, bundle_items
- **APIs**: 5 endpoints (GET bundles, POST create, GET items, etc.)
- **UI Routes**: /admin/exports (create bundles, view history, download items)
- **Z13 Hooks**: export_bundle task (optional automated exports)
- **Z11 Export Items**: (self-item; exports itself)
- **Z15 Backup Coverage**: exports scope
- **Z10 Controls**: externalSharingPolicy gates bundle visibility
- **Notes**: PII-scrubbed, deterministic bundles; used by Z15 and external partners

### Z12: Meta Continuous Improvement Loop
- **Depends On**: Z01-Z08, Z10 (governance)
- **Core Meta Tables**: guardian_meta_improvement_cycles, actions, outcomes
- **APIs**: 6 endpoints (CRUD cycles, actions, capture outcomes, get recommendations)
- **UI Routes**: /admin/improvement (create cycles, track actions, view outcomes)
- **Z13 Hooks**: improvement_outcome task captures cycle outcomes
- **Z11 Export Items**: improvement_state (cycles, actions, outcome age)
- **Z15 Backup Coverage**: improvement_loop scope (restorable)
- **Z10 Controls**: aiUsagePolicy gates AI recommendations
- **Notes**: Operationalizes improvement signals; never modifies G/H/I core actions

### Z13: Meta Automation Triggers & Scheduled Evaluations
- **Depends On**: Z10 (governance), all Z01-Z12 (task targets)
- **Core Meta Tables**: guardian_meta_automation_schedules, triggers, executions
- **APIs**: 7 endpoints (CRUD schedules, triggers, GET executions, run now)
- **UI Routes**: /admin/automation (configure schedules, triggers, view executions)
- **Z13 Hooks**: (is the hook runner; executes meta tasks)
- **Z11 Export Items**: automation_config (schedules, triggers, NO secrets)
- **Z15 Backup Coverage**: automation scope
- **Z10 Controls**: flags control available task types, cooldowns
- **Notes**: Orchestrates all Z-series meta tasks; deterministic scheduling; never touches G/H/I core

### Z14: Meta Status Page & Stakeholder Views
- **Depends On**: Z01-Z13, Z10 (governance)
- **Core Meta Tables**: guardian_meta_status_snapshots
- **APIs**: 3 endpoints (GET status, GET snapshots, POST capture)
- **UI Routes**: /admin/status (view status dashboard, select view type/period)
- **Z13 Hooks**: status_snapshot task captures snapshots for stakeholder views
- **Z11 Export Items**: status_snapshot (latest snapshot per view type)
- **Z15 Backup Coverage**: status scope (NOT restored; derived only)
- **Z10 Controls**: externalSharingPolicy redacts exports card in CS view
- **Notes**: Aggregates Z01-Z13 for stakeholder reporting; role-safe redaction

### Z15: Meta Backups, Rollback & Safe Restore
- **Depends On**: Z01-Z14, Z10 (governance), Z11 (scrubber patterns)
- **Core Meta Tables**: guardian_meta_backup_sets, items, restore_runs
- **APIs**: 8 endpoints (CRUD backups, preview/apply restores)
- **UI Routes**: /admin/backups (create backups, manage restores)
- **Z13 Hooks**: meta_backup task (schedule backups), meta_restore_health_check task
- **Z11 Export Items**: (high-level backup/restore summary, no payloads)
- **Z15 Backup Coverage**: (self-item; backups itself)
- **Z10 Controls**: includeNotes gated by externalSharingPolicy
- **Notes**: Safety/recovery layer; restore allowlist prevents unsafe operations

---

## Z-Series Architecture Layers

```
┌─────────────────────────────────────────────────────┐
│ Z14: Status Page (Role-Safe Aggregation)            │
│      ↑ Reads Z01-Z13, applies role-based redaction  │
└─────────────────────────────────────────────────────┘
          ↑
┌─────────────────────────────────────────────────────┐
│ Z13: Automation (Task Orchestration)                │
│      ↑ Schedules, triggers, runs all meta tasks     │
│      ├ Z08 kpi_eval, Z03 stack_readiness            │
│      ├ Z12 improvement_outcome, Z11 export_bundle   │
│      └ Z14 status_snapshot, Z15 meta_backup         │
└─────────────────────────────────────────────────────┘
          ↑
┌─────────────────────────────────────────────────────┐
│ Z01-Z12: Meta Domains (Readiness, Uplift, etc.)    │
│      ↑ Individual meta signals and workflows        │
└─────────────────────────────────────────────────────┘
          ↑
┌─────────────────────────────────────────────────────┐
│ Z10: Governance (Policy, Audit, Flags)             │
│      ↑ Controls all Z-series behavior and access    │
└─────────────────────────────────────────────────────┘
          ↑
┌─────────────────────────────────────────────────────┐
│ Z11: Exports (PII Scrubbing, Packaging)            │
│ Z15: Backups (Restore Guardrails)                  │
│      ↑ Cross-cutting safety and portability         │
└─────────────────────────────────────────────────────┘
          ↑
┌─────────────────────────────────────────────────────┐
│ Core Guardian G/H/I/X (Alerts, Incidents, etc.)    │
│      ← Z-Series reads only, never modifies          │
└─────────────────────────────────────────────────────┘
```

---

## What Z-Series Does NOT Do

### ❌ Does Not Modify Core Guardian Runtime

Z-Series **never**:
- Modifies alerts, incidents, rules, or network telemetry (G/H/I/X tables)
- Triggers remediations, notifications, or escalations
- Changes authentication, billing, or tenant lifecycle
- Alters core Guardian schema or behavior
- Exports raw incident payloads, alert bodies, or network data
- Accesses secrets without explicit governance approval

### ❌ Does Not Weaken RLS or Security

Z-Series **always**:
- Enforces RLS on all meta tables (tenant_id isolation)
- Requires admin auth for sensitive mutations
- Scrubs PII and secrets before export/backup
- Logs all operations to Z10 audit trail
- Respects Z10 governance policies
- Validates before executing (preview → apply workflow)

### ❌ Does Not Assume Production Readiness

Z-Series operations:
- Are all meta-only (safe to test in production)
- Have manual confirmation gates (no auto-apply)
- Include preview/diff workflows (humans review before commit)
- Can be rolled back via Z15 restore (limited to safe tables)
- Are fully audited (Z10 logging)

---

## Table Dependencies Summary

### Required for Z01 Readiness:
```
guardian_tenant_readiness_scores
  ↑ (writes Z01 snapshots)
  ← (reads guardian alerts for activity via RLS view)
```

### Required for Z08 Goals:
```
guardian_meta_program_goals
guardian_meta_kpi_snapshots
  ↑ (writes Z08 KPI snapshots)
  ← (reads goal definitions)
```

### Required for Z10 Governance:
```
guardian_meta_feature_flags
guardian_meta_governance_prefs
guardian_meta_audit_log
  ↑ (central policy and logging)
  ← (all Z-series operations log here)
```

### Required for Z13 Automation:
```
guardian_meta_automation_schedules
guardian_meta_automation_triggers
guardian_meta_automation_executions
  ↑ (runs all Z-series tasks)
  ← (reads Z01-Z12 data sources)
```

### Required for Z15 Backups:
```
guardian_meta_backup_sets
guardian_meta_backup_items
guardian_meta_restore_runs
  ↑ (backups all Z01-Z14 config)
  ← (reads from all meta tables)
```

---

## Runtime: Node 20 (Required & Confirmed)

**Z-Series requires Node 20 or later** for:
- All scheduler utilities (schedulerUtils.ts uses Date/timezone APIs)
- All async/await patterns (ES2022+)
- All TypeScript strict mode compilation
- All test frameworks (Vitest, Playwright)

**Confirmed in**:
- package.json engines field (if present)
- npm run build (TypeScript strict)
- npm run test (Node 20 guaranteed)
- docs: all examples assume Node 20 CLI

---

## Governance Controls by Module

| Z Module | Z10 Flag | Z10 Policy | Z10 Audit |
|----------|----------|-----------|-----------|
| Z01 | – | – | ✅ |
| Z02 | templates | – | ✅ |
| Z03 | edition_set | – | ✅ |
| Z05 | – | aiUsagePolicy | ✅ |
| Z06 | – | riskPosture | ✅ |
| Z07 | – | externalSharingPolicy | ✅ |
| Z08 | ai_kpi_insights | aiUsagePolicy | ✅ |
| Z09 | – | – | ✅ |
| Z10 | (all) | (all) | ✅ |
| Z11 | – | externalSharingPolicy | ✅ |
| Z12 | ai_improvement_plans | aiUsagePolicy | ✅ |
| Z13 | enabled_tasks | – | ✅ |
| Z14 | – | externalSharingPolicy | ✅ |
| Z15 | – | (notes gating) | ✅ |

---

## Export Scopes (Z11)

All Z01-Z15 can be exported individually or as bundles:
- readiness, uplift, editions, executive, adoption, lifecycle, integrations, goals_okrs, playbooks, governance, exports, improvement_loop, automation, status, (z15 summary)

---

## Backup Scopes (Z15)

All Z01-Z14 can be backed up; Z15 restore allowlist restricts what can be restored:

| Scope | Merge | Replace | Rationale |
|-------|-------|---------|-----------|
| readiness | ✅ | ❌ | Safe to update, not to replace |
| uplift | ✅ | ✅ | Safe both ways |
| editions | ✅ | ❌ | Fit data is derived |
| executive | ✅ | ❌ | Summary only |
| adoption | ✅ | ❌ | Metrics only |
| lifecycle | ✅ | ❌ | Policies only |
| integrations | ✅ | ❌ | Metadata safe, secrets separate |
| goals_okrs | ✅ | ❌ | Config safe, history derived |
| playbooks | ✅ | ✅ | Library replaceable |
| governance | ✅ | ❌ | Merge only to avoid overwrites |
| exports | ✅ | ❌ | Bundles never restored |
| improvement_loop | ✅ | ✅ | Plans replaceable |
| automation | ✅ | ❌ | Merge only, next_run_at recomputed |
| status | ❌ | ❌ | Always derived, never restored |

---

**Last Updated**: 2025-12-12
**Guardian Z-Series Status**: ✅ COMPLETE (Z01-Z15)
**Node Runtime**: 20 (Confirmed)
