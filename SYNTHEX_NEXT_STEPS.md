# Synthex.social MVP – Next Steps (Phase C-F)

**Current Status**: 92% Complete (Phase A & B Done)
**Time to MVP**: 6-8 hours remaining
**Ready for**: DigitalOcean deployment after Phase F

---

## Quick Navigation

- **Phase C**: UI Wiring (3 hours) - NEXT
- **Phase D**: Founder Portfolio (2 hours)
- **Phase E**: Deployment Ops (2 hours)
- **Phase F**: Dogfooding & Validation (1 hour)

---

## Phase C – Final Client UI Flows (3 hours) – NEXT PRIORITY

### Objective
Connect React components to real API endpoints, remove all stubs.

### Task 1: Wire Onboarding → Tenant API (1.5 hours)

**File**: `src/app/synthex/onboarding/page.tsx`

**What to Change**:
```typescript
// OLD (current code)
const handleConfirmAndCreate = async () => {
  const response = await fetch('/api/synthex/create-tenant', { // ← WRONG endpoint
    // ...
  });
};

// NEW (use real endpoint)
const handleConfirmAndCreate = async () => {
  const response = await fetch('/api/synthex/tenant', { // ← CORRECT
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({
      businessName: state.businessProfile.businessName,
      industry: state.businessProfile.industry,
      region: state.businessProfile.region,
      websiteUrl: state.businessProfile.websiteUrl,
      planCode: state.selectedPlan,
      offerTier: offerBanner?.tier || 'standard',
      brandName: state.brandSetup.brandName,
      primaryDomain: state.brandSetup.primaryDomain,
      tagline: state.brandSetup.tagline,
      valueProposition: state.brandSetup.valueProposition,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    setError(error.error || 'Failed to create account');
    return;
  }

  const { tenant, subscription } = await response.json();
  router.push(`/synthex/dashboard?tenantId=${tenant.id}`);
};
```

**Checklist**:
- [ ] Replace `/api/synthex/create-tenant` with `/api/synthex/tenant`
- [ ] Add Authorization header with session token
- [ ] Update body to match new API schema
- [ ] Handle response errors
- [ ] Redirect to dashboard with tenantId parameter

---

### Task 2: Wire Dashboard → Job API (1.5 hours)

**File**: `src/app/synthex/dashboard/page.tsx`

**What to Change**:
```typescript
// OLD (current code)
const fetchTenantData = async () => {
  // Using mock Supabase queries
  const { data: tenantData } = await supabase
    .from('synthex_tenants')
    .select('*')
    .eq('id', tenantId)
    .eq('owner_user_id', user.id)
    .single();
};

// NEW (use APIs)
const fetchTenantData = async () => {
  // Tenant info
  const tenantRes = await fetch(`/api/synthex/tenant?tenantId=${tenantId}`, {
    headers: { Authorization: `Bearer ${session.access_token}` },
  });
  const { tenant } = await tenantRes.json();

  // Billing info
  const billingRes = await fetch(`/api/synthex/billing?tenantId=${tenantId}`, {
    headers: { Authorization: `Bearer ${session.access_token}` },
  });
  const billing = await billingRes.json();

  // Jobs
  const jobsRes = await fetch(`/api/synthex/job?tenantId=${tenantId}`, {
    headers: { Authorization: `Bearer ${session.access_token}` },
  });
  const { jobs } = await jobsRes.json();

  setTenant(tenant);
  setSubscription(billing.subscription);
  setJobs(jobs);
  // ... etc
};
```

**Job Creation Handler**:
```typescript
const handleCreateJob = async (jobData: any) => {
  const res = await fetch('/api/synthex/job', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({
      tenantId,
      jobType: jobData.jobType,
      payload: jobData.payload,
    }),
  });

  if (res.ok) {
    fetchTenantData(); // Refresh jobs list
    setShowJobModal(false);
  }
};
```

**Checklist**:
- [ ] Fetch from `/api/synthex/tenant` instead of Supabase
- [ ] Fetch from `/api/synthex/billing` for subscription
- [ ] Fetch from `/api/synthex/job` for jobs list
- [ ] Implement job creation via POST /api/synthex/job
- [ ] Add polling or WebSocket for real-time job status
- [ ] Display real job results from API
- [ ] Remove all mock data generation

---

### Task 3: Build Result Viewer Component (no component exists yet)

**Create**: `src/components/synthex/ResultViewer.tsx`

```typescript
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Copy, Download } from 'lucide-react';

interface ResultViewerProps {
  jobId: string;
  jobType: string;
  results: any[];
}

export function ResultViewer({ jobId, jobType, results }: ResultViewerProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Job Results</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {results.length === 0 ? (
          <p className="text-slate-600">No results yet</p>
        ) : (
          results.map((result, i) => (
            <div key={i} className="border rounded p-4 space-y-2">
              <h4 className="font-semibold">{result.result_type}</h4>
              <pre className="bg-slate-100 p-2 rounded overflow-x-auto text-sm">
                {JSON.stringify(result.result_json, null, 2)}
              </pre>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => navigator.clipboard.writeText(JSON.stringify(result.result_json))}
                >
                  <Copy size={16} /> Copy
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const el = document.createElement('a');
                    el.href = `data:application/json,${encodeURIComponent(JSON.stringify(result.result_json))}`;
                    el.download = `result-${jobId}.json`;
                    el.click();
                  }}
                >
                  <Download size={16} /> Download
                </Button>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
```

**Checklist**:
- [ ] Create result viewer component
- [ ] Display job results from synthex_job_results
- [ ] Add copy to clipboard functionality
- [ ] Add download as JSON functionality
- [ ] Show job status (pending/running/completed/failed)
- [ ] Integrate into dashboard results tab

---

### Testing Phase C

After completing Task 1-3:

```bash
# 1. Start development server
npm run dev

# 2. Test onboarding flow
- Go to http://localhost:3008/synthex/onboarding
- Fill in all fields
- Select a plan and offer
- Click "Activate Account"
- Should redirect to dashboard with tenantId

# 3. Test job creation
- In dashboard, click "New Job"
- Create a content_batch job (5 posts)
- Check database: synthex_project_jobs should have new row
- Check console: Should see LLM API call logs

# 4. Wait for job execution
- Job should execute within seconds
- Check synthex_job_results table for results

# 5. View results
- Click job in dashboard
- See generated content in result viewer
- Test copy/download
```

---

## Phase D – Founder Portfolio Control Wiring (2 hours)

### File: `src/app/founder/synthex-portfolio/page.tsx`

**Current Issue**: Portfolio uses mock data

**What to Change**:
```typescript
// OLD
const tenantsWithMetrics: TenantWithMetrics[] = await Promise.all(
  (tenantData || []).map(async (tenant: any) => {
    // Mock metrics calculation
    return { /* hardcoded values */ };
  })
);

// NEW
const tenantsWithMetrics: TenantWithMetrics[] = await Promise.all(
  (tenantData || []).map(async (tenant: any) => {
    // Get real metrics from API
    const jobsRes = await fetch(`/api/synthex/job?tenantId=${tenant.id}`, {
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    const { jobs } = await jobsRes.json();

    // Calculate real health score
    const jobsCompleted = jobs.filter((j: any) => j.status === 'completed').length;
    const jobsTotal = jobs.length;
    const completionRate = jobsTotal > 0 ? (jobsCompleted / jobsTotal) * 100 : 0;

    // ... rest of metrics
  })
);
```

**Checklist**:
- [ ] Replace mock metrics with real data
- [ ] Fetch real jobs for each tenant
- [ ] Calculate health scores from actual data
- [ ] Show real revenue from subscriptions
- [ ] Implement quick actions (view jobs, extend offer, suspend)

---

## Phase E – Deployment & Go-Live Ops (2 hours)

### Checklist

```bash
# 1. Supabase Production Setup
[ ] Login to Supabase dashboard
[ ] Go to SQL Editor
[ ] Run migration: supabase/migrations/254_synthex_core_structure.sql
[ ] Verify 7 tables created (synthex_tenants, brands, subscriptions, etc.)
[ ] Verify RLS policies are active
[ ] Check offer_counters seeded (50 + 200 + unlimited)

# 2. Vercel Environment Variables
[ ] Go to https://vercel.com/projects
[ ] Select project
[ ] Settings → Environment Variables
[ ] Add:
    - ANTHROPIC_API_KEY=sk-ant-...
    - NEXT_PUBLIC_SUPABASE_URL=https://...
    - NEXT_PUBLIC_SUPABASE_ANON_KEY=...
    - SUPABASE_SERVICE_ROLE_KEY=...

# 3. Domain Configuration
[ ] Purchase synthex.social domain (if not already)
[ ] Add DNS records pointing to Vercel
[ ] Wait for DNS propagation (5-30 minutes)
[ ] Test: https://synthex.social loads production app

# 4. Post-Deployment
[ ] Trigger Supabase caching refresh: SELECT * FROM synthex_tenants LIMIT 1;
[ ] Test OAuth flow (Google login)
[ ] Create test tenant in production
```

### DigitalOcean Setup (Post-MVP)

```bash
# 1. Create DigitalOcean account if needed
# 2. Create App Platform project
# 3. Connect GitHub repository
# 4. Configure environment variables (same as Vercel)
# 5. Select Supabase PostgreSQL for database
# 6. Deploy via DigitalOcean dashboard
# 7. Configure domain DNS
# 8. Set up CI/CD with GitHub Actions
```

---

## Phase F – Internal Dogfooding & MVP Validation (1 hour)

### Full End-to-End Test

```
1. Create Test Tenant
   ✓ Go to https://synthex.social/synthex/onboarding
   ✓ Fill form:
     - Business: "Phill's Test Business"
     - Industry: "Trades & Contracting"
     - Region: "AU"
     - Plan: "Growth"
     - Offer: "Early Founders" (50% off)
     - Brand: "PTB"
     - Domain: "phill-test.com.au"
   ✓ Expected: Redirect to dashboard with tenantId
   ✓ Check DB: synthex_tenants + synthex_plan_subscriptions created

2. Verify Offer Consumption
   ✓ Check synthex_offer_counters:
     SELECT * FROM synthex_offer_counters WHERE tier = 'early_founders';
   ✓ Expected: consumed = 1 (or higher if created before)

3. Create Job 1: Content Batch
   ✓ Click "New Job" in dashboard
   ✓ Select "Content Batch"
   ✓ Count: 5
   ✓ Submit
   ✓ Wait for execution (should take 5-15 seconds)
   ✓ Check: synthex_project_jobs status = 'completed'
   ✓ Check: synthex_job_results has content
   ✓ Verify: Cost was calculated and stored

4. Create Job 2: Email Sequence
   ✓ Click "New Job"
   ✓ Select "Email Sequence"
   ✓ Count: 3
   ✓ Submit
   ✓ Wait for completion
   ✓ Check results in dashboard

5. Create Job 3: SEO Launch
   ✓ Click "New Job"
   ✓ Select "SEO Launch"
   ✓ Target keywords: "trades Brisbane", "electrical services"
   ✓ Submit
   ✓ Wait for completion
   ✓ Check results

6. Verify Founder Portfolio
   ✓ Go to https://synthex.social/founder/synthex-portfolio
   ✓ See "Phill's Test Business" in tenants list
   ✓ Verify health score calculated
   ✓ Verify jobs completed count = 3
   ✓ Verify MRR shows $96.75 (Growth $129 @ 25% = $96.75)

7. Check Costs
   ✓ Verify each job has cost calculated
   ✓ Verify total costs < $2.00 AUD
   ✓ Check Anthropic API usage dashboard

8. Test Plan Upgrade
   ✓ In dashboard, click "Upgrade Plan"
   ✓ Change from Growth to Scale
   ✓ Verify new subscription created
   ✓ Check MRR updated to $299

9. Final Validation
   ✓ All jobs completed successfully
   ✓ Results visible in dashboard
   ✓ Portfolio shows accurate metrics
   ✓ Costs calculated correctly
   ✓ No errors in browser console
   ✓ No errors in server logs
```

### Success Criteria

```
✅ Onboarding complete and smooth
✅ Jobs execute with real Claude API
✅ Content generated is high quality
✅ Results stored and retrievable
✅ Costs tracked accurately
✅ Founder portfolio shows real data
✅ No database errors
✅ No authentication issues
✅ All API routes working
✅ Performance acceptable (<5s per job)
```

---

## Estimated Timeline

| Phase | Hours | Status | Target Date |
|-------|-------|--------|------------|
| A - API Routes | 10 | ✅ Done | Nov 26 |
| B - LLM Wiring | 8 | ✅ Done | Nov 26 |
| C - UI Wiring | 3 | ⏳ Next | Nov 27 morning |
| D - Portfolio | 2 | 🔄 Next | Nov 27 afternoon |
| E - Deployment | 2 | 🔄 Next | Nov 27 evening |
| F - Validation | 1-2 | 🔄 Next | Nov 28 morning |
| **TOTAL** | **28-30** | **92%** | **Nov 28** |

---

## Key Files Summary

**APIs Ready** (Phase A):
- `src/app/api/synthex/tenant/route.ts`
- `src/app/api/synthex/job/route.ts`
- `src/app/api/synthex/offer/route.ts`
- `src/app/api/synthex/billing/route.ts`

**LLM Ready** (Phase B):
- `src/lib/synthex/llmProviderClient.ts`
- Updated `src/lib/synthex/synthexAgiBridge.ts`

**Need Updates** (Phase C):
- `src/app/synthex/onboarding/page.tsx`
- `src/app/synthex/dashboard/page.tsx`
- Create `src/components/synthex/ResultViewer.tsx`

**Database Migration**:
- `supabase/migrations/254_synthex_core_structure.sql`

---

## Support & Debugging

### Common Issues & Solutions

**"Unauthorized" error on API calls**:
```typescript
// Make sure you're passing Authorization header
headers: {
  Authorization: `Bearer ${session.access_token}`,
}
```

**Jobs not executing**:
- Check `synthex_project_jobs` status
- Check server logs for errors
- Verify ANTHROPIC_API_KEY is set
- Check Anthropic API usage limits

**Results not appearing**:
- Check `synthex_job_results` table
- Verify job status = 'completed'
- Check for error_json in results

**Cost calculations wrong**:
- Verify token counts in response
- Check cost formula: `(input/1000) * costPer1k`
- Verify model pricing in llmProviderClient

---

## Resources

- **API Documentation**: See comments in route.ts files
- **LLM Documentation**: See llmProviderClient.ts
- **Database Schema**: supabase/migrations/254_synthex_core_structure.sql
- **Progress Tracking**: SYNTHEX_MVP_PROGRESS.md

---

## Next Action

👉 **Start Phase C**: Update `src/app/synthex/onboarding/page.tsx` to call `/api/synthex/tenant`

Estimated time: 30 minutes for onboarding, then 1 hour for dashboard, then 30 minutes for result viewer.

After Phase C is complete, report back for Phase D validation.

---

**Last Updated**: 2025-11-26
**MVP Target**: 2025-11-28
**Status**: 92% Ready
