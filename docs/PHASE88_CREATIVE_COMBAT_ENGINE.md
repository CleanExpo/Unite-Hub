# Phase 88: Creative Combat Engine (A/B Intelligence Layer)

## Overview

Phase 88 establishes a fully autonomous creative testing and comparison engine that runs A/B matchups, evaluates performance using the Performance Reality algorithm, determines statistical winners, and feeds insights back into Orchestration and VIF Evolution.

## Architecture

```
Create Round → Attach Entries → Start Round → Collect Metrics
                                                    ↓
                                         Apply Reality Adjustments
                                                    ↓
                                         Compute Scores + Confidence
                                                    ↓
                                         Determine Winner
                                                    ↓
                               ┌─────────────────────┼─────────────────────┐
                               ↓                     ↓                     ↓
                        Promote Winner         Retire Loser        Trigger Evolution
```

## Components

### Database (Migration 131)

3 tables created:
- `combat_rounds` - A/B testing rounds configuration
- `combat_entries` - Individual creatives competing
- `combat_results` - Winner/loser determination and insights

### Backend Services

Located in `src/lib/creativeCombat/`:

1. **combatTypes.ts** - Type definitions
2. **combatRoundService.ts** - Create, start, complete rounds
3. **combatEntryService.ts** - Attach entries, compute metrics
4. **combatWinnerService.ts** - Determine winner with statistical confidence
5. **combatIntegrationService.ts** - Promote winners, retire losers, trigger evolution
6. **combatSchedulerService.ts** - Run combat cycles

### API Routes

- `POST /api/combat/rounds` - Create or start rounds
- `GET /api/combat/rounds` - List rounds, get stats
- `POST /api/combat/results` - Run combat cycle
- `GET /api/combat/results` - List results, get integrations

### UI Components

- `CombatRoundsTable.tsx` - List rounds and status
- `CombatEntriesTable.tsx` - Display competing creatives
- `CombatResultCard.tsx` - Visual winner/loser summary

### Founder Page

`/founder/combat` - Combat dashboard with:
- Round stats (total, completed, running, pending, inconclusive)
- Integration stats (promoted, retired, evolutions)
- Tabbed view: Rounds and Results
- Actions: Run combat cycle, start pending rounds

## Combat Strategies

### Classic A/B
Standard two-variant test with statistical significance threshold.

### Multivariate
Multiple variants (A/B/C/D) for complex testing scenarios.

### Rapid Cycle
Quick iteration with lower sample size requirements.

## Scoring Algorithm

### Raw Metrics Collected
- Impressions, Clicks, Conversions
- Likes, Shares, Comments, Saves
- Reach, Cost, CTR, CPC, CPA

### Reality Adjustments
- Seasonality factor
- Fatigue factor
- Confidence adjustment (data completeness)

### Composite Score Weights
- Conversions: 40%
- Clicks: 25%
- Engagement: 20%
- Efficiency: 15%

### Confidence Calculation
Based on sample size (impressions):
- < 100: 30%
- < 500: 50%
- < 1000: 70%
- < 5000: 85%
- ≥ 5000: 95%

## Winner Determination

### Statistical Significance
Combines:
- Relative score difference
- Sample size factor
- Average confidence

### Confidence Bands
- **Low**: < 70%
- **Medium**: 70-85%
- **High**: 85-95%
- **Very High**: > 95%

### Result Types
- **Winner**: Clear winner with > 5% lift
- **Tie**: < 5% difference
- **Inconclusive**: Below confidence threshold (< 60%)

## Truth Layer Constraints

1. Winner determination uses real, adjusted metrics only
2. If confidence < 0.6, round is declared inconclusive
3. Narratives disclose uncertainty and truth completeness
4. AI explanations cannot alter or reinterpret metric values
5. AI only explains results, does not decide winners

## Integration Actions

### Promote Winner
- Winning creative gets priority in orchestration pool
- Logged for audit trail

### Retire Loser
- Losing creative removed from rotation
- Prevents wasted spend

### Trigger Evolution
- Only for significant wins (> 10% lift)
- Signals VIF to create variations

## Usage

### Create Combat Round
```typescript
import { createRound, attachEntry, startRound } from '@/lib/creativeCombat';

// Create round
const round = await createRound({
  clientId: 'client-uuid',
  workspaceId: 'workspace-uuid',
  channel: 'linkedin',
  strategy: 'classic_ab',
});

// Attach entries
await attachEntry({
  roundId: round.id,
  creativeAssetId: 'asset-a-uuid',
  variant: 'A',
});

await attachEntry({
  roundId: round.id,
  creativeAssetId: 'asset-b-uuid',
  variant: 'B',
});

// Start round
await startRound(round.id);
```

### Update Metrics
```typescript
import { updateEntryMetrics, applyRealityAdjustments } from '@/lib/creativeCombat';

// Update with platform metrics
await updateEntryMetrics(entryId, {
  impressions: 5000,
  clicks: 250,
  conversions: 15,
  likes: 300,
  shares: 45,
});

// Apply reality adjustments
await applyRealityAdjustments(entryId);
```

### Determine Winner
```typescript
import { determineWinner, processIntegrations } from '@/lib/creativeCombat';

// Determine winner
const result = await determineWinner(roundId);

console.log(`Result: ${result.resultType}`);
console.log(`Winner score: ${result.winnerScore}`);
console.log(`Lift: ${result.scoreLiftPercent}%`);

// Process integrations
const integrations = await processIntegrations(roundId);
// { promoted: true, retired: true, evolved: false }
```

### Run Combat Cycle
```typescript
import { runCombatCycle } from '@/lib/creativeCombat';

const result = await runCombatCycle('workspace-uuid');

console.log(`Rounds processed: ${result.roundsProcessed}`);
console.log(`Winners found: ${result.winnersFound}`);
console.log(`Promoted: ${result.integrations.promoted}`);
```

## Files Created

### Migration
- `supabase/migrations/131_creative_combat_engine.sql`

### Backend (7 files)
- `src/lib/creativeCombat/combatTypes.ts`
- `src/lib/creativeCombat/combatRoundService.ts`
- `src/lib/creativeCombat/combatEntryService.ts`
- `src/lib/creativeCombat/combatWinnerService.ts`
- `src/lib/creativeCombat/combatIntegrationService.ts`
- `src/lib/creativeCombat/combatSchedulerService.ts`
- `src/lib/creativeCombat/index.ts`

### API Routes (2 files)
- `src/app/api/combat/rounds/route.ts`
- `src/app/api/combat/results/route.ts`

### UI Components (3 files)
- `src/components/creativeCombat/CombatRoundsTable.tsx`
- `src/components/creativeCombat/CombatEntriesTable.tsx`
- `src/components/creativeCombat/CombatResultCard.tsx`

### Pages
- `src/app/founder/combat/page.tsx`

## Integration Points

- **Phase 84**: MCOE asset selection (winner promotion)
- **Phase 85**: Posting engine (execution tracking)
- **Phase 86**: Scaling mode (capacity awareness)
- **Phase 87**: Execution layer (metrics source)
- **VIF**: Evolution triggers for winning patterns

## Summary Generation

AI generates result summaries with constraints:
- Must use real data only
- Must disclose uncertainty
- Must not infer future performance
- Cannot alter metric values

Example summary:
```markdown
## Winner: Variant A

**Score**: 78.50 vs 45.20
**Lift**: +73.6%
**Confidence**: HIGH

### Performance Breakdown
- Impressions: 5,000 vs 4,800
- Clicks: 250 vs 120
- Conversions: 15 vs 8

---
*Results based on actual performance data. Past performance does not guarantee future results.*
```

## Next Steps

1. Add real platform API integrations for metric collection
2. Implement automated round creation from MCOE
3. Add A/B test preview functionality
4. Create combat analytics dashboard
5. Implement creative mutation based on winning patterns
