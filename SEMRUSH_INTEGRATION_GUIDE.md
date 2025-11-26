# SEMRush Integration Guide for Unite-Hub

**Date**: 2025-11-26
**Status**: ✅ Ready for Implementation
**API Version**: v3 (Standard API) & v4 (OAuth)
**MCP Support**: ✅ Available (Native Integration)

---

## Table of Contents

1. [Overview](#overview)
2. [Official Documentation](#official-documentation)
3. [API Architecture](#api-architecture)
4. [Authentication](#authentication)
5. [Endpoints & Capabilities](#endpoints--capabilities)
6. [Rate Limits](#rate-limits)
7. [Implementation Options](#implementation-options)
8. [MCP Server Setup](#mcp-server-setup)
9. [CLI Integration](#cli-integration)
10. [Code Implementation](#code-implementation)
11. [Test/Live Mode Configuration](#testlive-mode-configuration)

---

## Overview

SEMRush provides unified SEO intelligence through multiple API versions and now supports **Model Context Protocol (MCP)** for seamless AI integration. Your project can leverage:

- **Trends API**: Market intelligence, competitive analysis, traffic data
- **Standard API**: SEO analytics, keyword research, backlinks, domain metrics
- **Native MCP Server**: Direct integration with AI agents (Claude, Cursor, Windsurf)

---

## Official Documentation

### Primary Resources
- **Main Portal**: [developer.semrush.com/api/](https://developer.semrush.com/api/)
- **API Introduction**: [developer.semrush.com/api/basics/introduction/](https://developer.semrush.com/api/basics/introduction/)
- **Use Cases**: [developer.semrush.com/api/basics/use-cases/](https://developer.semrush.com/api/basics/use-cases/)
- **Knowledge Base**: [semrush.com/kb/5-api](https://www.semrush.com/kb/5-api)
- **API Documentation**: [semrush.com/api-documentation/](https://www.semrush.com/api-documentation/)

### MCP Server Resources
- **Official Announcement**: [Semrush MCP News](https://www.semrush.com/news/423229-new-mcp-server-bridges-data-and-ai-with-effortless-api-integration/)
- **GitHub Implementation**: [mrkooblu/semrush-mcp](https://github.com/mrkooblu/semrush-mcp)
- **Alternative Node.js**: [metehan777/semrush-mcp](https://github.com/metehan777/semrush-mcp)
- **Python Version**: [universal-mcp-semrush](https://pypi.org/project/universal-mcp-semrush/)
- **MCPHub Registry**: [Semrush MCP Server](https://mcp.composio.dev/semrush)

---

## API Architecture

### API Versions

**Version 3** (Traditional REST):
- Uses API key-based authentication
- Response formats: CSV (Analytics/Trends), JSON (Projects)
- Analytics API, Projects API, Trends API, Backlinks API
- Established and widely documented

**Version 4** (Modern OAuth):
- OAuth 2.0 authentication (no API key required)
- JSON response format exclusively
- Projects API (v4), Listing Management API, Map Rank Tracker API
- Newer endpoints, preferred for new integrations

### Choosing Your Version

| Requirement | Version | Reason |
|-------------|---------|--------|
| **Keyword Research** | v3 | Most comprehensive, keyword difficulty data |
| **Domain/Backlink Analysis** | v3 | Full backlink data available |
| **Trends/Traffic Data** | v3 or v4 | Both support, v4 is modern |
| **New Integrations** | v4 | OAuth is recommended |
| **AI/MCP Usage** | Both | MCP server supports both |

---

## Authentication

### API v3: Key-Based Authentication

**Getting Your API Key**:
1. Log into Semrush account
2. Go to Settings → Subscription Info
3. Copy your "API Key"

**How to Use**:
```bash
# Format: https://api.semrush.com/?type=REPORT_TYPE&key=YOUR_API_KEY&...

curl "https://api.semrush.com/?type=phrase_kdi&key=YOUR_API_KEY&phrase=keyword&database=au"
```

**Example TypeScript Implementation**:
```typescript
const SEMRUSH_API_KEY = process.env.SEMRUSH_API_KEY;
const baseUrl = 'https://api.semrush.com/';

export async function querySemrushV3(reportType: string, params: Record<string, string>) {
  const queryParams = new URLSearchParams({
    type: reportType,
    key: SEMRUSH_API_KEY,
    ...params,
  });

  const response = await fetch(`${baseUrl}?${queryParams.toString()}`);
  return response.text(); // v3 returns CSV
}
```

### API v4: OAuth Authentication

**For new integrations**, use OAuth 2.0:

```typescript
const semrushOAuth = {
  clientId: process.env.SEMRUSH_CLIENT_ID,
  clientSecret: process.env.SEMRUSH_CLIENT_SECRET,
  redirectUri: 'https://yourdomain.com/auth/semrush/callback',
};

export async function getSemrushOAuthToken(authCode: string) {
  const response = await fetch('https://oauth.semrush.com/oauth2/access_token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code: authCode,
      client_id: semrushOAuth.clientId,
      client_secret: semrushOAuth.clientSecret,
      redirect_uri: semrushOAuth.redirectUri,
    }),
  });

  return response.json();
}
```

---

## Endpoints & Capabilities

### Key Report Types (v3)

| Report Type | Parameter | Returns | Use Case |
|-------------|-----------|---------|----------|
| **Keyword Difficulty** | `phrase_kdi` | Difficulty score | Keyword competitiveness |
| **Domain Overview** | `domain_overview` | Metrics | Competitor analysis |
| **Organic Keywords** | `domain_organic` | Rankings | SEO positions |
| **Backlinks Overview** | `backlinks_overview` | Link data | Authority metrics |
| **Related Keywords** | `phrase_related` | Suggestions | Content ideas |
| **Traffic Summary** | `domain_traffic_summary` | Traffic metrics | Market insight |
| **SERP Features** | `domain_serp_features` | Feature data | SERP analysis |

### v4 API Endpoints (JSON)

- `/api/v4/projects` - Project management
- `/api/v4/keyword-rank-tracker` - Rank tracking
- `/api/v4/local-listings` - Local business data
- `/api/v4/backlinks` - Backlink metrics

---

## Rate Limits

**Standard Rate Limits**:
- **10 requests per second** from one IP address
- **10 concurrent requests** per account
- **Trends API**: 10 req/sec with monthly quota (subscription-dependent)

**Special Limits**:
- **Listing Management UpdateLocation**: 5 req/sec per user
- **Listing Management UpdateLocations**: 5 req/min per user (max 50 locations)

**Best Practice for Your SaaS**:
```typescript
// Implement queue with rate limiting
import PQueue from 'p-queue';

const semrushQueue = new PQueue({
  concurrency: 8,           // 8 of 10 concurrent
  interval: 1000,           // 1 second
  maxSize: 9,               // Max 9 per second (leave buffer)
});

export async function rateLimitedSemrushQuery(params: any) {
  return semrushQueue.add(() => querySemrushV3(params));
}
```

---

## Implementation Options

### Option 1: Direct API Integration (Recommended for Your Project)

**Pros**:
- Full control
- Custom error handling
- Test/Live switching easy
- Cost-effective

**Cons**:
- Manual endpoint management
- Handle CSV parsing
- Rate limit management

**Implementation Time**: 4-6 hours

### Option 2: MCP Server Integration (New, Native Support)

**Pros**:
- Native Claude/AI integration
- Pre-built tools
- No custom coding
- Semrush-maintained

**Cons**:
- Limited to supported tools
- Less custom control
- Newer (less battle-tested)

**Implementation Time**: 1-2 hours

### Option 3: CLI Tool Integration (Legacy)

**Status**: Inactive/Discontinued
- Python package: `semrush-cli` (no updates in 12+ months)
- Not recommended for new projects
- Community-maintained

---

## MCP Server Setup

### Official Semrush MCP Server

The native Semrush MCP Server provides:
- **Trends API** access (market, competitor, traffic data)
- **Standard API** access (SEO, keyword, backlink data)
- **One-time setup** across all agents
- **No complex coding** required

**Getting Started**:

1. **Verify Subscription**: Standard (SEO Business plan) or Trends (Basic/Premium)
2. **Get API Key**: From Subscription Info page
3. **Configure MCP**: Add to `.claude/mcp.json`:

```json
{
  "mcpServers": {
    "semrush": {
      "command": "npx",
      "args": ["@semrush/mcp-server"],
      "env": {
        "SEMRUSH_API_KEY": "your-api-key-here"
      }
    }
  }
}
```

4. **Test Connection**: Use in Claude/Cursor with prompts like:
   - "Analyze keyword difficulty for 'web design services'"
   - "Show domain metrics for my competitor"
   - "Find related keywords for 'SEO'"

### Community Implementations

**Node.js Version** (mrkooblu):
```bash
git clone https://github.com/mrkooblu/semrush-mcp
cd semrush-mcp
npm install
npm run build
```

**Python Version**:
```bash
pip install universal-mcp-semrush
python -m semrush_mcp
```

---

## CLI Integration

### Historical Context

The `semrush-cli` Python package was available but is now **inactive** (no updates in 12+ months).

**Status**: Not recommended for new projects

If you need command-line integration, consider:
1. Writing custom shell scripts calling the API directly
2. Using the Node.js MCP server with CLI wrapping
3. Building your own CLI using the official API

---

## Code Implementation

### Step 1: Create Semrush Client

**File: `src/lib/seo/semrushClient.ts`**

```typescript
import axios from 'axios';
import { getSystemMode } from '@/src/lib/system/getSystemMode';
import { getProviderSettings } from './getProviderSettings';
import PQueue from 'p-queue';

// Rate limiting queue: 9 req/sec (leave buffer from 10 limit)
const semrushQueue = new PQueue({
  concurrency: 8,
  interval: 1000,
  maxSize: 9,
});

interface SemrushKeywordData {
  keyword: string;
  difficulty: number;
  searchVolume: number;
  cpc: number;
  competitiveness: number;
}

interface SemrushDomainOverview {
  domain: string;
  trafficVolume: number;
  trafficChange: number;
  backlinks: number;
  refDomains: number;
  topKeywords: string[];
}

export async function querySemrushKeywordDifficulty(
  keyword: string,
  database: string = 'au'
): Promise<SemrushKeywordData | null> {
  const settings = await getProviderSettings();
  if (!settings.semrush?.enabled) return null;

  const mode = await getSystemMode();
  const apiKey = mode === 'test'
    ? process.env.SEMRUSH_TEST_KEY
    : settings.semrush.api_key;

  if (!apiKey) {
    console.error('SEMRush API key not configured');
    return null;
  }

  try {
    const result = await semrushQueue.add(() =>
      axios.get('https://api.semrush.com/', {
        params: {
          type: 'phrase_kdi',
          key: apiKey,
          phrase: keyword,
          database: database,
        },
      })
    );

    // Parse CSV response: keyword|difficulty|volume|cpc|competitiveness
    const lines = result.data.trim().split('\n');
    if (lines.length < 2) return null;

    const [keyword, difficulty, volume, cpc, competitiveness] = lines[1].split('|');

    return {
      keyword: keyword.trim(),
      difficulty: parseInt(difficulty) || 0,
      searchVolume: parseInt(volume) || 0,
      cpc: parseFloat(cpc) || 0,
      competitiveness: parseFloat(competitiveness) || 0,
    };
  } catch (error) {
    console.error('SEMRush keyword query failed:', error);
    return null;
  }
}

export async function querySemrushDomainOverview(
  domain: string,
  database: string = 'au'
): Promise<SemrushDomainOverview | null> {
  const settings = await getProviderSettings();
  if (!settings.semrush?.enabled) return null;

  const mode = await getSystemMode();
  const apiKey = mode === 'test'
    ? process.env.SEMRUSH_TEST_KEY
    : settings.semrush.api_key;

  if (!apiKey) {
    console.error('SEMRush API key not configured');
    return null;
  }

  try {
    const result = await semrushQueue.add(() =>
      axios.get('https://api.semrush.com/', {
        params: {
          type: 'domain_overview',
          key: apiKey,
          domain: domain,
          database: database,
        },
      })
    );

    // Parse CSV: domain|traffic|traffic_change|backlinks|ref_domains|top_keywords
    const lines = result.data.trim().split('\n');
    if (lines.length < 2) return null;

    const [d, traffic, change, backlinks, refs, keywords] = lines[1].split('|');

    return {
      domain: d.trim(),
      trafficVolume: parseFloat(traffic) || 0,
      trafficChange: parseFloat(change) || 0,
      backlinks: parseInt(backlinks) || 0,
      refDomains: parseInt(refs) || 0,
      topKeywords: keywords?.split(',').slice(0, 5) || [],
    };
  } catch (error) {
    console.error('SEMRush domain query failed:', error);
    return null;
  }
}

export async function querySemrushRelatedKeywords(
  keyword: string,
  database: string = 'au'
): Promise<string[]> {
  const settings = await getProviderSettings();
  if (!settings.semrush?.enabled) return [];

  const mode = await getSystemMode();
  const apiKey = mode === 'test'
    ? process.env.SEMRUSH_TEST_KEY
    : settings.semrush.api_key;

  if (!apiKey) return [];

  try {
    const result = await semrushQueue.add(() =>
      axios.get('https://api.semrush.com/', {
        params: {
          type: 'phrase_related',
          key: apiKey,
          phrase: keyword,
          database: database,
        },
      })
    );

    // Parse CSV: each line is a related keyword
    return result.data
      .trim()
      .split('\n')
      .slice(1)
      .map(line => line.split('|')[0]?.trim())
      .filter(Boolean)
      .slice(0, 20);
  } catch (error) {
    console.error('SEMRush related keywords failed:', error);
    return [];
  }
}
```

### Step 2: Update SEO Intelligence Engine

**File: `src/lib/seo/seoIntelligenceEngine.ts`**

```typescript
import { queryDataForSEO } from './dataforseoClient';
import {
  querySemrushKeywordDifficulty,
  querySemrushDomainOverview,
  querySemrushRelatedKeywords,
} from './semrushClient';
import { getProviderSettings } from './getProviderSettings';

export interface SeoAnalysisResult {
  keyword: string;
  domain: string;
  sources: {
    dataforseo: any;
    semrush: any;
  };
  merged: {
    difficulty: number | null;
    searchVolume: number | null;
    trends: any;
    topCompetitors: string[];
    relatedKeywords: string[];
    reliability: 'high' | 'medium' | 'low';
  };
  timestamp: string;
}

export async function runSeoAnalysis({
  keyword,
  domain,
  database = 'au',
}: {
  keyword: string;
  domain: string;
  database?: string;
}): Promise<SeoAnalysisResult> {
  const settings = await getProviderSettings();
  const results: SeoAnalysisResult = {
    keyword,
    domain,
    sources: {
      dataforseo: null,
      semrush: null,
    },
    merged: {
      difficulty: null,
      searchVolume: null,
      trends: null,
      topCompetitors: [],
      relatedKeywords: [],
      reliability: 'low',
    },
    timestamp: new Date().toISOString(),
  };

  // Query DataForSEO (if enabled)
  if (settings.dataforseo?.enabled) {
    results.sources.dataforseo = await queryDataForSEO(keyword, domain);
  }

  // Query SEMRush (if enabled)
  if (settings.semrush?.enabled) {
    const [keywordData, domainData, relatedKeywords] = await Promise.all([
      querySemrushKeywordDifficulty(keyword, database),
      querySemrushDomainOverview(domain, database),
      querySemrushRelatedKeywords(keyword, database),
    ]);

    results.sources.semrush = {
      keyword: keywordData,
      domain: domainData,
      related: relatedKeywords,
    };

    // Merge results
    if (keywordData) {
      results.merged.difficulty = keywordData.difficulty;
      results.merged.searchVolume = keywordData.searchVolume;
    }

    if (domainData) {
      results.merged.topCompetitors = domainData.topKeywords;
    }

    if (relatedKeywords.length > 0) {
      results.merged.relatedKeywords = relatedKeywords;
    }
  }

  // Calculate reliability
  const sourceCount = [
    results.sources.dataforseo ? 1 : 0,
    results.sources.semrush ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  if (sourceCount === 2) {
    results.merged.reliability = 'high';
  } else if (sourceCount === 1) {
    results.merged.reliability = 'medium';
  }

  return results;
}
```

### Step 3: Create API Route

**File: `src/app/api/seo/analyze/route.ts`**

```typescript
import { runSeoAnalysis } from '@/src/lib/seo/seoIntelligenceEngine';
import { getUserRole } from '@/src/lib/rbac/getUserRole';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { keyword, domain, userId } = await req.json();

    if (!keyword || !domain) {
      return NextResponse.json(
        { error: 'keyword and domain are required' },
        { status: 400 }
      );
    }

    // Verify user is admin
    const role = await getUserRole(userId);
    if (role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const result = await runSeoAnalysis({ keyword, domain });

    return NextResponse.json(result);
  } catch (error) {
    console.error('SEO analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze SEO data' },
      { status: 500 }
    );
  }
}
```

---

## Test/Live Mode Configuration

### Database Schema

**File: `supabase/migrations/261_seo_providers.sql`**

```sql
-- SEO Providers Configuration Table
CREATE TABLE IF NOT EXISTS seo_providers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL CHECK (provider IN ('dataforseo', 'semrush')),
  enabled boolean DEFAULT true,
  api_key text,
  test_mode boolean DEFAULT false,
  last_tested_at timestamptz,
  last_test_status text,
  last_error text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(provider)
);

-- Insert default providers
INSERT INTO seo_providers (provider, enabled, test_mode)
VALUES
  ('dataforseo', true, false),
  ('semrush', true, false)
ON CONFLICT (provider) DO NOTHING;

-- RLS Policies (admin-only access)
ALTER TABLE seo_providers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_view_seo_providers"
  ON seo_providers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

CREATE POLICY "admin_update_seo_providers"
  ON seo_providers FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );
```

### Environment Variables

**`.env.local`** (Development):
```env
# SEMRush API Keys
SEMRUSH_API_KEY=your-production-key-here
SEMRUSH_TEST_KEY=your-test-key-here

# DataForSEO Keys (for comparison)
DATAFORSEO_API_KEY=your-production-key-here
DATAFORSEO_TEST_KEY=your-test-key-here

# System Mode
SYSTEM_MODE=development  # 'test' for testing, 'production' for live
```

**Vercel Environment** (Production):
```
SEMRUSH_API_KEY → your-production-key
SEMRUSH_TEST_KEY → your-test-key
SYSTEM_MODE → production
```

### Settings Management File

**File: `src/lib/seo/getProviderSettings.ts`**

```typescript
import { getSupabaseServer } from '@/lib/supabase';

export interface ProviderSettings {
  semrush?: {
    enabled: boolean;
    api_key?: string;
    test_mode: boolean;
    last_tested_at?: string;
    last_status?: string;
  };
  dataforseo?: {
    enabled: boolean;
    api_key?: string;
    test_mode: boolean;
    last_tested_at?: string;
    last_status?: string;
  };
}

export async function getProviderSettings(): Promise<ProviderSettings> {
  try {
    const supabase = await getSupabaseServer();
    const { data } = await supabase
      .from('seo_providers')
      .select('*');

    const settings: ProviderSettings = {};

    data?.forEach((provider) => {
      settings[provider.provider] = {
        enabled: provider.enabled,
        api_key: provider.api_key,
        test_mode: provider.test_mode,
        last_tested_at: provider.last_tested_at,
        last_status: provider.last_test_status,
      };
    });

    return settings;
  } catch (error) {
    console.error('Failed to get provider settings:', error);
    return {};
  }
}

export async function updateProviderSettings(
  provider: 'semrush' | 'dataforseo',
  updates: Partial<ProviderSettings[keyof ProviderSettings]>
) {
  const supabase = await getSupabaseServer();
  return supabase
    .from('seo_providers')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('provider', provider);
}
```

---

## Best Practices for Your Integration

### 1. Always Use Rate Limiting Queue

```typescript
import PQueue from 'p-queue';

// 8 of 10 allowed, 1 second window
const queue = new PQueue({ concurrency: 8, interval: 1000, maxSize: 9 });
```

### 2. Test Mode for Development

```typescript
const apiKey = process.env.SYSTEM_MODE === 'test'
  ? process.env.SEMRUSH_TEST_KEY
  : process.env.SEMRUSH_API_KEY;
```

### 3. Cache Results (24 hours)

```typescript
// Cache SEO analysis to avoid duplicate queries
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

export async function getCachedSeoAnalysis(keyword: string, domain: string) {
  const key = `${keyword}:${domain}`;
  const cached = cache.get(key);

  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  const result = await runSeoAnalysis({ keyword, domain });
  cache.set(key, { data: result, timestamp: Date.now() });
  return result;
}
```

### 4. Error Handling

```typescript
export async function querySemrushSafe(keyword: string) {
  try {
    return await querySemrushKeywordDifficulty(keyword);
  } catch (error) {
    // Log to audit trail
    console.error('SEMRush query failed:', error);
    // Return null, don't break the pipeline
    return null;
  }
}
```

### 5. Provider Switching

```typescript
// If SEMRush fails, automatically try DataForSEO
export async function getSeoDataWithFallback(keyword: string) {
  const semrushResult = await querySemrushKeywordDifficulty(keyword);
  if (semrushResult) return { provider: 'semrush', ...semrushResult };

  const dfsResult = await queryDataForSEO(keyword, 'au');
  if (dfsResult) return { provider: 'dataforseo', ...dfsResult };

  return null; // Both failed
}
```

---

## Database Migrations Required

```sql
-- 1. Create seo_providers table (migration 261)
-- 2. Create seo_analysis_cache table for caching
-- 3. Create seo_audit_log table for tracking API usage

CREATE TABLE seo_analysis_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  keyword text,
  domain text,
  provider text,
  result jsonb,
  expires_at timestamptz,
  created_at timestamptz DEFAULT now(),
  UNIQUE(keyword, domain, provider)
);

CREATE TABLE seo_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  query_type text,
  keyword text,
  domain text,
  provider text,
  success boolean,
  error_message text,
  api_units_used integer,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_seo_cache_expires ON seo_analysis_cache(expires_at);
CREATE INDEX idx_seo_audit_user ON seo_audit_log(user_id, created_at);
```

---

## API Endpoint Usage Examples

### Example 1: Keyword Difficulty Analysis

```typescript
// Frontend: src/app/synthex/dashboard/page.tsx
const [difficulty, setDifficulty] = useState(null);

async function analyzeKeyword(keyword: string) {
  const response = await fetch('/api/seo/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      keyword,
      domain: 'example.com',
      userId: currentUser.id,
    }),
  });

  const result = await response.json();
  setDifficulty(result.merged.difficulty);
}
```

### Example 2: Domain Competitor Analysis

```typescript
const [competitor, setCompetitor] = useState(null);

async function analyzeCompetitor(domain: string) {
  const response = await fetch('/api/seo/analyze', {
    method: 'POST',
    body: JSON.stringify({
      keyword: 'your-target-keyword',
      domain: domain,
      userId: currentUser.id,
    }),
  });

  const result = await response.json();
  setCompetitor(result.sources.semrush.domain);
}
```

---

## Troubleshooting

### Issue: "API key not found"
**Solution**: Verify `SEMRUSH_API_KEY` is set in `.env.local` or Vercel environment

### Issue: Rate limit exceeded (429)
**Solution**: Reduce concurrency in PQueue or add exponential backoff

### Issue: CSV parsing errors
**Solution**: Verify response format. Semrush v3 returns CSV; check delimiter is `|`

### Issue: Test mode not switching
**Solution**: Check `SYSTEM_MODE` environment variable and restart dev server

---

## Implementation Timeline

**Phase 1**: Database schema & environment setup (30 min)
**Phase 2**: Semrush client implementation (1-2 hours)
**Phase 3**: API route & error handling (1 hour)
**Phase 4**: Frontend integration & caching (1-2 hours)
**Phase 5**: Testing with live API keys (1 hour)
**Phase 6**: Monitoring & optimization (ongoing)

**Total**: 4-7 hours

---

## Cost Optimization

- **API Units**: Each query uses X units depending on report type
- **Caching**: Reduces API calls by 80-90%
- **Batch Processing**: Group keyword queries to optimize
- **Free Tier**: Available for testing (limited units)
- **Business Plan**: $120-1200/month for Semrush subscription

---

## Next Steps

1. ✅ Verify Semrush API key is added to .env.local and Vercel
2. ⬜ Run database migration 261
3. ⬜ Implement `semrushClient.ts`
4. ⬜ Update `seoIntelligenceEngine.ts`
5. ⬜ Create `/api/seo/analyze` route
6. ⬜ Test with sample keywords
7. ⬜ Integrate into synthex dashboard
8. ⬜ Set up caching & monitoring

---

## Resources

- **API Docs**: https://developer.semrush.com/api/basics/introduction/
- **MCP Server**: https://github.com/mrkooblu/semrush-mcp
- **Rate Limits**: https://www.semrush.com/kb/5-api
- **Use Cases**: https://developer.semrush.com/api/basics/use-cases/
- **Support**: developer@semrush.com or +1 (800) 815-9959

---

**Generated**: 2025-11-26
**Version**: 1.0
**Status**: Ready for Implementation
