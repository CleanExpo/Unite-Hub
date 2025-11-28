# P2-T1: Mock Data Sources Inventory

**Date**: 2025-11-28
**Status**: COMPLETE

---

## Executive Summary

**Good News**: Agent stubs have already been wired to real Claude API calls. The mock generator functions exist but are dead code.

**Files with Mock/Demo Patterns**: 100+ files (mostly test files)
**Critical Production Files**: 8 files need attention
**Dead Code for Removal**: 4 mock generator functions

---

## Mock Data Categories

### 1. Dead Code (REMOVE) - P2-T2

**File**: `src/lib/synthex/synthexAgiBridge.ts`
**Lines**: 721-890 (approximately)

```typescript
// DEAD CODE - Never called, safe to remove
function generateMockContentResult(jobType, payload)     // Line 721
function generateMockResearchResult(jobType, payload)    // Line 789
function generateMockAnalysisResult(jobType, payload)    // Line 820
function generateMockWorkflowSteps(jobType, payload)     // Line 853
```

**Status**: These functions are defined but never called. The actual agent executors now use real Claude API via `getLLMClient()`:
- `executeContentAgent()` → `llmClient.generateContent()`
- `executeResearchAgent()` → `llmClient.researchSEO()`
- `executeAnalysisAgent()` → `llmClient.analyzeMetrics()`
- `executeCoordinationAgent()` → `llmClient.analyzeStrategy()`

**Action**: Remove dead mock functions (lines 715-890)

---

### 2. Demo Data Module (WRAP WITH ENV FLAG) - P2-T3

**File**: `src/lib/demo-data.ts` (242 lines)

**Contents**:
- `DEMO_ORG_ID` - Hardcoded demo org ID
- `demoTeamMembers` - 4 mock team members
- `demoContacts` - 3 mock contacts
- `demoCampaigns` - 3 mock campaigns
- `demoWorkspaces` - 3 mock workspaces
- `demoSettings` - Mock organization/user settings

**Helper Functions**:
- `getDemoContacts()`
- `getDemoCampaigns()`
- `getDemoWorkspaces()`
- `getDemoSettings()`
- `getDemoTeamMembers()`
- `isDemoMode()` - Checks localStorage/NODE_ENV
- `enableDemoMode()` / `disableDemoMode()`

**Current Usage**: `isDemoMode()` checks `NODE_ENV === 'development'`

**Issue**: Demo mode is enabled for ALL development, which pollutes local testing.

**Action**: Change to explicit `NEXT_PUBLIC_DEMO_MODE=true` flag

---

### 3. Test Mocks (ACCEPTABLE) - No Action Needed

**Location**: `src/lib/__tests__/*.test.ts` (50+ files)

These are legitimate test mocks and should NOT be removed:
- `consensusService.test.ts`
- `xeroSync.test.ts`
- `strategySimulation.test.ts`
- etc.

**Status**: Expected behavior for test files

---

### 4. Placeholder Services (REVIEW) - P2-T3

**File**: `src/lib/gmail/storage.ts`

**Status**: Returns placeholder messages for cloud storage operations.

**Current Behavior**:
```typescript
// Logs warning and returns informative placeholder
console.warn('Gmail storage not fully implemented');
return { message: 'Cloud storage deferred' };
```

**Action**: Acceptable graceful degradation, document in Known Limitations

---

### 5. SEO Integration Mocks (CHECK API STATUS) - P2-T4

**Files**:
- `src/lib/seo/no-bluff-protocol.ts` - Has `isMockData` flag pattern
- `src/lib/seo/personaAwareSeo.ts` - Uses real config, no mocks

**Pattern**: SEO functions properly tag mock data when API is in test mode.

**Action**: Verify platform mode toggle is wired correctly

---

## Files Requiring Action

### Critical (P2-T2 Agent Stubs)

| File | Lines | Action |
|------|-------|--------|
| `src/lib/synthex/synthexAgiBridge.ts` | 715-890 | Remove dead mock generators |

### Medium (P2-T3 Demo Fallbacks)

| File | Issue | Action |
|------|-------|--------|
| `src/lib/demo-data.ts` | Always active in dev | Add explicit env flag |
| `src/lib/gmail/storage.ts` | Placeholder ops | Document as known limitation |

### Low (P2-T4 Environment Modes)

| File | Issue | Action |
|------|-------|--------|
| `src/lib/seo/no-bluff-protocol.ts` | Needs mode verification | Verify platform mode wiring |
| `src/lib/visual/visualSectionRegistry.ts` | Has sample sections | Verify persona overrides |

---

## Agent Status Summary

**All agents are now production-ready with real API calls**:

| Agent | Status | API Call |
|-------|--------|----------|
| content_agent | ✅ REAL | `llmClient.generateContent()` |
| research_agent | ✅ REAL | `llmClient.researchSEO()` |
| analysis_agent | ✅ REAL | `llmClient.analyzeMetrics()` |
| coordination_agent | ✅ REAL | `llmClient.analyzeStrategy()` |

**Previous Assessment Was Incorrect**: The P1 inventory marked 3 agents as returning mock data. Upon code review, all agents call real LLM APIs. The mock generator functions exist but are never invoked.

---

## Recommendations

### Immediate (P2-T2)
1. Remove dead mock generators from synthexAgiBridge.ts
2. Update P1 inventory to reflect correct agent status

### Short-term (P2-T3)
1. Add `NEXT_PUBLIC_DEMO_MODE` env variable
2. Update `isDemoMode()` to check explicit flag
3. Default demo mode to OFF in all environments

### Verification (P2-T4)
1. Test platform mode toggle (test/live)
2. Verify SEO APIs respond to mode changes
3. Confirm Stripe test/live mode separation

---

**Generated**: 2025-11-28
**Audit Task**: P2-T1
