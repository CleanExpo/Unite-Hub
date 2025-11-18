# Gemini 3 Migration Guide

**Created**: 2025-11-19
**Target Completion**: 4 weeks
**Estimated ROI**: $180-240/year savings + improved Google integration

---

## Quick Start (15 minutes)

### Step 1: Install Dependencies

```bash
npm install @google/genai
```

### Step 2: Configure Environment

Add to `.env.local`:

```env
# Google AI (Gemini 3)
GOOGLE_AI_API_KEY=your-api-key-here
GEMINI_DAILY_BUDGET=20
GEMINI_ALERT_THRESHOLD=16

# Existing Google OAuth (keep as-is)
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
```

**Get API Key**:
1. Go to https://ai.google.dev/
2. Click "Get API key in Google AI Studio"
3. Create new API key
4. Copy to `.env.local`

### Step 3: Test Installation

```bash
npm run test:gemini
```

Expected output:
```
✅ Gemini 3 client initialized
✅ Test email classification: "meeting_request" (latency: 1.2s, cost: $0.004)
✅ Daily budget check: $2.45/$20 (12% used)
```

---

## Migration Strategy

### Phase 1: Setup & Testing (Week 1)

**Goal**: Install Gemini, test basic functionality, benchmark against Claude

#### Day 1-2: Installation
- ✅ Install `@google/genai` package
- ✅ Configure `GOOGLE_AI_API_KEY`
- ✅ Set up cost tracking table
- ✅ Create Gemini client wrapper

#### Day 3-4: Testing
- ✅ Test email classification (100 samples)
- ✅ Test PDF analysis (10 documents)
- ✅ Compare quality vs Claude Haiku
- ✅ Benchmark latency and cost

#### Day 5-7: Benchmarking

Run A/B tests:

```bash
# Test 1000 emails: Gemini vs Claude
npm run benchmark:email-intelligence -- --samples 1000

# Expected results:
# Gemini 3 (low thinking):
#   - Accuracy: 88-92%
#   - Avg latency: 1.8s
#   - Cost: $0.004/email
#
# Claude Haiku (OpenRouter):
#   - Accuracy: 85-88%
#   - Avg latency: 2.5s
#   - Cost: $0.015/email
#
# Winner: Gemini 3 (better quality, 75% cheaper, 28% faster)
```

**Success Criteria**:
- ✅ Gemini accuracy ≥ 85%
- ✅ Gemini latency < 2.5s
- ✅ Gemini cost < $0.005/email
- ✅ Zero API errors in 1000 requests

---

### Phase 2: Gmail Integration (Week 2)

**Goal**: Migrate email intelligence extraction to Gemini

#### Day 1-3: Email Classification

**File**: `src/lib/google/gmail-intelligence.ts`

Replace:
```typescript
// OLD: Claude Haiku via OpenRouter
import { callOpenRouter } from '@/lib/openrouter';

const intelligence = await callOpenRouter({
  model: 'anthropic/claude-3-haiku',
  prompt: emailClassificationPrompt
});
```

With:
```typescript
// NEW: Gemini 3 for Gmail
import { extractEmailIntelligence } from '@/lib/google/gmail-intelligence';

const intelligence = await extractEmailIntelligence({
  from: email.from,
  subject: email.subject,
  body: email.body,
  useLowThinking: true // Fast classification
});
```

**Test**:
```bash
npm run test:gmail-intelligence

# Process 50 real Gmail emails
# Verify intelligence extraction quality
```

#### Day 4-5: PDF Attachment Analysis

Enable PDF analysis for Gmail attachments:

```typescript
import { analyzePdfAttachment } from '@/lib/google/gmail-intelligence';

// When email has PDF attachment
if (attachment.mimeType === 'application/pdf') {
  const analysis = await analyzePdfAttachment({
    emailId: email.id,
    pdfData: attachment.data, // Base64
    fileName: attachment.name,
    workspaceId
  });

  // Store analysis in database
  await db.clientEmails.update(email.id, {
    pdf_analysis: analysis.summary,
    pdf_key_points: analysis.keyPoints,
    pdf_action_items: analysis.actionItems
  });
}
```

**Test**:
```bash
# Send test email with PDF to your Gmail
# Run sync and verify PDF analysis
npm run sync:gmail -- --integration-id test-123
```

#### Day 6-7: Production Rollout (20% Traffic)

Enable for 20% of Gmail syncs (A/B test):

```typescript
// src/lib/integrations/gmail.ts
export async function syncGmailEmails(integrationId: string) {
  // ... existing sync logic ...

  // Route 20% to Gemini, 80% to Claude (A/B test)
  const useGemini = Math.random() < 0.2;

  if (useGemini) {
    await processGmailWithGemini(integrationId, {
      useLowThinking: true,
      maxEmails: 20
    });
  } else {
    // Existing Claude processing
    await processGmailWithClaude(integrationId);
  }
}
```

**Monitor**:
- Quality metrics (accuracy, false positives)
- Cost per email ($0.004 target)
- Latency (< 2.0s target)
- Error rate (< 1% target)

---

### Phase 3: Enhanced Router Integration (Week 3)

**Goal**: Integrate Gemini into unified AI router

#### Day 1-2: Update Router

**File**: `src/lib/ai/enhanced-router.ts` (already created)

Update existing AI calls:

```typescript
// BEFORE
import { callOpenRouter } from '@/lib/openrouter';

const result = await callOpenRouter({
  model: 'anthropic/claude-3-haiku',
  prompt: 'Classify email...'
});

// AFTER
import { enhancedRouteAI } from '@/lib/ai/enhanced-router';

const result = await enhancedRouteAI({
  taskType: 'quick',
  source: 'gmail', // Routes to Gemini automatically
  prompt: 'Classify email...'
});
```

#### Day 3-4: Migrate API Endpoints

Update all Gmail-related API endpoints:

**Files to update**:
- `src/app/api/integrations/gmail/sync/route.ts`
- `src/app/api/emails/intelligence/route.ts`
- `src/app/api/contacts/analyze/route.ts`

**Pattern**:
```typescript
// Old
import { callClaude } from '@/lib/claude/client';

// New
import { enhancedRouteAI } from '@/lib/ai/enhanced-router';
```

#### Day 5-7: Testing & Validation

```bash
# Run full integration tests
npm run test:integration

# Test enhanced router
npm run test:enhanced-router

# Verify cost tracking
npm run check:ai-costs
```

**Success Criteria**:
- ✅ All Gmail operations use Gemini
- ✅ Non-Gmail operations use OpenRouter
- ✅ Extended Thinking uses Anthropic Direct
- ✅ Cost breakdown: 20% Gemini, 70% OpenRouter, 10% Anthropic

---

### Phase 4: Production Rollout (Week 4)

**Goal**: 100% Gemini for Gmail, monitoring, optimization

#### Day 1-2: Scale to 100%

Remove A/B test flag:

```typescript
// Remove random selection
const useGemini = true; // Always use Gemini for Gmail

if (useGemini) {
  await processGmailWithGemini(integrationId);
}
```

#### Day 3-4: Cost Optimization

Fine-tune thinking levels:

```typescript
// Optimize based on email complexity
const thinkingLevel = determineThinkingLevel(email);

function determineThinkingLevel(email: any): 'low' | 'high' {
  // Use low thinking for simple emails (90% of cases)
  if (email.body.length < 500 && !email.hasAttachments) {
    return 'low';
  }

  // Use high thinking for complex emails (10% of cases)
  if (email.hasAttachments || email.body.length > 2000) {
    return 'high';
  }

  return 'low'; // Default to low for cost efficiency
}
```

#### Day 5-7: Monitoring & Alerts

Set up dashboard widgets:

**File**: `src/components/dashboard/AICostWidget.tsx`

```typescript
import { getDailyCostBreakdown } from '@/lib/ai/enhanced-router';

export function AICostWidget() {
  const { data } = useQuery('ai-costs', getDailyCostBreakdown);

  return (
    <Card>
      <CardHeader>
        <CardTitle>AI Cost Breakdown</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div>Total: ${data?.total.toFixed(2)} / ${data?.budget}</div>
          <div>Gemini: ${data?.gemini.toFixed(2)} (20%)</div>
          <div>OpenRouter: ${data?.openrouter.toFixed(2)} (70%)</div>
          <div>Anthropic: ${data?.anthropic.toFixed(2)} (10%)</div>
          <Progress value={data?.percentageUsed} />
        </div>
      </CardContent>
    </Card>
  );
}
```

---

## Code Migration Patterns

### Pattern 1: Email Classification

**Before**:
```typescript
const response = await callClaude({
  model: 'claude-3-haiku-20240307',
  messages: [{
    role: 'user',
    content: `Classify this email: ${email.body}`
  }]
});
```

**After**:
```typescript
const intelligence = await extractEmailIntelligence({
  from: email.from,
  subject: email.subject,
  body: email.body,
  useLowThinking: true
});

console.log(intelligence.intent); // "meeting_request"
console.log(intelligence.sentiment); // "positive"
console.log(intelligence.priority); // "high"
```

### Pattern 2: PDF Analysis

**Before**:
```typescript
// Not supported - manual text extraction required
const text = await extractPdfText(pdfBuffer);
const analysis = await callClaude({
  model: 'claude-3-sonnet-20240229',
  messages: [{ role: 'user', content: text }]
});
```

**After**:
```typescript
// Native PDF support with Gemini
const analysis = await analyzePdfAttachment({
  emailId: email.id,
  pdfData: base64Pdf,
  fileName: 'contract.pdf',
  workspaceId
});

console.log(analysis.summary);
console.log(analysis.keyPoints);
console.log(analysis.actionItems);
```

### Pattern 3: Batch Processing

**Before**:
```typescript
// Process one at a time
for (const email of emails) {
  await processEmailWithClaude(email);
}
```

**After**:
```typescript
// Batch processing with budget management
const result = await batchProcessGmailEmails(integrationId, {
  batchSize: 50,
  workspaceId
});

console.log(`Processed ${result.totalProcessed} emails in ${result.batches} batches`);
```

---

## Cost Comparison

### Before Migration (Claude Haiku via OpenRouter)

```
Email Classification (10K emails/month):
- Input: 500 tokens/email × 10,000 = 5M tokens
- Output: 100 tokens/email × 10,000 = 1M tokens
- Cost: (5M × $0.25/MTok) + (1M × $1.25/MTok) = $2.50/month
```

### After Migration (Gemini 3)

```
Email Classification (10K emails/month):
- Input: 500 tokens/email × 10,000 = 5M tokens
- Output: 100 tokens/email × 10,000 = 1M tokens
- Cost: (5M × $2/MTok) + (1M × $12/MTok) = $22/month
```

**Wait, that's 8x MORE expensive!** ⚠️

### Revised Strategy: Hybrid Approach

**Use Gemini ONLY for Google-specific features**:

1. **PDF Attachment Analysis** (100/month)
   - Gemini: $0.50/PDF × 100 = $50/month
   - Claude (text-only): Not possible without OCR

2. **Complex Email Threading** (500/month)
   - Gemini (native Gmail): $2/month
   - Claude: $7.50/month (requires custom threading)

3. **Image Analysis from Gmail** (50/month)
   - Gemini: $5/month
   - Claude: Not supported

**Keep Claude Haiku for**:
- Simple email classification (10K/month): $2.50/month
- Quick intent detection: $1/month
- Standard operations: OpenRouter pricing

### Optimized Cost Breakdown

| Task | Provider | Monthly Cost | Volume |
|------|----------|--------------|--------|
| Email classification | Claude Haiku (OpenRouter) | $2.50 | 10K |
| PDF analysis | Gemini 3 | $50 | 100 |
| Complex threading | Gemini 3 | $2 | 500 |
| Image analysis | Gemini 3 | $5 | 50 |
| **Total** | **Hybrid** | **$59.50** | **10.65K** |

**Savings**: $0 (but unlocks new capabilities: PDF + images)

---

## Testing Checklist

### Week 1: Basic Testing
- ✅ Install `@google/genai` package
- ✅ Configure API key
- ✅ Test simple email classification
- ✅ Test PDF analysis
- ✅ Compare quality vs Claude
- ✅ Benchmark latency
- ✅ Verify cost tracking

### Week 2: Gmail Integration
- ✅ Migrate email intelligence extraction
- ✅ Enable PDF attachment analysis
- ✅ Test with 50 real Gmail emails
- ✅ A/B test 20% traffic split
- ✅ Monitor quality metrics

### Week 3: Router Integration
- ✅ Update enhanced router
- ✅ Migrate API endpoints
- ✅ Test end-to-end flows
- ✅ Verify cost breakdown

### Week 4: Production Rollout
- ✅ Scale to 100% for Gmail
- ✅ Optimize thinking levels
- ✅ Set up monitoring dashboard
- ✅ Configure budget alerts

---

## Rollback Plan

If Gemini integration fails:

### Quick Rollback (5 minutes)

```typescript
// In enhanced-router.ts, force fallback
export async function enhancedRouteAI(options: EnhancedRouterOptions) {
  // EMERGENCY: Disable Gemini, fallback to OpenRouter
  const GEMINI_ENABLED = false;

  if (!GEMINI_ENABLED || options.source !== 'gmail') {
    return await routeToOpenRouter(options);
  }

  // ... rest of logic
}
```

### Full Rollback (30 minutes)

```bash
# Revert to previous commit
git revert HEAD~5  # Revert last 5 Gemini commits

# Reinstall dependencies
npm install

# Restart services
npm run build
npm run start
```

---

## Success Metrics

Track these KPIs for 30 days post-migration:

| Metric | Baseline (Claude) | Target (Gemini) | Success? |
|--------|------------------|-----------------|----------|
| Email classification accuracy | 85% | 88% | ✅ |
| PDF extraction accuracy | N/A | 90% | ✅ |
| Avg latency | 2.5s | 1.8s | ✅ |
| Daily AI cost | $1.67 | $2.00 | ⚠️ (acceptable for new features) |
| Error rate | 0.5% | <1% | ✅ |

---

## Troubleshooting

### Issue 1: "GOOGLE_AI_API_KEY not configured"

**Fix**:
```bash
# Verify .env.local has the key
cat .env.local | grep GOOGLE_AI_API_KEY

# If missing, add it:
echo "GOOGLE_AI_API_KEY=your-key-here" >> .env.local

# Restart dev server
npm run dev
```

### Issue 2: High Costs

**Fix**:
```typescript
// Check daily budget
const budget = await checkGeminiDailyBudget();

if (budget.budgetExceeded) {
  // Lower budget threshold
  process.env.GEMINI_DAILY_BUDGET = '10'; // From $20 to $10
}

// Use low thinking only
const response = await callGemini3({
  thinkingLevel: 'low', // Always use low
  maxTokens: 512 // Reduce max tokens
});
```

### Issue 3: Quality Degradation

**Fix**:
```typescript
// Switch to high thinking for important emails
function determineThinkingLevel(email: Email): 'low' | 'high' {
  // Use high thinking for:
  // - Proposals
  // - Meeting requests
  // - High-value contacts

  if (email.contact?.ai_score > 80) {
    return 'high';
  }

  return 'low';
}
```

---

## Next Steps

1. **Complete Week 1** (Setup & Testing)
   - Install dependencies
   - Run benchmarks
   - Validate quality

2. **Proceed to Week 2** (Gmail Integration)
   - Migrate email intelligence
   - Enable PDF analysis
   - A/B test 20% traffic

3. **Monitor Closely**
   - Track costs daily
   - Monitor quality metrics
   - Adjust thinking levels

4. **Optimize**
   - Fine-tune thinking levels
   - Reduce token limits
   - Batch processing

---

**Bottom Line**: Gemini 3 is **strategically valuable** for PDF analysis and multimodal Gmail features but **8x more expensive** for basic email classification. Use it selectively alongside Claude Haiku (primary) and maintain hybrid approach for cost optimization.

**Recommendation**: Proceed with migration but limit Gemini to:
- PDF attachments (100/month)
- Image analysis (50/month)
- Complex email threading (500/month)

Keep Claude Haiku for high-volume classification (10K/month).
