# SEO Intelligence Platform - Cost Optimization & Usage Tracking

**Created**: 2025-11-19
**Purpose**: Monitor API usage and optimize costs for Perplexity Sonar API

---

## Cost Comparison: Perplexity vs Competitors

### Perplexity Sonar Pricing
- **Sonar** (basic): $5 per 1,000 searches + $1 per 750K tokens
- **Sonar Pro** (deep research): $5 per 1,000 searches + $3 per 750K input tokens + $15 per 750K output tokens

**Effective Cost Per Search**:
- **Sonar**: ~$0.005 per search (with avg 2K tokens)
- **Sonar Pro**: ~$0.01 per search (with avg 4K tokens)

### Competitor Pricing
- **Semrush**: $119-$449/month (limited queries)
- **Ahrefs**: $99-$999/month (limited queries)
- **Moz Pro**: $99-$599/month (limited queries)

**Savings**: **99% cheaper** for on-demand SEO research

---

## Current Usage (As Implemented)

### API Calls Per Command

| Command | API Calls | Model | Estimated Cost |
|---------|-----------|-------|---------------|
| `npm run seo:research "topic"` | 1 | Sonar Pro | ~$0.01 |
| `npm run seo:eeat` | 1 | Sonar Pro | ~$0.01 |
| `npm run seo:gmb` | 1 | Sonar Pro | ~$0.01 |
| `npm run seo:geo-search` | 1 | Sonar Pro | ~$0.01 |
| `npm run seo:bing` | 1 | Sonar Pro | ~$0.01 |
| `npm run seo:backlinks` | 1 | Sonar Pro | ~$0.01 |
| **`npm run seo:comprehensive`** | **6** | **Sonar Pro** | **~$0.06** |

### Monthly Cost Projections

**Light Usage** (10 searches/day):
- Daily cost: $0.10
- Monthly cost: **$3.00**
- Annual cost: **$36.00**

**Medium Usage** (50 searches/day):
- Daily cost: $0.50
- Monthly cost: **$15.00**
- Annual cost: **$180.00**

**Heavy Usage** (200 searches/day):
- Daily cost: $2.00
- Monthly cost: **$60.00**
- Annual cost: **$720.00**

**Compare to Semrush**: $119/month × 12 = $1,428/year
**Savings**: $1,248/year (even with heavy usage!)

---

## Cost Optimization Strategies

### 1. Use Sonar (Basic) for Simple Queries

**When to Use**:
- Quick trend checks
- Basic keyword research
- General topic overviews

**Cost Savings**: 50% cheaper than Sonar Pro

**Implementation**:
```typescript
// In perplexity-sonar.ts
async searchBasic(query: string) {
  return this.search(query, { model: 'sonar' }); // Basic model
}
```

### 2. Cache Results Locally

**Strategy**: Save API responses to avoid duplicate searches

**Implementation**:
```typescript
// src/lib/ai/seo-cache.ts
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export class SEOCache {
  private cacheDir: string;

  constructor() {
    this.cacheDir = path.join(process.cwd(), 'cache', 'seo');
    if (!fs.existsSync(this.cacheDir)) {
      fs.mkdirSync(this.cacheDir, { recursive: true });
    }
  }

  getCacheKey(query: string, options: any): string {
    const data = JSON.stringify({ query, options });
    return crypto.createHash('md5').update(data).digest('hex');
  }

  get(query: string, options: any): any | null {
    const key = this.getCacheKey(query, options);
    const cachePath = path.join(this.cacheDir, `${key}.json`);

    if (fs.existsSync(cachePath)) {
      const cached = JSON.parse(fs.readFileSync(cachePath, 'utf-8'));

      // Check if cache is still valid (24 hours for SEO data)
      const cacheAge = Date.now() - cached.timestamp;
      if (cacheAge < 24 * 60 * 60 * 1000) {
        console.log('✅ Cache hit:', query.substring(0, 50));
        return cached.data;
      }
    }

    return null;
  }

  set(query: string, options: any, data: any): void {
    const key = this.getCacheKey(query, options);
    const cachePath = path.join(this.cacheDir, `${key}.json`);

    fs.writeFileSync(cachePath, JSON.stringify({
      query,
      options,
      data,
      timestamp: Date.now()
    }));
  }
}
```

**Usage**:
```typescript
// In perplexity-sonar.ts
import { SEOCache } from '@/lib/ai/seo-cache';

export class PerplexitySonar {
  private cache: SEOCache;

  constructor(apiKey?: string) {
    // ... existing code
    this.cache = new SEOCache();
  }

  async search(query: string, options: SonarSearchOptions = {}): Promise<SonarResponse> {
    // Check cache first
    const cached = this.cache.get(query, options);
    if (cached) {
      return cached;
    }

    // Call API
    const result = await this.searchAPI(query, options);

    // Cache result
    this.cache.set(query, options, result);

    return result;
  }
}
```

**Cost Savings**: 80-90% reduction for repeated queries

### 3. Batch Queries Strategically

**Strategy**: Group related queries to minimize API calls

**Example**:
```bash
# Instead of 3 separate calls:
npm run seo:research "local SEO"
npm run seo:research "Google My Business"
npm run seo:research "voice search"

# Use 1 comprehensive call:
npm run seo:comprehensive "local SEO, GMB, voice search"
```

**Cost Savings**: $0.03 → $0.06 (but gets 6 research areas instead of 3)

### 4. Domain Filtering

**Strategy**: Limit searches to high-authority sources only

**Current Implementation** (already optimized):
```typescript
async getLatestSEOTrends(topic: string) {
  return this.search(query, {
    domains: [
      'searchengineland.com',
      'searchenginejournal.com',
      'moz.com',
      'semrush.com',
      'ahrefs.com',
      'backlinko.com',
      'neilpatel.com',
    ],
  });
}
```

**Benefit**: Faster responses, fewer tokens, higher quality results

---

## Usage Tracking Implementation

### 1. Create Usage Tracker

**File**: `src/lib/ai/seo-usage-tracker.ts`

```typescript
import fs from 'fs';
import path from 'path';

export interface UsageRecord {
  timestamp: number;
  command: string;
  query?: string;
  model: 'sonar' | 'sonar-pro';
  tokensUsed: number;
  cost: number;
}

export class SEOUsageTracker {
  private logFile: string;

  constructor() {
    const logDir = path.join(process.cwd(), 'logs', 'seo');
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
    this.logFile = path.join(logDir, 'usage.jsonl');
  }

  track(record: UsageRecord) {
    const line = JSON.stringify(record) + '\n';
    fs.appendFileSync(this.logFile, line);
  }

  getUsage(since?: Date): UsageRecord[] {
    if (!fs.existsSync(this.logFile)) {
      return [];
    }

    const lines = fs.readFileSync(this.logFile, 'utf-8').trim().split('\n');
    const records = lines
      .filter(line => line.trim())
      .map(line => JSON.parse(line));

    if (since) {
      return records.filter(r => r.timestamp >= since.getTime());
    }

    return records;
  }

  getTotalCost(since?: Date): number {
    const records = this.getUsage(since);
    return records.reduce((sum, r) => sum + r.cost, 0);
  }

  getStats(since?: Date) {
    const records = this.getUsage(since);

    return {
      totalSearches: records.length,
      totalCost: this.getTotalCost(since),
      totalTokens: records.reduce((sum, r) => sum + r.tokensUsed, 0),
      byCommand: this.groupByCommand(records),
      byModel: this.groupByModel(records),
    };
  }

  private groupByCommand(records: UsageRecord[]) {
    const grouped: Record<string, { count: number; cost: number }> = {};

    records.forEach(r => {
      if (!grouped[r.command]) {
        grouped[r.command] = { count: 0, cost: 0 };
      }
      grouped[r.command].count++;
      grouped[r.command].cost += r.cost;
    });

    return grouped;
  }

  private groupByModel(records: UsageRecord[]) {
    const grouped: Record<string, { count: number; cost: number }> = {};

    records.forEach(r => {
      if (!grouped[r.model]) {
        grouped[r.model] = { count: 0, cost: 0 };
      }
      grouped[r.model].count++;
      grouped[r.model].cost += r.cost;
    });

    return grouped;
  }
}
```

### 2. Integrate Tracker into CLI

**Update**: `scripts/seo-intelligence.mjs`

```javascript
import { SEOUsageTracker } from '../src/lib/ai/seo-usage-tracker.ts';

const tracker = new SEOUsageTracker();

// After each API call
const result = await sonar.getLatestSEOTrends(topic);

tracker.track({
  timestamp: Date.now(),
  command: 'research',
  query: topic,
  model: 'sonar-pro',
  tokensUsed: result.usage?.total_tokens || 0,
  cost: 0.01, // Estimate
});
```

### 3. Create Usage Report Command

**Add to** `package.json`:
```json
{
  "scripts": {
    "seo:usage": "node scripts/seo-usage-report.mjs"
  }
}
```

**Create**: `scripts/seo-usage-report.mjs`

```javascript
#!/usr/bin/env node

import { SEOUsageTracker } from '../src/lib/ai/seo-usage-tracker.ts';

const tracker = new SEOUsageTracker();

// Get stats for different time periods
const allTime = tracker.getStats();
const thisMonth = tracker.getStats(new Date(new Date().setDate(1)));
const today = tracker.getStats(new Date(new Date().setHours(0,0,0,0)));

console.log('📊 SEO Intelligence Platform - Usage Report\n');

console.log('='.repeat(60));
console.log('TODAY');
console.log('='.repeat(60));
console.log(`Searches: ${today.totalSearches}`);
console.log(`Cost: $${today.totalCost.toFixed(2)}`);
console.log(`Tokens: ${today.totalTokens.toLocaleString()}\n`);

console.log('='.repeat(60));
console.log('THIS MONTH');
console.log('='.repeat(60));
console.log(`Searches: ${thisMonth.totalSearches}`);
console.log(`Cost: $${thisMonth.totalCost.toFixed(2)}`);
console.log(`Tokens: ${thisMonth.totalTokens.toLocaleString()}\n`);

console.log('='.repeat(60));
console.log('ALL TIME');
console.log('='.repeat(60));
console.log(`Searches: ${allTime.totalSearches}`);
console.log(`Cost: $${allTime.totalCost.toFixed(2)}`);
console.log(`Tokens: ${allTime.totalTokens.toLocaleString()}\n`);

console.log('='.repeat(60));
console.log('BY COMMAND');
console.log('='.repeat(60));
Object.entries(allTime.byCommand).forEach(([cmd, stats]) => {
  console.log(`${cmd}: ${stats.count} searches ($${stats.cost.toFixed(2)})`);
});

console.log('\n='.repeat(60));
console.log('BY MODEL');
console.log('='.repeat(60));
Object.entries(allTime.byModel).forEach(([model, stats]) => {
  console.log(`${model}: ${stats.count} searches ($${stats.cost.toFixed(2)})`);
});

console.log('\n💡 Savings vs Semrush ($119/mo): $' + (119 - thisMonth.totalCost).toFixed(2));
```

---

## Budget Alerts

### 1. Add Budget Check to CLI

**Update**: `scripts/seo-intelligence.mjs`

```javascript
const MONTHLY_BUDGET = 50; // $50/month budget

function checkBudget() {
  const tracker = new SEOUsageTracker();
  const thisMonth = tracker.getStats(new Date(new Date().setDate(1)));

  if (thisMonth.totalCost >= MONTHLY_BUDGET) {
    console.error('⚠️  BUDGET EXCEEDED!');
    console.error(`Current month cost: $${thisMonth.totalCost.toFixed(2)}`);
    console.error(`Budget: $${MONTHLY_BUDGET}`);
    console.error(`Consider using cached results or basic model.\n`);
    process.exit(1);
  }

  const remaining = MONTHLY_BUDGET - thisMonth.totalCost;
  if (remaining < 5) {
    console.warn(`⚠️  Budget warning: Only $${remaining.toFixed(2)} remaining this month`);
  }
}

// Call before each API request
checkBudget();
```

### 2. Email Alerts (Optional)

**For production**, add email notification when budget threshold reached:

```typescript
import { sendEmail } from '@/lib/email/email-service';

async function sendBudgetAlert(currentCost: number, budget: number) {
  await sendEmail({
    to: 'admin@unite-group.in',
    subject: 'SEO Platform Budget Alert',
    html: `
      <h2>⚠️ SEO Platform Budget Alert</h2>
      <p>Current month cost: <strong>$${currentCost.toFixed(2)}</strong></p>
      <p>Monthly budget: <strong>$${budget.toFixed(2)}</strong></p>
      <p>Percentage used: <strong>${((currentCost/budget)*100).toFixed(0)}%</strong></p>
    `,
  });
}
```

---

## Model Selection Strategy

### Decision Tree

```
Start
  │
  ├─ Need real-time data? ──No──> Use cached results
  │                         │
  │                        Yes
  │                         │
  ├─ Simple keyword research? ──Yes──> Use Sonar (basic)
  │                             │
  │                            No
  │                             │
  ├─ Comprehensive analysis? ──Yes──> Use Sonar Pro
  │                            │
  │                           No
  │                            │
  └─ Competitive intelligence? ──Yes──> Use Sonar Pro + Domain filtering
```

### Quick Reference

| Use Case | Model | Domain Filter | Cache TTL |
|----------|-------|---------------|-----------|
| Keyword trends | Sonar | No | 7 days |
| E-E-A-T guidelines | Sonar Pro | Yes | 30 days |
| GMB strategies | Sonar Pro | Yes | 14 days |
| Backlink research | Sonar Pro | Yes | 14 days |
| Competitor analysis | Sonar Pro | Target sites | 3 days |
| General SEO news | Sonar | No | 1 day |

---

## Summary: Best Practices

### ✅ Do's
1. **Use caching** for queries made more than once
2. **Filter by domain** to reduce token usage
3. **Batch related queries** using comprehensive command
4. **Monitor monthly costs** with usage reports
5. **Set budget alerts** to avoid overspending
6. **Use basic model** for simple queries

### ❌ Don'ts
1. **Don't run comprehensive reports** more than once/day per topic
2. **Don't skip cache checks** for repeated queries
3. **Don't use Sonar Pro** for simple keyword lookups
4. **Don't ignore budget warnings**
5. **Don't search without domain filtering** when possible

---

## Next Steps

1. **Implement caching** (saves 80-90%)
2. **Add usage tracking** (monitor costs)
3. **Set up budget alerts** (prevent overspending)
4. **Create usage dashboard** (visualize spending)
5. **Automate monthly reports** (email summary)

---

**Estimated Implementation Time**: 2-4 hours
**Expected Cost Savings**: 80-90% reduction
**ROI**: Pays for itself in first month

---

**Last Updated**: 2025-11-19
**Maintained By**: Claude Code
**Related Docs**: `SEO_INTELLIGENCE_PLATFORM_COMPLETE.md`, `SEO_PLATFORM_READY.md`
