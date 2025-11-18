# 🚀 Model Router - Quick Reference Card

**One-page guide for developers**

---

## 📦 Import

```typescript
import { routeToModel } from "@/lib/agents/model-router";
```

---

## 🎯 Basic Usage

```typescript
const result = await routeToModel({
  task: "email_intelligence",        // Task type (see table below)
  prompt: "Extract business goals",  // Your prompt
  context: emailContent,             // Optional context
});

console.log(result.response);        // AI response
console.log(result.costEstimate);    // Cost in USD
console.log(result.latencyMs);       // Response time
```

---

## 📊 Task Types & Auto-Selected Models

| Task Type | Model | Cost/Call | Use For |
|-----------|-------|-----------|---------|
| `extract_intent` | Gemini Flash Lite | $0.00002 | Email intent, quick classification |
| `tag_generation` | Gemini Flash Lite | $0.00002 | Generate tags/categories |
| `sentiment_analysis` | Gemini Flash Lite | $0.00002 | Positive/negative/neutral |
| `email_intelligence` | Claude Haiku | $0.002 | Extract goals, pain points |
| `contact_scoring` | Claude Haiku | $0.001 | Calculate lead scores |
| `generate_persona` | Claude Sonnet | $0.02 | Create buyer personas |
| `generate_strategy` | Claude Sonnet | $0.50 | Marketing strategies |
| `generate_content` | Claude Opus | $10.00 | Blog posts, high-quality content |
| `security_audit` | Sherlock | $20.00 | Codebase security audits |
| `codebase_analysis` | Sherlock | $20.00 | Architectural reviews |

---

## 🔧 Advanced Options

### Force Specific Model

```typescript
const result = await routeToModel({
  task: "generate_content",
  prompt: "Write blog post",
  assignedModel: "claude-opus-4", // Force Opus
});
```

### Add Fallback

```typescript
const result = await routeToModel({
  task: "codebase_analysis",
  prompt: "Analyze security",
  preferredModel: "sherlock-think-alpha",
  fallback: "claude-sonnet-4.5", // If Sherlock fails
});
```

### Enable Extended Thinking (Opus only)

```typescript
const result = await routeToModel({
  task: "generate_content",
  prompt: "Write complex content",
  assignedModel: "claude-opus-4",
  thinkingBudget: 5000, // 5k thinking tokens
});

console.log(result.reasoning); // See thinking process
```

### Control Temperature

```typescript
const result = await routeToModel({
  task: "email_intelligence",
  prompt: "Extract facts",
  temperature: 0.2, // Low = factual, High = creative
});
```

---

## 💰 Cost Optimization Tips

### ✅ DO

- **Batch similar tasks** to reduce API overhead
- **Use cheapest model** that works for the task
- **Add fallbacks** to prevent failures
- **Track costs** in database

```typescript
// Batch processing (saves $$$)
const batchPrompt = emails.map((e, i) => `Email ${i}: ${e}`).join("\n\n");
const result = await routeToModel({
  task: "extract_intent",
  prompt: `Extract intent for each. Return JSON array: ${batchPrompt}`,
});
```

### ❌ DON'T

- Don't use Opus for simple tasks
- Don't ignore fallbacks
- Don't forget to track costs
- Don't use high temperature for factual tasks

---

## 🧪 Quick Test

```typescript
// Test ultra-cheap (Gemini Flash Lite)
const intent = await routeToModel({
  task: "extract_intent",
  prompt: "Intent of: 'I need a quote'",
});
console.log(`Cost: $${intent.costEstimate.toFixed(6)}`); // ~$0.000020

// Test premium (Opus with Thinking)
const content = await routeToModel({
  task: "generate_content",
  prompt: "Write 100-word product description",
  assignedModel: "claude-opus-4",
  thinkingBudget: 2000,
});
console.log(`Cost: $${content.costEstimate.toFixed(4)}`); // ~$5-10
```

---

## 📋 Response Object

```typescript
interface ModelResponse {
  model: string;              // Model used ("claude-opus-4", etc.)
  response: string;           // AI response
  reasoning?: string;         // Extended Thinking output (Opus only)
  tokensUsed: {
    input: number;
    output: number;
  };
  costEstimate: number;       // Cost in USD
  latencyMs: number;          // Response time
}
```

---

## 🔀 Priority Order

When you call `routeToModel()`, it selects a model in this order:

1. **Assigned Model** (if `assignedModel` specified)
2. **Preferred Model** (if `preferredModel` specified)
3. **Auto-Selected Model** (based on `task` type)
4. **Fallback Model** (if preferred fails)
5. **Emergency Fallback** (Claude Haiku - always available)

---

## 🎨 Real-World Examples

### Example 1: Email Classification Pipeline

```typescript
// Step 1: Extract intent (ultra-cheap)
const intent = await routeToModel({
  task: "extract_intent",
  prompt: `Intent of: ${email}`,
});

// Step 2: Extract intelligence (budget)
const intelligence = await routeToModel({
  task: "email_intelligence",
  prompt: `Extract goals, pain points from: ${email}`,
});

// Step 3: Calculate score (budget)
const score = await routeToModel({
  task: "contact_scoring",
  prompt: `Score this contact (0-100): ${intelligence.response}`,
});

// Total cost: ~$0.003 per email
```

### Example 2: Content Generation Pipeline

```typescript
// Step 1: Generate outline (standard)
const outline = await routeToModel({
  task: "generate_strategy",
  prompt: `Create blog post outline for: ${topic}`,
});

// Step 2: Write full content (premium)
const content = await routeToModel({
  task: "generate_content",
  prompt: `Write full blog post based on: ${outline.response}`,
  assignedModel: "claude-opus-4",
  thinkingBudget: 5000,
});

// Total cost: ~$5-10 per blog post
```

### Example 3: Codebase Analysis Pipeline

```typescript
// Step 1: Quick security scan (standard)
const quickScan = await routeToModel({
  task: "security_audit",
  prompt: `Quick security check for: ${coreFiles}`,
  preferredModel: "claude-sonnet-4.5",
});

// Step 2: Deep audit if issues found (ultra-premium)
if (quickScan.response.includes("vulnerability")) {
  const deepAudit = await routeToModel({
    task: "security_audit",
    prompt: `Comprehensive security audit`,
    context: allCodebaseFiles,
    preferredModel: "sherlock-think-alpha",
    fallback: "claude-sonnet-4.5",
  });
}

// Total cost: $2 (quick) or $20 (deep)
```

---

## 🚨 Common Errors & Fixes

### Error: "OpenRouter API key not configured"

**Fix:**
```bash
# Add to .env.local
OPENROUTER_API_KEY=sk-or-v1-...
# OR
OPENROUTER_API_KEY_2=sk-or-v1-...
```

### Error: "Failed to parse JSON"

**Fix:**
```typescript
const result = await routeToModel({
  task: "email_intelligence",
  prompt: `${emailPrompt}

IMPORTANT: Return ONLY valid JSON, no markdown.`,
});

try {
  const data = JSON.parse(result.response);
} catch (error) {
  console.error("Invalid JSON:", result.response);
}
```

### Error: "Model not available"

**Fix:** Always add a fallback:
```typescript
const result = await routeToModel({
  task: "generate_content",
  preferredModel: "sherlock-think-alpha",
  fallback: "claude-sonnet-4.5", // ✅ Always works
});
```

---

## 📈 Cost Tracking

### Track to Database

```typescript
const result = await routeToModel({ task: "email_intelligence", prompt: emailPrompt });

// Save to model_usage table
await supabase.from("model_usage").insert({
  model: result.model,
  task: "email_intelligence",
  input_tokens: result.tokensUsed.input,
  output_tokens: result.tokensUsed.output,
  cost_usd: result.costEstimate,
  latency_ms: result.latencyMs,
});
```

### Daily Cost Report

```typescript
const { data: usage } = await supabase
  .from("model_usage")
  .select("*")
  .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000));

const totalCost = usage.reduce((sum, u) => sum + u.cost_usd, 0);
console.log(`💰 Last 24h cost: $${totalCost.toFixed(4)}`);
```

---

## ✅ Cheat Sheet

| I want to... | Use this... |
|--------------|-------------|
| Classify emails | `task: "extract_intent"` |
| Extract email data | `task: "email_intelligence"` |
| Score leads | `task: "contact_scoring"` |
| Create personas | `task: "generate_persona"` |
| Write blog posts | `task: "generate_content"` + `assignedModel: "claude-opus-4"` |
| Audit codebase | `task: "security_audit"` + `preferredModel: "sherlock-think-alpha"` |
| Force specific model | `assignedModel: "claude-opus-4"` |
| Add fallback | `fallback: "claude-sonnet-4.5"` |
| Enable thinking | `thinkingBudget: 5000` |
| Save money | Use cheapest task type that works |

---

## 🎯 Quick Decision Tree

```
Need AI help?
  ├─ Simple 1-word answer? → task: "extract_intent"
  ├─ Extract structured data? → task: "email_intelligence"
  ├─ Calculate score? → task: "contact_scoring"
  ├─ Generate persona? → task: "generate_persona"
  ├─ High-quality content? → task: "generate_content" + assignedModel: "claude-opus-4"
  └─ Analyze large codebase? → task: "codebase_analysis" + preferredModel: "sherlock-think-alpha"
```

---

**Need help? Check:**
- Full guide: `MODEL_SELECTION_STRATEGY.md`
- Integration: `INTEGRATION_GUIDE_MODEL_ROUTER.md`
- Examples: `src/lib/agents/examples/model-router-usage.ts`
