# Broken & Incomplete Functionality Audit
**Generated:** 2025-11-15
**Status:** In Progress

## ✅ **FIXED Issues**

### 1. Select Uncontrolled-to-Controlled Warning
**File:** `src/components/client/ClientSelector.tsx:24`
**Issue:** `value={currentClientId || undefined}` caused React warning
**Fix:** Changed to `value={currentClientId || ""}`
**Status:** ✅ FIXED

### 2. Profile Update 401 Unauthorized
**File:** `src/app/api/profile/update/route.ts`
**Issue:** Server-side Supabase client couldn't validate localStorage tokens from implicit OAuth
**Fix:** Use browser Supabase client to validate Authorization header tokens
**Status:** ✅ FIXED

### 3. Database Schema Mismatch - user_profiles Table
**Issue:** UI trying to save fields that don't exist in database
**Missing columns:** username, business_name, phone, bio, website, timezone, notification_preferences
**Fix:** Created migration `supabase/migrations/004_add_profile_fields.sql`
**Status:** ✅ MIGRATION CREATED (needs to be applied to database)

---

## ⚠️ **CRITICAL ISSUES** (Discovered from logs and code audit)

### 4. Invalid UUID Error - "default-org" String
**Affected:** Multiple API endpoints
**Error:** `invalid input syntax for type uuid: "default-org"`
**Source:** `src/app/dashboard/layout.tsx:46` sets orgId to DEMO_ORG_ID constant
**Impact:** Calendar events API and other workspace-scoped endpoints fail
**Frequency:** Recurring in logs (10+ occurrences)
**Fix Needed:** Replace demo mode string ID with actual UUID

### 5. Contact Intelligence API 401 Errors
**Endpoint:** `/api/agents/contact-intelligence`
**Frequency:** Multiple 401 errors in logs
**Likely Cause:** Same authentication issue as profile update (fixed pattern can be applied)
**Status:** ⚠️ NEEDS FIX

### 6. Missing user_onboarding Table
**Error:** `PGRST205: Could not find the table 'public.user_onboarding' in the schema cache`
**Handling:** Gracefully handled in `src/contexts/OnboardingContext.tsx`
**Impact:** Onboarding flow won't work
**Status:** ⚠️ NON-CRITICAL (gracefully fails)

---

## 🔍 **INCOMPLETE FEATURES** (From UI Audit)

### 7. Profile Page - Avatar Upload/Delete
**File:** `src/app/dashboard/profile/page.tsx:261-336`
**Endpoints:** `/api/profile/avatar` (POST, DELETE)
**Status:** UI exists, endpoints may not be implemented
**Action Needed:** Test avatar upload and verify endpoint exists

### 8. Hot Leads Panel - Contact Intelligence
**Component:** Hot leads display on dashboard
**API:** `/api/agents/contact-intelligence`
**Status:** Returns 401 errors (authentication issue)
**Action Needed:** Apply same auth fix as profile update

---

## 📝 **MIGRATION NEEDED**

### Apply Profile Fields Migration
**File:** `supabase/migrations/004_add_profile_fields.sql`
**Columns to add:**
- username TEXT UNIQUE
- business_name TEXT
- phone TEXT
- bio TEXT (max 500 chars)
- website TEXT (must start with http:// or https://)
- timezone TEXT DEFAULT 'UTC'
- notification_preferences JSONB

**How to apply:**
1. Go to Supabase Dashboard → SQL Editor
2. Copy and paste the migration SQL
3. Run the migration
4. Verify columns were added: `SELECT column_name FROM information_schema.columns WHERE table_name = 'user_profiles';`

---

## 🚨 **ACTION ITEMS** (Priority Order)

1. **HIGH:** Apply profile fields migration to Supabase database
2. **HIGH:** Fix "default-org" UUID issue in demo mode
3. **MEDIUM:** Fix contact intelligence API 401 errors
4. **MEDIUM:** Test and verify avatar upload/delete endpoints
5. **LOW:** Consider adding user_onboarding table (if onboarding feature is needed)

---

## 📊 **Test Results**

### Profile Update Flow
- ✅ Edit Profile button works
- ✅ Form fields are editable
- ✅ Save button triggers API call
- ✅ Authentication passes (no more 401)
- ⚠️ Save fails with 500 until migration is applied
- ⏳ After migration: needs full end-to-end test

### Dashboard Overview
- ⚠️ Hot Leads Panel returns 401
- ⚠️ Calendar events fail with UUID error
- ✅ Page renders without crashing
- ✅ Navigation works

---

## 📌 **Notes**

- All fixes maintain backward compatibility
- No breaking changes introduced
- Migration is idempotent (safe to run multiple times)
- Authorization header pattern can be reused for other API routes
