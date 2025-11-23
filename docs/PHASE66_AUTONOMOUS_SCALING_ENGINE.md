# Phase 66: Autonomous Scaling Engine

**Status**: ✅ Complete
**Date**: 2025-11-23
**Priority**: High - Data-driven scaling recommendations

---

## Overview

Phase 66 transforms existing performance monitoring signals into actionable scaling policies. The engine analyzes system metrics, defines capacity limits for different client tiers, and generates data-driven recommendations for infrastructure improvements.

---

## Architecture

### Core Components

```
Scaling Engine
    ├── Scaling Policy Engine (metrics → recommendations)
    ├── Client Capacity Planner (5/50/100 tiers)
    ├── AI Capacity Planner (provider budgets)
    ├── Storage/Bandwidth Planner
    └── Founder Dashboard (oversight)
```

### Files Created

**Engine Layer** (`src/lib/scaling/`):
- `scalingPolicyEngine.ts` - Core recommendation engine
- `clientCapacityPlanner.ts` - Client tier capacity planning
- `aiCapacityPlanner.ts` - AI provider budget management
- `storageBandwidthPlanner.ts` - Storage and CDN planning

**UI Layer** (`src/ui/components/`):
- `ScalingTierCard.tsx` - Tier status display
- `CapacityStatusBar.tsx` - Utilization visualization
- `ScalingRecommendationList.tsx` - Recommendation cards

**Dashboard** (`src/app/founder/dashboard/`):
- `scaling/page.tsx` - Founder scaling console

---

## Scaling Tiers

### Tier Definitions

| Tier | Clients | Max CPU | Max Error Rate | Max AI Latency |
|------|---------|---------|----------------|----------------|
| **Soft Launch** | 1-5 | 50% | 2% | 2000ms |
| **Hard Launch** | 5-50 | 70% | 3% | 2500ms |
| **Growth Phase** | 50-100 | 80% | 5% | 3000ms |

### Tier Resources

**Soft Launch (1-5 clients)**:
- 10 DB connections
- 2 worker concurrency
- 128 MB cache
- 10 GB storage
- 100K monthly tokens

**Hard Launch (5-50 clients)**:
- 50 DB connections
- 5 worker concurrency
- 512 MB cache
- 50 GB storage
- 500K monthly tokens

**Growth Phase (50-100 clients)**:
- 100 DB connections
- 10 worker concurrency
- 2048 MB cache
- 200 GB storage
- 2M monthly tokens

### Headroom Thresholds

- **Warning**: 80% utilization
- **Critical**: 90% utilization

---

## Recommendation Types (9)

| Type | Description | Impact | Effort |
|------|-------------|--------|--------|
| `enable_supabase_pooler` | Connection pooling | High | Low |
| `add_redis_cache` | Caching layer | High | Medium |
| `enable_cdn_for_assets` | Edge delivery | Medium | Low |
| `increase_worker_concurrency` | More workers | High | Low |
| `split_cron_schedules` | Stagger jobs | Medium | Low |
| `tighten_rate_limits` | Protect system | Medium | Low |
| `raise_token_budgets` | Better AI quality | Medium | Low |
| `lower_token_budgets` | Cost control | Medium | Low |
| `pause_new_client_invites` | Capacity protection | High | Low |

---

## AI Provider Budgets

### Per-Tier Allocations

**Claude** (Primary AI):
- Soft Launch: 50K tokens/month
- Hard Launch: 300K tokens/month
- Growth: 1M tokens/month

**Gemini** (Google tasks):
- Soft Launch: 20K tokens/month
- Hard Launch: 100K tokens/month
- Growth: 500K tokens/month

**OpenAI** (Specialized):
- Soft Launch: 30K tokens/month
- Hard Launch: 150K tokens/month
- Growth: 600K tokens/month

**ElevenLabs** (Voice):
- Soft Launch: 10K chars/month
- Hard Launch: 50K chars/month
- Growth: 200K chars/month

**Perplexity** (Search):
- Soft Launch: 5K tokens/month
- Hard Launch: 25K tokens/month
- Growth: 100K tokens/month

---

## Capacity Status

### Status Calculation

```typescript
interface CapacityStatus {
  tier: ScalingTier;
  utilization: {
    cpu: { value: number; status: 'healthy' | 'warning' | 'critical' };
    errors: { value: number; status: 'healthy' | 'warning' | 'critical' };
    ai_latency: { value: number; status: 'healthy' | 'warning' | 'critical' };
    queue: { value: number; status: 'healthy' | 'warning' | 'critical' };
  };
  overall_health: 'healthy' | 'warning' | 'critical';
  headroom_percent: number;
  can_accept_new_clients: boolean;
}
```

### Health Determination

- **Healthy**: All metrics below 80% of tier limits
- **Warning**: Any metric at 80-90% of tier limit
- **Critical**: Any metric at 90%+ of tier limit

---

## Dashboard Features

### Overview Tab
- Current tier card with utilization
- Infrastructure metrics (CPU, errors, latency, queue, storage, bandwidth)
- Quick links to related dashboards

### AI Capacity Tab
- Provider budget bars (Claude, Gemini, OpenAI, ElevenLabs, Perplexity)
- Monthly cost projection
- Budget utilization by provider

### Recommendations Tab
- Recommendation cards with impact/risk/effort
- Implementation steps (expandable)
- Accept/Defer/Reject actions

### History Tab
- Decision history with outcomes
- Action tracking (accepted/deferred/rejected)
- Links to SIPs created

---

## Integration Points

### With Phase 64 (Evolution Engine)
- Accepted recommendations create SIPs
- Tracks implementation progress
- Feeds continuous improvement

### With Phase 63 (Governance)
- Over-capacity raises governance_risk_score
- Ignored recommendations flagged
- Compliance tracking

### With Phase 60 (AI Director)
- Scaling risk in daily briefings
- Capacity alerts for founders
- Proactive notifications

### With Phase 65 (Stability)
- Load test results inform recommendations
- Chaos test data validates resilience
- Evidence-based decisions

---

## Safety Constraints

### Opt-In Only
- All scaling actions require founder approval
- Recommendations only by default
- No automatic infrastructure changes

### Founder Controls
- Accept/defer/reject each recommendation
- Full implementation steps provided
- Cost impact disclosed

### Audit Trail
- All decisions logged
- Outcomes tracked
- SIP creation for accepted items

### Rollback Available
- Implementation steps include rollback
- No permanent changes without approval
- Test before production

---

## Usage Examples

### Calculate Capacity Status

```typescript
import ScalingPolicyEngine from '@/lib/scaling/scalingPolicyEngine';

const engine = new ScalingPolicyEngine();

const metrics = {
  cpu_utilization: 0.45,
  error_rate: 0.015,
  ai_latency_ms: 1800,
  queue_depth: 35,
  token_usage: 180000,
  storage_usage_gb: 28,
  bandwidth_usage_mb: 120,
  active_clients: 28,
};

const status = engine.calculateCapacityStatus(metrics);
// Returns: { tier, utilization, overall_health, headroom_percent, can_accept_new_clients }
```

### Generate Recommendations

```typescript
const recommendations = engine.generateRecommendations(workspaceId, metrics, status);
// Returns array of ScalingRecommendation objects
```

### Plan Client Capacity

```typescript
import ClientCapacityPlanner from '@/lib/scaling/clientCapacityPlanner';

const planner = new ClientCapacityPlanner();
const plan = planner.generateCapacityPlan(28);
// Returns: { tier_id, utilization_percent, headroom_clients, status, recommendations }
```

### Check AI Provider Budgets

```typescript
import AICapacityPlanner from '@/lib/scaling/aiCapacityPlanner';

const aiPlanner = new AICapacityPlanner();
const aiPlan = aiPlanner.generateAICapacityPlan('hard_launch', usageMetrics);
// Returns: { providers, total_budget, total_used, cost_projection }
```

---

## Key Metrics

| Metric | Target | Description |
|--------|--------|-------------|
| Headroom | > 20% | Available capacity |
| Recommendation Accuracy | > 80% | Useful recommendations |
| Acceptance Rate | > 60% | Recommendations acted on |
| Cost Projection Accuracy | ±10% | Budget predictability |

---

## Upgrade Path

### Soft Launch → Hard Launch

**Triggers**:
- 4+ active clients
- CPU approaching 50%
- Frequent queue depth spikes

**Requirements**:
- 5x DB connections (10 → 50)
- 2.5x workers (2 → 5)
- 4x cache (128 → 512 MB)
- 5x storage (10 → 50 GB)
- 5x token budget

**Cost**: +$100-200/month

### Hard Launch → Growth Phase

**Triggers**:
- 40+ active clients
- AI latency approaching limits
- Storage at 80%+

**Requirements**:
- 2x DB connections (50 → 100)
- 2x workers (5 → 10)
- 4x cache (512 → 2048 MB)
- 4x storage (50 → 200 GB)
- 4x token budget

**Cost**: +$300-600/month

---

## Truth-Layer Compliance

✅ **Data-driven recommendations** - Based on real metrics
✅ **No automatic changes** - Founder approval required
✅ **Transparent cost impact** - Always disclosed
✅ **Evidence provided** - Metrics supporting each recommendation
✅ **Full audit trail** - All decisions logged
✅ **SIP integration** - Accepted recommendations tracked

---

## Testing

```bash
# Generate capacity plan
const plan = new ClientCapacityPlanner().generateCapacityPlan(28);

# Calculate AI budgets
const aiBudgets = new AICapacityPlanner().generateAICapacityPlan('hard_launch', metrics);

# Get scaling recommendations
const recs = new ScalingPolicyEngine().generateRecommendations(workspaceId, metrics, status);
```

---

**Phase 66 Complete** - Autonomous Scaling Engine operational with data-driven recommendations and founder oversight.
