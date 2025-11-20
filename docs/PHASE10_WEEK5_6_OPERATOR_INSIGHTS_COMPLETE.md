# Phase 10 Week 5-6: Operator Insights System - COMPLETE

**Status**: COMPLETE
**Date**: 2025-11-20
**Branch**: `feature/phase10-week5-6-operator-insights`

---

## Overview

Implemented a comprehensive human feedback intelligence layer for Unite-Hub's Operator Mode. This system tracks reviewer performance, detects biases, and generates autonomy tuning recommendations based on decision outcomes.

---

## Deliverables

### 1. Database Migration (061_operator_insights.sql)

**5 new tables created:**

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `reviewer_scores` | Aggregate performance metrics | accuracy_score, speed_score, reliability_score, weighted_accuracy |
| `accuracy_history` | Track decision outcomes | decision, outcome, review_time_seconds, decay_weight |
| `bias_signals` | Detected reviewer biases | bias_type, severity, confidence, evidence |
| `feedback_events` | All feedback interactions | event_type, metadata, score_delta |
| `autonomy_tuning` | Autonomy level recommendations | domain, previous_level, new_level, confidence |

**Includes:**
- 15+ indexes for query performance
- RLS policies for all tables
- PostgreSQL function for decay-weighted score calculation

### 2. OperatorInsightsService (operatorInsightsService.ts)

**Core Features:**

#### Reviewer Scoring System
- **Accuracy Score**: Percentage of correct decisions
- **Speed Score**: Inverse of average review time
- **Consistency Score**: Low variance in review behavior
- **Impact Score**: How often decisions lead to good outcomes
- **Reliability Score**: Weighted composite (40% accuracy, 20% speed, 20% consistency, 20% impact)

#### Decay-Weighted Accuracy
Recent reviews weighted higher using exponential decay:
```
weight = 0.95 ^ (days_since_decision)
```

#### Bias Detection Types
- `APPROVAL_BIAS`: Over-approving (>85% approval rate)
- `REJECTION_BIAS`: Over-rejecting (>85% rejection rate)
- `SPEED_BIAS`: Rushing reviews (<30 sec average)
- `INCONSISTENT_WEIGHTING`: High variance in criteria application
- `DOMAIN_PREFERENCE`: Over-approving specific domains
- `DOMAIN_AVERSION`: Over-rejecting specific domains
- `AUTHORITY_DEFERENCE`: Always following senior votes
- `TIME_OF_DAY_BIAS`: Different behavior at certain times
- `WORKLOAD_BIAS`: Quality drops with volume

**Key Methods:**
```typescript
// Score management
getReviewerScores(operatorId, organizationId)
getOrganizationScores(organizationId)
updateReviewerScores(operatorId, organizationId)

// Decision tracking
recordDecision(operatorId, organizationId, decision, ...)
recordOutcome(recordId, outcome, reason)
getAccuracyHistory(operatorId, organizationId, limit)

// Bias detection
detectBiases(operatorId, organizationId)
getActiveBiases(operatorId, organizationId)
acknowledgeBias(biasId, acknowledgedBy)
resolveBias(biasId, resolution)

// Autonomy tuning
generateTuningRecommendations(organizationId)
applyTuningRecommendation(recommendationId, appliedBy)
getPendingRecommendations(organizationId)

// Events
logFeedbackEvent(organizationId, eventType, ...)
getFeedbackEvents(organizationId, limit)
```

### 3. API Route (/api/operator/insights)

**GET Parameters:**
- `type`: scores | biases | history | events | recommendations
- `operator_id`: UUID (use "all" for organization-wide)
- `organization_id`: UUID (required)
- `limit`: number

**POST Actions:**
- `submit_feedback` - Record decision outcome
- `record_decision` - Log a review decision
- `acknowledge_bias` - Mark bias as acknowledged
- `resolve_bias` - Mark bias as resolved
- `detect_biases` - Run bias detection
- `generate_recommendations` - Create tuning recommendations
- `apply_recommendation` - Apply a recommendation

### 4. OperatorInsightsDashboard Component

**UI Features:**
- **Overview Tab**: 4 score cards, reliability gauge, team leaderboard
- **History Tab**: Decision timeline with outcomes
- **Biases Tab**: Active bias signals with severity badges
- **Recommendations Tab**: Autonomy tuning suggestions

**Interactive Elements:**
- Operator selector dropdown
- Run Bias Detection button
- Generate Recommendations button
- Apply Recommendation button
- Refresh data button

### 5. Unit Tests (20 tests)

**Test Coverage:**
- Reviewer score calculations (4 tests)
- Decision recording (3 tests)
- Outcome recording (2 tests)
- Decay-weighted scoring (2 tests)
- Bias detection (5 tests)
- Bias management (2 tests)
- Autonomy tuning (3 tests)
- Feedback events (2 tests)

---

## Scoring Algorithm

### Reliability Score Formula

```
reliability = (weighted_accuracy * 0.4) +
              (speed_score * 0.2) +
              (consistency_score * 0.2) +
              (impact_score * 0.2)
```

### Speed Score Calculation

```
speed_score = 100 - ((avg_time - 60) / 5)
// Capped at 0-100
// 60 seconds = perfect score
```

### Consistency Score Calculation

Based on coefficient of variation (CV) of review times:
```
CV = std_deviation / mean
consistency_score = 100 - (CV * 100)
```

---

## Bias Detection Thresholds

| Bias Type | Detection Threshold | Severity |
|-----------|---------------------|----------|
| Approval Bias | >85% approval rate | MEDIUM (>95% = HIGH) |
| Rejection Bias | >85% rejection rate | MEDIUM (>95% = HIGH) |
| Speed Bias | <30 sec avg review time | MEDIUM (<15 sec = HIGH) |
| Inconsistent Weighting | <30 consistency score | MEDIUM (<15 = HIGH) |

**Minimum Reviews Required**: 10 decisions before bias detection activates

---

## Usage Examples

### Record a Decision

```typescript
import { OperatorInsightsService } from "@/lib/operator/operatorInsightsService";

const insights = new OperatorInsightsService();

// Record decision with timing
const record = await insights.recordDecision(
  "operator-id",
  "org-id",
  "APPROVE",
  "queue-item-id",
  "proposal-id",
  120, // 120 seconds review time
  0.85 // 85% confidence
);
```

### Record Outcome

```typescript
// Later, when outcome is known
await insights.recordOutcome(
  record.id,
  "CORRECT", // or "OVERTURNED"
  "Decision validated by production metrics"
);
```

### Detect Biases

```typescript
const biases = await insights.detectBiases("operator-id", "org-id");

for (const bias of biases) {
  console.log(`${bias.bias_type}: ${bias.severity} (${bias.confidence * 100}%)`);
}
```

### Generate Recommendations

```typescript
const recommendations = await insights.generateTuningRecommendations("org-id");

for (const rec of recommendations) {
  console.log(`${rec.domain}: ${rec.previous_level} → ${rec.new_level}`);
  console.log(`Reason: ${rec.reason}`);
}
```

---

## Files Created

| File | Lines | Purpose |
|------|-------|---------|
| `supabase/migrations/061_operator_insights.sql` | ~250 | Database schema |
| `src/lib/operator/operatorInsightsService.ts` | ~600 | Insights engine |
| `src/app/api/operator/insights/route.ts` | ~280 | API endpoints |
| `src/components/operator/OperatorInsightsDashboard.tsx` | ~450 | UI dashboard |
| `src/lib/__tests__/operatorInsightsService.test.ts` | ~450 | Unit tests |
| `docs/PHASE10_WEEK5_6_OPERATOR_INSIGHTS_COMPLETE.md` | ~300 | This doc |

**Total**: ~2,330 lines of code

---

## Integration Points

### With Operator Profiles (Week 1-2)
- Links to operator_profiles for role verification
- RLS policies reference operator role

### With Approval Queue (Week 1-2)
- Records decisions from queue approvals
- queue_item_id links outcomes to specific items

### With Collaborative Review (Week 3-4)
- Tracks outcomes from consensus decisions
- Feeds into accuracy calculations

### With Autonomy Proposals (Phase 9)
- proposal_id links to autonomy system
- Tuning recommendations affect autonomy levels

---

## Event Types

| Event | Trigger | Data |
|-------|---------|------|
| `REVIEW_SUBMITTED` | Decision recorded | decision, queue_item_id |
| `DECISION_OVERTURNED` | Outcome = OVERTURNED | reason, operator_id |
| `OUTCOME_RECORDED` | Outcome recorded | outcome, record_id |
| `BIAS_DETECTED` | Bias found | bias_type, severity |
| `BIAS_RESOLVED` | Bias resolved | resolution |
| `SCORE_UPDATED` | Scores recalculated | score_delta |
| `CALIBRATION_COMPLETE` | Periodic calibration | metrics |
| `FEEDBACK_PROVIDED` | Manual feedback | content |
| `RECOMMENDATION_GENERATED` | Tuning suggestion | recommendations |

---

## Next Steps (Week 7+)

1. **Calibration Sessions** - Periodic team alignment reviews
2. **Peer Reviews** - Cross-reviewer validation
3. **Trending Analysis** - Score changes over time
4. **Domain-Specific Biases** - Track biases per domain
5. **Automated Interventions** - Auto-pause high-bias reviewers
6. **Training Recommendations** - Suggest training based on weaknesses

---

## Testing

```bash
# Run insights tests
npm test -- --grep "OperatorInsightsService"

# Run all operator tests
npm test -- --grep "operator"
```

---

## Summary

Phase 10 Week 5-6 delivers a complete human feedback intelligence layer enabling:
- Decay-weighted reviewer accuracy scoring
- Multi-dimensional performance metrics (accuracy, speed, consistency, impact)
- Automatic bias detection with configurable thresholds
- Autonomy tuning recommendations based on team performance
- Comprehensive event logging and history tracking
- 20 unit tests for reliability

The system creates a feedback loop between human decisions and AI autonomy levels, ensuring the platform learns from operator behavior over time.
