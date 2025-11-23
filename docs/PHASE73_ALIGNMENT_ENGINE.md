# Phase 73: Alignment Engine

**Date**: 2025-11-24
**Status**: Complete
**Branch**: main

## Overview

Phase 73 creates a unified Alignment Engine that combines all first-90-days systems into a single view for founders and clients. It features a narrative generator using only real data (truth layer enforced), surfaces blockers, wins, opportunities, and recommended next steps across 5 dimensions.

## Core Concepts

### 5 Alignment Dimensions

| Dimension | Weight | Description |
|-----------|--------|-------------|
| **Momentum** | 25% | Progress velocity through the 90-day journey |
| **Clarity** | 20% | Clear communication and complete information |
| **Workload** | 15% | Production capacity and approval flow |
| **Quality** | 20% | Content quality and brand alignment |
| **Engagement** | 20% | Audience response and client activity |

### Overall Status

- **Aligned** (70-100%): Journey progressing well
- **Mostly Aligned** (50-69%): Good progress with minor areas to address
- **Needs Attention** (30-49%): Some areas need intervention
- **Misaligned** (0-29%): Significant action required

### Data Sources

The Alignment Engine aggregates signals from:
- Activation Engine (milestone completion)
- Success Engine (success scores)
- Creative Ops Grid (production status)
- Performance Intelligence (engagement metrics)
- Production Engine (job completion, approvals)

## Files Created (8 files)

### Core Engine (2 files)

1. **`src/lib/alignment/alignmentEngine.ts`** (~450 lines)
   - 5-dimension scoring with transparent weights
   - Blocker detection with severity levels
   - Opportunity identification with effort estimates
   - Win tracking for morale
   - Functions: `generateAlignmentReport`, `getDimensionDisplayName`, `getDimensionDescription`

2. **`src/lib/alignment/alignmentNarrative.ts`** (~280 lines)
   - Client-facing narratives (simplified, actionable)
   - Founder-facing narratives (detailed, operational)
   - Phase context references 90-day map
   - Functions: `generateClientNarrative`, `generateFounderNarrative`, `generateStatusLine`

### UI Components (3 files)

3. **`src/ui/components/AlignmentScoreCard.tsx`** (~180 lines)
   - 5-dimension alignment summary
   - Progress bars with status colors
   - Weight transparency
   - Compact `AlignmentIndicator` for lists

4. **`src/ui/components/AlignmentOpportunitiesPanel.tsx`** (~130 lines)
   - Opportunity cards with potential rating
   - Affected dimensions badges
   - Effort estimates
   - Next step actions

5. **`src/ui/components/AlignmentBlockersPanel.tsx`** (~160 lines)
   - Blocker cards with severity indicators
   - Days blocked tracking
   - Suggested actions
   - Affected dimensions

### Dashboard Pages (2 files)

6. **`src/app/client/dashboard/alignment/page.tsx`** (~220 lines)
   - Simplified narrative with actionable clarity
   - Score card and dimension breakdown
   - Blockers and opportunities panels
   - Next steps list
   - Recent wins

7. **`src/app/founder/dashboard/alignment/page.tsx`** (~320 lines)
   - Multi-client comparison view
   - Summary cards: avg score, blockers, opportunities
   - Client list sorted by score (lowest first)
   - Detailed narrative per client
   - Tabbed detail view

### Documentation (1 file)

8. **`docs/PHASE73_ALIGNMENT_ENGINE.md`**

## Files Modified (2 files)

1. **`src/app/client/dashboard/journey/page.tsx`**
   - Added Alignment button in header
   - Links to /client/dashboard/alignment

2. **`src/app/founder/dashboard/first-client-journey/page.tsx`**
   - Added Alignment button in header
   - Links to /founder/dashboard/alignment

## Architecture

### Dimension Scoring

```typescript
// Each dimension is scored 0-100 based on available data
const dimensions = [
  { dimension: 'momentum', score: 72, weight: 0.25, status: 'strong' },
  { dimension: 'clarity', score: 85, weight: 0.20, status: 'strong' },
  { dimension: 'workload', score: 58, weight: 0.15, status: 'healthy' },
  { dimension: 'quality', score: 65, weight: 0.20, status: 'healthy' },
  { dimension: 'engagement', score: 48, weight: 0.20, status: 'needs_attention' },
];

// Overall score = weighted average
const overall = 72 * 0.25 + 85 * 0.20 + 58 * 0.15 + 65 * 0.20 + 48 * 0.20;
// = 18 + 17 + 8.7 + 13 + 9.6 = 66.3%
```

### Data Input

```typescript
const report = generateAlignmentReport({
  workspaceId: 'ws_123',
  clientName: 'Example Client',
  journeyDay: 45,
  journeyPhase: 'activation',

  // Momentum inputs
  milestonesCompleted: 7,
  totalMilestones: 12,
  productionJobsCompleted: 8,

  // Clarity inputs
  profileCompleted: true,
  brandKitUploaded: true,
  lastCommunicationDays: 3,

  // Workload inputs
  pendingProduction: 3,
  completedProduction: 8,
  pendingApprovals: 2,

  // Quality inputs
  successScore: 65,
  brandAlignmentScore: 70,
  revisionRate: 0.12,

  // Engagement inputs
  engagementRate: 0.035,
  clientLoginDays: 2,
  feedbackCount: 5,
});
```

### Narrative Generation

```typescript
// Client narrative - simplified
const clientNarrative = generateClientNarrative(report);
// Returns: {
//   headline: "Good progress with a few areas to address",
//   summary: "You are on Day 45 in the activation phase...",
//   phase_context: "Days 22-45 begin active content production...",
//   dimension_highlights: ["Clarity is strong at 85%", ...],
//   blocker_narrative: null,
//   opportunity_narrative: "Opportunity: Strong Engagement...",
//   next_steps: ["Review and approve pending items", ...],
//   data_notice: "This assessment is based on complete data..."
// }

// Founder narrative - operational
const founderNarrative = generateFounderNarrative(report);
// Returns: {
//   headline: "Example Client: Minor attention needed (66%)",
//   summary: "Day 45/activation. No critical blockers. 1 high-potential opportunity available.",
//   ...
// }
```

## Key Features

### 1. Truth Layer Compliance
- All scores from real data, never fabricated
- "Not enough data yet" shown when insufficient
- No predictive promises or hype language
- Data completeness percentage shown

### 2. Blocker Detection
- Brand kit not uploaded (blocks VIF)
- Profile incomplete (limits personalization)
- Approval queue backup (blocks production)
- Low engagement rate (needs creative adjustment)
- Communication gap (needs outreach)

### 3. Opportunity Identification
- Strong engagement → Expand reach
- Good momentum → Accelerate features
- High success score → Showcase work
- Low revision rate → Increase output

### 4. Transparent Weights
- Weights displayed in UI
- Documented in code comments
- Sum to 100%
- Can be adjusted per business needs

### 5. Role-Based Views
- **Client**: Simplified narrative, actionable clarity
- **Founder**: Multi-client comparison, risk detection

## Usage

### Generate Alignment Report

```typescript
import { generateAlignmentReport } from '@/lib/alignment/alignmentEngine';

const report = generateAlignmentReport({
  workspaceId: 'ws_123',
  clientName: 'My Client',
  journeyDay: 30,
  journeyPhase: 'activation',
  // ... data inputs
});

console.log(`Overall: ${report.overall_score}% (${report.overall_status})`);
console.log(`Blockers: ${report.blockers.length}`);
console.log(`Opportunities: ${report.opportunities.length}`);
```

### Generate Narrative

```typescript
import { generateClientNarrative, generateFounderNarrative } from '@/lib/alignment/alignmentNarrative';

// For client view
const clientNarrative = generateClientNarrative(report);
console.log(clientNarrative.headline);
console.log(clientNarrative.next_steps);

// For founder view
const founderNarrative = generateFounderNarrative(report);
console.log(founderNarrative.headline);
console.log(founderNarrative.next_steps);
```

### Display Components

```tsx
import { AlignmentScoreCard } from '@/ui/components/AlignmentScoreCard';
import { AlignmentBlockersPanel } from '@/ui/components/AlignmentBlockersPanel';
import { AlignmentOpportunitiesPanel } from '@/ui/components/AlignmentOpportunitiesPanel';

function AlignmentView({ report }) {
  return (
    <div>
      <AlignmentScoreCard report={report} showDetails={true} />
      <AlignmentBlockersPanel blockers={report.blockers} />
      <AlignmentOpportunitiesPanel opportunities={report.opportunities} />
    </div>
  );
}
```

## Safety Constraints

- **No database migrations**: Uses existing tables only
- **No auth changes**: Read-only by default
- **No business logic changes**: Existing engines untouched
- **Truth layer enforced**: Real data only
- **Rollback available**: No destructive operations

## Statistics

- **Total files created**: 8
- **Total lines of code**: ~1,740
- **Alignment dimensions**: 5
- **Blocker types**: 5
- **Opportunity types**: 4
- **Narrative types**: 2 (client, founder)

## Integration Points

### With Existing Systems

- **Journey Config**: Phase context from firstClientJourneyConfig
- **Activation Engine**: Milestone completion data
- **Success Engine**: Success scores
- **Production Dashboard**: Job completion, approvals
- **Performance Intelligence**: Engagement metrics

### With Phase 72

- Journey pages link to alignment dashboards
- Alignment uses journey day and phase
- Shared UI components (CalloutHint, etc.)

## Future Enhancements

1. **Real-time Updates**: WebSocket alignment score updates
2. **Historical Trends**: Track alignment over time
3. **Alerts**: Notify when alignment drops below threshold
4. **Predictions**: Forecast alignment based on patterns
5. **Custom Weights**: Allow founder to adjust dimension weights

---

**Phase 73 Complete** - Alignment Engine with 5-dimension scoring, truth-layer compliant narratives, blocker/opportunity detection, and role-based client and founder dashboards.
