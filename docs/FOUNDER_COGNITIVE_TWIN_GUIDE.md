# Founder Cognitive Twin Guide

## Overview

The **Founder Cognitive Twin Engine** is an AI-powered business intelligence system that acts as your "digital twin" - constantly analyzing your business data to provide insights, forecasts, and recommendations. It helps founders make better decisions by consolidating data from all business domains into actionable intelligence.

## Key Features

### 1. Business Momentum Scoring (7 Domains)

Track momentum across all critical business areas:

| Domain | What It Measures | Key Signals |
|--------|-----------------|-------------|
| **Marketing** | Content performance, engagement rates | Social metrics, email open rates, campaign ROI |
| **Sales** | Pipeline velocity, conversion rates | Deal win rates, lead scoring, response times |
| **Delivery** | Project completion, client satisfaction | On-time delivery, quality scores, feedback |
| **Product** | Feature adoption, user feedback | Usage analytics, NPS scores, bug rates |
| **Clients** | Relationship health, retention | Communication frequency, sentiment, churn risk |
| **Engineering** | Code quality, technical debt | Deployment frequency, bug counts, tech debt |
| **Finance** | Cash flow, profitability | Revenue trends, expense ratios, runway |

### 2. Cross-Client Pattern Detection

AI-powered analysis that identifies patterns across your client base:

- **Communication Patterns**: Response time trends, engagement cycles
- **Buying Signals**: Interest indicators, budget timing
- **Churn Risks**: Declining engagement, sentiment drops
- **Opportunities**: Upsell potential, referral likelihood
- **Seasonal Trends**: Industry-specific timing patterns

### 3. Strategic Forecasting

Generate forecasts for three horizons:

- **6-Week Forecast**: Tactical planning, immediate resource allocation
- **12-Week Forecast**: Quarterly planning, capacity planning
- **1-Year Forecast**: Strategic planning, investment decisions

Each forecast includes:
- **Baseline Scenario**: Expected outcome with current trajectory
- **Optimistic Scenario**: Best-case with key assumptions
- **Pessimistic Scenario**: Risk-adjusted conservative view
- **Key Assumptions**: Factors that drive each scenario
- **AI Insights**: Opportunities and risks identified

### 4. Shadow Founder Decision Simulator

Test strategic decisions before committing:

**Supported Scenario Types:**
- Pricing changes
- New product/service launches
- Hiring decisions
- Marketing campaigns
- Partnership evaluations
- Market expansion
- Cost reduction initiatives

**Outputs:**
- Simulated outcomes (best/expected/worst case)
- Probability-weighted projections
- Revenue impact estimates
- Timeline to realize outcomes
- Key benefits and risks

### 5. Weekly Founder Digest

Automated weekly business summaries including:

- **Executive Summary**: AI-generated week overview
- **Wins**: What went well this week
- **Risks**: Issues requiring attention
- **Opportunities**: New possibilities identified
- **Recommendations**: Prioritized action items
- **Momentum Snapshot**: 7-domain score comparison
- **Key Metrics**: Week-over-week comparisons

### 6. Next Action Recommender

Real-time "What should I focus on next?" guidance:

- **Priority Ranking**: Actions sorted by urgency and impact
- **Reasoning**: Why each action is recommended
- **Effort Estimates**: Time required for each action
- **Linked Context**: Related opportunities, risks, or contacts

### 7. Overload Detection

Protects founder wellbeing by monitoring:

- **Active Tasks**: Open items count
- **Response Backlog**: Unanswered communications
- **Meeting Load**: Calendar density
- **Decision Fatigue**: Pending decisions count
- **Revenue Pressure**: Cash flow stress indicators

## API Endpoints

### Memory Management

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/founder/memory/snapshot` | POST | Create new memory snapshot |
| `/api/founder/memory/snapshot` | GET | Fetch latest/specific snapshot |

### Momentum & Patterns

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/founder/memory/momentum` | GET | Get momentum scores (with optional history) |
| `/api/founder/memory/patterns` | GET | Get cross-client patterns |

### Opportunities & Risks

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/founder/memory/opportunities` | GET | List opportunity backlog |
| `/api/founder/memory/opportunities` | PATCH | Update opportunity status |
| `/api/founder/memory/risks` | GET | List risk register |
| `/api/founder/memory/risks` | PATCH | Update risk mitigation |

### Forecasting

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/founder/memory/forecast` | POST | Generate new forecast |
| `/api/founder/memory/forecast` | GET | Fetch existing forecasts |

### Decision Simulation

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/founder/memory/decision-scenarios` | GET | List all scenarios |
| `/api/founder/memory/decision-scenarios` | POST | Create new simulation |
| `/api/founder/memory/decision-scenarios/[id]` | GET | Get specific scenario |
| `/api/founder/memory/decision-scenarios/[id]` | PATCH | Update scenario/record outcome |

### Digests & Actions

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/founder/memory/weekly-digest` | POST | Generate weekly digest |
| `/api/founder/memory/weekly-digest` | GET | Fetch digest history |
| `/api/founder/memory/next-actions` | GET | Get recommended actions |
| `/api/founder/memory/next-actions` | POST | Generate fresh recommendations |
| `/api/founder/memory/overload` | GET | Get overload analysis |
| `/api/founder/memory/overload` | POST | Run fresh overload detection |

## Orchestrator Intents

The Cognitive Twin integrates with the orchestrator via these intents:

1. **`analyze_founder_memory`** - "Show me my business overview"
2. **`forecast_founder_outcomes`** - "Project my revenue for next quarter"
3. **`suggest_founder_next_actions`** - "What should I focus on today?"
4. **`simulate_decision_scenarios`** - "What if I raise prices by 20%?"
5. **`generate_founder_weekly_digest`** - "Generate my weekly digest"

## Dashboard Pages

### Main Cognitive Twin Dashboard
`/founder/cognitive-twin`

Overview showing:
- Overall momentum radar chart
- 7-domain score breakdown
- Top opportunities and risks
- Cross-client patterns
- Next action recommendations
- Quick access to other features

### Weekly Digest
`/founder/cognitive-twin/weekly-digest`

Historical weekly digests with:
- Executive summaries
- Wins/risks/opportunities
- Momentum snapshots
- Key metrics comparison
- Week navigation

### Decision Simulator
`/founder/cognitive-twin/decision-scenarios`

Scenario management including:
- Create new simulations
- View past decisions
- Record actual outcomes
- Learn from decision accuracy

## Best Practices

### 1. Regular Snapshots
Generate memory snapshots at least weekly to maintain accurate momentum tracking.

### 2. Review Weekly Digests
Make time each Monday to review your digest and act on recommendations.

### 3. Validate Forecasts
Compare forecasts to actual outcomes to improve prediction accuracy over time.

### 4. Record Decision Outcomes
After executing a simulated decision, record the actual outcome to improve future simulations.

### 5. Monitor Overload
Pay attention to overload warnings - they indicate when to delegate or defer.

## Data Privacy

- All data is workspace-scoped with RLS policies
- Only founders/admins can access cognitive twin features
- Snapshots are stored securely with timestamps
- No data is shared across workspaces

## Cost Considerations

The Cognitive Twin uses AI for:
- Pattern extraction (Claude Haiku - cost-effective)
- Summary generation (Claude Sonnet)
- Decision simulation (Claude Sonnet with Extended Thinking)
- Digest generation (Claude Sonnet)

Typical monthly cost per active workspace: $5-15 depending on usage.
