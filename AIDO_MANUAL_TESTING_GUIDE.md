# AIDO 2026 - Manual Testing Guide

**Purpose**: Systematic testing of all AIDO dashboards and APIs
**Estimated Time**: 2-3 hours
**Prerequisites**: Dev server running, logged in user, OAuth credentials configured

---

## Prerequisites Checklist

Before starting testing, ensure:

- [ ] Dev server running: `npm run dev`
- [ ] Logged in at: http://localhost:3008/login
- [ ] Migration 205 applied (oauth_tokens table exists)
- [ ] Google OAuth credentials in `.env.local`:
  - `GOOGLE_CLIENT_ID`
  - `GOOGLE_CLIENT_SECRET`
  - `NEXT_PUBLIC_APP_URL=http://localhost:3008`
- [ ] Anthropic API key configured: `ANTHROPIC_API_KEY`

---

## Phase 1: Dashboard Testing (45-60 minutes)

### Dashboard 1: Overview (/dashboard/aido/overview)

**Purpose**: Main AIDO dashboard showing system health and quick stats

**Test Cases**:
1. **Page Load**
   - [ ] Page loads without errors
   - [ ] All components render (header, stats cards, charts)
   - [ ] No console errors in browser DevTools

2. **Stats Display**
   - [ ] Total clients count displays
   - [ ] Active campaigns count displays
   - [ ] Generated content count displays
   - [ ] System health indicator shows status

3. **Navigation**
   - [ ] Links to other dashboards work
   - [ ] Breadcrumb navigation functional

**Expected Behavior**: Dashboard loads in <2 seconds, shows placeholder data if no clients yet

---

### Dashboard 2: Onboarding (/dashboard/aido/onboarding)

**Purpose**: Client onboarding wizard with OAuth integrations

**Test Cases**:
1. **Step 1 - Business Profile**
   - [ ] All input fields work (businessName, industry, services, yearsInBusiness, location, website)
   - [ ] Required field validation works (try clicking "Next" with empty fields)
   - [ ] Can proceed to Step 2 after filling all required fields

2. **Step 2 - Authority Figure**
   - [ ] All input fields work (fullName, role, yearsExperience, linkedinUrl, etc.)
   - [ ] Required field validation works
   - [ ] "Back" button returns to Step 1
   - [ ] Can proceed to Step 3 after filling required fields

3. **Step 3 - OAuth Integrations**
   - [ ] Three integration cards display (GSC, GBP, GA4)
   - [ ] "Connect" buttons work for all 3 providers
   - [ ] OAuth flow redirects to Google consent screen
   - [ ] After granting permissions, redirects back with "Connected" badge
   - [ ] Can skip OAuth and proceed to "Generate Intelligence"

4. **Intelligence Generation**
   - [ ] "Generate Intelligence" button triggers API call
   - [ ] Loading spinner shows during generation (~30-60 seconds)
   - [ ] Success alert shows summary of generated data
   - [ ] Redirects to `/dashboard/aido/overview` after completion

**Expected Behavior**: Complete flow takes 5-10 minutes, OAuth optional, generation cost ~$1.50-2.50

**Test Data Example**:
```
Step 1:
- Business Name: Test Balustrades Co
- Industry: Construction
- Services: Stainless steel balustrades, Glass railings
- Years in Business: 15
- Location: Brisbane, Australia
- Website: https://test-balustrades.com

Step 2:
- Full Name: John Smith
- Role: CEO & Founder
- Years Experience: 20
- LinkedIn: https://linkedin.com/in/johnsmith
- Credentials: Licensed Builder, AS1170 Certified
```

---

### Dashboard 3: Clients (/dashboard/aido/clients)

**Purpose**: View all onboarded clients with search/filter

**Test Cases**:
1. **Page Load**
   - [ ] Client list displays (or "No clients yet" message)
   - [ ] Search bar works
   - [ ] Filter dropdowns work (if implemented)

2. **Client Cards**
   - [ ] Each client shows business name, industry, status
   - [ ] "View Details" button works
   - [ ] "Generate Content" button works (if implemented)

3. **Client Creation**
   - [ ] "New Client" button redirects to onboarding
   - [ ] Can create multiple clients

**Expected Behavior**: Loads in <2 seconds, shows all workspace clients

---

### Dashboard 4: Content (/dashboard/aido/content)

**Purpose**: View generated content drafts (emails, blog posts, social media)

**Test Cases**:
1. **Page Load**
   - [ ] Content list displays
   - [ ] Filter by content type works
   - [ ] Search by topic/keywords works

2. **Content Cards**
   - [ ] Each draft shows title, type, client, created date
   - [ ] "View Full Content" expands draft
   - [ ] "Copy to Clipboard" works
   - [ ] "Regenerate" button works (triggers new AI generation)

3. **Content Generation**
   - [ ] "Generate New Content" button works
   - [ ] Content type selection works (email, blog, social)
   - [ ] AI generates appropriate content format

**Expected Behavior**: Generated content is high-quality, personalized, ready to use

---

### Dashboard 5: Analytics (/dashboard/aido/analytics)

**Purpose**: Performance metrics for generated content and campaigns

**Test Cases**:
1. **Page Load**
   - [ ] Charts/graphs display
   - [ ] Date range selector works
   - [ ] Metric cards show totals

2. **Metrics Display**
   - [ ] Content generation count
   - [ ] AI cost tracking
   - [ ] Engagement metrics (if implemented)

3. **Export**
   - [ ] "Export Report" button works (if implemented)

**Expected Behavior**: Shows real-time metrics, updates daily

---

### Dashboard 6: Settings (/dashboard/aido/settings)

**Purpose**: Configure AIDO system settings and integrations

**Test Cases**:
1. **Page Load**
   - [ ] All settings sections display
   - [ ] Current values load correctly

2. **OAuth Connections**
   - [ ] Shows connected Google accounts
   - [ ] "Disconnect" button works (if implemented)
   - [ ] Last sync time displays

3. **AI Settings**
   - [ ] Model selection works (if implemented)
   - [ ] Budget limits display and update

4. **Save Settings**
   - [ ] "Save Changes" button works
   - [ ] Success notification shows

**Expected Behavior**: Settings persist across sessions

---

## Phase 2: API Testing (60-90 minutes)

### API Group 1: Client Profiles (4 endpoints)

**Base URL**: `/api/aido`

#### 1. POST /api/aido/clients?workspaceId={id}
**Purpose**: Create new client profile

**Test Request**:
```bash
curl -X POST "http://localhost:3008/api/aido/clients?workspaceId=YOUR_WORKSPACE_ID" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "businessName": "Test Company",
    "industry": "Construction",
    "website": "https://test.com",
    "contactEmail": "contact@test.com"
  }'
```

**Expected Response**:
```json
{
  "success": true,
  "client": {
    "id": "uuid",
    "businessName": "Test Company",
    "industry": "Construction",
    "createdAt": "2025-11-25T..."
  }
}
```

**Test Cases**:
- [ ] Returns 401 without auth token
- [ ] Returns 400 with invalid workspaceId
- [ ] Returns 400 with missing required fields
- [ ] Returns 201 with valid data
- [ ] Client appears in database

#### 2. GET /api/aido/clients?workspaceId={id}
**Purpose**: List all clients for workspace

**Test Cases**:
- [ ] Returns empty array if no clients
- [ ] Returns all workspace clients (filtered by workspaceId)
- [ ] Does not return clients from other workspaces
- [ ] Pagination works (if implemented)

#### 3. GET /api/aido/clients/{id}?workspaceId={id}
**Purpose**: Get single client details

**Test Cases**:
- [ ] Returns 404 for non-existent client
- [ ] Returns 403 if client belongs to different workspace
- [ ] Returns full client profile with all fields

#### 4. PUT /api/aido/clients/{id}?workspaceId={id}
**Purpose**: Update client profile

**Test Cases**:
- [ ] Updates specified fields only
- [ ] Returns 404 for non-existent client
- [ ] Returns updated client data

---

### API Group 2: Onboarding Intelligence (1 endpoint)

#### 5. POST /api/aido/onboarding/generate?workspaceId={id}
**Purpose**: Generate complete onboarding intelligence (business profile, authority figure, personas, content strategy)

**Test Request**:
```bash
curl -X POST "http://localhost:3008/api/aido/onboarding/generate?workspaceId=YOUR_WORKSPACE_ID" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "businessInput": {
      "businessName": "Test Balustrades",
      "industry": "Construction",
      "services": ["Stainless steel balustrades", "Glass railings"],
      "yearsInBusiness": 15,
      "location": "Brisbane, Australia",
      "website": "https://test-balustrades.com"
    },
    "authorityInput": {
      "fullName": "John Smith",
      "role": "CEO",
      "yearsExperience": 20,
      "linkedinUrl": "https://linkedin.com/in/johnsmith",
      "credentials": ["Licensed Builder", "AS1170 Certified"]
    }
  }'
```

**Expected Response** (~30-60 seconds):
```json
{
  "success": true,
  "intelligence": {
    "businessProfile": {
      "businessName": "Test Balustrades",
      "tagline": "AI-generated tagline...",
      "uniqueValueProposition": "What makes them unique...",
      "expertiseAreas": ["Area 1", "Area 2", "Area 3"],
      "coreServices": [...]
    },
    "authorityFigure": {
      "fullName": "John Smith",
      "role": "CEO",
      "professionalBio": "150-200 words...",
      "shortByline": "50-75 words...",
      "aboutPageContent": "300-400 words..."
    },
    "audiencePersonas": [
      {
        "name": "Commercial Architect",
        "demographics": {...},
        "painPoints": [...],
        "goals": [...]
      }
    ],
    "contentStrategy": {
      "contentPillars": ["Pillar 1", "Pillar 2", "Pillar 3"],
      "topicClusters": [...],
      "h2Questions": [...]
    }
  },
  "generation": {
    "duration": "45.3s",
    "estimatedCost": "$1.50-2.50",
    "model": "claude-opus-4-20250514"
  }
}
```

**Test Cases**:
- [ ] Returns 401 without auth token
- [ ] Returns 400 with missing businessInput
- [ ] Returns 400 with missing authorityInput
- [ ] Generates all 4 sections (businessProfile, authorityFigure, personas, contentStrategy)
- [ ] Personas count: 3-5
- [ ] Content pillars count: 3-5
- [ ] Professional bio: 150-200 words
- [ ] Generation time: 30-60 seconds
- [ ] Cost estimate: $1.50-2.50

**With OAuth Data** (if tokens exist):
- [ ] Fetches GSC data (top 100 queries) if website provided
- [ ] Fetches GBP data (questions + reviews) if connected
- [ ] Fetches GA4 data (demographics + top pages) if connected
- [ ] Personas reflect real customer search behavior
- [ ] Console logs show: "✅ Fetched X GSC queries"

---

### API Group 3: Content Generation (3 endpoints)

#### 6. POST /api/aido/content/generate?workspaceId={id}
**Purpose**: Generate marketing content (email, blog, social media)

**Test Cases**:
- [ ] Generates email content (subject + body)
- [ ] Generates blog post (title + outline + 1000+ words)
- [ ] Generates social media post (platform-specific format)
- [ ] Content is personalized to client's business
- [ ] Generation time: 15-45 seconds

#### 7. GET /api/aido/content?workspaceId={id}
**Purpose**: List generated content drafts

**Test Cases**:
- [ ] Returns all content for workspace
- [ ] Filters by clientId work
- [ ] Filters by contentType work
- [ ] Sorted by createdAt desc

#### 8. PUT /api/aido/content/{id}/regenerate?workspaceId={id}
**Purpose**: Regenerate content draft with new AI call

**Test Cases**:
- [ ] Regenerates with different variations
- [ ] Updates existing record (doesn't create new)
- [ ] Returns new content

---

### API Group 4: Audience Personas (2 endpoints)

#### 9. GET /api/aido/personas?workspaceId={id}&clientId={id}
**Purpose**: Get audience personas for client

**Test Cases**:
- [ ] Returns 3-5 personas per client
- [ ] Each persona has: name, demographics, painPoints, goals, preferredContent
- [ ] Reflects real GSC/GBP/GA4 data if connected

#### 10. POST /api/aido/personas/analyze?workspaceId={id}
**Purpose**: Analyze target audience from Google data

**Test Cases**:
- [ ] Analyzes GSC search queries
- [ ] Analyzes GBP customer questions
- [ ] Analyzes GA4 demographics
- [ ] Returns persona recommendations

---

### API Group 5: Content Strategy (2 endpoints)

#### 11. GET /api/aido/strategy?workspaceId={id}&clientId={id}
**Purpose**: Get content strategy for client

**Test Cases**:
- [ ] Returns contentPillars (3-5)
- [ ] Returns topicClusters mapped to pillars
- [ ] Returns h2Questions (user-asked questions from GBP/GSC)

#### 12. POST /api/aido/strategy/refresh?workspaceId={id}
**Purpose**: Refresh content strategy with latest Google data

**Test Cases**:
- [ ] Fetches latest GSC queries
- [ ] Fetches latest GBP questions
- [ ] Updates content pillars based on trends
- [ ] Returns updated strategy

---

### API Group 6: Intelligence Reports (2 endpoints)

#### 13. GET /api/aido/intelligence/reports?workspaceId={id}
**Purpose**: List all intelligence reports

**Test Cases**:
- [ ] Returns reports for all clients in workspace
- [ ] Sorted by createdAt desc
- [ ] Includes summary stats

#### 14. POST /api/aido/intelligence/export?workspaceId={id}
**Purpose**: Export intelligence report as PDF/JSON

**Test Cases**:
- [ ] Exports as JSON
- [ ] Exports as PDF (if implemented)
- [ ] Includes all sections (business, authority, personas, strategy)

---

### API Group 7: OAuth Integrations (6 endpoints)

#### 15. GET /api/aido/auth/gsc/url?workspaceId={id}
**Purpose**: Get Google Search Console OAuth URL

**Test Cases**:
- [ ] Returns valid OAuth URL
- [ ] URL includes workspaceId in state parameter
- [ ] Redirects to Google consent screen

#### 16. GET /api/aido/auth/gsc/callback?code={code}&state={workspaceId}
**Purpose**: Handle GSC OAuth callback

**Test Cases**:
- [ ] Exchanges code for tokens
- [ ] Stores tokens in oauth_tokens table
- [ ] Redirects to onboarding with success

#### 17-22. Same tests for GBP and GA4
- [ ] GBP OAuth URL works
- [ ] GBP callback works
- [ ] GA4 OAuth URL works
- [ ] GA4 callback works

---

### API Group 8: Analytics (2 endpoints)

#### 23. GET /api/aido/analytics/costs?workspaceId={id}
**Purpose**: Get AI generation costs

**Test Cases**:
- [ ] Returns daily costs
- [ ] Returns monthly costs
- [ ] Breaks down by model (Opus, Sonnet, Haiku)
- [ ] Shows total spend vs budget

#### 24. GET /api/aido/analytics/usage?workspaceId={id}
**Purpose**: Get system usage metrics

**Test Cases**:
- [ ] Returns generation counts
- [ ] Returns active clients count
- [ ] Returns content drafts count

---

## Phase 3: Integration Testing (60 minutes)

### User Journey 1: Complete Onboarding Flow

**Goal**: Test end-to-end client onboarding with OAuth

**Steps**:
1. [ ] Navigate to `/dashboard/aido/onboarding`
2. [ ] Fill out Step 1 (Business Profile)
3. [ ] Fill out Step 2 (Authority Figure)
4. [ ] Connect Google Search Console (OAuth flow)
5. [ ] Connect Google Business Profile (OAuth flow)
6. [ ] Connect Google Analytics 4 (OAuth flow)
7. [ ] Click "Generate Intelligence"
8. [ ] Wait for generation (~30-60 seconds)
9. [ ] Verify success alert shows generated data summary
10. [ ] Verify redirect to `/dashboard/aido/overview`
11. [ ] Verify new client appears in clients list
12. [ ] Check database for stored OAuth tokens
13. [ ] Check console logs for "✅ Fetched X GSC queries"

**Success Criteria**:
- All 3 OAuth connections successful
- Intelligence generation completes in <90 seconds
- Generated data includes personas based on real Google data
- Cost: ~$1.50-2.50

---

### User Journey 2: Content Generation Flow

**Goal**: Generate marketing content for onboarded client

**Steps**:
1. [ ] Navigate to `/dashboard/aido/clients`
2. [ ] Select a client from list
3. [ ] Click "Generate Content"
4. [ ] Select content type (email/blog/social)
5. [ ] Enter topic/prompt
6. [ ] Click "Generate"
7. [ ] Wait for generation (~15-45 seconds)
8. [ ] Review generated content
9. [ ] Copy to clipboard
10. [ ] Verify content is personalized to client

**Success Criteria**:
- Content matches selected type format
- Content is high-quality and ready to use
- Content reflects client's business/industry
- Generation completes in <60 seconds

---

### User Journey 3: OAuth Token Refresh

**Goal**: Verify automatic token refresh when expired

**Steps**:
1. [ ] Manually set oauth_tokens.expires_at to past date in database
2. [ ] Trigger intelligence generation (which needs OAuth data)
3. [ ] Verify API detects expired token
4. [ ] Verify API calls refresh_token to get new access_token
5. [ ] Verify database updated with new expires_at
6. [ ] Verify generation continues without error
7. [ ] Check console logs for token refresh

**Success Criteria**:
- Token automatically refreshed
- No user intervention required
- Generation succeeds with fresh token

---

### User Journey 4: Multi-Client Management

**Goal**: Test workspace isolation and multi-client handling

**Steps**:
1. [ ] Create Client A via onboarding
2. [ ] Create Client B via onboarding
3. [ ] Generate content for Client A
4. [ ] Generate content for Client B
5. [ ] Verify Client A content doesn't appear in Client B's list
6. [ ] Verify Client B personas don't include Client A data
7. [ ] Check analytics shows both clients separately

**Success Criteria**:
- Complete workspace isolation
- No data leakage between clients
- Analytics aggregates correctly

---

## Phase 4: Error Handling Testing (30 minutes)

### Error Case 1: Missing OAuth Token

**Test**: Generate intelligence without OAuth tokens
**Expected**: Graceful fallback, generates personas without real data

### Error Case 2: Invalid OAuth Token

**Test**: Use revoked or invalid token
**Expected**: Token refresh attempt, fallback to no OAuth data

### Error Case 3: Google API Failure

**Test**: Simulate GSC/GBP/GA4 API error
**Expected**: Continue generation, log warning, fallback to no OAuth data

### Error Case 4: Rate Limit Exceeded

**Test**: Exceed Anthropic rate limits
**Expected**: Retry with exponential backoff, clear error message

### Error Case 5: Incomplete Form Data

**Test**: Submit onboarding with missing required fields
**Expected**: Validation error, highlight missing fields

---

## Success Criteria Summary

**All Dashboards (6)**:
- [ ] All pages load without errors
- [ ] All components render correctly
- [ ] All navigation works
- [ ] No console errors

**All APIs (24)**:
- [ ] All endpoints return correct status codes
- [ ] All responses match expected schema
- [ ] Authentication works correctly
- [ ] Workspace isolation enforced

**All User Journeys (4)**:
- [ ] Complete onboarding flow works end-to-end
- [ ] Content generation produces quality results
- [ ] OAuth token refresh automatic
- [ ] Multi-client management isolated

**All Error Cases (5)**:
- [ ] Graceful error handling
- [ ] Clear error messages
- [ ] No system crashes
- [ ] Fallback mechanisms work

---

## Testing Report Template

After completing all tests, fill out:

```markdown
# AIDO 2026 Testing Report

**Date**: YYYY-MM-DD
**Tester**: Your Name
**Environment**: Development (localhost:3008)

## Summary
- Total Tests: X
- Passed: X
- Failed: X
- Skipped: X

## Dashboard Testing
- Overview: ✅ PASS / ❌ FAIL
- Onboarding: ✅ PASS / ❌ FAIL
- Clients: ✅ PASS / ❌ FAIL
- Content: ✅ PASS / ❌ FAIL
- Analytics: ✅ PASS / ❌ FAIL
- Settings: ✅ PASS / ❌ FAIL

## API Testing
- Client Profiles: X/4 passed
- Onboarding Intelligence: X/1 passed
- Content Generation: X/3 passed
- Audience Personas: X/2 passed
- Content Strategy: X/2 passed
- Intelligence Reports: X/2 passed
- OAuth Integrations: X/6 passed
- Analytics: X/2 passed

## Integration Testing
- Complete Onboarding Flow: ✅ PASS / ❌ FAIL
- Content Generation Flow: ✅ PASS / ❌ FAIL
- OAuth Token Refresh: ✅ PASS / ❌ FAIL
- Multi-Client Management: ✅ PASS / ❌ FAIL

## Error Handling
- Missing OAuth Token: ✅ PASS / ❌ FAIL
- Invalid OAuth Token: ✅ PASS / ❌ FAIL
- Google API Failure: ✅ PASS / ❌ FAIL
- Rate Limit Exceeded: ✅ PASS / ❌ FAIL
- Incomplete Form Data: ✅ PASS / ❌ FAIL

## Issues Found
1. [Issue description]
   - Severity: Critical/High/Medium/Low
   - Steps to reproduce:
   - Expected:
   - Actual:

## Recommendations
1. [Recommendation 1]
2. [Recommendation 2]

## Overall Assessment
- System Health: X%
- Production Ready: Yes/No
- Blockers: X issues
```

---

## Next Steps After Testing

1. **If All Tests Pass** (95%+ pass rate):
   - Document any minor issues
   - Proceed to production deployment preparation
   - Set up monitoring and alerting

2. **If Critical Failures** (<80% pass rate):
   - Create GitHub issues for all failures
   - Prioritize P0 (blocking) issues
   - Fix and retest

3. **If Medium Failures** (80-94% pass rate):
   - Document known issues
   - Create fix backlog
   - Proceed to staging environment testing

---

**Estimated Total Testing Time**: 3-4 hours
**Recommended**: Test in pairs (one tester, one observer)
**Tools Needed**: Browser DevTools, Postman/curl, Database client
