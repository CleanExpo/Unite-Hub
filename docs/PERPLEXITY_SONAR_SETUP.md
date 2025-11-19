# Perplexity Sonar Integration - Real-Time SEO Intelligence

**Created**: 2025-11-19
**Purpose**: Use Perplexity Sonar API for real-time SEO research, E-E-A-T analysis, GEO search trends, GMB optimization, and competitive intelligence
**Cost**: $5 per 1,000 searches (Sonar) or $5 per 1,000 searches (Sonar Pro with deeper citations)

---

## What is Perplexity Sonar?

Perplexity Sonar is an **AI search API** that provides:
- ✅ **Real-time web data** (not cached LLM knowledge from training)
- ✅ **Verified citations** from trusted sources
- ✅ **Recency filtering** (last 24 hours, week, month, year)
- ✅ **Domain filtering** (limit to specific trusted domains)
- ✅ **Fast & affordable** ($5/1K searches)

**Why Sonar for SEO?**
- Google's algorithms change constantly - Sonar fetches **latest** guidelines
- E-E-A-T requirements evolve - Sonar gets **current** 2025 standards
- Local SEO (GMB, GEO search) updates frequently - Sonar finds **recent** best practices
- Backlink strategies shift - Sonar discovers **new** white-hat tactics

---

## Setup (3 Steps)

### Step 1: Get Perplexity API Key

1. Go to: https://www.perplexity.ai/settings/api
2. Sign up or log in
3. Click "Generate API Key"
4. Copy your API key (starts with `pplx-`)

**Pricing**:
- **Sonar**: $5 per 1,000 searches
- **Sonar Pro**: $5 per 1,000 searches (2x deeper citations)
- **Free tier**: 5 free searches for testing

### Step 2: Add API Key to Environment

Add to [.env.local](d:\Unite-Hub\.env.local):

```env
# Perplexity Sonar API
PERPLEXITY_API_KEY=pplx-your-key-here
```

**Important**: Never commit API keys to Git! `.env.local` is already in `.gitignore`.

### Step 3: Test Integration

```bash
# Test E-E-A-T research
npm run seo:eeat

# Test Google Business Profile strategies
npm run seo:gmb

# Test comprehensive SEO report
npm run seo:full "local SEO"
```

If successful, you'll see:
```
🚀 Initializing Perplexity Sonar API...

================================================================================
📊 E-E-A-T Guidelines & Requirements
================================================================================

[Real-time answer with citations from Google, SEL, SEJ, etc.]

📚 Citations:
  1. Google Search Quality Rater Guidelines
     https://developers.google.com/search/docs/...
  2. E-E-A-T Update: What Changed in 2025
     https://searchengineland.com/...

✅ Report saved to: reports/seo/EEAT_Guidelines_2025-11-19.md
```

---

## Usage

### Available Commands

```bash
# Research latest SEO trends for a topic
npm run seo:research "local SEO"
npm run seo:research "e-commerce SEO"
npm run seo:research "SaaS SEO"

# Get E-E-A-T guidelines (Experience, Expertise, Authoritativeness, Trustworthiness)
npm run seo:eeat

# Google Business Profile optimization strategies
npm run seo:gmb

# GEO search and voice search trends
npm run seo:geo

# Bing SEO strategies (Bing's AI integration with Copilot)
npm run seo:bing

# Viable backlink building strategies (white-hat)
npm run seo:backlinks

# Comprehensive SEO report (all topics combined)
npm run seo:full "your industry or niche"

# Help and usage guide
npm run seo:help
```

### Use Cases

**1. Stay Updated on Latest SEO Trends**
```bash
# Get 2025 trends for your industry
npm run seo:research "real estate SEO"
```

**Output** (example):
```markdown
# SEO Trends: real estate SEO

## Latest Real Estate SEO Trends (2025)

Based on recent data from Search Engine Land, Moz, and industry experts:

1. **Local SEO is Critical** - 97% of consumers search online for local businesses
2. **Video Content Dominates** - Real estate listings with video get 403% more inquiries
3. **Google Business Profile** - Complete profiles rank 70% higher in local search
4. **Voice Search Optimization** - 58% of homebuyers use voice search
5. **E-E-A-T for Trust** - Agent credentials and reviews heavily weighted

[Full analysis with citations from 10+ sources]

## Citations
1. [Local SEO for Real Estate: 2025 Guide](https://searchengineland.com/...)
2. [Video SEO Statistics 2025](https://moz.com/...)
3. [Google Business Profile Optimization](https://support.google.com/...)
...
```

**2. Understand E-E-A-T Requirements**
```bash
# Get latest E-E-A-T guidelines from Google
npm run seo:eeat
```

**Why This Matters**:
- E-E-A-T affects **all** content rankings
- Guidelines change (added "Experience" in 2022)
- Need **latest** 2025 requirements, not outdated advice

**3. Optimize Google Business Profile**
```bash
# Get GMB optimization strategies
npm run seo:gmb
```

**Output Includes**:
- Latest GMB features (2025 updates)
- Ranking factors for local pack
- Best practices for reviews, photos, posts
- Integration with Google Maps, Search

**4. Research GEO Search & Voice Search**
```bash
# Get GEO search trends and voice search strategies
npm run seo:geo
```

**Output Includes**:
- How AI (SGE, Bard) affects local search
- Voice search optimization for "near me" queries
- Mobile-first indexing updates
- Featured snippet strategies for local queries

**5. Bing SEO Strategies**
```bash
# Get Bing-specific SEO tactics
npm run seo:bing
```

**Why Bing Matters**:
- Bing has 9% market share (100M+ searches/day)
- Bing integrates ChatGPT (AI search)
- Different ranking factors vs. Google
- Often easier to rank on Bing

**6. Backlink Building Strategies**
```bash
# Get viable backlink tactics (white-hat)
npm run seo:backlinks
```

**Output Includes**:
- What makes a backlink "viable" (E-E-A-T criteria)
- Guest posting best practices (2025)
- Digital PR tactics
- Link quality vs. quantity
- How to avoid penalties

**7. Comprehensive SEO Report**
```bash
# Generate full report with all topics
npm run seo:full "SaaS SEO"
```

**Output**: 20-30 page report with:
- Latest SEO trends for SaaS
- E-E-A-T requirements
- GMB optimization (if local)
- GEO search strategies
- Bing SEO tactics
- Backlink building plan
- **100+ citations** from trusted sources

**Time**: 30-60 seconds (6 parallel API calls)
**Cost**: ~$0.03 (6 Sonar Pro searches)

---

## Integration with SEO Platform

### Automated Weekly Reports

Create a cron job to generate weekly SEO intelligence reports:

**`scripts/weekly-seo-report.mjs`**:
```javascript
import { PerplexitySonar } from '../src/lib/ai/perplexity-sonar.ts';
import fs from 'fs';

const sonar = new PerplexitySonar();

async function weeklyReport() {
  console.log('🔬 Generating weekly SEO intelligence report...');

  const topics = [
    'local SEO',
    'content marketing',
    'technical SEO',
    'link building',
  ];

  for (const topic of topics) {
    const report = await sonar.generateSEOReport(topic);
    const filename = `reports/weekly/SEO_${topic.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.md`;

    fs.writeFileSync(filename, report);
    console.log(`✅ ${topic} report saved`);

    // Wait 2 seconds between topics (rate limiting)
    await new Promise((r) => setTimeout(r, 2000));
  }

  console.log('🎉 Weekly reports complete!');
}

weeklyReport();
```

**Run weekly**:
```bash
# Add to cron (Linux/Mac)
0 9 * * 1 cd /path/to/unite-hub && npm run weekly-seo-report

# Or use GitHub Actions (runs every Monday at 9am)
```

### API Endpoint for Dashboard

**`src/app/api/seo/research/route.ts`**:
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { PerplexitySonar } from '@/lib/ai/perplexity-sonar';

export async function POST(req: NextRequest) {
  try {
    const { topic, researchType } = await req.json();

    const sonar = new PerplexitySonar();

    let result;

    switch (researchType) {
      case 'trends':
        result = await sonar.getLatestSEOTrends(topic);
        break;
      case 'eeat':
        result = await sonar.researchEEAT();
        break;
      case 'gmb':
        result = await sonar.getGMBStrategies();
        break;
      case 'comprehensive':
        result = await sonar.comprehensiveSEOResearch(topic);
        break;
      default:
        return NextResponse.json({ error: 'Invalid research type' }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('SEO research error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
```

**Frontend usage**:
```typescript
// In your dashboard component
const researchSEO = async (topic: string) => {
  const response = await fetch('/api/seo/research', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      topic,
      researchType: 'comprehensive',
    }),
  });

  const data = await response.json();

  // Display results with citations
  console.log(data.trends.answer);
  console.log(data.eeat.citations);
};
```

---

## Cost Analysis

### Scenario 1: Weekly SEO Research

**Usage**:
- 1 comprehensive report per week (6 Sonar Pro searches)
- 52 weeks/year
- Total: 312 searches/year

**Cost**:
- 312 searches × $0.005 = **$1.56/year**
- **$0.13/month**

### Scenario 2: Daily Competitor Monitoring

**Usage**:
- 10 competitors tracked
- 1 search per competitor per day (trends)
- 365 days/year
- Total: 3,650 searches/year

**Cost**:
- 3,650 searches × $0.005 = **$18.25/year**
- **$1.52/month**

### Scenario 3: Enterprise SEO Platform

**Usage**:
- 100 keywords tracked
- 1 search per keyword per week (position + SERP analysis)
- 52 weeks/year
- Total: 5,200 searches/year

**Cost**:
- 5,200 searches × $0.005 = **$26/year**
- **$2.17/month**

**Comparison**:
- Semrush: $119.95/month = $1,439.40/year
- Ahrefs: $99/month = $1,188/year
- **Perplexity Sonar**: $2-26/year (99% cost reduction)

---

## Advanced Features

### Domain Filtering

Only use trusted sources for critical SEO research:

```typescript
const result = await sonar.search(
  'Latest Google algorithm updates',
  {
    model: 'sonar-pro',
    domains: [
      'developers.google.com',
      'searchengineland.com',
      'searchenginejournal.com',
      'moz.com',
    ],
  }
);
```

### Recency Filtering

Get only the freshest data:

```typescript
// Last 24 hours only
const result = await sonar.search(
  'Google algorithm update',
  {
    recencyFilter: 'day',
  }
);

// Last week (for trending topics)
const result = await sonar.search(
  'Bing AI search features',
  {
    recencyFilter: 'week',
  }
);
```

### Multi-Model Consensus

Combine Sonar with other LLMs for validation:

```typescript
// Get Sonar's real-time answer
const sonarResult = await sonar.researchEEAT();

// Validate with Claude Opus (deep reasoning)
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const claudeValidation = await anthropic.messages.create({
  model: 'claude-opus-4-1-20250805',
  max_tokens: 2048,
  messages: [
    {
      role: 'user',
      content: `Validate this E-E-A-T analysis from Sonar:\n\n${sonarResult.answer}\n\nIs this accurate? Any missing points?`,
    },
  ],
});

// Compare results
console.log('Sonar:', sonarResult.answer);
console.log('Claude:', claudeValidation.content[0].text);
```

---

## Troubleshooting

### Error: "PERPLEXITY_API_KEY is required"

**Solution**:
1. Get API key from https://www.perplexity.ai/settings/api
2. Add to `.env.local`:
   ```env
   PERPLEXITY_API_KEY=pplx-your-key-here
   ```
3. Restart dev server: `npm run dev`

### Error: "Rate limit exceeded"

**Solution**:
- Free tier: 5 searches/month
- Paid tier: Unlimited (pay per use)
- Add delays between requests:
  ```typescript
  await new Promise((r) => setTimeout(r, 2000)); // 2 second delay
  ```

### Error: "Invalid model"

**Solution**:
Use correct model names:
- `llama-3.1-sonar-small-128k-online` (Sonar)
- `llama-3.1-sonar-large-128k-online` (Sonar Pro)

### Citations Not Appearing

**Solution**:
- Ensure `return_citations: true` is set
- Use Sonar Pro for deeper citations
- Check trusted domains filter (might be too restrictive)

---

## Best Practices

### 1. Cache Results

Don't re-fetch the same data repeatedly:

```typescript
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

async function getCachedSEOTrends(topic: string) {
  const cacheKey = `seo:trends:${topic}`;

  // Check cache (30-day TTL)
  const cached = await redis.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }

  // Fetch fresh data
  const result = await sonar.getLatestSEOTrends(topic);

  // Cache for 30 days
  await redis.setex(cacheKey, 30 * 24 * 60 * 60, JSON.stringify(result));

  return result;
}
```

### 2. Batch Requests

Use `Promise.all()` for parallel requests:

```typescript
// ❌ Slow (sequential)
const trends = await sonar.getLatestSEOTrends(topic);
const eeat = await sonar.researchEEAT();
const gmb = await sonar.getGMBStrategies();

// ✅ Fast (parallel)
const [trends, eeat, gmb] = await Promise.all([
  sonar.getLatestSEOTrends(topic),
  sonar.researchEEAT(),
  sonar.getGMBStrategies(),
]);
```

### 3. Error Handling

Implement retries for transient failures:

```typescript
import { retry } from '@/lib/retry';

const result = await retry(
  () => sonar.getLatestSEOTrends(topic),
  {
    retries: 3,
    delay: 2000,
  }
);
```

### 4. Monitor Costs

Track API usage:

```typescript
let searchCount = 0;
let totalCost = 0;

async function trackedSearch(query: string, options: any) {
  const result = await sonar.search(query, options);

  searchCount++;
  totalCost += options.model === 'sonar-pro' ? 0.005 : 0.005;

  console.log(`Searches: ${searchCount} | Cost: $${totalCost.toFixed(4)}`);

  return result;
}
```

---

## Next Steps

1. **Get API Key**: https://www.perplexity.ai/settings/api
2. **Add to .env.local**: `PERPLEXITY_API_KEY=pplx-...`
3. **Test**: `npm run seo:eeat`
4. **Generate Report**: `npm run seo:full "your industry"`
5. **Integrate**: Add to dashboard, automate weekly reports

---

## Resources

- Perplexity Sonar Docs: https://docs.perplexity.ai/
- API Pricing: https://www.perplexity.ai/settings/api
- Model Comparison: https://docs.perplexity.ai/getting-started/models
- Example Code: `src/lib/ai/perplexity-sonar.ts`
- CLI Script: `scripts/seo-intelligence.mjs`

---

**Status**: Ready to use - set API key and run `npm run seo:help`
