# SEMRush Integration - Quick Start Guide

**Status**: Ready to Implement
**Time**: 4-7 hours
**Difficulty**: Medium
**Date**: 2025-11-26

---

## 🚀 TL;DR

You have the SEMRush API key configured. Here's what's needed:

1. ✅ **API Key**: Already in `.env.local` and Vercel
2. ⬜ **Database**: Run migration 261
3. ⬜ **Backend**: Implement semrushClient.ts (2 hours)
4. ⬜ **API Route**: Create `/api/seo/analyze` (30 min)
5. ⬜ **Frontend**: Build SEO analysis component (1-2 hours)
6. ⬜ **Testing**: Verify with live keywords (1 hour)
7. ⬜ **Deploy**: Push to Vercel

---

## 📚 Official Documentation

| Resource | Link | Purpose |
|----------|------|---------|
| **API Docs** | [developer.semrush.com/api/](https://developer.semrush.com/api/) | All endpoints, authentication, rate limits |
| **Introduction** | [API Basics](https://developer.semrush.com/api/basics/introduction/) | How to authenticate, API versions, endpoints |
| **Knowledge Base** | [semrush.com/kb/5-api](https://www.semrush.com/kb/5-api) | FAQ, troubleshooting, best practices |
| **MCP Server** | [Semrush MCP News](https://www.semrush.com/news/423229-new-mcp-server-bridges-data-and-ai-with-effortless-api-integration/) | AI integration, Model Context Protocol |

---

## 🔑 Key Facts

### Authentication
- **Type**: API Key (v3) or OAuth 2.0 (v4)
- **Your Key Location**: `SEMRUSH_API_KEY` environment variable
- **You already have**: ✅ API key in .env.local and Vercel

### Rate Limits
- **10 requests per second** (from one IP)
- **10 concurrent requests** per account
- **Implementation**: Use PQueue with 8 concurrent, 1 sec interval

### API Versions
- **v3**: CSV responses, keyword data, domain metrics (recommended for this project)
- **v4**: JSON responses, OAuth, newer endpoints

### Response Format
- **v3 Analytics API**: CSV format (pipe-delimited `|`)
- **v4 All APIs**: JSON format

---

## 📋 Implementation Steps

### Step 1: Database (30 minutes)

**Create migration `261_seo_providers.sql`**:
```sql
CREATE TABLE seo_providers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL CHECK (provider IN ('dataforseo', 'semrush')),
  enabled boolean DEFAULT true,
  api_key text,
  test_mode boolean DEFAULT false,
  last_tested_at timestamptz,
  last_test_status text,
  created_at timestamptz DEFAULT now()
);

INSERT INTO seo_providers (provider) VALUES ('semrush'), ('dataforseo');
```

Run in Supabase Dashboard → SQL Editor

### Step 2: Backend - SEMRush Client (1-2 hours)

**Create `src/lib/seo/semrushClient.ts`**:

```typescript
import axios from 'axios';
import PQueue from 'p-queue';

const queue = new PQueue({ concurrency: 8, interval: 1000, maxSize: 9 });

export async function querySemrushKeywordDifficulty(keyword: string) {
  const apiKey = process.env.SEMRUSH_API_KEY;

  const response = await queue.add(() =>
    axios.get('https://api.semrush.com/', {
      params: {
        type: 'phrase_kdi',
        key: apiKey,
        phrase: keyword,
        database: 'au',
      },
    })
  );

  // Parse CSV: keyword|difficulty|volume|cpc|competitiveness
  const lines = response.data.trim().split('\n');
  const [kw, difficulty, volume, cpc] = lines[1].split('|');

  return {
    keyword: kw.trim(),
    difficulty: parseInt(difficulty),
    searchVolume: parseInt(volume),
    cpc: parseFloat(cpc),
  };
}

export async function querySemrushDomainOverview(domain: string) {
  const apiKey = process.env.SEMRUSH_API_KEY;

  const response = await queue.add(() =>
    axios.get('https://api.semrush.com/', {
      params: {
        type: 'domain_overview',
        key: apiKey,
        domain: domain,
        database: 'au',
      },
    })
  );

  const lines = response.data.trim().split('\n');
  const [d, traffic, backlinks, refs] = lines[1].split('|');

  return {
    domain: d.trim(),
    traffic: parseFloat(traffic),
    backlinks: parseInt(backlinks),
    refDomains: parseInt(refs),
  };
}
```

### Step 3: API Route (30 minutes)

**Create `src/app/api/seo/analyze/route.ts`**:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { querySemrushKeywordDifficulty, querySemrushDomainOverview } from '@/src/lib/seo/semrushClient';
import { getUserRole } from '@/src/lib/rbac/getUserRole';

export async function POST(req: NextRequest) {
  try {
    const { keyword, domain, userId } = await req.json();

    // Check admin access
    const role = await getUserRole(userId);
    if (role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Query SEMRush
    const [kwData, domData] = await Promise.all([
      querySemrushKeywordDifficulty(keyword),
      querySemrushDomainOverview(domain),
    ]);

    return NextResponse.json({
      keyword: kwData,
      domain: domData,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('SEO analysis failed:', error);
    return NextResponse.json({ error: 'Analysis failed' }, { status: 500 });
  }
}
```

### Step 4: Frontend Component (1-2 hours)

**Create `src/components/seo/SeoAnalysisPanel.tsx`**:

```typescript
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function SeoAnalysisPanel({ userId }: { userId: string }) {
  const [keyword, setKeyword] = useState('');
  const [domain, setDomain] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  async function handleAnalyze() {
    setLoading(true);
    try {
      const response = await fetch('/api/seo/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword, domain, userId }),
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error('Analysis failed:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-4 border rounded-lg">
      <h2 className="text-lg font-bold mb-4">SEO Analysis</h2>

      <div className="space-y-4">
        <Input
          placeholder="Enter keyword (e.g., web design)"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
        />

        <Input
          placeholder="Enter domain (e.g., example.com)"
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
        />

        <Button onClick={handleAnalyze} disabled={loading}>
          {loading ? 'Analyzing...' : 'Analyze'}
        </Button>
      </div>

      {result && (
        <div className="mt-6 p-4 bg-gray-50 rounded">
          <h3 className="font-bold mb-2">{result.keyword.keyword}</h3>
          <p>Difficulty: {result.keyword.difficulty}/100</p>
          <p>Search Volume: {result.keyword.searchVolume.toLocaleString()}</p>
          <p>CPC: ${result.keyword.cpc.toFixed(2)}</p>

          <h3 className="font-bold mt-4 mb-2">{result.domain.domain}</h3>
          <p>Traffic: {result.domain.traffic.toLocaleString()}</p>
          <p>Backlinks: {result.domain.backlinks.toLocaleString()}</p>
          <p>Ref Domains: {result.domain.refDomains}</p>
        </div>
      )}
    </div>
  );
}
```

### Step 5: Integrate into Dashboard

**In `src/app/synthex/dashboard/page.tsx`**:

```typescript
import { SeoAnalysisPanel } from '@/components/seo/SeoAnalysisPanel';

export default function Dashboard() {
  const { user } = useAuth();

  return (
    <div>
      {/* ... existing dashboard content ... */}
      <SeoAnalysisPanel userId={user?.id} />
    </div>
  );
}
```

### Step 6: Test Locally

```bash
# 1. Start dev server
npm run dev

# 2. Go to dashboard
# http://localhost:3008/synthex/dashboard

# 3. Enter test keyword: "web design"
# 4. Enter test domain: "example.com.au"
# 5. Click "Analyze"

# Expected results:
# Difficulty: 60-80
# Search Volume: 10000-50000
# Traffic: 1000-5000
```

### Step 7: Deploy to Vercel

```bash
git add -A
git commit -m "feat: Add SEMRush SEO analysis integration"
git push origin main
```

Monitor Vercel dashboard for successful deployment.

---

## 🧪 Test Data

Try these keywords to verify:

| Keyword | Expected Difficulty | Expected Volume |
|---------|-------------------|-----------------|
| "web design" | 70+ | 50,000+ |
| "SEO services" | 75+ | 40,000+ |
| "graphic design" | 65+ | 30,000+ |
| "digital marketing Brisbane" | 40-50 | 5,000-10,000 |
| "custom web design services" | 30-40 | 1,000-5,000 |

---

## ⚠️ Important Notes

### Rate Limiting
- 10 requests/second limit enforced
- PQueue manages this automatically
- Never make >10 concurrent requests

### CSV Parsing
- V3 API returns CSV (pipe-delimited `|`)
- Header line is skipped (index 1 = first data row)
- Empty responses = keyword with no data

### Error Handling
```typescript
try {
  const result = await querySemrushKeywordDifficulty('keyword');
  if (!result) {
    // No data available
  }
} catch (error) {
  // API call failed
}
```

### Test Mode
```typescript
const apiKey = process.env.SYSTEM_MODE === 'test'
  ? process.env.SEMRUSH_TEST_KEY
  : process.env.SEMRUSH_API_KEY;
```

---

## 🐛 Troubleshooting

| Problem | Solution |
|---------|----------|
| "API key not found" | Check `SEMRUSH_API_KEY` in .env.local |
| "429 Too Many Requests" | PQueue not limiting properly, check concurrency |
| "Invalid CSV format" | Verify response starts with header, data on line 1 |
| "Network timeout" | Add retry logic or increase timeout |
| "Access Denied (403)" | API key may be invalid or expired |

---

## 📊 API Response Examples

### Keyword Difficulty Response
```
keyword|difficulty|volume|cpc|competitiveness
web design|72|45820|8.50|0.88
```

### Domain Overview Response
```
domain|traffic|traffic_change|backlinks|ref_domains
example.com|15280|+3.2%|45230|1850
```

---

## 🔗 Additional Resources

- **Full Integration Guide**: [SEMRUSH_INTEGRATION_GUIDE.md](./SEMRUSH_INTEGRATION_GUIDE.md)
- **Implementation Checklist**: [SEMRUSH_IMPLEMENTATION_CHECKLIST.md](./SEMRUSH_IMPLEMENTATION_CHECKLIST.md)
- **API Documentation**: [developer.semrush.com/api/](https://developer.semrush.com/api/)

---

## ✅ Success Checklist

- [ ] Database migration 261 created and run
- [ ] `semrushClient.ts` implemented
- [ ] `/api/seo/analyze` route created
- [ ] `SeoAnalysisPanel` component built
- [ ] Component integrated into dashboard
- [ ] Tested locally with sample keywords
- [ ] Results match expected difficulty/volume
- [ ] Rate limiting working (no 429 errors)
- [ ] Deployed to Vercel
- [ ] Production test successful

---

## 🚀 Next Steps

1. **Read Full Guide**: [SEMRUSH_INTEGRATION_GUIDE.md](./SEMRUSH_INTEGRATION_GUIDE.md)
2. **Follow Checklist**: [SEMRUSH_IMPLEMENTATION_CHECKLIST.md](./SEMRUSH_IMPLEMENTATION_CHECKLIST.md)
3. **Create Database Migration**: `supabase/migrations/261_seo_providers.sql`
4. **Implement Backend**: `src/lib/seo/semrushClient.ts`
5. **Create API Route**: `src/app/api/seo/analyze/route.ts`
6. **Build Frontend**: `src/components/seo/SeoAnalysisPanel.tsx`
7. **Test & Deploy**

---

**Generated**: 2025-11-26
**Status**: Ready to Implement
**Estimated Time**: 4-7 hours
**API Key**: ✅ Already configured

Sources:
- [SEMRush API Documentation](https://developer.semrush.com/api/)
- [API Basics & Authentication](https://developer.semrush.com/api/basics/introduction/)
- [SEMRush Knowledge Base](https://www.semrush.com/kb/5-api)
- [SEMRush MCP Server](https://www.semrush.com/news/423229-new-mcp-server-bridges-data-and-ai-with-effortless-api-integration/)
- [GitHub: SEMRush MCP](https://github.com/mrkooblu/semrush-mcp)
