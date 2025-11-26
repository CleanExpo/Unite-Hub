# SEMRush Integration - Implementation Checklist

**Status**: Ready for Implementation
**Est. Time**: 4-7 hours
**Complexity**: Medium
**Priority**: High (SEO Intelligence for synthex.social)

---

## Prerequisites

- [x] SEMRush API key obtained
- [x] `.env.local` updated with `SEMRUSH_API_KEY`
- [x] Vercel environment variables updated
- [ ] Team aware of 10 req/sec rate limit
- [ ] Caching strategy approved
- [ ] Test/Live mode switching planned

---

## Phase 1: Database Setup (30 minutes)

### Task 1.1: Create Migration File
- [ ] Create `supabase/migrations/261_seo_providers.sql`
- [ ] Include:
  - `seo_providers` table with provider, enabled, api_key, test_mode
  - RLS policies for admin-only access
  - Default rows for DataForSEO and SEMRush
- [ ] Verify syntax before running

### Task 1.2: Run Migration
- [ ] Go to Supabase Dashboard
- [ ] Copy migration 261 content
- [ ] Paste into SQL Editor
- [ ] Click "Run"
- [ ] Verify tables created:
  ```sql
  SELECT * FROM seo_providers;
  ```

### Task 1.3: Verify RLS Policies
- [ ] Check policies created
- [ ] Test admin-only access
- [ ] Confirm non-admin users blocked

---

## Phase 2: Backend Implementation (2-3 hours)

### Task 2.1: Create SEMRush Client
- [ ] File: `src/lib/seo/semrushClient.ts`
- [ ] Implement:
  - [x] `querySemrushKeywordDifficulty()` - Keyword KDI data
  - [x] `querySemrushDomainOverview()` - Domain metrics
  - [x] `querySemrushRelatedKeywords()` - Keyword suggestions
- [ ] Add rate limiting queue (PQueue)
- [ ] Add error handling
- [ ] Test locally with sample queries

**Checklist**:
- [ ] Imports correct (axios, getSystemMode, getProviderSettings)
- [ ] Rate limiting queue configured (8 concurrent, 1 sec window)
- [ ] CSV parsing working correctly
- [ ] Returns proper TypeScript interfaces
- [ ] Error handling doesn't break pipeline

### Task 2.2: Update SEO Intelligence Engine
- [ ] File: `src/lib/seo/seoIntelligenceEngine.ts`
- [ ] Implement:
  - [x] `runSeoAnalysis()` - Unified query function
  - [x] Merge DataForSEO + SEMRush results
  - [x] Calculate reliability score
- [ ] Add result merging logic
- [ ] Set reliability: high (2 sources), medium (1), low (0)

**Checklist**:
- [ ] Supports both providers
- [ ] Graceful fallback if one fails
- [ ] Returns consistent interface
- [ ] Timestamp included in result
- [ ] Reliability score calculated

### Task 2.3: Create Provider Settings Manager
- [ ] File: `src/lib/seo/getProviderSettings.ts`
- [ ] Implement:
  - [x] `getProviderSettings()` - Fetch from DB
  - [x] `updateProviderSettings()` - Update config
- [ ] Add error handling
- [ ] Cache settings (optional)

**Checklist**:
- [ ] Connects to Supabase properly
- [ ] Returns correct interface
- [ ] Handles missing API keys gracefully
- [ ] Error doesn't crash application

### Task 2.4: Implement Caching (Optional but Recommended)
- [ ] File: `src/lib/seo/seoCache.ts`
- [ ] Implement:
  - [ ] In-memory cache with 24-hour TTL
  - [ ] Cache key: `${keyword}:${domain}:${provider}`
  - [ ] Auto-expire old entries
- [ ] Use optional cache in main queries

**Checklist**:
- [ ] TTL is 24 hours for SEO data
- [ ] Cache key includes all parameters
- [ ] Expired entries removed
- [ ] Cache size doesn't grow unbounded

---

## Phase 3: API Route Implementation (1 hour)

### Task 3.1: Create SEO Analysis Endpoint
- [ ] File: `src/app/api/seo/analyze/route.ts`
- [ ] Implement POST endpoint:
  - [x] Accept: keyword, domain, userId
  - [x] Verify user is admin (RBAC)
  - [x] Call `runSeoAnalysis()`
  - [x] Return merged results with both providers

**Checklist**:
- [ ] Route path: `/api/seo/analyze`
- [ ] POST method only
- [ ] Validates required parameters
- [ ] Checks admin RBAC
- [ ] Returns proper error codes
  - 400: Missing params
  - 403: Non-admin user
  - 500: Query failed
- [ ] Logs errors to console
- [ ] Includes timestamp in response

### Task 3.2: Add Error Handling
- [ ] Try/catch blocks on all queries
- [ ] Log errors with context
- [ ] Return meaningful error messages
- [ ] Don't expose API keys in logs

**Checklist**:
- [ ] All fetch failures caught
- [ ] Error messages user-friendly
- [ ] No sensitive data in logs
- [ ] Rate limit errors handled

### Task 3.3: Test Endpoint
- [ ] Use Postman or Thunder Client
- [ ] Test with valid keyword/domain
- [ ] Test with invalid parameters
- [ ] Test with non-admin user
- [ ] Verify response structure

**Checklist**:
- [ ] Valid request returns 200
- [ ] Missing params return 400
- [ ] Non-admin returns 403
- [ ] Both provider sources populated
- [ ] Reliability score calculated

---

## Phase 4: Frontend Integration (1-2 hours)

### Task 4.1: Create SEO Analysis Component
- [ ] File: `src/components/seo/SeoAnalysisPanel.tsx`
- [ ] Include:
  - [ ] Input fields: keyword, domain
  - [ ] "Analyze" button
  - [ ] Loading state
  - [ ] Result display (difficulty, volume, etc.)
  - [ ] Provider attribution (which source returned data)
  - [ ] Reliability indicator

**Checklist**:
- [ ] User can enter keyword and domain
- [ ] Loading spinner while analyzing
- [ ] Results show difficulty, volume, competitors
- [ ] Shows which provider returned data
- [ ] Handles errors gracefully
- [ ] Responsive design

### Task 4.2: Integrate into Dashboard
- [ ] File: `src/app/synthex/dashboard/page.tsx`
- [ ] Add:
  - [ ] SEO analysis section
  - [ ] Quick keyword research widget
  - [ ] Competitor analysis widget
- [ ] Position prominently

**Checklist**:
- [ ] Component renders without errors
- [ ] Can trigger SEO analysis
- [ ] Results display properly
- [ ] Mobile responsive

### Task 4.3: Create Settings Page
- [ ] File: `src/app/crm/admin/seo-providers/page.tsx`
- [ ] Admin controls:
  - [ ] Toggle provider enabled/disabled
  - [ ] Manual test button for each provider
  - [ ] Show last test status
  - [ ] Show last test time
  - [ ] Copy API key for verification

**Checklist**:
- [ ] Can enable/disable providers
- [ ] Test button works
- [ ] Shows test status and time
- [ ] Admin-only access enforced
- [ ] Changes persist to database

---

## Phase 5: Testing & Verification (1-2 hours)

### Task 5.1: Local Testing
- [ ] Test with various keywords
- [ ] Test with different domains
- [ ] Verify keyword difficulty scores reasonable
- [ ] Verify volume numbers match industry standards
- [ ] Check rate limiting works

**Test Cases**:
- [ ] Keyword: "web design" (high volume, high difficulty)
- [ ] Keyword: "web design Brisbane" (medium, location-specific)
- [ ] Keyword: "custom web design consultation" (low volume, niche)
- [ ] Domain: competitor.com.au
- [ ] Domain: www.synthex.social

### Task 5.2: Error Scenario Testing
- [ ] Invalid API key → graceful error
- [ ] Network timeout → retry or fallback
- [ ] Rate limit hit → queue backoff
- [ ] Missing provider → use other source
- [ ] Both providers fail → return helpful error

**Checklist**:
- [ ] Invalid key shows "API key configuration error"
- [ ] Timeout shows "Please try again"
- [ ] Rate limit gracefully queues
- [ ] Single provider failure doesn't break app
- [ ] Both fail shows "Analysis unavailable, try later"

### Task 5.3: Performance Testing
- [ ] First query takes <2 seconds
- [ ] Cached query takes <100ms
- [ ] 10 concurrent requests don't exceed rate limit
- [ ] Queue properly manages requests

**Checklist**:
- [ ] Fresh query: < 2000ms
- [ ] Cached query: < 100ms
- [ ] Rate limiting prevents 429 errors
- [ ] Queue doesn't drop requests

### Task 5.4: Integration Testing
- [ ] Admin can access SEO analysis
- [ ] Non-admin cannot access
- [ ] Results saved to audit log
- [ ] Cache entries created
- [ ] Multiple providers return same keyword data

---

## Phase 6: Monitoring & Deployment (Ongoing)

### Task 6.1: Add Monitoring
- [ ] Log all SEO queries to audit table
- [ ] Track API usage and costs
- [ ] Monitor error rates
- [ ] Set up alerts for rate limit issues

**Checklist**:
- [ ] Audit log records all queries
- [ ] Success/failure tracked
- [ ] Error messages logged
- [ ] API units used recorded (if available)

### Task 6.2: Set Up Alerting
- [ ] Alert if rate limit exceeded 5 times/hour
- [ ] Alert if API key invalid
- [ ] Alert if both providers offline

### Task 6.3: Deploy to Vercel
- [ ] Commit all changes
- [ ] Push to main branch
- [ ] Verify build succeeds
- [ ] Test in staging environment
- [ ] Promote to production

**Checklist**:
- [ ] All files committed
- [ ] No TypeScript errors
- [ ] Environment variables set in Vercel
- [ ] Staging tests pass
- [ ] Production deploy successful

### Task 6.4: Post-Deployment Verification
- [ ] Test SEO analysis in production
- [ ] Monitor error logs for 24 hours
- [ ] Check API key usage
- [ ] Verify caching working
- [ ] Get user feedback

---

## Files to Create/Modify

### New Files to Create
```
src/lib/seo/semrushClient.ts                     (200 lines)
src/lib/seo/seoIntelligenceEngine.ts             (100 lines)
src/lib/seo/getProviderSettings.ts               (50 lines)
src/components/seo/SeoAnalysisPanel.tsx          (300 lines)
src/app/api/seo/analyze/route.ts                 (50 lines)
src/app/crm/admin/seo-providers/page.tsx         (200 lines)
supabase/migrations/261_seo_providers.sql        (80 lines)
```

### Files to Modify
```
src/app/synthex/dashboard/page.tsx               (Add SEO widget)
.env.local                                        (Add SEMRUSH_API_KEY, SYSTEM_MODE)
```

### Documentation
```
SEMRUSH_INTEGRATION_GUIDE.md                     (This file)
SEMRUSH_IMPLEMENTATION_CHECKLIST.md              (This checklist)
```

---

## Success Criteria

✅ SEO Analysis working:
- [ ] Can analyze any keyword
- [ ] Returns difficulty, volume, competitors
- [ ] Shows data source attribution
- [ ] Works with multiple domains

✅ Admin interface functional:
- [ ] Can view provider settings
- [ ] Can enable/disable providers
- [ ] Can test connections
- [ ] Can see last test status

✅ Rate limiting working:
- [ ] No 429 errors in normal usage
- [ ] Concurrent requests handled
- [ ] Queue manages spike traffic

✅ Caching efficient:
- [ ] Repeated queries fast (<100ms)
- [ ] Cache expires after 24 hours
- [ ] Cache doesn't grow unbounded

✅ Error handling robust:
- [ ] Invalid API key handled
- [ ] Network failures don't crash app
- [ ] User gets helpful error messages
- [ ] Audit logs all failures

✅ Security verified:
- [ ] Non-admins cannot access settings
- [ ] API keys not exposed in logs
- [ ] RLS policies enforce access control
- [ ] Audit trail complete

---

## Deployment Rollout

### Stage 1: Feature Flag (Optional)
- [ ] Deploy code with feature flag disabled
- [ ] Test in production with flag on
- [ ] Monitor for 24 hours
- [ ] Enable for all users

### Stage 2: Gradual Rollout
- [ ] Enable for 10% of admins
- [ ] Monitor usage and errors
- [ ] Expand to 50% of admins
- [ ] Full rollout

### Stage 3: Monitor & Optimize
- [ ] Track API usage vs costs
- [ ] Optimize cache hit rate
- [ ] Fine-tune rate limiting
- [ ] Gather user feedback

---

## Rollback Plan

If issues arise:

1. **Disable Feature**: Set feature flag to false
2. **Revert Code**: `git revert <commit>`
3. **Redeploy**: Push to main
4. **Monitor**: Check error rates drop

Rollback time: ~5 minutes

---

## Approval & Sign-Off

- [ ] Backend implementation reviewed
- [ ] Frontend implementation reviewed
- [ ] Testing completed and verified
- [ ] Security review passed
- [ ] Performance benchmarks met
- [ ] Ready for production deployment

**Reviewer**: _______________
**Date**: _______________

---

## Next Steps After Implementation

1. **Add more providers** (Ahrefs, Moz, etc.)
2. **Build reporting** (CSV export, Google Docs)
3. **Add scheduling** (Daily keyword tracking)
4. **Create automation** (Auto-generate content ideas)
5. **Expand to all domains** (Not just synthex.social)

---

**Status**: Ready to begin
**Est. Completion**: 4-7 hours of development
**Difficulty**: Medium
**Impact**: High (enables SEO intelligence for platform)

---

Generated: 2025-11-26
