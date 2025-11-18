# Gemini 3 Integration - Next Steps

**Status**: ✅ Code Complete - Ready for Database Setup & Testing
**Date**: 2025-11-19

---

## 🎯 Immediate Actions (Next 30 Minutes)

### Step 1: Run Database Migration (5 minutes)

The AI usage tracking migration is already prepared at `supabase/migrations/046_ai_usage_tracking.sql`. This creates the infrastructure needed for Gemini cost monitoring.

**Execute Migration**:

1. Go to **Supabase Dashboard** → **SQL Editor**
2. Open new query
3. Copy contents of `supabase/migrations/046_ai_usage_tracking.sql`
4. Click **RUN**

**Expected Output**:
```
✅ Migration 046 Complete!
📊 AI Usage Tracking System:
   Tables created: 2
   Functions created: 4
   RLS policies created: 6

✨ SUCCESS: AI usage tracking fully configured!
💰 Features enabled:
   - OpenRouter-first cost optimization
   - Per-request cost tracking
   - Daily/monthly budget limits ($50/day default)
   - Budget alert system (80% threshold)
   - Provider/task cost breakdown
   - Materialized view for fast queries
```

**What This Creates**:
- ✅ `ai_usage_logs` table - Tracks every AI API call (Gemini, OpenRouter, Anthropic)
- ✅ `ai_budget_limits` table - Budget controls per workspace
- ✅ `ai_daily_summary` materialized view - Fast daily stats
- ✅ Helper functions: `log_ai_usage()`, `check_ai_budget()`, `get_ai_cost_breakdown()`
- ✅ RLS policies for workspace isolation

---

### Step 2: Install Gemini SDK (2 minutes)

```bash
npm install @google/genai
```

This installs the official Google Generative AI SDK (Gemini 3 Pro client).

---

### Step 3: Configure Environment (3 minutes)

1. **Get Gemini API Key**:
   - Visit https://ai.google.dev/
   - Click "Get API key in Google AI Studio"
   - Create new project (or use existing)
   - Generate API key
   - Copy key

2. **Add to `.env.local`**:
   ```env
   # Google AI (Gemini 3)
   GOOGLE_AI_API_KEY=your-actual-api-key-here
   GEMINI_DAILY_BUDGET=20.00
   GEMINI_ALERT_THRESHOLD=16
   GEMINI_ENABLE_THINKING=true

   # Existing Google OAuth (keep as-is)
   GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=your-client-secret
   ```

---

### Step 4: Test Installation (5 minutes)

```bash
# Test Gemini 3 setup
npm run test:gemini
```

**Expected Output**:
```
🧪 Testing Gemini 3 Pro Setup...

Test 1: Environment Configuration
──────────────────────────────────────────────
✅ GOOGLE_AI_API_KEY configured
   Key: AIzaSyD8x...4kLQ
✅ GEMINI_DAILY_BUDGET: $20

Test 2: Email Classification (Low Thinking)
──────────────────────────────────────────────
✅ Classification: "meeting_request"
   Latency: 1234ms
   Tokens: 456 in / 12 out
   Cost: $0.004200

Test 3: Structured Intelligence Extraction
──────────────────────────────────────────────
✅ Intent: meeting_request
   Sentiment: positive
   Priority: high
   Action Items: 2
   Entities Found:
     - People: John Smith
     - Companies: Acme Corporation
     - Dates: next Tuesday at 2pm
     - Amounts: $50,000
   Summary: VP of Operations requesting urgent...
   Latency: 1800ms

Test 4: High Thinking Level (Complex Analysis)
──────────────────────────────────────────────
✅ Strategic Assessment:
   This is a high-value opportunity... (analysis)

   Latency: 3200ms
   Cost: $0.008400

   💡 High thinking cost: 100% more expensive
      Use only for strategic analysis, not bulk classification

Test 5: Daily Budget Status
──────────────────────────────────────────────
✅ Budget Status:
   Daily Budget: $20
   Remaining: $19.99
   Status: ✅ Within budget

Test 6: Cost Calculation Verification
──────────────────────────────────────────────
✅ Cost calculation for 1K input + 500 output tokens:
   Calculated: $0.008000
   Expected: $0.008000
   Match: ✅

──────────────────────────────────────────────
📊 Test Summary

✅ All core tests passed!

Next Steps:
1. Run: npm run test:gmail-intelligence
2. Test with real Gmail emails
3. Monitor costs in dashboard
4. Compare quality vs Claude Haiku

📚 Documentation:
   Strategy: docs/GEMINI_3_INTEGRATION_STRATEGY.md
   Migration: docs/GEMINI_3_MIGRATION_GUIDE.md

🎯 Recommended Usage:
   - Gmail email intelligence: ✅ Use Gemini 3 (low thinking)
   - PDF attachment analysis: ✅ Use Gemini 3 (medium resolution)
   - High-volume classification: ❌ Use Claude Haiku (cheaper)
   - Extended thinking tasks: ❌ Use Claude Opus (better quality)
```

---

### Step 5: Verify Database Tracking (5 minutes)

After running the test, verify cost tracking is working:

1. Go to **Supabase Dashboard** → **Table Editor**
2. Open `ai_usage_logs` table
3. You should see **6 test entries**:
   - Test 2: Email classification (low thinking)
   - Test 3: Intelligence extraction
   - Test 4: High thinking analysis
   - Cost tracking entries

**Expected Data**:
```sql
SELECT
  provider,
  model_id,
  tokens_input,
  tokens_output,
  cost_usd,
  latency_ms,
  created_at
FROM ai_usage_logs
ORDER BY created_at DESC
LIMIT 6;
```

**Expected Results**:
| provider | model_id | tokens_input | tokens_output | cost_usd | latency_ms |
|----------|----------|--------------|---------------|----------|------------|
| google_gemini | gemini-3-pro-preview | 1000 | 500 | 0.008000 | 3200 |
| google_gemini | gemini-3-pro-preview | 650 | 800 | 0.010900 | 1800 |
| google_gemini | gemini-3-pro-preview | 456 | 12 | 0.004200 | 1234 |

---

## 📋 Week 1 Tasks (This Week)

### Day 1: Setup & Validation ✅ (Today)
- ✅ Code implementation complete
- ⬜ Run migration 046
- ⬜ Install `@google/genai`
- ⬜ Configure API key
- ⬜ Run `npm run test:gemini`
- ⬜ Verify database tracking

### Day 2-3: Benchmarking
- ⬜ Create test dataset (100 real Gmail emails)
- ⬜ Run A/B test: Gemini vs Claude
- ⬜ Compare metrics:
  - Intent accuracy
  - Sentiment accuracy
  - Latency
  - Cost per email
- ⬜ Document results

**Create benchmark script**:
```bash
# Create test dataset
npm run create-test-dataset -- --count 100

# Run benchmark
npm run benchmark:email-intelligence -- --samples 100

# Expected output:
# Gemini 3 (low thinking):
#   Accuracy: 88-92%
#   Avg latency: 1.8s
#   Cost: $0.004/email
#
# Claude Haiku (OpenRouter):
#   Accuracy: 85-88%
#   Avg latency: 2.5s
#   Cost: $0.015/email
#
# Winner: Gemini 3 (better quality, 73% cheaper, 28% faster)
```

### Day 4-5: Gmail Integration Setup
- ⬜ Test with real Gmail account
- ⬜ Sync 20 emails
- ⬜ Process with Gemini intelligence
- ⬜ Verify database updates
- ⬜ Check cost tracking

**Test with real Gmail**:
```bash
# Sync Gmail (use existing integration)
npm run sync:gmail -- --integration-id your-integration-id --max-emails 20

# Process with Gemini
node scripts/process-gmail-with-gemini.mjs --integration-id your-integration-id

# Check results
npm run query:ai-usage -- --provider google_gemini --days 1
```

### Day 6-7: Cost Analysis
- ⬜ Review week 1 costs
- ⬜ Compare vs baseline (Claude only)
- ⬜ Optimize thinking levels
- ⬜ Adjust token limits
- ⬜ Document learnings

---

## 📊 Success Criteria (Week 1)

Before proceeding to Week 2, validate:

| Metric | Target | Status |
|--------|--------|--------|
| **Installation** | Gemini SDK installed | ⬜ |
| **API Key** | Valid, tested | ⬜ |
| **Database** | Migration 046 complete | ⬜ |
| **Test Suite** | All tests passing | ⬜ |
| **Accuracy** | ≥85% intent classification | ⬜ |
| **Latency** | <2.5s avg | ⬜ |
| **Cost** | <$0.005/email | ⬜ |
| **Tracking** | Usage logged to DB | ⬜ |

**If all ✅**: Proceed to Week 2 (Gmail Integration)
**If any ❌**: Troubleshoot before proceeding

---

## 🚨 Troubleshooting

### Issue 1: Migration 046 Fails

**Error**: "relation already exists"

**Fix**:
```sql
-- Check if tables exist
SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename LIKE 'ai_%';

-- If ai_usage_logs exists, migration already ran
-- Skip to Step 2
```

### Issue 2: npm install fails

**Error**: "Cannot find module '@google/genai'"

**Fix**:
```bash
# Clear cache
npm cache clean --force

# Reinstall
rm -rf node_modules package-lock.json
npm install
npm install @google/genai
```

### Issue 3: Test fails with API error

**Error**: "GOOGLE_AI_API_KEY not configured"

**Fix**:
```bash
# Verify .env.local
cat .env.local | grep GOOGLE_AI_API_KEY

# If missing, add it
echo "GOOGLE_AI_API_KEY=your-key-here" >> .env.local

# Restart dev server
npm run dev
```

### Issue 4: Database tracking not working

**Error**: No entries in `ai_usage_logs`

**Fix**:
```typescript
// Check if getSupabaseAdmin() is working
import { getSupabaseAdmin } from '@/lib/supabase';

const supabase = getSupabaseAdmin();
const { data, error } = await supabase.from('ai_usage_logs').select('*').limit(1);

if (error) {
  console.error('Supabase admin not configured:', error);
  // Add SUPABASE_SERVICE_ROLE_KEY to .env.local
}
```

---

## 📚 Reference Documentation

1. **Strategy Guide**: [`docs/GEMINI_3_INTEGRATION_STRATEGY.md`](docs/GEMINI_3_INTEGRATION_STRATEGY.md)
   - Cost analysis
   - Use case recommendations
   - Architecture patterns

2. **Migration Guide**: [`docs/GEMINI_3_MIGRATION_GUIDE.md`](docs/GEMINI_3_MIGRATION_GUIDE.md)
   - 4-week phased rollout
   - Code migration patterns
   - Testing checklist

3. **Implementation Summary**: [`GEMINI_3_IMPLEMENTATION_COMPLETE.md`](GEMINI_3_IMPLEMENTATION_COMPLETE.md)
   - What was delivered
   - Technical specs
   - Quick start guide

4. **Database Migration**: [`supabase/migrations/046_ai_usage_tracking.sql`](supabase/migrations/046_ai_usage_tracking.sql)
   - AI usage logging
   - Budget controls
   - Cost tracking

---

## 💡 Quick Wins (After Week 1)

Once basic setup is complete, you can immediately:

1. **Process PDF attachments** from Gmail
   ```typescript
   const analysis = await analyzePdfAttachment({
     emailId: email.id,
     pdfData: base64Pdf,
     fileName: 'contract.pdf'
   });
   ```

2. **Get daily cost breakdown**
   ```typescript
   const costs = await getDailyCostBreakdown();
   // { total: 12.45, gemini: 2.50, openrouter: 8.70, anthropic: 1.25 }
   ```

3. **Smart routing** (automatic)
   ```typescript
   const result = await enhancedRouteAI({
     taskType: 'quick',
     source: 'gmail', // Routes to Gemini automatically
     prompt: 'Classify this email...'
   });
   ```

---

## 🎯 Long-term Roadmap

### Week 2: Gmail Integration
- Migrate email intelligence to Gemini
- Enable PDF attachment analysis
- A/B test 20% of traffic

### Week 3: Router Integration
- Update all Gmail API endpoints
- Verify 20/70/10 cost split
- Integration testing

### Week 4: Production Rollout
- Scale to 100% for Gmail
- Optimize thinking levels
- Set up monitoring dashboard

### Future Enhancements (Q1 2025)
- Google Calendar event intelligence
- Google Drive document analysis
- Google Meet transcript processing
- Unified Google Workspace dashboard

---

**Ready to begin?** Start with **Step 1: Run Database Migration** above! 🚀

**Questions?** Review the documentation or check the troubleshooting section.

**Cost Estimate**: Week 1 testing will cost approximately $2-5 (well within $20/day Gemini budget).
