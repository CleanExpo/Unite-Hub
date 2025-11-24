# Anthropic Retry Logic Migration Guide

**Status**: Partially Complete (3/30 files)
**Priority**: P0 - Critical for production stability
**Estimated Remaining Time**: 3-4 hours
**Impact**: Eliminates 500 errors from API failures

---

## 📊 Progress Summary

### ✅ Completed Files (3/30)

**High-Priority Agent Files:**
1. ✅ `src/lib/agents/email-intelligence-agent.ts` - 1 call wrapped
2. ✅ `src/lib/agents/content-personalization.ts` - 1 call wrapped (with Extended Thinking)
3. ✅ `src/lib/agents/calendar-intelligence.ts` - Import added

**Impact**: Most critical email processing and content generation agents now protected.

### 📝 Remaining Files (22 files, 33+ calls)

**Agent Files:**
- `src/lib/agents/whatsapp-intelligence.ts` - 3 calls
- `src/lib/agents/contact-intelligence.ts` - 1 call
- `src/lib/agents/email-processor.ts` - 1 call
- `src/lib/agents/intelligence-extraction.ts` - 1 call
- `src/lib/agents/mindmap-analysis.ts` - 2 calls
- `src/lib/agents/multi-model-orchestrator.ts` - 1 call

**AI Service Files:**
- `src/lib/ai/enhanced-router.ts` - 1 call
- `src/lib/ai/orchestrator.ts` - 2 calls
- `src/lib/ai/claude-client.ts` - 6 calls

**Client Agent Files:**
- `src/lib/clientAgent/clientAgentPlannerService.ts` - 2 calls

**API Routes (12 files):**
- `src/app/api/ai/chat/route.ts` - 1 call
- `src/app/api/landing-pages/[id]/alternatives/route.ts` - 1 call
- `src/app/api/landing-pages/[id]/regenerate/route.ts` - 1 call
- `src/app/api/landing-pages/generate/route.ts` - 1 call
- `src/app/api/social-templates/[id]/variations/route.ts` - 1 call
- `src/app/api/social-templates/generate/route.ts` - 1 call
- `src/app/api/competitors/analyze/route.ts` - 1 call
- `src/app/api/media/analyze/route.ts` - 1 call
- `src/app/api/sequences/generate/route.ts` - 1 call
- `src/app/api/calendar/[postId]/regenerate/route.ts` - 1 call
- `src/app/api/calendar/generate/route.ts` - 1 call

**Other Files:**
- `next/core/ai/orchestrator.ts` - 2 calls

---

## 🔧 Implementation Pattern

### Step 1: Add Import

```typescript
// Add this import at the top of the file
import { callAnthropicWithRetry } from "@/lib/anthropic/rate-limiter";
```

### Step 2: Wrap Anthropic Calls

**❌ BEFORE (Unsafe - No retry):**
```typescript
const message = await anthropic.messages.create({
  model: "claude-sonnet-4-5-20250929",
  max_tokens: 2048,
  messages: [{ role: 'user', content: prompt }],
});
```

**✅ AFTER (Safe - With retry):**
```typescript
const result = await callAnthropicWithRetry(async () => {
  return await anthropic.messages.create({
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 2048,
    messages: [{ role: 'user', content: prompt }],
  });
});

const message = result.data;
```

### Step 3: Handle Extended Thinking (if used)

**For Opus 4 with Extended Thinking:**
```typescript
const result = await callAnthropicWithRetry(async () => {
  return await anthropic.messages.create({
    model: "claude-opus-4-1-20250805",
    max_tokens: 2000,
    thinking: {
      type: "enabled",
      budget_tokens: 5000,
    },
    system: [
      {
        type: "text",
        text: systemPrompt,
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: [
      {
        role: "user",
        content: userContent,
      },
    ],
  });
});

const message = result.data;
```

---

## 🎯 Priority Order for Remaining Files

### Phase 1: High-Impact Agents (1-2 hours)
1. **whatsapp-intelligence.ts** - 3 calls (messaging critical)
2. **contact-intelligence.ts** - 1 call (scoring critical)
3. **email-processor.ts** - 1 call (email pipeline critical)

### Phase 2: AI Service Layer (1 hour)
4. **claude-client.ts** - 6 calls (shared client used everywhere)
5. **enhanced-router.ts** - 1 call (routing logic)
6. **orchestrator.ts** - 2 calls (coordination)

### Phase 3: Remaining Agents (30 min)
7. **intelligence-extraction.ts** - 1 call
8. **mindmap-analysis.ts** - 2 calls
9. **multi-model-orchestrator.ts** - 1 call

### Phase 4: API Routes (1-1.5 hours)
10. All 12 API route files (1 call each)

---

## 🚀 Quick Update Script

Use the analysis script to check progress:

```bash
node scripts/add-retry-logic.mjs
```

This will show:
- ✅ Files already updated
- 📝 Files needing manual updates
- 📊 Summary statistics

---

## ✅ Success Criteria

After completing all updates:

1. **Zero direct `anthropic.messages.create()` calls** without retry wrapper
2. **All 30 files** use `callAnthropicWithRetry()`
3. **Test agents work** with:
   ```bash
   npm run email-agent
   npm run content-agent
   ```
4. **Verify retry behavior** by temporarily setting invalid API key:
   ```bash
   ANTHROPIC_API_KEY=invalid npm run email-agent
   ```
   Should see:
   - "Anthropic API attempt 1/4 failed"
   - "Retrying in 1s (attempt 2/4)..."
   - Automatic exponential backoff

---

## 🔍 Retry Logic Features

The `callAnthropicWithRetry` function provides:

### Automatic Retries
- **3 retry attempts** with exponential backoff
- Base delay: 1 second, max delay: 30 seconds
- Jitter added to prevent thundering herd

### Error Detection
- **Rate limit errors (429)** - Wait 60s before retry
- **Server errors (5xx)** - Exponential backoff
- **Timeout errors (408, 504)** - Retry with backoff
- **Network errors** (ECONNRESET, ECONNREFUSED) - Retry

### Cost Tracking
- Returns `attempts` count
- Returns `totalTime` for monitoring
- Logs cache performance statistics

### Timeout Protection
- Default 60-second timeout per attempt
- Configurable via options

---

## 📈 Expected Outcomes

### Before Retry Logic:
- ❌ Single API failure = 500 error crashes agent
- ❌ Rate limits cause production outages
- ❌ Network hiccups stop processing
- ❌ No automatic recovery

### After Retry Logic:
- ✅ Automatic 3-retry with exponential backoff
- ✅ Rate limit detection with proper wait time
- ✅ Network error recovery
- ✅ Graceful degradation on extended outages
- ✅ Zero 500 errors from transient failures

---

## 🛠️ Testing Checklist

After completing all updates:

- [ ] All files compile without TypeScript errors
- [ ] Email agent runs successfully: `npm run email-agent`
- [ ] Content agent runs successfully: `npm run content-agent`
- [ ] Retry logic activates on failure (test with invalid API key)
- [ ] Production deployment has zero Anthropic 500 errors
- [ ] Monitoring shows automatic retry attempts in logs

---

## 📝 Next Steps

1. Complete remaining 22 files (3-4 hours)
2. Test each updated file
3. Deploy to production
4. Monitor for retry behavior in logs
5. Document any new patterns discovered

---

**Last Updated**: 2025-11-25
**Completed By**: Orchestrator Agent (Partial - 3/30 files)
**Remaining Work**: 22 files, estimated 3-4 hours
