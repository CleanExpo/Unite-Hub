# Anthropic API Rate Limiter

Enhanced rate limiter for Anthropic Claude API with exponential backoff, per-model rate limiting, and comprehensive usage tracking.

## Features

- **Exponential Backoff with Jitter**: Prevents thundering herd problem
- **Per-Model Rate Limiting**: Separate limits for Opus, Sonnet, and Haiku
- **Concurrent Request Control**: Limits simultaneous API calls
- **Token Tracking**: Monitors input/output/cache tokens
- **Usage Statistics**: Detailed metrics per model and overall
- **Event Callbacks**: Hook into rate limit events
- **Prompt Caching Support**: Headers for Anthropic's prompt caching

## Installation

The rate limiter is already included in the Unite-Hub codebase at `src/integrations/anthropic/`.

## Quick Start

```typescript
import { callAnthropicWithRetry } from '@/integrations/anthropic';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Simple usage with automatic retry
const result = await callAnthropicWithRetry(
  async () => anthropic.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 1024,
    messages: [{ role: 'user', content: 'Hello, Claude!' }],
  }),
  { model: 'claude-sonnet-4-5-20250929' }
);

if (result.success) {
  console.log('Response:', result.data?.content);
  console.log('Retries:', result.retries);
  console.log('Latency:', result.latencyMs, 'ms');
} else {
  console.error('Error:', result.error);
}
```

## Advanced Usage

### Using the Singleton Instance

```typescript
import { getAnthropicRateLimiter } from '@/integrations/anthropic';

const limiter = getAnthropicRateLimiter();

// Check rate limits before making request
const limitCheck = limiter.checkModelLimit('claude-opus-4-5-20251101', 2000);

if (!limitCheck.allowed) {
  console.log('Rate limited:', limitCheck.reason);
  console.log('Retry after:', limitCheck.retryAfterMs, 'ms');
  console.log('Current usage:', limitCheck.currentUsage);
}

// Make request with custom retry options
const result = await limiter.callWithRetry(
  async () => anthropic.messages.create({ ... }),
  {
    model: 'claude-opus-4-5-20251101',
    estimatedTokens: 2000,
    retryOptions: {
      maxRetries: 5,
      initialDelayMs: 2000,
      maxDelayMs: 120000,
      backoffMultiplier: 2.5,
      jitterFactor: 0.2,
    },
  }
);
```

### Prompt Caching

```typescript
import { callAnthropicWithRetry } from '@/integrations/anthropic';

const result = await callAnthropicWithRetry(
  async () => anthropic.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 1024,
    system: [
      {
        type: 'text',
        text: 'You are a helpful assistant...',
        cache_control: { type: 'ephemeral' }, // Cache this system prompt
      },
    ],
    messages: [{ role: 'user', content: 'Dynamic user input' }],
  }),
  {
    model: 'claude-sonnet-4-5-20250929',
    estimatedTokens: 1500,
  }
);

// Check cache usage
if (result.success && result.data) {
  console.log('Cache read tokens:', result.data.usage.cache_read_input_tokens);
  console.log('Cache creation tokens:', result.data.usage.cache_creation_input_tokens);
}
```

### Event Callbacks

```typescript
import { getAnthropicRateLimiter } from '@/integrations/anthropic';

const limiter = getAnthropicRateLimiter();

limiter.onEvent((event, data) => {
  switch (event) {
    case 'rate_limit_hit':
      console.log(`Rate limit hit for ${data.model}`);
      break;
    case 'retry_attempted':
      console.log(`Retry ${data.retries} for ${data.model}`);
      break;
    case 'request_success':
      console.log(`Success for ${data.model} in ${data.latencyMs}ms`);
      break;
    case 'request_error':
      console.error(`Error for ${data.model}:`, data.error);
      break;
  }
});
```

### Usage Statistics

```typescript
import { getAnthropicRateLimiter } from '@/integrations/anthropic';

const limiter = getAnthropicRateLimiter();

// Get overall statistics
const stats = limiter.getUsageStats();
console.log('Total requests:', stats.totalRequests);
console.log('Total input tokens:', stats.totalInputTokens);
console.log('Total output tokens:', stats.totalOutputTokens);
console.log('Cache read tokens:', stats.totalCacheReadTokens);
console.log('Average latency:', stats.averageLatencyMs, 'ms');
console.log('Rate limit hits:', stats.totalRateLimitHits);
console.log('Total retries:', stats.totalRetries);

// Get model-specific statistics
const sonnetStats = limiter.getModelStats('claude-sonnet-4-5-20250929');
console.log('Sonnet requests:', sonnetStats?.requestCount);
console.log('Sonnet avg latency:', sonnetStats?.averageLatencyMs, 'ms');
```

## Rate Limit Configuration

Default limits (Tier 2):

| Model | Requests/Min | Tokens/Min | Tokens/Day | Concurrent |
|-------|--------------|------------|------------|------------|
| Opus 4.5 | 50 | 40,000 | 1,000,000 | 5 |
| Sonnet 4.5 | 50 | 40,000 | 1,000,000 | 5 |
| Haiku 4.5 | 50 | 50,000 | 5,000,000 | 5 |

**Note**: Adjust these limits in `src/integrations/anthropic/types.ts` based on your Anthropic API tier.

## Retry Configuration

Default retry options:

```typescript
{
  maxRetries: 3,                    // Max retry attempts
  initialDelayMs: 1000,             // Initial delay (1 second)
  maxDelayMs: 60000,                // Max delay (1 minute)
  backoffMultiplier: 2,             // Exponential factor
  jitterFactor: 0.1,                // Jitter (±10%)
  retryOn: [429, 500, 502, 503, 504] // HTTP codes to retry
}
```

Retry delays (with jitter):
- Attempt 1: ~1s
- Attempt 2: ~2s
- Attempt 3: ~4s

## API Reference

### `callAnthropicWithRetry<T>(fn, options)`

Convenience function to call Anthropic API with retry logic.

**Parameters:**
- `fn`: Async function that makes the API call
- `options.model`: Claude model identifier
- `options.estimatedTokens?`: Estimated token usage for rate limiting
- `options.retryOptions?`: Custom retry configuration

**Returns:** `Promise<ApiCallResult<T>>`

### `getAnthropicRateLimiter()`

Get singleton rate limiter instance.

**Returns:** `AnthropicRateLimiter`

### `AnthropicRateLimiter` Methods

#### `checkModelLimit(model, estimatedTokens?)`

Check if request is allowed under rate limits.

**Returns:** `RateLimitCheckResult`

#### `trackUsage(model, tokens)`

Track API usage after successful request.

#### `callWithRetry(fn, options)`

Call API with retry logic and rate limiting.

**Returns:** `Promise<ApiCallResult<T>>`

#### `getUsageStats()`

Get overall usage statistics.

**Returns:** `UsageStats`

#### `getModelStats(model)`

Get usage statistics for specific model.

**Returns:** `ModelUsageStats | undefined`

#### `onEvent(callback)`

Register event callback.

## Integration Examples

### In API Routes

```typescript
// src/app/api/ai/chat/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { callAnthropicWithRetry } from '@/integrations/anthropic';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(req: NextRequest) {
  const { message } = await req.json();

  const result = await callAnthropicWithRetry(
    async () => anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 1024,
      messages: [{ role: 'user', content: message }],
    }),
    {
      model: 'claude-sonnet-4-5-20250929',
      estimatedTokens: 1500,
    }
  );

  if (!result.success) {
    return NextResponse.json(
      { error: result.error?.message || 'API call failed' },
      { status: 500 }
    );
  }

  return NextResponse.json({
    response: result.data?.content[0].text,
    usage: result.data?.usage,
    latency: result.latencyMs,
    retries: result.retries,
  });
}
```

### In Agent Scripts

```typescript
// src/agents/content/contentAgent.ts
import { callAnthropicWithRetry } from '@/integrations/anthropic';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function generateContent(prompt: string) {
  const result = await callAnthropicWithRetry(
    async () => anthropic.messages.create({
      model: 'claude-opus-4-5-20251101',
      max_tokens: 4096,
      thinking: { type: 'enabled', budget_tokens: 5000 },
      messages: [{ role: 'user', content: prompt }],
    }),
    {
      model: 'claude-opus-4-5-20251101',
      estimatedTokens: 9000,
      retryOptions: {
        maxRetries: 5,
        initialDelayMs: 2000,
      },
    }
  );

  if (!result.success) {
    throw new Error(`Content generation failed: ${result.error?.message}`);
  }

  return result.data;
}
```

## Testing

```typescript
import { getAnthropicRateLimiter } from '@/integrations/anthropic';

describe('AnthropicRateLimiter', () => {
  beforeEach(() => {
    const limiter = getAnthropicRateLimiter();
    limiter.resetStats();
  });

  it('should allow requests under rate limit', () => {
    const limiter = getAnthropicRateLimiter();
    const result = limiter.checkModelLimit('claude-sonnet-4-5-20250929', 1000);

    expect(result.allowed).toBe(true);
  });

  it('should block requests over rate limit', async () => {
    const limiter = getAnthropicRateLimiter();

    // Make 50 requests (at limit)
    for (let i = 0; i < 50; i++) {
      limiter.trackUsage('claude-sonnet-4-5-20250929', {
        input_tokens: 100,
        output_tokens: 100,
      });
    }

    const result = limiter.checkModelLimit('claude-sonnet-4-5-20250929', 100);
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('limit exceeded');
  });
});
```

## Troubleshooting

### Rate Limit Errors

If you're hitting rate limits frequently:

1. **Check your tier**: Verify limits in Anthropic dashboard
2. **Adjust configuration**: Update `MODEL_RATE_LIMITS` in `types.ts`
3. **Optimize token usage**: Use prompt caching, reduce context
4. **Increase retry delays**: Adjust `retryOptions.initialDelayMs`

### High Latency

If requests are slow:

1. **Check retry count**: High retries indicate rate limiting
2. **Monitor concurrent requests**: Too many simultaneous calls
3. **Review usage stats**: Look for patterns in `getUsageStats()`
4. **Optimize prompts**: Reduce token count where possible

## License

MIT
