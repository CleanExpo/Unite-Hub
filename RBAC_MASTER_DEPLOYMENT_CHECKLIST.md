# RBAC Master Deployment Checklist for Synthex.social

**Version**: 1.0
**Status**: ✅ **READY FOR PRODUCTION DEPLOYMENT**
**Domain**: https://synthex.social
**Date**: 2025-11-26
**Estimated Deployment Time**: 1.5 hours

---

## Overview

This is the **master checklist** for deploying the RBAC system to synthex.social. Follow these steps in order to ensure a smooth, verified deployment.

---

## Phase 1: Pre-Deployment Verification (30 minutes)

### Step 1.1: Verify Build Status

- [ ] **Run local build**
  ```bash
  npm run build
  ```
  - Expected: Exit code 0
  - Expected: 0 TypeScript errors
  - Expected: 0 build warnings

  **Result**: ______________________

- [ ] **Verify all RBAC files present**
  ```bash
  ls -la src/lib/rbac/
  ls -la src/app/api/admin/
  ls -la src/app/crm/
  ls -la src/app/admin/
  ```
  - deviceAuthorization.ts ✓
  - getUserRole.ts ✓
  - approve-access route ✓
  - send-approval-email route ✓
  - trusted-devices route ✓
  - pending-approvals route ✓

### Step 1.2: Verify Environment Configuration

**Vercel Project Settings**:
- [ ] **NEXT_PUBLIC_SUPABASE_URL** = Your Supabase project URL
- [ ] **NEXT_PUBLIC_SUPABASE_ANON_KEY** = Supabase anon key
- [ ] **SUPABASE_SERVICE_ROLE_KEY** = Supabase service role key
- [ ] **NEXT_PUBLIC_BASE_URL** = `https://synthex.social`

**Email Service** (at least one):
- [ ] **SENDGRID_API_KEY** = Your SendGrid key, OR
- [ ] **RESEND_API_KEY** = Your Resend key, OR
- [ ] **EMAIL_SERVER_HOST** = `smtp.gmail.com`
- [ ] **EMAIL_SERVER_PORT** = `587`
- [ ] **EMAIL_SERVER_USER** = Your email address
- [ ] **EMAIL_SERVER_PASSWORD** = Your app password
- [ ] **EMAIL_FROM** = `no-reply@synthex.social`

**Verification**:
```bash
# Test email configuration
node scripts/test-email-config.mjs
```
Result: ______________________

### Step 1.3: Verify DNS Configuration

- [ ] **A record** points to Vercel (typically `76.76.19.165`)
- [ ] **CNAME (www)** points to `alias.zeit.co`
- [ ] **SSL certificate** active (Vercel auto-issued)
- [ ] **Domain DNS propagation** complete

```bash
# Verify DNS
nslookup synthex.social
# Should show Vercel IP
```
Result: ______________________

### Step 1.4: Verify Supabase Access

- [ ] **Supabase project accessible**
- [ ] **SQL Editor available**
- [ ] **Service role key working**
- [ ] **Backup created** (if applicable)

```sql
-- Test connection
SELECT NOW() as timestamp;
```
Result: ______________________

---

## Phase 2: Database Migration (5 minutes)

### Step 2.1: Run Migration 255

**Location**: `supabase/migrations/255_rbac_roles_and_device_auth.sql`

**Steps**:
1. [ ] Open Supabase Dashboard
2. [ ] Go to SQL Editor
3. [ ] Copy entire migration file
4. [ ] Paste into SQL Editor
5. [ ] Click "Run"
6. [ ] Wait for "✓ Query executed successfully"

**Time**: ~2-3 minutes

### Step 2.2: Verify Migration Success

```sql
-- Check tables created
SELECT COUNT(*) as new_tables FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN (
  'admin_approvals',
  'admin_trusted_devices',
  'admin_access_audit'
);
-- Expected: 3 rows
```
Result: ______________________

```sql
-- Check admin users configured
SELECT email, role FROM profiles
WHERE email IN (
  'phill.mcgurk@gmail.com',
  'support@carsi.com.au',
  'ranamuzamil1199@gmail.com'
);
-- Expected: 3 rows with role = 'admin'
```
Result: ______________________

```sql
-- Check functions created
SELECT routine_name FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN (
  'get_user_role',
  'request_admin_approval',
  'approve_admin_access'
);
-- Expected: 3+ rows
```
Result: ______________________

---

## Phase 3: Deployment (5 minutes)

### Step 3.1: Deploy to Vercel

**Method 1: Git Push (Recommended)**
```bash
# Verify clean git status
git status
# Should show clean working directory

# Push to main (triggers auto-deployment)
git push origin main
```

**Method 2: Vercel CLI**
```bash
npx vercel deploy --prod
```

**Method 3: Vercel Dashboard**
- [ ] Go to Vercel Dashboard
- [ ] Select synthex.social project
- [ ] Click "Deploy" → "Deployments"
- [ ] Select latest commit
- [ ] Click "Redeploy"

**Expected Result**:
- Build succeeds (exit code 0)
- Routes compiled
- Functions deployed
- Environment variables loaded

**Verification**:
```bash
# Monitor deployment
npx vercel list deployments --prod
```
Result: ______________________

### Step 3.2: Verify Deployment Health

- [ ] **Application loads** at https://synthex.social
- [ ] **No 500 errors** in Vercel logs
- [ ] **All environment variables** present
- [ ] **Database connection** working

```bash
# Check Vercel logs
npx vercel logs synthex.social
```
Result: ______________________

---

## Phase 4: Live Testing (30 minutes)

### Test Group 1: Admin Device Approval Flow

#### Test 1.1: New Device Blocked
```
1. Go to https://synthex.social/login
2. Click "Continue with Google"
3. Login as phill.mcgurk@gmail.com
4. Should redirect to /auth/await-approval
5. Should show "Waiting for approval..." message
6. Should show 10-minute countdown timer
```
- [ ] Redirected correctly
- [ ] Countdown visible
- [ ] Timer counts down

**Result**: ✅ / ❌

#### Test 1.2: Approval Email Sent
```
1. (From Test 1.1) Check Phill's email
2. Should receive email from no-reply@synthex.social
3. Subject: "Device Approval Request"
4. Should contain device details (IP, user agent)
5. Should have two buttons:
   - ✓ Approve Device (green)
   - ✕ Deny Request (red)
```
- [ ] Email received
- [ ] Both buttons present
- [ ] Buttons are clickable
- [ ] Links valid

**Result**: ✅ / ❌

#### Test 1.3: Phill Approves Device
```
1. (From Test 1.2) Click "✓ Approve Device" button
2. Should redirect to /admin/approval-result?status=approved
3. Should show green success banner
4. Should display "Device Approved!" message
```
- [ ] Redirected correctly
- [ ] Success message shown
- [ ] Status code: "approved"
- [ ] Button to go to CRM

**Result**: ✅ / ❌

#### Test 1.4: Admin Access Granted
```
1. (From Test 1.3) Click "Go to Admin Dashboard"
2. Should redirect to /crm
3. Should show CRM dashboard
4. Should see navigation menu
5. Should see "Devices" management option
```
- [ ] CRM loads
- [ ] Dashboard visible
- [ ] Navigation functional
- [ ] Device management accessible

**Result**: ✅ / ❌

### Test Group 2: Same Device Second Login

#### Test 2.1: Trusted Device Auto-Approved
```
1. Log out from /crm
2. Go to https://synthex.social/login
3. Click "Continue with Google"
4. Login as phill.mcgurk@gmail.com (same device)
5. Should skip approval entirely
6. Should redirect directly to /crm
7. NO email should be sent
```
- [ ] No approval page shown
- [ ] Direct redirect to /crm
- [ ] No email sent
- [ ] Instant access

**Result**: ✅ / ❌

### Test Group 3: Deny Request Flow

#### Test 3.1: Phill Denies Device
```
1. Have new admin (Claire or Rana) login
2. Wait for approval email to Phill
3. Click "✕ Deny Request" button
4. Should redirect to /admin/approval-result?status=denied
5. Should show red denial message
6. Should say "Device not approved"
```
- [ ] Deny processed
- [ ] Status: "denied"
- [ ] Denial message shown
- [ ] No device trust created

**Result**: ✅ / ❌

#### Test 3.2: Denied Admin Must Re-Request
```
1. (From Test 3.1) Denied admin attempts /crm
2. Should redirect to /auth/await-approval
3. Should allow requesting new approval
4. Fresh approval email sent to Phill
```
- [ ] Forced back to approval page
- [ ] Can request new approval
- [ ] New email sent
- [ ] Process repeats

**Result**: ✅ / ❌

### Test Group 4: Customer Portal Access

#### Test 4.1: Customer Frictionless Access
```
1. Go to https://synthex.social/login
2. Click "Continue with Google"
3. Login as customer user (non-admin email)
4. Should redirect immediately to /synthex/dashboard
5. NO approval email sent
6. NO device approval page shown
7. NO RBAC gating
```
- [ ] Instant redirect to /synthex/dashboard
- [ ] No approval required
- [ ] No email sent
- [ ] Frictionless experience

**Result**: ✅ / ❌

#### Test 4.2: Customer Blocked from /crm
```
1. (From Test 4.1) Customer manually visits /crm
2. Should redirect to /synthex/dashboard
3. Should NOT see CRM content
4. Should NOT see admin controls
```
- [ ] Cannot access /crm
- [ ] Hard redirect to /synthex
- [ ] No error pages
- [ ] Clean redirect

**Result**: ✅ / ❌

### Test Group 5: Security Edge Cases

#### Test 5.1: Token Expiration
```
1. Admin requests approval
2. Wait 10+ minutes
3. Click approve link in old email
4. Should show /admin/approval-result?status=expired
5. Should say "Approval link has expired"
6. Should allow requesting new approval
```
- [ ] Token expiration enforced
- [ ] Status: "expired"
- [ ] Clear error message
- [ ] Can retry

**Result**: ✅ / ❌

#### Test 5.2: Already Approved
```
1. Admin receives approval email
2. Click approve button
3. Click same approve button again (from email)
4. Should show /admin/approval-result?status=already_approved
5. Should say "Device already approved"
```
- [ ] Prevents double-approval
- [ ] Status: "already_approved"
- [ ] Clear message
- [ ] Safe handling

**Result**: ✅ / ❌

#### Test 5.3: Wrong User Approving
```
1. Admin receives approval email sent to Phill
2. Login as different user (not Phill)
3. Click approve link
4. Should show /admin/approval-result?status=unauthorized
5. Should say "Only Phill can approve"
```
- [ ] User verification working
- [ ] Status: "unauthorized"
- [ ] Clear error
- [ ] Secure enforcement

**Result**: ✅ / ❌

### Test Group 6: Device Management

#### Test 6.1: View Trusted Devices
```
1. Login as admin (approved device)
2. Go to /crm/admin/devices
3. Should list all trusted devices
4. Should show:
   - Device fingerprint
   - IP address
   - Trust start date
   - Expiration date
5. Should have "Revoke" button
```
- [ ] Device list loads
- [ ] All info displayed
- [ ] Expiry dates shown
- [ ] Revoke button present

**Result**: ✅ / ❌

#### Test 6.2: Revoke Device
```
1. (From Test 6.1) Click "Revoke" on a device
2. Confirm revocation
3. Device should disappear from list
4. Next login should require new approval
```
- [ ] Revocation processes
- [ ] Device removed from list
- [ ] Forces re-approval
- [ ] Audit logged

**Result**: ✅ / ❌

### Test Summary

**Total Tests**: 13
**Passed**: _____ / 13
**Failed**: _____ / 13

**Status**:
- [ ] All tests passed → **PROCEED TO VERIFICATION**
- [ ] Some tests failed → **TROUBLESHOOT AND RETEST**

---

## Phase 5: Production Verification (20 minutes)

### Step 5.1: Verify Database State

```sql
-- Check recent approvals
SELECT id, user_id, approved, created_at
FROM admin_approvals
ORDER BY created_at DESC
LIMIT 5;
```
Result: ______________________

```sql
-- Check trusted devices
SELECT user_id, device_fingerprint, expires_at
FROM admin_trusted_devices
ORDER BY created_at DESC
LIMIT 5;
```
Result: ______________________

```sql
-- Check audit log
SELECT user_id, action, success, created_at
FROM admin_access_audit
ORDER BY created_at DESC
LIMIT 10;
```
Result: ______________________

### Step 5.2: Verify Email Delivery

- [ ] All approval emails delivered
- [ ] No bounces
- [ ] No spam classification
- [ ] Links all working

**Check with email provider**:
- SendGrid: Go to Activity → Verify delivery status
- Resend: Go to Logs → Verify sent status
- Gmail SMTP: Check sent folder

Result: ______________________

### Step 5.3: Verify Application Health

- [ ] No 500 errors in Vercel logs
- [ ] No TypeScript warnings
- [ ] All middleware checks passing
- [ ] Database queries efficient

```bash
npx vercel logs synthex.social --tail
```

Result: ______________________

### Step 5.4: Monitor Key Metrics

```sql
-- Approval success rate (should be high)
SELECT
  COUNT(*) as total,
  COUNT(CASE WHEN approved = true THEN 1 END) as approved
FROM admin_approvals
WHERE created_at > now() - interval '24 hours';

-- Access patterns (should show admin and customer routes)
SELECT action, COUNT(*)
FROM admin_access_audit
WHERE created_at > now() - interval '24 hours'
GROUP BY action;
```

Result: ______________________

---

## Phase 6: Go-Live Confirmation (5 minutes)

### Step 6.1: Verify All Systems Ready

- [ ] Build successful (exit code 0)
- [ ] Migration completed (all tables present)
- [ ] Environment variables configured
- [ ] All 13 tests passed
- [ ] Email delivery working
- [ ] No errors in logs
- [ ] Database state verified

### Step 6.2: Team Notifications

- [ ] **Notify Phill McGurk**
  - Email: phill.mcgurk@gmail.com
  - Message: RBAC system live, approval requests will be sent to you
  - Action: Acknowledge receipt

- [ ] **Notify Development Team**
  - Current deployment status: LIVE
  - Monitoring: Check logs daily
  - Support: Troubleshooting guide available

- [ ] **Document Deployment**
  - Date deployed: _______________
  - Deployed by: _______________
  - Build version: _______________
  - Notes: _______________

### Step 6.3: Enable Production Monitoring

- [ ] **Set up monitoring queries** (run daily)
  ```sql
  -- Daily morning check
  SELECT COUNT(*) as pending_approvals
  FROM admin_approvals
  WHERE approved = false AND expires_at > now();
  ```

- [ ] **Configure alerts**
  - Alert on > 3 denials from same IP in 24h
  - Alert on unknown device attempts
  - Alert on email delivery failures

- [ ] **Document escalation path**
  - Critical issue → Contact Phill + Engineering
  - Non-critical → Add to incident log
  - Security issue → Immediate escalation

---

## Rollback Plan

If deployment needs to be rolled back:

### Quick Rollback (< 5 minutes)

```bash
# Option 1: Vercel Rollback
1. Go to Vercel Dashboard
2. Select synthex.social
3. Go to Deployments
4. Click "..." on previous successful deploy
5. Select "Rollback to this Deployment"

# Option 2: Git Rollback
git revert <commit-hash>
git push origin main
# Vercel auto-deploys previous version
```

### Database Rollback (if migration issues)

```sql
-- DO NOT drop tables in production
-- Instead, disable RLS temporarily:
ALTER TABLE admin_approvals DISABLE ROW LEVEL SECURITY;
ALTER TABLE admin_trusted_devices DISABLE ROW LEVEL SECURITY;
ALTER TABLE admin_access_audit DISABLE ROW LEVEL SECURITY;

-- Back up data
SELECT * FROM admin_approvals INTO admin_approvals_backup;

-- Fix issue
-- Re-enable RLS
ALTER TABLE admin_approvals ENABLE ROW LEVEL SECURITY;
```

**Rollback Contact**: [Engineering Lead]

---

## Success Criteria

### ✅ Deployment is Successful When:

- [ ] Build passes (exit code 0)
- [ ] All 13 tests pass
- [ ] Admins receive approval emails
- [ ] Approval links work correctly
- [ ] Device trust persists
- [ ] Customers bypass device approval
- [ ] Audit logs complete
- [ ] No errors in production logs
- [ ] Email delivery working
- [ ] Database verified
- [ ] Team notified
- [ ] Monitoring enabled

### ✅ System is Stable When:

- [ ] 24 hours with no critical errors
- [ ] Approval success rate > 95%
- [ ] Email delivery > 99%
- [ ] Response times normal
- [ ] No security incidents

---

## Documentation & References

**For Deployment Help**:
- 📖 [RBAC_SYNTHEX_SOCIAL_DEPLOYMENT.md](./RBAC_SYNTHEX_SOCIAL_DEPLOYMENT.md)

**For Testing Details**:
- 📖 [RBAC_PRE_DEPLOYMENT_VERIFICATION.md](./RBAC_PRE_DEPLOYMENT_VERIFICATION.md)

**For Troubleshooting**:
- 📖 [RBAC_PRE_DEPLOYMENT_VERIFICATION.md](./RBAC_PRE_DEPLOYMENT_VERIFICATION.md) (Issues section)

**For Quick Reference**:
- 📖 [RBAC_QUICK_REFERENCE.md](./RBAC_QUICK_REFERENCE.md)

**For Architecture Details**:
- 📖 [RBAC_ARCHITECTURE_GUIDE.md](./RBAC_ARCHITECTURE_GUIDE.md)

---

## Deployment Sign-Off

**Deployment Authorized By**: _______________________
**Date**: _______________________
**Time**: _______________________

**Deployed By**: _______________________
**Build Version**: _______________________
**Commit Hash**: _______________________

**Verification Completed By**: _______________________
**All Tests Passed**: ✅ Yes / ❌ No
**Date Verified**: _______________________

**Production Status**:
- [ ] ✅ LIVE - All systems operational
- [ ] ⚠️ LIVE WITH ISSUES - See notes below
- [ ] ❌ ROLLED BACK - See rollback reason

**Notes**:
```
[Deployment notes, issues, or special observations]
```

---

**Status**: ✅ **READY FOR DEPLOYMENT**

**Next Action**: Begin Phase 1 pre-deployment verification

---

Generated: 2025-11-26
Document Version: 1.0
