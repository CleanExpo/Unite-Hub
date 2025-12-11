# Guardian G32 Testing Guide

**Quick Start Guide for Testing Guardian Access Levels**

---

## 🚀 Quick Test (5 minutes)

### Step 1: Set Your Role to Admin

1. Open Supabase Dashboard → Authentication → Users
2. Find your user account
3. Click "..." → "Edit User"
4. Add to User Metadata:
```json
{
  "guardian_role": "guardian_admin"
}
```
5. Click "Save"

### Step 2: Test All Guardian Pages

Open these URLs in your browser (dev server must be running on port 3008):

1. **Telemetry**: http://localhost:3008/guardian/telemetry
   - ✅ Should load successfully (all roles allowed)

2. **Warehouse**: http://localhost:3008/guardian/warehouse
   - ✅ Should load successfully (analyst+ only)

3. **Replay**: http://localhost:3008/guardian/replay
   - ✅ Should load successfully (analyst+ only)

4. **Scenarios**: http://localhost:3008/guardian/scenarios
   - ✅ Should load successfully (admin only)

### Step 3: Test Viewer Role

1. Change your role to `guardian_viewer`:
```json
{
  "guardian_role": "guardian_viewer"
}
```

2. Refresh browser pages:
   - Telemetry: ✅ Should still work
   - Warehouse: ❌ Should show 403 error
   - Replay: ❌ Should show 403 error
   - Scenarios: ❌ Should show 403 error

---

## 📋 Detailed Testing

### Test Files Created

1. **Test Plan**: `tests/guardian-access-levels.test.md`
   - Comprehensive test cases for all scenarios
   - API testing with curl commands
   - Browser testing checklist

2. **Test Script**: `scripts/test-guardian-access.mjs`
   - Automated test runner
   - Run with: `node scripts/test-guardian-access.mjs`

3. **Setup SQL**: `scripts/setup-guardian-test-users.sql`
   - SQL commands to create test users
   - Run in Supabase SQL Editor

### Manual Browser Testing

#### Test as Viewer
```
guardian_role: "guardian_viewer"

Expected Access:
- ✅ Telemetry
- ❌ Warehouse (403)
- ❌ Replay (403)
- ❌ Scenarios (403)
```

#### Test as Analyst
```
guardian_role: "guardian_analyst"

Expected Access:
- ✅ Telemetry
- ✅ Warehouse
- ✅ Replay
- ❌ Scenarios (403)
```

#### Test as Admin
```
guardian_role: "guardian_admin"

Expected Access:
- ✅ Telemetry
- ✅ Warehouse
- ✅ Replay
- ✅ Scenarios
```

---

## 🔍 API Testing with curl

### Get Your Auth Token

1. Open browser DevTools (F12)
2. Go to Application → Cookies
3. Copy `sb-access-token` value

### Test Endpoints

```bash
# Replace <TOKEN> with your actual token

# Telemetry (all roles)
curl -H "Cookie: sb-access-token=<TOKEN>" \
  http://localhost:3008/api/guardian/telemetry

# Warehouse (analyst+ only)
curl -H "Cookie: sb-access-token=<TOKEN>" \
  http://localhost:3008/api/guardian/warehouse

# Replay (analyst+ only)
curl -H "Cookie: sb-access-token=<TOKEN>" \
  http://localhost:3008/api/guardian/replay

# Scenarios (admin only)
curl -H "Cookie: sb-access-token=<TOKEN>" \
  http://localhost:3008/api/guardian/scenarios
```

---

## ✅ Expected Responses

### Success (200 OK)

**Telemetry**:
```json
{
  "streams": [],
  "events": []
}
```

**Warehouse**:
```json
{
  "events": [],
  "hourly": [],
  "daily": [],
  "summary": {
    "total_warehouse_events": 0,
    "distinct_stream_keys": 0,
    "stream_keys": []
  }
}
```

**Replay**:
```json
{
  "sessions": [],
  "events": [],
  "activeSessionId": null,
  "eventCount": 0
}
```

**Scenarios**:
```json
{
  "scenarios": [],
  "runs": [],
  "events": [],
  "activeScenarioId": null,
  "activeRunId": null
}
```

### Access Denied (403 Forbidden)

```json
{
  "error": "Guardian [endpoint] access denied."
}
```

### Unauthenticated (401 Unauthorized)

```json
{
  "error": "Guardian [endpoint] requires an authenticated founder context."
}
```

---

## 🐛 Troubleshooting

### Issue: All endpoints return 401

**Solution**: You're not logged in
1. Go to http://localhost:3008/login
2. Sign in with your Supabase credentials
3. Try again

### Issue: All endpoints return 403

**Solution**: Your role is guardian_viewer (default)
1. Open Supabase Dashboard
2. Update your user metadata to include guardian_role
3. Refresh your browser

### Issue: Can't access scenarios even as admin

**Solution**: Check your role spelling
- Must be exactly: `"guardian_admin"` (lowercase)
- Not: `"Guardian_Admin"` or `"GUARDIAN_ADMIN"`

### Issue: Changes not taking effect

**Solution**: Clear browser cache
1. Open DevTools (F12)
2. Right-click refresh button
3. Select "Empty Cache and Hard Reload"

---

## 📊 Quick Verification Checklist

- [ ] Dev server running on port 3008
- [ ] User has guardian_role in metadata
- [ ] Browser logged in (check cookies)
- [ ] Telemetry works for all roles
- [ ] Warehouse blocked for viewers
- [ ] Scenarios blocked for non-admins
- [ ] 403 errors have correct message format
- [ ] 200 responses have unchanged data shape

---

## 🎯 Success Criteria

### G32 is working correctly if:

1. ✅ Viewer can access telemetry only
2. ✅ Analyst can access telemetry + warehouse + replay
3. ✅ Admin can access all Guardian features
4. ✅ 403 returned with stable error message for insufficient role
5. ✅ 401 returned for unauthenticated requests
6. ✅ Response shapes unchanged from pre-G32
7. ✅ No breaking changes for existing authorized users

---

## 📝 Test Results

After testing, update your results:

| Role | Telemetry | Warehouse | Replay | Scenarios |
|------|-----------|-----------|--------|-----------|
| Viewer | [ ] Pass | [ ] Pass | [ ] Pass | [ ] Pass |
| Analyst | [ ] Pass | [ ] Pass | [ ] Pass | [ ] Pass |
| Admin | [ ] Pass | [ ] Pass | [ ] Pass | [ ] Pass |
| No Auth | [ ] Pass | [ ] Pass | [ ] Pass | [ ] Pass |

---

**Testing Date**: _______________
**Tester**: _______________
**Environment**: Development (localhost:3008)
**Status**: [ ] Pass [ ] Fail

**Notes**:
_______________________________________
_______________________________________
_______________________________________

---

**Last Updated**: December 10, 2025
**Phase**: Guardian G32 - Access Levels
