# API Endpoint Audit - Quick Summary

**Date**: 2025-11-19
**Status**: 95% Complete
**Action Required**: 7 endpoints need fixes

---

## Critical Issues (Fix Before Production)

### 1. Path Mismatches (Frontend calling wrong URLs)

**Issue**: Frontend calls don't match backend route paths

| Frontend Call | Backend Route | Fix |
|---------------|---------------|-----|
| `/api/stripe/create-checkout` | `/api/stripe/checkout` ✅ | Update frontend path |
| `/api/stripe/create-portal-session` | `/api/subscription/portal` ✅ | Update frontend path |

**Files to edit**:
- `src/app/dashboard/billing/page.tsx:79` (line 79)
- `src/app/dashboard/billing/page.tsx:109` (line 109)

**Time**: 5 minutes
**Impact**: Billing/subscription features broken

---

### 2. Missing Routes (404 errors)

| Endpoint | Status | Impact |
|----------|--------|--------|
| `/api/auth/signup` | ❌ Missing | User signup broken |
| `/api/mindmap/[mindmapId]/suggestions` | ❌ Missing | AI suggestions broken |
| `/api/clients/[clientId]/social-templates` | ❌ Missing | Template library broken |
| `/api/clients/[clientId]/social-templates/seed` | ❌ Missing | Seed button broken |

**Time**: 4-6 hours total
**Impact**: Core features broken

---

### 3. Incomplete Implementation

| Endpoint | Issue | Status |
|----------|-------|--------|
| `/api/emails/send` | Email not actually sent (only logs) | ⚠️ Fake success |

**File**: `src/app/api/emails/send/route.ts:74-83`
**Time**: 2-4 hours
**Impact**: Critical - emails don't send

---

## Health Report

- **Total Endpoints**: 150
- **Working**: 143 (95%)
- **Missing**: 4 (3%)
- **Path Mismatches**: 3 (2%)
- **Incomplete**: 2 (1%)

---

## Fix Priority

### P0 - Must Fix (4-6 hours)
1. ✅ Fix path mismatches in billing page (5 min)
2. ⚠️ Implement email sending (2-4 hrs)
3. ❌ Create `/api/auth/signup` route (1-2 hrs)

### P1 - Should Fix (3-4 hours)
4. ❌ Create client social templates routes (2-3 hrs)
5. ❌ Create mindmap suggestions route (1-2 hrs)

### P2 - Nice to Have (4-6 hours)
6. ⚠️ Integrate Gmail OAuth for emails (4-6 hrs)

---

## Quick Fixes

### Fix 1: Update Billing Paths (5 minutes)

```typescript
// src/app/dashboard/billing/page.tsx

// Line 79 - CHANGE FROM:
const response = await fetch("/api/stripe/create-checkout", {

// TO:
const response = await fetch("/api/stripe/checkout", {

// Line 109 - CHANGE FROM:
const response = await fetch("/api/stripe/create-portal-session", {

// TO:
const response = await fetch("/api/subscription/portal", {
```

---

## Testing Checklist

After fixes, test these flows:
- [ ] User signup
- [ ] Billing checkout
- [ ] Manage subscription
- [ ] Send email (verify received)
- [ ] Load social templates
- [ ] Seed templates button
- [ ] AI suggestions in mindmap

---

## Full Report

See `API_ENDPOINT_AVAILABILITY_AUDIT_REPORT.md` for:
- Complete endpoint inventory
- Implementation templates
- Detailed code examples
- All 150 endpoints analyzed
