# Testing Agent Instructions
**Agent Type**: Quality Assurance Testing Specialist
**Task**: Run comprehensive test suite and validate all functionality post-merge
**Priority**: CRITICAL
**Execution Time**: 30-45 minutes

---

## Mission

Execute comprehensive testing of the merged design system to ensure no regressions, all functionality works correctly, and the new UI renders properly across all pages and devices.

---

## Pre-Testing Setup

### 1. Environment Preparation
```bash
# Ensure on main branch (post-merge)
git branch --show-current
# Expected: main

# Install/update dependencies
npm install

# Verify environment variables exist
cat .env.local | grep -E "(NEXT_PUBLIC_SUPABASE_URL|ANTHROPIC_API_KEY|GOOGLE_CLIENT_ID)"
# Expected: All keys should have values
```

---

### 2. Build Validation

**Critical Step**: Must pass before any testing

```bash
# Clean build
rm -rf .next
npm run build

# Expected output
# ✓ Compiled successfully
# Route (app)                              Size     First Load JS
# ...
```

**If Build Fails**:
- ❌ **STOP**: Do not proceed with testing
- Review build errors
- Report to Git Merge Agent for rollback
- Testing cannot continue until build succeeds

---

## Testing Phases

### Phase 1: Automated Test Suite

#### A. Unit Tests

**Command**:
```bash
npm test -- tests/unit/ --passWithNoTests
```

**Tests to Verify**:
- ✅ `tests/unit/agents/contact-intelligence.test.ts` - AI scoring logic
- ✅ `tests/unit/lib/supabase.test.ts` - Database client
- ✅ `tests/unit/lib/rate-limit.test.ts` - Rate limiting
- ✅ `src/lib/rbac/__tests__/permissions.test.ts` - RBAC permissions

**Success Criteria**:
- All existing tests pass
- No new test failures
- Test coverage maintained or improved

**Expected Output**:
```
PASS tests/unit/agents/contact-intelligence.test.ts
PASS tests/unit/lib/supabase.test.ts
PASS tests/unit/lib/rate-limit.test.ts
PASS src/lib/rbac/__tests__/permissions.test.ts

Test Suites: 4 passed, 4 total
Tests:       X passed, X total
```

---

#### B. Integration Tests

**Command**:
```bash
npm test -- tests/integration/ --passWithNoTests
```

**Tests to Verify**:
- ✅ `tests/integration/api/auth.test.ts` - Authentication endpoints
- ✅ `tests/integration/api/contacts.test.ts` - Contact CRUD operations

**Success Criteria**:
- Auth flow still works
- Contact API endpoints functional
- Workspace filtering enforced

**Expected Output**:
```
PASS tests/integration/api/auth.test.ts
PASS tests/integration/api/contacts.test.ts

Test Suites: 2 passed, 2 total
Tests:       X passed, X total
```

---

#### C. Component Tests

**Command**:
```bash
npm test -- tests/components/ --passWithNoTests
```

**Tests to Verify**:
- ✅ `tests/components/HotLeadsPanel.test.tsx` - Dashboard widget

**Success Criteria**:
- HotLeadsPanel renders with new styling
- Props passed correctly
- Data fetching works

**Expected Output**:
```
PASS tests/components/HotLeadsPanel.test.tsx

Test Suites: 1 passed, 1 total
Tests:       X passed, X total
```

---

#### D. End-to-End Tests

**Command**:
```bash
# Requires dev server running
npm run dev &
sleep 5

npm test -- tests/e2e/ --passWithNoTests
```

**Tests to Verify**:
- ✅ `tests/e2e/auth-flow.spec.ts` - Login/logout flow
- ✅ `tests/e2e/dashboard.spec.ts` - Dashboard navigation

**Success Criteria**:
- Auth flow completes successfully
- Dashboard pages load
- Navigation works between pages

**Note**: E2E tests may need updates if selectors changed

---

### Phase 2: Manual Functional Testing

Start dev server:
```bash
npm run dev
# Server should start on http://localhost:3008
```

---

#### Test Case 1: Landing Page (Unauthenticated)

**URL**: `http://localhost:3008`

**Steps**:
1. Open browser (incognito mode to ensure not logged in)
2. Navigate to `http://localhost:3008`
3. Observe page load

**Expected Results**:
- ✅ Landing page displays (no redirect to login)
- ✅ Hero section with gradient background visible
- ✅ "Unite-Hub" logo and "AI-Powered CRM" tagline display
- ✅ Features section renders
- ✅ "How it Works" section visible
- ✅ Navigation menu displays
- ✅ "Get Started" button links to `/login`
- ✅ Mobile menu button appears on mobile view
- ✅ Page is responsive (test 375px, 768px, 1920px widths)
- ✅ No console errors

**Screenshot**: Take screenshot for report

---

#### Test Case 2: Landing Page (Authenticated)

**URL**: `http://localhost:3008`

**Steps**:
1. Login via `/login` (complete OAuth)
2. Navigate to `http://localhost:3008`

**Expected Results**:
- ✅ Automatically redirects to `/dashboard/overview`
- ✅ No landing page shown for authenticated users

---

#### Test Case 3: Login Page

**URL**: `http://localhost:3008/login`

**Steps**:
1. Navigate to `/login`
2. Observe split-screen layout
3. Test responsive design
4. (Do not click OAuth yet)

**Expected Results**:
- ✅ Split-screen layout displays
- ✅ Left panel shows brand messaging
- ✅ Right panel shows login form
- ✅ "Continue with Google" button styled with gradient
- ✅ "Don't have an account?" link present
- ✅ On mobile (<768px), left panel hidden
- ✅ No console errors

**Screenshot**: Take screenshot

---

#### Test Case 4: Google OAuth Flow

**URL**: `http://localhost:3008/login`

**Steps**:
1. Click "Continue with Google"
2. Complete Google OAuth (select account)
3. Wait for redirect

**Expected Results**:
- ✅ OAuth popup/redirect opens
- ✅ Google sign-in screen appears
- ✅ After selecting account, redirects back
- ✅ Redirects to `/dashboard/overview`
- ✅ No errors during OAuth
- ✅ User session created

**Note**: If OAuth fails, this is **CRITICAL** - rollback required

---

#### Test Case 5: Register Page

**URL**: `http://localhost:3008/register`

**Steps**:
1. Navigate to `/register`
2. Observe form
3. (Do not submit - just visual check)

**Expected Results**:
- ✅ Split-screen layout displays
- ✅ Email, password, confirm password fields visible
- ✅ Terms & conditions checkbox present
- ✅ "Create Account" button styled properly
- ✅ Trust indicators displayed
- ✅ "Already have an account?" link works
- ✅ Responsive on mobile

---

#### Test Case 6: Forgot Password Page

**URL**: `http://localhost:3008/forgot-password`

**Steps**:
1. Navigate to `/forgot-password`
2. Observe layout
3. Enter test email (don't submit)

**Expected Results**:
- ✅ Split-screen layout with security messaging
- ✅ Email input field visible
- ✅ "Send Reset Link" button styled
- ✅ "Back to Sign In" link works
- ✅ Security badge displayed
- ✅ Responsive design

---

#### Test Case 7: Signup Page

**URL**: `http://localhost:3008/signup`

**Steps**:
1. Navigate to `/signup`
2. Observe form

**Expected Results**:
- ✅ Split-screen layout
- ✅ Business name field present (NEW FIELD)
- ✅ Email and password fields visible
- ✅ Trial benefits listed on left panel
- ✅ "Start Free Trial" button styled
- ✅ "No credit card required" badge visible
- ✅ Features grid displayed

**Critical**: Test if business name field saves correctly (submit test if possible)

---

#### Test Case 8: Dashboard Overview (Main Dashboard)

**URL**: `http://localhost:3008/dashboard/overview`

**Prerequisites**: Must be authenticated

**Steps**:
1. Login via OAuth
2. Observe dashboard

**Expected Results**:
- ✅ Breadcrumbs display "Dashboard > Overview"
- ✅ Stat cards display with gradients:
  - Total Contacts card (Users icon)
  - Hot Leads card (Flame icon)
  - Active Campaigns card (Mail icon)
  - Conversion Rate card (TrendingUp icon)
- ✅ Each stat card has:
  - Gradient icon background
  - Glass-morphism effect (backdrop-blur-sm)
  - Proper numbers displayed
- ✅ HotLeadsPanel renders (or empty state if no data)
- ✅ CalendarWidget displays
- ✅ Loading state shows animated spinner (if slow)
- ✅ Empty state displays if no workspace selected
- ✅ No console errors
- ✅ Data is workspace-scoped (check with multiple workspaces)

**Screenshot**: Take screenshot

---

#### Test Case 9: Campaigns Page

**URL**: `http://localhost:3008/dashboard/campaigns`

**Steps**:
1. Navigate to `/dashboard/campaigns`
2. Observe campaign list

**Expected Results**:
- ✅ Page loads without errors
- ✅ Breadcrumbs show "Dashboard > Campaigns"
- ✅ "Create Campaign" button styled with gradient
- ✅ Campaign cards display with:
  - Glass-morphism effect
  - Campaign name and status
  - Stats (sent, opened, clicked)
  - Gradient accents
- ✅ Empty state shows if no campaigns
- ✅ Stats accurate (cross-check with database)
- ✅ No console errors

---

#### Test Case 10: Contacts Page

**URL**: `http://localhost:3008/dashboard/contacts`

**Steps**:
1. Navigate to `/dashboard/contacts`
2. Observe contact table

**Expected Results**:
- ✅ Page loads without errors
- ✅ Breadcrumbs show "Dashboard > Contacts"
- ✅ Search bar displays
- ✅ Filter dropdowns styled correctly:
  - Status filter
  - Score filter
  - Sort dropdown
- ✅ Contact table displays with:
  - Modern styling
  - AI score badges (colored by score)
  - Status badges (styled with colors)
  - Action buttons
- ✅ Pagination works (if >10 contacts)
- ✅ Search functionality works
- ✅ Filters apply correctly
- ✅ Empty state shows if no contacts
- ✅ Bulk select checkboxes work
- ✅ No console errors

---

#### Test Case 11: Navigation & Breadcrumbs

**Steps**:
1. Navigate between pages using sidebar
2. Observe breadcrumb updates

**Expected Results**:
- ✅ Clicking sidebar items navigates correctly
- ✅ Breadcrumbs update on each page
- ✅ Active page highlighted in sidebar
- ✅ No navigation errors
- ✅ Back button works

---

#### Test Case 12: Workspace Filtering (Critical)

**Prerequisites**: Need multiple workspaces or contacts in different workspaces

**Steps**:
1. Login and select Workspace A
2. Navigate to `/dashboard/contacts`
3. Note contact count
4. Switch to Workspace B (if available)
5. Check contact count again

**Expected Results**:
- ✅ Contact count changes between workspaces
- ✅ Only workspace-specific contacts shown
- ✅ No cross-workspace data leakage
- ✅ Stats update per workspace

**Critical**: Data isolation MUST work - this is security-critical

---

### Phase 3: Visual & UI Testing

#### Test Case 13: Gradient & Glass-morphism Effects

**Pages to Check**:
- Landing page hero
- Login page layout
- Dashboard stat cards
- Campaign cards
- Contact table

**Verify**:
- ✅ Gradients render correctly (blue to purple)
- ✅ Glass-morphism (backdrop-blur-sm) visible
- ✅ Shadows have colored glow (shadow-blue-500/50)
- ✅ Hover effects work (scale, brightness)
- ✅ Icons have gradient backgrounds

**Tools**: Browser DevTools → Inspect elements

---

#### Test Case 14: Responsive Design

**Viewports to Test**:
- Mobile: 375x667 (iPhone SE)
- Tablet: 768x1024 (iPad)
- Desktop: 1920x1080 (Full HD)
- Large Desktop: 2560x1440 (QHD)

**For Each Viewport**:
- ✅ Landing page adapts correctly
- ✅ Login split-screen collapses on mobile
- ✅ Dashboard cards stack vertically on mobile
- ✅ Tables scroll horizontally or adapt
- ✅ Navigation becomes hamburger menu on mobile
- ✅ Touch targets are min 44x44px
- ✅ Text readable at all sizes
- ✅ No horizontal scroll (unless table)

**Tools**: Browser DevTools → Device Toolbar (Ctrl+Shift+M)

---

#### Test Case 15: Dark Theme Consistency

**All Pages Must**:
- ✅ Use dark background (slate-950 or gradient)
- ✅ Have sufficient contrast (WCAG AA: 4.5:1 for text)
- ✅ Display gradients clearly
- ✅ Show form inputs with visible borders
- ✅ Render all icons in light colors

**Tools**:
- DevTools → Lighthouse → Accessibility
- Online: https://webaim.org/resources/contrastchecker/

---

#### Test Case 16: Typography & Spacing

**Verify**:
- ✅ Headings use proper hierarchy (h1 > h2 > h3)
- ✅ Body text is readable (min 16px)
- ✅ Spacing is consistent (Tailwind scale)
- ✅ Line height appropriate (1.5-1.7 for body)
- ✅ Gradient text clips work correctly

---

### Phase 4: Performance Testing

#### Test Case 17: Load Times

**Measure**:
```bash
# Use Lighthouse in Chrome DevTools
# Or command line
npx lighthouse http://localhost:3008 --only-categories=performance --view
```

**Targets**:
- ✅ Landing page: < 3s initial load
- ✅ Dashboard: < 2s after auth
- ✅ Time to Interactive (TTI): < 5s
- ✅ First Contentful Paint (FCP): < 1.5s

---

#### Test Case 18: Bundle Size

**Check**:
```bash
npm run build

# Look for route sizes
# Route (app)                              Size     First Load JS
# Should be < 500 KB for most routes
```

**Verify**:
- ✅ Landing page bundle < 500 KB
- ✅ Dashboard bundle < 700 KB
- ✅ No excessive JS for simple pages

---

#### Test Case 19: Network Requests

**Use Browser DevTools → Network tab**

**Verify**:
- ✅ No failed requests (404, 500)
- ✅ Images lazy load
- ✅ API calls return < 500ms
- ✅ No excessive polling

---

### Phase 5: Error Handling

#### Test Case 20: Authentication Errors

**Steps**:
1. Try accessing `/dashboard/overview` while logged out
2. Observe behavior

**Expected**:
- ✅ Redirects to `/login`
- ✅ No crash or 500 error
- ✅ Graceful error message

---

#### Test Case 21: Network Errors

**Steps**:
1. Open DevTools → Network → Enable "Offline"
2. Try navigating pages

**Expected**:
- ✅ Graceful error messages
- ✅ No white screen of death
- ✅ Retry options (if applicable)

---

#### Test Case 22: Invalid Data

**Steps**:
1. Manually trigger API with invalid workspace ID
2. Observe error handling

**Expected**:
- ✅ Returns proper error status (400/404)
- ✅ Error message displayed to user
- ✅ No console errors

---

## Console Error Monitoring

**Throughout ALL testing**:

**Open DevTools Console** (F12)

**Watch For**:
- ❌ **CRITICAL**: `Uncaught ReferenceError` - Undefined variable
- ❌ **CRITICAL**: `TypeError` - Invalid operation
- ❌ **CRITICAL**: `Failed to fetch` - API errors
- ⚠️ **WARNING**: `Warning: Each child in a list should have a unique "key" prop` - Fix later
- ⚠️ **WARNING**: Missing environment variables - Expected in dev

**Log All Errors**: Include in report

---

## Regression Testing

### Critical Features to Verify (Must Not Break)

1. **Authentication**
   - [ ] Google OAuth login works
   - [ ] Session persists after refresh
   - [ ] Logout works
   - [ ] Protected routes require auth

2. **Dashboard Data Display**
   - [ ] Stats calculate correctly
   - [ ] HotLeadsPanel fetches data
   - [ ] Workspace filtering enforced
   - [ ] Charts render (if any)

3. **Contact Management**
   - [ ] Contact list displays
   - [ ] Search works
   - [ ] Filters apply
   - [ ] AI scores display correctly

4. **Campaign Management**
   - [ ] Campaign list loads
   - [ ] Create campaign button works
   - [ ] Campaign stats accurate

5. **API Endpoints**
   - [ ] `/api/auth/initialize-user` works
   - [ ] `/api/agents/contact-intelligence` works
   - [ ] `/api/contacts` endpoints work
   - [ ] `/api/campaigns` endpoints work

---

## Report Template

```markdown
# Comprehensive Testing Report
**Date**: [YYYY-MM-DD HH:MM]
**Agent**: Testing Specialist
**Status**: ✅ PASS / ❌ FAIL / ⚠️ PASS WITH ISSUES

---

## Executive Summary

**Overall Status**: [PASS/FAIL]
**Critical Issues**: [count]
**Non-Critical Issues**: [count]
**Recommendation**: [APPROVE / ROLLBACK / FIX ISSUES]

---

## Test Environment

- **Branch**: main (post-merge)
- **Commit SHA**: [SHA]
- **Node Version**: [version]
- **OS**: [Windows/Mac/Linux]
- **Browser**: [Chrome/Firefox/Safari] [version]

---

## Phase 1: Automated Tests

### Unit Tests
- **Status**: [PASS/FAIL]
- **Tests Run**: [count]
- **Passed**: [count]
- **Failed**: [count]
- **Skipped**: [count]
- **Details**:
  ```
  [Paste test output]
  ```

### Integration Tests
- **Status**: [PASS/FAIL]
- **Tests Run**: [count]
- **Passed**: [count]
- **Failed**: [count]
- **Details**:
  ```
  [Paste test output]
  ```

### Component Tests
- **Status**: [PASS/FAIL]
- **Tests Run**: [count]
- **Passed**: [count]
- **Failed**: [count]

### E2E Tests
- **Status**: [PASS/FAIL]
- **Tests Run**: [count]
- **Passed**: [count]
- **Failed**: [count]

---

## Phase 2: Manual Functional Tests

### Test Case 1: Landing Page (Unauthenticated)
- **Status**: [PASS/FAIL]
- **Hero Section**: [PASS/FAIL]
- **Features Section**: [PASS/FAIL]
- **Navigation**: [PASS/FAIL]
- **Mobile Menu**: [PASS/FAIL]
- **Console Errors**: [count]
- **Screenshot**: [attach]

### Test Case 2: Landing Page (Authenticated)
- **Status**: [PASS/FAIL]
- **Redirect to Dashboard**: [YES/NO]

### Test Case 3: Login Page
- **Status**: [PASS/FAIL]
- **Split-Screen Layout**: [PASS/FAIL]
- **OAuth Button**: [PASS/FAIL]
- **Responsive Design**: [PASS/FAIL]
- **Screenshot**: [attach]

### Test Case 4: Google OAuth Flow
- **Status**: [PASS/FAIL]
- **OAuth Popup**: [PASS/FAIL]
- **Redirect After Login**: [PASS/FAIL]
- **Session Created**: [YES/NO]
- **Issues**: [describe if any]

### Test Case 5: Register Page
- **Status**: [PASS/FAIL]
- **Form Displays**: [PASS/FAIL]
- **Terms Checkbox**: [PASS/FAIL]

### Test Case 6: Forgot Password
- **Status**: [PASS/FAIL]
- **Layout**: [PASS/FAIL]

### Test Case 7: Signup Page
- **Status**: [PASS/FAIL]
- **Business Name Field**: [PASS/FAIL]
- **Trial Benefits**: [PASS/FAIL]

### Test Case 8: Dashboard Overview
- **Status**: [PASS/FAIL]
- **Stat Cards**: [PASS/FAIL]
- **Gradients Visible**: [YES/NO]
- **Glass-morphism**: [YES/NO]
- **HotLeadsPanel**: [PASS/FAIL]
- **Workspace Filtering**: [PASS/FAIL]
- **Screenshot**: [attach]

### Test Case 9: Campaigns Page
- **Status**: [PASS/FAIL]
- **Campaign Cards**: [PASS/FAIL]
- **Create Button**: [PASS/FAIL]

### Test Case 10: Contacts Page
- **Status**: [PASS/FAIL]
- **Table Display**: [PASS/FAIL]
- **Search**: [PASS/FAIL]
- **Filters**: [PASS/FAIL]

### Test Case 11: Navigation
- **Status**: [PASS/FAIL]
- **Sidebar Navigation**: [PASS/FAIL]
- **Breadcrumbs**: [PASS/FAIL]

### Test Case 12: Workspace Filtering
- **Status**: [PASS/FAIL]
- **Data Isolation**: [PASS/FAIL]
- **Security**: [PASS/FAIL]
- **CRITICAL**: [Note any issues]

---

## Phase 3: Visual & UI Tests

### Test Case 13: Gradients & Effects
- **Status**: [PASS/FAIL]
- **Gradients Render**: [YES/NO]
- **Glass-morphism**: [YES/NO]
- **Shadows**: [YES/NO]
- **Hover Effects**: [YES/NO]

### Test Case 14: Responsive Design
- **Mobile (375px)**: [PASS/FAIL]
- **Tablet (768px)**: [PASS/FAIL]
- **Desktop (1920px)**: [PASS/FAIL]
- **Issues**: [describe]

### Test Case 15: Dark Theme
- **Status**: [PASS/FAIL]
- **Contrast Ratio**: [ratio]
- **WCAG Compliance**: [PASS/FAIL]

### Test Case 16: Typography
- **Status**: [PASS/FAIL]
- **Hierarchy**: [PASS/FAIL]
- **Readability**: [PASS/FAIL]

---

## Phase 4: Performance Tests

### Test Case 17: Load Times
- **Landing Page**: [X.X]s
- **Dashboard**: [X.X]s
- **TTI**: [X.X]s
- **FCP**: [X.X]s
- **Target Met**: [YES/NO]

### Test Case 18: Bundle Size
- **Landing Page**: [XXX] KB
- **Dashboard**: [XXX] KB
- **Acceptable**: [YES/NO]

### Test Case 19: Network Requests
- **Failed Requests**: [count]
- **Average Response Time**: [XXX]ms
- **Status**: [PASS/FAIL]

---

## Phase 5: Error Handling

### Test Case 20: Auth Errors
- **Status**: [PASS/FAIL]
- **Graceful Handling**: [YES/NO]

### Test Case 21: Network Errors
- **Status**: [PASS/FAIL]
- **Offline Behavior**: [PASS/FAIL]

### Test Case 22: Invalid Data
- **Status**: [PASS/FAIL]
- **Error Messages**: [PASS/FAIL]

---

## Console Errors Summary

**Total Console Errors**: [count]

### Critical Errors
1. [Error message]
   - **Type**: [ReferenceError/TypeError/etc]
   - **Location**: [file:line]
   - **Impact**: [description]

### Warnings
1. [Warning message]
   - **Type**: [React Warning/etc]
   - **Impact**: [LOW/MEDIUM]

---

## Regression Test Results

### Authentication
- Google OAuth: [PASS/FAIL]
- Session Persistence: [PASS/FAIL]
- Logout: [PASS/FAIL]
- Protected Routes: [PASS/FAIL]

### Dashboard Data
- Stats Calculation: [PASS/FAIL]
- HotLeadsPanel: [PASS/FAIL]
- Workspace Filtering: [PASS/FAIL]

### Contact Management
- List Display: [PASS/FAIL]
- Search: [PASS/FAIL]
- Filters: [PASS/FAIL]
- AI Scores: [PASS/FAIL]

### Campaign Management
- List Display: [PASS/FAIL]
- Create Button: [PASS/FAIL]
- Stats Accuracy: [PASS/FAIL]

### API Endpoints
- `/api/auth/initialize-user`: [PASS/FAIL]
- `/api/agents/contact-intelligence`: [PASS/FAIL]
- `/api/contacts`: [PASS/FAIL]
- `/api/campaigns`: [PASS/FAIL]

---

## Issues Found

### Critical (Must Fix Immediately)
1. [Issue description]
   - **Severity**: CRITICAL
   - **Impact**: [blocks core functionality]
   - **Steps to Reproduce**: [steps]
   - **Expected**: [expected behavior]
   - **Actual**: [actual behavior]
   - **Recommendation**: [ROLLBACK / FIX NOW]

### High (Fix Before Production)
1. [Issue description]
   - **Severity**: HIGH
   - **Impact**: [affects user experience]
   - **Recommendation**: [fix in hotfix]

### Medium (Fix in Follow-Up)
1. [Issue description]
   - **Severity**: MEDIUM
   - **Impact**: [minor issue]
   - **Recommendation**: [fix in next sprint]

### Low (Nice to Fix)
1. [Issue description]
   - **Severity**: LOW
   - **Impact**: [cosmetic]
   - **Recommendation**: [backlog]

---

## Screenshots

### Landing Page
[Attach screenshot]

### Login Page
[Attach screenshot]

### Dashboard Overview
[Attach screenshot]

### Responsive Design (Mobile)
[Attach screenshot]

---

## Final Recommendation

**APPROVE MERGE**: [YES/NO]

**Reasoning**:
[Detailed explanation of decision]

**Conditions** (if conditional approval):
- [Condition 1]
- [Condition 2]

**Next Steps**:
1. [Action item]
2. [Action item]

---

**Tested By**: Testing Agent
**Duration**: [minutes]
**Timestamp**: [YYYY-MM-DD HH:MM:SS]
```

---

## Success Criteria

### Must Pass (Blocking)
- ✅ All automated tests pass
- ✅ Build succeeds
- ✅ Landing page loads
- ✅ Login page loads
- ✅ Google OAuth works
- ✅ Dashboard displays correctly
- ✅ No critical console errors
- ✅ Workspace filtering enforced

### Should Pass (Non-Blocking)
- ✅ All pages responsive
- ✅ Dark theme consistent
- ✅ Performance targets met
- ✅ No regression in existing features

---

## Execution Checklist

- [ ] Environment prepared
- [ ] Build validation passed
- [ ] Automated tests run
- [ ] Manual functional tests completed
- [ ] Visual tests performed
- [ ] Performance tests executed
- [ ] Error handling verified
- [ ] Regression tests passed
- [ ] Console errors logged
- [ ] Screenshots captured
- [ ] Report filled out
- [ ] Final recommendation made

---

**Time Estimate**: 30-45 minutes
**Difficulty**: High
**Critical Path**: Yes (blocks production)

---

**End of Testing Instructions**
