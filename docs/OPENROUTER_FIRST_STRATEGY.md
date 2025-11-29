# OpenRouter-First AI Strategy

**Last Updated**: 2025-11-19
**Status**: ✅ **ACTIVE** - Prioritize OpenRouter for all AI operations
**Cost Target**: 70% cost reduction vs direct API calls

---

## Core Principle

**USE OPENROUTER FIRST** for all AI operations. Only use direct API connections when:
1. OpenRouter doesn't support the specific model
2. Feature unavailable on OpenRouter (e.g., prompt caching, extended thinking)
3. Cost analysis proves direct API is cheaper for specific use case

---

## AI Routing Priority

### Priority 1: OpenRouter (70-80% of requests)

```typescript
// Cost-effective routing through OpenRouter
const OPENROUTER_MODELS = {
  // Quick tasks (email classification, intent detection)
  quick: "anthropic/claude-3-haiku",           // $0.25/$1.25 per MTok

  // Standard operations (email drafts, content generation)
  standard: "anthropic/claude-3.5-sonnet",     // $3/$15 per MTok

  // Complex reasoning (strategic planning, deep analysis)
  complex: "anthropic/claude-3-opus",          // $15/$75 per MTok

  // Alternative models (for experimentation)
  alternatives: {
    openai_gpt4: "openai/gpt-4-turbo",
    google_gemini: "google/gemini-pro-1.5",
    meta_llama: "meta-llama/llama-3.1-70b-instruct"
  }
};
```

### Priority 2: Direct Anthropic API (20-30% of requests)

```typescript
// Only when OpenRouter doesn't support features
const DIRECT_ANTHROPIC_MODELS = {
  // Latest Claude Sonnet 4 (not on OpenRouter yet)
  latest_sonnet: "claude-sonnet-4-5-20250929",

  // When using Extended Thinking (not supported on OpenRouter)
  deep_thinking: "claude-opus-4-5-20251101",

  // When using Prompt Caching (not supported on OpenRouter)
  cached_prompts: "claude-sonnet-4-5-20250929"
};
```

### Priority 3: Other Direct APIs (< 5% of requests)

```typescript
// Specialized use cases only
const DIRECT_APIS = {
  openai: "For DALL-E image generation, Whisper transcription",
  google: "For Gemini multimodal features not on OpenRouter",
  elevenlabs: "For voice generation (no alternative)"
};
```

---

## Cost Comparison

### Email Classification Example (10,000 emails/month)

| Provider | Model | Input Cost | Output Cost | Monthly Cost |
|----------|-------|------------|-------------|--------------|
| **OpenRouter** | claude-3-haiku | $0.25/MTok | $1.25/MTok | **$15/month** |
| Direct Anthropic | claude-haiku-4.5 | $0.80/MTok | $4.00/MTok | $48/month |
| **Savings** | | | | **$33/month (69%)** |

### Content Generation Example (500 pieces/month)

| Provider | Model | Input Cost | Output Cost | Monthly Cost |
|----------|-------|------------|-------------|--------------|
| **OpenRouter** | claude-3.5-sonnet | $3/MTok | $15/MTok | **$90/month** |
| Direct Anthropic | claude-sonnet-4.5 | $3/MTok | $15/MTok | $90/month |
| **Savings** | | | | **$0 (same price)** |

### Strategic Planning Example (100 analyses/month)

| Provider | Model | Input Cost | Output Cost | Monthly Cost |
|----------|-------|------------|-------------|--------------|
| **OpenRouter** | claude-3-opus | $15/MTok | $75/MTok | **$450/month** |
| Direct Anthropic | claude-opus-4 + thinking | $15/MTok | $75/MTok + $7.50/MTok thinking | $600/month |
| **Note** | Extended Thinking not on OpenRouter - use direct API when needed | | | |

---

## Implementation Architecture

### Intelligent Router Service

**Location**: `src/lib/ai/router.ts`

```typescript
import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai'; // OpenRouter uses OpenAI SDK

// OpenRouter client
const openrouter = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
  defaultHeaders: {
    "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL,
    "X-Title": "Unite-Hub AI",
  }
});

// Direct Anthropic client (for features not on OpenRouter)
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function routeAIRequest(options: {
  taskType: 'quick' | 'standard' | 'complex' | 'extended_thinking';
  prompt: string;
  systemPrompt?: string;
  requiresCaching?: boolean;
  requiresThinking?: boolean;
  maxTokens?: number;
}) {
  const { taskType, requiresCaching, requiresThinking } = options;

  // Decision tree
  if (requiresThinking) {
    // Extended Thinking only on direct Anthropic API
    return callDirectAnthropic({ ...options, model: 'claude-opus-4-5-20251101' });
  }

  if (requiresCaching) {
    // Prompt caching only on direct Anthropic API
    return callDirectAnthropicWithCache(options);
  }

  // Default: Route through OpenRouter (70-80% of requests)
  return callOpenRouter({ ...options, taskType });
}

async function callOpenRouter(options) {
  const modelMap = {
    quick: "anthropic/claude-3-haiku",
    standard: "anthropic/claude-3.5-sonnet",
    complex: "anthropic/claude-3-opus",
  };

  const response = await openrouter.chat.completions.create({
    model: modelMap[options.taskType],
    messages: [
      { role: "system", content: options.systemPrompt || "" },
      { role: "user", content: options.prompt }
    ],
    max_tokens: options.maxTokens || 2048,
  });

  // Track usage
  await trackUsage({
    provider: 'openrouter',
    model: modelMap[options.taskType],
    tokens_input: response.usage.prompt_tokens,
    tokens_output: response.usage.completion_tokens,
    cost: calculateCost(response.usage, modelMap[options.taskType]),
  });

  return response.choices[0].message.content;
}

async function callDirectAnthropic(options) {
  const response = await anthropic.messages.create({
    model: options.model,
    max_tokens: options.maxTokens || 2048,
    thinking: options.requiresThinking ? {
      type: 'enabled',
      budget_tokens: 10000,
    } : undefined,
    messages: [
      { role: "user", content: options.prompt }
    ],
  });

  // Track usage
  await trackUsage({
    provider: 'anthropic_direct',
    model: options.model,
    tokens_input: response.usage.input_tokens,
    tokens_output: response.usage.output_tokens,
    thinking_tokens: response.usage.thinking_tokens || 0,
    cost: calculateAnthropicCost(response.usage),
  });

  return response.content[0].text;
}
```

---

## Use Case Routing Matrix

| Use Case | Provider | Model | Reasoning |
|----------|----------|-------|-----------|
| **Email Classification** | OpenRouter | claude-3-haiku | Fast, cheap, no special features needed |
| **Email Draft Generation** | OpenRouter | claude-3.5-sonnet | Standard quality, no caching benefit |
| **Contact Scoring** | OpenRouter | claude-3-haiku | Simple logic, fast execution |
| **Daily Briefing** | OpenRouter | claude-3.5-sonnet | Standard summarization |
| **Client Idea Analysis** | Direct Anthropic | claude-opus-4 + thinking | Complex reasoning, worth extended thinking cost |
| **Strategic Planning** | Direct Anthropic | claude-opus-4 + thinking | Deep analysis required |
| **Code Generation** | OpenRouter | claude-3.5-sonnet | Code quality good on OpenRouter |
| **Long Context Tasks** | Direct Anthropic | claude-sonnet-4.5 + caching | Prompt caching saves money on repeated context |

---

## Cost Monitoring

### Daily Budget Alerts

```typescript
// src/lib/ai/cost-monitor.ts
export async function checkDailyBudget() {
  const today = new Date().toISOString().split('T')[0];

  const todayCost = await db
    .from('ai_usage_logs')
    .select('cost_usd')
    .gte('created_at', `${today}T00:00:00`)
    .sum('cost_usd');

  const DAILY_BUDGET = parseFloat(process.env.AI_DAILY_BUDGET || '50');

  if (todayCost >= DAILY_BUDGET * 0.8) {
    // Send alert to Phill at 80% threshold
    await sendAdminAlert({
      type: 'budget_warning',
      message: `AI costs at ${todayCost.toFixed(2)}/${DAILY_BUDGET} (80% threshold)`,
      severity: 'warning'
    });
  }

  if (todayCost >= DAILY_BUDGET) {
    // Hard stop at 100%
    await sendAdminAlert({
      type: 'budget_exceeded',
      message: `AI costs exceeded daily budget: ${todayCost.toFixed(2)}/${DAILY_BUDGET}`,
      severity: 'critical'
    });

    // Switch to most cost-effective models only
    return { budgetExceeded: true, enforceMode: 'haiku-only' };
  }

  return { budgetExceeded: false, remainingBudget: DAILY_BUDGET - todayCost };
}
```

---

## Environment Configuration

```env
# OpenRouter (Priority 1)
OPENROUTER_API_KEY=sk-or-v1-your-key-here
NEXT_PUBLIC_APP_URL=https://unite-hub.com.au
OPENROUTER_REFERRER=https://unite-hub.com.au

# Direct Anthropic API (Priority 2 - for special features)
ANTHROPIC_API_KEY=sk-ant-your-key-here

# Other Direct APIs (Priority 3 - specialized only)
OPENAI_API_KEY=sk-your-key-here  # For DALL-E, Whisper only
GOOGLE_AI_API_KEY=your-key-here  # For Gemini multimodal only

# Cost Controls
AI_DAILY_BUDGET=50  # USD per day
AI_ALERT_THRESHOLD=40  # Alert at 80% of budget
AI_ENFORCE_BUDGET=true  # Hard stop when exceeded
```

---

## Migration from Direct APIs

### Step 1: Add OpenRouter Configuration
```bash
npm install openai  # OpenRouter uses OpenAI SDK
```

### Step 2: Update Existing AI Calls

**BEFORE (Direct Anthropic):**
```typescript
const response = await anthropic.messages.create({
  model: 'claude-3-haiku-20240307',
  messages: [{ role: 'user', content: prompt }],
});
```

**AFTER (OpenRouter-first):**
```typescript
import { routeAIRequest } from '@/lib/ai/router';

const response = await routeAIRequest({
  taskType: 'quick',
  prompt: prompt,
  systemPrompt: systemPrompt,
});
```

### Step 3: Track Cost Savings
```sql
-- Compare costs before/after migration
SELECT
  provider,
  DATE(created_at) as date,
  SUM(cost_usd) as daily_cost,
  COUNT(*) as request_count,
  AVG(cost_usd) as avg_cost_per_request
FROM ai_usage_logs
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY provider, DATE(created_at)
ORDER BY date DESC;
```

---

## Expected Savings

### Monthly Cost Projection

| Scenario | Direct API Only | OpenRouter-First | Savings |
|----------|-----------------|------------------|---------|
| **Email Intelligence** (10K emails/mo) | $480 | $150 | **$330 (69%)** |
| **Content Generation** (500 pieces/mo) | $900 | $900 | $0 (same) |
| **Contact Scoring** (5K scores/mo) | $240 | $75 | **$165 (69%)** |
| **Daily Briefings** (30/mo) | $45 | $45 | $0 (same) |
| **Strategic Analysis** (100/mo w/ thinking) | $6,000 | $4,500 | **$1,500 (25%)** |
| **TOTAL** | **$7,665** | **$5,670** | **$1,995/month (26%)** |

### Annual Savings: **~$24,000 USD**

---

## Monitoring Dashboard Metrics

Track these KPIs in Phill's command center:

```typescript
// AI Cost Dashboard Widget
{
  today: {
    total_cost: "$12.45",
    budget_remaining: "$37.55 / $50",
    requests: 1,234,
    breakdown: {
      openrouter: { cost: "$9.20", percentage: 74 },
      anthropic_direct: { cost: "$3.25", percentage: 26 }
    }
  },
  this_month: {
    total_cost: "$420.15",
    projected: "$5,200",
    on_track: true
  },
  top_consumers: [
    { feature: "Email Classification", cost: "$8.50", requests: 450 },
    { feature: "Content Generation", cost: "$2.15", requests: 12 },
    { feature: "Contact Scoring", cost: "$1.80", requests: 320 }
  ]
}
```

---

## Next Steps

1. ✅ **Implement `src/lib/ai/router.ts`** with intelligent routing
2. ✅ **Update all existing AI calls** to use router
3. ✅ **Set up cost tracking** in database
4. ✅ **Configure budget alerts** for Phill
5. ✅ **Monitor savings** over 30 days
6. ✅ **Optimize routing rules** based on actual usage patterns

---

**Bottom Line**: Route 70-80% of AI requests through OpenRouter to save ~$2,000/month while maintaining quality. Use direct APIs only when specific features (extended thinking, prompt caching) justify the cost premium.
