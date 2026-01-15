# Anthropic API Patterns

**Status**: ⏳ To be migrated from CLAUDE.md
**Last Updated**: 2026-01-15

---

## Model Selection

**Available Models**:
- **Opus 4.5** (`claude-opus-4-5-20251101`) - Content generation with Extended Thinking
- **Sonnet 4.5** (`claude-sonnet-4-5-20250929`) - Standard operations
- **Haiku 4.5** (`claude-haiku-4-5-20251001`) - Quick tasks, documentation

## Rate Limiting with Exponential Backoff

```typescript
import { callAnthropicWithRetry } from '@/lib/anthropic/rate-limiter';

const result = await callAnthropicWithRetry(async () => {
  return await anthropic.messages.create({
    model: 'claude-opus-4-5-20251101',
    max_tokens: 2048,
    messages: [{ role: 'user', content: 'Analyze contact...' }],
  });
});
```

## Prompt Caching (90% Cost Savings)

```typescript
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  defaultHeaders: {
    'anthropic-beta': 'prompt-caching-2024-07-31',
  },
});

const message = await anthropic.messages.create({
  model: 'claude-sonnet-4-5-20250929',
  max_tokens: 2048,
  system: [
    {
      type: 'text',
      text: systemPrompt,
      cache_control: { type: 'ephemeral' }, // Cache for 5 minutes
    },
  ],
  messages: [{ role: 'user', content: dynamicContent }],
});

// Monitor cache performance
console.log('Cache hit:', (message.usage.cache_read_input_tokens || 0) > 0);
```

## Extended Thinking (Complex Tasks Only)

```typescript
const message = await anthropic.messages.create({
  model: 'claude-opus-4-5-20251101',
  thinking: {
    type: 'enabled',
    budget_tokens: 10000, // Use for complex analysis only
  },
  messages: [{ role: 'user', content: 'Strategic analysis...' }],
});
```

**Cost**: Thinking tokens = $7.50/MTok (27x more expensive than non-thinking)

**Use When**: Complex reasoning, strategic planning, code debugging

**Avoid**: Simple lookups, intent extraction, quick queries

## Documentation

**See**: `docs/ANTHROPIC_PRODUCTION_PATTERNS.md` for complete implementation guides.

---

**To be migrated from**: CLAUDE.md lines 584-650
