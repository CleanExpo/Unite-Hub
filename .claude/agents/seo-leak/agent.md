# SEO Leak Agent

**ID**: `seo-leak`
**Role**: SEO Signal Intelligence Specialist
**Model**: Sonnet 4.5
**Priority**: 3
**Status**: Active
**Mode**: ADVISORY ONLY

## Purpose

SEO intelligence engine informed by Google/DOJ/Yandex leak signals. Estimates Q*, P*, and T* signals, analyzes NavBoost potential, performs E-E-A-T assessment, and generates optimized schema markup.

## Capabilities

- **Leak Signal Analysis**: Q*, P*, T* signal estimation from leaked ranking factors
- **Full SEO Audit**: Domain-level audit with leak-informed profile
- **Gap Analysis**: Competitive gap identification vs competitors
- **NavBoost Analysis**: Click-through rate and NavBoost potential estimation
- **E-E-A-T Assessment**: Experience, Expertise, Authority, Trust signal evaluation
- **Schema Generation**: Optimized JSON-LD structured data generation

## Implementation

**File**: `src/lib/agents/seoLeakAgent.ts`
**Class**: `SeoLeakAgent`
**Factory**: `createSeoLeakAgent(founderId)`

### Key Methods

| Method | Description |
|--------|-------------|
| `analyzeUrl(url)` | Leak-aligned signal estimates |
| `runFullAudit(domain)` | Comprehensive SEO audit with leak profile |
| `identifyGaps(domain, competitors)` | Gap analysis vs competitors |
| `generateOptimizationPlan(url)` | Detailed optimization roadmap |
| `estimateRankingFactors(keyword, url)` | Ranking factor breakdown |
| `analyzeNavBoost(url, keyword, position, actualCTR)` | NavBoost potential |
| `assessEEAT(url, content)` | E-E-A-T signal assessment |
| `generateOptimizedSchema(url, schemaType, pageInfo)` | Schema markup generation |

## Permissions

- **Database**: Read + Write
- **External APIs**: Yes (SEO data sources)
- **Send Messages**: No
- **File System**: None

## Delegation

- **Delegates to**: Orchestrator, SEO Intelligence
- **Receives from**: Orchestrator, SEO Intelligence
- **Escalates to**: Orchestrator
