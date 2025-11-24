# AIDO 2026 Testing Checklist

**Date**: 2025-11-25
**Status**: Ready for Manual Testing
**Estimated Time**: 2-3 hours

---

## 🚀 Pre-Testing Setup

### 1. Start Development Server
```bash
npm run dev
```
Server should start at: http://localhost:3008

### 2. Login to Application
1. Open http://localhost:3008/login
2. Sign in with Google
3. Verify you're redirected to dashboard

### 3. Verify Database Connection
```bash
npm run check:db
```

---

## ✅ Dashboard Testing (6 Dashboards)

### Dashboard 1: AIDO Overview (`/dashboard/aido/overview`)

**File**: `src/app/dashboard/aido/overview/page.tsx`

**Tests**:
- [ ] **Load Test**: Dashboard loads without errors
- [ ] **Metrics Cards**:
  - [ ] Total Content Assets displays correctly
  - [ ] Algorithmic Immunity shows count + percentage
  - [ ] Active Signals displays with critical count
  - [ ] Pending Actions shows count
- [ ] **Score Breakdown**:
  - [ ] Authority Score shows percentage + progress bar
  - [ ] Evergreen Score shows percentage + progress bar
  - [ ] AI Source Score shows percentage + progress bar
- [ ] **Quick Actions**:
  - [ ] "Generate Content" link navigates to `/dashboard/aido/content`
  - [ ] "Intent Clusters" link navigates to `/dashboard/aido/intent-clusters`
  - [ ] "Google Curve" link navigates to `/dashboard/aido/google-curve`
- [ ] **5 Strategic Pillars**: All 5 pillars display with descriptions

**Expected Result**: All metrics display "0" if no data yet. No errors in console.

---

### Dashboard 2: Content Assets Manager (`/dashboard/aido/content`)

**File**: `src/app/dashboard/aido/content/page.tsx`

**Tests**:
- [ ] **Load Test**: Dashboard loads without errors
- [ ] **Stats Cards** (if data exists):
  - [ ] Total Assets shows count
  - [ ] Authority Score shows average
  - [ ] AI Source Score shows average
  - [ ] Algorithmic Immunity shows count + percentage
- [ ] **Filters**:
  - [ ] Search input filters by title
  - [ ] Status dropdown filters (all/draft/review/published)
  - [ ] Min AI Score dropdown filters (60%+, 70%+, 80%+)
  - [ ] Apply Filters button triggers re-fetch
- [ ] **Empty State**: Shows "No content assets yet" message with CTA button
- [ ] **Content Cards** (if data exists):
  - [ ] Status badges display correctly (draft/review/published)
  - [ ] Score progress bars render
  - [ ] Algorithmic Immunity badge shows when all scores meet targets
  - [ ] Low score warning shows when scores below thresholds
  - [ ] View/Edit buttons present
- [ ] **Generate Content Button**: Displays at top right

**Expected Result**: Empty state if no content. No JavaScript errors.

---

### Dashboard 3: Intent Clusters Manager (`/dashboard/aido/intent-clusters`)

**File**: `src/app/dashboard/aido/intent-clusters/page.tsx`

**Tests**:
- [ ] **Load Test**: Dashboard loads without errors
- [ ] **Stats Cards**:
  - [ ] Total Clusters displays
  - [ ] Total Questions displays
  - [ ] Avg Business Impact displays
  - [ ] High-Priority count displays
- [ ] **Generate Cluster Button**: Opens modal
- [ ] **Generate Cluster Modal**:
  - [ ] Topic dropdown populates (or shows empty state)
  - [ ] Seed Keywords input works
  - [ ] Industry input (optional)
  - [ ] Location input (optional)
  - [ ] Competitor Domains textarea
  - [ ] Cancel button closes modal
  - [ ] Generate button shows loading state
  - [ ] Cost display shows (~$0.40)
- [ ] **Empty State**: Shows "No intent clusters yet" message
- [ ] **Cluster Cards** (if data exists):
  - [ ] Primary Intent heading displays
  - [ ] Searcher Mindset description shows
  - [ ] Question count badge
  - [ ] 3 score progress bars (Business Impact, Difficulty, Alignment)
  - [ ] Composite score calculation
  - [ ] High Priority badge (if score ≥70%)
  - [ ] Question preview (first 5)
  - [ ] View All Questions button
  - [ ] Generate Content button

**Expected Result**: Empty state or data displays correctly. Modal opens/closes properly.

---

### Dashboard 4: Reality Loop Console (`/dashboard/aido/reality-loop`)

**File**: `src/app/dashboard/aido/reality-loop/page.tsx`

**Tests**:
- [ ] **Load Test**: Dashboard loads without errors
- [ ] **Stats Cards**:
  - [ ] Total Events displays
  - [ ] Completed count
  - [ ] Pending count
  - [ ] Processing count
  - [ ] Content Gen Rate percentage
- [ ] **Webhook Configuration**:
  - [ ] Webhook URL displays (per workspace)
  - [ ] Copy button copies URL to clipboard
  - [ ] Supported event types list displays
  - [ ] Usage instructions show
- [ ] **Refresh Button**: Re-fetches data
- [ ] **Process Pending Button**:
  - [ ] Disabled when no pending events
  - [ ] Shows loading state when clicked
  - [ ] Triggers processing
- [ ] **Empty State**: Shows "No events yet" message
- [ ] **Event Cards** (if data exists):
  - [ ] Event type badges display (color-coded)
  - [ ] Processing status badges
  - [ ] Content Generated badge (if applicable)
  - [ ] Metadata (timestamp, source system, location)
  - [ ] AI Insights section
  - [ ] Raw payload expandable
  - [ ] Link to generated content (if applicable)

**Expected Result**: Empty state or events display. Webhook URL is valid.

---

### Dashboard 5: Google Curve Panel (`/dashboard/aido/google-curve`)

**File**: `src/app/dashboard/aido/google-curve/page.tsx`

**Tests**:
- [ ] **Load Test**: Dashboard loads without errors
- [ ] **Stats Cards**:
  - [ ] Active Signals count
  - [ ] Critical count (red)
  - [ ] Major count (orange)
  - [ ] Moderate count (yellow)
  - [ ] Resolved (24h) count (green)
- [ ] **Add Keywords Button**: Opens modal
- [ ] **Add Keywords Modal**:
  - [ ] Keywords input (comma-separated)
  - [ ] Cancel button closes modal
  - [ ] Start Monitoring button shows loading state
  - [ ] Monitoring includes explanation displays
- [ ] **Refresh Button**: Re-fetches data
- [ ] **Analyze Trends Button**:
  - [ ] Disabled when no observations
  - [ ] Shows loading state
  - [ ] Cost display (~$2.00)
- [ ] **SERP Position History**:
  - [ ] Shows "No observations yet" when empty
  - [ ] Observation cards display (if data exists)
  - [ ] Position badges (#X)
  - [ ] AI Answer badge (if present)
  - [ ] Features count
- [ ] **Change Signals** (if data exists):
  - [ ] Severity badges (minor/moderate/major/critical)
  - [ ] Status badges (active/investigating/resolved)
  - [ ] Signal type badges
  - [ ] Description text
  - [ ] Detection timestamp
  - [ ] Affected keywords list
  - [ ] View Recommendations link

**Expected Result**: Empty states or data displays. Modals work properly.

---

### Dashboard 6: Client Onboarding (`/dashboard/aido/onboarding`)

**File**: `src/app/dashboard/aido/onboarding/page.tsx`

**Tests**:
- [ ] **Load Test**: Dashboard loads without errors
- [ ] **Progress Steps**: 3 steps display with progress indicator
- [ ] **Step 1: Business Profile**:
  - [ ] All required fields marked with *
  - [ ] Business Name input works
  - [ ] Industry input works
  - [ ] Services textarea (comma-separated)
  - [ ] Years in Business number input
  - [ ] Location input works
  - [ ] Website input (optional)
  - [ ] Validation prevents Next without required fields
  - [ ] "What we'll generate" explanation displays
  - [ ] Next button advances to Step 2
- [ ] **Step 2: Authority Figure**:
  - [ ] E-E-A-T warning banner displays
  - [ ] Full Name input works
  - [ ] Role input works
  - [ ] Years of Experience number input
  - [ ] LinkedIn URL input (optional)
  - [ ] Facebook URL input (optional)
  - [ ] Credentials textarea
  - [ ] Previous Work textarea
  - [ ] Education textarea
  - [ ] Back button returns to Step 1
  - [ ] Next button advances to Step 3
- [ ] **Step 3: Data Integrations**:
  - [ ] Optional badge displays
  - [ ] 3 OAuth cards display:
    - [ ] Google Search Console card
    - [ ] Google Business Profile card
    - [ ] Google Analytics 4 card
  - [ ] Connect buttons show "coming soon" alerts
  - [ ] Back button returns to Step 2
  - [ ] Generate Intelligence button shows loading state
  - [ ] Cost display (~$2.00)
- [ ] **Form Persistence**: Values persist when navigating Back/Next
- [ ] **Generate Intelligence**:
  - [ ] API call is made with form data
  - [ ] Loading spinner shows
  - [ ] Success alert displays summary
  - [ ] Redirect to `/dashboard/aido/overview` after completion

**Expected Result**: 3-step wizard works smoothly. Form validation prevents errors.

---

## 🔌 API Endpoint Testing (20 Endpoints)

### Prerequisites
1. Dev server running: `npm run dev`
2. Authenticated session (login via browser)
3. Valid workspace ID

### Automated Test Script

```bash
npm run test:aido
```

This will test all 20 endpoints systematically:
- ✅ Client Profiles (5 endpoints)
- ✅ Topics (2 endpoints)
- ✅ Intent Clusters (3 endpoints)
- ✅ Content (4 endpoints)
- ✅ Reality Loop (3 endpoints)
- ✅ Google Curve (3 endpoints)
- ✅ Onboarding (1 endpoint)

**Note**: AI-powered endpoints (~$5.60 total) are skipped by default to avoid costs.

### Manual API Testing (if script fails)

Use **Thunder Client** or **Postman** to test individual endpoints.

**Auth Header Required**:
```
Authorization: Bearer YOUR_ACCESS_TOKEN
```

Get token from browser:
```javascript
// In browser console after login:
const session = await window.supabase.auth.getSession();
console.log(session.data.session.access_token);
```

#### Test Client Profiles API

1. **POST /api/aido/clients?workspaceId=X**
   ```json
   {
     "businessName": "Test Company",
     "industry": "Construction",
     "website": "https://test.com",
     "contactEmail": "test@test.com"
   }
   ```
   Expected: `{ success: true, client: {...} }`

2. **GET /api/aido/clients?workspaceId=X**
   Expected: `{ success: true, clients: [...] }`

3. **GET /api/aido/clients/[id]?workspaceId=X**
   Expected: `{ success: true, client: {...} }`

4. **PATCH /api/aido/clients/[id]?workspaceId=X**
   ```json
   {
     "website": "https://updated.com"
   }
   ```
   Expected: `{ success: true, client: {...} }`

5. **DELETE /api/aido/clients/[id]?workspaceId=X**
   Expected: `{ success: true }`

*(Continue for all 20 endpoints...)*

---

## 🔗 Integration Testing (Complete User Journeys)

### Journey 1: New Client Onboarding → First Content

**Duration**: 10-15 minutes

1. **Start Onboarding**:
   - [ ] Navigate to `/dashboard/aido/onboarding`
   - [ ] Fill in Step 1: Business Profile (all required fields)
   - [ ] Click Next, verify Step 2 loads

2. **Authority Figure**:
   - [ ] Fill in Step 2: Authority Figure (all required fields)
   - [ ] Add LinkedIn and Facebook URLs
   - [ ] Click Next, verify Step 3 loads

3. **Data Integrations** (Skip OAuth for now):
   - [ ] Review 3 OAuth cards
   - [ ] Click "Generate Intelligence" button
   - [ ] Wait for AI generation (~10-15 seconds)
   - [ ] Verify success alert shows summary
   - [ ] Verify redirect to AIDO Overview

4. **Verify Overview**:
   - [ ] Check that business profile was saved
   - [ ] Verify metrics display (may be 0 if first client)

5. **Generate First Content**:
   - [ ] Navigate to `/dashboard/aido/content`
   - [ ] Click "Generate Content" button
   - [ ] Fill in content generation form
   - [ ] Submit and wait for AI generation (~30-60 seconds)
   - [ ] Verify content asset appears in list
   - [ ] Check scores (authority, evergreen, AI-source)
   - [ ] Verify algorithmic immunity badge (if scores meet targets)

**Expected Result**: Complete onboarding → content generation flow works end-to-end.

---

### Journey 2: Intent Cluster → Content Generation

**Duration**: 5-10 minutes

1. **Create Intent Cluster**:
   - [ ] Navigate to `/dashboard/aido/intent-clusters`
   - [ ] Click "Generate Cluster" button
   - [ ] Select topic (or create new topic first)
   - [ ] Enter seed keywords (e.g., "stainless steel balustrades, glass railings")
   - [ ] Submit and wait for generation (~15-20 seconds, costs $0.40)
   - [ ] Verify cluster appears with 10-15 questions

2. **Generate Content from Cluster**:
   - [ ] Click "Generate Content" button on cluster card
   - [ ] Verify form pre-fills with cluster data
   - [ ] Submit content generation
   - [ ] Wait for completion (~30-60 seconds, costs $0.80-1.20)
   - [ ] Verify content uses questions as H2 headings

3. **Review Content Quality**:
   - [ ] Check H2 headings are direct questions
   - [ ] Verify immediate answers (no fluff)
   - [ ] Check scores meet targets
   - [ ] Verify Q&A blocks present

**Expected Result**: Cluster generation → content generation pipeline works.

---

### Journey 3: Reality Event → Content Opportunity

**Duration**: 5-10 minutes

1. **Ingest Event**:
   - [ ] Navigate to `/dashboard/aido/reality-loop`
   - [ ] Copy webhook URL
   - [ ] Use Postman to POST event to webhook:
     ```json
     {
       "clientId": "your-client-id",
       "eventType": "customer_call",
       "sourceSystem": "test",
       "sourceId": "call-123",
       "timestamp": "2025-11-25T10:00:00Z",
       "rawPayload": {
         "customerQuestion": "How much does a glass balustrade cost?",
         "notes": "Customer interested in residential project"
       }
     }
     ```
   - [ ] Verify event appears in feed with "Pending" status

2. **Process Event**:
   - [ ] Click "Process Pending" button
   - [ ] Wait for AI processing (~5-10 seconds)
   - [ ] Verify event status changes to "Completed"
   - [ ] Check AI Insights section for content opportunity

3. **Generate Content from Event**:
   - [ ] If content opportunity identified, click link
   - [ ] Verify content generation form pre-fills
   - [ ] Submit and wait for generation
   - [ ] Verify content addresses customer question

**Expected Result**: Event ingestion → AI processing → content generation works.

---

### Journey 4: Google Curve Monitoring → Strategy Adjustment

**Duration**: 5-10 minutes

1. **Setup Monitoring**:
   - [ ] Navigate to `/dashboard/aido/google-curve`
   - [ ] Click "Add Keywords" button
   - [ ] Enter keywords (e.g., "stainless steel balustrades, glass railings")
   - [ ] Submit and wait
   - [ ] Verify observation cards appear

2. **Wait for Cron Job** (or simulate):
   - [ ] Note: Cron job runs every 6 hours automatically
   - [ ] For testing, check SERP observations display

3. **Analyze Trends**:
   - [ ] Click "Analyze Trends" button (costs ~$2.00)
   - [ ] Wait for AI analysis (~15-20 seconds)
   - [ ] Verify change signals appear (if any shifts detected)
   - [ ] Check severity badges (minor/moderate/major/critical)

4. **Review Recommendations**:
   - [ ] Click "View Recommendations" on signal
   - [ ] Verify strategy recommendations display
   - [ ] Check action items are specific

**Expected Result**: SERP monitoring → change detection → recommendations works.

---

## 🐛 Error Handling Tests

### Test Invalid Inputs

1. **Empty Required Fields**:
   - [ ] Try to submit onboarding Step 1 with empty fields
   - [ ] Verify validation error message
   - [ ] Verify Next button doesn't advance

2. **Invalid Workspace ID**:
   - [ ] Manually change workspaceId in URL to invalid UUID
   - [ ] Verify API returns 401 or 404 error
   - [ ] Verify user-friendly error message

3. **Expired Token**:
   - [ ] Wait for token to expire (or manually use old token)
   - [ ] Try to make API call
   - [ ] Verify redirect to login page

4. **Rate Limit**:
   - [ ] Make 10+ API calls rapidly
   - [ ] Verify rate limit message (429 status)
   - [ ] Verify message includes upgrade prompt

### Test Network Errors

1. **API Timeout**:
   - [ ] Disconnect internet briefly
   - [ ] Try to submit form
   - [ ] Verify error message displays

2. **Server Error**:
   - [ ] Manually trigger 500 error (invalid data)
   - [ ] Verify user-friendly error message
   - [ ] Verify error is logged to console

---

## 📊 Performance Tests

### Load Time Tests

1. **Dashboard Load Time**:
   - [ ] Clear browser cache
   - [ ] Open Chrome DevTools → Network tab
   - [ ] Navigate to each dashboard
   - [ ] Verify load time <2s for each

2. **API Response Time**:
   - [ ] Monitor Network tab during API calls
   - [ ] Verify standard endpoints respond <200ms
   - [ ] Verify AI endpoints respond <15s

### Data Scale Tests

1. **Large Dataset**:
   - [ ] Create 50+ content assets (or use script)
   - [ ] Navigate to Content Manager
   - [ ] Verify pagination or scroll performance
   - [ ] Check no UI lag

2. **Many Clusters**:
   - [ ] Create 20+ intent clusters
   - [ ] Navigate to Intent Clusters Manager
   - [ ] Verify rendering performance

---

## ✅ Completion Checklist

### Dashboard Testing:
- [ ] AIDO Overview (6 checks)
- [ ] Content Assets Manager (10 checks)
- [ ] Intent Clusters Manager (15 checks)
- [ ] Reality Loop Console (12 checks)
- [ ] Google Curve Panel (14 checks)
- [ ] Client Onboarding (20 checks)

### API Testing:
- [ ] Automated test script (`npm run test:aido`)
- [ ] All 20 endpoints respond correctly
- [ ] Authentication works
- [ ] Workspace isolation verified

### Integration Testing:
- [ ] Journey 1: Onboarding → Content (complete)
- [ ] Journey 2: Cluster → Content (complete)
- [ ] Journey 3: Event → Content (complete)
- [ ] Journey 4: Monitoring → Strategy (complete)

### Error Handling:
- [ ] Invalid inputs handled gracefully
- [ ] Network errors display user-friendly messages
- [ ] Rate limiting works correctly

### Performance:
- [ ] All dashboards load <2s
- [ ] APIs respond <200ms (standard) / <15s (AI)
- [ ] Large datasets render without lag

---

## 🎯 Success Criteria

**Pass if**:
- ✅ All 6 dashboards load without JavaScript errors
- ✅ All 20 API endpoints return expected responses
- ✅ Complete user journeys work end-to-end
- ✅ Error handling prevents bad data submission
- ✅ Performance meets targets (<2s load, <200ms API)

**Fail if**:
- ❌ Any dashboard has JavaScript errors
- ❌ Any API endpoint returns 500 errors (excluding invalid inputs)
- ❌ User journey gets stuck or shows wrong data
- ❌ No error messages for invalid inputs
- ❌ Load time >5s or API response >1s (standard endpoints)

---

## 📝 Test Results

**Date Tested**: _________________
**Tester**: _________________
**Environment**: Development / Staging / Production

**Results**:
- Passed: _____ / 77 checks
- Failed: _____ / 77 checks
- Blocked: _____ / 77 checks

**Notes**:
_________________
_________________
_________________

**Issues Found**:
1. _________________
2. _________________
3. _________________

**Next Steps**:
_________________
_________________
_________________

---

**Testing Checklist Complete**
**Total Checks**: 77 manual checks
**Estimated Time**: 2-3 hours
**Tools Needed**: Browser, DevTools, Thunder Client (optional)
