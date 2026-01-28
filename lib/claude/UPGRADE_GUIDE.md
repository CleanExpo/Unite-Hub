# Anthropic Client Upgrade - New Features (2025)

## ✅ What's New

1. **Prompt Caching** - 90% cost reduction for repeated contexts  
2. **Token Counting** - Estimate costs before API calls
3. **Extended Thinking** - Complex reasoning capability
4. **PDF Support** - Native document analysis
5. **Vision Support** - Image analysis

## Quick Start

### Prompt Caching (Save 90%)
```typescript
import { createMessageWithCaching } from '@/lib/claude/client';

await createMessageWithCaching(
  [{ role: 'user', content: 'Question' }],
  'Long system prompt here...'  // This gets cached
);
```

### Token Counting
```typescript
import { countTokens, estimateCost } from '@/lib/claude/client';

const tokens = await countTokens(messages);
const cost = await estimateCost(messages, systemPrompt, 1000, true);
console.log(`Cost: $${cost.totalCost}`);
```

### Extended Thinking
```typescript
import { createMessageWithThinking } from '@/lib/claude/client';

const response = await createMessageWithThinking(
  [{ role: 'user', content: 'Complex problem...' }],
  undefined,
  10000  // Thinking budget
);
```

### PDF Analysis
```typescript
import { createMessageWithPDF } from '@/lib/claude/client';

const response = await createMessageWithPDF(
  pdfBase64,
  'Summarize this document'
);
```

## Backward Compatible

All existing code continues to work:
```typescript
import { createMessage } from '@/lib/claude/client';
// Works exactly as before
```
