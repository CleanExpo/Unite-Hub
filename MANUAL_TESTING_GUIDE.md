# 📋 Unite-Hub - Manual Testing Guide (Step-by-Step)

**Purpose**: Verify 100% system functionality through hands-on testing
**Time Required**: 45 minutes
**Prerequisites**: Dev server running (`npm run dev`)

---

## 🚀 **Quick Start**

```bash
# 1. Start dev server
cd d:\Unite-Hub
npm run dev

# 2. Open browser
# Navigate to: http://localhost:3008

# 3. Open DevTools (F12)
# Keep Network tab open for all tests
```

---

## ✅ **Test 1: User Authentication Flow** (5 minutes)

### Steps

1. **Navigate to Login**
   - Go to: `http://localhost:3008/login`
   - Expected: Login page displays with "Continue with Google" button

2. **Click "Continue with Google"**
   - Click the Google OAuth button
   - Expected: Redirects to Google OAuth consent screen

3. **Complete Google OAuth**
   - Select your Google account
   - Grant permissions
   - Expected: Redirects back to `/dashboard/overview`

4. **Verify Dashboard Loads**
   - Check: User profile displays in top-right
   - Check: Navigation menu visible
   - Check: Dashboard widgets render

5. **Check DevTools Console**
   - Expected: NO red errors
   - Warnings are OK

6. **Test Logout**
   - Click user profile → Logout
   - Expected: Redirects to `/login`

###Result
- [ ] ✅ OAuth completes successfully
- [ ] ✅ Dashboard loads
- [ ] ✅ User profile visible
- [ ] ✅ Logout works
- [ ] ✅ No console errors

---

## ✅ **Test 2: Contact Management** (5 minutes)

### Steps

1. **Navigate to Contacts**
   - Click "Contacts" in sidebar
   - Go to: `/dashboard/contacts`
   - Expected: Contacts list page loads

2. **Click "Add Contact"**
   - Click the "+ Add Contact" button
   - Expected: Modal opens

3. **Fill in Contact Form**
   - Name: "Test Contact Auth"
   - Email: "testauth@example.com"
   - Company: "Test Company"
   - Phone: "+1234567890" (optional)

4. **Open DevTools → Network Tab**
   - Filter: "contacts"
   - Keep tab open

5. **Click "Save"**
   - Watch Network tab for POST request

6. **Verify in DevTools**
   - Find: POST request to `/api/contacts`
   - Click on request → Headers tab
   - Check "Request Headers" section
   - **CRITICAL CHECK**: Look for:
     ```
     authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
     ```

7. **Verify Response**
   - Click Response tab
   - Status Code: **200 OK**
   - No error messages

8. **Check Contact in List**
   - Close modal
   - Expected: "Test Contact Auth" appears in contacts list

9. **Verify Contact Details**
   - Click on the new contact
   - Expected: Contact detail page opens
   - Status should be: "prospect" (NOT "new")

10. **Delete Test Contact**
    - Click "Delete" button
    - Confirm deletion
    - Expected: Contact removed from list

### Result
- [ ] ✅ Contact creates successfully
- [ ] ✅ Authorization header present
- [ ] ✅ Status is "prospect"
- [ ] ✅ No 406 errors (.maybeSingle() working)
- [ ] ✅ Contact appears in list
- [ ] ✅ Delete works

---

## ✅ **Test 3: Email Sending** (3 minutes)

### Prerequisites
- At least one email provider configured (SendGrid/Resend/Gmail SMTP)
- Check `.env.local` for: `SENDGRID_API_KEY`, `RESEND_API_KEY`, or `EMAIL_SERVER_*`

### Steps

1. **Navigate to Contact Detail**
   - Go to any contact's detail page
   - Or create a test contact first

2. **Click "Send Email"**
   - Find and click "Send Email" button
   - Expected: Email modal opens

3. **Fill in Email**
   - Subject: "Test Email - Auth Verification"
   - Body: "This is a test email to verify authentication headers are working."

4. **Open DevTools → Network Tab**
   - Filter: "emails"

5. **Click "Send"**
   - Watch Network tab

6. **Verify in DevTools**
   - Find: POST `/api/emails/send`
   - Check Headers:
     ```
     authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
     ```

7. **Check Response**
   - Status Code: **200 OK**
   - Response body should include:
     ```json
     {
       "message": "Email sent successfully!",
       "provider": "SendGrid" // or "Resend" or "Gmail SMTP"
     }
     ```

8. **Verify Success Message**
   - Expected: Green success notification
   - Should say: "Email sent successfully via [Provider Name]"

### Result
- [ ] ✅ Email sends successfully
- [ ] ✅ Authorization header present
- [ ] ✅ Provider name shown (SendGrid/Resend/Gmail)
- [ ] ✅ Success message displays
- [ ] ✅ No console errors

---

## ✅ **Test 4: Gmail Integration** (5 minutes)

### Steps

1. **Navigate to Integrations**
   - Go to: `/dashboard/settings/integrations`
   - Expected: Integrations settings page

2. **Locate Gmail Section**
   - Scroll to "Gmail Integration" card

3. **Open DevTools → Network Tab**
   - Filter: "gmail"

4. **Option A: Connect Gmail** (if not connected)
   - Click "Connect Gmail" button
   - Watch Network tab
   - Expected: POST `/api/integrations/gmail/connect-multi`
   - Check for Authorization header
   - Will redirect to Google OAuth (don't need to complete)

5. **Option B: Sync Gmail** (if already connected)
   - Click "Sync Now" button
   - Watch Network tab
   - Expected: POST `/api/integrations/gmail/sync-all`
   - Check for Authorization header

6. **Verify in DevTools**
   - All Gmail API calls should have:
     ```
     authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
     ```

7. **Check All 7 Gmail Endpoints** (if testing thoroughly)
   - List integrations (GET)
   - Connect multi (POST)
   - Sync all (POST)
   - Update label (POST)
   - Set primary (POST)
   - Toggle sync (POST)
   - Disconnect (POST)

### Result
- [ ] ✅ OAuth flow starts (or sync starts)
- [ ] ✅ All Gmail API calls have auth headers
- [ ] ✅ No 401/403 errors
- [ ] ✅ Responses are 200 OK or redirects

---

## ✅ **Test 5: Billing/Stripe** (3 minutes)

### Steps

1. **Navigate to Billing**
   - Go to: `/dashboard/billing`
   - Expected: Billing page with plan cards

2. **Open DevTools → Network Tab**
   - Filter: "stripe"

3. **Click "Upgrade Now"**
   - Click upgrade button on any plan
   - **DO NOT complete Stripe checkout** (just test the API call)

4. **Verify in DevTools**
   - Find: POST `/api/stripe/checkout`
   - **Check URL is `/api/stripe/checkout`** (NOT `/api/stripe/create-checkout`)
   - Check Headers:
     ```
     authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
     ```

5. **Check Response**
   - Should redirect to Stripe checkout page
   - OR return Stripe checkout URL
   - Should NOT return 404

6. **Test Manage Subscription** (if applicable)
   - Click "Manage Subscription" button
   - Verify: POST `/api/subscription/portal`
   - **Check URL is `/api/subscription/portal`** (NOT `/api/stripe/create-portal-session`)

### Result
- [ ] ✅ Redirects to Stripe (not 404)
- [ ] ✅ Authorization header present
- [ ] ✅ Correct API paths
- [ ] ✅ No console errors

---

## ✅ **Test 6: AI Content Generation** (4 minutes)

### Prerequisites
- OpenRouter or Anthropic API key configured
- Check `.env.local` for: `OPENROUTER_API_KEY` or `ANTHROPIC_API_KEY`

### Steps

1. **Navigate to AI Tools**
   - Go to: `/dashboard/ai-tools/marketing-copy`

2. **Fill in Prompt**
   - Enter: "Generate a professional email announcing a new product launch for a tech startup"

3. **Open DevTools → Network Tab**
   - Filter: "ai"

4. **Click "Generate"**
   - Watch Network tab

5. **Verify in DevTools**
   - Find: POST `/api/ai/generate-marketing`
   - Check Headers:
     ```
     authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
     ```

6. **Wait for Response**
   - Expected: Content generates (may take 3-10 seconds)

7. **Check Response**
   - Status Code: **200 OK**
   - Generated content should display in UI

### Result
- [ ] ✅ Content generates successfully
- [ ] ✅ Authorization header present
- [ ] ✅ Response displays in UI
- [ ] ✅ No console errors

---

## ✅ **Test 7: Calendar Features** (3 minutes)

### Steps

1. **Navigate to Calendar**
   - Go to: `/dashboard/calendar`

2. **Click "Generate Calendar"**
   - Or similar button to trigger calendar generation

3. **Open DevTools → Network Tab**
   - Filter: "calendar"

4. **Verify in DevTools**
   - Find: POST `/api/calendar/generate`
   - Check Headers:
     ```
     authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
     ```

5. **Check Response**
   - Status Code: **200 OK**

### Result
- [ ] ✅ Calendar generates
- [ ] ✅ Authorization header present
- [ ] ✅ No errors

---

## ⭐ **Test 8: Session Expiry Handling** (5 minutes) - **CRITICAL**

### Steps

1. **Login to Dashboard**
   - Ensure you're logged in
   - Navigate to any dashboard page

2. **Open DevTools → Application Tab**
   - Expand "Local Storage"
   - Click on your app's domain (localhost:3008)

3. **Locate Auth Token**
   - Find key starting with: `sb-`
   - Full key looks like: `sb-{project-id}-auth-token`
   - **Copy the key name** (you'll need it)

4. **Delete the Token**
   - Right-click on the auth token key
   - Click "Delete"
   - **CRITICAL**: This simulates session expiry

5. **Refresh the Page**
   - Press F5 or Ctrl+R
   - **Watch what happens carefully**

6. **Expected Behavior** (One of the following):
   - **Option A**: Page redirects to `/login` automatically ✅
   - **Option B**: Shows "Not authenticated" error message ✅
   - **Option C**: Dashboard shows loading state, then redirects ✅

7. **FAILURE Indicators** (Do NOT deploy if you see these):
   - ❌ Dashboard stays visible but shows "undefined" or null data
   - ❌ Infinite loading spinner
   - ❌ Console floods with 401 errors (>10 errors)
   - ❌ Page stays broken without redirecting

8. **Try an Action**
   - If page didn't redirect, try clicking something (e.g., "Add Contact")
   - Expected: Should show auth error or redirect to login

9. **Check Console**
   - Expected: Maybe 1-2 auth errors (OK)
   - NOT OK: Dozens of 401 errors flooding console

### Result
- [ ] ✅ Redirects to /login OR shows auth error
- [ ] ✅ Dashboard doesn't stay in broken state
- [ ] ✅ No error flood in console
- [ ] ⚠️ **IF FAILS**: CRITICAL - Do not deploy

---

## ⭐ **Test 9: Workspace Isolation** (10 minutes) - **SECURITY CRITICAL**

### Prerequisites
- 2 different Google accounts
- Or ability to create 2 test users

### Setup

1. **Create User A**
   - Login with Google Account A
   - Complete onboarding
   - Note the workspace ID (from URL or DevTools)

2. **Create Test Data as User A**
   - Create contact: "Contact A" (contacta@example.com)
   - Create campaign: "Campaign A"

3. **Logout User A**

4. **Create User B**
   - Login with Google Account B (different account)
   - Complete onboarding
   - Note the workspace ID (should be different from User A)

### Testing

1. **As User B: Navigate to Contacts**
   - Go to: `/dashboard/contacts`

2. **Open DevTools → Network Tab**
   - Filter: "contacts"

3. **Check the API Request**
   - Find: GET `/api/contacts?workspaceId=...`
   - Click on request → Headers
   - Check "Query String Parameters"
   - **Verify**: `workspaceId` matches User B's workspace (NOT User A's)

4. **Check Contact List**
   - **CRITICAL**: Should NOT see "Contact A"
   - Should ONLY see User B's contacts

5. **As User B: Navigate to Campaigns**
   - Go to: `/dashboard/campaigns`
   - **CRITICAL**: Should NOT see "Campaign A"
   - Should ONLY see User B's campaigns

6. **Try Direct URL Access** (Advanced Test)
   - Get a contact ID from User A's workspace
   - As User B, try to access: `/dashboard/contacts/[User A's contact ID]`
   - **Expected**: 403 Forbidden OR "Contact not found"
   - **FAILURE**: If you can see User A's contact

### Result
- [ ] ✅ User B only sees their workspace data
- [ ] ✅ User B cannot see User A's contacts
- [ ] ✅ User B cannot see User A's campaigns
- [ ] ✅ API requests include correct workspaceId
- [ ] ✅ Direct URL access blocked
- [ ] ⚠️ **IF FAILS**: CRITICAL SECURITY ISSUE - Do not deploy

---

## ✅ **Test 10: Organization Loading** (3 minutes)

### Steps

1. **Clear All Browser Data**
   - Open DevTools → Application
   - Click "Clear storage"
   - Check all boxes
   - Click "Clear site data"

2. **Fresh Login**
   - Navigate to `/login`
   - Login with Google

3. **Watch Dashboard Load**
   - Time how long it takes
   - Expected: <10 seconds

4. **Check for Infinite Loading**
   - If loading takes >10 seconds:
     - Should show timeout error
     - Should offer "Create Organization" option
     - Should NOT spin forever

5. **Verify Organization Loaded**
   - Top-right should show organization name
   - Dashboard should display data

### Result
- [ ] ✅ Loads within 10 seconds
- [ ] ✅ Organization displays correctly
- [ ] ✅ Timeout handling works (if slow)
- [ ] ✅ No infinite loading

---

## 📊 **COMPLETION CHECKLIST**

Mark each test complete:

- [ ] Test 1: Authentication Flow ✅
- [ ] Test 2: Contact Management ✅
- [ ] Test 3: Email Sending ✅
- [ ] Test 4: Gmail Integration ✅
- [ ] Test 5: Billing/Stripe ✅
- [ ] Test 6: AI Content Generation ✅
- [ ] Test 7: Calendar Features ✅
- [ ] Test 8: Session Expiry (CRITICAL) ✅
- [ ] Test 9: Workspace Isolation (SECURITY) ✅
- [ ] Test 10: Organization Loading ✅

**Total Tests**: 10
**Passed**: _____ / 10
**Failed**: _____ / 10

---

## ✅ **SUCCESS CRITERIA**

System is ready for deployment when:

- ✅ All 10 tests pass
- ✅ No CRITICAL failures (Tests 8 & 9)
- ✅ All Authorization headers present
- ✅ No console error floods
- ✅ Workspace isolation working
- ✅ Session expiry handled gracefully

---

## 🚨 **FAILURE ACTIONS**

### If Test 8 (Session Expiry) Fails
- **Do NOT deploy**
- Review `src/contexts/AuthContext.tsx`
- Check SIGNED_OUT handler (lines 336-349)
- Re-test after fix

### If Test 9 (Workspace Isolation) Fails
- **Do NOT deploy - SECURITY ISSUE**
- Review all API routes
- Check workspace_id filtering
- Verify RLS policies
- Run security audit

### If Other Tests Fail
- Review specific component
- Check console errors
- Verify API endpoints
- Re-test after fix

---

## 📞 **Support**

If you encounter issues:
1. Check console errors (exact message)
2. Check Network tab (failing request)
3. Review [COMPLETE_SYSTEM_VERIFICATION.md](COMPLETE_SYSTEM_VERIFICATION.md)
4. Check [AUTH_HEADERS_COMPLETE_REPORT.md](AUTH_HEADERS_COMPLETE_REPORT.md)

---

**Ready to test?** Start with Test 1 and work through sequentially!

**Estimated time**: 45 minutes for all 10 tests
