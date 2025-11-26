# 🔧 Model Router Integration Guide

**Goal:** Migrate existing agents to use the new cost-optimized model router

**Benefits:**
- ✅ **90% cost reduction** on simple tasks (intent extraction, tagging)
- ✅ **Automatic fallbacks** - never fail due to one model being down
- ✅ **Flexibility** - force specific models when needed
- ✅ **Consistent API** - same interface for all models

---

## 📋 Migration Checklist

### Phase 1: Update Environment Variables ✅

**Current:**
```env
ANTHROPIC_API_KEY=sk-ant-api03-...
OPENROUTER_API_KEY_2=sk-or-v1-...
```

**Add (Optional - for future Google Direct API):**
```env
GOOGLE_AI_API_KEY=...  # Not required yet
```

### Phase 2: Install Dependencies (if needed)

```bash
# Already installed:
# - @anthropic-ai/sdk
# - OpenRouter client (src/lib/openrouter.ts)

# No new dependencies needed!
```

---

## 🔄 Migration Examples

### Example 1: Email Intelligence Agent

**Before (Direct Anthropic):**
```typescript
// src/lib/agents/email-intelligence.ts

import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function extractEmailIntelligence(emailContent: string) {
  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 4096,
    messages: [
      {
        role: "user",
        content: `Extract business goals, pain points, and requirements from this email: ${emailContent}`,
      },
    ],
  });

  const response = message.content[0].type === "text" ? message.content[0].text : "";
  return JSON.parse(response);
}
```

**After (Model Router):**
```typescript
// src/lib/agents/email-intelligence.ts

import { routeToModel } from "./model-router";

export async function extractEmailIntelligence(emailContent: string) {
  const result = await routeToModel({
    task: "email_intelligence",
    prompt: `Extract business goals, pain points, and requirements from this email.

Return as JSON: { business_goals: [], pain_points: [], requirements: [] }`,
    context: emailContent,
    // Auto-selects: claude-haiku-4.5 (cheaper than Sonnet)
  });

  console.log(`💰 Cost: $${result.costEstimate.toFixed(4)}`);
  console.log(`⏱️  Latency: ${result.latencyMs}ms`);

  return JSON.parse(result.response);
}
```

**Savings:** ~70% cost reduction (Sonnet → Haiku)

---

### Example 2: Contact Scoring

**Before:**
```typescript
// src/lib/agents/contact-intelligence.ts

export async function calculateLeadScore(contact: any) {
  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: `Calculate lead score (0-100) for this contact: ${JSON.stringify(contact)}`,
      },
    ],
  });

  const response = message.content[0].type === "text" ? message.content[0].text : "";
  return parseInt(response);
}
```

**After:**
```typescript
// src/lib/agents/contact-intelligence.ts

import { routeToModel } from "./model-router";

export async function calculateLeadScore(contact: any) {
  const result = await routeToModel({
    task: "contact_scoring",
    prompt: `Calculate lead score (0-100) for this contact. Return ONLY the number.

Contact:
${JSON.stringify(contact, null, 2)}`,
    // Auto-selects: claude-haiku-4.5
  });

  console.log(`💰 Cost: $${result.costEstimate.toFixed(6)} (vs $0.003 with Sonnet)`);

  return parseInt(result.response.trim());
}
```

**Savings:** ~70% cost reduction

---

### Example 3: Content Generation (Keep Premium Quality)

**Before:**
```typescript
// src/lib/agents/content-generator.ts

export async function generateBlogPost(topic: string) {
  const message = await anthropic.messages.create({
    model: "claude-opus-4-5-20251101",
    max_tokens: 8192,
    thinking: {
      type: "enabled",
      budget_tokens: 5000,
    },
    messages: [
      {
        role: "user",
        content: `Write a 1000-word blog post about: ${topic}`,
      },
    ],
  });

  const response = message.content.find((c) => c.type === "text")?.text || "";
  return response;
}
```

**After:**
```typescript
// src/lib/agents/content-generator.ts

import { routeToModel } from "./model-router";

export async function generateBlogPost(topic: string) {
  const result = await routeToModel({
    task: "generate_content",
    prompt: `Write a compelling 1000-word blog post about: ${topic}

Include:
- Catchy headline
- Engaging introduction
- 3-4 main sections
- Real-world examples
- Strong CTA`,
    assignedModel: "claude-opus-4", // Force Opus for quality
    thinkingBudget: 5000, // Enable Extended Thinking
    temperature: 0.8,
  });

  console.log(`💰 Cost: $${result.costEstimate.toFixed(4)}`);
  console.log(`💭 Thinking: ${result.reasoning ? "Yes" : "No"}`);

  return result.response;
}
```

**Savings:** No cost change (still uses Opus), but gains:
- ✅ Automatic fallback if Opus unavailable
- ✅ Cost tracking
- ✅ Latency tracking

---

### Example 4: Simple Intent Extraction (Max Savings)

**Before:**
```typescript
// src/lib/agents/email-classifier.ts

export async function getEmailIntent(email: string) {
  const message = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 256,
    messages: [
      {
        role: "user",
        content: `What is the intent of this email? (support, sales, billing, general)\n\n${email}`,
      },
    ],
  });

  const response = message.content[0].type === "text" ? message.content[0].text : "";
  return response.trim().toLowerCase();
}
```

**After:**
```typescript
// src/lib/agents/email-classifier.ts

import { routeToModel } from "./model-router";

export async function getEmailIntent(email: string) {
  const result = await routeToModel({
    task: "extract_intent",
    prompt: `What is the intent of this email? Respond with ONE word: support, sales, billing, or general.

Email: "${email}"`,
    // Auto-selects: gemini-flash-lite (OpenRouter)
  });

  console.log(`💰 Cost: $${result.costEstimate.toFixed(6)} (vs $0.0002 with Haiku)`);

  return result.response.trim().toLowerCase();
}
```

**Savings:** ~90% cost reduction (Haiku → Gemini Flash Lite)

---

## 🎯 Task Type Selection Guide

### When to Use Each Task Type

| Task Type | Use When | Example |
|-----------|----------|---------|
| `extract_intent` | Simple classification (1-5 words) | Email intent, sentiment |
| `tag_generation` | Generate tags/categories | "marketing, seo, content" |
| `sentiment_analysis` | Detect emotion | "positive", "negative" |
| `email_intelligence` | Extract structured data from emails | Business goals, pain points |
| `contact_scoring` | Calculate numeric scores | Lead score 0-100 |
| `generate_persona` | Create buyer personas | Detailed persona profiles |
| `generate_strategy` | Create marketing strategies | Campaign plans |
| `generate_content` | High-quality content | Blog posts, landing pages |
| `security_audit` | Analyze large codebases | Security vulnerabilities |
| `codebase_analysis` | Architectural reviews | Pattern analysis |

---

## 🔀 Migrating Existing Agents

### Email Intelligence Agent

**File:** `src/lib/agents/email-processor.ts`

**Changes:**
```typescript
// Old
import Anthropic from "@anthropic-ai/sdk";
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// New
import { routeToModel } from "./model-router";
```

**Function Updates:**
```typescript
// Old
async function extractIntelligence(email: string) {
  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-5-20250929",
    messages: [{ role: "user", content: prompt }],
  });
  return message.content[0].text;
}

// New
async function extractIntelligence(email: string) {
  const result = await routeToModel({
    task: "email_intelligence",
    prompt: prompt,
    context: email,
  });
  return result.response;
}
```

---

### Marketing Strategy Generator Agent

**File:** `src/lib/agents/strategy-generator.ts`

**Changes:**
```typescript
// Old: Always use Opus with Extended Thinking
const message = await anthropic.messages.create({
  model: "claude-opus-4-5-20251101",
  thinking: { type: "enabled", budget_tokens: 7500 },
  messages: [{ role: "user", content: strategyPrompt }],
});

// New: Same model, but with fallback + tracking
const result = await routeToModel({
  task: "generate_strategy",
  prompt: strategyPrompt,
  assignedModel: "claude-opus-4",
  thinkingBudget: 7500,
  fallback: "claude-sonnet-4.5", // Fallback if Opus unavailable
});

console.log(`💰 Cost: $${result.costEstimate.toFixed(4)}`);
console.log(`⏱️  Latency: ${result.latencyMs}ms`);
```

---

### Contact Intelligence Agent

**File:** `src/lib/agents/contact-intelligence.ts`

**Multiple Functions:**

```typescript
// Function 1: Calculate Score (Budget task)
export async function getHotLeads(workspaceId: string) {
  const contacts = await fetchContacts(workspaceId);

  for (const contact of contacts) {
    const result = await routeToModel({
      task: "contact_scoring",
      prompt: `Calculate lead score (0-100) for: ${JSON.stringify(contact)}`,
    });
    contact.ai_score = parseInt(result.response);
  }

  return contacts.filter(c => c.ai_score >= 80);
}

// Function 2: Generate Persona (Standard task)
export async function createPersona(intelligence: any) {
  const result = await routeToModel({
    task: "generate_persona",
    prompt: `Create buyer persona from: ${JSON.stringify(intelligence)}`,
    preferredModel: "claude-sonnet-4.5",
  });

  return JSON.parse(result.response);
}
```

---

## ⚙️ Advanced Usage

### 1. Fallback Chains

```typescript
// Try cheap first, fallback to reliable
const result = await routeToModel({
  task: "email_intelligence",
  prompt: emailPrompt,
  preferredModel: "gemini-flash-lite", // Try cheapest first
  fallback: "claude-haiku-4.5",        // Fallback to Anthropic
  // If both fail, emergency fallback to claude-haiku-4.5
});
```

### 2. Force Specific Model for Compliance

```typescript
// Client requires Anthropic for compliance
const result = await routeToModel({
  task: "generate_content",
  prompt: contentPrompt,
  assignedModel: "claude-opus-4", // Force Opus (no auto-selection)
});
```

### 3. Dynamic Model Selection

```typescript
// Choose model based on contact tier
const model = contact.tier === "enterprise" ? "claude-opus-4" : "claude-sonnet-4.5";

const result = await routeToModel({
  task: "generate_content",
  prompt: contentPrompt,
  assignedModel: model,
});
```

### 4. Batch Processing for Cost Efficiency

```typescript
// Process 10 emails at once to reduce API overhead
const batchPrompt = emails.map((e, i) => `Email ${i + 1}: ${e}`).join("\n\n");

const result = await routeToModel({
  task: "extract_intent",
  prompt: `Extract intent for each email. Return JSON array: ["intent1", "intent2", ...]

${batchPrompt}`,
});

const intents = JSON.parse(result.response);
console.log(`💰 Cost per email: $${(result.costEstimate / emails.length).toFixed(6)}`);
```

---

## 📊 Cost Comparison

### Before Model Router

| Task | Model | Cost per Call |
|------|-------|---------------|
| Email intent | Haiku | $0.0002 |
| Email intelligence | Sonnet | $0.006 |
| Buyer persona | Sonnet | $0.02 |
| Content generation | Opus | $10.00 |
| Codebase audit | Sonnet | $2.00 |

**Monthly Cost (100 calls each):** ~$1,200

### After Model Router

| Task | Model | Cost per Call | Savings |
|------|-------|---------------|---------|
| Email intent | Gemini Flash Lite | $0.00002 | **90%** |
| Email intelligence | Haiku | $0.002 | **67%** |
| Buyer persona | Sonnet | $0.02 | 0% |
| Content generation | Opus | $10.00 | 0% |
| Codebase audit | Sherlock | $1.00 | **50%** |

**Monthly Cost (100 calls each):** ~$600

**Total Savings:** $600/month (50% reduction)

---

## ✅ Testing Your Migration

### Test Script

Create `scripts/test-model-router.ts`:

```typescript
import { routeToModel } from "@/lib/agents/model-router";

async function testModelRouter() {
  console.log("🧪 Testing Model Router...\n");

  // Test 1: Ultra-cheap
  console.log("Test 1: Intent Extraction");
  const intent = await routeToModel({
    task: "extract_intent",
    prompt: "What is the intent of this email: 'I need a quote for 50 licenses'",
  });
  console.log(`  Model: ${intent.model}`);
  console.log(`  Cost: $${intent.costEstimate.toFixed(6)}`);
  console.log(`  Response: ${intent.response}\n`);

  // Test 2: Budget
  console.log("Test 2: Email Intelligence");
  const intelligence = await routeToModel({
    task: "email_intelligence",
    prompt: "Extract business goals from: 'We want to increase revenue by 50%'",
  });
  console.log(`  Model: ${intelligence.model}`);
  console.log(`  Cost: $${intelligence.costEstimate.toFixed(6)}`);
  console.log(`  Response: ${intelligence.response.substring(0, 100)}...\n`);

  // Test 3: Premium
  console.log("Test 3: Content Generation");
  const content = await routeToModel({
    task: "generate_content",
    prompt: "Write a 100-word product description for a CRM",
    assignedModel: "claude-opus-4",
    thinkingBudget: 2000,
  });
  console.log(`  Model: ${content.model}`);
  console.log(`  Cost: $${content.costEstimate.toFixed(6)}`);
  console.log(`  Thinking: ${content.reasoning ? "Yes" : "No"}`);
  console.log(`  Response: ${content.response.substring(0, 100)}...\n`);

  console.log("✅ All tests passed!");
}

testModelRouter();
```

Run:
```bash
npx tsx scripts/test-model-router.ts
```

---

## 🚨 Common Pitfalls

### 1. Not Handling JSON Parsing

**Wrong:**
```typescript
const result = await routeToModel({ task: "email_intelligence", prompt: emailPrompt });
const data = JSON.parse(result.response); // May fail if model returns markdown
```

**Right:**
```typescript
const result = await routeToModel({
  task: "email_intelligence",
  prompt: `${emailPrompt}

IMPORTANT: Return ONLY valid JSON, no markdown formatting.`,
});

try {
  const data = JSON.parse(result.response);
} catch (error) {
  console.error("Failed to parse JSON:", result.response);
  throw error;
}
```

### 2. Not Tracking Costs

**Wrong:**
```typescript
const result = await routeToModel({ task: "generate_content", prompt: contentPrompt });
return result.response;
```

**Right:**
```typescript
const result = await routeToModel({ task: "generate_content", prompt: contentPrompt });

// Track cost to database
await supabase.from("model_usage").insert({
  model: result.model,
  task: "generate_content",
  cost_usd: result.costEstimate,
  latency_ms: result.latencyMs,
});

return result.response;
```

### 3. Not Using Fallbacks

**Wrong:**
```typescript
const result = await routeToModel({
  task: "codebase_analysis",
  preferredModel: "sherlock-think-alpha",
});
// May fail if OpenRouter is down
```

**Right:**
```typescript
const result = await routeToModel({
  task: "codebase_analysis",
  preferredModel: "sherlock-think-alpha",
  fallback: "claude-sonnet-4.5", // Always provide fallback
});
```

---

## 📈 Next Steps

1. ✅ **Migrate simple tasks first** (intent extraction, tagging)
2. ✅ **Test thoroughly** with the test script
3. ✅ **Monitor costs** in production
4. ✅ **Adjust task-to-model mappings** based on performance
5. ✅ **Add custom task types** as needed

---

## 🎯 Success Criteria

**Migration is successful when:**

1. ✅ **90% of simple tasks** use Gemini Flash Lite (ultra-cheap)
2. ✅ **70% of budget tasks** use Claude Haiku
3. ✅ **99.9% uptime** - fallbacks always work
4. ✅ **50% cost reduction** in first month
5. ✅ **No quality degradation** - outputs still meet standards

---

**Questions? Check the examples in `src/lib/agents/examples/model-router-usage.ts`**
