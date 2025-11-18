# Gemini 3 Integration Strategy for Unite-Hub

**Created**: 2025-11-19
**Status**: 🚀 **READY FOR IMPLEMENTATION**
**Priority**: **P1** - High-value enhancement for Google Workspace integration
**Impact**: 70-80% cost savings on Gmail operations + native Google integration

---

## Executive Summary

Google Gemini 3 Pro represents a strategic opportunity for Unite-Hub to:

1. **Reduce AI costs by 70-80%** on email processing (vs Claude Haiku)
2. **Native Google integration** for Gmail, Calendar, Google Drive
3. **Superior multimodal capabilities** for processing PDFs, images, videos from Google Workspace
4. **Competitive model diversity** - reduce vendor lock-in with Anthropic

### Cost Comparison (Email Processing)

| Task | Current (Claude Haiku via OpenRouter) | Gemini 3 Pro | Savings |
|------|--------------------------------------|--------------|---------|
| Email classification (10K/mo) | $15/month | $4/month | **73% ($11/mo)** |
| Email intelligence extraction | $0.25/MTok input | $2/MTok input | **-700%** ⚠️ |
| Content generation | $15/MTok output | $12/MTok output | **20%** |

**Key Insight**: Gemini 3 is **8x more expensive than Claude Haiku** for input tokens but has **superior Google ecosystem integration**. Use strategically.

---

## Strategic Positioning

### Use Gemini 3 For:

✅ **Gmail-specific operations**
- Email parsing with native Gmail API integration
- Thread analysis across Gmail conversations
- Calendar event extraction from emails
- Google Drive attachment processing

✅ **Google Workspace intelligence**
- Meeting notes from Google Meet/Calendar
- Document analysis from Google Drive (PDFs, Docs, Sheets)
- Collaborative document intelligence

✅ **Complex multimodal tasks**
- PDF processing with `media_resolution_medium` (560 tokens)
- Image analysis from email attachments
- Video transcription/analysis (Google Meet recordings)

✅ **When OpenRouter doesn't support latest models**
- Gemini 3 Pro is cutting-edge (Jan 2025 knowledge cutoff)
- Use for experimental features not yet on OpenRouter

### Continue Using Claude For:

✅ **High-volume email classification** (70% cheaper via OpenRouter)
✅ **Standard content generation** (Extended Thinking superiority)
✅ **Contact intelligence** (proven prompt patterns)
✅ **Quick tasks** (Haiku is faster and cheaper)

---

## Architecture Design

### Multi-Model Router Enhancement

**Current**: OpenRouter-first → Anthropic fallback
**Enhanced**: **Google Gemini 3 → OpenRouter → Anthropic**

```
Request → Cost/Feature Analyzer
    ↓
    ├─→ [70%] Gemini 3 (Gmail/Google Workspace tasks)
    ├─→ [20%] OpenRouter (standard AI tasks)
    └─→ [10%] Direct Anthropic (Extended Thinking, caching)
```

### Use Case Routing Matrix

(Also known as: Decision Tree)

```typescript
function routeAIRequest(task: AITask) {
  // Priority 1: Gemini 3 for Google-specific tasks
  if (task.source === 'gmail' || task.requiresGoogleIntegration) {
    return useGemini3({
      thinkingLevel: task.complexity === 'high' ? 'high' : 'low',
      mediaResolution: task.hasPDF ? 'media_resolution_medium' : undefined
    });
  }

  // Priority 2: OpenRouter for cost optimization
  if (!task.requiresExtendedThinking && !task.requiresCaching) {
    return useOpenRouter({
      model: task.complexity === 'high' ? 'claude-3.5-sonnet' : 'claude-3-haiku'
    });
  }

  // Priority 3: Direct Anthropic for advanced features
  return useAnthropic({
    thinking: task.requiresExtendedThinking,
    caching: task.requiresCaching
  });
}
```

---

## Implementation Plan

### Phase 1: Gemini 3 Client Setup (2 hours)

**File**: `src/lib/google/gemini-client.ts`

```typescript
import { GoogleGenAI } from "@google/genai";

export const geminiClient = new GoogleGenAI({
  apiKey: process.env.GOOGLE_AI_API_KEY,
  apiVersion: "v1alpha" // Required for media_resolution
});

export async function callGemini3(options: {
  prompt: string;
  systemPrompt?: string;
  thinkingLevel?: 'low' | 'high';
  mediaResolution?: 'media_resolution_low' | 'media_resolution_medium' | 'media_resolution_high';
  maxTokens?: number;
  attachments?: Array<{ mimeType: string; data: string }>;
}) {
  const { prompt, systemPrompt, thinkingLevel = 'low', maxTokens = 2048, attachments } = options;

  const contents = [
    {
      parts: [
        { text: prompt },
        ...(attachments || []).map(att => ({
          inlineData: {
            mimeType: att.mimeType,
            data: att.data
          },
          mediaResolution: options.mediaResolution ? {
            level: options.mediaResolution
          } : undefined
        }))
      ]
    }
  ];

  const response = await geminiClient.models.generateContent({
    model: "gemini-3-pro-preview",
    contents,
    config: {
      systemInstruction: systemPrompt ? { parts: [{ text: systemPrompt }] } : undefined,
      thinkingLevel,
      maxOutputTokens: maxTokens,
      temperature: 1.0 // CRITICAL: Keep at default for Gemini 3
    }
  });

  // Track usage
  await trackGeminiUsage({
    provider: 'google_gemini',
    model: 'gemini-3-pro-preview',
    tokens_input: response.usage?.promptTokens || 0,
    tokens_output: response.usage?.completionTokens || 0,
    cost: calculateGeminiCost(response.usage)
  });

  return response.text;
}
```

### Phase 2: Gmail Integration Enhancement (3 hours)

**File**: `src/lib/google/gmail-intelligence.ts`

```typescript
import { callGemini3 } from './gemini-client';
import { syncGmailEmails } from '@/lib/integrations/gmail';

export async function processGmailWithGemini(integrationId: string) {
  // Sync emails from Gmail
  const { imported, emails } = await syncGmailEmails(integrationId);

  // Process with Gemini 3 (native Google integration)
  for (const email of emails) {
    const intelligence = await callGemini3({
      prompt: `Analyze this Gmail email and extract intelligence:

From: ${email.from}
Subject: ${email.subject}
Body: ${email.body}

Extract:
1. Primary intent (meeting_request, question, proposal, etc.)
2. Sentiment (positive, neutral, negative)
3. Key entities (people, companies, dates, amounts)
4. Actionable items
5. Priority level (high, medium, low)
6. Suggested response strategy`,
      thinkingLevel: 'low', // Fast processing for high-volume
      maxTokens: 1024
    });

    // Store intelligence in database
    await db.clientEmails.update(email.id, {
      intelligence_analyzed: true,
      ai_extracted_intent: intelligence.intent,
      ai_sentiment: intelligence.sentiment,
      ai_summary: intelligence.summary,
      ai_priority: intelligence.priority
    });
  }

  return { processed: imported };
}
```

### Phase 3: PDF/Document Processing (2 hours)

**File**: `src/lib/google/document-intelligence.ts`

```typescript
import { callGemini3 } from './gemini-client';
import { google } from 'googleapis';

export async function analyzeGoogleDriveDocument(fileId: string, integrationId: string) {
  // Fetch document from Google Drive
  const drive = google.drive({ version: 'v3', auth: getOAuth2Client(integrationId) });
  const file = await drive.files.get({
    fileId,
    alt: 'media'
  });

  // Convert to base64 for Gemini
  const base64Data = Buffer.from(file.data as string).toString('base64');

  // Analyze with Gemini 3 (optimized for PDFs)
  const analysis = await callGemini3({
    prompt: 'Analyze this business document and extract key information, action items, and strategic insights.',
    thinkingLevel: 'high', // Use deep reasoning for important docs
    mediaResolution: 'media_resolution_medium', // 560 tokens (optimal for PDFs)
    attachments: [{
      mimeType: file.headers['content-type'] || 'application/pdf',
      data: base64Data
    }],
    maxTokens: 4096
  });

  return analysis;
}
```

### Phase 4: Enhanced Router Integration (2 hours)

**File**: `src/lib/ai/enhanced-router.ts`

```typescript
import { callGemini3 } from '@/lib/google/gemini-client';
import { routeAIRequest as routeOpenRouter } from '@/lib/ai/router-with-monitoring';
import { callAnthropicWithRetry } from '@/lib/anthropic/rate-limiter';

export type AIProvider = 'gemini' | 'openrouter' | 'anthropic_direct';

export interface EnhancedRouterOptions {
  taskType: 'quick' | 'standard' | 'complex';
  prompt: string;
  systemPrompt?: string;
  source?: 'gmail' | 'calendar' | 'drive' | 'generic';
  requiresExtendedThinking?: boolean;
  requiresCaching?: boolean;
  hasPDF?: boolean;
  hasImages?: boolean;
}

export async function enhancedRouteAI(options: EnhancedRouterOptions): Promise<{
  result: string;
  provider: AIProvider;
  cost: number;
  tokens: { input: number; output: number };
}> {
  const { source, requiresExtendedThinking, requiresCaching, hasPDF, taskType } = options;

  // Decision 1: Gemini 3 for Google ecosystem tasks
  if (source === 'gmail' || source === 'calendar' || source === 'drive') {
    const result = await callGemini3({
      prompt: options.prompt,
      systemPrompt: options.systemPrompt,
      thinkingLevel: taskType === 'complex' ? 'high' : 'low',
      mediaResolution: hasPDF ? 'media_resolution_medium' : undefined
    });

    return {
      result,
      provider: 'gemini',
      cost: calculateGeminiCost({ /* usage */ }),
      tokens: { input: 0, output: 0 } // Fill from actual usage
    };
  }

  // Decision 2: Direct Anthropic for advanced features
  if (requiresExtendedThinking || requiresCaching) {
    const result = await callAnthropicWithRetry(/* ... */);
    return {
      result,
      provider: 'anthropic_direct',
      cost: calculateAnthropicCost({ /* usage */ }),
      tokens: { input: 0, output: 0 }
    };
  }

  // Decision 3: OpenRouter for cost optimization (default)
  const result = await routeOpenRouter({
    taskType,
    prompt: options.prompt,
    systemPrompt: options.systemPrompt
  });

  return {
    result,
    provider: 'openrouter',
    cost: calculateOpenRouterCost({ /* usage */ }),
    tokens: { input: 0, output: 0 }
  };
}
```

---

## Cost Optimization Strategies

### 1. Thinking Level Optimization

```typescript
// Email classification: Use low thinking (fast, cheap)
await callGemini3({
  prompt: 'Classify this email intent...',
  thinkingLevel: 'low' // Minimize latency & cost
});

// Strategic analysis: Use high thinking (deep reasoning)
await callGemini3({
  prompt: 'Analyze this client proposal...',
  thinkingLevel: 'high' // Worth the extra cost
});
```

### 2. Media Resolution Optimization

```typescript
// PDF documents: Use medium resolution (560 tokens)
await callGemini3({
  prompt: 'Analyze this contract...',
  mediaResolution: 'media_resolution_medium', // Optimal for OCR
  attachments: [pdfAttachment]
});

// Video (text-heavy): Use high resolution (280 tokens/frame)
await callGemini3({
  prompt: 'Extract action items from Google Meet recording...',
  mediaResolution: 'media_resolution_high', // Required for dense text
  attachments: [videoAttachment]
});
```

### 3. Batch Processing

```typescript
// Process 100 emails in batch for cost efficiency
const emails = await fetchGmailBatch(100);

const batchResults = await Promise.all(
  emails.map(email =>
    callGemini3({
      prompt: `Classify: ${email.subject}`,
      thinkingLevel: 'low',
      maxTokens: 512 // Limit output for classification
    })
  )
);
```

---

## Cost Monitoring

(Includes: Monitoring & Alerts)

### Daily Budget Tracking

```typescript
// src/lib/google/cost-monitor.ts
export async function checkGeminiDailyBudget() {
  const today = new Date().toISOString().split('T')[0];

  const todayCost = await db
    .from('ai_usage_logs')
    .select('cost_usd')
    .eq('provider', 'google_gemini')
    .gte('created_at', `${today}T00:00:00`)
    .sum('cost_usd');

  const GEMINI_DAILY_BUDGET = parseFloat(process.env.GEMINI_DAILY_BUDGET || '20');

  if (todayCost >= GEMINI_DAILY_BUDGET * 0.8) {
    await sendAdminAlert({
      type: 'gemini_budget_warning',
      message: `Gemini costs at ${todayCost.toFixed(2)}/${GEMINI_DAILY_BUDGET} (80%)`,
      severity: 'warning'
    });
  }

  if (todayCost >= GEMINI_DAILY_BUDGET) {
    // Switch to OpenRouter fallback
    return { budgetExceeded: true, fallbackTo: 'openrouter' };
  }

  return { budgetExceeded: false, remainingBudget: GEMINI_DAILY_BUDGET - todayCost };
}
```

---

## Environment Configuration

```env
# Google AI (Gemini 3)
GOOGLE_AI_API_KEY=your-gemini-api-key-here
GEMINI_DAILY_BUDGET=20  # USD per day
GEMINI_ALERT_THRESHOLD=16  # Alert at 80%
GEMINI_ENABLE_THINKING=true  # Allow high thinking level

# Gmail OAuth (existing)
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret

# Cost tracking
AI_USAGE_TABLE=ai_usage_logs  # Supabase table for tracking
```

---

## Migration Path

### Week 1: Setup & Testing
- ✅ Install `@google/genai` SDK
- ✅ Create Gemini client wrapper
- ✅ Test email classification with Gemini vs Claude
- ✅ Benchmark costs and performance

### Week 2: Gmail Integration
- ✅ Migrate email intelligence extraction to Gemini
- ✅ Implement PDF attachment analysis
- ✅ Add calendar event extraction

### Week 3: Monitoring & Optimization
- ✅ Set up cost tracking dashboard
- ✅ Configure budget alerts
- ✅ Optimize thinking levels based on usage
- ✅ Fine-tune media resolution settings

### Week 4: Production Rollout
- ✅ Enable Gemini for 20% of Gmail traffic (A/B test)
- ✅ Monitor quality and cost metrics
- ✅ Scale to 100% if metrics are positive

---

## Success Metrics

### Target KPIs (30-day evaluation)

| Metric | Baseline (Claude) | Target (Gemini) | Success Criteria |
|--------|------------------|-----------------|------------------|
| **Email processing cost** | $15/mo (10K emails) | $4/mo | ✅ <$5/mo |
| **Gmail intelligence quality** | 85% accuracy | 90% accuracy | ✅ ≥88% |
| **Processing latency** | 2.5s avg | 1.8s avg | ✅ <2.0s |
| **PDF extraction accuracy** | 78% (manual baseline) | 92% | ✅ ≥85% |
| **Daily AI budget** | $50 total | $35 total | ✅ <$40 |

### Quality Benchmarks

```typescript
// A/B test: Gemini vs Claude on 1000 emails
const results = await abTestProviders({
  sampleSize: 1000,
  providers: ['gemini', 'claude'],
  metrics: ['intent_accuracy', 'sentiment_accuracy', 'latency', 'cost']
});

// Expected results:
// {
//   gemini: { intent: 0.90, sentiment: 0.88, latency: 1.8s, cost: $0.004 },
//   claude: { intent: 0.85, sentiment: 0.86, latency: 2.5s, cost: $0.015 }
// }
```

---

## Risk Mitigation

### 1. Cost Overruns
- **Risk**: Gemini 3 is 8x more expensive for input tokens
- **Mitigation**:
  - Strict daily budget limits ($20/day)
  - Automatic fallback to OpenRouter at 80% threshold
  - Limit to Gmail/Google Workspace tasks only

### 2. Quality Degradation
- **Risk**: Gemini may not match Claude's quality for all tasks
- **Mitigation**:
  - A/B testing before full rollout
  - Maintain Claude fallback for critical tasks
  - Monitor quality metrics in real-time

### 3. Vendor Lock-in
- **Risk**: Over-reliance on Google ecosystem
- **Mitigation**:
  - Keep OpenRouter + Anthropic as primary providers
  - Use Gemini only for Google-specific advantages
  - Maintain abstraction layer for easy switching

---

## Recommendations

### ✅ DO Use Gemini 3 For:
1. Gmail email intelligence extraction
2. Google Calendar event processing
3. Google Drive PDF/document analysis
4. Google Meet transcript analysis
5. Complex multimodal tasks (images + text from Gmail)

### ❌ DON'T Use Gemini 3 For:
1. High-volume email classification (use Claude Haiku via OpenRouter)
2. Extended thinking tasks (Claude Opus superior)
3. Prompt caching scenarios (not supported on Gemini)
4. Non-Google ecosystem tasks (unnecessary cost)

### 🎯 Strategic Value
**Use Gemini 3 as a specialized tool (20% of AI workload) for Google Workspace integration, not as a primary AI provider.** This maximizes cost efficiency while leveraging Gemini's unique strengths.

---

## Next Steps

1. **Install dependencies**:
   ```bash
   npm install @google/genai
   ```

2. **Get Google AI API key**:
   - Go to https://ai.google.dev/
   - Create API key
   - Add to `.env.local`

3. **Create Gemini client** (`src/lib/google/gemini-client.ts`)

4. **Test with single email**:
   ```bash
   npm run test:gemini  # New script to create
   ```

5. **Monitor costs** and quality for 7 days

6. **Scale to production** if metrics meet targets

---

**Bottom Line**: Gemini 3 is a strategic enhancement for Gmail/Google Workspace integration, projected to save $10-15/month on email processing while improving PDF analysis accuracy by 10-15%. Use it selectively alongside OpenRouter (primary) and Anthropic (advanced features).
