# Guardian G32 Access Levels Test Plan

**Date**: December 10, 2025
**Phase**: G32 - Guardian Access Levels
**Objective**: Verify role-based access control across all Guardian APIs

---

## Test Setup

### Prerequisites
1. ✅ Next.js dev server running on port 3008
2. ✅ Supabase connection configured
3. ✅ Test users with different Guardian roles

### Test Users Required

**User 1: Viewer** (guardian_viewer)
```sql
UPDATE auth.users
SET raw_user_meta_data = jsonb_set(
  COALESCE(raw_user_meta_data, '{}'::jsonb),
  '{guardian_role}',
  '"guardian_viewer"'
)
WHERE email = 'viewer@test.com';
```

**User 2: Analyst** (guardian_analyst)
```sql
UPDATE auth.users
SET raw_user_meta_data = jsonb_set(
  COALESCE(raw_user_meta_data, '{}'::jsonb),
  '{guardian_role}',
  '"guardian_analyst"'
)
WHERE email = 'analyst@test.com';
```

**User 3: Admin** (guardian_admin)
```sql
UPDATE auth.users
SET raw_user_meta_data = jsonb_set(
  COALESCE(raw_user_meta_data, '{}'::jsonb),
  '{guardian_role}',
  '"guardian_admin"'
)
WHERE email = 'admin@test.com';
```

**User 4: No Role** (defaults to guardian_viewer)
```sql
-- User with no guardian_role set (should default to viewer)
```

---

## Test Cases

### Test 1: Telemetry API Access (All Roles Allowed)

**Endpoint**: `GET /api/guardian/telemetry`

#### 1.1 Viewer Access
```bash
curl -X GET "http://localhost:3008/api/guardian/telemetry" \
  -H "Cookie: sb-access-token=<viewer-token>"
```
**Expected**: ✅ 200 OK with telemetry data

#### 1.2 Analyst Access
```bash
curl -X GET "http://localhost:3008/api/guardian/telemetry" \
  -H "Cookie: sb-access-token=<analyst-token>"
```
**Expected**: ✅ 200 OK with telemetry data

#### 1.3 Admin Access
```bash
curl -X GET "http://localhost:3008/api/guardian/telemetry" \
  -H "Cookie: sb-access-token=<admin-token>"
```
**Expected**: ✅ 200 OK with telemetry data

#### 1.4 Unauthenticated Access
```bash
curl -X GET "http://localhost:3008/api/guardian/telemetry"
```
**Expected**: ❌ 401 Unauthorized

---

### Test 2: Warehouse API Access (Analyst+ Only)

**Endpoint**: `GET /api/guardian/warehouse`

#### 2.1 Viewer Access (Should Fail)
```bash
curl -X GET "http://localhost:3008/api/guardian/warehouse" \
  -H "Cookie: sb-access-token=<viewer-token>"
```
**Expected**: ❌ 403 Forbidden
**Error**: `{ error: 'Guardian warehouse access denied.' }`

#### 2.2 Analyst Access (Should Succeed)
```bash
curl -X GET "http://localhost:3008/api/guardian/warehouse" \
  -H "Cookie: sb-access-token=<analyst-token>"
```
**Expected**: ✅ 200 OK with warehouse data

#### 2.3 Admin Access (Should Succeed)
```bash
curl -X GET "http://localhost:3008/api/guardian/warehouse" \
  -H "Cookie: sb-access-token=<admin-token>"
```
**Expected**: ✅ 200 OK with warehouse data

---

### Test 3: Replay API Access (Analyst+ Only)

**Endpoint**: `GET /api/guardian/replay`

#### 3.1 Viewer Access (Should Fail)
```bash
curl -X GET "http://localhost:3008/api/guardian/replay" \
  -H "Cookie: sb-access-token=<viewer-token>"
```
**Expected**: ❌ 403 Forbidden
**Error**: `{ error: 'Guardian replay access denied.' }`

#### 3.2 Analyst Access (Should Succeed)
```bash
curl -X GET "http://localhost:3008/api/guardian/replay" \
  -H "Cookie: sb-access-token=<analyst-token>"
```
**Expected**: ✅ 200 OK with replay data

#### 3.3 Admin Access (Should Succeed)
```bash
curl -X GET "http://localhost:3008/api/guardian/replay" \
  -H "Cookie: sb-access-token=<admin-token>"
```
**Expected**: ✅ 200 OK with replay data

---

### Test 4: Scenarios API Access (Admin Only)

**Endpoint**: `GET /api/guardian/scenarios`

#### 4.1 Viewer Access (Should Fail)
```bash
curl -X GET "http://localhost:3008/api/guardian/scenarios" \
  -H "Cookie: sb-access-token=<viewer-token>"
```
**Expected**: ❌ 403 Forbidden
**Error**: `{ error: 'Guardian scenario simulator access denied.' }`

#### 4.2 Analyst Access (Should Fail)
```bash
curl -X GET "http://localhost:3008/api/guardian/scenarios" \
  -H "Cookie: sb-access-token=<analyst-token>"
```
**Expected**: ❌ 403 Forbidden
**Error**: `{ error: 'Guardian scenario simulator access denied.' }`

#### 4.3 Admin Access (Should Succeed)
```bash
curl -X GET "http://localhost:3008/api/guardian/scenarios" \
  -H "Cookie: sb-access-token=<admin-token>"
```
**Expected**: ✅ 200 OK with scenarios data

---

## Test Matrix

| Endpoint | Viewer | Analyst | Admin | Unauthenticated |
|----------|--------|---------|-------|-----------------|
| Telemetry | ✅ 200 | ✅ 200 | ✅ 200 | ❌ 401 |
| Warehouse | ❌ 403 | ✅ 200 | ✅ 200 | ❌ 401 |
| Replay | ❌ 403 | ✅ 200 | ✅ 200 | ❌ 401 |
| Scenarios | ❌ 403 | ❌ 403 | ✅ 200 | ❌ 401 |

---

## Browser Testing (Manual)

### Test 5: Frontend Access with Browser

#### 5.1 Login as Viewer
1. Navigate to `http://localhost:3008/login`
2. Login as viewer@test.com
3. Navigate to `http://localhost:3008/guardian/telemetry`
   - **Expected**: ✅ Page loads with data
4. Navigate to `http://localhost:3008/guardian/warehouse`
   - **Expected**: ❌ 403 error or access denied message
5. Navigate to `http://localhost:3008/guardian/scenarios`
   - **Expected**: ❌ 403 error or access denied message

#### 5.2 Login as Analyst
1. Navigate to `http://localhost:3008/login`
2. Login as analyst@test.com
3. Navigate to `http://localhost:3008/guardian/telemetry`
   - **Expected**: ✅ Page loads with data
4. Navigate to `http://localhost:3008/guardian/warehouse`
   - **Expected**: ✅ Page loads with data
5. Navigate to `http://localhost:3008/guardian/replay`
   - **Expected**: ✅ Page loads with data
6. Navigate to `http://localhost:3008/guardian/scenarios`
   - **Expected**: ❌ 403 error or access denied message

#### 5.3 Login as Admin
1. Navigate to `http://localhost:3008/login`
2. Login as admin@test.com
3. Navigate to all Guardian pages:
   - `http://localhost:3008/guardian/telemetry` ✅
   - `http://localhost:3008/guardian/warehouse` ✅
   - `http://localhost:3008/guardian/replay` ✅
   - `http://localhost:3008/guardian/scenarios` ✅
   - **Expected**: All pages load successfully

---

## Response Validation

### Expected Response Shapes

#### Telemetry (200 OK)
```json
{
  "streams": [...],
  "events": [...]
}
```

#### Warehouse (200 OK)
```json
{
  "events": [...],
  "hourly": [...],
  "daily": [...],
  "summary": {
    "total_warehouse_events": 0,
    "distinct_stream_keys": 0,
    "stream_keys": []
  }
}
```

#### Replay (200 OK)
```json
{
  "sessions": [...],
  "events": [...],
  "activeSessionId": "uuid",
  "activeSession": {...},
  "eventCount": 0
}
```

#### Scenarios (200 OK)
```json
{
  "scenarios": [...],
  "runs": [...],
  "events": [...],
  "activeScenarioId": "uuid",
  "activeRunId": "uuid"
}
```

#### Access Denied (403)
```json
{
  "error": "Guardian [endpoint] access denied."
}
```

---

## Edge Cases

### Test 6: Default Role Behavior
- User with no `guardian_role` set should default to `guardian_viewer`
- Should have same access as explicit viewer role

### Test 7: Invalid Role
- Set user metadata to invalid role: `guardian_superadmin`
- Should default to `guardian_viewer`

### Test 8: Role Case Sensitivity
- Test with uppercase: `GUARDIAN_ADMIN`
- Should fail validation (roles are lowercase)

---

## Regression Tests

### Test 9: Verify No Breaking Changes
- ✅ Response shapes unchanged for authorized users
- ✅ Query parameters still work (streamId, sessionId, etc.)
- ✅ Empty state responses correct
- ✅ Error logging still functional

---

## Test Results Log

Date: _______________
Tester: _______________

| Test ID | Description | Expected | Actual | Pass/Fail |
|---------|-------------|----------|--------|-----------|
| 1.1 | Viewer → Telemetry | 200 | | |
| 1.2 | Analyst → Telemetry | 200 | | |
| 1.3 | Admin → Telemetry | 200 | | |
| 1.4 | Unauth → Telemetry | 401 | | |
| 2.1 | Viewer → Warehouse | 403 | | |
| 2.2 | Analyst → Warehouse | 200 | | |
| 2.3 | Admin → Warehouse | 200 | | |
| 3.1 | Viewer → Replay | 403 | | |
| 3.2 | Analyst → Replay | 200 | | |
| 3.3 | Admin → Replay | 200 | | |
| 4.1 | Viewer → Scenarios | 403 | | |
| 4.2 | Analyst → Scenarios | 403 | | |
| 4.3 | Admin → Scenarios | 200 | | |

---

## Notes

- All tests should be run with clean browser cache
- Use Supabase Dashboard to verify user metadata updates
- Check browser console for any unexpected errors
- Verify no SQL errors in Supabase logs
- Confirm RLS policies are not blocking legitimate access

---

**Test Plan Version**: 1.0
**Last Updated**: December 10, 2025
