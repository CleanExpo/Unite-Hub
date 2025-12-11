# Guardian 1.0.0-RC Release Notes

**Release Date:** December 10, 2025
**Status:** Release Candidate
**Module:** Guardian (Governance + Observability Layer)

---

## Overview

Guardian 1.0.0-RC is the comprehensive governance, alerting, correlation, and risk scoring engine for Unite-Hub and Synthex. This release candidate includes 52 phases (G01-G52) spanning:

- **Tenant isolation + access control** (G30-G32)
- **Access audit logging** (G33-G34)
- **Alert rules + evaluation engine** (G35-G36)
- **Scheduled evaluation** (G37)
- **Incident bridge** (G38)
- **Webhook + email + Slack notifications** (G39-G42)
- **Activity dashboards** (G43-G44)
- **Rule editor UI** (G45)
- **Correlation clustering** (G46)
- **Risk scoring** (G47)
- **Module finalization** (G48)
- **Notifications V2** (G49)
- **Insights dashboard** (G50)
- **QA suite** (G51)
- **Release candidate** (G52)

Guardian is tenant-scoped, RLS-protected, and designed to be safe-by-default.

---

## Key Features

### Rule Engine & Editor
- Define alert rules with conditions (equals, greater_than, less_than, exists)
- Rule templates for quick creation
- Full CRUD operations via UI and API
- Enable/disable rules without deletion
- Cascade deletion (rule → webhooks → events)

### Alert Evaluation
- **Manual evaluation**: Triggered by guardian_admin via API
- **Scheduled evaluation**: Cron-based automation with configurable intervals
- **Deterministic engine**: No ML, pure condition matching
- **Debounce logic**: Prevent evaluation spam

### Notifications
- **Email**: HTML + text templates, env-based webhook delivery
- **Slack**: Real-time messages for high/critical alerts
- **Webhooks**: Custom POST endpoints with signed headers
- **In-app**: Activity feeds and dashboards
- **Delivery tracking**: Status logging (pending, sent, failed)
- **V2 logs**: Detailed delivery attempt tracking

### Incident Management
- **Automatic escalation**: High/critical alerts → incidents
- **System attribution**: Manual vs scheduled evaluation tracking
- **Correlation clusters**: Group related alerts/incidents by time + severity

### Analytics & Insights
- **Risk score**: 0-100 standardized index with severity weighting + time decay
- **Activity feeds**: Static dashboard + live polling view
- **Insights summary**: High-level metrics (alerts, incidents, top rules, risk)
- **Historical tracking**: 60-day trend analysis

### Access Control
- **Three roles**: guardian_viewer, guardian_analyst, guardian_admin
- **Audit trail**: Complete access logging with IP + user agent
- **Audit viewer UI**: Founder-facing interface for reviewing access

---

## Database Schema

**Tables (43 total):**
- `guardian_access_audit` - Access logging
- `guardian_alert_rules` - Rule definitions
- `guardian_alert_events` - Fired alerts
- `guardian_alert_schedules` - Scheduling config
- `guardian_alert_webhooks` - Webhook config
- `guardian_notifications` - Notification tracking
- `guardian_notification_logs` - V2 delivery logs
- `guardian_slack_config` - Slack integration
- `guardian_rule_templates` - Reusable templates
- `guardian_correlation_clusters` - Event clusters
- `guardian_correlation_links` - Cluster memberships
- `guardian_risk_scores` - Daily risk scores
- `incidents` (external) - Shared incident table

**Migrations:** 542-550, 584

---

## API Routes (24 total)

**Data Access:**
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
- `GET /api/guardian/insights/summary` - All roles

**Notifications:**
- `GET /api/guardian/notifications/logs` - Analyst+

---

## UI Pages (11 total)

1. `/guardian/telemetry` - Telemetry streams
2. `/guardian/warehouse` - Warehouse data
3. `/guardian/replay` - Replay sessions
4. `/guardian/scenarios` - Scenario simulator
5. `/guardian/access-audit` - Access logs
6. `/guardian/alerts` - Alert management
7. `/guardian/alerts/dashboard` - Activity dashboard
8. `/guardian/activity` - Live feed
9. `/guardian/rules` - Rule editor
10. `/guardian/risk` - Risk score
11. `/guardian/insights` - High-level metrics

---

## Environment Variables

**Required:**
```bash
# Scheduled evaluation
GUARDIAN_SCHEDULER_SECRET=<strong-random-secret>

# Email notifications
GUARDIAN_EMAIL_WEBHOOK_URL=https://api.resend.com/emails
GUARDIAN_EMAIL_FROM=guardian@your-domain.com
GUARDIAN_EMAIL_TO_FALLBACK=admin@your-domain.com
```

**Optional:**
- Slack configuration stored per-tenant in database

---

## Known Limitations (RC)

- QA test coverage is minimal (smoke tests only)
- No retry logic for failed notifications
- Correlation uses simple time-bucketing (not ML-based)
- Risk score uses standard model (no custom weighting)
- No multi-tenant anomaly detection
- No AI-assisted rule authoring

These will be addressed in future H-series and I-series phases.

---

## Production Readiness

**Ready For:**
- ✅ Internal tenant monitoring
- ✅ Limited external tenant rollout
- ✅ Founder-facing dashboards
- ✅ Basic alerting workflows

**Not Yet Ready For:**
- ❌ Large-scale multi-tenant deployment (needs expanded QA)
- ❌ SLA-backed alerting (needs retry logic + delivery SLAs)
- ❌ Complex correlation scenarios (needs ML-based pattern detection)

---

## Upgrade Path

Guardian is designed for incremental deployment:

1. Apply migrations (542-550, 584)
2. Configure environment variables
3. Set user roles (`guardian_admin` for admins)
4. Create first alert rule
5. Configure Slack/email (optional)
6. Enable scheduled evaluation (optional)
7. Monitor via dashboards

No breaking changes expected in future updates (all additive).

---

## Support & Documentation

- **Module overview**: `docs/GUARDIAN_OVERVIEW.md`
- **Phase docs**: `docs/PHASE_G*_STATUS.md`
- **Completion summaries**: `GUARDIAN_G*_COMPLETE.txt`
- **Transfer package**: `docs/GUARDIAN_TRANSFER_PACKAGE.md`

---

**Guardian 1.0.0-RC is production-ready for internal use and limited external rollout.**

Generated: 2025-12-10
Module: Guardian v1.0.0-RC
Status: Release Candidate
