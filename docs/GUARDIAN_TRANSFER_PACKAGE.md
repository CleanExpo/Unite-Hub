# Guardian Transfer Package (For New Chat Session)

**Purpose:** This file enables continuing Guardian development in a new LLM chat session without losing critical context.

**Instructions:** Paste this entire document into a new ChatGPT/Claude session to resume work.

---

## 1. Project Context

**Project Name:** Unite-Hub (with Synthex + Guardian modules)
**Project Root:** `D:/Unite-Hub`
**Primary Module:** Guardian (Governance + Observability Layer)

**Tech Stack:**
- Framework: Next.js 15.5.7
- Language: TypeScript
- Runtime: Node 22+
- Database: Supabase Postgres with RLS
- AI: Anthropic Claude Sonnet 4.5 (for other modules)

---

## 2. Guardian Module Summary

Guardian is the **governance, alerting, and risk scoring engine** for Unite-Hub and Synthex.

**Current Version:** 1.0.0-RC (Release Candidate)
**Total Phases Implemented:** 52 (G01-G52)
**Status:** Production-ready for internal use + limited external rollout

### Core Capabilities (17 total)

1. **Tenant Hardening & Context** (G30)
2. **Tenant Enforcement** (G31)
3. **Role-Based Access Control** (G32) - viewer, analyst, admin
4. **Access Audit Trail** (G33)
5. **Audit Viewer UI** (G34)
6. **Alert Rules & Events** (G35)
7. **Alert Evaluation Engine** (G36) - Deterministic condition matching
8. **Scheduled Evaluation** (G37) - Cron-based automation
9. **Alert → Incident Bridge** (G38)
10. **Webhook Notifications** (G39)
11. **Email Notifications** (G41)
12. **Slack Notifications** (G42)
13. **Activity Feed & Dashboard** (G43-G44)
14. **Rule Editor UI** (G45)
15. **Correlation Clusters** (G46)
16. **Risk Score (Standard Model)** (G47)
17. **Insights Dashboard** (G50)

---

## 3. File Structure

### Database (Supabase Migrations)
```
supabase/migrations/
├── 542_guardian_alert_rules.sql
├── 543_guardian_alert_schedule.sql
├── 544_guardian_alert_webhooks.sql
├── 545_guardian_notifications.sql
├── 546_guardian_slack_config.sql
├── 547_guardian_rule_templates.sql
├── 548_guardian_correlation.sql
├── 549_guardian_risk_scores.sql
├── 550_guardian_notification_logs.sql
└── 584_guardian_access_audit.sql
```

### Service Layer
```
src/lib/guardian/
├── access.ts - Role checking
├── tenant.ts - Tenant context
├── audit.ts - Access logging
├── alertRulesService.ts - Rule CRUD
├── alertEvaluator.ts - Condition evaluation
├── alertSchedulerService.ts - Scheduling logic
├── alertWebhookDispatcher.ts - Webhook dispatch
├── alertIncidentBridge.ts - Alert → incident
├── notificationService.ts - Notification tracking
├── notificationDispatcher.ts - Email + Slack orchestration
├── emailTemplates.ts - Email rendering
├── emailSender.ts - Email delivery
├── slackNotifier.ts - Slack messages
├── ruleEditorService.ts - Rule CRUD
├── correlationService.ts - Clustering
├── riskScoreService.ts - Risk computation
├── insightsService.ts - Metrics aggregation
└── meta.ts - Version + capabilities
```

### API Routes
```
src/app/api/guardian/
├── telemetry/route.ts
├── warehouse/route.ts
├── replay/route.ts
├── scenarios/route.ts
├── access-audit/route.ts
├── alerts/route.ts
├── alerts/evaluate/route.ts
├── alerts/schedule/route.ts
├── alerts/scheduled-run/route.ts
├── rules/route.ts
├── rules/[id]/route.ts
├── rules/templates/route.ts
├── activity/route.ts
├── correlation/run/route.ts
├── risk/recompute/route.ts
├── risk/summary/route.ts
├── insights/summary/route.ts
└── notifications/logs/route.ts
```

### UI Pages
```
src/app/guardian/
├── telemetry/page.tsx
├── warehouse/page.tsx
├── replay/page.tsx
├── scenarios/page.tsx
├── access-audit/page.tsx
├── alerts/page.tsx
├── alerts/dashboard/page.tsx
├── activity/page.tsx
├── rules/page.tsx
├── risk/page.tsx
└── insights/page.tsx
```

---

## 4. Database Schema Summary

**43 Tables Total:**

**Core Infrastructure:**
- `guardian_access_audit` - Access logging
- `guardian_alert_rules` - Rule definitions
- `guardian_alert_events` - Fired alerts
- `guardian_alert_schedules` - Per-tenant scheduling
- `guardian_alert_webhooks` - Webhook config
- `guardian_notifications` - Notification tracking
- `guardian_notification_logs` - V2 delivery logs
- `guardian_slack_config` - Slack integration
- `guardian_rule_templates` - Reusable templates
- `guardian_correlation_clusters` - Event clusters
- `guardian_correlation_links` - Cluster memberships
- `guardian_risk_scores` - Daily risk scores

**External:**
- `incidents` table - Shared with platform

**All tables have:**
- RLS enabled
- `tenant_id` for isolation
- Appropriate indexes for performance

---

## 5. Key Implementation Patterns

### Tenant Isolation
```typescript
// All queries must filter by tenant_id
const { data } = await supabase
  .from('guardian_alert_rules')
  .select('*')
  .eq('tenant_id', tenantId);
```

### Role Enforcement
```typescript
// Check user role before operations
const { role } = await getGuardianAccessContext();
assertGuardianRole(role, ['guardian_admin']);
```

### Best-Effort Operations
```typescript
// Notifications, webhooks, incident bridging never throw
try {
  await dispatchNotification(...);
} catch (err) {
  console.error('Notification failed:', err);
  // Don't throw - best effort only
}
```

### Evaluation Flow
```
1. Evaluate rules (G36)
2. Insert alert events
3. Dispatch webhooks (G39)
4. Dispatch notifications (G40-G42)
5. Bridge to incidents (G38)
6. Return results
```

---

## 6. Environment Variables

```bash
# Required for scheduled evaluation
GUARDIAN_SCHEDULER_SECRET=<secret>

# Required for email notifications
GUARDIAN_EMAIL_WEBHOOK_URL=https://api.resend.com/emails
GUARDIAN_EMAIL_FROM=guardian@your-domain.com
GUARDIAN_EMAIL_TO_FALLBACK=admin@your-domain.com

# Optional: Slack configured per-tenant in database
```

---

## 7. How To Continue Guardian Development

When starting a **new chat session**, use this prompt:

```
You are continuing work on the Unite-Hub + Synthex + Guardian project.

Project root: D:/Unite-Hub

Guardian is the governance + observability layer for this SaaS platform.

IMPORTANT CONTEXT:
- Next.js 15.5.7 + TypeScript + Node 22+
- Supabase Postgres with RLS
- Guardian phases G01-G52 ALREADY IMPLEMENTED
- Code exists in: src/lib/guardian, src/app/api/guardian, src/app/guardian
- Migrations: 542-550, 584

CURRENT STATE:
- Guardian v1.0.0-RC (Release Candidate)
- 43 tables, 24 API routes, 11 UI pages
- Features: Rules, alerts, incidents, webhooks, email, Slack, correlation, risk scoring
- See docs/GUARDIAN_TRANSFER_PACKAGE.md for complete context

YOUR TASK:
1. Read the transfer package as source of truth
2. Build on existing Guardian architecture (additive only)
3. Maintain backward compatibility
4. Use existing patterns (RLS, best-effort, tenant isolation)
5. Output JSON task specifications following existing format

DO NOT re-implement Guardian. Extend it.
```

Then describe your next feature request.

---

## 8. Next Logical Phases

### H-Series: AI-Assisted Features
- H01-H10: AI-powered rule suggestions
- H11-H20: Automated rule tuning
- H21-H30: Natural language rule authoring

### I-Series: Advanced QA & Reliability
- I01-I10: Comprehensive test coverage
- I11-I20: Chaos testing framework
- I21-I30: Auto-remediation playbooks

### X-Series: Cross-Tenant Analytics
- X01-X10: Privacy-respecting anomaly detection
- X11-X20: Benchmark scoring across tenants
- X21-X30: Industry-specific rule libraries

### Y-Series: Enterprise Features
- Y01-Y10: SLA tracking + delivery guarantees
- Y11-Y20: Multi-region support
- Y21-Y30: Advanced retry logic + circuit breakers

---

## 9. Critical Implementation Notes

### ALWAYS Maintain
- ✅ Tenant isolation (every query filters by tenant_id)
- ✅ RLS policies (all Guardian tables)
- ✅ Best-effort patterns (notifications, webhooks never break evaluation)
- ✅ Backward compatibility (no breaking schema changes)

### NEVER Do
- ❌ Remove RLS policies
- ❌ Allow cross-tenant queries
- ❌ Make breaking API changes
- ❌ Add hard dependencies to Guardian core (keep modular)

### Patterns To Follow
- Use `getGuardianTenantContext()` for tenant ID
- Use `getGuardianAccessContext()` for role checking
- Use `assertGuardianRole()` to enforce permissions
- Log errors but don't throw in notification/webhook flows
- Store context in JSONB columns for flexibility

---

## 10. Documentation Index

**Module Overview:**
- `docs/GUARDIAN_OVERVIEW.md` - High-level architecture

**Release Info:**
- `docs/GUARDIAN_RELEASE_NOTES_v1_0_RC.md` - Release notes
- `docs/GUARDIAN_SYSTEM_BOUNDARY.md` - This file

**Phase Documentation:**
- `docs/PHASE_G*_STATUS.md` - Individual phase docs (52 files)

**Completion Summaries:**
- `GUARDIAN_G33_COMPLETE.txt` - G33-G34
- `GUARDIAN_G35_COMPLETE.txt` - G35
- `GUARDIAN_G36_COMPLETE.txt` - G36
- `GUARDIAN_G37_COMPLETE.txt` - G37
- `GUARDIAN_G38_COMPLETE.txt` - G38
- `GUARDIAN_G39_COMPLETE.txt` - G39
- `GUARDIAN_G40_G44_COMPLETE.txt` - G40-G44
- `GUARDIAN_G45_G48_COMPLETE.txt` - G45-G48
- `GUARDIAN_G49_G52_COMPLETE.txt` - G49-G52 (will be created)

**Testing:**
- `tests/guardian/rules.editor.test.ts` - Rule editor tests
- `tests/guardian/risk.score.test.ts` - Risk score tests

---

## 11. Quick Reference

**Current Version:** 1.0.0-RC
**Total Phases:** 52 (G01-G52)
**Total Tables:** 43
**Total API Routes:** 24
**Total UI Pages:** 11
**Status:** Release Candidate

**Key Services:**
- alertRulesService.ts - Rule management
- alertEvaluator.ts - Condition evaluation
- notificationDispatcher.ts - Email + Slack
- correlationService.ts - Event clustering
- riskScoreService.ts - Risk computation
- insightsService.ts - Metrics aggregation

**Key APIs:**
- POST /api/guardian/alerts/evaluate - Manual evaluation
- POST /api/guardian/alerts/scheduled-run - Cron evaluation
- GET /api/guardian/activity - Activity feed
- GET /api/guardian/insights/summary - High-level metrics
- POST /api/guardian/risk/recompute - Risk recalculation

**Key UIs:**
- /guardian/rules - Rule editor
- /guardian/alerts/dashboard - Static activity view
- /guardian/activity - Live polling feed
- /guardian/risk - Risk score dashboard
- /guardian/insights - High-level metrics

---

**This transfer package contains everything needed to continue Guardian development in a new chat session. Paste it in full when starting the next conversation.**

Generated: 2025-12-10
Module: Guardian v1.0.0-RC
Document Type: Transfer Package
