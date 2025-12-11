# Guardian Module Overview

**Version:** 1.0.0
**Build Date:** 2025-12-10
**Status:** Production Ready

---

## Introduction

**Guardian** is the governance and observability layer for Unite-Hub and Synthex. It provides comprehensive monitoring, alerting, incident management, and risk scoring capabilities across all workspace activities.

Guardian operates as a multi-tenant system with role-based access control, ensuring each tenant's data remains isolated and secure.

---

## Core Capabilities

### 1. Tenant & Access Control (G30-G34)
- **Tenant Hardening**: Strict tenant isolation with RLS policies
- **Tenant Enforcement**: All APIs validate tenant context
- **Role-Based Access**: Three roles (viewer, analyst, admin)
- **Access Audit Trail**: Comprehensive logging of all Guardian API access
- **Audit Viewer UI**: Founder-facing interface for reviewing access logs

### 2. Alert System (G35-G37)
- **Alert Rules & Events**: Define conditions and track triggered alerts
- **Alert Evaluation Engine**: Deterministic evaluation (equals, greater_than, less_than, exists)
- **Scheduled Evaluation**: Cron-based automated evaluation with configurable intervals
- **Debounce Logic**: Prevent alert spam with configurable debounce windows

### 3. Notification System (G38-G42)
- **Incident Bridge**: High/critical alerts automatically create incidents
- **Webhook Dispatch**: Send alerts to custom webhook URLs
- **Email Notifications**: HTML + text emails for channel='email' rules
- **Slack Notifications**: Real-time Slack messages for high/critical alerts
- **Notification Tracking**: Status tracking (pending, sent, failed) with error logging

### 4. Monitoring & Analytics (G43-G47)
- **Activity Feed API**: Unified endpoint for alerts, incidents, notifications
- **Alerts Dashboard**: Static 3-column overview of recent activity
- **Live Activity Feed**: Real-time monitoring with auto-refresh (5s/10s/30s)
- **Rule Editor UI**: Complete rule management interface with templates
- **Correlation Engine**: Cluster related alerts and incidents for pattern detection
- **Risk Score**: Standardized 0-100 risk index with severity weighting and time decay

---

## Architecture

### Database Tables (42 total)

**Core Infrastructure:**
- `guardian_access_audit` - Access logging
- `guardian_alert_rules` - Rule definitions
- `guardian_alert_events` - Fired alerts
- `guardian_alert_schedules` - Per-tenant scheduling config
- `guardian_alert_webhooks` - Webhook configurations
- `guardian_notifications` - Notification tracking
- `guardian_slack_config` - Slack integration config
- `guardian_rule_templates` - Reusable rule templates
- `guardian_correlation_clusters` - Event clusters
- `guardian_correlation_links` - Cluster memberships
- `guardian_risk_scores` - Daily risk scores

**External Integration:**
- `incidents` table (from Phase E21) - Incident management

### API Routes (15 total)

**Telemetry & Data:**
- `GET /api/guardian/telemetry` - All roles
- `GET /api/guardian/warehouse` - Analyst+
- `GET /api/guardian/replay` - Analyst+
- `GET /api/guardian/scenarios` - Admin only

**Audit:**
- `GET /api/guardian/access-audit` - Analyst+

**Alerts:**
- `GET /api/guardian/alerts` - All roles
- `POST /api/guardian/alerts` - Admin only
- `POST /api/guardian/alerts/evaluate` - Admin only
- `GET /api/guardian/alerts/schedule` - Admin only
- `POST /api/guardian/alerts/schedule` - Admin only
- `POST /api/guardian/alerts/scheduled-run` - Secret header

**Rules:**
- `GET /api/guardian/rules` - All roles
- `POST /api/guardian/rules` - Admin only
- `GET /api/guardian/rules/[id]` - All roles
- `PATCH /api/guardian/rules/[id]` - Admin only
- `DELETE /api/guardian/rules/[id]` - Admin only
- `GET /api/guardian/rules/templates` - All roles

**Analytics:**
- `GET /api/guardian/activity` - All roles
- `POST /api/guardian/correlation/run` - Analyst+
- `POST /api/guardian/risk/recompute` - Analyst+
- `GET /api/guardian/risk/summary` - All roles

### UI Pages (9 total)

1. `/guardian/telemetry` - Telemetry streams viewer
2. `/guardian/warehouse` - Warehouse data viewer
3. `/guardian/replay` - Replay sessions viewer
4. `/guardian/scenarios` - Scenario simulator
5. `/guardian/access-audit` - Access audit logs
6. `/guardian/alerts` - Alert rules + events
7. `/guardian/alerts/dashboard` - Static activity dashboard
8. `/guardian/activity` - Live activity feed
9. `/guardian/rules` - Rule editor
10. `/guardian/risk` - Risk score dashboard

---

## Notification Flow

```
Alert Evaluation (Manual or Scheduled)
    ↓
Insert Alert Events
    ↓
Dispatch Webhooks (channel='webhook')
    ↓
Dispatch Notifications:
    ├─ Email (channel='email')
    └─ Slack (high/critical only)
    ↓
Bridge to Incidents (high/critical)
    ↓
Return Results
```

---

## Risk Score Model

**Standard Model Formula:**
```
Raw Score = Alert Score + Incident Score + Open Incident Penalty
Final Score = min(100, round(Raw Score × Decay))

Where:
- Alert Score = Σ(severity_weight) for all alerts in window
- Incident Score = Σ(severity_weight × 2) for all incidents in window
- Open Incident Penalty = 5 × number of unresolved incidents
- Decay = 1 - min(0.4, days_since_start × 0.02)

Severity Weights:
- Low = 1
- Medium = 2
- High = 4
- Critical = 8
```

**Window:** Last 7 days (rolling)

**Output:** 0-100 scale
- 0-24: Low Risk
- 25-49: Medium Risk
- 50-74: High Risk
- 75-100: Critical Risk

---

## Role-Based Access

**guardian_viewer:**
- Read-only access to telemetry, alerts, activity feeds
- Cannot create/modify rules
- Cannot trigger evaluations

**guardian_analyst:**
- All viewer permissions
- Can view access audit logs
- Can trigger correlation runs
- Can recompute risk scores
- Cannot create/modify rules

**guardian_admin:**
- All analyst permissions
- Can create/modify/delete alert rules
- Can trigger manual evaluation
- Can configure schedules
- Can manage webhooks

---

## Environment Variables

**Required for Email (G41):**
```bash
GUARDIAN_EMAIL_WEBHOOK_URL=https://api.resend.com/emails
GUARDIAN_EMAIL_FROM=guardian@your-domain.com
GUARDIAN_EMAIL_TO_FALLBACK=admin@your-domain.com
```

**Required for Scheduled Evaluation (G37):**
```bash
GUARDIAN_SCHEDULER_SECRET=your-secret-key-here
```

**Optional for Slack (G42):**
- Configured per-tenant in `guardian_slack_config` table

---

## Getting Started

### 1. Apply Migrations
```bash
# Supabase Dashboard → SQL Editor → Run migrations 542-549, 584
```

### 2. Configure Environment Variables
```bash
# Add to .env.local
```

### 3. Set User Role
```sql
UPDATE profiles
SET guardian_role = 'guardian_admin'
WHERE id = auth.uid();
```

### 4. Create First Alert Rule
- Navigate to `/guardian/rules`
- Click "New rule"
- Configure name, severity, source, channel
- Save rule

### 5. Trigger Evaluation
```bash
curl -X POST http://localhost:3008/api/guardian/alerts/evaluate \
  -H "Cookie: sb-access-token=<TOKEN>"
```

### 6. View Results
- Dashboard: `/guardian/alerts/dashboard`
- Live Feed: `/guardian/activity`
- Risk Score: `/guardian/risk`

---

## Production Deployment

### Vercel Cron Configuration

**File:** `vercel.json`
```json
{
  "crons": [
    {
      "path": "/api/guardian/alerts/scheduled-run",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

### Environment Variables (Production)
```bash
GUARDIAN_SCHEDULER_SECRET=<strong-random-secret>
GUARDIAN_EMAIL_WEBHOOK_URL=<email-provider-endpoint>
GUARDIAN_EMAIL_FROM=guardian@your-domain.com
GUARDIAN_EMAIL_TO_FALLBACK=admin@your-domain.com
```

---

## Support

**Documentation:**
- Phase-specific docs: `docs/PHASE_G*_STATUS.md`
- Completion summaries: `GUARDIAN_G*_COMPLETE.txt`

**Monitoring:**
- Access logs: `/guardian/access-audit`
- Activity dashboard: `/guardian/alerts/dashboard`
- Live feed: `/guardian/activity`
- Risk score: `/guardian/risk`

---

**Generated:** 2025-12-10
**Module:** Guardian v1.0.0
**Status:** Production Ready
