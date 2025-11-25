# Remaining Build Errors - Fix Plan

## Status
This document tracks the 25 Vercel build errors discovered after fixing the initial 43 syntax errors.

## Fixed So Far (6/25)
✅ Duplicate `result` variables (4 files)
✅ Invalid escape sequences in rate-limit-tiers.ts (4 lines)

## Remaining to Fix (19/25)

### Category 1: Incorrect Function Imports (7 errors)

#### 1. `src/app/api/council/route.ts:3`
- **Error**: `castVote` doesn't exist
- **Fix**: Change to `submitVote`
```typescript
// Line 3: import { getSessions, createSession, castVote, resolveSession } from '@/lib/council';
//  should be:
import { getSessions, createSession, submitVote, resolveSession } from '@/lib/council';
// Also update usage on line ~XX
```

#### 2. `src/app/api/memory/compress/route.ts:8`
- **Error**: `compressMemory` doesn't exist
- **Fix**: Change to `compressAndStore`
```typescript
// Line 8: import { compressMemory } from '@/lib/memoryCompression';
// should be:
import { compressAndStore } from '@/lib/memoryCompression';
```

#### 3. `src/app/api/agent-mandates/route.ts:3`
- **Error**: `createMandate` doesn't exist
- **Fix**: Change to `updateMandate`
```typescript
// Line 3: import { getMandates, createMandate, validateAction } from '@/lib/agentMandates';
// should be:
import { getMandates, updateMandate, validateAction } from '@/lib/agentMandates';
```

#### 4. `src/app/api/production/jobs/route.ts:10`
- **Error**: `createProductionJob` doesn't exist
- **Fix**: Change to `createJob`
```typescript
// Lines 10: createProductionJob,
// should be:
createJob,
```

#### 5. `src/app/api/aido/google-curve/analyze/route.ts:5`
- **Error**: `createRecommendation` doesn't exist
- **Fix**: Change to `createStrategyRecommendation`
```typescript
// Line 5: import { createRecommendation } from '@/lib/aido/database/strategy-recommendations';
// should be:
import { createStrategyRecommendation } from '@/lib/aido/database/strategy-recommendations';
```

#### 6. `src/app/api/aido/content/generate/route.ts:3`
- **Error**: `generateAlgorithmicImmuneContent` doesn't exist
- **Fix**: TBD - need to check what the correct export name is

#### 7. Additional import errors (partial log cut off)
- Need full build log to identify remaining import errors

### Category 2: METHOD_REGISTRY / Catalog Exports (Multiple errors)

#### `src/lib/visual/campaign/visualCampaignEngine.ts:7`
- **Errors**: `METHOD_REGISTRY`, `getMethodById`, `getMethodsByCategory`, `filterMethods` don't exist
- **Root Cause**: These exports don't exist in `catalog.ts`, only in `metadata.ts`
- **Fix**: Replace catalog imports with metadata imports
```typescript
// Line 7: import { METHOD_REGISTRY, getMethodById, getMethodsByCategory, filterMethods } from '../methods/catalog';
// should be:
import {
  METHOD_METADATA_REGISTRY as METHOD_REGISTRY,
  getMethodMetadata as getMethodById,
  getMethodsByCategory,
  getAllMethodMetadata
} from '../methods/metadata';
// Note: filterMethods doesn't exist - may need to implement or remove usage
```

## Implementation Plan

### Phase 1: Fix Import Errors (30 min)
1. Fix council route (castVote → submitVote)
2. Fix memory/compress route (compressMemory → compressAndStore)
3. Fix agent-mandates route (createMandate → updateMandate)
4. Fix production/jobs route (createProductionJob → createJob)
5. Fix google-curve route (createRecommendation → createStrategyRecommendation)
6. Investigate and fix generateAlgorithmicImmuneContent error
7. Get full build log to identify remaining errors

### Phase 2: Fix Catalog/Registry Exports (15 min)
1. Update visualCampaignEngine.ts imports
2. Check for other files importing from catalog.ts
3. Implement filterMethods if needed or remove usages

### Phase 3: Test and Deploy (10 min)
1. Commit all fixes with descriptive message
2. Push to GitHub
3. Monitor Vercel build
4. Verify all pages return HTTP 200

## Notes
- Some of these errors suggest the codebase has incomplete/WIP features
- May need to stub out missing functions or remove incomplete features
- Turbopack is catching errors that local dev (with cache) might miss
