# Guardian Z02: Guided Uplift Planner & Adoption Playbooks

**Status**: ✅ Complete (with 45+ tests, APIs, UI, optional AI helper)
**Scope**: Tenant-scoped uplift plans derived from readiness gaps; 5 canonical adoption playbooks
**Type**: Z-Series (Advisory-only, read-only guidance; no configuration changes)

---

## Overview

Z02 implements a **Guided Uplift Planner** that transforms Guardian readiness assessments into actionable adoption plans. Each tenant receives personalized uplift plans that:

- Map current readiness gaps to specific, prioritized tasks
- Guide maturity progression through canonical playbooks
- Provide AI-optional enrichment for task execution (steps, success criteria, checklists)
- Remain purely advisory—no automatic configuration changes

**Key Features**:
- ✅ 5 canonical playbooks (baseline→operational, operational→mature, mature→network_intelligent, rehearsal, continuous improvement)
- ✅ Deterministic playbook matching (readiness + recommendations)
- ✅ Task deduplication by title
- ✅ Target uplift calculation (move to next maturity band)
- ✅ Optional Claude Sonnet AI enrichment for hints
- ✅ Plan management APIs (GET/POST/PATCH)
- ✅ Task status tracking (todo/in_progress/blocked/done)
- ✅ Privacy-preserving hints (no PII, aggregated metrics only)
- ✅ Dashboard integration with expandable plan view

---

## Architecture

### 1. Canonical Uplift Playbooks

Five immutable playbooks trigger based on readiness and recommendations:

#### **Playbook: Baseline to Operational**
**Trigger**: `guardian.core.rules` score ≤ 50 OR overall score < 40
**Target**: Move from baseline (0-39) to operational (40-59)
**Duration**: 2-3 weeks

**Tasks** (3):
1. **Define core rules for primary services**
   - Create templates for top 3-5 critical metrics
   - Category: core | Priority: critical | Effort: M
   - Hints: `count_target: '5-10 active rules'`, `topics: ['service health', 'error rates', ...]`

2. **Enable alert channels (Slack/email/PagerDuty)**
   - Integrate notification channels
   - Category: core | Priority: high | Effort: S
   - Hints: `channels: ['Slack integration', 'Email alerts', 'PagerDuty escalation']`

3. **Create incident response runbooks**
   - Document runbooks for top 3 rule types
   - Category: core | Priority: high | Effort: M
   - Hints: `runbook_count: '3-5'`, `topics: ['remediation', 'escalation', 'communication']`

#### **Playbook: Operational to Mature**
**Trigger**: `guardian.core.rules` score > 50 AND (`guardian.core.risk` score ≤ 50 OR `guardian.qa.i_series.simulation` score ≤ 50)
**Target**: Move from operational (40-59) to mature (60-79)
**Duration**: 3-4 weeks

**Tasks** (3):
1. **Enable risk engine for incident prioritization**
   - Configure risk weights and thresholds
   - Category: core | Priority: high | Effort: M
   - Hints: `enable_steps: ['Set weights', 'Test scenarios', 'Validate thresholds']`

2. **Add QA simulation and regression testing**
   - Run chaos tests on active rules
   - Category: qa_chaos | Priority: high | Effort: L
   - Hints: `simulation_cadence: 'Weekly'`, `coverage_target: '80%'`

3. **Establish runbook rehearsal schedule**
   - Quarterly runbook validation
   - Category: core | Priority: medium | Effort: M
   - Hints: `frequency: 'Quarterly'`, `team_size: '3-5 people'`

#### **Playbook: Mature to Network Intelligent**
**Trigger**: Operational capabilities solid AND (X-series score ≤ 50 OR `recommendations.network` exists)
**Target**: Move from mature (60-79) to network_intelligent (80-100)
**Duration**: 4-6 weeks

**Tasks** (4):
1. **Enable network telemetry collection**
   - Activate X01 telemetry feeds
   - Category: network_intelligence | Priority: critical | Effort: M
   - Hints: `data_points: ['cohort metrics', 'peer anomalies', 'trend signals']`

2. **Activate anomaly detection engines**
   - Enable X02 baselines and thresholds
   - Category: network_intelligence | Priority: high | Effort: M
   - Hints: `baseline_period: '30 days'`, `sensitivity: 'moderate'`

3. **Enable early-warning signals**
   - Configure X03 pattern hints
   - Category: network_intelligence | Priority: high | Effort: M
   - Hints: `signals: ['trend divergence', 'cohort shift', 'peer anomaly']`

4. **Activate network intelligence console**
   - Set up X04 governance and playbook hints
   - Category: governance | Priority: medium | Effort: M
   - Hints: `features: ['peer comparison', 'trend analysis', 'early warnings']`

#### **Playbook: Playbook Rehearsal & Operationalization**
**Trigger**: Overall score ≥ 40 (applies across maturity levels)
**Target**: Harden existing capabilities through practice
**Duration**: Ongoing (quarterly)

**Tasks** (3):
1. **Conduct playbook rehearsals**
   - Run end-to-end scenarios
   - Category: governance | Priority: medium | Effort: M
   - Hints: `frequency: 'Quarterly'`, `scenarios: ['rule change', 'incident spike', 'anomaly']`

2. **Validate automation workflows**
   - Test rule deployment pipelines
   - Category: core | Priority: medium | Effort: M
   - Hints: `checks: ['rule syntax', 'alert routing', 'incident creation']`

3. **Document lessons learned**
   - Capture incident retrospectives
   - Category: governance | Priority: low | Effort: S
   - Hints: `review_cadence: 'Monthly'`, `topics: ['root causes', 'preventions']`

#### **Playbook: Recommendations & Continuous Improvement**
**Trigger**: Score ≥ 50 OR pending recommendations exist
**Target**: Maximize adoption and address capability gaps
**Duration**: Ongoing (monthly)

**Tasks** (4):
1. **Prioritize and schedule recommendations**
   - Review generated recommendations
   - Category: governance | Priority: high | Effort: S
   - Hints: `review_frequency: 'Weekly'`, `schedule: 'Sprint planning'`

2. **Implement highest-value recommendations**
   - Execute recommended improvements
   - Category: core | Priority: high | Effort: L
   - Hints: `impact_target: 'Top 3 recommendations'`, `timeline: '4-6 weeks'`

3. **Expand Guardian coverage**
   - Add new services, metrics, or domains
   - Category: core | Priority: medium | Effort: L
   - Hints: `expansion_areas: ['new services', 'custom metrics', 'integrations']`

4. **Monitor adoption metrics**
   - Track readiness and recommendation resolution
   - Category: governance | Priority: medium | Effort: M
   - Hints: `metrics: ['coverage increase', 'rule activation rate', 'incident resolution']`

---

### 2. Playbook Matching Logic

#### **Readiness-Driven Matching**

```typescript
function matchPlaybooksForReadiness(
  readinessResults: CapabilityScore[],
  overallScore: number
): GuardianUpliftPlaybook[]
```

**Algorithm**:
1. Extract highest-scoring readiness results (first 5 capabilities)
2. For each capability, check playbook triggers
3. If `capabilityKey` matches AND `score` in `[minScore, maxScore]` range → match
4. Deduplicate playbooks by ID
5. Recommended order: baseline → operational → mature → network_intelligent → continuous

**Example**:
```typescript
// Input
readinessResults = [
  { key: 'guardian.core.rules', score: 35 },
  { key: 'guardian.core.risk', score: 25 },
]
overallScore = 30

// Matches
- baseline-to-operational (core.rules ≤ 50)
- playbook-rehearsal-operationalization (always applicable)
```

#### **Recommendation-Driven Matching**

```typescript
function matchPlaybooksForRecommendations(
  recommendations: Recommendation[]
): GuardianUpliftPlaybook[]
```

**Algorithm**:
1. For each recommendation, check `capabilityKey`
2. If X-series or I-series → match `mature-to-network-intelligent` or related playbook
3. If core capability → match `baseline-to-operational`
4. Deduplicate by playbook ID

**Example**:
```typescript
// Input
recommendations = [
  { capabilityKey: 'guardian.network.x01_telemetry', ... },
  { capabilityKey: 'guardian.network.x02_anomalies', ... },
]

// Matches
- mature-to-network-intelligent
```

---

### 3. Plan Generation

#### **Service: `upliftPlanService.ts`**

**Main Functions**:

```typescript
// Pure: Generate plan draft without persistence
async function generateUpliftPlanDraft(
  tenantId: string,
  options: GuardianUpliftPlanGenerationOptions
): Promise<{ plan: GuardianUpliftPlanDraft; tasks: GuardianUpliftTaskDraft[] }>

// Persist to database with RLS
async function persistGeneratedUpliftPlan(
  tenantId: string,
  planDraft: GuardianUpliftPlanDraft,
  taskDrafts: GuardianUpliftTaskDraft[]
): Promise<{ planId: string }>

// Orchestrator: Generate + persist in single call
async function generateAndPersistUpliftPlanForTenant(
  tenantId: string,
  options: GuardianUpliftPlanGenerationOptions
): Promise<{ planId: string }>
```

**Generation Steps**:
1. Load latest readiness snapshot via `loadLatestReadinessSnapshotForTenant()`
2. Load recent recommendations via `loadRecentRecommendationSummaryForTenant()`
3. Match playbooks using `matchPlaybooksForReadiness()` + `matchPlaybooksForRecommendations()`
4. Aggregate tasks from matched playbooks
5. **Deduplicate by title**: Use `Map<string, UpliftTaskDraft>` to keep first occurrence only
6. Calculate target uplift score via `calculateUpliftTarget(currentScore, overallStatus)`
7. Create plan record with `status: 'draft'`, `source: 'auto_from_readiness'`
8. Insert plan + tasks with RLS enforcement

**Deduplication Example**:
```typescript
const taskMap = new Map<string, GuardianUpliftTaskDraft>();
matchedPlaybooks.forEach(playbook => {
  playbook.tasks.forEach(task => {
    if (!taskMap.has(task.title)) {
      taskMap.set(task.title, task);
    }
    // Subsequent tasks with same title ignored (first occurrence wins)
  });
});
const deduplicatedTasks = Array.from(taskMap.values());
```

**Target Calculation**:
```typescript
function calculateUpliftTarget(currentScore: number): { score: number; status: string } {
  if (currentScore < 40) return { score: 40, status: 'operational' };      // baseline → operational
  if (currentScore < 60) return { score: 60, status: 'mature' };            // operational → mature
  if (currentScore < 80) return { score: 80, status: 'network_intelligent' }; // mature → network_intelligent
  return { score: 100, status: 'network_intelligent' };                     // Already at max
}
```

---

### 4. Database Schema

#### **Table: `guardian_tenant_uplift_plans`**

```sql
CREATE TABLE guardian_tenant_uplift_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES workspaces(id),
  name TEXT NOT NULL,                            -- "Baseline to Operational"
  description TEXT,                              -- Generated plan summary
  status TEXT DEFAULT 'draft',                   -- draft | active | completed | archived
  target_overall_score NUMERIC NOT NULL,         -- e.g., 40, 60, 80, 100
  target_overall_status TEXT NOT NULL,           -- baseline | operational | mature | network_intelligent
  readiness_snapshot_at TIMESTAMPTZ,             -- Timestamp of readiness snapshot used
  source TEXT DEFAULT 'manual',                  -- manual | auto_from_readiness | mixed
  metadata JSONB,                                -- Custom data (AI enrichment flags, etc.)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT plan_status CHECK (status IN ('draft', 'active', 'completed', 'archived'))
);

CREATE INDEX idx_uplift_plans_tenant_created
ON guardian_tenant_uplift_plans(tenant_id, created_at DESC);

CREATE INDEX idx_uplift_plans_tenant_status
ON guardian_tenant_uplift_plans(tenant_id, status);

-- RLS Policy
ALTER TABLE guardian_tenant_uplift_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON guardian_tenant_uplift_plans
FOR ALL USING (tenant_id = get_current_workspace_id());
```

#### **Table: `guardian_tenant_uplift_tasks`**

```sql
CREATE TABLE guardian_tenant_uplift_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES guardian_tenant_uplift_plans(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES workspaces(id),
  capability_key TEXT,                           -- e.g., "guardian.core.rules"
  recommendation_id UUID,                        -- Source recommendation (if any)

  title TEXT NOT NULL,                           -- "Define core rules..."
  description TEXT NOT NULL,                     -- Full task description
  category TEXT DEFAULT 'other',                 -- core | ai_intelligence | qa_chaos | network_intelligence | governance | other
  priority TEXT DEFAULT 'medium',                -- low | medium | high | critical
  status TEXT DEFAULT 'todo',                    -- todo | in_progress | blocked | done

  effort_estimate TEXT,                          -- XS | S | M | L | XL
  due_date DATE,                                 -- Optional target completion
  owner TEXT,                                    -- Optional assignee

  hints JSONB,                                   -- AI-enriched guidance (steps, checklists, etc.)
  metadata JSONB,                                -- Task-specific metadata

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT task_status CHECK (status IN ('todo', 'in_progress', 'blocked', 'done')),
  CONSTRAINT task_category CHECK (category IN ('core', 'ai_intelligence', 'qa_chaos', 'network_intelligence', 'governance', 'other')),
  CONSTRAINT task_priority CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  CONSTRAINT effort_check CHECK (effort_estimate IN ('XS', 'S', 'M', 'L', 'XL'))
);

CREATE INDEX idx_uplift_tasks_plan_status
ON guardian_tenant_uplift_tasks(plan_id, status);

CREATE INDEX idx_uplift_tasks_tenant_priority
ON guardian_tenant_uplift_tasks(tenant_id, priority DESC, status);

-- RLS Policy (via plan's tenant_id)
ALTER TABLE guardian_tenant_uplift_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON guardian_tenant_uplift_tasks
FOR ALL USING (tenant_id = get_current_workspace_id());
```

---

## APIs

### **GET /api/guardian/meta/uplift/plans**

**Purpose**: List uplift plans for current tenant

**Query Parameters**:
- `workspaceId` (required): Tenant identifier
- `status` (optional): Filter by status (draft | active | completed | archived)
- `search` (optional): Search in name/description
- `limit` (optional): Max results (default: 20, max: 100)

**Response**:
```json
{
  "success": true,
  "data": {
    "plans": [
      {
        "id": "plan-uuid",
        "name": "Baseline to Operational",
        "description": "...",
        "status": "draft",
        "targetOverallScore": 40,
        "targetOverallStatus": "operational",
        "readinessSnapshotAt": "2025-12-12T10:00:00Z",
        "source": "auto_from_readiness",
        "createdAt": "2025-12-12T10:01:00Z",
        "updatedAt": "2025-12-12T10:01:00Z"
      }
    ],
    "count": 1
  }
}
```

---

### **POST /api/guardian/meta/uplift/plans**

**Purpose**: Generate new uplift plan for tenant

**Body**:
```json
{
  "nameOverride": "Custom Plan Name (optional)",
  "descriptionOverride": "Custom description (optional)",
  "includeRecommendations": true
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "planId": "new-plan-uuid",
    "message": "Uplift plan generated successfully"
  }
}
```

---

### **GET /api/guardian/meta/uplift/plans/[id]**

**Purpose**: Retrieve single plan with all tasks

**Query Parameters**:
- `workspaceId` (required): Tenant identifier

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "plan-uuid",
    "name": "Baseline to Operational",
    "description": "...",
    "status": "draft",
    "targetOverallScore": 40,
    "targetOverallStatus": "operational",
    "readinessSnapshotAt": "2025-12-12T10:00:00Z",
    "source": "auto_from_readiness",
    "createdAt": "2025-12-12T10:01:00Z",
    "updatedAt": "2025-12-12T10:01:00Z",
    "tasks": [
      {
        "id": "task-uuid",
        "title": "Define core rules for your primary services",
        "description": "...",
        "category": "core",
        "priority": "critical",
        "status": "todo",
        "effortEstimate": "M",
        "dueDate": null,
        "owner": null,
        "capabilityKey": "guardian.core.rules",
        "hints": {
          "count_target": "5-10 active rules",
          "topics": ["service health", "error rates"]
        }
      }
    ]
  }
}
```

---

### **PATCH /api/guardian/meta/uplift/plans/[id]**

**Purpose**: Update plan status or metadata

**Body**:
```json
{
  "status": "active",
  "name": "Updated name (optional)",
  "description": "Updated description (optional)"
}
```

**Validation**:
- Status must be one of: draft, active, completed, archived

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "plan-uuid",
    "status": "active",
    "name": "...",
    "description": "...",
    "updatedAt": "2025-12-12T11:00:00Z"
  }
}
```

---

### **PATCH /api/guardian/meta/uplift/tasks/[id]**

**Purpose**: Update task status, priority, or owner

**Query Parameters**:
- `workspaceId` (required): Tenant identifier

**Body**:
```json
{
  "status": "in_progress",
  "priority": "high",
  "dueDate": "2025-12-25",
  "owner": "john@example.com"
}
```

**Validation**:
- Status: todo | in_progress | blocked | done
- Priority: low | medium | high | critical
- Task must belong to current tenant (via plan)

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "task-uuid",
    "status": "in_progress",
    "priority": "high",
    "dueDate": "2025-12-25",
    "owner": "john@example.com",
    "updatedAt": "2025-12-12T11:00:00Z"
  }
}
```

---

### **POST /api/guardian/meta/uplift/enrich-hints** (Optional AI)

**Purpose**: Enrich task hints with AI-generated guidance

**Body**:
```json
{
  "taskTitle": "Enable network telemetry",
  "taskDescription": "Set up telemetry collection",
  "taskCategory": "network_intelligence",
  "taskPriority": "high",
  "taskEffort": "M",
  "currentScore": 30,
  "targetScore": 60
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "hints": {
      "steps": ["Step 1", "Step 2", "..."],
      "success_criteria": ["Criterion 1", "..."],
      "time_estimate_minutes": 90,
      "resources": ["Resource 1", "..."],
      "common_pitfalls": ["Pitfall 1", "..."],
      "validation_checklist": ["Check 1", "..."]
    },
    "formattedHints": "⏱️ Estimated time: 90 minutes\n...",
    "timestamp": "2025-12-12T11:00:00Z"
  }
}
```

---

## UI Integration

### **Readiness Dashboard Extension**

The readiness dashboard now includes a **"Guided Uplift & Adoption Playbooks"** card that:

- ✅ Lists all uplift plans for the tenant
- ✅ Shows plan status (draft | active | completed | archived)
- ✅ Displays target uplift score and maturity level
- ✅ Expandable task view with status, priority, effort, hints
- ✅ Task status dropdown (todo → in_progress → blocked → done)
- ✅ Generate Plan button (auto-generates from readiness)
- ✅ Refresh Plans button (reload from API)
- ✅ Advisory banner explaining advisory-only nature

**Component Location**: `src/app/guardian/admin/readiness/page.tsx`

**UX Features**:
- Collapsible plan list (expand/collapse by clicking plan header)
- Task cards show title, description, category, priority, effort, status
- Status dropdown triggers immediate API update
- Hints display as truncated preview; full hints via click
- "Generate New Plan" button available always
- Loading states for API calls

---

## AI Helper

### **Optional: `upliftAiHelper.ts`**

**Purpose**: Use Claude Sonnet to enrich uplift task hints with actionable guidance

**Privacy Constraints**:
- No PII in prompts or hints
- Aggregated metrics only (counts, flags, timestamps)
- No raw logs or user-specific data
- Generic instructions, no customer details

**Functions**:

```typescript
// Enrich single task with AI guidance
async function enrichUpliftTaskHints(
  task: GuardianUpliftTaskDraft,
  tenantContext?: { currentScore?: number; targetScore?: number; category?: string }
): Promise<EnrichedUpliftHints>

// Batch enrich multiple tasks
async function enrichMultipleUpliftTasks(
  tasks: (GuardianUpliftTaskDraft & { id?: string })[],
  enableAiHints: boolean = false
): Promise<Map<string, EnrichedUpliftHints>>

// Format enriched hints for display
function formatEnrichedHints(hints: EnrichedUpliftHints): string
```

**Hint Structure**:
```typescript
interface EnrichedUpliftHints {
  steps: string[];                    // 3-6 implementation steps
  success_criteria: string[];         // 2-4 measurable criteria (non-PII)
  time_estimate_minutes: number;      // Realistic duration
  resources: string[];                // Documentation, modules, tools
  common_pitfalls: string[];          // 2-3 common mistakes to avoid
  validation_checklist: string[];     // 3-5 verification steps
}
```

**Example Enriched Hints**:
```json
{
  "steps": [
    "Navigate to Network Settings in Guardian Admin",
    "Enable Telemetry Collection toggle",
    "Select data collection frequency (hourly recommended)",
    "Configure retention policy (30 days minimum)",
    "Run connectivity test",
    "Validate metrics in Network Console"
  ],
  "success_criteria": [
    "Telemetry collection running (green indicator)",
    "Metrics flowing into dashboards",
    "No connectivity errors in logs"
  ],
  "time_estimate_minutes": 45,
  "resources": [
    "Guardian Network Telemetry Guide",
    "X01 Configuration Reference",
    "Sample Telemetry Dashboards"
  ],
  "common_pitfalls": [
    "Forgetting to set retention policy (disk space issues)",
    "Using hourly frequency on high-volume services (performance impact)"
  ],
  "validation_checklist": [
    "☐ Telemetry toggle enabled",
    "☐ Metrics visible in Network Console",
    "☐ No error messages in audit logs",
    "☐ Sample anomaly detection firing correctly"
  ]
}
```

**Feature Flag**:
- Controlled by tenant's `guardian_settings.enable_ai_hints` (optional)
- API gracefully degrades if Claude unavailable
- Default hints provided on timeout/error

---

## Privacy & Security

### **Non-Breaking, Advisory-Only**

- ✅ Plans do NOT modify Guardian configuration
- ✅ Tasks do NOT auto-execute or auto-enable features
- ✅ Tenant remains fully in control of activation
- ✅ Plans visible in admin dashboard only
- ✅ No impact on alerting, incidents, or risk scoring

### **Privacy Guarantees**

- ✅ No PII in hints or task descriptions
- ✅ Aggregated metrics only (counts, flags, timestamps)
- ✅ No raw logs, query results, or user data
- ✅ No external data leakage in AI prompts
- ✅ Links to Guardian modules only (no external URLs with IDs)

### **RLS Enforcement**

- ✅ All plans and tasks RLS-protected by `tenant_id`
- ✅ Get/update operations validate workspace context
- ✅ No cross-tenant data leakage possible
- ✅ Task-level queries verify plan ownership

---

## Testing

**Test File**: `tests/guardian/z02_guided_uplift_planner_and_adoption_playbooks.test.ts`

**Coverage** (45+ tests):
- ✅ Playbook structure validation (IDs, triggers, tasks)
- ✅ Readiness-driven matching (baseline, operational, mature, network_intelligent)
- ✅ Recommendation-driven matching (X-series, I-series)
- ✅ Target score calculation (maturity band progression)
- ✅ Task deduplication by title
- ✅ AI hint enrichment structure and formatting
- ✅ Privacy guardrails (no PII in hints)
- ✅ Advisory-only pattern validation
- ✅ Status/priority/effort enum validation

**Run Tests**:
```bash
npm run test -- z02_guided_uplift_planner
```

---

## Implementation Checklist

- [x] Migration 597: Create `guardian_tenant_uplift_plans` and `guardian_tenant_uplift_tasks` tables
- [x] `upliftPlaybookModel.ts`: 5 canonical playbooks with triggers and tasks
- [x] `upliftPlanService.ts`: Generation, deduplication, and persistence logic
- [x] API: GET/POST plans, GET/PATCH plan details, PATCH task status
- [x] API: POST enrich-hints (optional AI enrichment)
- [x] `upliftAiHelper.ts`: Claude Sonnet enrichment for task hints
- [x] Dashboard: Guided Uplift section in readiness page
- [x] Tests: 45+ comprehensive tests
- [x] Documentation: This guide

---

## Deployment Notes

1. **Apply Migration**: Run migration 597 via Supabase pipeline
2. **Environment**: Ensure `ANTHROPIC_API_KEY` set (for optional AI features)
3. **Feature Flag** (optional): Add `guardian_settings.enable_ai_hints` column if using AI enrichment
4. **Testing**: Run `npm run test` to validate all 45+ tests pass
5. **Dashboard**: Readiness page automatically includes Guided Uplift section
6. **APIs**: All endpoints RLS-protected and ready for production

---

## Future Enhancements

- [ ] Auto-generate plans on readiness snapshot (scheduled job)
- [ ] Email notifications on plan generation/updates
- [ ] Slack integration for plan sharing
- [ ] Team collaboration on task assignments
- [ ] Progress tracking (% completion, velocity metrics)
- [ ] Historical uplift trend analysis
- [ ] Custom playbook creation (tenant-defined)
- [ ] Integration with external project management tools (Jira, Linear)

---

## References

- **Z01**: Guardian Capability Manifest & Readiness Scoring
- **X-Series**: Network Intelligence (telemetry, anomalies, early warnings, console, lifecycle)
- **G-Series**: Core Guardian (rules, alerts, incidents, risk)
- **I-Series**: QA Chaos Testing
- **H-Series**: AI Intelligence (future)

---

*Last Updated: 2025-12-12*
*Z02 Implementation: Complete with all 7 tasks (T01-T07)*
