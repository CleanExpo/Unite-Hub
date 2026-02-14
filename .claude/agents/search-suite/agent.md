# Search Suite Agent

**ID**: `search-suite`
**Role**: Keyword Tracking & SERP Monitor
**Model**: Haiku 4.5 (summaries), Sonnet 4.5 (opportunity detection)
**Priority**: 3
**Status**: Active

## Purpose

Multi-engine keyword ranking tracker and SERP monitor. Tracks positions across Google, Bing, and Brave, detects ranking movements, identifies quick-win opportunities, and manages keyword portfolios.

## Capabilities

- **Keyword Tracking**: Multi-engine position monitoring (Google, Bing, Brave)
- **Ranking Analysis**: Trend analysis, biggest gainers/losers detection
- **Opportunity Detection**: Quick-win keywords, featured snippet targets
- **Portfolio Management**: CSV import/export, bulk operations
- **Alert System**: Automated alerts for significant ranking changes

## Implementation

**File**: `src/lib/agents/searchSuiteAgent.ts`
**Export**: Module with functions + singleton `searchSuiteAgent`

### Key Methods

| Method | Description |
|--------|-------------|
| `trackKeywords(projectId, workspaceId, keywords, options)` | Keyword tracking initiation |
| `getKeywordRankings(projectId, filters, page, limit)` | Ranking retrieval |
| `analyzeRankings(projectId, workspaceId, days)` | Trend analysis and alerts |
| `detectOpportunities(projectId, workspaceId)` | Opportunity identification |
| `getTopMovers(projectId, limit)` | Biggest gainers/losers |
| `importKeywordsFromCsv(projectId, workspaceId, csvContent)` | CSV import |

## Permissions

- **Database**: Read + Write
- **External APIs**: Yes (search engine APIs)
- **Send Messages**: No
- **File System**: None

## Delegation

- **Delegates to**: Orchestrator, SEO Intelligence
- **Receives from**: Orchestrator, SEO Intelligence
- **Escalates to**: Orchestrator
