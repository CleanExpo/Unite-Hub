# Phase 60: AI Agency Director

**Generated**: 2025-11-23
**Status**: ✅ Complete
**Purpose**: Central AI oversight for all clients

---

## Executive Summary

Phase 60 establishes the **AI Agency Director** - a central AI system that provides oversight, risk detection, and opportunity identification across all clients while maintaining truth-layer compliance.

### Core Principles

1. **Truth Layer Only** - All insights based on real data, no projections
2. **No Fake Metrics** - Every number comes from actual measurements
3. **No Predictions Without Data** - Forecasts require historical evidence
4. **Required Data Freshness** - Insights based on data less than 24 hours old
5. **Actionable Intelligence** - Every insight includes recommended actions

---

## Data Sources

The Director aggregates data from 8 sources:

| Source | Data Type | Refresh Rate |
|--------|-----------|--------------|
| Success Scores | Client performance metrics | Real-time |
| Production Jobs | Content generation activity | Real-time |
| Performance Insights | Feature usage, engagement | Hourly |
| Visual Generation | Image/video production | Real-time |
| SEO/GEO Audits | Search visibility data | Daily |
| Financial Usage | Cost and budget tracking | Hourly |
| Timecard Data | Time allocation | Daily |
| Activation Engine | 90-day program progress | Real-time |

---

## Risk Detection Engine

### Risk Categories

The Director monitors 8 risk categories:

| Category | Description | Critical Threshold |
|----------|-------------|-------------------|
| Churn Risk | Client likely to cancel | Score > 80 |
| Budget Overrun | Exceeding cost limits | Usage > 120% |
| Content Stagnation | Low content production | 0 pieces/week |
| Engagement Drop | Reduced platform usage | 0 logins/week |
| Deadline Miss | Missed deliverables | 5+ misses/month |
| Quality Decline | Approval rate dropping | Score < 10% |
| Compliance Issue | Truth-layer violations | Any flags |
| Resource Constraint | Near capacity limits | Usage > 95% |

### Risk Severity Levels

| Level | Description | Response Time |
|-------|-------------|---------------|
| Critical | Immediate action required | Within 24 hours |
| High | Priority attention needed | Within 48 hours |
| Medium | Monitor closely | Weekly review |
| Low | Standard monitoring | Monthly review |

### Risk Score Calculation

Overall risk score (0-100) calculated from weighted components:
- Churn risk: 25%
- Budget usage: 20%
- Content activity: 15%
- Engagement: 15%
- Deadlines: 10%
- Quality: 8%
- Compliance: 5%
- Resources: 2%

---

## Opportunity Engine

### Opportunity Categories

| Category | Indicators | Min Confidence |
|----------|------------|----------------|
| Upsell Ready | High feature usage, frequent logins | 70% |
| Referral Potential | High NPS, positive results | 75% |
| Case Study Candidate | Measurable success, 60+ days | 80% |
| Expansion Opportunity | Multiple locations, growing team | 65% |
| Efficiency Gain | Low feature usage, good health | 60% |
| Cross-Sell | Unused features, stable engagement | 70% |

### Opportunity Confidence

Confidence scores based on indicator matches:
- 3/3 indicators = 100% confidence
- 2/3 indicators = 66% confidence
- 1/3 indicators = 33% confidence

Opportunities only surfaced when confidence meets minimum threshold.

### Revenue Potential Estimates

Based on actual current spend:
- **Upsell**: 50% of current monthly spend
- **Referral**: 100% (one new client acquisition)
- **Expansion**: 30% per additional seat
- **Cross-sell**: 30% of current spend

---

## API Endpoints

### GET /api/director/insights

Get Director insights and briefings:

```
?type=briefing   - Daily founder briefing
?type=overview   - All clients overview
?type=client&client_id=uuid - Specific client insights
```

### GET /api/director/alerts

Get active alerts with filtering:

```
?severity=high     - Filter by severity
?category=churn_risk - Filter by category
```

### POST /api/director/alerts

Record action taken on alert:

```json
{
  "client_id": "uuid",
  "action": "scheduled_call"
}
```

---

## Daily Briefing Structure

Generated each day for founder review:

```typescript
interface DirectorBriefing {
  generated_at: string;
  period: 'daily' | 'weekly';
  total_clients: number;
  clients_at_risk: number;
  total_opportunities: number;
  top_risks: DirectorInsight[];
  top_opportunities: DirectorInsight[];
  action_items: string[];
  metrics_summary: {
    avg_health_score: number;
    total_content_generated: number;
    total_revenue_at_risk: number;
    efficiency_score: number;
  };
}
```

---

## UI Components

### DirectorStatusGrid

Overview of all clients showing:
- Summary cards (total, healthy, attention, at-risk, critical)
- Client cards with health scores
- Risk and opportunity counts
- Activation day progress
- Click to view details

### DirectorRiskCard

Risk alert display showing:
- Category icon and color coding
- Severity badge
- Description with context
- Relevant metrics
- Recommended actions (clickable)
- Detection timestamp

### DirectorOpportunityCard

Opportunity display showing:
- Category icon and color
- Estimated revenue value
- Confidence percentage
- Key metrics
- Next steps (clickable)

---

## Founder Dashboard

Located at `/founder/dashboard/director`

### Tabs

1. **Overview** - Client status grid with summary
2. **Risks** - Active risks sorted by severity
3. **Opportunities** - Growth opportunities with values
4. **Actions** - Daily action items checklist

### Quick Stats

- Average health score across all clients
- Clients at risk count
- Total opportunities count
- Revenue at risk total

---

## Files Created (Phase 60)

### Services

1. `src/lib/director/aiDirectorEngine.ts` - Main Director engine
2. `src/lib/director/aiDirectorRiskEngine.ts` - Risk detection
3. `src/lib/director/aiDirectorOpportunityEngine.ts` - Opportunity detection

### API Routes

4. `src/app/api/director/insights/route.ts` - Insights endpoint
5. `src/app/api/director/alerts/route.ts` - Alerts endpoint

### UI Components

6. `src/ui/components/DirectorRiskCard.tsx` - Risk display
7. `src/ui/components/DirectorOpportunityCard.tsx` - Opportunity display
8. `src/ui/components/DirectorStatusGrid.tsx` - Client overview grid

### Pages

9. `src/app/founder/dashboard/director/page.tsx` - Founder dashboard

### Documentation

10. `docs/PHASE60_AI_AGENCY_DIRECTOR.md` - This document

---

## Integration Points

### With Phase 57 (Soft Launch)

- Director monitors soft launch clients
- Risk detection during controlled rollout
- Founder gates informed by Director insights

### With Phase 58 (Scaling)

- Director tracks resource constraints
- Cost shields informed by budget risks
- Performance guard thresholds from Director

### With Phase 59 (Marketing)

- Lead scores feed into Director overview
- Activation insights aggregated
- Client health scores unified

---

## Truth Layer Compliance

### Required Disclaimers

Every Director output includes:
- "Insights based on real client data"
- "No projections or AI-generated estimates"
- "Recommended actions based on historical patterns"

### Forbidden Content

Director will NEVER generate:
- ~~Projected revenue without data~~
- ~~AI-predicted churn dates~~
- ~~Estimated future performance~~
- ~~Fake urgency or scarcity~~

---

## Usage Examples

### Get Daily Briefing

```typescript
const response = await fetch('/api/director/insights?type=briefing');
const { data: briefing } = await response.json();

console.log('Clients at risk:', briefing.clients_at_risk);
console.log('Action items:', briefing.action_items);
```

### Get Client Insights

```typescript
const response = await fetch(
  `/api/director/insights?type=client&client_id=${clientId}`
);
const { data: insights } = await response.json();

const risks = insights.filter(i => i.type === 'risk');
const opportunities = insights.filter(i => i.type === 'opportunity');
```

### Get Critical Alerts

```typescript
const response = await fetch(
  '/api/director/alerts?severity=critical'
);
const { data } = await response.json();

console.log('Critical alerts:', data.alerts.length);
```

---

## Recommended Workflows

### Morning Review (Founder)

1. Open Director dashboard
2. Check critical/high alerts
3. Review action items
4. Schedule interventions for at-risk clients
5. Note opportunities for follow-up

### Weekly Analysis

1. Review risk trends
2. Track opportunity pipeline
3. Calculate revenue at risk
4. Plan upsell/cross-sell activities
5. Select case study candidates

### Client Intervention

1. View client-specific insights
2. Review risk history
3. Check recommended actions
4. Document intervention in alerts API
5. Schedule follow-up monitoring

---

## Future Enhancements

### Phase 61+ Potential

1. **Predictive Analytics** - With sufficient historical data
2. **Automated Interventions** - Trigger workflows from alerts
3. **Custom Alert Rules** - User-defined risk thresholds
4. **Slack/Email Notifications** - Real-time alert delivery
5. **Dashboard Widgets** - Embeddable Director components

---

## Conclusion

Phase 60 delivers a comprehensive AI Agency Director that provides central oversight while respecting truth-layer principles. The Director surfaces real insights from real data, enabling proactive client management without fake metrics or unfounded predictions.

**Remember**: All Director insights are based on actual client behavior and measurements. No speculation, no projections without evidence.

---

*AI Agency Director documentation generated by Phase 60*
