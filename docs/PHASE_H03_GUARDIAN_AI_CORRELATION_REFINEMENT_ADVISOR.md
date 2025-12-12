# Guardian H03: AI Correlation Refinement Advisor — Complete Documentation

**Phase**: Guardian H03 (AI Correlation Refinement Advisor)
**Status**: ✅ Production Ready (All 9 Tasks Complete)
**Date**: 2025-12-12

---

## Overview

Guardian H03 adds an **advisory layer** that analyzes existing correlation clusters and suggests refined correlation rules/parameters using aggregate signals. It enables admins to:

1. **Generate recommendations** for cluster splitting/merging and parameter tuning
2. **Review recommendations** from heuristics (always) and AI (governance-gated)
3. **Annotate clusters** with labels and investigation notes
4. **Track feedback** on recommendations for continuous improvement
5. **Apply changes manually** via existing correlation configuration tools

**Non-Breaking**: Pure advisory extension. H03 never auto-modifies correlation behavior.

---

## Architecture Overview

```
Guardian Correlation Clusters (core G-series)
              ↓
┌──────────────────────────────────────┐
│ Correlation Signal Builder            │
│ - Extract aggregate features          │
│ - Cluster size, density, duration     │
│ - Incident linkage rates              │
│ - Risk contribution estimates         │
└──────────────────┬───────────────────┘
                   ↓
    ┌──────────────────────────────────┐
    │ Heuristic Recommender (Always)    │
    │ - Split oversized clusters        │
    │ - Merge tiny noisy clusters       │
    │ - Tune parameters via heuristics  │
    └──────────────────────────────────┘
                   ↓
    ┌──────────────────────────────────┐
    │ AI Recommender (Governance-Gated) │
    │ - [Z10 Governance Check]          │
    │ - Claude Sonnet analysis          │
    │ - Additional parameter suggestions │
    │ - Validated for safety            │
    └──────────────────────────────────┘
                   ↓
┌──────────────────────────────────────┐
│ Orchestrator & Persistence            │
│ - Dedupe & merge recommendations     │
│ - Store with status tracking         │
│ - Support annotations & feedback     │
└──────────────────┬───────────────────┘
                   ↓
      Admin Review & Manual Apply
      (via existing correlation tools)
```

---

## Supported Metrics (Aggregate-Only)

All signals use **counts, densities, rates** — no raw payloads:

| Signal | Type | Source | Example |
|--------|------|--------|---------|
| `link_count` | Count | Cluster | 15 links in cluster |
| `unique_rule_count` | Count | Cluster | 5 unique rules |
| `duration_minutes` | Duration | Cluster | 120 minutes |
| `density` | Ratio | Computed | 2.5 (links/entities) |
| `incident_link_rate` | Rate | Computed | 0.4 (40% linked) |
| `risk_contribution` | Estimate | Computed | 35 (0-100 scale) |
| `median_cluster_size` | Percentile | Summary | 18 links (median) |
| `p95_cluster_size` | Percentile | Summary | 25 links (95th %) |

---

## Recommendation Types

### 1. **time_window** — Adjust cluster correlation time window

**When**: Clusters too large/small or frequently merging/splitting

**Recommendation Fields**:
```json
{
  "time_window_minutes_delta": 10,
  "reason": "increase to better group related events"
}
```

### 2. **noise_filter** — Raise minimum link threshold

**When**: Many tiny transient clusters with low incident impact

**Recommendation Fields**:
```json
{
  "min_links_delta": 1,
  "reason": "filter out noisy 2-link clusters"
}
```

### 3. **threshold_tune** — Adjust cluster duration limits

**When**: Many clusters exceeding max_cluster_duration

**Recommendation Fields**:
```json
{
  "max_cluster_duration_minutes_delta": 120,
  "reason": "allow longer-running incident patterns"
}
```

### 4. **link_weight** — Adjust link weight thresholds

**When**: Cluster density very low or high

**Recommendation Fields**:
```json
{
  "link_weight_min_delta": -0.1,
  "reason": "capture more distant correlations"
}
```

### 5. **merge_split** — Suggest splitting/merging logic

**When**: Clear patterns in cluster composition

**Recommendation Fields**:
```json
{
  "action": "split_by_rule",
  "reason": "separate unrelated rule patterns"
}
```

---

## Governance Integration (Z10)

### Feature Flag: `ai_usage_policy`

| Setting | Behavior |
|---------|----------|
| `enabled` | Generate AI recommendations (Claude Sonnet) |
| `disabled` | Heuristics only (no AI) |
| Absent (Z10 missing) | Heuristics only (graceful) |

### AI Recommendation Safety

**Constraints**:
- Aggregate signals only (no cluster details, rule payloads, etc.)
- Strict parameter name allowlist (safety-checked)
- Disallowed: secrets, PII, promises, auto-changes
- Validated before storage

---

## Database Tables

### guardian_correlation_recommendations

```sql
-- Status tracking
status TEXT -- 'new'|'reviewing'|'accepted'|'rejected'|'applied'
source TEXT -- 'ai'|'heuristic'

-- Content (PII-free)
title TEXT
rationale TEXT
confidence NUMERIC (0..1)
recommendation_type TEXT -- 'merge_split'|'threshold_tune'|...
target JSONB -- { scope: 'single'|'multiple'|'global', cluster_ids?: [] }
signals JSONB -- aggregate metrics used
recommendation JSONB -- parameter deltas (safe names only)
```

### guardian_correlation_cluster_annotations

```sql
-- Reference
cluster_id UUID REFERENCES guardian_correlation_clusters(id)

-- Content
label TEXT -- e.g., "likely single incident"
category TEXT -- 'general'|'incident'|'noise'|'pattern'
notes TEXT -- sensitive; redacted from exports by default
tags TEXT[] -- e.g., ['flaky-rule', 'network-issue']
```

### guardian_correlation_recommendation_feedback

```sql
-- Tracking
recommendation_id UUID
action TEXT -- 'viewed'|'thumbs_up'|'accepted'|'applied'...
actor TEXT
reason TEXT
notes TEXT
```

---

## API Reference

### Recommendations

**GET** `/api/guardian/ai/correlation-recommendations`
- List recommendations with filters (status, source)
- Query params: `status`, `source`, `limit`

**POST** `/api/guardian/ai/correlation-recommendations` (admin-only)
- Trigger recommendation generation
- Body: `{ windowDays?, maxRecommendations? }`

**GET** `/api/guardian/ai/correlation-recommendations/[id]`
- Get specific recommendation detail

**PATCH** `/api/guardian/ai/correlation-recommendations/[id]` (admin-only)
- Update status (new → reviewing → accepted → applied)
- Body: `{ status: "reviewing"|"accepted"|"rejected"|"applied" }`

**POST** `/api/guardian/ai/correlation-recommendations/[id]/feedback` (admin-only)
- Record admin action
- Body: `{ action, reason?, notes? }`

### Annotations

**GET** `/api/guardian/correlation/annotations`
- List annotations (optionally filtered by cluster_id)
- Query params: `clusterId`, `limit`

**POST** `/api/guardian/correlation/annotations` (admin-only)
- Create annotation
- Body: `{ clusterId, label, category?, notes?, tags? }`

**PATCH** `/api/guardian/correlation/annotations/[id]` (admin-only)
- Update annotation

**DELETE** `/api/guardian/correlation/annotations/[id]` (admin-only)
- Delete annotation

---

## UI Console

**Route**: `/guardian/admin/correlation-advisor?workspaceId=ws-123`

### Tab 1: Recommendations

1. **Generate** button → Select time window (7/30/90 days) → Generate
2. **Filters** → Status (new/reviewing/accepted/applied), Source (AI/heuristic)
3. **List** → Each recommendation shows:
   - Title, rationale, type, source, status, confidence
   - Click to expand detail drawer
4. **Detail** → Shows:
   - Full rationale
   - Target clusters/scope
   - Recommended parameter changes
   - Aggregate signals used
   - Quick actions: Mark reviewing, Accept, Reject, Mark Applied

### Tab 2: Cluster Annotations

1. **Add Annotation** button → Form with cluster ID, label, category, notes, tags
2. **List** → Recent annotations by cluster
3. **Edit/Delete** for each annotation

---

## Z13 Automation Integration

### Task Type: `correlation_refinement_recommendations`

**Default Config**:
```javascript
{
  windowDays: 7,
  maxRecommendations: 10
}
```

**Schedule Example**:
```javascript
{
  key: 'correlation_refinement_recommendations',
  schedule: 'weekly', // Every Monday 00:00 UTC
  config: { windowDays: 7, maxRecommendations: 10 }
}
```

**Response**:
```javascript
{
  status: 'success',
  count: 8,
  message: 'Generated 8 correlation refinement recommendations (AI: true)',
  warnings?: ['Cluster analysis incomplete for rule X']
}
```

---

## Heuristic Rules

### 1. Split Oversized Long-Duration Clusters

**Triggers**: `link_count > p95_cluster_size` AND `duration > median * 3`
**Recommendation**: Reduce `time_window_minutes` by 25%
**Confidence**: 0.7

### 2. Merge Tiny Noisy Clusters

**Triggers**: `> 20% of clusters have size 2-3, low incident linkage, short duration`
**Recommendation**: Increase `min_links` by 1
**Confidence**: 0.65

### 3. Relax Time Window for High Overlap

**Triggers**: `> 30% of clusters share rule sets, median_duration > 30 min`
**Recommendation**: Increase `time_window_minutes` by 10
**Confidence**: 0.6

### 4. Adjust Link Weights for Sparse Clusters

**Triggers**: `avg_density < 0.5`
**Recommendation**: Lower `link_weight_min` by 0.1
**Confidence**: 0.65

### 5. Increase Max Duration Limit

**Triggers**: `> 15% of clusters exceed p95_duration`
**Recommendation**: Increase `max_cluster_duration_minutes` by 120
**Confidence**: 0.6

---

## Workflow Example

```
1. Admin clicks "Generate Recommendations" in UI (7-day window)

2. System builds correlation signals:
   - Fetches clusters from guardian_correlation_clusters
   - Computes size, density, duration, incident linkage
   - Builds summary statistics

3. Heuristic recommender runs:
   - Identifies oversized clusters → split recommendation
   - Identifies noisy clusters → filter recommendation
   - Identifies overlapping rules → window relaxation

4. AI recommender runs (if enabled):
   - Sends only aggregate summary to Claude Sonnet
   - Validates response for safety (no PII, safe params)
   - Returns additional parameter tuning suggestions

5. All recommendations stored with status='new'

6. Admin reviews in UI:
   - Reads recommendation rationale
   - Reviews aggregate signals used
   - Marks as "reviewing" or "accepted"

7. To apply:
   - Admin manually adjusts correlation parameters in existing UI
   - Marks recommendation as "applied"
   - System records feedback for continuous improvement
```

---

## Non-Breaking Guarantees

✅ **H03 does NOT**:
- Modify core correlation runtime behavior (G-series)
- Auto-create incidents or rules
- Auto-change cluster parameters
- Export raw cluster/rule/correlation data
- Weaken RLS or auth

✅ **H03 ONLY**:
- Provides advisory recommendations (admins decide)
- Stores aggregate-only signals (no PII)
- Respects Z10 governance for AI
- Adds 3 new meta tables (RLS enforced)
- Extends Z13 automation (non-invasively)

---

## Production Checklist

- ✅ Migration 613 applied (3 tables with RLS)
- ✅ All services compile (TypeScript strict mode)
- ✅ All API routes enforce tenant scoping & admin-only
- ✅ All signals validated as PII-free
- ✅ All recommendations validated for safety
- ✅ Z10 governance gating tested
- ✅ 400+ lines of tests
- ✅ Non-breaking verified

---

## Troubleshooting

| Issue | Check |
|-------|-------|
| No recommendations generated | 7+ day window has clusters? |
| AI recommendations absent | Z10 `ai_usage_policy` enabled? |
| Recommendations not stored | Admin user? Workspace ID correct? |
| Annotations deleted unexpectedly | Check for cascading FK on cluster_id |
| UI console slow | Too many clusters? Paginate in list? |

---

**Documentation Version**: 1.0
**Last Updated**: 2025-12-12
