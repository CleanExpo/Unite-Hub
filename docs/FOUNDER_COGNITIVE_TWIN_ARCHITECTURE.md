# Founder Cognitive Twin Architecture

## System Overview

The Founder Cognitive Twin is a modular AI-powered business intelligence system built on Unite-Hub's existing infrastructure.

```
┌─────────────────────────────────────────────────────────────────────┐
│                      FOUNDER COGNITIVE TWIN                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌────────────┐│
│  │   Memory    │  │  Momentum   │  │   Pattern   │  │ Opportunity││
│  │ Aggregation │  │   Scoring   │  │ Extraction  │  │Consolidate ││
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └─────┬──────┘│
│         │                │                │                │       │
│         └────────────────┴────────────────┴────────────────┘       │
│                                   │                                 │
│  ┌─────────────┐  ┌─────────────┐  │  ┌─────────────┐  ┌──────────┐│
│  │    Risk     │  │  Forecast   │◄──┴──►  Decision  │  │  Weekly  ││
│  │  Analysis   │  │   Engine    │       │ Simulator │  │  Digest  ││
│  └──────┬──────┘  └──────┬──────┘       └─────┬─────┘  └────┬─────┘│
│         │                │                    │              │      │
│         └────────────────┴────────────────────┴──────────────┘      │
│                                   │                                 │
│  ┌─────────────┐  ┌─────────────┐  │                               │
│  │  Overload   │  │ Next Action │◄──┘                               │
│  │ Detection   │  │ Recommender │                                   │
│  └─────────────┘  └─────────────┘                                   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

## Database Schema

### Core Tables

```sql
-- Aggregated memory snapshots
founder_memory_snapshots
├── id (UUID, PK)
├── founder_id (UUID, FK -> auth.users)
├── workspace_id (UUID, FK -> workspaces)
├── snapshot_at (TIMESTAMPTZ)
├── time_range_start (TIMESTAMPTZ)
├── time_range_end (TIMESTAMPTZ)
├── summary_json (JSONB)
├── data_sources_included (TEXT[])
├── ai_insight (TEXT)
├── confidence_score (DECIMAL)
└── created_at (TIMESTAMPTZ)

-- Focus area preferences
founder_focus_areas
├── id (UUID, PK)
├── founder_id (UUID, FK)
├── workspace_id (UUID, FK)
├── domain (TEXT) -- marketing|sales|delivery|product|clients|engineering|finance
├── priority_level (INT)
├── custom_kpis (JSONB)
└── notifications_enabled (BOOLEAN)

-- Cross-client patterns
cross_client_patterns
├── id (UUID, PK)
├── founder_id (UUID, FK)
├── workspace_id (UUID, FK)
├── pattern_type (TEXT) -- communication|buying_signal|churn_risk|etc
├── title (TEXT)
├── description (TEXT)
├── strength_score (DECIMAL)
├── recurrence_count (INT)
├── affected_client_ids (UUID[])
├── affected_pre_client_ids (UUID[])
├── evidence_json (JSONB)
├── status (TEXT) -- active|resolved|dismissed
└── timestamps

-- Opportunity backlog
founder_opportunity_backlog
├── id (UUID, PK)
├── founder_id (UUID, FK)
├── workspace_id (UUID, FK)
├── source (TEXT) -- email|pattern|crm|social|manual
├── category (TEXT) -- upsell|cross_sell|new_business|etc
├── title (TEXT)
├── description (TEXT)
├── potential_value (DECIMAL)
├── confidence_score (DECIMAL)
├── urgency_score (INT)
├── linked_contact_ids (UUID[])
├── linked_pre_client_ids (UUID[])
├── suggested_actions_json (JSONB)
├── status (TEXT) -- new|evaluating|pursuing|won|lost|deferred
├── expires_at (TIMESTAMPTZ)
└── timestamps

-- Risk register
founder_risk_register
├── id (UUID, PK)
├── founder_id (UUID, FK)
├── workspace_id (UUID, FK)
├── source_type (TEXT) -- sentiment|activity|campaign|manual
├── category (TEXT) -- client_churn|revenue_decline|delivery_delay|etc
├── title (TEXT)
├── description (TEXT)
├── severity_score (INT)
├── likelihood_score (INT)
├── risk_score (COMPUTED) -- severity * likelihood / 100
├── linked_contact_ids (UUID[])
├── mitigation_status (TEXT) -- unaddressed|monitoring|in_progress|mitigated|accepted
├── mitigation_plan_json (JSONB)
├── review_due_at (TIMESTAMPTZ)
└── timestamps

-- Momentum scores
founder_momentum_scores
├── id (UUID, PK)
├── founder_id (UUID, FK)
├── workspace_id (UUID, FK)
├── period_start (TIMESTAMPTZ)
├── period_end (TIMESTAMPTZ)
├── marketing_score (INT)
├── marketing_trend (TEXT) -- up|down|stable
├── sales_score (INT)
├── sales_trend (TEXT)
├── delivery_score (INT)
├── delivery_trend (TEXT)
├── product_score (INT)
├── product_trend (TEXT)
├── clients_score (INT)
├── clients_trend (TEXT)
├── engineering_score (INT)
├── engineering_trend (TEXT)
├── finance_score (INT)
├── finance_trend (TEXT)
├── overall_score (COMPUTED)
├── notes_json (JSONB)
└── created_at

-- Decision scenarios (Shadow Founder)
founder_decision_scenarios
├── id (UUID, PK)
├── founder_id (UUID, FK)
├── workspace_id (UUID, FK)
├── scenario_type (TEXT)
├── title (TEXT)
├── description (TEXT)
├── assumptions_json (JSONB)
├── simulated_outcomes_json (JSONB)
├── ai_recommendation (TEXT)
├── confidence_score (DECIMAL)
├── status (TEXT) -- draft|simulated|decided|executed|reviewed
├── decided_at (TIMESTAMPTZ)
├── actual_outcome_json (JSONB)
└── timestamps

-- Weekly digests
founder_weekly_digests
├── id (UUID, PK)
├── founder_id (UUID, FK)
├── workspace_id (UUID, FK)
├── week_start (DATE)
├── week_end (DATE)
├── executive_summary (TEXT)
├── wins_json (JSONB)
├── risks_json (JSONB)
├── opportunities_json (JSONB)
├── recommendations_json (JSONB)
├── momentum_snapshot_json (JSONB)
├── patterns_summary_json (JSONB)
├── key_metrics_json (JSONB)
├── generated_at (TIMESTAMPTZ)
└── sent_at (TIMESTAMPTZ)

-- Next actions
founder_next_actions
├── id (UUID, PK)
├── founder_id (UUID, FK)
├── workspace_id (UUID, FK)
├── category (TEXT)
├── urgency (TEXT) -- immediate|today|this_week|next_week|this_month
├── title (TEXT)
├── description (TEXT)
├── reasoning (TEXT)
├── estimated_impact (TEXT) -- high|medium|low
├── estimated_effort (TEXT) -- minimal|low|medium|high
├── linked_opportunity_id (UUID, FK)
├── linked_risk_id (UUID, FK)
├── linked_contact_ids (UUID[])
├── linked_pre_client_ids (UUID[])
├── suggested_due_date (TIMESTAMPTZ)
├── status (TEXT) -- pending|in_progress|completed|dismissed
└── timestamps
```

## Service Architecture

### Service Dependencies

```
founderMemoryAggregationService
├── Supabase (data queries)
├── Claude AI (insight generation)
└── Data sources: contacts, emails, pre_clients, campaigns

patternExtractionService
├── Supabase (pattern storage)
├── Claude AI (pattern detection)
└── Dependencies: contacts, pre_clients, emails

momentumScoringService
├── Supabase (score storage)
├── Data aggregation from all domains
└── Trend calculation algorithms

opportunityConsolidationService
├── Supabase (opportunity storage)
├── Claude AI (opportunity scoring)
└── Sources: email analysis, patterns, CRM

riskAnalysisService
├── Supabase (risk storage)
├── Claude AI (risk assessment)
└── Sources: sentiment, activity, campaigns

forecastEngineService
├── Supabase (forecast storage)
├── Claude AI (scenario generation)
└── Historical data analysis

decisionSimulatorService
├── Supabase (scenario storage)
├── Claude AI with Extended Thinking
└── Business context aggregation

overloadDetectionService
├── Supabase (metrics queries)
├── Threshold-based analysis
└── Recommendation engine

nextActionRecommenderService
├── Supabase (action storage)
├── Claude AI (prioritization)
└── Dependencies: opportunities, risks, patterns

weeklyDigestService
├── All other services
├── Claude AI (summary generation)
└── Email delivery (optional)
```

### AI Model Usage

| Service | Model | Token Budget | Use Case |
|---------|-------|--------------|----------|
| Pattern Extraction | Haiku 4.5 | 1,000-2,000 | Quick pattern detection |
| Opportunity Scoring | Sonnet 4.5 | 2,000-3,000 | Quality scoring |
| Risk Assessment | Sonnet 4.5 | 2,000-3,000 | Risk evaluation |
| Forecast Generation | Sonnet 4.5 | 3,000-5,000 | Scenario modeling |
| Decision Simulation | Opus 4.5 (Extended) | 5,000-10,000 | Complex analysis |
| Weekly Digest | Sonnet 4.5 | 3,000-4,000 | Summary generation |
| Next Actions | Sonnet 4.5 | 2,000-3,000 | Prioritization |

## Data Flow

### Snapshot Creation Flow

```
1. User triggers snapshot (manual or scheduled)
                    │
2. ┌────────────────▼────────────────┐
   │ Query CRM contacts (workspace)  │
   │ Query pre-clients               │
   │ Query email threads             │
   │ Query campaign metrics          │
   │ Query social engagement         │
   └────────────────┬────────────────┘
                    │
3. ┌────────────────▼────────────────┐
   │ Aggregate into structured data  │
   │ Calculate summary statistics    │
   │ Identify data gaps              │
   └────────────────┬────────────────┘
                    │
4. ┌────────────────▼────────────────┐
   │ Send to Claude for AI insight   │
   │ Generate executive summary      │
   │ Calculate confidence score      │
   └────────────────┬────────────────┘
                    │
5. ┌────────────────▼────────────────┐
   │ Store snapshot in database      │
   │ Trigger dependent processes     │
   │ (patterns, momentum, risks)     │
   └─────────────────────────────────┘
```

### Momentum Scoring Flow

```
1. Triggered weekly (or on-demand)
                    │
2. ┌────────────────▼────────────────┐
   │ For each domain:                │
   │ - Gather relevant metrics       │
   │ - Compare to previous period    │
   │ - Calculate score (0-100)       │
   │ - Determine trend direction     │
   └────────────────┬────────────────┘
                    │
3. ┌────────────────▼────────────────┐
   │ Marketing: campaign ROI, open   │
   │ Sales: conversion, pipeline     │
   │ Delivery: completion, feedback  │
   │ Product: adoption, NPS          │
   │ Clients: sentiment, retention   │
   │ Engineering: deploy freq, bugs  │
   │ Finance: revenue, runway        │
   └────────────────┬────────────────┘
                    │
4. ┌────────────────▼────────────────┐
   │ Calculate overall score         │
   │ Store with timestamp            │
   │ Update historical series        │
   └─────────────────────────────────┘
```

### Decision Simulation Flow

```
1. User creates scenario
   │
   ├── Type: pricing_change
   ├── Title: "Increase prices 15%"
   ├── Assumptions: {churnRate, timeline}
   │
2. ┌────────────────▼────────────────┐
   │ Gather business context:        │
   │ - Current client base           │
   │ - Historical churn rates        │
   │ - Revenue distribution          │
   │ - Competitive landscape         │
   └────────────────┬────────────────┘
                    │
3. ┌────────────────▼────────────────┐
   │ Claude Extended Thinking:       │
   │ - Model best case scenario      │
   │ - Model expected scenario       │
   │ - Model worst case scenario     │
   │ - Assign probabilities          │
   │ - Identify key risks/benefits   │
   └────────────────┬────────────────┘
                    │
4. ┌────────────────▼────────────────┐
   │ Generate AI recommendation      │
   │ Calculate confidence score      │
   │ Store scenario with outcomes    │
   └────────────────┬────────────────┘
                    │
5. Later: Record actual outcome
   for model improvement
```

## Security & Access Control

### RLS Policies

All tables use Row Level Security with these patterns:

```sql
-- Founder can see their own data
CREATE POLICY "founder_select_own" ON table_name
FOR SELECT USING (founder_id = auth.uid());

-- Workspace members can view (read-only)
CREATE POLICY "workspace_member_select" ON table_name
FOR SELECT USING (
  workspace_id IN (
    SELECT w.id FROM workspaces w
    JOIN user_organizations uo ON uo.org_id = w.org_id
    WHERE uo.user_id = auth.uid()
    AND uo.role IN ('owner', 'admin')
  )
);

-- Only founder can insert/update/delete
CREATE POLICY "founder_modify" ON table_name
FOR ALL USING (founder_id = auth.uid());
```

### Data Isolation

- All queries are workspace-scoped
- Cross-workspace data access is blocked
- Audit logging for sensitive operations
- No PII in AI model context

## Performance Considerations

### Caching Strategy

- Momentum scores: Cache for 1 hour
- Patterns: Cache for 6 hours
- Forecasts: Cache for 24 hours
- Snapshots: No cache (point-in-time)

### Query Optimization

- Indexes on: founder_id, workspace_id, created_at
- Composite indexes for filtered queries
- JSONB GIN indexes for complex queries
- Materialized views for aggregations

### Background Processing

- Snapshot generation: Bull queue (long-running)
- Pattern extraction: Scheduled job (every 6 hours)
- Momentum calculation: Scheduled job (daily)
- Digest generation: Scheduled job (weekly)

## Integration Points

### Orchestrator Integration

5 intents registered in orchestrator-router.ts:
- `analyze_founder_memory`
- `forecast_founder_outcomes`
- `suggest_founder_next_actions`
- `simulate_decision_scenarios`
- `generate_founder_weekly_digest`

### Existing Services

- Contacts/CRM: Used for client data
- Email Ingestion: Used for communication analysis
- Pre-Client Mapper: Used for prospect insights
- Campaign Service: Used for marketing metrics

### Future Integrations

- Financial integrations (Stripe, QuickBooks)
- Project management (Linear, Jira)
- Calendar integration (Google, Outlook)
- Team chat (Slack, Teams)
