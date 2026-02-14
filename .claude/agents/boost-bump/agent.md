# Boost Bump Agent

**ID**: `boost-bump`
**Role**: White-Hat SEO Boost Orchestrator
**Model**: Sonnet 4.5 (analysis), Haiku 4.5 (insights)
**Priority**: 3
**Status**: Active
**Mode**: HUMAN_GOVERNED

## Purpose

Orchestrates white-hat SEO boost campaigns with a human-governed approval workflow. Analyzes boost opportunities, creates jobs requiring founder approval, schedules execution, and tracks performance results.

## Boost Types

- `organic_engagement` — Natural engagement improvement
- `content_quality` — Content depth and quality enhancement
- `user_experience` — UX and page speed optimization
- `technical_seo` — Technical SEO fixes
- `local_visibility` — Local SEO and Google Business optimization

## Capabilities

- **Opportunity Analysis**: Assess boost potential for URL + keyword combinations
- **Job Management**: Create, approve, reject, schedule, execute boost jobs
- **Approval Workflow**: All executions require human approval
- **Results Tracking**: Before/after ranking comparison with metrics
- **Performance Analysis**: Aggregate boost campaign effectiveness

## Implementation

**File**: `src/lib/agents/boostBumpAgent.ts`
**Export**: Module with functions + singleton `boostBumpAgent`

### Key Methods

| Method | Description |
|--------|-------------|
| `analyzeBoostOpportunity(url, keyword, geoTarget, currentRank)` | Strategy recommendation |
| `createBoostJobWithAnalysis(businessId, url, keyword, geoTarget, userId, opts)` | Job creation |
| `getPendingJobsForReview(businessId)` | Review queue |
| `approveJob(jobId, userId, notes)` | Approval workflow |
| `executeApprovedBoost(jobId, userId)` | Execution (HUMAN_GOVERNED) |
| `recordJobResults(jobId, beforeRank, afterRank, metrics, userId)` | Results recording |
| `analyzeBoostResults(businessId)` | Performance analysis |

## Permissions

- **Database**: Read + Write
- **External APIs**: Yes
- **Send Messages**: No
- **File System**: None
- **Approval Required**: `execute_boost`, `schedule_boost`

## Delegation

- **Delegates to**: Orchestrator, SEO Leak Agent
- **Receives from**: Orchestrator
- **Escalates to**: Orchestrator
