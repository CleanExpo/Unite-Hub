# OpenRouter Integration Guide

Complete guide for using OpenRouter models in Unite-Hub.

**Last Updated**: 2025-11-18
**Status**: ✅ Production Ready

---

## Table of Contents

1. [Overview](#overview)
2. [Available Models](#available-models)
3. [Quick Start](#quick-start)
4. [Usage Examples](#usage-examples)
5. [Model Selection Guide](#model-selection-guide)
6. [Cost Optimization](#cost-optimization)
7. [API Reference](#api-reference)

---

## Overview

Unite-Hub now supports 17 OpenRouter models across 6 categories:

| Category | Models | Use Cases |
|----------|--------|-----------|
| **Reasoning** | 3 models | Complex analysis, strategic planning, contact intelligence |
| **Coding** | 1 model | API generation, database queries, TypeScript |
| **Embedding** | 5 models | Semantic search, similarity matching, clustering |
| **Search** | 1 model | Real-time market research, competitor analysis |
| **General** | 5 models | Content generation, email drafting, summaries |
| **Vision** | 2 models | Image analysis, OCR, document processing |

### Pricing Tiers

- **Free Tier**: 2 models (100% cost savings)
- **Standard Tier**: 11 models ($0.02-$3.00 per 1M tokens)
- **Premium Tier**: 4 models ($1.50-$15.00 per 1M tokens)

---

## Available Models

### 🧠 Reasoning Models

#### 1. Sherlock Dash Alpha
```typescript
Model ID: openrouter/sherlock-dash-alpha
Alias: MODEL_ALIASES.SHERLOCK_DASH
```
- **Context**: 128K tokens
- **Output**: 8K tokens
- **Pricing**: $2.00 / $8.00 per 1M tokens
- **Best for**: Complex problem solving, contact intelligence, campaign optimization

#### 2. Sherlock Think Alpha
```typescript
Model ID: openrouter/sherlock-think-alpha
Alias: MODEL_ALIASES.SHERLOCK_THINK
```
- **Context**: 128K tokens
- **Output**: 16K tokens
- **Pricing**: $3.00 / $12.00 per 1M tokens
- **Best for**: Deep analysis requiring extended thinking

#### 3. Kimi K2 Thinking
```typescript
Model ID: moonshotai/kimi-k2-thinking
Alias: MODEL_ALIASES.KIMI_THINKING
```
- **Context**: 200K tokens
- **Output**: 8K tokens
- **Pricing**: $1.50 / $6.00 per 1M tokens
- **Best for**: Long-context analysis, email thread comprehension

### 💻 Coding Models

#### 4. KAT Coder Pro (FREE)
```typescript
Model ID: kwaipilot/kat-coder-pro:free
Alias: MODEL_ALIASES.KAT_CODER
```
- **Context**: 32K tokens
- **Output**: 4K tokens
- **Pricing**: FREE
- **Best for**: API generation, TypeScript, React components

### 🔍 Embedding Models

#### 5-9. Embedding Models
| Model | Dimensions | Cost (per 1M) | Best For |
|-------|-----------|---------------|----------|
| Gemini Embedding 001 | 768 | $0.01 | Contact matching |
| OpenAI Ada 002 | 1536 | $0.10 | Legacy compatibility |
| OpenAI 3 Large | 3072 | $0.13 | High precision |
| OpenAI 3 Small | 1536 | $0.02 | Cost-effective |
| Qwen3 8B | 2048 | $0.05 | Multi-language |

### 🌐 Search Models

#### 10. Sonar Pro Search
```typescript
Model ID: perplexity/sonar-pro-search
Alias: MODEL_ALIASES.SONAR_SEARCH
```
- **Context**: 32K tokens
- **Output**: 4K tokens
- **Pricing**: $3.00 / $15.00 per 1M tokens
- **Best for**: Real-time market research, competitor analysis

### 📝 General Purpose Models

#### 11-15. General Models
| Model | Context | Cost (per 1M) | Best For |
|-------|---------|---------------|----------|
| Voxtral Small 24B | 32K | $0.50 / $1.50 | Email drafting |
| MiniMax M2 | 16K | $0.30 / $0.90 | Cost-effective content |
| Liquid LFM2 8B | 8K | $0.20 / $0.60 | Quick responses |
| Liquid LFM 2.2 6B | 8K | $0.15 / $0.45 | Ultra-fast tasks |

### 👁️ Vision Models

#### 16-17. Vision Models
| Model | Tier | Cost (per 1M) | Best For |
|-------|------|---------------|----------|
| Nemotron VL (Free) | Free | FREE | Screenshot analysis |
| Nemotron VL | Standard | $0.10 / $0.30 | High-quality image analysis |

---

## Quick Start

### 1. Set Environment Variables

Add to `.env.local`:
```env
OPENROUTER_API_KEY=sk-or-v1-your-key-here
OPENROUTER_API_KEY_2=sk-or-v1-your-backup-key-here  # Optional
```

### 2. Basic Usage

```typescript
import { OpenRouter, MODEL_ALIASES } from '@/lib/ai/openrouter-client';

// Simple completion
const response = await OpenRouter.complete(
  MODEL_ALIASES.SHERLOCK_DASH,
  'Analyze this contact: John Doe, CEO at TechCorp',
  'You are an AI CRM assistant.'
);

console.log(response);
```

### 3. Chat Completion

```typescript
import { OpenRouterClient } from '@/lib/ai/openrouter-client';

const client = new OpenRouterClient();

const response = await client.chat(
  MODEL_ALIASES.SHERLOCK_DASH,
  [
    { role: 'system', content: 'You are a CRM assistant.' },
    { role: 'user', content: 'Score this contact based on engagement' }
  ],
  {
    temperature: 0.7,
    maxTokens: 1024
  }
);

console.log(response);
```

---

## Usage Examples

### Example 1: Contact Intelligence Analysis

```typescript
import { OpenRouter, MODEL_ALIASES } from '@/lib/ai/openrouter-client';

async function analyzeContact(contact: Contact) {
  const prompt = `
Analyze this contact and provide:
1. Lead score (0-100)
2. Engagement level
3. Key insights
4. Recommended next actions

Contact: ${contact.name}
Email: ${contact.email}
Company: ${contact.company}
Recent Activity: ${contact.recent_activity}
  `;

  const analysis = await OpenRouter.complete(
    MODEL_ALIASES.SHERLOCK_DASH,
    prompt,
    'You are an expert CRM analyst.',
    { temperature: 0.3, maxTokens: 1024 }
  );

  return JSON.parse(analysis);
}
```

### Example 2: Email Content Generation

```typescript
import { OpenRouter, MODEL_ALIASES } from '@/lib/ai/openrouter-client';

async function generateFollowUpEmail(contact: Contact) {
  const prompt = `
Generate a personalized follow-up email for this contact:

Contact Name: ${contact.name}
Company: ${contact.company}
Last Interaction: ${contact.last_interaction}
Interest: ${contact.interests}

Tone: Professional but friendly
Length: 150-200 words
  `;

  const email = await OpenRouter.complete(
    MODEL_ALIASES.VOXTRAL,  // Cost-effective for content generation
    prompt,
    'You are a professional email copywriter.',
    { temperature: 0.8, maxTokens: 512 }
  );

  return email;
}
```

### Example 3: Semantic Search with Embeddings

```typescript
import { OpenRouterClient, MODEL_ALIASES } from '@/lib/ai/openrouter-client';

async function findSimilarContacts(query: string) {
  const client = new OpenRouterClient();

  // Generate embedding for query
  const queryEmbedding = await client.chat(
    MODEL_ALIASES.OPENAI_EMBED_SMALL,
    [{ role: 'user', content: query }]
  );

  // Compare with stored contact embeddings
  // (Implementation depends on your vector database)

  return similarContacts;
}
```

### Example 4: Market Research with Search

```typescript
import { OpenRouter, MODEL_ALIASES } from '@/lib/ai/openrouter-client';

async function researchCompetitor(companyName: string) {
  const prompt = `
Research ${companyName} and provide:
1. Recent news and developments
2. Market position
3. Key products/services
4. Competitive advantages
5. Potential opportunities for partnership
  `;

  const research = await OpenRouter.complete(
    MODEL_ALIASES.SONAR_SEARCH,  // Real-time web search
    prompt,
    'You are a business intelligence analyst.',
    { temperature: 0.5, maxTokens: 2048 }
  );

  return research;
}
```

### Example 5: Code Generation

```typescript
import { OpenRouter, MODEL_ALIASES } from '@/lib/ai/openrouter-client';

async function generateApiEndpoint(spec: string) {
  const prompt = `
Generate a Next.js API route for the following specification:

${spec}

Requirements:
- TypeScript with proper types
- Error handling
- Input validation
- Supabase integration
- Return JSON response
  `;

  const code = await OpenRouter.complete(
    MODEL_ALIASES.KAT_CODER,  // FREE coding model
    prompt,
    'You are an expert Next.js developer.',
    { temperature: 0.2, maxTokens: 2048 }
  );

  return code;
}
```

### Example 6: Streaming Responses

```typescript
import { OpenRouterClient, MODEL_ALIASES } from '@/lib/ai/openrouter-client';

async function generateContentStreaming(prompt: string) {
  const client = new OpenRouterClient();

  const stream = client.createStreamingChatCompletion({
    model: MODEL_ALIASES.SHERLOCK_DASH,
    messages: [
      { role: 'system', content: 'You are a content writer.' },
      { role: 'user', content: prompt }
    ],
    temperature: 0.7,
    max_tokens: 1024,
  });

  let fullContent = '';

  for await (const chunk of stream) {
    fullContent += chunk;
    console.log(chunk);  // Stream to UI
  }

  return fullContent;
}
```

---

## Model Selection Guide

### By Use Case

| Use Case | Recommended Model | Alternative |
|----------|------------------|-------------|
| **Contact Scoring** | Sherlock Dash | Kimi K2 |
| **Email Generation** | Voxtral Small | MiniMax M2 |
| **Code Generation** | KAT Coder Pro (Free) | - |
| **Semantic Search** | OpenAI Embed Small | Gemini Embed |
| **Market Research** | Sonar Pro Search | - |
| **Image Analysis** | Nemotron VL | Nemotron VL (Free) |
| **Quick Tasks** | Liquid LFM 6B | Liquid LFM2 8B |
| **Deep Analysis** | Sherlock Think | Kimi K2 |

### By Budget

**Cost-Conscious** (< $0.50 per 1M tokens):
- Liquid LFM 2.2 6B ($0.15/$0.45)
- Liquid LFM2 8B ($0.20/$0.60)
- MiniMax M2 ($0.30/$0.90)

**Balanced** ($0.50 - $2.00 per 1M tokens):
- Voxtral Small ($0.50/$1.50)
- Kimi K2 Thinking ($1.50/$6.00)
- Sherlock Dash ($2.00/$8.00)

**Premium** (> $2.00 per 1M tokens):
- Sherlock Think ($3.00/$12.00)
- Sonar Pro Search ($3.00/$15.00)

**FREE** (Best value):
- KAT Coder Pro (coding tasks)
- Nemotron VL (vision tasks)

---

## Cost Optimization

### 1. Use Free Models First

```typescript
// Try free model first, fallback to paid
async function analyzeWithFallback(prompt: string) {
  try {
    return await OpenRouter.complete(
      MODEL_ALIASES.KAT_CODER,  // Free
      prompt
    );
  } catch (error) {
    return await OpenRouter.complete(
      MODEL_ALIASES.VOXTRAL,  // Paid fallback
      prompt
    );
  }
}
```

### 2. Choose Right Model for Task

```typescript
// Use cheaper model for simple tasks
const simpleTask = await OpenRouter.complete(
  MODEL_ALIASES.LIQUID_8B,  // $0.20 per 1M
  'Generate 5 email subject lines'
);

// Use premium model only for complex tasks
const complexTask = await OpenRouter.complete(
  MODEL_ALIASES.SHERLOCK_THINK,  // $3.00 per 1M
  'Develop comprehensive CRM strategy'
);
```

### 3. Limit Max Tokens

```typescript
const response = await OpenRouter.complete(
  MODEL_ALIASES.SHERLOCK_DASH,
  prompt,
  systemPrompt,
  { maxTokens: 512 }  // Limit output to reduce cost
);
```

### 4. Track Usage

```typescript
import { calculateCost } from '@/lib/ai/openrouter-config';

const cost = calculateCost(
  MODEL_ALIASES.SHERLOCK_DASH,
  1000,  // prompt tokens
  500    // completion tokens
);

console.log(`Estimated cost: $${cost.toFixed(6)}`);
```

---

## API Reference

### OpenRouterClient

```typescript
class OpenRouterClient {
  constructor(apiKey?: string)

  // Main methods
  async createChatCompletion(request: OpenRouterRequest, retries?: number): Promise<OpenRouterResponse>
  async *createStreamingChatCompletion(request: OpenRouterRequest): AsyncGenerator<string>
  async chat(modelId: string, messages: OpenRouterMessage[], options?): Promise<string>
  async complete(modelId: string, prompt: string, systemPrompt?: string, options?): Promise<string>

  // Utility methods
  async getAvailableModels(): Promise<any>
  async validateApiKey(): Promise<boolean>
}
```

### Helper Functions

```typescript
// Get client instance
const client = getOpenRouterClient(apiKey?)

// Quick completion
const response = await openRouterComplete(modelId, prompt, systemPrompt?, options?)

// Quick chat
const response = await openRouterChat(modelId, messages, options?)

// Model helpers
const models = getModelsByCategory('reasoning')
const freeModels = getFreeModels()
const recommended = getRecommendedModel('contact scoring')
```

### Configuration Types

```typescript
interface OpenRouterModel {
  id: string
  name: string
  provider: string
  category: ModelCategory
  contextWindow: number
  maxOutput: number
  pricing: { prompt: number; completion: number }
  capabilities: {...}
  useCases: string[]
  tier: 'free' | 'standard' | 'premium'
  description: string
}
```

---

## Best Practices

### 1. Always Set System Prompts

```typescript
// ❌ Bad
await OpenRouter.complete(MODEL_ALIASES.SHERLOCK_DASH, prompt);

// ✅ Good
await OpenRouter.complete(
  MODEL_ALIASES.SHERLOCK_DASH,
  prompt,
  'You are an expert CRM analyst specializing in B2B sales.'
);
```

### 2. Handle Errors Gracefully

```typescript
try {
  const response = await OpenRouter.complete(modelId, prompt);
  return response;
} catch (error) {
  console.error('OpenRouter error:', error);
  return 'Failed to generate response';
}
```

### 3. Use Temperature Appropriately

```typescript
// Factual/Analytical tasks: Low temperature (0.0-0.3)
const analysis = await OpenRouter.complete(
  MODEL_ALIASES.SHERLOCK_DASH,
  prompt,
  systemPrompt,
  { temperature: 0.2 }
);

// Creative tasks: Higher temperature (0.7-1.0)
const content = await OpenRouter.complete(
  MODEL_ALIASES.VOXTRAL,
  prompt,
  systemPrompt,
  { temperature: 0.8 }
);
```

### 4. Monitor Costs

```typescript
import { calculateCost } from '@/lib/ai/openrouter-config';

// Before making request
const estimatedCost = calculateCost(modelId, estimatedPromptTokens, estimatedCompletionTokens);

if (estimatedCost > dailyBudget) {
  console.warn('Request exceeds daily budget');
  // Use cheaper model or skip
}
```

---

## Support

For issues or questions:
- Check OpenRouter docs: https://openrouter.ai/docs
- Review model pricing: https://openrouter.ai/models
- Unite-Hub support: Create GitHub issue

---

**Last Updated**: 2025-11-18
**Integration Status**: ✅ Production Ready
