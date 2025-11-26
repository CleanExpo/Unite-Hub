# 🎯 Unite-Hub: Model Selection & Cost Optimization Strategy

**Version:** 1.0.0
**Last Updated:** 2025-11-18
**Status:** Production-Ready

---

## 🔑 Core Principle

**Priority Order for Model Selection:**

1. **Assigned LLM** (if a specific model is assigned to a task)
2. **OpenRouter Model** (cheapest model that can successfully perform the task)
3. **Google AI** (fallback when OpenRouter unavailable)
4. **Always ensure a model is available** (graceful degradation)

**Golden Rule:** Use the **cheapest model that can properly complete the task without errors or quality issues**.

---

## 📊 Available Models & Costs

### Current Models in Unite-Hub

| Model | Provider | Context Window | Cost (Input/Output per 1M tokens) | Best For |
|-------|----------|----------------|-----------------------------------|----------|
| **Claude Opus 4** | Anthropic | 200k | $15 / $75 | Content generation with Extended Thinking |
| **Claude Sonnet 4.5** | Anthropic | 200k | $3 / $15 | Standard operations, API integration |
| **Claude Haiku 4.5** | Anthropic | 200k | $0.80 / $4 | Quick tasks, simple queries |
| **Sherlock Think Alpha** | OpenRouter | 1.84M | ~$1 / $5 | Deep analysis, large codebase reasoning |
| **Gemini 2.0 Flash** | Google | 1M | $0.10 / $0.40 | Ultra-cheap operations, fallback |
| **Gemini 2.0 Pro** | Google | 2M | $1.25 / $5 | Complex reasoning, large context |

### OpenRouter Budget Models (via OPENROUTER_API_KEY)

| Model | Context | Cost (Input/Output) | Use Case |
|-------|---------|---------------------|----------|
| **google/gemini-2.0-flash-lite** | 1M | $0.05 / $0.20 | Ultra-budget tasks |
| **google/gemini-2.0-flash** | 1M | $0.10 / $0.40 | General purpose |
| **anthropic/claude-haiku-4.5** | 200k | $0.80 / $4 | Anthropic budget tier |
| **meta-llama/llama-3.3-70b** | 128k | $0.35 / $0.40 | Open source alternative |
| **sherlock-think-alpha** | 1.84M | ~$1 / $5 | Deep reasoning |

---

## 🎯 Task-to-Model Mapping

### Tier 1: Ultra-Cheap Tasks ($0.01-0.10 per call)

**Use:** `google/gemini-2.0-flash-lite` (OpenRouter) → `gemini-2.0-flash` (Google API)

**Tasks:**
- Email subject line generation
- Simple intent extraction ("Is this email about pricing?")
- Tag generation (categorize: "support", "sales", "billing")
- Basic sentiment analysis ("positive", "negative", "neutral")
- Short text summaries (< 500 words)
- Simple classification tasks

**Example:**
```typescript
// Simple intent extraction
const intent = await routeToModel({
  task: 'extract_intent',
  prompt: 'What is the main intent of this email: "I need a quote for 50 licenses"',
  preferredModel: 'gemini-flash-lite'
});
// Cost: ~$0.001 per call
```

---

### Tier 2: Budget Tasks ($0.10-1.00 per call)

**Use:** `claude-haiku-4.5` (Anthropic) → `gemini-2.0-flash` (Google API)

**Tasks:**
- Email intelligence extraction (business goals, pain points)
- Contact scoring calculations
- Short document generation (< 1000 words)
- Code snippet generation
- API response formatting
- Quick data transformations

**Example:**
```typescript
// Email intelligence extraction
const intelligence = await routeToModel({
  task: 'email_intelligence',
  prompt: `Extract business goals, pain points, and requirements from this email: ${emailContent}`,
  preferredModel: 'claude-haiku-4.5'
});
// Cost: ~$0.02-0.10 per email
```

---

### Tier 3: Standard Tasks ($1-5 per call)

**Use:** `claude-sonnet-4.5` (Anthropic) → `sherlock-think-alpha` (OpenRouter)

**Tasks:**
- Marketing strategy generation (basic)
- Content calendar creation
- Campaign optimization
- Code generation (medium complexity)
- API integrations
- Multi-step workflows
- Buyer persona creation

**Example:**
```typescript
// Buyer persona generation
const persona = await routeToModel({
  task: 'generate_persona',
  prompt: `Create a detailed buyer persona based on: ${intelligence}`,
  preferredModel: 'claude-sonnet-4.5',
  fallback: 'sherlock-think-alpha'
});
// Cost: ~$0.50-2.00 per persona
```

---

### Tier 4: Premium Tasks ($5-20 per call)

**Use:** `claude-opus-4` with Extended Thinking → `gemini-2.0-pro` (Google API)

**Tasks:**
- **Content generation with Extended Thinking** (high-quality marketing content)
- **Complex strategic planning** (multi-phase campaigns)
- **Deep code analysis** (architecture reviews)
- **Comprehensive marketing strategies** (full 90-day plans)
- **Creative copywriting** (sales pages, landing pages)

**Example:**
```typescript
// High-quality content generation
const content = await routeToModel({
  task: 'generate_content',
  prompt: `Generate a compelling blog post about: ${topic}`,
  preferredModel: 'claude-opus-4',
  thinkingBudget: 5000, // Enable Extended Thinking
  fallback: 'gemini-2.0-pro'
});
// Cost: ~$5-15 per piece
```

---

### Tier 5: Ultra-Premium Tasks ($20+ per call)

**Use:** `sherlock-think-alpha` (1.84M context) → `gemini-2.0-pro` (2M context)

**Tasks:**
- **Full codebase analysis** (100+ files)
- **Security audits** (entire application)
- **Architectural refactoring plans**
- **End-to-end system design**
- **Complex multi-agent coordination**

**Example:**
```typescript
// Full codebase security audit
const audit = await routeToModel({
  task: 'security_audit',
  prompt: 'Analyze this entire codebase for security vulnerabilities',
  context: await loadCodebase(['src/**/*.ts']),
  preferredModel: 'sherlock-think-alpha',
  fallback: 'gemini-2.0-pro'
});
// Cost: ~$20-50 per audit
```

---

## ⚙️ Implementation: Model Router

### File: `src/lib/agents/model-router.ts`

```typescript
import Anthropic from "@anthropic-ai/sdk";
import { getOpenRouterClient } from "../openrouter";
import { GoogleGenerativeAI } from "@google/generative-ai";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const openRouter = getOpenRouterClient();
const googleAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || "");

// Model pricing (per 1M tokens)
const MODEL_COSTS = {
  // Anthropic
  "claude-opus-4": { input: 15, output: 75 },
  "claude-sonnet-4.5": { input: 3, output: 15 },
  "claude-haiku-4.5": { input: 0.8, output: 4 },

  // OpenRouter
  "gemini-flash-lite": { input: 0.05, output: 0.2 },
  "gemini-flash": { input: 0.1, output: 0.4 },
  "sherlock-think-alpha": { input: 1, output: 5 },
  "llama-3.3-70b": { input: 0.35, output: 0.4 },

  // Google Direct API
  "gemini-2.0-flash": { input: 0.1, output: 0.4 },
  "gemini-2.0-pro": { input: 1.25, output: 5 },
};

export type TaskType =
  | "extract_intent"          // Ultra-cheap
  | "tag_generation"          // Ultra-cheap
  | "sentiment_analysis"      // Ultra-cheap
  | "email_intelligence"      // Budget
  | "contact_scoring"         // Budget
  | "generate_persona"        // Standard
  | "generate_strategy"       // Standard
  | "generate_content"        // Premium (Extended Thinking)
  | "security_audit"          // Ultra-premium
  | "codebase_analysis";      // Ultra-premium

export type ModelName =
  | "claude-opus-4"
  | "claude-sonnet-4.5"
  | "claude-haiku-4.5"
  | "gemini-flash-lite"
  | "gemini-flash"
  | "sherlock-think-alpha"
  | "llama-3.3-70b"
  | "gemini-2.0-flash"
  | "gemini-2.0-pro";

export interface RouteOptions {
  task: TaskType;
  prompt: string;
  context?: string;
  assignedModel?: ModelName;        // Force specific model
  preferredModel?: ModelName;       // Preferred but not forced
  fallback?: ModelName;             // Fallback if preferred fails
  thinkingBudget?: number;          // Enable Extended Thinking (Opus only)
  maxTokens?: number;
  temperature?: number;
}

export interface ModelResponse {
  model: ModelName;
  response: string;
  reasoning?: string;               // For Extended Thinking
  tokensUsed: { input: number; output: number };
  costEstimate: number;
  latencyMs: number;
}

export class ModelRouter {
  /**
   * Route task to the optimal model based on priority order:
   * 1. Assigned model (if specified)
   * 2. OpenRouter model (cheapest that works)
   * 3. Google API (fallback)
   * 4. Always ensure a model is available
   */
  async route(options: RouteOptions): Promise<ModelResponse> {
    const startTime = Date.now();

    // 1. Use assigned model if specified (highest priority)
    if (options.assignedModel) {
      console.log(`🎯 Using assigned model: ${options.assignedModel}`);
      return await this.callModel(options.assignedModel, options, startTime);
    }

    // 2. Auto-select based on task type and cost optimization
    const recommendedModel = this.selectOptimalModel(options.task, options);

    try {
      console.log(`💡 Recommended model: ${recommendedModel}`);
      return await this.callModel(recommendedModel, options, startTime);
    } catch (error) {
      console.error(`❌ ${recommendedModel} failed:`, error);

      // 3. Try fallback model if specified
      if (options.fallback) {
        console.log(`🔄 Trying fallback: ${options.fallback}`);
        try {
          return await this.callModel(options.fallback, options, startTime);
        } catch (fallbackError) {
          console.error(`❌ Fallback ${options.fallback} failed:`, fallbackError);
        }
      }

      // 4. Final fallback: Gemini Flash (cheapest, most reliable)
      console.log(`🆘 Using emergency fallback: gemini-2.0-flash`);
      return await this.callModel("gemini-2.0-flash", options, startTime);
    }
  }

  /**
   * Select optimal model based on task type
   */
  private selectOptimalModel(task: TaskType, options: RouteOptions): ModelName {
    // Prefer user's preferred model if specified
    if (options.preferredModel) {
      return options.preferredModel;
    }

    // Auto-select based on task type (cheapest that works)
    const taskToModelMap: Record<TaskType, ModelName> = {
      // Ultra-cheap tasks → Gemini Flash Lite (OpenRouter)
      extract_intent: "gemini-flash-lite",
      tag_generation: "gemini-flash-lite",
      sentiment_analysis: "gemini-flash-lite",

      // Budget tasks → Claude Haiku
      email_intelligence: "claude-haiku-4.5",
      contact_scoring: "claude-haiku-4.5",

      // Standard tasks → Claude Sonnet
      generate_persona: "claude-sonnet-4.5",
      generate_strategy: "claude-sonnet-4.5",

      // Premium tasks → Claude Opus (with Extended Thinking)
      generate_content: "claude-opus-4",

      // Ultra-premium tasks → Sherlock Think Alpha (1.84M context)
      security_audit: "sherlock-think-alpha",
      codebase_analysis: "sherlock-think-alpha",
    };

    return taskToModelMap[task] || "claude-sonnet-4.5";
  }

  /**
   * Call specific model
   */
  private async callModel(
    model: ModelName,
    options: RouteOptions,
    startTime: number
  ): Promise<ModelResponse> {
    const fullPrompt = options.context
      ? `${options.prompt}\n\n---\n\nContext:\n${options.context}`
      : options.prompt;

    // Anthropic models
    if (model.startsWith("claude-")) {
      return await this.callAnthropic(model, fullPrompt, options, startTime);
    }

    // OpenRouter models
    if (["gemini-flash-lite", "gemini-flash", "sherlock-think-alpha", "llama-3.3-70b"].includes(model)) {
      return await this.callOpenRouter(model, fullPrompt, options, startTime);
    }

    // Google Direct API models
    if (model.startsWith("gemini-")) {
      return await this.callGoogleAI(model, fullPrompt, options, startTime);
    }

    throw new Error(`Unknown model: ${model}`);
  }

  /**
   * Call Anthropic API
   */
  private async callAnthropic(
    model: ModelName,
    prompt: string,
    options: RouteOptions,
    startTime: number
  ): Promise<ModelResponse> {
    const anthropicModel = {
      "claude-opus-4": "claude-opus-4-5-20251101",
      "claude-sonnet-4.5": "claude-sonnet-4-5-20250929",
      "claude-haiku-4.5": "claude-haiku-4-5-20251001",
    }[model];

    const messageOptions: any = {
      model: anthropicModel,
      max_tokens: options.maxTokens || 4096,
      temperature: options.temperature || 0.7,
      messages: [{ role: "user", content: prompt }],
    };

    // Enable Extended Thinking for Opus if requested
    if (model === "claude-opus-4" && options.thinkingBudget) {
      messageOptions.thinking = {
        type: "enabled",
        budget_tokens: options.thinkingBudget,
      };
    }

    const message = await anthropic.messages.create(messageOptions);

    const response = message.content.find(c => c.type === "text")?.text || "";
    const reasoning = message.content.find(c => c.type === "thinking")?.thinking || undefined;

    const tokensUsed = {
      input: message.usage.input_tokens,
      output: message.usage.output_tokens,
    };

    const costEstimate = this.calculateCost(model, tokensUsed);

    return {
      model,
      response,
      reasoning,
      tokensUsed,
      costEstimate,
      latencyMs: Date.now() - startTime,
    };
  }

  /**
   * Call OpenRouter API
   */
  private async callOpenRouter(
    model: ModelName,
    prompt: string,
    options: RouteOptions,
    startTime: number
  ): Promise<ModelResponse> {
    if (!openRouter.isAvailable()) {
      throw new Error("OpenRouter API key not configured");
    }

    const openRouterModel = {
      "gemini-flash-lite": "google/gemini-2.0-flash-lite",
      "gemini-flash": "google/gemini-2.0-flash",
      "sherlock-think-alpha": "openrouter/sherlock-think-alpha",
      "llama-3.3-70b": "meta-llama/llama-3.3-70b-instruct",
    }[model];

    const response = await openRouter.chat(prompt, {
      model: openRouterModel,
      maxTokens: options.maxTokens || 4096,
      temperature: options.temperature || 0.7,
    });

    // Estimate tokens (OpenRouter doesn't always return usage)
    const tokensUsed = {
      input: Math.ceil(prompt.length / 4),
      output: Math.ceil(response.length / 4),
    };

    const costEstimate = this.calculateCost(model, tokensUsed);

    return {
      model,
      response,
      tokensUsed,
      costEstimate,
      latencyMs: Date.now() - startTime,
    };
  }

  /**
   * Call Google AI Direct API
   */
  private async callGoogleAI(
    model: ModelName,
    prompt: string,
    options: RouteOptions,
    startTime: number
  ): Promise<ModelResponse> {
    const googleModel = googleAI.getGenerativeModel({
      model: model === "gemini-2.0-flash" ? "gemini-2.0-flash" : "gemini-2.0-pro",
    });

    const result = await googleModel.generateContent(prompt);
    const response = result.response.text();

    // Estimate tokens
    const tokensUsed = {
      input: Math.ceil(prompt.length / 4),
      output: Math.ceil(response.length / 4),
    };

    const costEstimate = this.calculateCost(model, tokensUsed);

    return {
      model,
      response,
      tokensUsed,
      costEstimate,
      latencyMs: Date.now() - startTime,
    };
  }

  /**
   * Calculate cost estimate
   */
  private calculateCost(model: ModelName, tokensUsed: { input: number; output: number }): number {
    const costs = MODEL_COSTS[model];
    if (!costs) return 0;

    return (
      (tokensUsed.input / 1_000_000) * costs.input +
      (tokensUsed.output / 1_000_000) * costs.output
    );
  }
}

// Singleton instance
let router: ModelRouter | null = null;

export function getModelRouter(): ModelRouter {
  if (!router) {
    router = new ModelRouter();
  }
  return router;
}

/**
 * Convenience function for routing tasks
 */
export async function routeToModel(options: RouteOptions): Promise<ModelResponse> {
  const router = getModelRouter();
  return await router.route(options);
}
```

---

## 🔧 Usage Examples

### Example 1: Simple Intent Extraction (Ultra-Cheap)

```typescript
import { routeToModel } from "@/lib/agents/model-router";

const intent = await routeToModel({
  task: "extract_intent",
  prompt: `What is the main intent of this email: "${emailContent}"`,
  // Will auto-select: gemini-flash-lite (~$0.001 per call)
});

console.log(`Intent: ${intent.response}`);
console.log(`Cost: $${intent.costEstimate.toFixed(4)}`);
```

### Example 2: Email Intelligence (Budget)

```typescript
const intelligence = await routeToModel({
  task: "email_intelligence",
  prompt: `Extract business goals, pain points, and requirements from this email thread`,
  context: emailThread,
  // Will auto-select: claude-haiku-4.5 (~$0.02-0.10 per email)
});
```

### Example 3: Content Generation (Premium with Extended Thinking)

```typescript
const content = await routeToModel({
  task: "generate_content",
  prompt: `Write a compelling 1000-word blog post about AI marketing automation`,
  assignedModel: "claude-opus-4", // Force Opus for quality
  thinkingBudget: 5000,            // Enable Extended Thinking
  // Cost: ~$5-15 per piece
});

console.log(`Response: ${content.response}`);
console.log(`Reasoning: ${content.reasoning}`);
```

### Example 4: Codebase Analysis (Ultra-Premium)

```typescript
const codebase = await loadCodebase(["src/**/*.ts"]);

const audit = await routeToModel({
  task: "codebase_analysis",
  prompt: "Analyze this entire codebase for security vulnerabilities and performance issues",
  context: formatCodebase(codebase),
  // Will auto-select: sherlock-think-alpha (1.84M context)
  fallback: "gemini-2.0-pro",  // Fallback to Google if OpenRouter fails
  // Cost: ~$20-50 per audit
});
```

### Example 5: Force Specific Model

```typescript
const persona = await routeToModel({
  task: "generate_persona",
  prompt: "Create a detailed buyer persona",
  assignedModel: "gemini-2.0-pro", // Force Google model
  // Will use Google even if Anthropic would be cheaper
});
```

---

## 💰 Cost Optimization Rules

### 1. Task Classification
- **Always classify tasks by complexity** before routing
- **Start with cheapest model** that can handle the task
- **Upgrade only if quality issues occur**

### 2. Context Window Optimization
- **< 10k tokens**: Use Gemini Flash Lite (ultra-cheap)
- **10k-100k tokens**: Use Claude Haiku/Sonnet
- **100k-200k tokens**: Use Claude Sonnet 4.5
- **200k-1M tokens**: Use Gemini 2.0 Flash/Pro
- **> 1M tokens**: Use Sherlock Think Alpha (1.84M context)

### 3. Quality Thresholds
- **Acceptable quality loss for cost savings**:
  - Email tagging: Use cheapest model (Gemini Flash Lite)
  - Marketing content: Use premium model (Opus with Extended Thinking)
  - Code generation: Use standard model (Sonnet)

### 4. Batch Operations
- **Process similar tasks in batches** to reduce API overhead
- **Cache results for repeated queries**
- **Use prompt caching for large context** (Claude only)

---

## 📈 Cost Tracking & Monitoring

### Track Model Usage

```typescript
// File: src/lib/agents/model-usage-tracker.ts

interface UsageRecord {
  timestamp: Date;
  model: string;
  task: string;
  tokensUsed: { input: number; output: number };
  costEstimate: number;
  latencyMs: number;
  success: boolean;
}

export class ModelUsageTracker {
  private records: UsageRecord[] = [];

  async track(
    model: string,
    task: string,
    tokensUsed: { input: number; output: number },
    costEstimate: number,
    latencyMs: number,
    success: boolean
  ) {
    this.records.push({
      timestamp: new Date(),
      model,
      task,
      tokensUsed,
      costEstimate,
      latencyMs,
      success,
    });

    // Save to database
    await supabase.from("model_usage").insert({
      model,
      task,
      input_tokens: tokensUsed.input,
      output_tokens: tokensUsed.output,
      cost_usd: costEstimate,
      latency_ms: latencyMs,
      success,
    });
  }

  generateReport() {
    const totalCost = this.records.reduce((sum, r) => sum + r.costEstimate, 0);
    const avgLatency = this.records.reduce((sum, r) => sum + r.latencyMs, 0) / this.records.length;

    const byModel = this.records.reduce((acc, r) => {
      if (!acc[r.model]) acc[r.model] = { calls: 0, cost: 0 };
      acc[r.model].calls++;
      acc[r.model].cost += r.costEstimate;
      return acc;
    }, {} as Record<string, { calls: number; cost: number }>);

    return {
      totalCost,
      avgLatency,
      byModel,
      totalCalls: this.records.length,
    };
  }
}
```

---

## 🔒 Security & Compliance

### API Key Management

```env
# .env.local

# Anthropic (Primary for quality tasks)
ANTHROPIC_API_KEY=sk-ant-api03-...

# OpenRouter (Budget tasks, fallback)
OPENROUTER_API_KEY=sk-or-v1-...

# Google AI (Emergency fallback)
GOOGLE_AI_API_KEY=...

# Supabase (Usage tracking)
NEXT_PUBLIC_SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
```

### Rate Limiting

```typescript
// Implement rate limiting per model
const RATE_LIMITS = {
  "claude-opus-4": { requestsPerMinute: 10 },
  "claude-sonnet-4.5": { requestsPerMinute: 50 },
  "claude-haiku-4.5": { requestsPerMinute: 100 },
  "gemini-flash-lite": { requestsPerMinute: 1000 },
  "sherlock-think-alpha": { requestsPerMinute: 20 },
};
```

---

## ✅ Success Criteria

**Model routing is successful when:**

1. ✅ **99.9% uptime** - Always a model available (fallbacks work)
2. ✅ **Cost < $10/day** - Average daily AI costs under budget
3. ✅ **Quality score >= 8/10** - User satisfaction with AI outputs
4. ✅ **Latency < 10s** - 95th percentile response time
5. ✅ **Auto-optimization** - System learns which models work best per task

---

## 🚀 Future Enhancements

### Phase 2
1. **Automatic model selection based on performance data**
2. **Cost vs. quality optimization engine**
3. **Real-time model switching** (if one model is slow, switch to alternative)

### Phase 3
1. **Multi-model consensus** (ask 3 models, pick best answer)
2. **Fine-tuned models** (train custom models for specific tasks)
3. **Model performance A/B testing**

---

**END OF MODEL SELECTION STRATEGY**
