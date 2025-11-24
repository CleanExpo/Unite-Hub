# AIDO 2026 - Finalized Testing Tasks

**Status**: ✅ Ready to Execute  
**Last Updated**: 2025-11-25  
**Est. Total Time**: 5-7 hours  
**Current Completion**: 98% (testing phase required)

---

## 🎯 Quick Start

```bash
# 1. Health check (30 seconds)
npm run test:aido:quick

# 2. Start server
npm run dev

# 3. Login
# Open: http://localhost:3008/login

# 4. Run automated tests (2-3 min)
npm run test:aido
```

---

## ✅ PHASE 1: IMMEDIATE SETUP (30 Minutes)

### Task 1.1: System Health Check
**Time**: 30 seconds  
**Priority**: Critical

- [ ] Run command: `npm run test:aido:quick`
- [ ] Review output for warnings/errors
- [ ] Verify all dashboards return 200 status
- [ ] Confirm environment variables are set

**Expected Result**: All checks pass, no critical errors

**If Failures**:
- Missing env vars → Add to `.env.local`
- Server not running → Run `npm run dev`
- Dashboard 404s → Check routes exist

---

### Task 1.2: Development Server
**Time**: 2 minutes  
**Priority**: Critical

- [ ] Start dev server: `npm run dev`
- [ ] Wait for "Ready on http://localhost:3008"
- [ ] Open http://localhost:3008 in browser
- [ ] Verify homepage loads without errors
- [ ] Check browser console for errors (F12)

**Expected Result**: Server starts on port 3008, homepage loads

---

### Task 1.3: Authentication Setup
**Time**: 2 minutes  
**Priority**: Critical

- [ ] Navigate to: http://localhost:3008/login
- [ ] Login with test credentials
- [ ] Verify redirect to dashboard
- [ ] Check session cookie exists (DevTools > Application > Cookies)
- [ ] Note workspaceId for API tests

**Expected Result**: Successful login, redirect to /dashboard

---

## 🔥 PHASE 2: AUTOMATED TESTING (15 Minutes)

### Task 2.1: API Test Suite
**Time**: 3 minutes  
**Priority**: High

- [ ] Ensure logged in at http://localhost:3008/login
- [ ] Run: `npm run test:aido`
- [ ] Wait for all tests to complete
- [ ] Review test results summary
- [ ] Note pass/fail count

**Expected Result**: 19+ of 20 tests pass (>95%)

**Test Coverage**:
- Client Profiles: 4 endpoints
- Onboarding Intelligence: 1 endpoint
- Content Generation: 3 endpoints
- Audience Personas: 2 endpoints
- Content Strategy: 2 endpoints
- Intelligence Reports: 2 endpoints
- OAuth Integrations: 6 endpoints
- Analytics: 2 endpoints

**If Failures**:
- [ ] Document which endpoint failed
- [ ] Note error message
- [ ] Check server logs
- [ ] Screenshot error response

---

### Task 2.2: Results Documentation
**Time**: 5 minutes  
**Priority**: High

- [ ] Create file: `test-results-$(date).txt`
- [ ] Copy test output to file
- [ ] Calculate pass rate: (passed / total) × 100
- [ ] Note any critical failures
- [ ] List non-critical warnings

**Pass Rate Assessment**:
- 95-100%: ✅ Production ready
- 85-94%: ⚠️ Minor fixes needed
- <85%: ❌ Critical issues, block production

---

## 📱 PHASE 3: DASHBOARD TESTING (45-60 Minutes)

### Task 3.1: Overview Dashboard
**Time**: 5 minutes  
**URL**: http://localhost:3008/dashboard/aido/overview

- [ ] Page loads in <2 seconds
- [ ] Header renders correctly
- [ ] Stats cards display (Clients, Campaigns, Content, Health)
- [ ] Charts render (if data exists)
- [ ] Navigation links work
- [ ] No console errors (F12)

**Screenshot**: Take if any errors

---

### Task 3.2: Onboarding Dashboard
**Time**: 10 minutes  
**URL**: http://localhost:3008/dashboard/aido/onboarding

**Step 1 - Business Profile**:
- [ ] All input fields render (businessName, industry, services, etc.)
- [ ] Required field validation works (try "Next" with empty fields)
- [ ] Can enter data and proceed to Step 2

**Step 2 - Authority Figure**:
- [ ] All input fields render (fullName, role, yearsExperience, etc.)
- [ ] "Back" button returns to Step 1
- [ ] Required field validation works
- [ ] Can proceed to Step 3

**Step 3 - OAuth Integrations**:
- [ ] Three cards display (GSC, GBP, GA4)
- [ ] Each has "Connect" button
- [ ] "Skip" or "Generate Intelligence" button visible

**Test Data** (use this):
```
Business Profile:
- Name: Test Balustrades Co
- Industry: Construction
- Services: Stainless steel balustrades, Glass railings
- Years: 15
- Location: Brisbane, Australia
- Website: https://test-balustrades.com

Authority Figure:
- Name: John Smith
- Role: CEO & Founder
- Experience: 20
- LinkedIn: https://linkedin.com/in/johnsmith
- Credentials: Licensed Builder, AS1170 Certified
```

---

### Task 3.3: Clients Dashboard
**Time**: 5 minutes  
**URL**: http://localhost:3008/dashboard/aido/clients

- [ ] Page loads successfully
- [ ] Client list displays (or "No clients" message)
- [ ] Search bar functional
- [ ] Filter dropdowns work (if present)
- [ ] "New Client" button redirects to onboarding
- [ ] Each client card shows: name, industry, status

---

### Task 3.4: Content Dashboard
**Time**: 5 minutes  
**URL**: http://localhost:3008/dashboard/aido/content

- [ ] Page loads successfully
- [ ] Content list displays
- [ ] Filter by type works (email, blog, social)
- [ ] Search functionality works
- [ ] "Generate New Content" button present
- [ ] Each draft card shows: title, type, client, date

---

### Task 3.5: Analytics Dashboard
**Time**: 5 minutes  
**URL**: http://localhost:3008/dashboard/aido/analytics

- [ ] Page loads successfully
- [ ] Charts/graphs render
- [ ] Date range selector works
- [ ] Metric cards show totals
- [ ] Cost tracking displays
- [ ] Usage metrics display

---

### Task 3.6: Settings Dashboard
**Time**: 5 minutes  
**URL**: http://localhost:3008/dashboard/aido/settings

- [ ] Page loads successfully
- [ ] All settings sections render
- [ ] OAuth connections section shows status
- [ ] AI settings display
- [ ] "Save Changes" button works
- [ ] Success notification appears on save

---

## 🔐 PHASE 4: OAUTH INTEGRATION TESTING (60 Minutes)

### Task 4.1: Google Search Console OAuth
**Time**: 10 minutes

**Prerequisites**:
- [ ] `GOOGLE_CLIENT_ID` in `.env.local`
- [ ] `GOOGLE_CLIENT_SECRET` in `.env.local`
- [ ] `NEXT_PUBLIC_APP_URL=http://localhost:3008` in `.env.local`

**Test Steps**:
1. [ ] Navigate to onboarding Step 3
2. [ ] Click "Connect" on Google Search Console card
3. [ ] Verify redirect to Google consent screen
4. [ ] Grant all requested permissions
5. [ ] Verify redirect back to onboarding
6. [ ] Check "Connected" badge appears on GSC card
7. [ ] Open browser DevTools → Console
8. [ ] Verify no errors logged

**Database Verification**:
```sql
-- Check token was stored
SELECT * FROM oauth_tokens 
WHERE provider = 'google_search_console' 
ORDER BY created_at DESC LIMIT 1;
```

**Expected Result**: Token stored, expires_at set, refresh_token present

---

### Task 4.2: Google Business Profile OAuth
**Time**: 10 minutes

- [ ] Click "Connect" on Google Business Profile card
- [ ] Complete OAuth consent flow
- [ ] Verify "Connected" badge appears
- [ ] Check database for stored token:
  ```sql
  SELECT * FROM oauth_tokens 
  WHERE provider = 'google_business_profile' 
  ORDER BY created_at DESC LIMIT 1;
  ```

**Note**: After connection, manually add to token metadata:
```sql
UPDATE oauth_tokens 
SET metadata = jsonb_set(metadata, '{accountId}', '"YOUR_ACCOUNT_ID"')
WHERE provider = 'google_business_profile';

UPDATE oauth_tokens 
SET metadata = jsonb_set(metadata, '{locationId}', '"YOUR_LOCATION_ID"')
WHERE provider = 'google_business_profile';
```

---

### Task 4.3: Google Analytics 4 OAuth
**Time**: 10 minutes

- [ ] Click "Connect" on Google Analytics 4 card
- [ ] Complete OAuth consent flow
- [ ] Verify "Connected" badge appears
- [ ] Check database for stored token:
  ```sql
  SELECT * FROM oauth_tokens 
  WHERE provider = 'google_analytics_4' 
  ORDER BY created_at DESC LIMIT 1;
  ```

**Note**: After connection, manually add to token metadata:
```sql
UPDATE oauth_tokens 
SET metadata = jsonb_set(metadata, '{propertyId}', '"YOUR_PROPERTY_ID"')
WHERE provider = 'google_analytics_4';
```

---

### Task 4.4: Intelligence Generation with OAuth
**Time**: 30 minutes

**Prerequisites**:
- [ ] All 3 OAuth connections complete
- [ ] Location/Property IDs added to metadata (if available)
- [ ] Business profile and authority figure data filled

**Test Steps**:
1. [ ] Click "Generate Intelligence" button
2. [ ] Observe loading spinner (should appear)
3. [ ] Wait 30-60 seconds for generation
4. [ ] Open browser console (F12)
5. [ ] Look for logs:
   - "✅ Fetched X GSC queries"
   - "✅ Fetched X GBP questions"
   - "✅ Fetched GA4 demographics"
6. [ ] Verify success alert appears
7. [ ] Verify redirect to /dashboard/aido/overview
8. [ ] Navigate to clients dashboard
9. [ ] Verify new client appears in list

**Check Generated Intelligence**:
```sql
-- View generated data
SELECT * FROM aido_clients 
WHERE workspace_id = 'YOUR_WORKSPACE_ID' 
ORDER BY created_at DESC LIMIT 1;

-- Check personas (should reflect real search data)
SELECT * FROM aido_personas 
WHERE client_id = 'NEW_CLIENT_ID';
```

**Expected Results**:
- Generation completes in <90 seconds
- Cost: ~$1.50-2.50
- 3-5 personas generated
- Personas reference real search queries/questions
- Content strategy includes real user questions
- No errors in console

**Cost Verification**:
- [ ] Check Anthropic dashboard for API usage
- [ ] Verify cost is within expected range ($1.50-2.50)
- [ ] Note token usage (input + output)

---

## 🎨 PHASE 5: END-TO-END USER JOURNEYS (60 Minutes)

### Journey 5.1: Complete Onboarding Flow
**Time**: 20 minutes

- [ ] Start fresh onboarding flow
- [ ] Fill Step 1 with test data (from Task 3.2)
- [ ] Fill Step 2 with authority data
- [ ] Connect all 3 OAuth providers
- [ ] Generate intelligence
- [ ] Verify success and redirect
- [ ] Check client appears in list
- [ ] Review generated personas for quality

**Quality Checks**:
- [ ] Personas have unique names (not generic)
- [ ] Pain points are specific to industry
- [ ] Goals align with business type
- [ ] Preferred content types make sense
- [ ] Demographics reflect actual data (if OAuth connected)

---

### Journey 5.2: Content Generation Flow
**Time**: 20 minutes

**Email Content**:
- [ ] Navigate to /dashboard/aido/content
- [ ] Click "Generate New Content"
- [ ] Select content type: Email
- [ ] Choose client from dropdown
- [ ] Enter topic: "New service announcement"
- [ ] Click "Generate"
- [ ] Wait 15-45 seconds
- [ ] Review generated email
- [ ] Verify subject line is compelling
- [ ] Verify body is personalized to client
- [ ] Test "Copy to Clipboard" button

**Blog Post**:
- [ ] Generate blog post on topic: "Industry best practices"
- [ ] Verify length: 1000+ words
- [ ] Check for: title, introduction, H2 sections, conclusion
- [ ] Verify tone matches business type

**Social Media**:
- [ ] Generate social media post
- [ ] Verify platform-specific formatting
- [ ] Check character count (appropriate for platform)
- [ ] Verify hashtags are relevant

---

### Journey 5.3: Multi-Client Management
**Time**: 20 minutes

- [ ] Create second test client via onboarding
- [ ] Generate content for Client A
- [ ] Generate content for Client B
- [ ] Navigate to Clients dashboard
- [ ] Verify both clients listed separately
- [ ] Click into Client A details
- [ ] Verify only Client A content shows
- [ ] Check personas don't mix between clients
- [ ] Verify analytics separates clients

**Workspace Isolation Test**:
```sql
-- Verify RLS is working
SELECT c.id, c.business_name, c.workspace_id 
FROM aido_clients c 
WHERE c.workspace_id = 'YOUR_WORKSPACE_ID';

-- Should only return clients for your workspace
```

---

## ⚠️ PHASE 6: ERROR HANDLING TESTING (30 Minutes)

### Test 6.1: Missing OAuth Token
**Time**: 5 minutes

- [ ] Start new onboarding (don't connect OAuth)
- [ ] Generate intelligence without OAuth
- [ ] Verify generation still completes
- [ ] Check personas are generic (not data-driven)
- [ ] Confirm no errors thrown

**Expected**: Graceful fallback, warning logged

---

### Test 6.2: Invalid OAuth Token
**Time**: 5 minutes

```sql
-- Manually expire a token
UPDATE oauth_tokens 
SET expires_at = NOW() - INTERVAL '1 hour'
WHERE provider = 'google_search_console';
```

- [ ] Trigger intelligence generation
- [ ] Observe console logs
- [ ] Verify system attempts token refresh
- [ ] Check if new access_token obtained
- [ ] Verify generation continues

**Expected**: Automatic token refresh, no user intervention

---

### Test 6.3: API Rate Limit
**Time**: 5 minutes

- [ ] Generate intelligence 3 times rapidly
- [ ] Observe rate limit handling
- [ ] Check for retry logic
- [ ] Verify error messages are clear

**Expected**: Exponential backoff, clear error messages

---

### Test 6.4: Incomplete Form Data
**Time**: 5 minutes

- [ ] Start onboarding
- [ ] Leave required fields empty
- [ ] Try to proceed to next step
- [ ] Verify validation errors appear
- [ ] Check error messages are helpful
- [ ] Fill fields and verify can proceed

**Expected**: Clear validation errors, highlighted fields

---

### Test 6.5: Network Failures
**Time**: 5 minutes

- [ ] Disconnect internet
- [ ] Try to generate intelligence
- [ ] Verify graceful error handling
- [ ] Check error message is user-friendly
- [ ] Reconnect and retry
- [ ] Verify successful generation

**Expected**: Network error message, ability to retry

---

## 📊 PHASE 7: TESTING REPORT (30 Minutes)

### Task 7.1: Compile Test Results
**Time**: 15 minutes

Create file: `AIDO_TESTING_REPORT_$(date +%Y%m%d).md`

```markdown
# AIDO 2026 Testing Report

**Date**: [FILL IN]
**Tester**: [YOUR NAME]
**Environment**: Development (localhost:3008)
**Duration**: [FILL IN]

## Executive Summary

**Overall Pass Rate**: [X/Y tests passed] = [Z%]
**Status**: ✅ READY / ⚠️ NEEDS FIXES / ❌ BLOCKED

## Test Results by Phase

### Phase 1: Setup (3 tests)
- System health check: ✅ PASS / ❌ FAIL
- Dev server start: ✅ PASS / ❌ FAIL
- Authentication: ✅ PASS / ❌ FAIL

### Phase 2: Automated Testing (20+ tests)
- Pass rate: [X/20]
- Failed tests: [list]
- Critical failures: [list]

### Phase 3: Dashboard Testing (6 dashboards)
- Overview: ✅ PASS / ❌ FAIL
- Onboarding: ✅ PASS / ❌ FAIL
- Clients: ✅ PASS / ❌ FAIL
- Content: ✅ PASS / ❌ FAIL
- Analytics: ✅ PASS / ❌ FAIL
- Settings: ✅ PASS / ❌ FAIL

### Phase 4: OAuth Integration (4 tests)
- GSC OAuth: ✅ PASS / ❌ FAIL
- GBP OAuth: ✅ PASS / ❌ FAIL
- GA4 OAuth: ✅ PASS / ❌ FAIL
- Intelligence Generation: ✅ PASS / ❌ FAIL

### Phase 5: User Journeys (3 journeys)
- Complete onboarding: ✅ PASS / ❌ FAIL
- Content generation: ✅ PASS / ❌ FAIL
- Multi-client: ✅ PASS / ❌ FAIL

### Phase 6: Error Handling (5 scenarios)
- Missing OAuth: ✅ PASS / ❌ FAIL
- Invalid token: ✅ PASS / ❌ FAIL
- Rate limit: ✅ PASS / ❌ FAIL
- Incomplete form: ✅ PASS / ❌ FAIL
- Network failure: ✅ PASS / ❌ FAIL

## Issues Found

### Critical Issues (P0)
1. [Issue description]
   - **Severity**: Critical
   - **Impact**: [describe]
   - **Steps to reproduce**: [numbered list]
   - **Expected**: [describe]
   - **Actual**: [describe]
   - **Screenshot**: [attach]

### High Priority Issues (P1)
[list issues]

### Medium Priority Issues (P2)
[list issues]

### Low Priority Issues (P3)
[list issues]

## Performance Metrics

- Average page load time: [X seconds]
- Intelligence generation time: [X seconds]
- Content generation time: [X seconds]
- API response times: [average]

## Cost Analysis

- Total intelligence generations: [X]
- Total cost: $[Y]
- Average cost per generation: $[Z]
- Within budget: ✅ YES / ❌ NO

## Recommendations

### Immediate Actions Required
1. [action]
2. [action]

### Short-term Improvements
1. [improvement]
2. [improvement]

### Long-term Enhancements
1. [enhancement]
2. [enhancement]

## Production Readiness Assessment

**Overall Score**: [X/100]

### Criteria Checklist
- [ ] All critical tests pass (100%)
- [ ] Pass rate >95%
- [ ] No security vulnerabilities
- [ ] No data leakage
- [ ] Performance acceptable (<2s page loads)
- [ ] Error handling robust
- [ ] OAuth flows stable
- [ ] Token refresh works
- [ ] Workspace isolation enforced
- [ ] Cost within budget

### Decision: ✅ GO / ❌ NO-GO

**Reasoning**: [explain decision]

**Blockers** (if NO-GO):
1. [blocker]
2. [blocker]

## Next Steps

1. [step]
2. [step]
3. [step]

---

**Report completed by**: [YOUR NAME]
**Report date**: [DATE]
**Approved by**: [NAME]
```

---

### Task 7.2: Calculate Metrics
**Time**: 10 minutes

- [ ] Count total tests executed
- [ ] Count tests passed
- [ ] Count tests failed
- [ ] Calculate pass rate percentage
- [ ] Determine if >95% threshold met
- [ ] Assess production readiness

**Pass Rate Formula**:
```
Pass Rate = (Tests Passed / Total Tests) × 100
```

**Production Ready Criteria**:
- Pass rate ≥95%
- Zero critical (P0) issues
- All security tests pass
- Performance acceptable

---

### Task 7.3: Screenshot Evidence
**Time**: 5 minutes

- [ ] Screenshot successful dashboard loads
- [ ] Screenshot OAuth connection success
- [ ] Screenshot intelligence generation success
- [ ] Screenshot any failures/errors
- [ ] Screenshot test results summary
- [ ] Save all to `/test-evidence/` folder

---

## 🎯 FINAL CHECKLIST

### Pre-Production Readiness
- [ ] All immediate tasks completed
- [ ] All priority tasks completed
- [ ] All dashboards tested
- [ ] OAuth integration tested
- [ ] User journeys completed
- [ ] Error handling verified
- [ ] Testing report compiled
- [ ] Pass rate calculated
- [ ] Screenshots collected
- [ ] Issues documented

### Production Readiness Criteria
- [ ] Pass rate ≥95%
- [ ] Zero P0 (critical) issues
- [ ] All OAuth flows stable
- [ ] Token refresh working
- [ ] Workspace isolation verified
- [ ] No security vulnerabilities
- [ ] Performance acceptable
- [ ] Cost within budget
- [ ] Error handling robust
- [ ] Documentation complete

### Post-Testing Actions
- [ ] Create GitHub issues for failures
- [ ] Prioritize P0/P1 issues
- [ ] Schedule fix deployment
- [ ] Notify stakeholders of results
- [ ] Update production deployment plan

---

## 📈 Success Metrics

**Current Status**:
- System Completion: 98%
- Blocking Issues: 0
- Risk Level: Low
- OAuth Status: ✅ Ready

**Expected Results**:
- Pass Rate: >95%
- Intelligence Generation: <90s
- Cost per Client: $1.50-2.50
- Page Load: <2 seconds

**Actual Results** (fill in after testing):
- Pass Rate: ___%
- Intelligence Generation: ___s
- Cost per Client: $___
- Page Load: ___s

---

## 🆘 Troubleshooting

### Issue: Health check fails
**Solution**: Check `.env.local` has all required variables

### Issue: Login fails
**Solution**: Verify Supabase connection, check auth configuration

### Issue: OAuth redirect fails
**Solution**: Verify `NEXT_PUBLIC_APP_URL=http://localhost:3008` in `.env.local`

### Issue: Intelligence generation times out
**Solution**: Check Anthropic API key, verify network connection

### Issue: Token storage fails
**Solution**: Check migration 205 applied, verify RLS policies

### Issue: Personas are generic
**Solution**: Verify OAuth tokens stored, check console logs for API errors

---

## 📞 Support Resources

**Documentation**:
- Testing Guide: `AIDO_MANUAL_TESTING_GUIDE.md`
- OAuth Guide: `AIDO_OAUTH_INTEGRATIONS_COMPLETE.md`
- Implementation: `AIDO_OAUTH_IMPLEMENTATION_COMPLETE.md`
- Session Summary: `AIDO_SESSION_COMPLETE_2.md`

**Commands**:
```bash
# Health check
npm run test:aido:quick

# Automated tests
npm run test:aido

# Dev server
npm run dev

# Database access
psql $DATABASE_URL
```

**Database Queries**:
```sql
-- Check OAuth tokens
SELECT provider, workspace_id, expires_at, created_at 
FROM oauth_tokens 
ORDER BY created_at DESC;

-- Check clients
SELECT id, business_name, workspace_id, created_at 
FROM aido_clients 
ORDER BY created_at DESC;

-- Check personas
SELECT name, client_id, created_at 
FROM aido_personas 
ORDER BY created_at DESC;
```

---

**Status**: ✅ Ready to Execute  
**Version**: 1.0  
**Last Updated**: 2025-11-25

---

## Quick Command Reference

```bash
# Complete testing sequence
npm run test:aido:quick          # 30 seconds
npm run dev                       # Start server
# Login at http://localhost:3008/login
npm run test:aido                 # 2-3 minutes
# Follow manual tests in this doc  # 3-4 hours
# Fill out testing report          # 30 minutes
```

**Total Estimated Time**: 5-7 hours  
**Minimum Time to Production Decision**: 4 hours
