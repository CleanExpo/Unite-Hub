# Missing Vercel Environment Variables - Production

**Date**: 2025-11-19
**Status**: Required for OpenRouter + Gemini Integration

---

## ⚠️ Missing Environment Variables

The following environment variables are **REQUIRED** but **NOT CONFIGURED** in Vercel production:

### 1. OpenRouter Configuration (CRITICAL)

```bash
# You already have this as OPEN_API_KEY in Vercel
# Both variable names are supported (OPENROUTER_API_KEY or OPEN_API_KEY)
OPENROUTER_API_KEY=sk-or-v1-your-production-key
# OR
OPEN_API_KEY=sk-or-v1-your-production-key
```

**Status**: ✅ **ALREADY CONFIGURED** (as `OPEN_API_KEY` in Vercel)
**Purpose**: Primary AI routing provider (70-80% of requests)
**Get Key**: https://openrouter.ai/keys
**Cost Impact**: Without this, 100% requests go to direct Anthropic API (3-10x more expensive)
**Priority**: 🟢 **ALREADY SET** - Code updated to support both variable names

**Optional Backup**:
```bash
OPENROUTER_API_KEY_2=sk-or-v1-your-backup-key
```

---

### 2. Google Gemini Configuration (OPTIONAL but RECOMMENDED)

```bash
GOOGLE_AI_API_KEY=your-gemini-production-key
```

**Purpose**: Direct Gemini API access (alternative to OpenRouter Gemini routing)
**Get Key**: https://ai.google.dev/
**Cost Impact**: Enables direct Gemini 3 Pro with thinking mode
**Priority**: 🟡 **P1 RECOMMENDED** - System works without it (uses OpenRouter Gemini instead)

**Optional Settings**:
```bash
GEMINI_DAILY_BUDGET=20.00        # Default: $20/day for direct Gemini calls
GEMINI_ALERT_THRESHOLD=16        # Alert at 80% ($16)
GEMINI_ENABLE_THINKING=true      # Allow high thinking level
```

---

### 3. AI Budget Controls (RECOMMENDED)

```bash
AI_DAILY_BUDGET=50.00            # Total AI budget per day (all providers)
AI_MONTHLY_BUDGET=1500.00        # Total AI budget per month
AI_ALERT_THRESHOLD=80            # Alert at 80% of budget
AI_ENFORCE_BUDGET=true           # Hard stop when budget exceeded
```

**Purpose**: Automatic budget enforcement and alerts
**Default Behavior**: If not set, defaults to $50/day and $1500/month
**Priority**: 🟢 **P2 OPTIONAL** - Database defaults will be used if not set

---

## ✅ Already Configured (No Action Needed)

These variables are already present in Vercel production:

✅ `ANTHROPIC_API_KEY` - Anthropic Claude API (fallback + Extended Thinking)
✅ `NEXT_PUBLIC_SUPABASE_URL` - Supabase database URL
✅ `SUPABASE_SERVICE_ROLE_KEY` - Supabase admin access
✅ `GOOGLE_API_KEY` - Google APIs (Gmail, etc.)
✅ `OPENAI_API_KEY` - OpenAI API (Whisper transcription)
✅ All auth variables (NEXTAUTH_SECRET, GOOGLE_CLIENT_ID, etc.)

---

## 📋 How to Add Variables to Vercel

### Option 1: Vercel Dashboard (Recommended)

1. Go to https://vercel.com/unite-group/unite-hub/settings/environment-variables
2. Click "Add New"
3. Enter variable name and value
4. Select environments: **Production** (and optionally Preview/Development)
5. Click "Save"
6. **Important**: Redeploy after adding variables

### Option 2: Vercel CLI

```bash
# Add OPENROUTER_API_KEY
vercel env add OPENROUTER_API_KEY production
# Paste your key when prompted

# Add AI budget variables
vercel env add AI_DAILY_BUDGET production
# Enter: 50.00

vercel env add AI_MONTHLY_BUDGET production
# Enter: 1500.00

vercel env add AI_ALERT_THRESHOLD production
# Enter: 80

vercel env add AI_ENFORCE_BUDGET production
# Enter: true

# Optional: Add Gemini API key
vercel env add GOOGLE_AI_API_KEY production
# Paste your Gemini key when prompted
```

### Option 3: Bulk Add via .env File

```bash
# Create production.env with your keys
cat > production.env <<EOF
OPENROUTER_API_KEY=sk-or-v1-your-production-key
AI_DAILY_BUDGET=50.00
AI_MONTHLY_BUDGET=1500.00
AI_ALERT_THRESHOLD=80
AI_ENFORCE_BUDGET=true
EOF

# Add all at once (requires vercel CLI)
vercel env pull .env.production.local
# Then add missing vars via dashboard
```

---

## 🎯 Impact Analysis

### If OPENROUTER_API_KEY is NOT added:

**What Happens**:
- ❌ All AI requests route to direct Anthropic API
- ❌ Costs increase 3-10x (depending on task type)
- ❌ Ultra-cheap tasks: $0.80 instead of $0.075 (10x more expensive)
- ❌ Budget tasks: $3.00 instead of $0.10 (30x more expensive)
- ✅ System still works (just more expensive)

**Monthly Cost Impact** (medium team):
- **Without OpenRouter**: $630/month
- **With OpenRouter**: $132.50/month
- **Lost Savings**: $497.50/month ($5,970/year)

### If AI Budget Variables are NOT added:

**What Happens**:
- ✅ Database defaults apply ($50/day, $1500/month)
- ✅ Budget enforcement still works
- ⚠️ Cannot customize limits without database update
- ⚠️ Alert threshold fixed at 80%

**Impact**: Minimal - defaults are reasonable

### If GOOGLE_AI_API_KEY is NOT added:

**What Happens**:
- ✅ Gemini requests route through OpenRouter
- ✅ Costs still 60-75% cheaper than Anthropic
- ❌ Cannot use direct Gemini 3 Pro with advanced thinking mode
- ⚠️ Relies on OpenRouter's Gemini availability

**Impact**: Low - OpenRouter Gemini is sufficient for most use cases

---

## 🚀 Recommended Action Plan

### Immediate (Add Now)

```bash
# P0 CRITICAL - Add OpenRouter API key
vercel env add OPENROUTER_API_KEY production
# Enter: sk-or-v1-your-production-key

# Redeploy to apply
vercel --prod
```

**Expected Result**: 60-75% cost reduction takes effect immediately

### Optional (Add Later)

```bash
# P1 - Add Gemini direct API key (if you want advanced thinking)
vercel env add GOOGLE_AI_API_KEY production

# P2 - Customize budget limits (if defaults don't work)
vercel env add AI_DAILY_BUDGET production
vercel env add AI_MONTHLY_BUDGET production
```

---

## 🧪 How to Verify After Adding

### Step 1: Check Variables Were Added

```bash
vercel env ls | grep -i "openrouter\|ai_daily\|gemini"
```

Expected output:
```
OPENROUTER_API_KEY    Encrypted    Production    <timestamp>
AI_DAILY_BUDGET       Encrypted    Production    <timestamp>
AI_MONTHLY_BUDGET     Encrypted    Production    <timestamp>
```

### Step 2: Redeploy

```bash
vercel --prod
```

### Step 3: Test API Endpoint

```bash
# Test cost dashboard endpoint
curl https://unite-hub.vercel.app/api/ai/cost-dashboard?workspaceId=<your-workspace-id>
```

Expected: JSON response with budget status

### Step 4: Check Logs After 1 Hour

```sql
-- In Supabase SQL Editor:
SELECT
  provider,
  COUNT(*) as requests,
  SUM(cost_usd) as total_cost
FROM ai_usage_logs
WHERE created_at >= NOW() - INTERVAL '1 hour'
GROUP BY provider;
```

Expected:
- `openrouter`: 70-80% of requests
- `anthropic_direct`: 20-30% of requests

---

## 📊 Current Status

| Variable | Status | Priority | Impact if Missing |
|----------|--------|----------|-------------------|
| `OPENROUTER_API_KEY` | ❌ **MISSING** | 🔴 P0 | 3-10x higher costs |
| `AI_DAILY_BUDGET` | ⚠️ Optional | 🟢 P2 | Uses DB default ($50) |
| `AI_MONTHLY_BUDGET` | ⚠️ Optional | 🟢 P2 | Uses DB default ($1500) |
| `AI_ALERT_THRESHOLD` | ⚠️ Optional | 🟢 P2 | Uses DB default (80%) |
| `AI_ENFORCE_BUDGET` | ⚠️ Optional | 🟢 P2 | Uses DB default (true) |
| `GOOGLE_AI_API_KEY` | ⚠️ Optional | 🟡 P1 | Uses OpenRouter Gemini |
| `GEMINI_DAILY_BUDGET` | ⚠️ Optional | 🟢 P2 | Not needed without direct Gemini |

---

## 🎯 Bottom Line

**MINIMUM REQUIRED** (to get cost savings):
```bash
OPENROUTER_API_KEY=sk-or-v1-your-production-key
```

**RECOMMENDED** (for full functionality):
```bash
OPENROUTER_API_KEY=sk-or-v1-your-production-key
AI_DAILY_BUDGET=50.00
AI_MONTHLY_BUDGET=1500.00
AI_ENFORCE_BUDGET=true
```

**OPTIONAL** (nice to have):
```bash
GOOGLE_AI_API_KEY=your-gemini-key
GEMINI_ENABLE_THINKING=true
```

---

**Next Steps**:
1. Add `OPENROUTER_API_KEY` to Vercel production
2. Redeploy: `vercel --prod`
3. Monitor usage in Supabase after 1 hour
4. Verify 70-80% OpenRouter usage

**Get OpenRouter Key**: https://openrouter.ai/keys

---

**Last Updated**: 2025-11-19
**File**: MISSING_ENV_VARS.md
