# Anthropic API Production Implementation Patterns

**Source**: Claude API Documentation (docs.claude.com)
**Date**: 2025-01-18
**Purpose**: Production-grade patterns for Unite-Hub AI agent implementation

---

## 1. Rate Limiting & Throttling

### Official Rate Limit Structure

| Tier | Credits Required | RPM | Input Tokens/Min | Output Tokens/Min |
|------|-----------------|-----|------------------|-------------------|
| 1 | $5 | 50 | 30,000 | 8,000 |
| 2 | $40 | 50 | 20,000 | 8,000 |
| 3 | $200 | 50 | 20,000 | 8,000 |
| 4 | $400 | 50 | 30,000 | 8,000 |

**Note**: Haiku 4.5 supports up to 50,000 ITPM (Input Tokens Per Minute)

### Response Headers (Monitor These)

```typescript
// Rate limit headers returned on every response
interface RateLimitHeaders {
  'anthropic-ratelimit-requests-limit': number;
  'anthropic-ratelimit-requests-remaining': number;
  'anthropic-ratelimit-requests-reset': string; // ISO timestamp
  'anthropic-ratelimit-tokens-limit': number;
  'anthropic-ratelimit-tokens-remaining': number;
  'anthropic-ratelimit-tokens-reset': string;
  'anthropic-ratelimit-input-tokens-limit': number;
  'anthropic-ratelimit-input-tokens-remaining': number;
  'anthropic-ratelimit-output-tokens-limit': number;
  'anthropic-ratelimit-output-tokens-remaining': number;
  'retry-after': number; // Seconds (only on 429 errors)
}
```

### Production Implementation

```typescript
// src/lib/anthropic/rate-limiter.ts

import { Anthropic } from '@anthropic-ai/sdk';
import { log } from '@/lib/logger';
import { rateLimitHits } from '@/lib/metrics';

interface RetryConfig {
  maxRetries: number;
  baseDelayMs: number;
  maxDelayMs: number;
}

const DEFAULT_RETRY: RetryConfig = {
  maxRetries: 5,
  baseDelayMs: 1000,
  maxDelayMs: 60000,
};

export async function callAnthropicWithRetry<T>(
  fn: () => Promise<T>,
  config: RetryConfig = DEFAULT_RETRY
): Promise<T> {
  let lastError: any;

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      const result = await fn();

      // Log successful retry recovery
      if (attempt > 0) {
        log.info('Anthropic API call succeeded after retry', {
          attempt,
          totalAttempts: attempt + 1,
        });
      }

      return result;
    } catch (error: any) {
      lastError = error;

      // Don't retry on non-rate-limit errors
      if (error.status !== 429 && error.status !== 529) {
        throw error;
      }

      // Don't retry if we've exhausted attempts
      if (attempt === config.maxRetries) {
        log.error('Anthropic API max retries exceeded', {
          attempts: attempt + 1,
          error: error.message,
        });
        break;
      }

      // Calculate delay using exponential backoff
      const retryAfter = error.headers?.['retry-after'];
      const delay = retryAfter
        ? retryAfter * 1000 // Convert seconds to ms
        : Math.min(
            config.baseDelayMs * Math.pow(2, attempt),
            config.maxDelayMs
          );

      // Log rate limit hit
      rateLimitHits.inc({ tier: 'tier-1', route: 'anthropic-api' });
      log.warn('Anthropic rate limit hit, retrying', {
        attempt: attempt + 1,
        maxRetries: config.maxRetries,
        delayMs: delay,
        retryAfter: retryAfter || 'calculated',
        status: error.status,
      });

      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

// Usage example
export async function analyzeContactWithRetry(contactData: any) {
  return callAnthropicWithRetry(async () => {
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    return await anthropic.messages.create({
      model: 'claude-opus-4-1-20250805',
      max_tokens: 2048,
      messages: [
        {
          role: 'user',
          content: JSON.stringify(contactData),
        },
      ],
    });
  });
}
```

### Token Bucket Algorithm (Anthropic Uses This)

**Key Insight**: Rate limits replenish continuously, not at fixed intervals.

```typescript
// Rate limit monitoring utility
export class RateLimitMonitor {
  private requestsRemaining: number = 0;
  private tokensRemaining: number = 0;
  private resetTime: Date = new Date();

  updateFromHeaders(headers: Record<string, string>): void {
    this.requestsRemaining = parseInt(
      headers['anthropic-ratelimit-requests-remaining'] || '0'
    );
    this.tokensRemaining = parseInt(
      headers['anthropic-ratelimit-tokens-remaining'] || '0'
    );
    this.resetTime = new Date(
      headers['anthropic-ratelimit-requests-reset'] || Date.now()
    );
  }

  shouldThrottle(): boolean {
    // Throttle if below 10% capacity
    return this.requestsRemaining < 5 || this.tokensRemaining < 3000;
  }

  getWaitTime(): number {
    if (!this.shouldThrottle()) return 0;

    const now = Date.now();
    const resetMs = this.resetTime.getTime();
    return Math.max(0, resetMs - now);
  }
}
```

---

## 2. Prompt Caching (90% Cost Reduction)

### Official Cost Structure

**Claude Sonnet 4.5 Pricing**:
- Base input: **$3.00/MTok**
- 5-min cache write: **$3.75/MTok** (25% premium)
- Cache read: **$0.30/MTok** (90% discount)
- Output: **$15.00/MTok**

### Cache TTL Options

1. **5-minute TTL** (default): `"ttl": "5m"`
   - Best for high-frequency access (>1 request per 5 min)
   - 25% write premium

2. **1-hour TTL**: `"ttl": "1h"`
   - Best for medium-frequency access (1 request per 5-60 min)
   - 100% write premium (2x base price)

### Production Implementation

```typescript
// src/lib/anthropic/cached-client.ts

import Anthropic from '@anthropic-ai/sdk';
import { recordAiTokens, recordAiCost } from '@/lib/metrics';
import { log } from '@/lib/logger';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  defaultHeaders: {
    'anthropic-beta': 'prompt-caching-2024-07-31', // Required for caching
  },
});

interface CacheStats {
  cacheReadTokens: number;
  cacheCreationTokens: number;
  inputTokens: number;
  outputTokens: number;
  cacheHit: boolean;
  totalCost: number;
}

export async function analyzeContactCached(
  contactData: any,
  systemPrompt: string
): Promise<{ result: any; stats: CacheStats }> {
  const startTime = Date.now();

  try {
    const message = await anthropic.messages.create({
      model: 'claude-opus-4-1-20250805',
      max_tokens: 2048,
      system: [
        {
          type: 'text',
          text: systemPrompt, // Static system instructions
          cache_control: { type: 'ephemeral', ttl: '5m' }, // Cache for 5 min
        },
      ],
      messages: [
        {
          role: 'user',
          content: JSON.stringify(contactData), // Dynamic data (not cached)
        },
      ],
    });

    // Extract usage stats
    const usage = message.usage;
    const cacheReadTokens = usage.cache_read_input_tokens || 0;
    const cacheCreationTokens = usage.cache_creation_input_tokens || 0;
    const inputTokens = usage.input_tokens || 0;
    const outputTokens = usage.output_tokens || 0;

    // Calculate cost (Opus 4 pricing)
    const INPUT_PRICE = 15 / 1_000_000; // $15/MTok
    const OUTPUT_PRICE = 75 / 1_000_000; // $75/MTok
    const CACHE_WRITE_PRICE = 18.75 / 1_000_000; // $18.75/MTok
    const CACHE_READ_PRICE = 1.5 / 1_000_000; // $1.50/MTok

    const cost =
      cacheReadTokens * CACHE_READ_PRICE +
      cacheCreationTokens * CACHE_WRITE_PRICE +
      inputTokens * INPUT_PRICE +
      outputTokens * OUTPUT_PRICE;

    const stats: CacheStats = {
      cacheReadTokens,
      cacheCreationTokens,
      inputTokens,
      outputTokens,
      cacheHit: cacheReadTokens > 0,
      totalCost: cost,
    };

    // Log cache performance
    log.info('Anthropic API call with caching', {
      duration: Date.now() - startTime,
      ...stats,
      savingsPercent: cacheReadTokens > 0
        ? ((1 - CACHE_READ_PRICE / INPUT_PRICE) * 100).toFixed(1)
        : 0,
    });

    // Record metrics
    recordAiTokens('claude-opus-4', cacheReadTokens, 0);
    recordAiTokens('claude-opus-4', inputTokens, outputTokens);
    recordAiCost('claude-opus-4', cost);

    return {
      result: message,
      stats,
    };
  } catch (error) {
    log.error('Anthropic cached API call failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      duration: Date.now() - startTime,
    });
    throw error;
  }
}
```

### Best Practices for Cache Efficiency

**1. Minimum Token Thresholds**:
```typescript
// Cache only blocks meeting minimum size
const MIN_CACHE_TOKENS = {
  'claude-opus-4': 1024,
  'claude-sonnet-4-5': 1024,
  'claude-haiku-4-5': 4096,
};

function shouldCache(text: string, model: string): boolean {
  const estimatedTokens = text.length / 4; // Rough estimate
  return estimatedTokens >= MIN_CACHE_TOKENS[model];
}
```

**2. Strategic Breakpoints** (up to 4 per request):
```typescript
// Example: Multi-level caching
const message = await anthropic.messages.create({
  model: 'claude-sonnet-4-5-20250929',
  max_tokens: 4096,
  system: [
    {
      type: 'text',
      text: staticSystemInstructions, // 2000 tokens - rarely changes
      cache_control: { type: 'ephemeral', ttl: '1h' },
    },
    {
      type: 'text',
      text: toolDefinitions, // 1500 tokens - changes weekly
      cache_control: { type: 'ephemeral', ttl: '5m' },
    },
    {
      type: 'text',
      text: domainKnowledge, // 3000 tokens - changes daily
      cache_control: { type: 'ephemeral', ttl: '5m' },
    },
  ],
  messages: [
    {
      role: 'user',
      content: userQuery, // Dynamic - never cached
    },
  ],
});
```

**3. Cache Invalidation Awareness**:
```typescript
// These changes BREAK cache:
// - Modifying tool definitions
// - Toggling web search
// - Changing image presence
// - Modifying extended thinking params

// These PRESERVE cache:
// - Changing only tool_choice
// - Keeping identical cached blocks
```

---

## 3. Extended Thinking (Complex Reasoning)

### When to Use Extended Thinking

**Good Use Cases** ✅:
- Mathematical problem-solving
- Code analysis and debugging
- Complex multi-step reasoning
- Research and analysis tasks
- Strategic planning

**Poor Use Cases** ❌:
- Simple lookups or classifications
- Intent extraction (email processing)
- Quick queries with obvious answers
- Real-time chat responses

### Budget Configuration

```typescript
// Minimum: 1,024 tokens
// Recommended starting point: 16,000+ tokens

interface ThinkingConfig {
  enabled: boolean;
  budgetTokens: number; // Max reasoning tokens
}

export async function analyzeContactWithThinking(contactData: any) {
  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
    defaultHeaders: {
      'anthropic-beta': 'thinking-2025-11-15', // Required for thinking
    },
  });

  const message = await anthropic.messages.create({
    model: 'claude-opus-4-1-20250805',
    max_tokens: 16000,
    thinking: {
      type: 'enabled',
      budget_tokens: 10000, // Allocate 10k tokens for reasoning
    },
    messages: [
      {
        role: 'user',
        content: `Analyze this contact and determine the optimal engagement strategy: ${JSON.stringify(contactData)}`,
      },
    ],
  });

  // Response contains both thinking and text blocks
  const thinkingBlocks = message.content.filter(block => block.type === 'thinking');
  const textBlocks = message.content.filter(block => block.type === 'text');

  return {
    reasoning: thinkingBlocks[0]?.thinking || '',
    answer: textBlocks[0]?.text || '',
    thinkingTokens: message.usage.thinking_tokens || 0,
  };
}
```

### Cost Implications

**Pricing**: Thinking tokens use standard output token pricing
- Opus 4: **$75/MTok** (same as output)
- Sonnet 4.5: **$15/MTok**

**Example Cost**:
```
Contact analysis with thinking:
- Input: 500 tokens × $15/MTok = $0.0075
- Thinking: 8,000 tokens × $75/MTok = $0.60
- Output: 200 tokens × $75/MTok = $0.015
Total: $0.6225 per analysis
```

**Without thinking**:
```
Same task without thinking:
- Input: 500 tokens × $15/MTok = $0.0075
- Output: 200 tokens × $75/MTok = $0.015
Total: $0.0225 per analysis
```

**Decision**: Use thinking only when accuracy justifies **27.7x cost increase**

### Production Pattern

```typescript
// Adaptive thinking budget based on complexity
export function getThinkingBudget(complexity: 'simple' | 'medium' | 'complex'): number {
  const budgets = {
    simple: 0, // No thinking
    medium: 5000,
    complex: 10000,
  };
  return budgets[complexity];
}

// Complexity detection
export function detectComplexity(task: string): 'simple' | 'medium' | 'complex' {
  const indicators = {
    complex: ['analyze', 'strategy', 'optimize', 'debug', 'research'],
    medium: ['summarize', 'compare', 'evaluate'],
  };

  const lowerTask = task.toLowerCase();

  if (indicators.complex.some(word => lowerTask.includes(word))) {
    return 'complex';
  }
  if (indicators.medium.some(word => lowerTask.includes(word))) {
    return 'medium';
  }
  return 'simple';
}
```

---

## 4. Error Handling & Recovery

### Official Error Types

```typescript
// HTTP Status → Error Type mapping
const ERROR_TYPES = {
  400: 'invalid_request_error', // Bad request format
  401: 'authentication_error', // API key issues
  403: 'permission_error', // Insufficient permissions
  404: 'not_found_error', // Resource doesn't exist
  413: 'request_too_large', // Exceeds size limits
  429: 'rate_limit_error', // Rate limit exceeded
  500: 'api_error', // Anthropic internal error
  529: 'overloaded_error', // Temporary overload
} as const;
```

### Request Size Limits

| Endpoint | Maximum Size |
|----------|-------------|
| Messages API | 32 MB |
| Token Counting API | 32 MB |
| Batch API | 256 MB |
| Files API | 500 MB |

### Production Error Handler

```typescript
// src/lib/anthropic/error-handler.ts

import { log, securityLog } from '@/lib/logger';
import { apiErrors } from '@/lib/metrics';

export class AnthropicError extends Error {
  constructor(
    public statusCode: number,
    public errorType: string,
    public message: string,
    public requestId?: string
  ) {
    super(message);
    this.name = 'AnthropicError';
  }
}

export async function handleAnthropicError(error: any): Promise<never> {
  // Extract request ID for support
  const requestId = error.headers?.['request-id'];

  // Log based on error type
  switch (error.status) {
    case 401:
      securityLog('authentication_failure', 'high', {
        errorType: 'anthropic_auth_error',
        message: error.message,
        requestId,
      });
      apiErrors.inc({ route: 'anthropic-api', error_type: 'auth' });
      throw new AnthropicError(401, 'authentication_error', 'Invalid API key', requestId);

    case 429:
      log.warn('Rate limit exceeded', {
        retryAfter: error.headers?.['retry-after'],
        requestId,
      });
      apiErrors.inc({ route: 'anthropic-api', error_type: 'rate_limit' });
      // Don't throw - let retry handler deal with it
      throw error;

    case 413:
      log.error('Request too large', {
        size: error.message,
        requestId,
      });
      apiErrors.inc({ route: 'anthropic-api', error_type: 'request_too_large' });
      throw new AnthropicError(413, 'request_too_large', 'Request exceeds size limit', requestId);

    case 500:
    case 529:
      log.error('Anthropic API error', {
        status: error.status,
        message: error.message,
        requestId,
      });
      apiErrors.inc({ route: 'anthropic-api', error_type: 'server_error' });
      // Retry handler will deal with these
      throw error;

    default:
      log.error('Unknown Anthropic error', {
        status: error.status,
        message: error.message,
        requestId,
      });
      apiErrors.inc({ route: 'anthropic-api', error_type: 'unknown' });
      throw error;
  }
}

// Usage
export async function safeAnthropicCall<T>(
  fn: () => Promise<T>
): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    return handleAnthropicError(error);
  }
}
```

### Request ID Tracking

```typescript
// Always log request IDs for support escalation
export interface ApiCallMetadata {
  requestId?: string;
  duration: number;
  tokenUsage: {
    input: number;
    output: number;
    cached: number;
  };
}

export async function trackApiCall<T>(
  operation: string,
  fn: () => Promise<any>
): Promise<{ result: T; metadata: ApiCallMetadata }> {
  const startTime = Date.now();

  try {
    const response = await fn();
    const requestId = response.id; // Anthropic returns this

    const metadata: ApiCallMetadata = {
      requestId,
      duration: Date.now() - startTime,
      tokenUsage: {
        input: response.usage.input_tokens || 0,
        output: response.usage.output_tokens || 0,
        cached: response.usage.cache_read_input_tokens || 0,
      },
    };

    // Log for audit trail
    log.info(`Anthropic API call: ${operation}`, metadata);

    return { result: response, metadata };
  } catch (error: any) {
    const requestId = error.headers?.['request-id'];
    log.error(`Anthropic API call failed: ${operation}`, {
      requestId,
      duration: Date.now() - startTime,
      error: error.message,
    });
    throw error;
  }
}
```

---

## 5. Cache-Aware Rate Limiting

### Critical Insight

**Only uncached input tokens count toward ITPM rate limits.**

```typescript
// Effective throughput calculation
const effectiveTPM = (
  cacheReadTokens + // Don't count toward ITPM
  cacheCreationTokens + // Count ONCE toward ITPM
  inputTokens // Count toward ITPM
);

// With 90% cache hit rate:
// Actual ITPM = 30,000 (tier limit)
// Effective ITPM = 300,000 (10x throughput)
```

### Production Implementation

```typescript
// src/lib/anthropic/cache-aware-limiter.ts

export class CacheAwareRateLimiter {
  private uncachedTokensUsed: number = 0;
  private resetTime: Date = new Date();
  private readonly limit: number;

  constructor(itpmLimit: number) {
    this.limit = itpmLimit;
  }

  trackUsage(usage: {
    input_tokens: number;
    cache_creation_input_tokens?: number;
    cache_read_input_tokens?: number;
  }): void {
    // Only count uncached tokens toward limit
    const uncachedTokens =
      usage.input_tokens +
      (usage.cache_creation_input_tokens || 0);
    // cache_read_input_tokens explicitly excluded

    this.uncachedTokensUsed += uncachedTokens;
  }

  canMakeRequest(estimatedTokens: number): boolean {
    return this.uncachedTokensUsed + estimatedTokens <= this.limit;
  }

  getUtilization(): number {
    return (this.uncachedTokensUsed / this.limit) * 100;
  }

  reset(): void {
    this.uncachedTokensUsed = 0;
    this.resetTime = new Date(Date.now() + 60000); // +1 minute
  }
}
```

---

## 6. Unite-Hub Specific Recommendations

### Current Implementation Analysis

**Already Implemented** ✅:
```typescript
// src/lib/agents/contact-intelligence.ts
// src/lib/agents/content-personalization.ts
// src/lib/agents/email-processor.ts

✅ Prompt caching with cache_control
✅ Extended thinking for complex tasks
✅ Usage tracking and logging
```

### Missing P0 Patterns ❌:

**1. Retry Logic with Exponential Backoff**
```typescript
// Add to all Anthropic API calls
import { callAnthropicWithRetry } from '@/lib/anthropic/rate-limiter';

// Wrap existing calls
const message = await callAnthropicWithRetry(() =>
  anthropic.messages.create({...})
);
```

**2. Request ID Tracking**
```typescript
// Log all request IDs for support escalation
log.info('Contact analysis complete', {
  contactId,
  anthropicRequestId: message.id,
  duration,
  cost,
});
```

**3. Cache-Aware Rate Limiting**
```typescript
// Track cache efficiency for capacity planning
const limiter = new CacheAwareRateLimiter(30000); // Tier 1 ITPM
limiter.trackUsage(message.usage);

if (limiter.getUtilization() > 80) {
  log.warn('Approaching rate limit', {
    utilization: limiter.getUtilization(),
  });
}
```

### Implementation Priority

**Week 1 (P0)**:
1. Add retry logic to all Anthropic calls (2 hours)
2. Implement request ID tracking (1 hour)
3. Add rate limit monitoring (2 hours)

**Week 2 (P1)**:
4. Implement cache-aware rate limiter (3 hours)
5. Add error type classification (2 hours)
6. Create Anthropic API dashboard (3 hours)

---

## 7. Monitoring & Observability

### Key Metrics to Track

```typescript
// Prometheus metrics for Anthropic API
export const anthropicMetrics = {
  // Request metrics
  requestDuration: new Histogram({
    name: 'anthropic_request_duration_seconds',
    help: 'Duration of Anthropic API requests',
    labelNames: ['model', 'operation', 'cache_hit'],
    buckets: [0.5, 1, 2, 5, 10, 30, 60],
  }),

  // Token metrics
  tokensUsed: new Counter({
    name: 'anthropic_tokens_total',
    help: 'Total tokens used by type',
    labelNames: ['model', 'token_type'], // input, output, cache_read, cache_create
  }),

  // Cost metrics
  costDollars: new Counter({
    name: 'anthropic_cost_dollars_total',
    help: 'Total cost in dollars',
    labelNames: ['model', 'operation'],
  }),

  // Cache metrics
  cacheHitRate: new Gauge({
    name: 'anthropic_cache_hit_rate',
    help: 'Cache hit rate percentage',
    labelNames: ['model'],
  }),

  // Rate limit metrics
  rateLimitUtilization: new Gauge({
    name: 'anthropic_rate_limit_utilization',
    help: 'Percentage of rate limit used',
    labelNames: ['tier'],
  }),

  // Error metrics
  errors: new Counter({
    name: 'anthropic_errors_total',
    help: 'Total errors by type',
    labelNames: ['error_type', 'retryable'],
  }),
};
```

### Dashboard Queries

```promql
# Average API response time by model
rate(anthropic_request_duration_seconds_sum[5m])
/ rate(anthropic_request_duration_seconds_count[5m])

# Cache hit rate
sum(rate(anthropic_tokens_total{token_type="cache_read"}[5m]))
/ sum(rate(anthropic_tokens_total{token_type=~"input|cache_read|cache_create"}[5m]))

# Cost per hour
sum(increase(anthropic_cost_dollars_total[1h]))

# Rate limit utilization
anthropic_rate_limit_utilization

# Error rate by type
sum(rate(anthropic_errors_total[5m])) by (error_type)
```

---

## Summary: Production Checklist

### ✅ Already Implemented (Unite-Hub)
- [x] Prompt caching with cache_control
- [x] Extended thinking for complex tasks
- [x] Usage logging
- [x] Token cost tracking

### ❌ Critical Missing Patterns

**P0 (This Week)**:
- [ ] Exponential backoff retry logic
- [ ] Request ID tracking for support
- [ ] Rate limit header monitoring
- [ ] Error type classification

**P1 (Next 2 Weeks)**:
- [ ] Cache-aware rate limiting
- [ ] Anthropic API metrics dashboard
- [ ] Automated cost alerts (>$X/day)
- [ ] Request size validation (prevent 413 errors)

**P2 (Month 1)**:
- [ ] Cache efficiency reporting
- [ ] Thinking budget optimization
- [ ] Model selection automation (use Haiku for simple tasks)
- [ ] Batch API for non-urgent requests

---

**Next Step**: Implement P0 retry logic and request tracking this week.
