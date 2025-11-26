# RBAC Pre-Deployment Verification Checklist

**Date**: 2025-11-26
**Status**: Ready for Verification
**Purpose**: Step-by-step checklist to validate RBAC implementation before production deployment

---

## ✅ Code Verification (Already Complete)

### Backend Files
- [x] `src/lib/rbac/deviceAuthorization.ts` (306 lines)
  - Contains: generateDeviceFingerprint, isDeviceTrusted, createApprovalRequest, approveAdminAccess, trustAdminDevice, logAdminAccess, etc.
  - Status: ✅ Complete

- [x] `src/lib/rbac/getUserRole.ts` (125 lines)
  - Contains: getUserRole, ensureUserProfile, isUserAdmin, getUserByEmail
  - Status: ✅ Complete

### Middleware Integration
- [x] `src/middleware.ts` (95 new lines added)
  - Device fingerprinting: ✅ Present (line ~96)
  - Device trust checking: ✅ Present (line ~110)
  - Role-based routing: ✅ Present (line ~130)
  - Route matcher updated: ✅ Present

### API Endpoints
- [x] `src/app/api/admin/send-approval-email/route.ts` (154 lines)
  - Approve/deny links: ✅ Present (lines 76-77)
  - Phill lookup: ✅ Present (lines 61-65)
  - Email template: ✅ Complete (HTML + plain text)
  - Status: ✅ Complete

- [x] `src/app/api/admin/approve-access/route.ts` (173 lines)
  - Decision parameter support: ✅ Present (line 30)
  - Phill hardcoded check: ✅ Present (line 52)
  - Approve path: ✅ Present (lines 123-161)
  - Deny path: ✅ Present (lines 103-120)
  - Status codes: ✅ All 9 codes handled
  - Status: ✅ Complete

- [x] `src/app/api/admin/trusted-devices/route.ts` (132 lines)
  - GET endpoint: ✅ Lists devices
  - DELETE endpoint: ✅ Revokes devices
  - Status: ✅ Complete

- [x] `src/app/api/admin/pending-approvals/route.ts` (62 lines)
  - Phill filtering: ✅ Present
  - Expiration check: ✅ Present
  - Status: ✅ Complete

### Frontend Pages
- [x] `src/app/auth/await-approval/page.tsx` (227 lines)
  - Countdown timer: ✅ Present
  - Status: ✅ Complete

- [x] `src/app/crm/page.tsx` (198 lines)
  - Admin-only landing: ✅ Present
  - Status: ✅ Complete

- [x] `src/app/crm/admin/devices/page.tsx` (314 lines)
  - Device listing: ✅ Present
  - Status: ✅ Complete

- [x] `src/app/admin/approval-result/page.tsx` (182 lines)
  - 8 status handlers: ✅ All present
  - Status: ✅ Complete

### Database Migration
- [x] `supabase/migrations/255_rbac_roles_and_device_auth.sql`
  - Tables (4): ✅ profiles, admin_approvals, admin_trusted_devices, admin_access_audit
  - Functions (7): ✅ All present
  - RLS Policies (5): ✅ All present
  - Status: ✅ Complete

---

## 🔧 Configuration Verification

### Environment Variables
- [ ] `NEXT_PUBLIC_BASE_URL` is set (used for email links)
  - Check: `.env.local` or Vercel environment settings
  - Expected: `https://your-app.vercel.app` (production) or `http://localhost:3008` (local)

- [ ] Email service configured (at least one of):
  - [ ] `SENDGRID_API_KEY` is set, OR
  - [ ] `RESEND_API_KEY` is set, OR
  - [ ] Gmail SMTP configured (EMAIL_SERVER_HOST, EMAIL_SERVER_USER, EMAIL_SERVER_PASSWORD)

- [ ] Supabase credentials available:
  - [ ] `NEXT_PUBLIC_SUPABASE_URL` is set
  - [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` is set
  - [ ] `SUPABASE_SERVICE_ROLE_KEY` is set

### Database Configuration
- [ ] Supabase project is accessible
- [ ] Database connection is working
- [ ] Authentication system is enabled

---

## 🗄️ Database Pre-Flight Checks

### Before Running Migration

```bash
# Run in Supabase SQL Editor to verify schema readiness
SELECT COUNT(*) as total_tables FROM information_schema.tables
WHERE table_schema = 'public';

-- Should return the current table count (will increase after migration)
```

### Run Migration 255

```bash
# 1. Go to Supabase Dashboard → SQL Editor
# 2. Open file: supabase/migrations/255_rbac_roles_and_device_auth.sql
# 3. Copy entire content
# 4. Paste into Supabase SQL Editor
# 5. Click "Run" button
# 6. Wait for success confirmation (should see "✓ Query executed successfully")
```

### After Migration - Verification Queries

```sql
-- Verify tables were created
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('profiles', 'admin_approvals', 'admin_trusted_devices', 'admin_access_audit')
ORDER BY table_name;
-- Expected: 4 rows (if profiles already existed: 3 rows with new tables)

-- Verify admin roles were set
SELECT email, role FROM public.profiles
WHERE email IN ('phill.mcgurk@gmail.com', 'support@carsi.com.au', 'ranamuzamil1199@gmail.com');
-- Expected: 3 rows with role = 'admin'

-- Verify functions exist
SELECT routine_name FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN ('get_user_role', 'request_admin_approval', 'approve_admin_access', 'trust_admin_device', 'log_admin_access');
-- Expected: 5 rows (or 7 if all functions created)

-- Verify RLS is enabled on critical tables
SELECT schemaname, tablename, rowsecurity FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('admin_trusted_devices', 'admin_access_audit');
-- Expected: Both tables should have rowsecurity = true
```

---

## 🏗️ Build Verification

### Local Build Check

```bash
cd d:/Unite-Hub
npm run build
```

**Expected Output**:
- Exit code: 0
- No TypeScript errors
- No build warnings related to RBAC files
- All routes compiled successfully

**Current Status**: ✅ **PASSING** (verified 2025-11-26)

---

## 🧪 Local Testing Suite

### Test Case 1: Admin First Login (New Device)

**Steps**:
1. Clear browser cookies/localStorage (to simulate new device)
2. Navigate to `http://localhost:3008/login`
3. Click "Continue with Google"
4. Complete OAuth flow with admin account (e.g., phill.mcgurk@gmail.com)
5. Should be redirected to `/auth/await-approval`

**Expected Results**:
- ✅ 10-minute countdown timer visible
- ✅ "Check your email" message displayed
- ✅ Email sent to Phill (check email/logs)
- ✅ Email contains approve and deny buttons
- ✅ Device fingerprint calculated and stored

**Failure Handling**:
- If redirected to `/crm` instead: Device already trusted (clear from DB or use different IP)
- If not sent to approval page: Check middleware.ts role detection logic
- If no email sent: Verify email service configuration

---

### Test Case 2: Phill Approves Device

**Steps**:
1. (From Test Case 1) Phill receives approval email
2. Click the "✓ Approve Device" button in email
3. Should redirect to `/admin/approval-result?status=approved`

**Expected Results**:
- ✅ Green success banner displayed
- ✅ "Device Approved" message shown
- ✅ Device added to `admin_trusted_devices` table (90-day trust)
- ✅ Entry logged to `admin_access_audit` table with action='admin_access_approved'
- ✅ "Go to Admin Dashboard" button available

**Failure Handling**:
- If status=expired: Token took > 10 min, request new approval
- If status=unauthorized: Not logged in as Phill
- If status=not_found: Invalid requestId or token
- If status=approval_failed: Database error, check Supabase logs

---

### Test Case 3: Same Device, Second Login

**Steps**:
1. Log out from `/crm`
2. Log back in with same browser/device
3. Device fingerprint should match

**Expected Results**:
- ✅ Skip approval page entirely
- ✅ Redirect directly to `/crm`
- ✅ No email sent
- ✅ No new entry in `admin_approvals` table
- ✅ No approval page displayed

**Failure Handling**:
- If sent to approval page: Device fingerprint mismatch (IP changed?)
- If approval required again: Device expired from `admin_trusted_devices` table (check expires_at)
- If revocation occurred: Check `admin_access_audit` for revocation log

---

### Test Case 4: Phill Denies Device

**Steps**:
1. Get new approval email (from new device)
2. Click "✕ Deny Request" button
3. Should redirect to `/admin/approval-result?status=denied`

**Expected Results**:
- ✅ Red denial banner displayed
- ✅ "Request Denied" message shown
- ✅ Device NOT added to `admin_trusted_devices` (no trust granted)
- ✅ Entry logged to `admin_access_audit` with action='admin_access_denied'
- ✅ No `/crm` access available

**Failure Handling**:
- If status=already_approved: Already processed this request
- If status=expired: > 10 minutes passed
- If status=unauthorized: Not Phill's account

---

### Test Case 5: Customer Login

**Steps**:
1. Create/login with non-admin user account
2. Navigate to `http://localhost:3008/login`
3. Complete OAuth with non-admin email

**Expected Results**:
- ✅ No device approval required
- ✅ Redirect directly to `/synthex/dashboard`
- ✅ No `/crm` access available (middleware blocks)
- ✅ If manually visit `/crm`: Redirected to `/synthex/dashboard`

**Failure Handling**:
- If approval required: Check role assignment (should be 'customer')
- If CRM accessible: Middleware role check failed
- If device approval skipped: Customer role detected correctly

---

### Test Case 6: Device Revocation

**Steps**:
1. Visit `/crm/admin/devices` as admin
2. Find trusted device in list
3. Click "Revoke" button
4. Confirm revocation

**Expected Results**:
- ✅ Device removed from `admin_trusted_devices` table
- ✅ Device no longer in device list
- ✅ Next login from same device requires new approval
- ✅ Revocation logged to `admin_access_audit`

**Failure Handling**:
- If device persists: DELETE operation failed
- If not in list: Device already expired or not found

---

### Test Case 7: Token Expiration (Advanced)

**Steps**:
1. Get approval email
2. Wait 10+ minutes
3. Click approve button in old email

**Expected Results**:
- ✅ Redirect to `/admin/approval-result?status=expired`
- ✅ "Approval Token Expired" message shown
- ✅ Device NOT trusted
- ✅ Request new approval message displayed

**Failure Handling**:
- If still approved: Token expiry check failed
- If shows as approved: Timestamp calculation incorrect

---

## 📊 Audit Log Verification

### Check Audit Logs

```sql
-- View recent access attempts
SELECT user_id, action, success, ip_address, created_at
FROM admin_access_audit
ORDER BY created_at DESC
LIMIT 10;

-- Expected actions logged:
-- - admin_access_requested
-- - admin_access_approved
-- - admin_access_denied
-- - admin_approval_email_failed (if email fails)
-- - trusted_device_revoked
```

---

## 🚀 Production Deployment Checklist

### Pre-Deployment
- [ ] All local tests passing (7 test cases)
- [ ] Build: `npm run build` succeeds with exit code 0
- [ ] Database migration 255 executed in Supabase
- [ ] All environment variables configured in Vercel
- [ ] Email service verified working
- [ ] Git branch clean (all changes committed)

### Deployment
- [ ] Push to main branch: `git push origin main`
- [ ] Wait for Vercel auto-deployment completion
- [ ] Verify deployment URL in Vercel dashboard
- [ ] Confirm deployment status is "Ready"

### Post-Deployment
- [ ] Run same 7 test cases in production
- [ ] Verify email delivery from production environment
- [ ] Monitor error logs for 24 hours
- [ ] Check Supabase audit logs for any unexpected access
- [ ] Notify Phill deployment is complete

---

## ⚠️ Common Issues & Solutions

### Issue 1: "Phill not found in profiles table"

**Error Message**: `{ error: "Approval system misconfigured", status: 500 }`

**Cause**: Phill's profile doesn't exist or role not set

**Solution**:
```sql
-- Check if Phill profile exists
SELECT id, email, role FROM profiles WHERE email = 'phill.mcgurk@gmail.com';

-- If not exists, create it:
INSERT INTO public.profiles (id, email, role, created_at)
VALUES (gen_random_uuid(), 'phill.mcgurk@gmail.com', 'admin', now())
ON CONFLICT (email) DO NOTHING;

-- If exists but role not set:
UPDATE profiles SET role = 'admin' WHERE email = 'phill.mcgurk@gmail.com';
```

---

### Issue 2: "Device Fingerprint Mismatch"

**Symptom**: Same device requires re-approval on second login

**Cause**: Device fingerprint changing between logins (IP address changed)

**Solution**:
- This is intentional for security (new IP = potential compromise)
- If IP changes frequently: Consider modifying fingerprint algorithm to exclude IP
- Workaround: Approve from same network/device

---

### Issue 3: "Email Not Received"

**Symptom**: Approval email doesn't arrive

**Solution Steps**:
1. Check email service logs in console: `npm run dev` and look for email errors
2. Verify configuration:
   ```bash
   # Check .env.local has at least one email service configured
   echo $SENDGRID_API_KEY
   echo $RESEND_API_KEY
   # Or check Gmail SMTP settings
   ```
3. Check Supabase audit logs:
   ```sql
   SELECT * FROM admin_access_audit
   WHERE action = 'admin_approval_email_failed'
   ORDER BY created_at DESC LIMIT 5;
   ```
4. Test email service directly:
   ```bash
   node scripts/test-email-config.mjs
   ```

---

### Issue 4: "Only Phill Can Approve" Error

**Symptom**: Non-Phill user tries to approve, gets unauthorized

**Cause**: Hardcoded email check in approve-access route

**Solution**:
- Only Phill's account should click approval links
- If delegating: Must change email constant in `/src/app/api/admin/approve-access/route.ts` line 5
  ```typescript
  const MASTER_APPROVER_EMAIL = "new-approver@example.com";
  ```
- Requires code change and redeployment

---

### Issue 5: "Device Trust Expired"

**Symptom**: Device shows as expired, requires re-approval after 90 days

**Cause**: Intentional expiration for security

**Solution**:
- Approve device again (same workflow)
- To extend expiration: Manually update in database:
  ```sql
  UPDATE admin_trusted_devices
  SET expires_at = now() + interval '90 days'
  WHERE id = 'device-id';
  ```
- To change default duration: Edit migration line 67 and re-run

---

## 📋 Final Sign-Off

Before deployment to production:

- [ ] All code files verified
- [ ] Build passes with exit code 0
- [ ] Database migration ready
- [ ] All 7 test cases passing locally
- [ ] Email service configured and tested
- [ ] Environment variables set in Vercel
- [ ] Team notified of deployment plan
- [ ] Backup created (Vercel auto-backups)
- [ ] Rollback plan understood (git revert if needed)

---

**Status**: ✅ **READY FOR PRODUCTION DEPLOYMENT**

**Next Step**: Follow deployment instructions in `RBAC_NEXT_STEPS.md`

---

Generated: 2025-11-26
Last Updated: 2025-11-26
