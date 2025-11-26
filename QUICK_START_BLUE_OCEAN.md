# Blue Ocean Strategy Engine - Quick Start Guide

## 🚀 Get Started in 5 Minutes

### 1. Apply Database Migration (2 minutes)
```bash
1. Go to Supabase Dashboard
2. Navigate to SQL Editor
3. Click "New Query"
4. Copy/paste from: supabase/migrations/272_managed_service_strategies.sql
5. Click "Run"
6. Wait for completion ✅
```

### 2. Test API Endpoint (1 minute)
```bash
curl -X POST http://localhost:3008/api/managed/blue-ocean/generate \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "test-1",
    "businessName": "TechFlow",
    "industry": "Project Management",
    "targetAudience": "Mid-market SaaS teams",
    "currentChallenges": ["Complex pricing", "Poor onboarding"],
    "existingCompetitors": ["Asana", "Monday.com"],
    "desiredOutcome": "Simplest PM solution in market"
  }'
```

**Expected Response**:
```json
{
  "success": true,
  "strategyId": "uuid-here",
  "strategy": {
    "newCategoryName": "The Project Management Simplicity Platform",
    "defensibilityScore": 85,
    ...
  }
}
```

### 3. Test Frontend UI (1 minute)
```bash
1. Navigate to: http://localhost:3008/founder/blue-ocean
2. Fill form with your test data
3. Click "Generate Blue Ocean Strategy"
4. Wait 5-15 seconds
5. Review strategy results ✅
```

### 4. Retrieve Saved Strategy (1 minute)
```bash
# Get by project ID (most recent)
GET /api/managed/blue-ocean/generate?projectId=test-1

# Get by strategy ID (specific)
GET /api/managed/blue-ocean/generate?strategyId=uuid-here
```

---

## 📁 Files at a Glance

| File | Purpose | Lines |
|------|---------|-------|
| `BlueOceanStrategyEngine.ts` | Strategy generation logic | 450 |
| `blue-ocean/generate/route.ts` | API endpoint | 250 |
| `blue-ocean/page.tsx` | Frontend UI | 500 |
| `272_managed_service_strategies.sql` | Database schema | 200 |

---

## 🔧 Common Tasks

### Generate Strategy Programmatically
```typescript
import { generateBlueOceanStrategy } from '@/lib/managed/BlueOceanStrategyEngine';

const result = await generateBlueOceanStrategy({
  businessName: 'YourCompany',
  industry: 'Your Industry',
  targetAudience: 'Your Audience',
  currentChallenges: ['Challenge 1', 'Challenge 2'],
  existingCompetitors: ['Competitor A', 'Competitor B'],
  desiredOutcome: 'Your Vision',
});

console.log(result.strategy.newCategoryName);
```

### Use Orchestrator
```typescript
import { orchestrateBlueOceanStrategy } from '@/lib/managed/OrchestratorBindings';

const result = await orchestrateBlueOceanStrategy({
  projectId: 'project-123',
  businessName: 'Company Name',
  // ... other fields
});

console.log('Strategy ID:', result.strategyId);
```

### Query Database
```typescript
// Get strategies for a project
const { data } = await supabaseAdmin
  .from('managed_service_strategies')
  .select('*')
  .eq('project_id', projectId);

// Get all blue ocean strategies
const { data } = await supabaseAdmin
  .from('managed_service_strategies')
  .select('*')
  .eq('strategy_type', 'blue_ocean');
```

---

## ✅ Verification Checklist

After deployment:

- [ ] Migration 272 applied successfully
- [ ] API endpoint returns 200 OK
- [ ] Frontend page displays correctly
- [ ] Database tables exist (4 total)
- [ ] Strategy generates in <30 seconds
- [ ] Results save to database
- [ ] Can retrieve strategies via API
- [ ] RLS policies work (auth required)

---

## 🐛 Troubleshooting

### "Migration fails with 'relation does not exist'"
→ Apply migration 270 first (creates managed_service_projects table)

### "API returns 401 Unauthorized"
→ Add Authorization header with Bearer token

### "Strategy generation takes forever"
→ Check Claude API status, try again

### "Frontend shows no results"
→ Check browser console for errors
→ Verify API endpoint is working

---

## 📊 Database Tables

```sql
-- Main strategy storage
SELECT * FROM managed_service_strategies;

-- Execution phase tracking
SELECT * FROM strategy_execution_phases;

-- Alternative strategies
SELECT * FROM strategy_mutations;

-- Sub-agent task tracking
SELECT * FROM strategy_sub_agent_executions;
```

---

## 🚀 Next Steps

1. **Apply migration** → `272_managed_service_strategies.sql`
2. **Test API** → POST to `/api/managed/blue-ocean/generate`
3. **Test UI** → Navigate to `/founder/blue-ocean`
4. **Monitor logs** → Check Supabase and Vercel for errors
5. **Collect feedback** → Iterate on strategy output quality

---

## 📚 Full Documentation

- **API Docs**: See `BLUE_OCEAN_INTEGRATION.md`
- **Implementation**: See `BLUE_OCEAN_IMPLEMENTATION_SUMMARY.md`
- **Session Report**: See `SESSION_COMPLETION_REPORT.md`

---

## ⏱️ Timing

- **Generator Response**: 5-15 seconds
- **Database Insert**: <50ms
- **API Retrieval**: <100ms
- **Frontend Load**: <1 second

---

## 🎯 Key Features

✅ New category creation
✅ Narrative framework design
✅ Defensibility scoring (0-100)
✅ 4-phase execution roadmap
✅ Sub-agent routing
✅ Strategy mutations (alternatives)
✅ Market shift detection
✅ Audit logging

---

**You're all set! Deploy with confidence.** 🚀
