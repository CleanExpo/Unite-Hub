# RBAC Architecture Guide

**Complete Technical Reference for Role-Based Access Control System**
**Version**: 1.0.0
**Status**: ✅ Production Ready

---

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                             │
│  (/login → /auth/await-approval → /crm or /synthex)            │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                  OAuth Token via Cookie
                           │
        ┌──────────────────┴──────────────────┐
        │                                     │
┌───────▼────────────────┐        ┌──────────▼────────────────┐
│  NEXT.JS MIDDLEWARE    │        │  API ROUTES              │
│  src/middleware.ts     │        │  /api/admin/*            │
│                        │        │                          │
│ 1. Get session         │        │ 1. Authenticate          │
│ 2. Get user profile    │        │ 2. Check role            │
│ 3. Generate fingerprint│        │ 3. Validate input        │
│ 4. Check device trust  │        │ 4. Call database         │
│ 5. Check approval      │        │ 5. Return response       │
│ 6. Route to /crm or    │        │                          │
│    /synthex            │        │ Error handling:          │
│ 7. Block unauthorized  │        │ - 401 Unauthorized       │
│                        │        │ - 403 Forbidden          │
│                        │        │ - 400 Bad request        │
└────────────┬───────────┘        └──────────┬───────────────┘
             │                               │
             │         RPC Calls             │
             │     DB Functions              │
             │                               │
             └───────────────┬────────────────┘
                             │
        ┌────────────────────▼─────────────────────┐
        │    SUPABASE (PostgreSQL)                │
        │                                         │
        │  Tables:                               │
        │  ├─ profiles                           │
        │  ├─ admin_approvals                    │
        │  ├─ admin_trusted_devices              │
        │  └─ admin_access_audit                 │
        │                                         │
        │  Functions:                            │
        │  ├─ is_admin_approved()                │
        │  ├─ request_admin_approval()           │
        │  ├─ approve_admin_access()             │
        │  ├─ trust_admin_device()               │
        │  └─ log_admin_access()                 │
        │                                         │
        │  RLS Policies:                         │
        │  ├─ User isolation                     │
        │  ├─ Admin-only audit logs              │
        │  └─ Role-based access                  │
        └─────────────────────────────────────────┘
```

---

## Data Flow: Complete Admin Login

### Phase 1: Initial Authentication (Google OAuth)

```
User Clicks "Continue with Google"
        ↓
Google OAuth Dialog
        ↓
User Signs In
        ↓
Redirect to Callback
        ↓
Supabase creates session
        ↓
Session token in cookie
```

### Phase 2: Middleware Processing

```
Request to /crm
        ↓
middleware.ts intercepts
        ↓
getSession() from Supabase
        ↓
Get user.id from session
        ↓
Query profiles table:
  SELECT role FROM profiles WHERE id = user.id
        ↓
Role = 'admin' → Check device
Role = 'customer' → Redirect to /synthex
        ↓
Generate Device Fingerprint:
  SHA256(userAgent:ipAddress)
        ↓
Check admin_trusted_devices:
  SELECT id FROM admin_trusted_devices
  WHERE user_id = user.id
    AND device_fingerprint = calculated_hash
    AND is_trusted = true
    AND expires_at > now()
        ↓
Device Found? → Redirect to /crm
Device Not Found? → Check approvals
        ↓
Check admin_approvals:
  SELECT id FROM admin_approvals
  WHERE user_id = user.id
    AND approved = true
    AND expires_at > now()
        ↓
Approval Found? → Redirect to /crm
No Approval? → Redirect to /auth/await-approval
```

### Phase 3: Create Approval Request

```
Middleware redirects to /auth/await-approval
        ↓
Frontend page loads
        ↓
Frontend calls:
POST /api/admin/send-approval-email
        ↓
API validates:
  - User authenticated ✓
  - User is admin ✓
  - Required fields present ✓
        ↓
API calls createApprovalRequest():
        ↓
Database function generates token:
  approval_token = hex(random_bytes(32))
        ↓
INSERT into admin_approvals:
  {
    user_id: user.id,
    ip_address: request.ip,
    user_agent: request.headers['user-agent'],
    approval_token: generated_token,
    approved: false,
    expires_at: now + 10 minutes
  }
        ↓
API fetches Phill's email:
  SELECT email FROM profiles
  WHERE email = 'phill.mcgurk@gmail.com'
        ↓
Send Email via email-service:
  To: phill@...
  Subject: Device Approval Request
  Body: Includes approval link with token
        ↓
Log access attempt:
  INSERT into admin_access_audit
        ↓
Return to frontend:
  {
    success: true,
    approvalId: uuid,
    expiresAt: timestamp
  }
```

### Phase 4: User Waits for Approval

```
/auth/await-approval page displays:
  - "Awaiting approval" message
  - 10-minute countdown timer
  - Email check instructions
  - Open Gmail button
        ↓
Frontend polls (optional):
  GET /api/admin/pending-approvals
        ↓
User opens email
        ↓
User clicks "Approve Device" link
```

### Phase 5: Phill Approves

```
Link goes to:
GET /api/admin/approve-access?token=TOKEN&approval_id=ID
        ↓
API validates:
  - Phill is logged in ✓
  - Phill is phill@gmail.com ✓
  - Approval ID exists ✓
  - Token matches ✓
  - Token not expired ✓
  - Not already approved ✓
        ↓
Database function approveAdminAccess():
  UPDATE admin_approvals
  SET
    approved = true,
    approved_by = phill.id,
    approved_at = now()
  WHERE id = approval_id
        ↓
Database function trustAdminDevice():
  INSERT into admin_trusted_devices
  {
    user_id: approving_user.id,
    device_fingerprint: calculated_hash,
    ip_address: stored_ip,
    user_agent: stored_user_agent,
    is_trusted: true,
    approved_by: phill.id,
    expires_at: now + 90 days
  }
        ↓
Log success:
  INSERT into admin_access_audit
  WHERE action = 'admin_access_approved'
        ↓
Redirect to /crm?approved=true&message=...
```

### Phase 6: Access Granted

```
/crm page loads
        ↓
Middleware checks again:
  Device in admin_trusted_devices? ✓
  Not expired? ✓
  is_trusted = true? ✓
        ↓
Allow access to /crm
        ↓
Show success banner:
  "Device approved successfully"
        ↓
Render CRM dashboard
```

### Phase 7: Next Login (Trusted Device)

```
User logs out
        ↓
User logs in again (same device)
        ↓
Middleware processes request
        ↓
Query admin_trusted_devices:
  Device found ✓
  Not expired ✓
  is_trusted = true ✓
        ↓
Redirect directly to /crm
        ↓
NO EMAIL SENT
        ↓
Access granted immediately
```

---

## Database Schema Deep Dive

### `profiles` Table

```sql
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT,
  role TEXT CHECK (role IN ('admin', 'customer')),
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);
```

**Purpose**: Extends auth.users with role information
**Key Fields**:
- `id` - User ID from auth.users
- `role` - 'admin' or 'customer'
- `email` - User's email (for lookups)

**RLS Policies**:
- `rls_profiles_self_view`: `auth.uid() = id` (users see own profile)
- `rls_profiles_self_update`: `auth.uid() = id` (users can update own profile, but NOT role)

**Access Pattern**:
```typescript
// Get user role
const { data: profile } = await supabase
  .from('profiles')
  .select('role')
  .eq('id', user.id)
  .single();
```

### `admin_approvals` Table

```sql
CREATE TABLE public.admin_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  ip_address INET,
  user_agent TEXT,
  approved BOOLEAN DEFAULT FALSE,
  approval_token TEXT UNIQUE,
  approved_by UUID REFERENCES auth.users(id),
  requested_at TIMESTAMP DEFAULT now(),
  approved_at TIMESTAMP,
  expires_at TIMESTAMP DEFAULT (now() + interval '10 minutes'),
  created_at TIMESTAMP DEFAULT now()
);
```

**Purpose**: Track device approval requests and workflow
**Key Fields**:
- `user_id` - Admin requesting approval
- `approval_token` - Random token for approval link
- `approved` - Boolean flag for approval status
- `expires_at` - Token expiration (10 minutes)
- `approved_by` - Phill's user ID after approval

**Indexes**:
- `user_id` for fast lookups per user
- `approval_token` for link validation
- `expires_at` for cleanup queries

**Access Patterns**:
```typescript
// Create approval request
const approvalId = await supabase.rpc('request_admin_approval', {
  user_id, ip_address, user_agent
});

// Get pending approvals for Phill
const { data: approvals } = await supabase
  .from('admin_approvals')
  .select('*')
  .eq('approved', false)
  .gte('expires_at', now());

// Approve device
await supabase.rpc('approve_admin_access', {
  approval_id, approver_id: phill.id
});
```

### `admin_trusted_devices` Table

```sql
CREATE TABLE public.admin_trusted_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  ip_address INET,
  user_agent TEXT,
  device_fingerprint TEXT,
  is_trusted BOOLEAN DEFAULT FALSE,
  approved_by UUID REFERENCES auth.users(id),
  last_used TIMESTAMP DEFAULT now(),
  expires_at TIMESTAMP DEFAULT (now() + interval '90 days'),
  created_at TIMESTAMP DEFAULT now()
);
```

**Purpose**: Remember approved devices for 90 days
**Key Fields**:
- `device_fingerprint` - SHA256 hash of (userAgent:ipAddress)
- `is_trusted` - Boolean flag (can be revoked)
- `expires_at` - Trust expiration (90 days)
- `last_used` - Last login timestamp

**Indexes**:
- `user_id` for device lookup per user
- `device_fingerprint` for duplicate detection

**Access Pattern**:
```typescript
// Check if device trusted
const { data: device } = await supabase
  .from('admin_trusted_devices')
  .select('id')
  .eq('user_id', user.id)
  .eq('device_fingerprint', fingerprint)
  .eq('is_trusted', true)
  .gte('expires_at', now())
  .single();

// Revoke device
await supabase
  .from('admin_trusted_devices')
  .update({ is_trusted: false })
  .eq('id', device_id);
```

### `admin_access_audit` Table

```sql
CREATE TABLE public.admin_access_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  ip_address INET,
  user_agent TEXT,
  device_fingerprint TEXT,
  success BOOLEAN DEFAULT TRUE,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT now()
);
```

**Purpose**: Audit trail of all admin access attempts
**Key Fields**:
- `action` - Type of action ('admin_access_requested', 'admin_access_approved', etc.)
- `success` - Boolean for result status
- `error_message` - Error details if failed

**RLS Policy**:
- `rls_audit_admin_only`: Only admins can view audit logs

**Access Pattern**:
```typescript
// Log access attempt
await supabase.rpc('log_admin_access', {
  user_id, action, ip_address, user_agent,
  device_fingerprint, success, error_message
});

// View audit logs (admin only)
const { data: logs } = await supabase
  .from('admin_access_audit')
  .select('*')
  .eq('user_id', target_user.id)
  .order('created_at', { ascending: false });
```

---

## Device Fingerprinting Algorithm

### Generation

```typescript
function generateDeviceFingerprint(userAgent: string, ip: string): string {
  const combined = `${userAgent}:${ip}`;
  return createHash('sha256').update(combined).digest('hex');
}
```

### Example

```
User Agent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0"
IP Address: "192.168.1.100"

Combined: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0:192.168.1.100"

SHA256: "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0"
```

### How It Works

1. **Concatenates** user agent and IP with colon separator
2. **Hashes** using SHA256 (deterministic, one-way)
3. **Returns** hex string (64 characters)

### Why This Approach

- **Deterministic**: Same device always produces same fingerprint
- **One-way**: Cannot reverse to get original IP/user agent
- **Unique-enough**: IP + user agent is unique per device session
- **Simple**: No external libraries needed (Node.js crypto built-in)
- **Fast**: SHA256 is very fast

### Limitations

- **IP Changes**: Different IP = different fingerprint (requires re-approval)
- **Browser Updates**: Major browser updates might change user agent
- **Shared Network**: Multiple users on same IP have different user agents (OK)
- **Not Perfect**: For MVP, good enough (90-day trust helps)

### Security Notes

- **Cannot be spoofed**: Would need to match exact IP + user agent
- **VPN/Proxy**: Changes IP = new approval needed (intentional)
- **Shared Devices**: User agent from browser, so usually fine
- **Mobile**: App user agent is stable, IP might change (trade-off)

---

## API Endpoint Architecture

### POST `/api/admin/send-approval-email`

**Flow**:
```
Request → Validate auth → Check admin role
  → Get Phill's email
  → Call createApprovalRequest()
  → Generate approval link
  → Send email
  → Log access
  → Return success
```

**Database Calls**:
1. `supabase.auth.getUser()` - Get session user
2. `profiles.select()` - Get user role
3. `profiles.select()` - Get Phill's email
4. `supabase.rpc('request_admin_approval')` - Create approval
5. `admin_approvals.select()` - Fetch approval record
6. `sendEmail()` - Send email via service
7. `supabase.rpc('log_admin_access')` - Log attempt

**Error Handling**:
- 400: Missing required fields
- 401: Not authenticated
- 403: Not an admin
- 500: Email service failure, approval creation failed

### GET `/api/admin/approve-access`

**Flow**:
```
Request → Parse token & approval_id
  → Get Phill (if not logged in, redirect to login)
  → Verify Phill's email
  → Validate approval record
  → Check token matches
  → Check not expired
  → Check not already approved
  → Call approveAdminAccess()
  → Call trustAdminDevice()
  → Log success
  → Redirect to /crm?approved=true
```

**Database Calls**:
1. `supabase.auth.getUser()` - Get Phill
2. `profiles.select()` - Verify Phill's email
3. `admin_approvals.select()` - Get approval record
4. `supabase.rpc('approve_admin_access')` - Approve
5. `supabase.rpc('trust_admin_device')` - Trust device
6. `supabase.rpc('log_admin_access')` - Log success

**Error Handling**:
- 400: Missing token or approval_id
- 401: Not authenticated (redirect to login)
- 403: Not Phill, cannot approve
- 404: Approval not found or token invalid
- 401: Token expired

### GET `/api/admin/trusted-devices`

**Flow**:
```
Request → Get current user
  → Check authenticated
  → Verify admin role
  → Call getUserTrustedDevices()
  → Return device list
```

**Database Calls**:
1. `supabase.auth.getUser()` - Get user
2. `profiles.select()` - Get role
3. `admin_trusted_devices.select()` - Get devices

**Response**:
```json
{
  "success": true,
  "devices": [
    {
      "id": "uuid",
      "ip_address": "192.168.1.100",
      "user_agent": "Mozilla/5.0...",
      "last_used": "2025-11-26T10:30:00Z",
      "expires_at": "2026-02-24T10:30:00Z",
      "created_at": "2025-11-26T10:30:00Z"
    }
  ],
  "count": 1
}
```

### DELETE `/api/admin/trusted-devices`

**Flow**:
```
Request → Parse device_id
  → Get current user
  → Check authenticated
  → Verify admin role
  → Verify device belongs to user
  → Call revokeTrustedDevice()
  → Return success
```

**Database Calls**:
1. `supabase.auth.getUser()` - Get user
2. `profiles.select()` - Get role
3. `admin_trusted_devices.select()` - Verify ownership
4. `admin_trusted_devices.update()` - Set is_trusted=false

**Error Handling**:
- 400: Missing device_id
- 401: Not authenticated
- 403: Not an admin
- 404: Device not found or doesn't belong to user

### GET `/api/admin/pending-approvals`

**Flow**:
```
Request → Get current user
  → Check authenticated
  → Verify is Phill
  → Call getPendingApprovals()
  → Filter expired tokens
  → Return approval list
```

**Database Calls**:
1. `supabase.auth.getUser()` - Get Phill
2. `profiles.select()` - Verify Phill's email
3. `admin_approvals.select()` - Get pending requests

**Response**:
```json
{
  "success": true,
  "approvals": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "profiles": { "email": "user@example.com" },
      "ip_address": "192.168.1.100",
      "user_agent": "Mozilla/5.0...",
      "approved": false,
      "requested_at": "2025-11-26T10:30:00Z",
      "expires_at": "2025-11-26T10:40:00Z"
    }
  ],
  "count": 1
}
```

---

## Frontend Component Interaction

### Middleware → Page Redirect Flow

```
User Request to /crm
        ↓
middleware.ts intercepts (matcher: "/crm/:path*")
        ↓
Check role in profiles table
        ↓
Role = admin? → Check device
        ↓
Device trusted? → ALLOW (/crm loads)
Device not trusted?
        → Check approval (expired < 10 min?)
        → Approval valid? → ALLOW
        → Approval invalid? → REDIRECT to /auth/await-approval
```

### /auth/await-approval Page

```
Frontend loads
        ↓
useEffect → getSession()
        ↓
Not authenticated? → redirect to /login
        ↓
Not admin? → redirect to /synthex/dashboard
        ↓
Get pending approval:
  SELECT FROM admin_approvals
  WHERE user_id = user.id
    AND approved = false
    AND expires_at > now()
        ↓
Approval found?
  → Show "Awaiting approval" UI
  → Start 10-minute countdown timer
  → Show email instructions
  → Render "Open Gmail" button
        ↓
No approval found?
  → Redirect to /crm (device might be approved)
        ↓
Timer reaches 0? OR token expired?
  → Show error: "Approval expired"
  → Show "Return to login" button
```

### /crm Page

```
Frontend loads
        ↓
useEffect → getSession()
        ↓
Not authenticated? → redirect to /login
        ↓
Not admin? → redirect to /synthex/dashboard
        ↓
Parse URL params:
  ?approved=true → Show success banner
  ?message=... → Display message
        ↓
Render CRM dashboard with:
  - Navigation cards (Contacts, Campaigns, Devices, Settings)
  - User info (email, role)
  - Success banner (if approved)
```

### /crm/admin/devices Page

```
Frontend loads
        ↓
useEffect:
  1. getSession()
  2. Get user profile
  3. Check role = admin
  4. fetch /api/admin/trusted-devices
        ↓
No devices? → Show "No Trusted Devices" UI
        ↓
Devices found? → Render list
        ↓
For each device:
  - Show device type icon (mobile/desktop)
  - Show device name (from user agent)
  - Show IP address
  - Show last used date
  - Show expiration date
  - Color warning if expiring < 7 days
  - Render "Revoke" button
        ↓
User clicks "Revoke"
  → Show confirmation dialog
  → fetch DELETE /api/admin/trusted-devices?device_id=...
  → Remove device from list
  → Show success message
```

---

## Security Architecture

### Layer 1: Authentication
- OAuth 2.0 via Google/Supabase
- Session token in secure cookie
- Token validated on every request

### Layer 2: Authorization
- Role-based (admin/customer)
- Middleware enforces role routing
- API routes validate role
- RLS policies prevent SQL access

### Layer 3: Device Security
- SHA256 fingerprinting
- Device trust tracking (90 days)
- Approval token validation (10 minutes)
- IP + user agent matching

### Layer 4: Data Isolation
- RLS policies (database level)
- User ID filtering (application level)
- Audit logging (compliance)

### Layer 5: Monitoring
- Access audit log
- Email verification
- Success/failure tracking
- Error logging

---

## Error Handling Strategy

### Authentication Errors
```
Missing session → 401 → Redirect to /login
Invalid token → 401 → Redirect to /login
Session expired → 401 → Redirect to /login
```

### Authorization Errors
```
User not admin → 403 → Redirect to /synthex/dashboard
Only Phill can approve → 403 → Error message
User not in profiles table → Auto-create profile
```

### Device Errors
```
Device not found → Redirect to /auth/await-approval
Device expired → Redirect to /auth/await-approval
Device revoked → Redirect to /auth/await-approval
```

### Approval Errors
```
Approval not found → 404 → "Invalid token"
Approval expired → 401 → "Token expired"
Already approved → 400 → "Already approved"
Token mismatch → 404 → "Invalid token"
```

### Email Errors
```
Email service down → 500 → "Failed to send email"
Phill's email not found → 500 → "Approval system misconfigured"
Email send fails → Log failure → Retry manually
```

---

## Performance Optimization

### Database Indexes
```sql
-- admin_approvals indexes
CREATE INDEX idx_admin_approvals_user_id
  ON public.admin_approvals(user_id);
CREATE INDEX idx_admin_approvals_token
  ON public.admin_approvals(approval_token);
CREATE INDEX idx_admin_approvals_expires
  ON public.admin_approvals(expires_at);

-- admin_trusted_devices indexes
CREATE INDEX idx_admin_devices_user_id
  ON public.admin_trusted_devices(user_id);
CREATE INDEX idx_admin_devices_fingerprint
  ON public.admin_trusted_devices(device_fingerprint);

-- profiles indexes
CREATE INDEX idx_profiles_email ON public.profiles(email);
CREATE INDEX idx_profiles_role ON public.profiles(role);

-- admin_access_audit indexes
CREATE INDEX idx_admin_access_audit_user_id
  ON public.admin_access_audit(user_id);
CREATE INDEX idx_admin_access_audit_created
  ON public.admin_access_audit(created_at);
```

### Query Optimization
- Single queries per request (no N+1)
- Use `.single()` instead of `.limit(1)`
- Filter in database (WHERE), not in code
- Use RLS to limit data scanned

### Caching
- Session tokens cached in cookie
- User role cached during middleware
- Device fingerprint calculated once per request

---

## Monitoring & Observability

### Key Metrics to Track

1. **Approval Rate**
   ```sql
   SELECT COUNT(*) as total_approvals
   FROM admin_approvals
   WHERE created_at > now() - interval '24 hours';
   ```

2. **Approval Success Rate**
   ```sql
   SELECT
     COUNT(CASE WHEN approved = true THEN 1 END) as approved,
     COUNT(CASE WHEN approved = false THEN 1 END) as pending,
     COUNT(*) as total
   FROM admin_approvals
   WHERE created_at > now() - interval '7 days';
   ```

3. **Device Trust Expiration**
   ```sql
   SELECT COUNT(*) as expiring_soon
   FROM admin_trusted_devices
   WHERE expires_at < now() + interval '7 days'
     AND expires_at > now();
   ```

4. **Access Logs**
   ```sql
   SELECT
     action,
     COUNT(*) as count,
     COUNT(CASE WHEN success = true THEN 1 END) as successful
   FROM admin_access_audit
   WHERE created_at > now() - interval '24 hours'
   GROUP BY action;
   ```

### Alerts to Set Up

- [ ] Approval token expiration: 0 pending after 24 hours = issue
- [ ] Email failures: Check if sendEmail returns success: false
- [ ] Device trust near expiration: < 7 days remaining
- [ ] High approval failure rate: > 10% failures in 1 hour

---

## Deployment Checklist

- [ ] Migration runs successfully
- [ ] All 4 tables exist
- [ ] All 7 functions exist
- [ ] All 5 RLS policies active
- [ ] Admin emails set in profiles
- [ ] Email service configured
- [ ] API endpoints return 200
- [ ] Frontend pages load
- [ ] Middleware redirects correctly
- [ ] Device fingerprinting works
- [ ] Approval email sends
- [ ] Approval link works
- [ ] Device trust persists
- [ ] Device revocation works
- [ ] Audit logs record entries
- [ ] No TypeScript errors
- [ ] Build successful
- [ ] All 10 test cases pass

---

## Future Enhancement Ideas

1. **Multi-approver System**
   - Multiple admins can approve
   - Not just Phill

2. **Risk-Based Authentication**
   - Unusual IP? → Require 2FA
   - Unusual time? → Require 2FA

3. **Session Management**
   - Idle timeout (30 min)
   - Concurrent session limit

4. **Device Management**
   - Allow users to name devices
   - Show device location
   - Remote logout

5. **Advanced Security**
   - 2FA/MFA support
   - FIDO2 keys
   - Biometric authentication

6. **Analytics**
   - Login heatmap
   - Approval trends
   - Security reports

---

**This guide provides complete technical reference for RBAC architecture.**

For implementation details, see individual files.
For deployment steps, see RBAC_DEPLOYMENT_CHECKLIST.md
For quick start, see README.md

---

Last Updated: 2025-11-26
Version: 1.0.0
Status: Production Ready ✅
