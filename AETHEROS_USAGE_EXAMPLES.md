# AetherOS Omega Protocol - Usage Examples

Complete guide to implementing AetherOS in your application.

---

## 📦 Installation

The AetherOS module is already available in your project:

```typescript
import { 
  startSession,
  generateVisual,
  translatePrompt,
  buildOrchestratorPromptWithTools
} from '@/lib/synthex/aetheros';
```

---

## 🚀 Quick Start

### Example 1: Simple Visual Generation

```typescript
import { startSession, generateVisual } from '@/lib/synthex/aetheros';

async function generateHeroImage(tenantId: string, userId: string) {
  // Start AetherOS session
  const { sessionId, telemetry } = await startSession(tenantId, userId);

  // Generate visual
  const result = await generateVisual(
    {
      tenant_id: tenantId,
      user_id: userId,
      tier: 'draft', // Start with draft for iteration
      prompt_original: 'Create a professional SaaS dashboard with modern design',
      aspect_ratio: '16:9',
    },
    telemetry,
    sessionId
  );

  console.log(`Generated: ${result.output_url}`);
  console.log(`Cost: $${result.cost}`);
  console.log(`Remaining budget: ${telemetry.saas_economics.remaining_budget}`);

  return result;
}
```

### Example 2: Using Visual Codex Translation

```typescript
import { translatePrompt, generateVisual, startSession } from '@/lib/synthex/aetheros';

async function generateWithTranslation(tenantId: string, userId: string) {
  // User provides generic language
  const userPrompt = "Make it professional with good lighting and close up shot";

  // Translate using Visual Codex
  const enhancedPrompt = translatePrompt(userPrompt);
  
  console.log('Original:', userPrompt);
  console.log('Enhanced:', enhancedPrompt);
  // Enhanced: "Aesthetic: Clean Corporate Minimalism - Sans-serif typography... | 
  //            Lighting: 3-Point Rembrandt setup... | Camera: 100mm Macro lens..."

  const { sessionId, telemetry } = await startSession(tenantId, userId);

  const result = await generateVisual(
    {
      tenant_id: tenantId,
      user_id: userId,
      tier: 'refined',
      prompt_original: userPrompt,
      prompt_enhanced: enhancedPrompt, // Use translated version
      aspect_ratio: '1:1',
    },
    telemetry,
    sessionId
  );

  return result;
}
```

### Example 3: Auto-Tier Selection

```typescript
import { startSession, generateVisual, recommendTier } from '@/lib/synthex/aetheros';

async function generateWithAutoTier(
  tenantId: string,
  userId: string,
  purpose: 'iteration' | 'preview' | 'final'
) {
  const { sessionId, telemetry } = await startSession(tenantId, userId);

  // Get budget
  const budgetRemaining = parseFloat(
    telemetry.saas_economics.remaining_budget.replace('$', '')
  );

  // Recommend tier based on purpose and budget
  const tier = recommendTier({
    budgetRemaining,
    purpose,
    clientApprovalNeeded: purpose === 'preview',
  });

  console.log(`Recommended tier: ${tier} for purpose: ${purpose}`);

  const result = await generateVisual(
    {
      tenant_id: tenantId,
      user_id: userId,
      tier,
      prompt_original: 'Product showcase image',
      aspect_ratio: '16:9',
    },
    telemetry,
    sessionId
  );

  return result;
}
```

---

## 🔧 Advanced Usage

### Example 4: Batch Generation with Cost Control

```typescript
import { startSession, batchGenerate } from '@/lib/synthex/aetheros';

async function generateProductImages(tenantId: string, userId: string) {
  const { sessionId, telemetry } = await startSession(tenantId, userId);

  const requests = [
    {
      tenant_id: tenantId,
      user_id: userId,
      tier: 'draft' as const,
      prompt_original: 'Product photo - angle 1',
      aspect_ratio: '1:1' as const,
    },
    {
      tenant_id: tenantId,
      user_id: userId,
      tier: 'draft' as const,
      prompt_original: 'Product photo - angle 2',
      aspect_ratio: '1:1' as const,
    },
    {
      tenant_id: tenantId,
      user_id: userId,
      tier: 'draft' as const,
      prompt_original: 'Product photo - angle 3',
      aspect_ratio: '1:1' as const,
    },
  ];

  // Generate all with budget validation
  const results = await batchGenerate(requests, telemetry, sessionId);

  console.log(`Generated ${results.length} images`);
  console.log(`Total cost: $${results.reduce((sum, r) => sum + r.cost, 0)}`);

  return results;
}
```

### Example 5: Upgrade from Draft to Production

```typescript
import { startSession, upgradeVisual } from '@/lib/synthex/aetheros';

async function upgradeToProduction(
  tenantId: string,
  userId: string,
  draftJobId: string
) {
  const { sessionId, telemetry } = await startSession(tenantId, userId);

  try {
    // Upgrade draft to production tier
    const result = await upgradeVisual(
      draftJobId,
      'production',
      telemetry,
      sessionId
    );

    console.log(`Upgraded to production: ${result.output_url}`);
    console.log(`Upgrade cost: $${result.cost}`);

    return result;
  } catch (error) {
    console.error('Upgrade failed:', error);
    // Might fail if budget insufficient
    throw error;
  }
}
```

### Example 6: Using with Orchestrator LLM

```typescript
import Anthropic from '@anthropic-ai/sdk';
import {
  startSession,
  buildOrchestratorPromptWithTools,
  getInitializationPrompt,
} from '@/lib/synthex/aetheros';

async function initializeOrchestrator(tenantId: string, userId: string) {
  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

  // Start session
  const { sessionId, telemetry } = await startSession(tenantId, userId);

  // Build system prompt with tools
  const { system, tools } = buildOrchestratorPromptWithTools(telemetry, {
    mode: 'economic',
    enable_extended_thinking: true,
    enable_region_arbitrage: true,
    safety_level: 'balanced',
  });

  // Initialize Orchestrator with test prompt
  const response = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 4096,
    system,
    tools,
    messages: [
      {
        role: 'user',
        content: getInitializationPrompt(),
      },
    ],
  });

  console.log('Orchestrator initialized:', response.content);

  return { anthropic, sessionId, telemetry, system, tools };
}
```

---

## 🌐 API Usage

### Example 7: Using the REST API

```typescript
// Client-side API call
async function generateViaAPI(prompt: string, tier: 'draft' | 'refined' | 'production') {
  const response = await fetch('/api/aetheros/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt,
      tier,
      aspect_ratio: '16:9',
    }),
  });

  const data = await response.json();

  if (!data.success) {
    throw new Error(data.error);
  }

  return data.data;
}

// Usage
const result = await generateViaAPI(
  'Modern SaaS landing page hero image',
  'draft'
);

console.log(`Job ID: ${result.job_id}`);
console.log(`Output: ${result.output_url}`);
console.log(`Cost: $${result.cost}`);
```

### Example 8: Auto-Tier API Call

```typescript
async function generateWithAutoTierAPI(
  prompt: string,
  purpose: 'iteration' | 'preview' | 'final'
) {
  const response = await fetch('/api/aetheros/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt,
      auto_tier: true,
      purpose,
      aspect_ratio: '16:9',
    }),
  });

  const data = await response.json();

  return {
    ...data.data,
    selectedTier: data.data.tier,
    energySavings: data.telemetry.energy_arbitrage_active ? '38%' : '0%',
  };
}
```

### Example 9: Check Generation Status

```typescript
async function checkStatus(jobId: string) {
  const response = await fetch(`/api/aetheros/generate?job_id=${jobId}`);
  const data = await response.json();

  if (!data.success) {
    throw new Error(data.error);
  }

  return data.data;
}

// Poll for completion
async function waitForCompletion(jobId: string, maxWaitMs: number = 30000) {
  const startTime = Date.now();

  while (Date.now() - startTime < maxWaitMs) {
    const status = await checkStatus(jobId);

    if (status.status === 'completed') {
      return status;
    }

    if (status.status === 'failed') {
      throw new Error(status.error_message);
    }

    // Wait 1 second before next check
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  throw new Error('Timeout waiting for generation');
}
```

---

## 🎨 Visual Codex Examples

### Example 10: Using Context Assembler

```typescript
import { buildContextAssembler } from '@/lib/synthex/aetheros';

const prompt = buildContextAssembler({
  subject: 'SaaS dashboard screenshot',
  style: 'modern minimalist design',
  lighting: 'soft natural lighting',
  camera: 'wide shot',
  composition: 'clean grid layout',
  texture: 'glass effect panels',
  color: 'Blue and white palette with purple accents',
  mood: 'Professional and trustworthy',
  quality: '8K resolution, ultra-detailed, photorealistic',
  constraints: 'No people, no text overlays',
});

console.log(prompt);
// Output: "Subject: SaaS dashboard screenshot | Style: Aesthetic: Contemporary Flat Design 3.0... | 
//          Lighting: Lighting: Diffused northern window light... | Camera: Camera: 24mm Wide-angle lens..."
```

### Example 11: Validate Prompt Complexity

```typescript
import { validatePromptComplexity } from '@/lib/synthex/aetheros';

const userPrompt = "Make a logo";

const validation = validatePromptComplexity(userPrompt);

console.log(`Prompt score: ${validation.score}/100`);
console.log('Missing elements:', validation.missingElements);
console.log('Suggestions:', validation.suggestions);

// Output:
// Prompt score: 20/100
// Missing elements: ["Visual style or aesthetic", "Lighting description", "Camera perspective", ...]
// Suggestions: ["Add style keywords like 'modern' or 'professional'", ...]
```

---

## 💰 Cost Management Examples

### Example 12: Calculate Savings

```typescript
import { calculateSavings } from '@/lib/synthex/aetheros';

// User wants 50 images
const imageCount = 50;

// Compare production tier vs draft tier
const savings = calculateSavings('production', imageCount);

console.log(`If you generate ${imageCount} production images:`);
console.log(`- Production cost: $${(0.04 * imageCount).toFixed(2)}`);
console.log(`- Draft cost: $${(0.001 * imageCount).toFixed(3)}`);
console.log(`- Savings: $${savings.savings.toFixed(2)} (${savings.savingsPercentage.toFixed(0)}%)`);

// Output:
// If you generate 50 production images:
// - Production cost: $2.00
// - Draft cost: $0.050
// - Savings: $1.95 (97%)
```

### Example 13: Compare Tiers

```typescript
import { compareTiers, getTierConfig } from '@/lib/synthex/aetheros';

const comparison = compareTiers('draft', 'production');

console.log('Draft vs Production:');
console.log(`- Cost difference: $${comparison.costDifference.toFixed(4)}`);
console.log(`- Quality difference: +${comparison.qualityDifference} points`);
console.log(`- ${comparison.recommendation}`);

// Get tier details
const draftConfig = getTierConfig('draft');
console.log(`Draft: ${draftConfig.max_resolution}, ${draftConfig.use_case}`);
```

---

## 📊 Monitoring & Analytics

### Example 14: Get Cost Summary

```typescript
import { supabaseAdmin } from '@/lib/supabase/admin';

async function getCostSummary(tenantId: string, month: Date) {
  const startOfMonth = new Date(month.getFullYear(), month.getMonth(), 1);
  const endOfMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0, 23, 59, 59);

  const { data } = await supabaseAdmin.rpc('get_aetheros_cost_summary', {
    p_tenant_id: tenantId,
    p_start_date: startOfMonth.toISOString(),
    p_end_date: endOfMonth.toISOString(),
  });

  return data[0];
}

const summary = await getCostSummary(tenantId, new Date());

console.log(`Monthly cost summary:`);
console.log(`- Draft: $${summary.draft_costs}`);
console.log(`- Refined: $${summary.refined_costs}`);
console.log(`- Production: $${summary.production_costs}`);
console.log(`- Total: $${summary.total_cost} (${summary.total_jobs} jobs)`);
```

---

## 🎯 Real-World Workflows

### Example 15: Agency Workflow (Iterate → Preview → Final)

```typescript
async function agencyWorkflow(tenantId: string, userId: string, clientBrief: string) {
  const { sessionId, telemetry } = await startSession(tenantId, userId);

  // Step 1: Generate 3 draft concepts
  console.log('Generating draft concepts...');
  const drafts = await batchGenerate(
    [
      { tenant_id: tenantId, user_id: userId, tier: 'draft', prompt_original: `${clientBrief} - concept A`, aspect_ratio: '16:9' },
      { tenant_id: tenantId, user_id: userId, tier: 'draft', prompt_original: `${clientBrief} - concept B`, aspect_ratio: '16:9' },
      { tenant_id: tenantId, user_id: userId, tier: 'draft', prompt_original: `${clientBrief} - concept C`, aspect_ratio: '16:9' },
    ],
    telemetry,
    sessionId
  );

  // Step 2: Client selects concept B
  console.log('Client selected concept B, upgrading to refined...');
  const refined = await upgradeVisual(drafts[1].id, 'refined', telemetry, sessionId);

  // Step 3: Client approves, generate production
  console.log('Client approved, generating production version...');
  const final = await upgradeVisual(refined.id, 'production', telemetry, sessionId);

  console.log(`Total cost: $${drafts.reduce((s, d) => s + d.cost, 0) + refined.cost + final.cost}`);
  console.log(`Final asset: ${final.output_url}`);

  return final;
}
```

---

## 🔒 Error Handling

### Example 16: Robust Error Handling

```typescript
async function generateWithErrorHandling(tenantId: string, userId: string, prompt: string) {
  try {
    const { sessionId, telemetry } = await startSession(tenantId, userId);

    const result = await generateVisual(
      {
        tenant_id: tenantId,
        user_id: userId,
        tier: 'draft',
        prompt_original: prompt,
        aspect_ratio: '16:9',
      },
      telemetry,
      sessionId
    );

    return { success: true, data: result };
  } catch (error) {
    if (error instanceof Error) {
      // Budget exceeded
      if (error.message.includes('Insufficient budget')) {
        return {
          success: false,
          error: 'BUDGET_EXCEEDED',
          message: 'Not enough budget remaining for this generation',
        };
      }

      // Generation failed
      if (error.message.includes('Generation failed')) {
        return {
          success: false,
          error: 'GENERATION_FAILED',
          message: 'The visual generation service encountered an error',
        };
      }
    }

    return {
      success: false,
      error: 'UNKNOWN_ERROR',
      message: 'An unexpected error occurred',
    };
  }
}
```

---

## 📝 Summary

**Key Takeaways:**

1. **Always start with `draft` tier** for iteration ($0.001)
2. **Use `translatePrompt()`** for better results (Visual Codex)
3. **Enable auto-tier** with `recommendTier()` for optimal cost
4. **Batch operations** validate budget before starting
5. **Upgrade workflow** saves money vs regenerating
6. **Monitor costs** with `get_aetheros_cost_summary()`
7. **Energy arbitrage** automatically routes to off-peak regions

**Best Practices:**

- ✅ Translate prompts using Visual Codex
- ✅ Use draft tier for client feedback loops
- ✅ Only generate production tier after approval
- ✅ Monitor session budgets proactively
- ✅ Implement error handling for budget limits
- ❌ Don't skip straight to production
- ❌ Don't ignore telemetry warnings
- ❌ Don't regenerate when you can upgrade

---

**Need help?** Check [AETHEROS_IMPLEMENTATION.md](./AETHEROS_IMPLEMENTATION.md) for architecture details.
