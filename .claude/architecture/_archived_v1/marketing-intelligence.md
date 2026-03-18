# Marketing Intelligence Platform

**Status**: ✅ Operational
**Last Updated**: 2026-01-15
**Cost Savings**: 94-98% vs traditional stack

---

## Overview

Multi-platform AI-powered marketing intelligence system using Perplexity Sonar and OpenRouter.

## Components

### Perplexity Sonar (SEO Intelligence)

**File**: `src/lib/ai/perplexity-sonar.ts`

**Features**:
- Real-time SEO research with citations
- Domain-filtered searches (high-authority sources)
- Latest trends and guidelines
- E-E-A-T compliance research

**Cost**: $0.005-0.01 per search (99% cheaper than Semrush $119-449/mo)

**Usage**:
```typescript
import { PerplexitySonar } from '@/lib/ai/perplexity-sonar';

const sonar = new PerplexitySonar(process.env.PERPLEXITY_API_KEY);

// Real-time SEO research with citations
const research = await sonar.getLatestSEOTrends('E-E-A-T guidelines');
// Returns: { answer: string, citations: Citation[], usage: TokenUsage }

// Domain-filtered research
const eeat = await sonar.search('Google E-E-A-T updates 2024', {
  domains: [
    'searchengineland.com',
    'searchenginejournal.com',
    'moz.com'
  ]
});
```

### OpenRouter (Multi-Model AI)

**File**: `src/lib/ai/openrouter-intelligence.ts` (473 lines)

**Features**:
- Multi-model AI routing
- Automatic cost optimization
- 4 AI models available
- Task-based model selection

**Cost Savings**: 70-80% vs direct APIs

**Models**:
- Claude 3.5 Sonnet - Creative content, brand voice
- GPT-4 Turbo - SEO research, pattern recognition
- Gemini Pro 1.5 - Large context (1M tokens)
- Llama 3 70B - Bulk generation (cost priority)

**Usage**:
```typescript
import OpenRouterIntelligence from '@/lib/ai/openrouter-intelligence';

const router = new OpenRouterIntelligence(process.env.OPENROUTER_API_KEY);

// Generate social media content
const content = await router.generateSocialContent({
  platform: 'linkedin',
  contentType: 'post',
  topic: 'stainless steel balustrades',
  brandVoice: 'Professional yet approachable',
  targetAudience: 'Commercial architects and builders',
  keywords: ['stainless steel', 'modern design', 'AS1170']
});

// Analyze keywords
const keywords = await router.analyzeKeywords({
  seedKeywords: ['stainless steel balustrades', 'glass railings'],
  industry: 'construction',
  location: 'Brisbane, Australia',
  competitorDomains: ['competitor1.com.au', 'competitor2.com.au']
});

// Competitor analysis
const analysis = await router.analyzeCompetitor({
  competitorDomain: 'competitor.com.au',
  yourDomain: 'your-client.com.au',
  industry: 'construction',
  analysisType: 'full' // 'seo' | 'content' | 'social' | 'full'
});
```

## Model Selection Strategy

**Task-Based Routing** (automatic cost optimization):

| Task Type | Model | Cost | Use Case |
|-----------|-------|------|----------|
| Creative content | Claude 3.5 Sonnet | $3/$15 per MTok | Social media posts, brand voice |
| SEO research | GPT-4 Turbo | $10/$30 per MTok | Keyword analysis, competitor research |
| Large context | Gemini Pro 1.5 | $1.25/$5 per MTok | 1M token context, comprehensive analysis |
| Bulk generation | Llama 3 70B | $0.50/$0.50 per MTok | High-volume content generation |
| Visual analysis | GPT-4 Vision | $10/$30 per MTok | Pinterest, Instagram optimization |

**Decision Tree**:
```
Content Request
    ↓
    ├─→ [Creative/Brand Voice] → Claude 3.5 Sonnet (quality priority)
    ├─→ [SEO/Keywords] → GPT-4 Turbo (pattern recognition)
    ├─→ [Large Context] → Gemini Pro 1.5 (1M tokens)
    ├─→ [Bulk/Volume] → Llama 3 70B (cost priority)
    └─→ [Visual] → GPT-4 Vision (image analysis)
```

## Platform-Specific Best Practices

Built-in guidelines for 8 platforms:

### YouTube
- Description: 5000 char max, first 150 critical
- Script: 8-12 min ideal, hook in 15 sec
- Hashtags: 3-5 max

### LinkedIn
- Post: 1300 char sweet spot
- Hashtags: 3-5 professional hashtags
- Best time: Tue-Thu, 8-10am

### Instagram
- Caption: 2200 char max, first 125 critical
- Hashtags: 20-30 mix (popular + niche)
- Image: 1080x1080 feed, 1080x1920 stories

### Facebook
- Post: 40-80 chars optimal
- Questions drive 100% more engagement
- Hashtags: 1-2 max

### TikTok
- Script: 21-34 sec ideal
- Hook: 1-3 sec critical
- Trending audio: 30% reach boost

### X (Twitter)
- Post: 71-100 chars get 17% more engagement
- Hashtags: 1-2 max

### Reddit
- Title: 60-80 chars
- NO direct promotion
- Disclose affiliation, provide sources

### Pinterest
- Description: 500 chars, keyword-rich
- Image: 1000x1500 vertical
- Hashtags: 5-10 descriptive

## Cost Structure

**Monthly Budget Comparison**:

| Service | Traditional Stack | Unite-Hub Platform | Savings |
|---------|------------------|-------------------|---------|
| SEO Tool | $119-449 (Semrush) | $5-10 (Perplexity) | 98% |
| AI APIs | $500-3,000 | $50-150 (OpenRouter) | 75-95% |
| Social Tools | $200-1,000 | Included | 100% |
| Analytics | $247-2,537 | Included | 100% |
| **Total** | **$1,066-6,986** | **$65-165** | **94-98%** |

## Caching Strategy

80-90% savings through intelligent caching:

```typescript
import { SEOCache } from '@/lib/ai/seo-cache';

const cache = new SEOCache();

// Check cache first (24-hour TTL for SEO data)
const cached = cache.get(query, options);
if (cached) return cached;

// Call API and cache result
const result = await sonar.search(query, options);
cache.set(query, options, result);
```

## Usage Tracking

```typescript
import { SEOUsageTracker } from '@/lib/ai/seo-usage-tracker';

const tracker = new SEOUsageTracker();

// Track each API call
tracker.track({
  timestamp: Date.now(),
  command: 'research',
  query: topic,
  model: 'sonar-pro',
  tokensUsed: result.usage?.total_tokens || 0,
  cost: 0.01
});

// Get monthly stats
const stats = tracker.getStats(new Date(new Date().setDate(1)));
// Returns: { totalSearches, totalCost, totalTokens, byCommand, byModel }
```

## CLI Commands

See `.claude/commands/seo.md` for complete list:

```bash
npm run seo:research "topic"        # Latest trends
npm run seo:eeat                    # E-E-A-T guidelines
npm run seo:comprehensive "topic"   # Full report
npm run seo:usage                   # Usage stats
```

## Documentation

- **Multi-Platform Strategy**: `docs/MULTI_PLATFORM_MARKETING_INTELLIGENCE.md`
- **Implementation Roadmap**: `docs/MARKETING_INTELLIGENCE_ROADMAP.md` (12-week plan)
- **Cost Optimization**: `docs/SEO_COST_OPTIMIZATION_GUIDE.md`
- **Client Meeting Prep**: `docs/CLIENT_MEETING_BALUSTRADE_COMPANY.md`

---

**Source**: CLAUDE.md lines 584-847
