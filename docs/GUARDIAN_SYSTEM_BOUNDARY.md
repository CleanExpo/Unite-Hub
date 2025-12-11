# Guardian System Boundary

**Module:** Guardian
**Version:** 1.0.0-RC
**Last Updated:** December 10, 2025

---

## Purpose

Guardian is the **governance and observability layer** for Unite-Hub and Synthex. It sits between core platform services and external monitoring tools, providing:

- Rule-based alerting
- Incident escalation
- Multi-channel notifications
- Risk scoring
- Activity monitoring

---

## System Context

```
┌─────────────────────────────────────┐
│   Unite-Hub Core Platform           │
│   - Tenants, users, workspaces      │
│   - Authentication, authorization   │
│   - Core business logic             │
└──────────────┬──────────────────────┘
               │
               ↓
┌─────────────────────────────────────┐
│   Guardian (This Module)            │
│   - Alert rules + evaluation        │
│   - Incident management             │
│   - Notifications (email, Slack)    │
│   - Risk scoring + insights         │
└──────────────┬──────────────────────┘
               │
               ↓
┌─────────────────────────────────────┐
│   External Services                 │
│   - Email providers (Resend, etc.)  │
│   - Slack workspaces                │
│   - Custom webhooks                 │
└─────────────────────────────────────┘
```

---

## Inputs (What Guardian Consumes)

### 1. Telemetry Events
- Source: Platform-wide event streams
- Table: `telemetry_events` (if exists)
- Usage: Alert rule condition matching

### 2. Warehouse Metrics
- Source: Aggregated platform metrics
- Table: `warehouse_rollups_hourly` (if exists)
- Usage: Alert rule condition matching

### 3. Configuration
- Alert rules (`guardian_alert_rules`)
- Schedules (`guardian_alert_schedules`)
- Webhooks (`guardian_alert_webhooks`)
- Slack config (`guardian_slack_config`)

### 4. User Actions
- Manual alert evaluation (guardian_admin)
- Rule creation/editing (guardian_admin)
- Dashboard viewing (all Guardian roles)

---

## Outputs (What Guardian Produces)

### 1. Alert Events
- Table: `guardian_alert_events`
- Purpose: Record of all fired alerts
- Consumers: Activity feeds, correlation engine, risk scoring

### 2. Incidents
- Table: `incidents` (shared with platform)
- Purpose: Escalated high/critical alerts
- Consumers: Incident management UI, oncall workflows

### 3. Notifications
- Email: via configured webhook endpoint
- Slack: via per-tenant webhook URLs
- Webhooks: via per-rule custom URLs
- Tracking: `guardian_notifications`, `guardian_notification_logs`

### 4. Analytics
- Correlation clusters (`guardian_correlation_clusters`)
- Risk scores (`guardian_risk_scores`)
- Insights summary (aggregated metrics)

### 5. Audit Logs
- Access audit (`guardian_access_audit`)
- Purpose: Compliance, security monitoring

---

## Boundaries (What Guardian Does NOT Do)

### ❌ Authentication & Authorization
- Guardian relies on Unite-Hub core auth
- Uses existing `auth.uid()` for tenant context
- Does not manage user sessions or passwords

### ❌ Billing & Usage Tracking
- Guardian does not handle subscription management
- Does not enforce quota limits
- Defers to platform billing system

### ❌ Core Tenant Lifecycle
- Guardian does not create/delete tenants
- Does not manage workspace memberships
- Relies on platform tenant management

### ❌ Data Storage & Backup
- Guardian uses Supabase for persistence
- Does not implement custom backup logic
- Relies on Supabase backup/restore capabilities

### ❌ Machine Learning & AI
- Guardian uses deterministic rule evaluation only
- No ML-based anomaly detection (planned for future)
- AI assistant features in separate modules (AI Phill, etc.)

---

## Integration Points

### Upstream (Guardian Consumes From)
- **Unite-Hub core**: Tenant context, user roles, authentication
- **Telemetry system**: Event streams for condition matching
- **Warehouse**: Aggregated metrics for condition matching
- **Incidents table**: Shared incident management

### Downstream (Guardian Produces For)
- **Email providers**: Notification delivery
- **Slack**: Real-time alerting
- **Custom webhooks**: Third-party integrations
- **Frontend dashboards**: Activity monitoring, insights
- **Compliance systems**: Audit trail consumption

### Peer Modules
- **Cognitive Twin**: May consume Guardian risk scores
- **AI Phill**: May reference Guardian alerts for strategic advice
- **Founder OS**: May display Guardian metrics in portfolio view

---

## Data Flow

### Alert Evaluation Flow
```
1. Trigger (Manual or Scheduled)
2. Fetch alert rules
3. Evaluate conditions against telemetry/warehouse
4. Insert alert events
5. Dispatch webhooks (channel='webhook')
6. Dispatch email (channel='email')
7. Dispatch Slack (high/critical)
8. Bridge to incidents (high/critical)
9. Return results
```

### Risk Score Computation Flow
```
1. Fetch alerts (last 7 days)
2. Fetch incidents (last 7 days)
3. Apply severity weights
4. Apply incident multiplier (×2)
5. Add open incident penalty (+5 each)
6. Apply time decay (up to 40%)
7. Cap at 100
8. Store in guardian_risk_scores
```

---

## Security Boundaries

### Tenant Isolation
- All Guardian tables have `tenant_id` column
- RLS policies enforce: `tenant_id = auth.uid()`
- No cross-tenant data access possible

### Role-Based Access
- **guardian_viewer**: Read-only access
- **guardian_analyst**: Read + analytics operations
- **guardian_admin**: Full access (create/edit rules, trigger evaluation)

### API Security
- User-facing APIs: Require authenticated Guardian role
- System-facing APIs: Require secret header (`x-guardian-scheduler-secret`)
- All errors sanitized (no sensitive data in error messages)

---

## Future Expansion

Guardian is designed for modular expansion:

- **H-series**: AI-assisted rule authoring and optimization
- **I-series**: Advanced QA, chaos testing, auto-remediation
- **X-series**: Cross-tenant anomaly detection (privacy-respecting)
- **Y-series**: SLA tracking, delivery guarantees, retry logic

All future work should respect existing system boundaries and maintain backward compatibility.

---

Generated: 2025-12-10
Module: Guardian v1.0.0-RC
Document: System Boundary Definition
