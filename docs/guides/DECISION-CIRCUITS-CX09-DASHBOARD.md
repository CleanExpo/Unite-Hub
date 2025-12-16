# Decision Circuits CX09 Dashboard - Phase 2 Observability

**Version**: v1.7.1
**Release Date**: December 15, 2025
**Phase**: Phase 2 (Observability & Visualization)

## Overview

The CX09 A/B Testing Dashboard provides read-only visualization of A/B test evaluations, variant performance, statistical confidence, and optimization decisions. It's a pure observability tool with **zero mutations** - no traffic changes, no regeneration, no agent calls.

**Key Principle**: All data is fetched server-side with RLS enforcement. Dashboard displays historical evaluation results, not real-time metrics.

---

## Pages & Routes

### 1. A/B Tests List (`/crm/decision-circuits/ab-tests`)

Overview of all A/B tests with status, decision, and key metrics.

**Features**:
- Table of all tests (running, completed, paused, terminated)
- Filter by channel (Email, Social, Multi-channel)
- View test name, variant count, sample size, avg engagement
- Quick link to detailed test view
- 5-minute auto-refresh (cache layer)

**Data Displayed**:
```
├── Test Name (test_name)
├── Channel (email | social | multichannel)
├── Status (running | completed | paused | terminated)
├── Variant Count (count of variants)
├── Total Samples (sum of sample_size across variants)
├── Avg Engagement Rate (engagement_rate average)
└── Started At (timestamp)
```

**Data Source**: `circuit_ab_test_summary` view (RLS-filtered by workspace_id)

### 2. A/B Test Detail (`/crm/decision-circuits/ab-tests/[test_id]`)

Comprehensive view of a single A/B test with variant metrics and evaluation history.

**Sections**:

#### A. Test Summary Cards
- Status badge (running/completed/paused/terminated + decision)
- Channel (Email/Social/Multi)
- Total samples across all variants
- Average engagement rate

#### B. Latest Evaluation
- **Confidence Meter**: Visual progress bar showing confidence score (0-100%)
  - Color coding: 95%+ green, 90%+ blue, 80%+ yellow, <80% red
  - Shows if threshold (95%) is met
- **Performance Delta**: Percentage point difference between winning and runner-up variants
  - Visual indicator: up arrow (positive), right arrow (neutral), down arrow (negative)
- **Decision**: promote | continue_test | terminate
  - Promote: Confidence >= 95% AND performance_delta > 0
  - Continue: Confidence < 95% (need more data)
  - Terminate: performance_delta < 0 (underperforming variant)

#### C. Variant Metrics Table
- Variant ID
- Engagement Rate (%)
- Click-Through Rate (%)
- Sample Size
- Winner badge (🏆 for winning variant)
- Color coding: winner card highlighted in green

#### D. Evaluation History
- Timeline of all evaluations (most recent first)
- For each evaluation:
  - Decision (promote/continue_test/terminate)
  - Confidence score
  - Winning variant ID
  - Performance delta
  - Evaluation timestamp
  - Expandable/collapsible for space efficiency

#### E. Test Timeline
- Visual timeline showing:
  - Test started date/time
  - Evaluation window end date/time (if applicable)
  - Latest evaluation date/time

---

## Components

### ab-test-status.tsx

Reusable UI components for A/B test visualization:

#### TestStatusBadge
```typescript
<TestStatusBadge status="running" decision="promote" />
```
- Status options: running | completed | paused | terminated
- Decision options: promote | continue_test | terminate
- Color-coded badges with icons

#### ConfidenceMeter
```typescript
<ConfidenceMeter score={0.95} threshold={0.95} label="Confidence Score" />
```
- Visual progress bar (0-100%)
- Color-coded based on score
- Shows threshold indicator
- Returns statement showing if threshold is met

#### PerformanceDelta
```typescript
<PerformanceDelta delta={5.2} label="Performance Delta" />
```
- Shows percentage point difference
- Icon indicator (↑ positive, → neutral, ↓ negative)
- Color coding (green for positive, red for negative)

#### VariantComparison
```typescript
<VariantComparison
  variants={[...]}
  winningVariantId="variant_a"
/>
```
- Grid of variant cards
- Engagement rate and CTR for each
- Winner badge on winning variant
- Color highlighting (green for winner)

---

## Service Layer

### dashboard-service.ts Extensions

**New Functions**:

#### getABTests(workspaceId, limit = 50)
Fetches all A/B tests for a workspace (RLS-filtered).

```typescript
const tests = await getABTests('workspace-123', 100);
// Returns: ABTestRecord[]
```

**Returns**:
```typescript
interface ABTestRecord {
  id: string;
  test_id: string;
  test_name: string;
  channel: 'email' | 'social' | 'multichannel';
  status: 'running' | 'paused' | 'completed' | 'terminated';
  variant_count: number;
  total_samples: number;
  avg_engagement_rate: number;
  max_engagement_rate: number;
  started_at: string;
  evaluation_window_end_at?: string;
  latest_decision?: 'promote' | 'continue_test' | 'terminate';
  latest_confidence_score?: number;
  latest_performance_delta?: number;
}
```

#### getABTestDetails(workspaceId, testId)
Fetches comprehensive details for a single A/B test.

```typescript
const details = await getABTestDetails('workspace-123', 'email_subject_v3');
// Returns: { test, variants, evaluations } or null
```

**Returns**:
```typescript
{
  test: ABTestRecord;
  variants: ABTestVariantResult[];
  evaluations: ABTestEvaluation[];
}

interface ABTestVariantResult {
  variant_id: string;
  agent_execution_id: string;
  engagement_rate: number;
  click_through_rate: number;
  sample_size: number;
  evaluated_at: string;
}

interface ABTestEvaluation {
  id: string;
  winning_variant_id: string;
  decision: 'promote' | 'continue_test' | 'terminate';
  confidence_score: number;
  performance_delta: number;
  evaluated_at: string;
  recommendation?: string;
}
```

---

## Data Flow

```
User navigates to /crm/decision-circuits/ab-tests
                        ↓
                  Server Component
                        ↓
           getWorkspaceId() [auth]
                        ↓
          getABTests(workspaceId)
                        ↓
    Supabase Query (RLS filter: workspace_id)
                        ↓
        circuit_ab_test_summary View
                        ↓
    Returns ABTestRecord[] (max 100 records)
                        ↓
            Render List Page
                  ↓
            User clicks test
                  ↓
    getABTestDetails(workspaceId, test_id)
                        ↓
    3 Parallel Supabase Queries:
    - circuit_ab_tests
    - circuit_ab_test_results
    - circuit_ab_test_winners
                        ↓
    Render Detail Page with all metrics
```

---

## Security & Isolation

### RLS Enforcement
All queries filter by `workspace_id` using the `get_current_workspace_id()` RLS function:

```sql
WHERE workspace_id = get_current_workspace_id()
```

This prevents cross-workspace data leakage at the database layer.

### Server-Side Only
- No client-side Supabase access
- No tokens exposed in browser
- All queries executed in Server Components
- User workspace validated before any queries

### Read-Only
- No POST, PUT, DELETE endpoints
- No mutation capability
- No state changes
- Pure observability tool

---

## Visual Design

### Color Scheme
- **Accent (Orange)**: accent-500 (#ff6b35) for interactive elements
- **Success (Green)**: success-500 for positive metrics, winners
- **Error (Red)**: error-500 for failures, terminated variants
- **Warning (Yellow)**: warning-500 for caution states
- **Blue**: info/neutral states
- **Neutral**: bg-card for cards, text-secondary for secondary text

### Components
- Status badges with icons and color coding
- Confidence meters (progress bars)
- Variant comparison cards
- Timeline visualization
- Table layouts for metric data

---

## User Workflows

### View All A/B Tests
1. Navigate to `/crm/decision-circuits`
2. Click "🧪 A/B Tests" card
3. See paginated list of all tests
4. Filter by channel or search
5. Click "View →" to see details

### Analyze Single A/B Test
1. From list page, click test name
2. View test summary cards (status, channel, samples, engagement)
3. Review latest evaluation (confidence, delta, decision)
4. Examine variant metrics side-by-side
5. Review evaluation history for trend analysis
6. Check test timeline for duration context

### Understand Confidence Score
- Visual progress bar shows 0-100% confidence
- Green indicator (95%+) = threshold met, ready to promote
- Yellow indicator (80-95%) = continue testing
- Red indicator (<80%) = need more data
- Tooltip shows exact threshold (default 0.95)

### Track Decision History
- Scroll evaluation history section
- Each card shows decision + confidence + delta
- Newest evaluations at top
- Color coding indicates decision type

---

## Performance & Caching

- **Page Load**: ~500ms (2-3 parallel Supabase queries)
- **RLS Overhead**: Minimal (single index lookup)
- **Caching**: Next.js cache headers set to 5 minutes
- **Refresh**: Manual refresh or 5-minute auto-refresh

---

## Implementation Notes

### Server Components
Both pages are Server Components (no "use client"):
- `page.tsx` files render server-side
- Async data fetching with `await`
- RLS enforced automatically

### Dynamic Route Parameters
Test detail page uses async params pattern:
```typescript
interface PageParams {
  params: Promise<{ test_id: string }>;
}

const { test_id } = await params;
```

### Error Handling
- Graceful fallbacks for missing data
- Error cards displayed (not crashes)
- Partial data rendering (some sections missing if query fails)

---

## What's NOT Included (Phase 3+)

❌ Live real-time metrics
❌ Traffic allocation changes
❌ Automated variant regeneration
❌ Export/download functionality
❌ Webhooks or event streaming
❌ Third-party integrations
❌ Advanced statistical analysis (Bayesian, sequential testing)

---

## Integration with Phase 1

Dashboard reads the evaluation data created by Phase 1 (CX09_A_B_TESTING circuit):
- Test metadata from `circuit_ab_tests`
- Variant results from `circuit_ab_test_results`
- Winner decisions from `circuit_ab_test_winners`
- All RLS-protected at database layer

Phase 1 writes → Phase 2 reads (unidirectional, safe)

---

## File Structure

```
src/
├── lib/decision-circuits/
│   └── dashboard-service.ts      (Updated with A/B test functions)
├── components/decision-circuits/
│   └── ab-test-status.tsx        (New components)
└── app/crm/decision-circuits/
    ├── page.tsx                  (Updated with A/B tests link)
    ├── ab-tests/
    │   ├── page.tsx             (List page)
    │   └── [test_id]/
    │       └── page.tsx         (Detail page)
```

---

## Troubleshooting

**Q: A/B tests not showing up?**
A: Ensure circuit_ab_tests records exist with correct workspace_id and RLS is enabled.

**Q: Confidence score shows 0%?**
A: Check that circuit_ab_test_winners records are populated with confidence_score values.

**Q: Detail page shows "not found"?**
A: Verify test_id exists in circuit_ab_tests table for the workspace.

**Q: Variants not displaying metrics?**
A: Ensure circuit_ab_test_results records exist for the test with engagement_rate and click_through_rate populated.

---

*Documentation for CX09 A/B Testing Dashboard (Phase 2 Observability) - December 15, 2025*
