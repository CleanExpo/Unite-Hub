# Synthex Autonomous Growth Ops - Phases D19-D21

**Version**: 1.0.0
**Last Updated**: 2025-12-07
**Status**: Production Ready

---

## Overview

Phases D19-D21 complete the Synthex D-Series (Autonomous Growth Ops) with three interconnected engines that provide intelligent lead lifecycle management, revenue optimization, and behavior-based audience segmentation.

| Phase | Component | Purpose |
|-------|-----------|---------|
| D19 | Lead State Machine Engine | Intelligent lead lifecycle management with AI predictions |
| D20 | Multi-Channel Revenue Routing Engine | Revenue attribution and channel optimization |
| D21 | Behaviour-Based Dynamic Segmentation | AI-powered audience segmentation with real-time updates |

---

## Phase D19: Lead State Machine Engine

### Purpose

Manages the complete lifecycle of leads through configurable states with AI-powered transition predictions and automation triggers.

### Database Schema

**Migration**: `supabase/migrations/448_synthex_lead_state_machine.sql`

| Table | Purpose |
|-------|---------|
| `synthex_library_lead_states` | Defines valid states (new, contacted, qualified, proposal, negotiation, won, lost, dormant) |
| `synthex_library_lead_transitions` | Configures allowed state-to-state transitions |
| `synthex_library_lead_state_history` | Audit trail of all state changes |
| `synthex_library_lead_state_predictions` | AI predictions for likely next states |
| `synthex_library_lead_state_automations` | Automation rules triggered on state changes |
| `synthex_library_lead_state_metrics` | Performance metrics by state |

### Service Layer

**File**: `src/lib/synthex/leadStateMachineService.ts`

#### Key Functions

```typescript
// State Management
listStates(tenantId: string): Promise<LeadState[]>
createState(tenantId: string, state: CreateStateInput): Promise<LeadState>
updateState(stateId: string, updates: Partial<LeadState>): Promise<LeadState>
deleteState(stateId: string): Promise<void>

// Transitions
listTransitions(tenantId: string): Promise<LeadTransition[]>
createTransition(tenantId: string, transition: CreateTransitionInput): Promise<LeadTransition>
executeTransition(tenantId: string, transitionId: string, leadId: string, options?: TransitionOptions): Promise<LeadStateHistoryEntry>
getTransitionHistory(tenantId: string, leadId: string): Promise<LeadStateHistoryEntry[]>

// AI Predictions
predictNextState(tenantId: string, leadId: string): Promise<LeadStatePrediction>
listPredictions(tenantId: string, leadId: string): Promise<LeadStatePrediction[]>

// Automations
listAutomations(tenantId: string): Promise<LeadStateAutomation[]>
createAutomation(tenantId: string, automation: CreateAutomationInput): Promise<LeadStateAutomation>
executeAutomation(automationId: string, leadId: string): Promise<void>

// Metrics
getStateMetrics(tenantId: string): Promise<LeadStateMetrics[]>
getLeadStats(tenantId: string): Promise<LeadStats>
```

### API Routes

**File**: `src/app/api/synthex/leads/state/route.ts`

| Method | Type | Description |
|--------|------|-------------|
| GET | `stats` | Lead state statistics overview |
| GET | `states` | List all configured states |
| GET | `transitions` | List allowed transitions |
| GET | `history` | State change history for a lead |
| GET | `predictions` | AI predictions for a lead |
| GET | `automations` | List automation rules |
| GET | `metrics` | State performance metrics |
| POST | `create_state` | Create a new state |
| POST | `update_state` | Update state configuration |
| POST | `delete_state` | Delete a state |
| POST | `create_transition` | Create transition rule |
| POST | `execute_transition` | Move lead to new state |
| POST | `predict` | Generate AI prediction |
| POST | `create_automation` | Create automation rule |

### UI Component

**File**: `src/components/synthex/leads/LeadStateTimeline.tsx`

Features:
- Visual state timeline with color-coded states
- Current state indicator
- State change form with notes
- AI prediction display with confidence scores
- Automation trigger history
- Bulk state change support

### Default States

| State | Color | Position | Description |
|-------|-------|----------|-------------|
| new | gray | 1 | Newly captured lead |
| contacted | blue | 2 | Initial outreach made |
| qualified | green | 3 | Meets qualification criteria |
| proposal | yellow | 4 | Proposal sent |
| negotiation | orange | 5 | In active negotiation |
| won | emerald | 6 | Deal closed successfully |
| lost | red | 7 | Deal lost |
| dormant | slate | 8 | Inactive/unresponsive |

---

## Phase D20: Multi-Channel Revenue Routing Engine

### Purpose

Tracks revenue across channels, provides multi-touch attribution, and optimizes routing based on performance data and AI predictions.

### Database Schema

**Migration**: `supabase/migrations/449_synthex_revenue_routing.sql`

| Table | Purpose |
|-------|---------|
| `synthex_library_revenue_events` | Individual revenue transactions |
| `synthex_library_revenue_routing` | Routing rules with conditions |
| `synthex_library_channel_performance` | Aggregated channel metrics |
| `synthex_library_attribution_paths` | Multi-touch attribution tracking |
| `synthex_library_revenue_forecasts` | AI-generated forecasts |
| `synthex_library_revenue_alerts` | Threshold-based alerts |

### Service Layer

**File**: `src/lib/synthex/revenueRoutingService.ts`

#### Key Functions

```typescript
// Revenue Events
recordRevenueEvent(tenantId: string, event: CreateRevenueEventInput): Promise<RevenueEvent>
listRevenueEvents(tenantId: string, filters?: RevenueEventFilters): Promise<RevenueEvent[]>
getRevenueEvent(tenantId: string, eventId: string): Promise<RevenueEvent | null>

// Routing Rules
createRoutingRule(tenantId: string, rule: CreateRoutingRuleInput): Promise<RoutingRule>
listRoutingRules(tenantId: string): Promise<RoutingRule[]>
updateRoutingRule(ruleId: string, updates: Partial<RoutingRule>): Promise<RoutingRule>
deleteRoutingRule(ruleId: string): Promise<void>
applyRoutingRules(tenantId: string, context: RoutingContext): Promise<AppliedRoute>

// Channel Performance
getChannelPerformance(tenantId: string, filters?: ChannelFilters): Promise<ChannelPerformance[]>
calculateChannelPerformance(tenantId: string, channelId: string): Promise<ChannelPerformance>

// Attribution
getAttributionPaths(tenantId: string, filters?: AttributionFilters): Promise<AttributionPath[]>
analyzeAttributionPath(tenantId: string, pathId: string): Promise<AttributionAnalysis>
calculateAttribution(events: TouchPoint[], model: AttributionModel): AttributionResult

// Forecasting
generateRevenueForecast(tenantId: string, options: ForecastOptions): Promise<RevenueForecast>
listForecasts(tenantId: string, channelId?: string): Promise<RevenueForecast[]>

// Alerts
createRevenueAlert(tenantId: string, alert: CreateAlertInput): Promise<RevenueAlert>
listRevenueAlerts(tenantId: string): Promise<RevenueAlert[]>
acknowledgeAlert(alertId: string): Promise<RevenueAlert>
resolveAlert(alertId: string, resolution: string): Promise<RevenueAlert>

// Statistics
getRevenueStats(tenantId: string): Promise<RevenueStats>
```

### Attribution Models

| Model | Description |
|-------|-------------|
| `first_touch` | 100% credit to first touchpoint |
| `last_touch` | 100% credit to last touchpoint |
| `linear` | Equal credit to all touchpoints |
| `time_decay` | More credit to recent touchpoints |
| `position_based` | 40% first, 40% last, 20% middle |

### API Routes

**File**: `src/app/api/synthex/revenue/route.ts`

| Method | Type | Description |
|--------|------|-------------|
| GET | `stats` | Revenue overview statistics |
| GET | `events` | List revenue events |
| GET | `event` | Get single event details |
| GET | `rules` | List routing rules |
| GET | `channels` | Channel performance data |
| GET | `paths` | Attribution paths |
| GET | `forecasts` | Revenue forecasts |
| GET | `alerts` | Revenue alerts |
| POST | `record_event` | Record new revenue |
| POST | `create_rule` | Create routing rule |
| POST | `update_rule` | Update routing rule |
| POST | `delete_rule` | Delete routing rule |
| POST | `calculate_channel_performance` | Recalculate channel metrics |
| POST | `analyze_path` | Analyze attribution path |
| POST | `generate_forecast` | Generate AI forecast |
| POST | `create_alert` | Create threshold alert |
| POST | `acknowledge_alert` | Mark alert as seen |
| POST | `resolve_alert` | Resolve alert with notes |

### UI Component

**File**: `src/components/synthex/revenue/RevenueRoutingDashboard.tsx`

Features:
- Revenue stats overview (total, average, conversion rate)
- Channel performance breakdown with ROAS
- Top products by revenue
- Routing rules management
- Attribution path visualization
- Forecast display with confidence intervals
- Alert management panel

---

## Phase D21: Behaviour-Based Dynamic Segmentation Engine

### Purpose

Creates and manages dynamic audience segments based on behavioral criteria, with AI-powered refinement and automatic membership updates.

### Database Schema

**Migration**: `supabase/migrations/450_synthex_dynamic_segmentation.sql`

| Table | Purpose |
|-------|---------|
| `synthex_library_dynamic_segments` | Segment definitions with criteria |
| `synthex_library_segment_membership` | Contact-to-segment relationships |
| `synthex_library_segment_rules` | Reusable rule templates |
| `synthex_library_segment_snapshots` | Point-in-time segment captures |
| `synthex_library_segment_overlaps` | Segment intersection analysis |
| `synthex_library_segment_campaigns` | Campaign targeting associations |

### Service Layer

**File**: `src/lib/synthex/dynamicSegmentationService.ts`

#### Key Functions

```typescript
// Segment Management
createSegment(tenantId: string, segment: CreateSegmentInput, userId: string): Promise<DynamicSegment>
getSegment(tenantId: string, segmentId: string): Promise<DynamicSegment | null>
listSegments(tenantId: string, filters?: SegmentFilters): Promise<DynamicSegment[]>
updateSegment(segmentId: string, updates: Partial<DynamicSegment>): Promise<DynamicSegment>
deleteSegment(segmentId: string): Promise<void>
archiveSegment(segmentId: string): Promise<DynamicSegment>

// Membership
addMember(tenantId: string, segmentId: string, member: AddMemberInput): Promise<SegmentMembership>
removeMember(segmentId: string, options: RemoveMemberOptions): Promise<SegmentMembership>
listMembers(tenantId: string, segmentId: string, filters?: MemberFilters): Promise<SegmentMembership[]>
getMemberSegments(tenantId: string, options: MemberOptions): Promise<DynamicSegment[]>

// Evaluation
evaluateEntity(tenantId: string, segmentId: string, entity: EntityData): Promise<EvaluationResult>
refreshSegment(tenantId: string, segmentId: string): Promise<RefreshResult>

// Rules
listRules(tenantId: string, filters?: RuleFilters): Promise<SegmentRule[]>
createRule(tenantId: string, rule: CreateRuleInput): Promise<SegmentRule>

// Snapshots
createSnapshot(tenantId: string, segmentId: string, type: SnapshotType): Promise<SegmentSnapshot>
getSnapshots(tenantId: string, segmentId: string, limit?: number): Promise<SegmentSnapshot[]>

// Analysis
calculateOverlap(tenantId: string, segmentAId: string, segmentBId: string): Promise<SegmentOverlap>
getSegmentStats(tenantId: string): Promise<SegmentStats>
```

### Segment Types

| Type | Description |
|------|-------------|
| `behavioral` | Based on user actions and engagement |
| `demographic` | Based on user attributes |
| `engagement` | Based on interaction patterns |
| `value` | Based on revenue/score thresholds |
| `lifecycle` | Based on customer journey stage |
| `predictive` | AI-predicted segments |

### Criteria Operators

| Operator | Description | Example |
|----------|-------------|---------|
| `equals` | Exact match | `status = 'active'` |
| `not_equals` | Not matching | `status != 'churned'` |
| `greater_than` | Numeric comparison | `score > 80` |
| `less_than` | Numeric comparison | `score < 20` |
| `greater_than_or_equals` | Inclusive comparison | `purchases >= 5` |
| `less_than_or_equals` | Inclusive comparison | `days_inactive <= 30` |
| `contains` | String search | `email contains '@gmail'` |
| `not_contains` | String exclusion | `tags not contains 'test'` |
| `in` | List membership | `plan in ['pro', 'enterprise']` |
| `not_in` | List exclusion | `source not in ['spam', 'test']` |
| `is_null` | Null check | `phone is null` |
| `is_not_null` | Not null check | `email is not null` |
| `between` | Range check | `age between 25, 45` |
| `regex` | Pattern match | `domain regex '^.*\.edu$'` |

### API Routes

**File**: `src/app/api/synthex/segments/route.ts`

| Method | Type | Description |
|--------|------|-------------|
| GET | `stats` | Segment statistics overview |
| GET | `list` | List all segments with filters |
| GET | `segment` | Get single segment details |
| GET | `members` | List segment members |
| GET | `member_segments` | Get segments for a member |
| GET | `rules` | List rule templates |
| GET | `snapshots` | Get segment snapshots |
| GET | `audience` | Legacy B10 audience segments |
| POST | `create_segment` | Create new segment |
| POST | `update_segment` | Update segment |
| POST | `delete_segment` | Delete segment |
| POST | `archive_segment` | Archive segment |
| POST | `add_member` | Add member to segment |
| POST | `remove_member` | Remove member from segment |
| POST | `evaluate` | Evaluate entity against criteria |
| POST | `refresh` | Refresh segment membership |
| POST | `create_rule` | Create rule template |
| POST | `create_snapshot` | Create point-in-time snapshot |
| POST | `calculate_overlap` | Calculate segment overlap |

### UI Component

**File**: `src/components/synthex/segments/DynamicSegmentsDashboard.tsx`

Features:
- Segment grid with stats (members, active status)
- Search and filter capabilities
- Segment type badges with colors
- Expandable segment details with criteria display
- Rule template library
- Segment analytics tab
- Member management
- Bulk actions (archive, refresh, export)

### Default Rule Templates

| Rule | Category | Field | Operator | Description |
|------|----------|-------|----------|-------------|
| High Score | engagement | ai_score | greater_than | Score above 80 |
| Recent Activity | behavioral | last_interaction_at | greater_than | Active in last 7 days |
| Email Verified | demographic | email_verified | equals | Has verified email |
| Multiple Purchases | value | purchase_count | greater_than | More than 3 purchases |
| New Lead | lifecycle | status | equals | Status is 'new' |

---

## Integration Patterns

### Cross-Phase Data Flow

```
Lead Capture
    │
    ▼
D19: Lead State Machine
    │ ──────► State changes trigger D21 segment updates
    │ ──────► Won states create D20 revenue events
    ▼
D20: Revenue Routing
    │ ──────► Attribution updates D21 value segments
    │ ──────► Channel performance informs D19 predictions
    ▼
D21: Dynamic Segmentation
    │ ──────► Segment membership affects D19 automations
    │ ──────► High-value segments prioritized in D20 routing
    ▼
Campaign Targeting
```

### AI Model Usage

All phases use `claude-sonnet-4-5-20250514` with lazy Anthropic client and 60-second circuit breaker:

```typescript
// Pattern used across all services
let anthropicClient: Anthropic | null = null;
let clientInitTime = 0;
const CLIENT_TTL_MS = 60000;

function getAnthropicClient(): Anthropic | null {
  if (anthropicClient && Date.now() - clientInitTime < CLIENT_TTL_MS) {
    return anthropicClient;
  }
  if (!process.env.ANTHROPIC_API_KEY) return null;
  anthropicClient = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  clientInitTime = Date.now();
  return anthropicClient;
}
```

### RLS Policies

All tables use tenant isolation with the pattern:

```sql
CREATE POLICY "tenant_isolation" ON table_name
  FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);
```

---

## API Usage Examples

### D19: Execute Lead State Transition

```typescript
// POST /api/synthex/leads/state
const response = await fetch('/api/synthex/leads/state', {
  method: 'POST',
  body: JSON.stringify({
    tenantId: 'tenant-uuid',
    action: 'execute_transition',
    transition_id: 'transition-uuid',
    lead_id: 'lead-uuid',
    notes: 'Qualified after demo call',
    triggeredBy: 'user-uuid'
  })
});
```

### D20: Record Revenue Event

```typescript
// POST /api/synthex/revenue
const response = await fetch('/api/synthex/revenue', {
  method: 'POST',
  body: JSON.stringify({
    tenantId: 'tenant-uuid',
    action: 'record_event',
    event_type: 'purchase',
    amount: 299.99,
    currency: 'AUD',
    channel: 'organic',
    lead_id: 'lead-uuid',
    product_id: 'product-uuid',
    attribution_path: ['google_ads', 'email', 'direct']
  })
});
```

### D21: Create Dynamic Segment

```typescript
// POST /api/synthex/segments
const response = await fetch('/api/synthex/segments', {
  method: 'POST',
  body: JSON.stringify({
    tenantId: 'tenant-uuid',
    action: 'create_segment',
    segment_name: 'High-Value Active Users',
    segment_type: 'value',
    criteria: [
      { field: 'ai_score', operator: 'greater_than', value: 80 },
      { field: 'last_interaction_at', operator: 'greater_than', value: '7 days ago' }
    ],
    criteria_logic: 'AND',
    use_ai_refinement: true,
    auto_refresh: true,
    refresh_interval_hours: 24
  })
});
```

---

## Performance Considerations

### Database Indexes

All tables include indexes for:
- `tenant_id` (required for RLS)
- `created_at` (for time-based queries)
- Foreign keys (for joins)
- Status/type fields (for filtering)

### Caching Strategy

- Channel performance cached for 5 minutes
- Segment membership cached for 1 minute
- Rule templates cached for 1 hour
- AI predictions cached for 15 minutes

### Batch Operations

For bulk updates:
- Use `refreshSegment()` instead of individual evaluations
- Batch revenue events with same attribution path
- Group state transitions by trigger type

---

## Monitoring & Alerts

### D19 Metrics
- Average time in each state
- Transition success rate
- Prediction accuracy
- Automation execution count

### D20 Metrics
- Total revenue by channel
- ROAS by channel
- Attribution path length distribution
- Forecast accuracy

### D21 Metrics
- Segment growth rate
- Member churn rate
- Overlap percentage between segments
- Refresh execution time

---

## Future Enhancements

### Planned for D22+
- Real-time segment streaming updates
- Cross-tenant segment templates
- Advanced ML prediction models
- Revenue anomaly detection
- Segment-based A/B testing
- Automated segment optimization

---

## File Reference

| Phase | Type | Path |
|-------|------|------|
| D19 | Migration | `supabase/migrations/448_synthex_lead_state_machine.sql` |
| D19 | Service | `src/lib/synthex/leadStateMachineService.ts` |
| D19 | API | `src/app/api/synthex/leads/state/route.ts` |
| D19 | Component | `src/components/synthex/leads/LeadStateTimeline.tsx` |
| D20 | Migration | `supabase/migrations/449_synthex_revenue_routing.sql` |
| D20 | Service | `src/lib/synthex/revenueRoutingService.ts` |
| D20 | API | `src/app/api/synthex/revenue/route.ts` |
| D20 | Component | `src/components/synthex/revenue/RevenueRoutingDashboard.tsx` |
| D21 | Migration | `supabase/migrations/450_synthex_dynamic_segmentation.sql` |
| D21 | Service | `src/lib/synthex/dynamicSegmentationService.ts` |
| D21 | API | `src/app/api/synthex/segments/route.ts` |
| D21 | Component | `src/components/synthex/segments/DynamicSegmentsDashboard.tsx` |

---

**Status**: All phases complete and production-ready
