# Phase B30: AI Competitor Intelligence & Market Radar

**Status**: Complete
**Date**: 2025-12-07
**Phase**: B30 of Synthex Portal

## Overview

Phase B30 implements a comprehensive competitor intelligence system with competitor tracking, keyword gap analysis, SERP monitoring, and AI-powered competitive forecasting. It enables businesses to monitor competitors and identify strategic opportunities.

## Components Implemented

### 1. Database Migration (436_synthex_competitor_intel.sql)

**Tables Created**:
- `synthex_competitor_profiles` - Competitor company profiles
- `synthex_competitor_keywords` - Keyword tracking per competitor
- `synthex_competitor_serp` - SERP position snapshots over time
- `synthex_competitor_alerts` - Alert rules for position changes
- `synthex_competitor_reports` - AI-generated competitor analysis reports

**Key Features**:
- Generated column `position_change` for SERP tracking
- Alert priority levels: low, medium, high, critical
- Comprehensive metadata JSON for flexible data storage
- Full RLS policies for multi-tenant isolation

### 2. Service Layer (competitorIntelligenceService.ts)

**Core Functions**:
- `monitorCompetitor(tenantId, data)` - Add competitor to monitoring
- `getCompetitors(tenantId)` - List all monitored competitors
- `getCompetitorKeywords(tenantId, competitorId)` - Get tracked keywords
- `fetchCompetitorSERP(tenantId, keyword)` - Fetch SERP positions

**AI-Powered Functions**:
- `generateCompetitorReport(tenantId, competitorId)` - AI competitive analysis
- `competitorForecast(tenantId, competitorId)` - Predict future moves

**Alert Functions**:
- `generateAlerts(tenantId)` - Auto-generate alerts from position changes
- `getAlerts(tenantId, status)` - List alerts by status
- `updateAlertStatus(tenantId, alertId, status)` - Manage alert workflow

### 3. API Routes

**GET/POST/PATCH/DELETE /api/synthex/competitors**
- List, create, update, delete competitor profiles
- Query params: tenantId

**GET/POST /api/synthex/competitors/serp**
- GET: List SERP history for a competitor
- POST: Record new SERP snapshot

**GET/POST/PATCH /api/synthex/competitors/alerts**
- GET: List alerts with optional status filter
- POST: Create manual alerts
- PATCH: Update alert status (new, acknowledged, resolved, dismissed)

### 4. UI Page (/synthex/competitors)

**Features**:
- Dashboard tab with competitor cards showing domain and keywords
- Alerts tab with priority-based filtering
- Keyword Gaps tab for competitive analysis
- Add Competitor form with domain and notes
- Real-time alert badges with priority colors
- Dark theme consistent with Synthex portal

## Usage Examples

### Add Competitor
```typescript
const competitor = await monitorCompetitor('tenant-123', {
  name: 'Competitor Inc',
  domain: 'competitor.com',
  notes: 'Main competitor in local market'
});
```

### Track Keywords
```typescript
const keywords = await getCompetitorKeywords('tenant-123', 'competitor-id');
```

### Generate AI Report
```typescript
const report = await generateCompetitorReport('tenant-123', 'competitor-id');
// Returns comprehensive analysis with strengths, weaknesses, opportunities
```

### Competitive Forecast
```typescript
const forecast = await competitorForecast('tenant-123', 'competitor-id');
// Returns predicted moves, market positioning, recommended actions
```

## Alert Types

- **rank_drop**: Position decreased significantly
- **rank_gain**: Position improved significantly
- **new_competitor**: New competitor detected
- **content_change**: Major content update detected
- **backlink_surge**: Unusual backlink activity

## Alert Priorities

- **critical**: Immediate attention required (e.g., lost #1 position)
- **high**: Important changes affecting traffic
- **medium**: Notable changes to monitor
- **low**: Minor fluctuations

## Dependencies

- Anthropic Claude API (for AI analysis)
- Supabase client libraries
- Optional: SERP API integration (DataForSEO, SEMrush)

## Migration Notes

Run migration 436 in Supabase SQL Editor:
```sql
\i supabase/migrations/436_synthex_competitor_intel.sql
```

## Related Phases

- B10: SEO Reports (keyword data)
- B29: Knowledge Graph (competitor nodes)
- B25: Brand Intelligence (market positioning)
