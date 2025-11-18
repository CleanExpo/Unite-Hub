# Quick Start: Run Gemini 3 Migration

**Time Required**: 10 minutes
**Cost**: $0 (testing will cost ~$0.05)

---

## ⚡ Fast Track (Copy-Paste Ready)

### 1. Run Database Migration (2 minutes)

**Supabase Dashboard** → **SQL Editor** → Paste this:

```sql
-- Copy the entire contents of:
-- supabase/migrations/046_ai_usage_tracking.sql
-- and paste here, then click RUN
```

**Or use this direct link**:
1. Open: https://supabase.com/dashboard/project/YOUR_PROJECT/sql/new
2. Copy from: `d:\Unite-Hub\supabase\migrations\046_ai_usage_tracking.sql`
3. Paste and click **RUN**

---

### 2. Install Gemini SDK (1 minute)

```bash
npm install @google/genai
```

---

### 3. Get API Key (3 minutes)

1. Visit: https://ai.google.dev/
2. Click: **"Get API key in Google AI Studio"**
3. Click: **"Create API key"**
4. Copy the key (starts with `AIza...`)

---

### 4. Add to .env.local (1 minute)

```bash
# Add these lines to .env.local
echo "" >> .env.local
echo "# Google AI (Gemini 3)" >> .env.local
echo "GOOGLE_AI_API_KEY=YOUR_KEY_HERE" >> .env.local
echo "GEMINI_DAILY_BUDGET=20.00" >> .env.local
echo "GEMINI_ALERT_THRESHOLD=16" >> .env.local
echo "GEMINI_ENABLE_THINKING=true" >> .env.local
```

**Replace `YOUR_KEY_HERE` with your actual API key!**

---

### 5. Test Installation (3 minutes)

```bash
npm run test:gemini
```

**Expected**: ✅ All 6 tests pass

---

## ✅ Success Checklist

- ⬜ Migration 046 ran successfully in Supabase
- ⬜ `@google/genai` installed (`node_modules/@google/genai` exists)
- ⬜ `GOOGLE_AI_API_KEY` in `.env.local`
- ⬜ `npm run test:gemini` passes all tests
- ⬜ `ai_usage_logs` table has 3-6 test entries

---

## 🎯 What Happens Next?

After setup is complete, Gemini 3 will automatically:

1. **Route Gmail tasks** to Gemini (via `enhancedRouteAI`)
2. **Track costs** in `ai_usage_logs` table
3. **Enforce budget** ($20/day default)
4. **Fallback to OpenRouter** if budget exceeded

**No code changes required** - the enhanced router handles everything!

---

## 🔍 Verify It's Working

### Check Database

```sql
-- Supabase SQL Editor
SELECT
  provider,
  model_id,
  cost_usd,
  created_at
FROM ai_usage_logs
WHERE provider = 'google_gemini'
ORDER BY created_at DESC
LIMIT 5;
```

**Expected**: 3-6 rows from test script

### Check Environment

```bash
node -e "console.log(process.env.GOOGLE_AI_API_KEY ? '✅ Key configured' : '❌ Key missing')"
```

**Expected**: `✅ Key configured`

### Test Live API Call

```bash
node -e "
import('@google/genai').then(({ GoogleGenAI }) => {
  const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_AI_API_KEY });
  ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: [{ parts: [{ text: 'Say hello in 3 words' }] }]
  }).then(r => console.log('✅ API working:', r.text));
});
"
```

**Expected**: `✅ API working: Hello there friend`

---

## 💰 Cost Estimate

**Week 1 Testing**:
- Test script: 6 calls × $0.004 = **$0.024**
- Benchmarking (100 emails): 100 × $0.004 = **$0.40**
- Manual testing: ~20 calls × $0.004 = **$0.08**
- **Total Week 1**: ~**$0.50** (2.5% of $20 budget)

**Week 2-4 Migration**: ~$5-10 (light usage during testing)

**Production (Month 1)**: ~$50-60 (estimated)

---

## 🚨 Quick Troubleshooting

### "Error: GOOGLE_AI_API_KEY not configured"

**Fix**:
```bash
# Verify it's in .env.local
cat .env.local | grep GOOGLE_AI_API_KEY

# If missing, add it
nano .env.local
# Add: GOOGLE_AI_API_KEY=your-key-here

# Restart dev server
npm run dev
```

### "Migration already exists"

**Fix**: Migration 046 already ran - skip to Step 2

### "Cannot find module @google/genai"

**Fix**:
```bash
npm install --save @google/genai
```

### "Budget exceeded"

**Fix**: Lower budget in `.env.local`:
```env
GEMINI_DAILY_BUDGET=10.00  # From 20 to 10
```

---

## 📞 Next Actions

After completing this quick start:

1. **Review results**: Check `ai_usage_logs` for cost tracking
2. **Read strategy**: [`docs/GEMINI_3_INTEGRATION_STRATEGY.md`](docs/GEMINI_3_INTEGRATION_STRATEGY.md)
3. **Plan Week 2**: Review [`GEMINI_3_NEXT_STEPS.md`](GEMINI_3_NEXT_STEPS.md)
4. **Start testing**: Process real Gmail emails

---

**Total Time**: ~10 minutes
**Total Cost**: ~$0.02 (test script only)
**Ready for Production**: Week 4 (after phased rollout)

🚀 **Let's get started!**
