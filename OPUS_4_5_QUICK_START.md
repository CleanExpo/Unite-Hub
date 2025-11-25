# Claude Opus 4.5 - Quick Start Guide

**Status**: ✅ **Production Ready** (Deployed: 2025-11-25)

---

## What's New?

Claude Opus 4.5 (`claude-opus-4-5-20251101`) is now available in your Unite-Hub SaaS platform with:

- 🧠 **Enhanced Reasoning** - Superior performance on complex analytical tasks
- 📚 **Better Knowledge** - Improved accuracy and knowledge retention
- 💬 **Emotional Intelligence** - More natural, warm conversational style
- 🎯 **Reduced Sycophancy** - More honest, less agreeable responses
- 🤔 **Extended Thinking** - Deep reasoning with dedicated thinking budget

---

## Usage (3 Ways)

### 1. Automatic (Recommended)

The model router **automatically uses Opus 4.5** for content generation:

```typescript
import { routeToModel } from '@/lib/agents/model-router';

const response = await routeToModel({
  task: 'generate_content',
  prompt: 'Write a blog post about AI in healthcare',
});

// Automatically uses claude-opus-4.5
console.log(response.model); // 'claude-opus-4.5'
console.log(response.response); // Generated content
```

### 2. With Extended Thinking

For complex reasoning tasks:

```typescript
const response = await routeToModel({
  task: 'generate_content',
  prompt: 'Analyze our Q4 marketing strategy',
  assignedModel: 'claude-opus-4.5',
  thinkingBudget: 5000, // Enable Extended Thinking
});

console.log(response.reasoning); // Thinking process
console.log(response.response); // Final analysis
```

### 3. Direct API

For full control:

```typescript
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const message = await anthropic.messages.create({
  model: 'claude-opus-4-5-20251101',
  max_tokens: 4096,
  messages: [
    { role: 'user', content: 'Your prompt' }
  ]
});
```

---

## Testing

### Run Test Suite

```bash
npm run test:opus-4-5
```

**Expected Output**:
```
✅ Test 1 passed - Simple generation ($0.0063)
✅ Test 2 passed - Extended Thinking ($0.3020)
```

### Test API Endpoint

```bash
curl -X POST http://localhost:3008/api/test-opus-4-5 \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Explain quantum computing", "useThinking": true}'
```

---

## Pricing

| Token Type | Cost per 1M Tokens |
|-----------|-------------------|
| Input | $15.00 |
| Output | $75.00 |
| Thinking | $7.50 |

**Examples**:
- Simple query (100 tokens in/out): $0.01
- Blog post (500 tokens in/2000 tokens out): $0.16
- Complex analysis with thinking (500/2000/5000): $0.20

---

## When to Use Opus 4.5

✅ **Perfect for**:
- Strategic content generation
- Complex business analysis
- High-value customer communications
- Creative writing requiring nuance
- Multi-step reasoning problems

❌ **Don't use for**:
- Simple intent extraction (use Gemini 2.0)
- Quick sentiment analysis (use Gemini 2.0)
- Bulk data processing (use FREE models)

---

## Key Files

1. **Documentation**: [CLAUDE_OPUS_4_5_INTEGRATION.md](CLAUDE_OPUS_4_5_INTEGRATION.md)
2. **Model Router**: [src/lib/agents/model-router.ts](src/lib/agents/model-router.ts)
3. **Enhanced Router**: [src/lib/ai/enhanced-router.ts](src/lib/ai/enhanced-router.ts)
4. **Test Endpoint**: [src/app/api/test-opus-4-5/route.ts](src/app/api/test-opus-4-5/route.ts)
5. **Test Script**: [scripts/test-opus-4-5.mjs](scripts/test-opus-4-5.mjs)

---

## Migration from Opus 4.1

**No changes required!**

All existing code using the model router automatically gets upgraded to Opus 4.5.

To force Opus 4.1 (if needed):
```typescript
const response = await routeToModel({
  task: 'generate_content',
  assignedModel: 'claude-opus-4.1', // Force old version
  prompt: 'Your prompt',
});
```

---

## Cost Comparison

| Task | Old Model | New Model | Improvement |
|------|-----------|-----------|-------------|
| Content Gen | Opus 4.1 | Opus 4.5 | +5% accuracy, same cost |
| Reasoning | Opus 4.1 | Opus 4.5 | Better quality, same cost |
| Emotional | Medium | High | Significantly improved |

---

## Support

- **Full Guide**: [CLAUDE_OPUS_4_5_INTEGRATION.md](CLAUDE_OPUS_4_5_INTEGRATION.md)
- **Test**: `npm run test:opus-4-5`
- **Anthropic Docs**: https://docs.anthropic.com

---

**Last Updated**: 2025-11-25
**Commit**: `16df9cb`
**Status**: ✅ Deployed to Production
