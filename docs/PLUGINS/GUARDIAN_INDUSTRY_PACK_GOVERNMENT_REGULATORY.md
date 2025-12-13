# Guardian Industry Pack: Government & Regulatory Oversight

**Plugin Key**: `industry_government_regulatory_pack`
**Version**: 1.0.0
**Status**: Production
**Last Updated**: 2025-12-13

---

## Overview

The Government & Regulatory Oversight plugin provides read-only governance and audit readiness signals for government agencies and regulated entities. Designed for compliance teams, governance officers, and regulatory auditors, it delivers heuristic indicators of governance posture, validation health, and operational transparency—**not compliance certifications**.

**Core Principles**:
- ✅ **Aggregate-Only**: No case IDs, citizen data, staff identifiers
- ✅ **Read-Only**: No Guardian core modifications
- ✅ **Heuristic**: Operational indicators only, never compliance proof
- ✅ **Governance-Safe**: Explicit PII safeguards and external sharing controls
- ✅ **Transparent**: Signals clearly marked as informational

---

## Audience & Use Cases

### For Government Agencies
- Monitor governance control effectiveness
- Track audit readiness and compliance preparation
- Identify policy posture gaps before external audits
- Document governance artifacts availability

### For Regulated Entities
- Assess operational risk and control effectiveness
- Prepare for regulatory audits
- Track validation system health
- Demonstrate governance discipline

### For Compliance & Audit Teams
- Review governance signals across facilities/jurisdictions
- Identify control drift and operational pressure
- Verify validation and backup posture
- Document governance transparency

---

## Signal Categories

### 1. Audit Readiness
**Key**: `audit_readiness`

Positive indicator: Validation passing + audit enabled + export capabilities present.

**Severity**: Low (positive indicator)
**Rationale**: Validation system functioning, audit controls enabled, export module available.
**Suggested Actions**: Maintain current validation practices.

---

### 2. Policy Posture
**Key**: `policy_posture`

Positive indicator: Governance controls appropriately configured (external sharing restricted, AI governance defined).

**Severity**: Low (positive indicator)
**Rationale**: Governance controls configured: sharing restricted, AI governance defined.
**Suggested Actions**: Continue to maintain governance policies and review periodically.

---

### 3. Control Drift
**Key**: `control_drift`

Indicator: Rising risk despite stable incident volumes, suggesting emerging operational pressure or control degradation.

**Severity**: Medium
**Calculation**: Risk label = 'high' + trend = 'up' + incident growth < 1.2x
**Rationale**: Risk rising despite stable volumes indicates emerging pressure or control issues.
**Suggested Actions**: Assess operational context, review governance controls, evaluate risk assessment criteria.

---

### 4. Validation Health
**Key**: `validation_health`

Indicator: Current validation system status and trend.

**Severity Mapping**:
- Pass → Low (health good)
- Warn → Medium (attention needed)
- Fail → High (critical issues)

**Rationale**: Reflects validation system operational status.
**Suggested Actions**:
- Pass: Maintain current practices
- Warn: Address warnings to prevent escalation
- Fail: Investigate and resolve immediately

---

### 5. Backup Posture
**Key**: `backup_posture`

Indicator: Backup currency (recent vs stale) and recovery readiness.

**Severity Mapping**:
- Recent → Low (ready for recovery)
- Stale → High (recovery readiness compromised)

**Rationale**: Currency of backup data relative to recovery objectives.
**Suggested Actions**:
- Recent: Maintain regular backup schedule
- Stale: Initiate backup immediately, review automation

---

### 6. Transparency Score
**Key**: `transparency_score`

Composite informational score (0–100) based on availability of governance artifacts.

**Components** (20 points each):
- Governance policy defined (external sharing + AI controls)
- Validation system active
- Audit export available
- Backup system configured
- Risk assessment updated

**Display**: Percentage (0–100)
**Severity Mapping**:
- ≥70% → Low (transparency good)
- 50–69% → Medium (gaps exist)
- <50% → High (significant gaps)

**⚠️ Important**: Informational only. Not a compliance metric or regulatory proof.

---

## Data Model & API

### Input: Aggregate Government Data

```typescript
interface AggregateGovernmentData {
  // Operational metrics
  alerts24h: number;
  incidents24h: number;
  correlations24h: number;
  alerts30d: number;
  incidents30d: number;

  // Governance signals
  auditEnabled?: boolean;
  aiAllowed?: boolean;
  externalSharingPolicy?: 'restricted' | 'allowed_with_approval' | 'allowed';

  // Validation status
  validationStatus?: 'pass' | 'warn' | 'fail';
  lastValidationAt?: string;

  // Backup status
  backupStatus?: 'recent' | 'stale';
  lastBackupAt?: string;

  // Risk assessment
  currentRiskLabel?: 'low' | 'medium' | 'high';
  riskTrend?: 'up' | 'down' | 'flat';

  // Feature availability
  auditExportAvailable?: boolean;
  backupReadinessAvailable?: boolean;
}
```

### Output: Governance Oversight Snapshot

```typescript
interface GovOversightSnapshot {
  generatedAt: string;
  signals: GovSignal[];
  totals: {
    alerts: number;
    incidents: number;
    correlations: number;
    riskLabel: 'low' | 'medium' | 'high';
    riskTrend?: 'up' | 'down' | 'flat';
  };
  governance: {
    auditEnabled: boolean;
    aiAllowed: boolean;
    externalSharingPolicy: 'restricted' | 'allowed_with_approval' | 'allowed';
    validationStatus: 'pass' | 'warn' | 'fail' | 'not_configured';
    lastValidationAt?: string;
    backupStatus?: 'recent' | 'stale' | 'not_configured';
    auditExportAvailable: boolean;
  };
  warnings: string[];
  disclaimer: string;
}
```

---

## Dashboard: Government & Regulatory Oversight

**URL**: `/guardian/plugins/industry/government`

### Components

**Governance Overview Cards** (6-column grid)
- Audit Enabled: Boolean status
- AI Governance: Enabled/Disabled status
- Validation Status: pass/warn/fail with last run date
- External Sharing Policy: Policy name
- Backup Status: Recent/Stale if available
- Audit Export Available: Boolean status

**Oversight Signals Table** (6 columns)
- Signal: Key name (audit_readiness, policy_posture, etc.)
- Severity: Badge (low/medium/high) with icon
- Window: Time window (30d/90d/180d)
- Trend: Direction indicator (up/flat/down)
- Rationale: Plain-English explanation
- Action: Suggested action step

**Transparency Score Card** (Informational)
- Displays composite score (0–100)
- Shows breakdown of components
- Explicitly marked as informational, not compliance metric

**Governance Summary** (Executive Narrative)
- AI-generated brief (if allowed) or deterministic bullet list
- 5–7 sentences summarizing validation, audit, and drift signals
- No compliance language

**Feature Availability Notices** (Conditional)
- Warns when backup data unavailable
- Explains impact on signal availability

**Compliance Disclaimer** (Footer)
- Explicit statement: "Governance indicators are operational signals, not compliance certifications or regulatory guarantees."

**Governance Watermark** (Top-right, Conditional)
- Shows "🔒 INTERNAL - Sharing Restricted" when external sharing disabled

---

## Marketplace Integration

### Enablement Requirements

**Tier Constraint**:
- `PROFESSIONAL` tier minimum
- `ENTERPRISE` tier recommended

**Feature Constraints**:
- `guardian_core`: Core Guardian functionality (required)
- `h06_intelligence_dashboard`: Intelligence dashboard access (required)

**Governance Constraints**:
- No special governance requirements (plugin is PII-safe)
- External sharing policies enforced in watermark display

### Marketplace Endpoints

**Enable Plugin**:
```bash
POST /api/guardian/plugins/industry-government-regulatory-pack/enable?workspaceId=ws-123

# Validates tier, features, governance
# Updates workspace_plugins table
# Creates audit log entry
```

**Disable Plugin**:
```bash
POST /api/guardian/plugins/industry-government-regulatory-pack/disable?workspaceId=ws-123

# Disables plugin for workspace
# Creates audit log entry
```

---

## Governance & Compliance

### PII Safety
✅ No case IDs
✅ No citizen/resident identifiers
✅ No staff member names or IDs
✅ Aggregate counts only
✅ Governance indicators only

### Data Classification
- **Input**: Aggregate operational data (counts, trends, governance flags)
- **Processing**: Heuristic threshold calculation (deterministic)
- **Output**: Risk signals, governance status (aggregate summaries)
- **Retention**: 90 days (aligned with governance audit requirements)

### Audit Trail
All enable/disable actions logged to `audit_logs` table:
```json
{
  "workspace_id": "ws-123",
  "action": "plugin_enabled",
  "details": { "plugin_key": "industry_government_regulatory_pack" },
  "created_at": "2025-12-13T10:30:00Z"
}
```

### Compliance Limitations
⚠️ **This plugin is NOT**:
- A compliance certification tool
- Regulatory proof of governance
- A substitute for actual audits
- A guarantee of audit success

✅ **This plugin IS**:
- An operational indicator system
- A governance posture assessment tool
- A preparation aid for audits
- A transparency and accountability system

---

## Testing & Validation

### Test Coverage
- 35+ unit tests for signal detection algorithms
- Edge case testing: missing governance data, configuration gaps
- Governance gating tests: tier/feature constraints
- UI smoke tests: dashboard rendering and navigation
- Transparency score calculation tests

### Validation Checklist
- [ ] Signal detection algorithms pass unit tests
- [ ] Dashboard UI renders correctly with mock data
- [ ] AI narrative respects governance flags
- [ ] Enable/disable endpoints enforce constraints
- [ ] Audit logging captures all plugin lifecycle events
- [ ] PII safeguards verified (aggregate-only data)
- [ ] Governance watermarks display correctly
- [ ] TypeScript compilation passes
- [ ] Transparency score is calculated correctly
- [ ] Disclaimer is always displayed

---

## Frequently Asked Questions

**Q: Can this plugin prove regulatory compliance?**
A: No. The plugin provides operational governance indicators. Regulatory compliance requires official audit processes and regulatory frameworks.

**Q: What happens if backup data is unavailable?**
A: The plugin continues operation and displays a "not_configured" status for backup posture. Transparency score is adjusted accordingly.

**Q: Can we customize signal thresholds?**
A: Not currently. Thresholds are built-in. Custom configurations require a feature enhancement request.

**Q: Who should have access to this plugin?**
A: Government/regulatory staff, compliance officers, governance teams, and authorized auditors.

**Q: Is the transparency score a compliance metric?**
A: No. It's an informational composite score based on governance artifact availability. Not regulatory proof.

**Q: How is external sharing restricted?**
A: Via governance watermarks ("🔒 INTERNAL") and workspace-level sharing policy enforcement.

---

## Support & Documentation

**Plugin Issues**: Check Guardian troubleshooting guide
**Feature Requests**: Submit via admin panel feedback
**Governance Questions**: Contact compliance team
**Technical Details**: See signal service implementation in `/src/lib/guardian/plugins/industry-government-regulatory/signalService.ts`

---

## Changelog

### v1.0.0 (2025-12-13)
- Initial release with 6 governance signal categories
- Dashboard UI with governance overview, audit readiness, transparency score
- Marketplace integration (enable/disable)
- Audit logging and governance compliance
- Comprehensive signal rationale and suggested actions
