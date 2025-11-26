# Synthex.social MVP – Phase F Validation Guide

**Objective**: Complete end-to-end dogfooding and MVP acceptance testing
**Duration**: 1-2 hours
**Target**: Full feature validation before public launch

---

## Phase F - Internal Dogfooding & MVP Validation Checklist

### Test Case 1: Create Test Tenant ✓

**Scenario**: New customer signing up for Synthex

**Steps:**
1. Go to https://synthex.social/synthex/onboarding
2. Fill in business profile:
   - Business Name: "Phill's Test Business"
   - Industry: "Trades & Contracting"
   - Region: "AU"
   - Website: "https://example.com.au"
3. Select plan: "Growth"
4. Select offer: "Early Founders" (50% off - should show in banner)
5. Fill brand setup:
   - Brand Name: "PTB"
   - Primary Domain: "phill-test.com.au"
   - Tagline: "Quality trades for Brisbane"
   - Value Proposition: "Reliable & professional"
6. Click "Activate Account"

**Expected Results:**
- ✅ Form validates inputs
- ✅ Offer tier displays correctly (50% discount)
- ✅ Redirects to dashboard with `?tenantId=...`
- ✅ Tenant created in `synthex_tenants` table
- ✅ Subscription created in `synthex_plan_subscriptions`
- ✅ Offer counter incremented in `synthex_offer_counters`

**Database Verification:**
```sql
-- Check tenant was created
SELECT id, business_name, industry, owner_user_id, status
FROM synthex_tenants
WHERE business_name = 'Phill''s Test Business';

-- Check subscription
SELECT tenant_id, plan_code, effective_price_aud
FROM synthex_plan_subscriptions
WHERE tenant_id = 'YOUR_TENANT_ID';

-- Check offer consumed
SELECT tier, consumed, limit_count
FROM synthex_offer_counters
WHERE tier = 'early_founders';
```

---

### Test Case 2: Verify Offer Consumption ✓

**Scenario**: Confirm that offer slots are properly tracked

**Expected Results:**
- ✅ Early Founders counter shows consumed = 1 (or higher if created before)
- ✅ Limit is 50 slots
- ✅ When slots full, new signups don't get offer

**Verification:**
```sql
SELECT * FROM synthex_offer_counters
WHERE tier = 'early_founders';

-- Expected:
-- tier: early_founders
-- consumed: 1 (or more)
-- limit_count: 50
```

---

### Test Case 3: Create Job 1 - Content Batch ✓

**Scenario**: Generate multiple pieces of marketing content

**Steps:**
1. From dashboard, click "New Job"
2. Select "Content Batch"
3. Enter count: 5
4. Click "Create Job"

**Expected Results:**
- ✅ Modal closes
- ✅ Dashboard refreshes
- ✅ New job appears in jobs list
- ✅ Status shows "pending" → "running" → "completed"

**Wait 5-15 seconds for execution**

**Database Verification:**
```sql
-- Check job was created
SELECT id, job_type, status, created_at
FROM synthex_project_jobs
WHERE tenant_id = 'YOUR_TENANT_ID'
ORDER BY created_at DESC LIMIT 1;

-- Expected: status = 'completed' after waiting

-- Check results were stored
SELECT id, result_type, result_json
FROM synthex_job_results
WHERE job_id = 'YOUR_JOB_ID';

-- Expected: 5+ result rows with generated content
```

**API Validation:**
```bash
# Test job creation API
curl -X POST https://synthex.social/api/synthex/job \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "tenantId": "YOUR_TENANT_ID",
    "jobType": "content_batch",
    "payload": { "count": 5 }
  }'

# Should return: { job: { id, status, ... } }
```

**Cost Verification:**
```sql
-- Check cost was calculated
SELECT
  id,
  job_type,
  execution_cost_aud,
  token_count_input,
  token_count_output
FROM synthex_project_jobs
WHERE id = 'YOUR_JOB_ID';

-- Expected: cost ~$0.10-0.50 for 5 content pieces
```

---

### Test Case 4: Create Job 2 - Email Sequence ✓

**Scenario**: Generate email campaign sequence

**Steps:**
1. Click "New Job"
2. Select "Email Sequence"
3. Enter count: 3
4. Click "Create Job"
5. Wait for completion

**Expected Results:**
- ✅ Job executes successfully
- ✅ Results appear in dashboard
- ✅ Status shows "completed"
- ✅ Can view results

**Verification:**
```sql
SELECT COUNT(*) as email_count
FROM synthex_job_results
WHERE job_id = 'YOUR_EMAIL_JOB_ID';

-- Expected: 3 email results
```

---

### Test Case 5: Create Job 3 - SEO Launch ✓

**Scenario**: Generate SEO strategy and content

**Steps:**
1. Click "New Job"
2. Select "SEO Launch"
3. Enter count: 2
4. Enter keywords: "trades Brisbane, electrical services"
5. Click "Create Job"
6. Wait for completion

**Expected Results:**
- ✅ Job executes with keyword parameters
- ✅ Results contain SEO-optimized content
- ✅ Task completes within 30 seconds

---

### Test Case 6: Verify Job Results Display ✓

**Scenario**: Results are accessible and downloadable

**From Dashboard:**
1. Click "Results" tab
2. Should see 3+ job results

**For Each Result:**
- ✅ Can see result preview
- ✅ Can copy to clipboard
- ✅ Can download as JSON

**Test Copy:**
1. Click "Copy" on a result
2. "Copied" notification appears
3. Paste in text editor - JSON content appears

**Test Download:**
1. Click "Download"
2. JSON file downloads: `result-{jobId}-{type}.json`
3. Open file - valid JSON structure

---

### Test Case 7: Verify Founder Portfolio ✓

**Scenario**: Founder can see all tenant metrics

**Steps:**
1. Go to https://synthex.social/founder/synthex-portfolio
2. Should see "Phill's Test Business" in list
3. Verify metrics display:
   - Health Score: should be 70-90 (3 completed jobs)
   - Jobs: 3/3 completed
   - Monthly Revenue: should show $96.75 (Growth plan @ 25% discount)
   - Churn Risk: should be "low"

**Expected Results:**
- ✅ Portfolio displays created tenant
- ✅ Health score calculated from actual jobs
- ✅ Completion rate shows 100% (3/3)
- ✅ Monthly revenue calculated correctly

**Formula Verification:**
```
Growth Plan Base: $129/month
Early Founders Discount: -25%
Effective Price: $129 * 0.75 = $96.75 ✓
```

**Database Check:**
```sql
SELECT id, health_score, jobs_completed, monthly_revenue
FROM (
  SELECT
    t.id,
    (SELECT COUNT(*) FROM synthex_project_jobs
     WHERE tenant_id = t.id AND status = 'completed') as jobs_completed,
    (SELECT COUNT(*) FROM synthex_project_jobs
     WHERE tenant_id = t.id) as jobs_total
  FROM synthex_tenants t
  WHERE t.business_name = 'Phill''s Test Business'
);
```

---

### Test Case 8: Test Plan Upgrade ✓

**Scenario**: Customer upgrades from Growth to Scale

**Steps:**
1. From dashboard, click "Upgrade Plan"
2. Select "Scale" plan
3. Confirm upgrade

**Expected Results:**
- ✅ New subscription created
- ✅ Effective price updated to $299
- ✅ Dashboard shows new plan
- ✅ Founder portfolio shows updated MRR

**Database Verification:**
```sql
SELECT plan_code, effective_price_aud, billing_status
FROM synthex_plan_subscriptions
WHERE tenant_id = 'YOUR_TENANT_ID'
ORDER BY created_at DESC;

-- Expected latest: plan_code = 'scale', price = 299
```

---

### Test Case 9: Check Cost Calculations ✓

**Scenario**: Verify Claude API costs are accurate

**Expected Costs (Rough):**
- Content Batch (5): ~$0.15
- Email Sequence (3): ~$0.10
- SEO Launch (2): ~$0.12
- **Total**: ~$0.37 (well under $2.00 budget)

**Verification:**
```sql
SELECT
  SUM(execution_cost_aud) as total_cost,
  COUNT(*) as job_count,
  AVG(execution_cost_aud) as avg_cost_per_job
FROM synthex_project_jobs
WHERE tenant_id = 'YOUR_TENANT_ID';

-- Expected total < $2.00
-- Expected avg per job < $0.50
```

**Token Count Verification:**
```sql
SELECT
  job_type,
  token_count_input,
  token_count_output,
  execution_cost_aud
FROM synthex_project_jobs
WHERE tenant_id = 'YOUR_TENANT_ID'
ORDER BY created_at DESC;

-- Verify cost = (input/1000)*inputPrice + (output/1000)*outputPrice
```

---

### Test Case 10: Performance Validation ✓

**Scenario**: Verify API response times are acceptable

**Expected Performance:**
- API endpoints: < 500ms
- Job creation: < 1 second
- Dashboard load: < 3 seconds
- Job execution: < 30 seconds

**Test with Browser DevTools:**
1. Open Chrome DevTools (F12)
2. Go to Network tab
3. Perform actions:
   - Create job
   - Load dashboard
   - Load portfolio
4. Check timing for each request

**Verification Checklist:**
- ✅ API requests under 500ms
- ✅ Dashboard renders in < 3 seconds
- ✅ Jobs complete in < 30 seconds
- ✅ No 5xx errors in logs

---

## Final Validation Checklist

### Core Features
- [ ] User authentication (Google OAuth)
- [ ] Onboarding flow
- [ ] Offer tier selection & display
- [ ] Tenant creation
- [ ] Subscription creation
- [ ] Plan selection

### Job Execution
- [ ] Content batch generation
- [ ] Email sequence generation
- [ ] SEO launch generation
- [ ] Job status tracking (pending → completed)
- [ ] Results stored in database
- [ ] Cost calculation

### Dashboard
- [ ] Jobs list displays
- [ ] Usage stats calculated
- [ ] Results viewable
- [ ] Copy/download functionality
- [ ] Plan upgrade option

### Founder Portfolio
- [ ] All tenants visible
- [ ] Health score calculation
- [ ] Revenue display
- [ ] Churn risk assessment
- [ ] Quick actions work

### API & Database
- [ ] All endpoints responding
- [ ] Database queries returning correct data
- [ ] RLS policies enforced
- [ ] No 401 errors
- [ ] No 5xx errors

### Performance
- [ ] API < 500ms
- [ ] Dashboard < 3s
- [ ] Jobs complete < 30s
- [ ] No timeout errors

### Security
- [ ] OAuth tokens required
- [ ] RLS policies active
- [ ] No data leaks between tenants
- [ ] API keys not exposed
- [ ] HTTPS enforced

---

## Success Criteria

✅ **All** test cases pass
✅ **No** critical bugs found
✅ **Performance** meets targets
✅ **Database** integrity verified
✅ **Cost** tracking accurate
✅ **Security** validated
✅ **User experience** smooth

---

## Post-Validation Actions

### If All Tests Pass ✅
1. Mark MVP as ready
2. Plan soft launch (5-10 customers)
3. Set up monitoring
4. Create customer support docs
5. Begin marketing campaign

### If Issues Found ❌
1. Log issue with reproduction steps
2. Priority P0 (blocks launch): Fix immediately
3. Priority P1 (important): Fix before soft launch
4. Priority P2 (nice-to-have): Backlog for V2

---

## Estimated Test Duration

| Test Case | Duration |
|-----------|----------|
| Test Case 1: Create Tenant | 5 min |
| Test Case 2: Verify Offers | 2 min |
| Test Case 3: Content Batch | 10 min (5 min wait) |
| Test Case 4: Email Sequence | 10 min (5 min wait) |
| Test Case 5: SEO Launch | 10 min (5 min wait) |
| Test Case 6: Results Display | 5 min |
| Test Case 7: Portfolio | 5 min |
| Test Case 8: Plan Upgrade | 5 min |
| Test Case 9: Cost Checks | 5 min |
| Test Case 10: Performance | 5 min |
| **Total** | **~60 minutes** |

---

## Resources & References

- Dashboard: https://synthex.social/synthex/dashboard
- Onboarding: https://synthex.social/synthex/onboarding
- Portfolio: https://synthex.social/founder/synthex-portfolio
- Logs (Vercel): https://vercel.com/projects
- Logs (DigitalOcean): DigitalOcean App Platform
- Database: Supabase Dashboard

---

## Sign-Off

**Phase F Validation Complete**: __________________ (Date)

**Tester Name**: __________________ (Name)

**Issues Found**: _________ (Number of issues)

**Critical Issues**: _________ (Number blocking launch)

**Ready for Launch**: ☐ Yes ☐ No

---

**Last Updated**: 2025-11-26
**Target Completion**: Day 2 morning
**MVP Status**: Ready for Phase F validation
