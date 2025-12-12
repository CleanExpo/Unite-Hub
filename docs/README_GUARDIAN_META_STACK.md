# Guardian Meta Stack — 10-Minute Quickstart

**Welcome!** This guide gets you up to speed on the Guardian Z-Series (Z01-Z15) in 10 minutes.

---

## What is Guardian Z-Series?

Guardian is Unite-Hub's **AI platform observability & optimization layer**. It consists of 15 interconnected phases (Z01-Z15) that:

1. **Observe** Guardian capabilities and tenant readiness (Z01-Z09)
2. **Govern** through policies and access controls (Z10)
3. **Export** data portably and safely (Z11)
4. **Automate** operational tasks (Z12-Z14)
5. **Recover** from configuration errors (Z15)

**Why it matters**: Customers get AI-driven guidance, admins get full control, and the platform stays auditable.

---

## 5-Second Architecture

```
Observation Layer (Z01-Z09)        ← What's the readiness? What plays work?
         ↓
Governance Layer (Z10)              ← What can we do? What's audited?
         ↓
Operations (Z11-Z14)                ← Export data. Automate. Show status.
         ↓
Safety Layer (Z15)                  ← Backup configs. Restore on error.
         ↓
Core Guardian (G/H/I/X tables)      ← Never touched by Z-series
```

**Golden Rule**: Z-Series is **read-only** on core Guardian. It only reads alerts/incidents/rules, never modifies them.

---

## Key Tables You'll See

### Core Z-Series Tables (One Per Phase)

| Phase | Main Table | What It Tracks |
|-------|-----------|-----------------|
| Z01 | `guardian_tenant_readiness_scores` | Readiness score (0-100) |
| Z02 | `guardian_tenant_uplift_plans` | Improvement plans |
| Z03 | `guardian_tenant_edition_fits` | Edition scores |
| Z04 | `guardian_tenant_executive_scores` | Executive-grade score |
| Z05 | `guardian_adoption_signals` | Real-time adoption metrics |
| Z06 | `guardian_meta_data_retention_policies` | Data retention rules |
| Z07 | `guardian_meta_integrations` | CRM/third-party integrations |
| Z08 | `guardian_meta_goals` | Goals + OKRs + KPIs |
| Z09 | `guardian_meta_playbooks` | Reusable playbooks |
| Z10 | `guardian_meta_governance_prefs` | Policies + feature flags |
| Z11 | `guardian_meta_export_bundles` | Portable export packages |
| Z12 | `guardian_meta_improvement_cycles` | Improvement tracking |
| Z13 | `guardian_meta_automation_schedules` | Scheduled automation |
| Z14 | `guardian_meta_status_snapshots` | Frozen status views |
| Z15 | `guardian_meta_backup_sets` | Configuration backups |

**Key Pattern**: Every table has `tenant_id` (never cross-tenant leakage).

---

## Your First 5 Minutes

### 1. Deploy the Migrations (1 min)

All Z-series tables live in migrations:

```bash
# Apply all migrations (Z01-Z15)
# 1. Go to Supabase Dashboard → SQL Editor
# 2. Copy migrations/601-610_*.sql files
# 3. Run each one (top to bottom)
# 4. Verify: SELECT * FROM guardian_tenant_readiness_scores LIMIT 1;
```

**What they do**:
- Create tables with proper indexing
- Enable Row-Level Security (RLS) — tenant isolation
- Add audit logging hooks

### 2. Check Governance (Z10) (1 min)

```sql
SELECT * FROM guardian_meta_governance_prefs
WHERE tenant_id = 'your-tenant-id' LIMIT 1;
```

**Key fields**:
- `ai_usage_policy`: 'on' | 'off' — Controls AI features
- `external_sharing_policy`: 'internal_only' | 'cs_safe' | 'exec_ready' — Controls exports
- `data_retention_days`: 90-365 — Affects data cleanup

### 3. Create Your First Readiness Score (Z01) (1 min)

```typescript
// From any route or service:
import { computeReadinessScore } from '@/lib/guardian/meta/readinessComputationService';

const score = await computeReadinessScore('tenant-123');
// Returns: { score: 67, status: 'operational', computed_at: '2025-12-12T...' }
```

### 4. Schedule an Automation Task (Z13) (1 min)

```typescript
// Create a schedule to run every 24 hours
import { createSchedule } from '@/lib/guardian/meta/automationScheduleService';

await createSchedule({
  tenantId: 'tenant-123',
  taskType: 'kpi_eval', // Compute KPIs
  cadence: 'daily',
  runAtHour: 2, // 2am UTC
  runAtMinute: 0,
});
```

Z13 will automatically compute next_run_at and execute on schedule.

### 5. View the Status Page (Z14) (1 min)

Go to `/guardian/admin/status`:
- See real-time platform status (good/warn/bad)
- Check for blockers (missing data, policy violations)
- View historical snapshots
- Choose view type: operator (detailed) | leadership (summary) | CS (safe)

---

## Common Questions

**Q: Will Z-series slow down my alerts?**
A: No. Z-series runs asynchronously via Z13 automation. Core Guardian is unaffected.

**Q: Can I trust exports to share with customers?**
A: Yes. Z11 exports are PII-scrubbed (no emails, IPs, secrets). Z10 `externalSharingPolicy` controls what's safe to export.

**Q: What if I mess up a configuration?**
A: Z15 backups let you preview + restore. Preview always shows diff before applying. Admin confirmation required.

**Q: Are multi-tenant bugs possible?**
A: No. Every table has RLS enforcing `tenant_id = current_user_tenant_id()`. Database prevents cross-tenant queries.

**Q: How do I know Z-series is healthy?**
A: Run `npm run integrity:check` for a full health report.

---

## Key Concepts

### Tenant Isolation (RLS)

Every Z-series table enforces Row-Level Security:

```sql
CREATE POLICY "tenant_isolation" ON guardian_meta_X
FOR ALL USING (tenant_id = get_current_workspace_id());
```

**Translation**: Each query is automatically filtered to only the logged-in user's tenant. No leakage possible.

### Governance Gating (Z10)

Z10 controls all Z-series behavior via policies:

- **AI policy** → Z12 AI recommendations, Z14 AI narratives
- **Sharing policy** → What Z11 exports allow, what Z14 views show
- **Data retention** → Z06 lifecycle, what Z14 snapshots keep

### Metadata Over Metrics

Z-series stores **summaries, not raw data**:
- ✅ Readiness score: 67 (not: 1000 capability checks)
- ✅ Adoption count: 12 users (not: raw event logs)
- ✅ Playbook name: "Onboarding Day 1" (not: full instructions)

This keeps databases small + respects privacy.

### Audit Trail

Every Z-series action logs to `guardian_meta_audit_log`:

```sql
SELECT * FROM guardian_meta_audit_log
WHERE tenant_id = 'tenant-123'
ORDER BY created_at DESC LIMIT 10;
```

Columns: `action`, `entity_type`, `entity_id`, `summary`, `actor`, `source`

---

## Admin Consoles at a Glance

All behind `/guardian/admin/` (admin-only):

| Console | Route | What It Does |
|---------|-------|-------------|
| **Readiness** | `/readiness` | See capability scores + historical trend |
| **Uplift** | `/uplift` | Create improvement plans |
| **Governance** | `/governance` | Set policies + feature flags + **Z-series validation** |
| **Improvement** | `/improvement` | Track improvement actions + outcomes |
| **Automation** | `/automation` | Create schedules + triggers for Z13 |
| **Exports** | `/exports` | Create portable export bundles |
| **Status** | `/status` | See platform health snapshot |
| **Backups** | `/backups` | Create backups + restore configurations |

---

## Common Tasks

### Task: Export Z-series for Customer Handoff

```typescript
// Create a CS Transfer Kit (Z11)
import { createExportBundle } from '@/lib/guardian/meta/exportBundleService';

const result = await createExportBundle({
  tenantId: 'tenant-123',
  bundleKey: 'cs_transfer_kit',
  label: 'Q1 2025 Handoff',
  description: 'Configuration + recommendations for CS team',
  scope: ['readiness', 'uplift', 'playbooks', 'goals_okrs'],
});
// result.bundleId = UUID of portable package
```

### Task: Create a Weekly Readiness Assessment

```typescript
// Z13 automation + Z01 readiness
import { createSchedule } from '@/lib/guardian/meta/automationScheduleService';

await createSchedule({
  tenantId: 'tenant-123',
  taskType: 'stack_readiness', // Recompute readiness
  cadence: 'weekly',
  runAtHour: 8,
  runAtMinute: 0,
});
// Runs every Monday 8am UTC
```

### Task: Backup Before Major Changes

```typescript
// Z15 backup
import { createBackupSet } from '@/lib/guardian/meta/metaBackupService';

const backup = await createBackupSet({
  tenantId: 'tenant-123',
  backupKey: 'pre_upgrade_2025q1',
  label: 'Pre-Q1 Upgrade',
  description: 'Full meta snapshot before rolling out Edition upgrade',
  scope: ['governance', 'automation', 'playbooks', 'improvement_loop'],
});
```

Later, if things go wrong:
1. Go to `/guardian/admin/backups`
2. Select backup
3. Review preview diff
4. Type "RESTORE" + confirm
5. Done

---

## Debugging Tips

### "Why is my readiness score low?"

Check Z01 component weights:

```typescript
const details = await getReadinessDetails('tenant-123');
// Returns: { components: { core: 60, ai: 45, qa: 72, ... } }
// Improve low components (e.g., AI score 45 → add AI features)
```

### "Why didn't automation run?"

Check Z13 execution log:

```sql
SELECT * FROM guardian_meta_automation_executions
WHERE tenant_id = 'tenant-123'
ORDER BY started_at DESC LIMIT 5;
```

Check: `status` (running|completed|failed), `error_message`, `summary`

### "Is my export safe to share?"

Check validation warnings:

```typescript
const bundle = await getExportBundle('tenant-123', 'bundle-id');
// bundle.manifest.warnings = ['Potential IP addresses detected', ...]
```

Z11 scrubber automatically redacts PII; warnings help verify.

---

## Next Steps

1. **Learn a specific phase**: Pick one from [Z_SERIES_INDEX.md](Z_SERIES_INDEX.md)
2. **Deploy to production**: Follow [Z_SERIES_RELEASE_CHECKLIST.md](Z_SERIES_RELEASE_CHECKLIST.md)
3. **Run daily**: Check [Z_SERIES_OPERATOR_RUNBOOK.md](Z_SERIES_OPERATOR_RUNBOOK.md)
4. **Troubleshoot**: See relevant phase docs
5. **Architecture deep-dive**: Study [Z_SERIES_COMPATIBILITY_MATRIX.md](Z_SERIES_COMPATIBILITY_MATRIX.md)

---

## Still Have Questions?

- **Phase docs**: See [Z_SERIES_INDEX.md](Z_SERIES_INDEX.md)
- **Operator guide**: See [Z_SERIES_OPERATOR_RUNBOOK.md](Z_SERIES_OPERATOR_RUNBOOK.md)
- **Architecture**: See [Z_SERIES_COMPATIBILITY_MATRIX.md](Z_SERIES_COMPATIBILITY_MATRIX.md)
- **Code patterns**: See `src/lib/guardian/meta/*.ts`

**Welcome to Guardian! 🎉**
