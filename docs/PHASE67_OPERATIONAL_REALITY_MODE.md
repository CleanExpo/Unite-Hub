# Phase 67: Operational Reality Mode (ORM)

**Status**: Complete
**Date**: 2025-11-23

## Overview

Operational Reality Mode provides real-cost modelling and profitability analysis for Unite-Hub. All metrics are based on actual usage data - no estimates or projections. This system enables data-driven decisions about client profitability, resource allocation, and growth capacity.

## Core Engines

### 1. Cost Model Engine (`src/lib/orm/costModelEngine.ts`)

Calculates real costs per client and per agent.

**Cost Categories**:
- AI tokens (Claude, Gemini, OpenAI)
- Voice synthesis (ElevenLabs)
- Storage and bandwidth
- Compute hours
- Email sends
- Image generation

**Default Rates**:
```typescript
claude_per_1k_tokens: 0.015
gemini_per_1k_tokens: 0.001
openai_per_1k_tokens: 0.01
elevenlabs_per_1k_chars: 0.30
storage_per_gb: 0.10
bandwidth_per_gb: 0.05
compute_per_hour: 0.05
email_per_send: 0.001
image_per_generation: 0.02
```

**Features**:
- Per-client cost breakdown
- Per-agent cost analysis
- Cost trends over time
- Category-wise allocation

### 2. Profitability Engine (`src/lib/orm/profitabilityEngine.ts`)

Calculates weekly profitability per client with automatic alerts.

**Status Thresholds**:
- `profitable`: Margin > 20%
- `marginal`: Margin 0-20%
- `loss_leading`: Margin < 0%

**Features**:
- Weekly profitability calculation
- Trend detection (improving/stable/declining)
- Loss-leading alerts (after 2+ weeks)
- Automatic recommendations
- Summary statistics

**Alert Triggers**:
- Declining trend warning
- Loss-leading status
- Low margin threshold

### 3. ROI Engine (`src/lib/orm/roiEngine.ts`)

Calculates ROI based on actual deliverables, not estimates.

**Deliverable Values** (weighted):
```typescript
seo_audits_completed: 15
rankings_improved: 20
visual_assets_created: 10
campaigns_launched: 25
emails_sent: 1
content_pieces_published: 12
reports_generated: 8
leads_generated: 30
conversions: 50
```

**ROI Score Components**:
- Value Delivered Index (deliverable value / cost ratio)
- Cost Efficiency (value per $100 spent)
- Quality Score (based on outcomes)
- Timeline Adherence

**Overall Rating**:
- `excellent`: ROI Score >= 80
- `good`: ROI Score >= 60
- `average`: ROI Score >= 40
- `poor`: ROI Score < 40

### 4. Workload Engine (`src/lib/orm/workloadEngine.ts`)

Calculates system load indices for capacity planning.

**Load Components**:
- Staff Load (40% weight)
  - Average utilization
  - Overloaded count (>90% utilization)
- AI Load (35% weight)
  - Token usage vs budget
  - Capacity percentage
- Queue Load (25% weight)
  - Pending jobs
  - Average wait time

**Combined Index Calculation**:
```typescript
combined = (staff_index * 0.4) + (ai_index * 0.35) + (queue_index * 0.25)
```

**Status Levels**:
- `healthy`: < 60%
- `moderate`: 60-79%
- `strained`: >= 80%

### 5. Simulation Engine (`src/lib/orm/simulationEngine.ts`)

Simulates impact of adding new clients.

**Default Scenarios**:
- Add 1 Client
- Add 5 Clients
- Add 10 Clients

**Scenario Assumptions** (per client):
```typescript
avg_monthly_revenue: 2500
avg_monthly_cost: 1500
avg_ai_tokens: 30000
avg_staff_hours: 20
avg_queue_jobs: 200
```

**Feasibility Ratings**:
- `safe`: Workload < 60%, Staff < 80%, AI < 70%
- `caution`: Workload < 75%, Staff < 90%, AI < 85%
- `risky`: Workload < 85%
- `not_recommended`: Workload >= 85%

**Impact Metrics**:
- Revenue change
- Cost change
- Margin change
- Staff utilization change
- AI capacity change
- Workload index change

**Auto-Generated Recommendations**:
- Hire additional staff (if util > 90%)
- Monitor workload (if util > 80%)
- Increase AI budget (if capacity > 85%)
- Scale queue workers (if depth > 100)

## UI Components

### ORMProfitCard (`src/ui/components/ORMProfitCard.tsx`)
Displays client profitability with:
- Revenue, cost, margin
- Status badge (profitable/marginal/loss_leading)
- Trend indicator
- Weeks unprofitable counter
- Recommendations list

### ORMROIOverview (`src/ui/components/ORMROIOverview.tsx`)
Displays client ROI metrics with:
- Value Delivered Index gauge
- ROI Score
- Cost Efficiency
- Quality Score
- Timeline Adherence
- Highlights and improvement areas

### ORMSimulationCard (`src/ui/components/ORMSimulationCard.tsx`)
Displays simulation results with:
- Client count change visualization
- Projected workload bar
- Impact grid (revenue, margin, staff, AI)
- Required upgrades list
- Confidence percentage

## Dashboard

### Founder ORM Dashboard (`src/app/founder/dashboard/orm/page.tsx`)

Four-tab interface:

1. **Profitability Tab**
   - Client profitability cards
   - Loss-leading alerts
   - Trend indicators

2. **ROI Overview Tab**
   - ROI cards per client
   - Value delivered metrics
   - Quality scores

3. **Workload Index Tab**
   - Staff Load gauge
   - AI Load gauge
   - Queue Load gauge
   - Combined index card

4. **Simulations Tab**
   - Add 1/5/10 client scenarios
   - Feasibility ratings
   - Impact projections
   - Upgrade requirements

**Summary Cards**:
- Total Revenue
- Total Costs
- Net Margin (with percentage)
- Client breakdown (profitable/marginal/loss-leading)

## Safety Constraints

### Real Data Only
- No estimates or projections displayed as facts
- All metrics from actual usage
- Clear labeling of simulated scenarios

### No Fake Metrics
- No placeholder data in production
- Missing data shown as "N/A"
- Confidence scores on all projections

### Founder Approval Required
- Major capacity decisions need approval
- Loss-leading client actions need review
- Scaling recommendations are advisory only

### Audit Logging
- All ORM calculations logged
- Client profitability changes tracked
- Simulation runs recorded

## Integration Points

### Data Sources
- `usage_metrics` table for actual consumption
- `invoices` table for revenue
- `staff_time_logs` for staff utilization
- `ai_usage_logs` for AI token consumption
- `job_queue` for queue metrics

### Feeds Into
- Agency Director (strategic decisions)
- Governance Dashboard (compliance)
- Scaling Engine (capacity planning)
- Client Portal (transparency)

## Files Created

### Engines (5 files)
- `src/lib/orm/costModelEngine.ts` - Cost calculation
- `src/lib/orm/profitabilityEngine.ts` - Profitability analysis
- `src/lib/orm/roiEngine.ts` - ROI calculation
- `src/lib/orm/workloadEngine.ts` - Workload indices
- `src/lib/orm/simulationEngine.ts` - Client simulations

### Components (3 files)
- `src/ui/components/ORMProfitCard.tsx`
- `src/ui/components/ORMROIOverview.tsx`
- `src/ui/components/ORMSimulationCard.tsx`

### Dashboard (1 file)
- `src/app/founder/dashboard/orm/page.tsx`

**Total**: 9 files, ~2,200 lines

## Usage

```typescript
// Calculate client profitability
import { ProfitabilityEngine } from '@/lib/orm/profitabilityEngine';
const engine = new ProfitabilityEngine();
const profitability = engine.calculateProfitability(clientId, revenue, cost);

// Run growth simulation
import { SimulationEngine } from '@/lib/orm/simulationEngine';
const sim = new SimulationEngine();
const results = sim.runAllScenarios(currentClients, revenue, cost, workload);

// Get workload index
import { WorkloadEngine } from '@/lib/orm/workloadEngine';
const workload = new WorkloadEngine();
const index = workload.calculateIndex(staffMetrics, aiMetrics, queueMetrics);
```

## Future Enhancements

1. **Historical Trends** - Multi-week profitability graphs
2. **Predictive Alerts** - ML-based early warning system
3. **Client Cohort Analysis** - Group profitability patterns
4. **Custom Simulations** - User-defined scenario builder
5. **Export Reports** - PDF/Excel profitability reports
