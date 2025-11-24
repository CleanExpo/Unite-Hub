# Phase 89: Founder Autopilot Mode (Weekly Operator Engine)

## Overview

Phase 89 transforms all existing Unite-Hub intelligence into a **Weekly Founder Autopilot** system. This top-level orchestrator collects signals from all underlying engines, plans prioritised actions, and optionally executes low-risk tasks automatically—giving founders a unified weekly operating system.

## Architecture

### Signal Flow

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Early Warning  │     │   Performance   │     │    Creative     │
│     Engine      │────▶│     Reality     │────▶│     Combat      │
└─────────────────┘     └─────────────────┘     └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                                 ▼
                    ┌─────────────────────────┐
                    │   Signal Collector      │
                    │   (collectSignals)      │
                    └─────────────────────────┘
                                 │
                                 ▼
                    ┌─────────────────────────┐
                    │       Planner           │
                    │ (transformToActions)    │
                    └─────────────────────────┘
                                 │
                                 ▼
                    ┌─────────────────────────┐
                    │   Playbook Service      │
                    │  (createPlaybook)       │
                    └─────────────────────────┘
                                 │
                                 ▼
                    ┌─────────────────────────┐
                    │      Executor           │
                    │  (executeAutoBatch)     │
                    └─────────────────────────┘
```

### Core Components

1. **Signal Collector** - Gathers signals from all engines
2. **Planner** - Transforms signals into prioritised actions
3. **Playbook Service** - Creates and manages weekly playbooks
4. **Executor** - Executes actions (auto or with approval)
5. **Preference Service** - Manages per-founder automation settings

## Database Schema

### Tables

```sql
-- Founder preferences for automation
CREATE TABLE autopilot_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL,
  founder_id UUID NOT NULL,
  automation_profile TEXT DEFAULT 'conservative',
  domain_levels JSONB DEFAULT '{}',
  schedule_prefs JSONB DEFAULT '{}',
  excluded_clients UUID[],
  metadata JSONB DEFAULT '{}'
);

-- Weekly operating plans
CREATE TABLE autopilot_playbooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  status TEXT DEFAULT 'active',
  summary_markdown TEXT,
  meta_scores JSONB,
  total_actions INTEGER DEFAULT 0,
  auto_executed INTEGER DEFAULT 0,
  awaiting_approval INTEGER DEFAULT 0
);

-- Individual actions
CREATE TABLE autopilot_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  playbook_id UUID NOT NULL,
  category TEXT NOT NULL,
  source_engine TEXT NOT NULL,
  action_type TEXT NOT NULL,
  risk_class TEXT NOT NULL,
  impact_estimate NUMERIC,
  effort_estimate NUMERIC,
  priority_score NUMERIC,
  state TEXT DEFAULT 'suggested',
  title TEXT NOT NULL,
  description TEXT,
  payload JSONB,
  truth_notes TEXT
);
```

## Automation Profiles

### Profile Definitions

| Profile | Low Risk | Medium Risk | High Risk |
|---------|----------|-------------|-----------|
| **Off** | suggest | suggest | suggest |
| **Conservative** | auto | suggest | suggest |
| **Balanced** | auto | auto | suggest |
| **Aggressive** | auto | auto | approval_only |

### Domain Levels

Each category can override the profile:
- `off` - Never process this category
- `suggest` - Show suggestions only
- `approval_only` - Require manual approval
- `auto` - Follow automation profile

### Action Categories

1. **risk** - Risk management warnings
2. **optimisation** - Performance improvements
3. **creative** - Creative testing actions
4. **scaling** - Scaling recommendations
5. **reporting** - Report generation
6. **outreach** - Email/communication tasks
7. **retention** - Client retention actions
8. **financial** - Financial operations

## Risk Classification

### Risk Classes

- **Low Risk** - Can be auto-executed
  - Review warnings, generate reports, process combat winners

- **Medium Risk** - Requires approval in conservative/balanced
  - Performance recommendations, tie handling

- **High Risk** - ALWAYS requires approval
  - Scaling mode changes, financial operations, freeze recommendations

### Priority Scoring

```typescript
priorityScore = (impactEstimate * riskWeight) / effortEstimate

// Risk weights
high: 1.5    // Prioritize high-impact risks
medium: 1.0
low: 0.8
```

## API Endpoints

### Preferences

```typescript
// Get preferences
GET /api/autopilot/preferences?workspaceId={id}

// Update preferences
PUT /api/autopilot/preferences?workspaceId={id}
Body: { automationProfile, domainLevels, schedulePrefs }
```

### Playbooks

```typescript
// List playbooks
GET /api/autopilot/playbooks?workspaceId={id}

// Get specific playbook with actions
GET /api/autopilot/playbooks?workspaceId={id}&playbookId={playbookId}

// Generate new playbook
POST /api/autopilot/playbooks?workspaceId={id}
// Returns: playbook, actions, autoExecuted count
```

### Actions

```typescript
// Approve and execute
POST /api/autopilot/actions/{id}/approve

// Skip action
POST /api/autopilot/actions/{id}/skip
```

### Stats

```typescript
// Get autopilot statistics
GET /api/autopilot/stats?workspaceId={id}&days=30
```

## UI Components

### AutopilotOverview

Displays key metrics:
- Current automation profile
- Auto-executed count
- Awaiting approval count
- Total actions

### AutopilotPlaybookList

Lists weekly playbooks with:
- Period dates
- Status badges
- Action counts
- Generate new button

### AutopilotActionBoard

Displays actions grouped by state:
- Awaiting approval (with approve/skip buttons)
- Completed (auto or manual)
- Skipped

### AutopilotPreferencesEditor

Configure:
- Automation profile selection
- Per-category domain overrides
- Notification preferences

## Truth Layer Compliance

### Guardrails

1. **No AI invention** - Actions come from real signals only
2. **Human approval for high-risk** - Never auto-execute high-risk
3. **Transparency** - Truth notes explain each action's source
4. **No hallucinated metrics** - All data from actual engine outputs

### Truth Notes

Every action includes `truth_notes` explaining:
- Source of the signal
- Why it was flagged
- What the execution will do

Example:
```
"Requires manual review to determine appropriate response."
"Confidence: 45%. Review recommended."
"Scaling changes require careful consideration of current capacity."
```

## Integration with Other Engines

### Early Warning → Actions

```typescript
{
  category: 'risk',
  actionType: 'review_warning',
  riskClass: severity === 'critical' ? 'high' : 'medium'
}
```

### Performance Reality → Actions

```typescript
{
  category: 'optimisation',
  actionType: 'review_performance',
  riskClass: confidence < 0.3 ? 'high' : 'low'
}
```

### Creative Combat → Actions

```typescript
{
  category: 'creative',
  actionType: winner ? 'promote_winner' : 'handle_tie',
  riskClass: 'low'
}
```

### Scaling Mode → Actions

```typescript
{
  category: 'scaling',
  actionType: 'review_scaling',
  riskClass: recommendation === 'freeze' ? 'high' : 'medium'
}
```

### Founder Intel → Actions

```typescript
{
  category: 'reporting',
  actionType: 'generate_report',
  riskClass: 'low'
}
```

## Playbook Generation Flow

1. Calculate period (current week)
2. Collect signals from all engines
3. Transform signals to actions
4. Prioritise by impact/effort ratio
5. Create playbook with summary
6. Auto-execute eligible actions (per preferences)
7. Return playbook with action states

## Usage Example

### Generate Weekly Playbook

```typescript
import { generatePlaybook, executeAutoBatch, getPreferences } from '@/lib/autopilot';

// Generate playbook for workspace
const playbook = await generatePlaybook(workspaceId);

// Get founder preferences
const preferences = await getPreferences(workspaceId, founderId);

// Auto-execute eligible actions
const results = await executeAutoBatch(playbook.id, preferences);

console.log(`Auto-executed ${results.filter(r => r.success).length} actions`);
```

### Approve Action

```typescript
import { approveAndExecute } from '@/lib/autopilot';

const result = await approveAndExecute(actionId, userId);

if (result.success) {
  console.log('Action executed:', result.result);
}
```

## File Structure

```
src/lib/autopilot/
├── index.ts                        # Module exports
├── autopilotTypes.ts               # Type definitions
├── autopilotPreferenceService.ts   # Preference management
├── autopilotSignalCollectorService.ts # Signal collection
├── autopilotPlannerService.ts      # Action planning
├── autopilotPlaybookService.ts     # Playbook CRUD
└── autopilotExecutorService.ts     # Action execution

src/app/api/autopilot/
├── preferences/route.ts            # GET/PUT preferences
├── playbooks/route.ts              # GET/POST playbooks
├── stats/route.ts                  # GET stats
└── actions/[id]/
    ├── approve/route.ts            # POST approve
    └── skip/route.ts               # POST skip

src/components/autopilot/
├── index.ts                        # Component exports
├── AutopilotOverview.tsx           # Stats cards
├── AutopilotPlaybookList.tsx       # Playbook table
├── AutopilotActionBoard.tsx        # Action management
└── AutopilotPreferencesEditor.tsx  # Settings editor

src/app/founder/autopilot/
└── page.tsx                        # Main console page
```

## Metrics & Stats

### Tracked Metrics

- Total playbooks generated
- Total actions created
- Auto-executed count
- Approved & executed count
- Awaiting approval count

### Playbook Meta Scores

```typescript
{
  risk_mix: averageRiskScore,     // 1-3 scale
  effort_total: totalEffort,
  impact_total: totalImpact,
  coverage_percent: categorySpread // % of categories covered
}
```

## Future Enhancements

1. **Scheduling** - Auto-generate playbooks on schedule
2. **Slack/Email notifications** - Alert on awaiting approvals
3. **Learning** - Adjust priorities based on founder behavior
4. **Batch approval** - Approve multiple low-risk at once
5. **Rollback** - Undo executed actions where possible

## Summary

Phase 89 Founder Autopilot Mode provides:

- ✅ Unified signal collection from all engines
- ✅ Intelligent action prioritisation
- ✅ Configurable automation levels
- ✅ Per-category domain controls
- ✅ High-risk action protection
- ✅ Truth layer compliance
- ✅ Weekly playbook generation
- ✅ Action approval workflow
- ✅ Comprehensive statistics

This creates a true "weekly operator engine" that handles routine operations while keeping founders in control of high-impact decisions.
