# Phase 64: Self-Evolving System Engine

**Status**: ✅ Complete
**Date**: 2025-11-23
**Priority**: High - Meta-engine for continuous improvement

---

## Overview

The Self-Evolving System Engine is a meta-level engine that continuously scans the system for improvement opportunities, generates System Improvement Proposals (SIPs), and presents them to the founder for approval. It acts as the system's "roadmap inference" capability, analyzing operational patterns and suggesting optimizations.

---

## Architecture

### Core Components

```
Evolution Engine
    ├── Signal Detection (10 sources)
    ├── Pattern Analysis
    ├── SIP Generation
    ├── Weekly Evolution Tasks
    └── Founder Briefings
```

### Files Created

**Engine Layer** (`src/lib/evolution/`):
- `evolutionSignals.ts` - Signal source definitions and pattern detection
- `sipGenerator.ts` - System Improvement Proposal generation and scoring
- `evolutionEngine.ts` - Main orchestration engine

**API Layer** (`src/app/api/evolution/`):
- `proposals/route.ts` - SIP management endpoints

**UI Layer** (`src/ui/components/`):
- `EvoProposalCard.tsx` - Proposal display with scoring
- `ComplianceBadge.tsx` - Status indicators (reused from Phase 63)
- `GovernanceRiskCard.tsx` - Risk display (reused from Phase 63)
- `GovernanceScoreBar.tsx` - Score visualization (reused from Phase 63)

**Dashboard** (`src/app/founder/dashboard/`):
- `evolution/page.tsx` - Founder evolution oversight console

---

## Signal Sources

The engine monitors **10 signal sources** for improvement opportunities:

| Source | Description | Priority Weight |
|--------|-------------|-----------------|
| `cost_anomalies` | Token spend spikes, unexpected charges | High |
| `performance_slowdowns` | API latency, timeout increases | High |
| `client_usage_patterns` | Feature adoption, drop-off points | Medium |
| `governance_audit_failures` | Policy breaches, compliance gaps | High |
| `creative_inconsistencies` | Brand drift, quality declines | Medium |
| `mission_bottlenecks` | Blocked missions, repeated failures | High |
| `client_feedback` | NPS drops, support tickets | High |
| `underutilized_features` | Built but rarely used features | Low |
| `manual_interventions` | Founder overrides, manual fixes | Medium |
| `error_patterns` | Recurring errors, exception clusters | High |

### Signal Priority Levels

- **Critical**: Immediate founder attention required
- **High**: Address within 24-48 hours
- **Medium**: Include in weekly planning
- **Low**: Track for monthly review

---

## System Improvement Proposals (SIPs)

### Proposal Fields

```typescript
interface SystemImprovementProposal {
  id: string;
  workspace_id: string;

  // Content
  title: string;
  description: string;
  affected_subsystems: string[];
  source_signals: string[];

  // Scoring (0-100)
  urgency_score: number;
  founder_value_score: number;
  risk_score: number;
  confidence: number;

  // Effort
  effort_estimate: 'low' | 'medium' | 'high';

  // Guidance
  recommended_action: string;
  implementation_steps: string[];
  rollback_plan: string;

  // Status
  status: 'draft' | 'pending_review' | 'approved' | 'declined' | 'implemented';

  // Metadata
  created_at: string;
  reviewed_at?: string;
  implemented_at?: string;
}
```

### Scoring Breakdown

**Urgency Score** (0-100):
- Signal priority weights
- Time since detection
- Impact severity
- Trend direction

**Founder Value Score** (0-100):
- Cost savings potential
- Client impact
- Time savings
- Strategic alignment

**Risk Score** (0-100):
- Implementation complexity
- Rollback difficulty
- Client disruption potential
- Data integrity concerns

**Confidence** (0-100):
- Signal consistency
- Historical accuracy
- Data completeness
- Pattern strength

### Effort Estimates

- **Low**: < 2 hours, minimal testing
- **Medium**: 2-8 hours, standard testing
- **High**: 1-3 days, comprehensive testing

---

## Weekly Evolution Tasks

Automated tasks run weekly to maintain system health:

1. **Signal Aggregation**
   - Collect signals from all 10 sources
   - Deduplicate and normalize
   - Calculate trends

2. **Pattern Analysis**
   - Identify recurring patterns
   - Detect emerging trends
   - Flag anomalies

3. **SIP Generation**
   - Convert high-confidence patterns to proposals
   - Score and prioritize
   - Generate implementation guidance

4. **Report Generation**
   - Weekly evolution report for founder
   - Metrics and trends
   - Recommendations

5. **Cleanup**
   - Archive old signals
   - Clean up declined proposals
   - Update baselines

---

## API Endpoints

### GET /api/evolution/proposals

Query parameters:
- `action=pending` - Get pending proposals
- `action=briefing` - Get founder briefing
- `action=report` - Get weekly report
- `action=scan` - Run improvement scan

### POST /api/evolution/proposals

Actions:
- `approve` - Approve a proposal
- `decline` - Decline a proposal
- `implement` - Mark as implemented
- `weekly_tasks` - Run weekly evolution tasks

---

## Safety Constraints

### Read-Only Operation
- Engine operates in read-only mode by default
- No production changes without explicit founder approval
- All proposals require manual review

### Approval Requirements
- Every SIP requires founder approval
- High-risk proposals require confirmation
- Rollback plan required for approval

### Audit Trail
- Full logging of all proposals
- Decision history preserved
- Implementation tracking

### Rollback Capability
- Every implementation must have rollback plan
- One-click rollback available
- State preservation before changes

---

## Founder Dashboard Features

### Overview Tab
- Quick stats (pending, signals, implemented, health)
- Signal source breakdown
- Action items checklist
- System health trend

### Proposals Tab
- Proposal cards with full scoring
- Approve/Decline actions
- Affected subsystems
- Recommended actions

### Signals Tab
- Recent signals with priority
- Source and timestamp
- Severity badges

### History Tab
- Implementation history
- Timeline view
- Success tracking

---

## Integration Points

### With Phase 62 (Executive Brain)
- Receives mission completion data
- Detects bottlenecks
- Suggests optimizations

### With Phase 63 (Governance)
- Monitors audit failures
- Tracks compliance trends
- Flags policy improvements

### With Phase 60 (Agency Director)
- Analyzes client patterns
- Identifies risk trends
- Suggests proactive measures

### With Phase 61 (Creative Director)
- Monitors quality trends
- Detects brand drift
- Suggests guidelines updates

---

## Usage Examples

### Running a Manual Scan

```typescript
// API call
const response = await fetch('/api/evolution/proposals?action=scan&workspaceId=xxx');
const { signals, proposals } = await response.json();
```

### Approving a Proposal

```typescript
const response = await fetch('/api/evolution/proposals', {
  method: 'POST',
  body: JSON.stringify({
    action: 'approve',
    workspaceId: 'xxx',
    proposalId: 'sip-123'
  })
});
```

### Getting Weekly Report

```typescript
const response = await fetch('/api/evolution/proposals?action=report&workspaceId=xxx');
const report = await response.json();
// Returns: signals_by_source, proposals_approved/declined/implemented, health_trend
```

---

## Key Metrics

| Metric | Target | Description |
|--------|--------|-------------|
| Signal Detection | < 24h | Time to detect issues |
| SIP Generation | < 1h | Time from signal to proposal |
| Approval Rate | > 60% | Percentage of useful proposals |
| Implementation Success | > 90% | Successful implementations |
| Health Score | > 75% | Overall evolution health |

---

## Future Enhancements

### Phase 65+ Considerations
- AI-assisted implementation (with approval gates)
- Predictive signal detection
- Cross-workspace learning
- Automated A/B testing for improvements
- Cost-benefit tracking post-implementation

---

## Truth-Layer Compliance

✅ **No fake metrics** - All signals from real system data
✅ **No hallucinated capabilities** - Only suggests what system can do
✅ **Founder approval required** - Every change needs explicit approval
✅ **Full audit logging** - Complete decision trail
✅ **Rollback available** - All changes reversible

---

## Testing

```bash
# Test evolution scan
curl "http://localhost:3008/api/evolution/proposals?action=scan&workspaceId=test"

# Test weekly tasks
curl -X POST "http://localhost:3008/api/evolution/proposals" \
  -H "Content-Type: application/json" \
  -d '{"action": "weekly_tasks", "workspaceId": "test"}'
```

---

**Phase 64 Complete** - Self-Evolving System Engine operational with continuous improvement capabilities.
