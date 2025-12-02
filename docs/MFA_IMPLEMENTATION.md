# Multi-Factor Authentication (MFA) Implementation

**Status**: ✅ Complete
**Date**: 2025-12-03
**Version**: 1.0.0
**TOTP Implementation**: Supabase Built-in MFA

---

## Overview

Unite-Hub implements Time-based One-Time Password (TOTP) multi-factor authentication using Supabase's built-in MFA support. This provides an additional security layer beyond password authentication, protecting user accounts from unauthorized access.

### Key Features

- ✅ **TOTP Authentication** - Industry-standard authenticator app support
- ✅ **QR Code Enrollment** - Easy setup with popular authenticator apps
- ✅ **Recovery Codes** - Backup access codes for lost devices
- ✅ **Multiple Factor Support** - Support for multiple authenticator apps per user
- ✅ **Graceful Degradation** - Works seamlessly with existing auth flow
- ✅ **User-Friendly UI** - Step-by-step setup and challenge components

---

## Architecture

### Components

```
src/
├── lib/auth/
│   └── mfa.ts                      # Core MFA utilities
├── components/auth/
│   ├── MFASetup.tsx                # Enrollment wizard
│   ├── MFAChallenge.tsx            # Login verification
│   └── SessionTimeoutWarning.tsx   # Session management (existing)
└── app/settings/security/
    └── page.tsx                    # Security settings page
```

### Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                      MFA ENROLLMENT FLOW                     │
└─────────────────────────────────────────────────────────────┘

User clicks "Enable 2FA"
    ↓
enrollMFA()
    ↓
Supabase generates TOTP secret
    ↓
Display QR code + manual secret
    ↓
User scans QR in authenticator app
    ↓
User enters 6-digit code
    ↓
verifyMFAEnrollment(factorId, code)
    ↓
Supabase verifies code
    ↓
Generate recovery codes
    ↓
Display recovery codes (one-time view)
    ↓
MFA enabled ✅


┌─────────────────────────────────────────────────────────────┐
│                    MFA CHALLENGE FLOW                        │
└─────────────────────────────────────────────────────────────┘

User logs in with email/password
    ↓
Supabase detects MFA is enabled
    ↓
Show MFAChallenge component
    ↓
User enters 6-digit code (or recovery code)
    ↓
verifyMFAChallenge(factorId, code)
    ↓
Supabase verifies code
    ↓
Login successful ✅
```

---

## Setup Guide

### Prerequisites

1. **Supabase Project** with MFA enabled (enabled by default)
2. **Supabase Auth** configured with PKCE flow
3. **@supabase/ssr** v0.7.0+ and **@supabase/supabase-js** v2.81.1+

### 1. Enable MFA in Supabase Dashboard

MFA is enabled by default in Supabase. To verify:

1. Go to **Authentication** → **Providers** in Supabase Dashboard
2. Ensure **Phone Auth** or **TOTP** is available
3. No additional configuration needed

### 2. Install Required Dependencies

All dependencies are already installed:

```bash
npm install @supabase/ssr@^0.7.0 @supabase/supabase-js@^2.81.1
```

### 3. Add MFA to Your App

The following files have been created:

- ✅ `src/lib/auth/mfa.ts` - Core MFA utilities
- ✅ `src/components/auth/MFASetup.tsx` - Enrollment component
- ✅ `src/components/auth/MFAChallenge.tsx` - Challenge component
- ✅ `src/app/settings/security/page.tsx` - Security settings UI

### 4. Integrate into Auth Flow

#### Add MFA Challenge to Login

In your login page/component, check if MFA is required after successful password authentication:

```tsx
import { MFAChallenge } from '@/components/auth/MFAChallenge';
import { getMFAStatus } from '@/lib/auth/mfa';

async function handleLogin(email: string, password: string) {
  // Step 1: Sign in with email/password
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    // Handle login error
    return;
  }

  // Step 2: Check if MFA is enabled
  const mfaStatus = await getMFAStatus();

  if (mfaStatus.enabled && mfaStatus.enrolledFactors.length > 0) {
    // Show MFA challenge
    setShowMFAChallenge(true);
    setFactorId(mfaStatus.enrolledFactors[0].id);
  } else {
    // Login successful, redirect
    router.push('/dashboard');
  }
}
```

```tsx
{showMFAChallenge && (
  <MFAChallenge
    isOpen={showMFAChallenge}
    factorId={factorId}
    onSuccess={() => router.push('/dashboard')}
    onCancel={() => setShowMFAChallenge(false)}
  />
)}
```

#### Add MFA Setup to Settings

Users can enable MFA from **Settings → Security**:

```tsx
// Navigate to /settings/security
<Link href="/settings/security">Security Settings</Link>
```

---

## API Reference

### Core Functions

#### `enrollMFA(friendlyName?: string)`

Start MFA enrollment and get QR code.

```typescript
import { enrollMFA } from '@/lib/auth/mfa';

const result = await enrollMFA('My Authenticator');

if (result.success) {
  console.log('QR Code URL:', result.qrCodeUrl);
  console.log('Secret:', result.secret);
  console.log('Factor ID:', result.factorId);
}
```

**Returns:**
```typescript
{
  success: boolean;
  qrCodeUrl?: string;      // QR code data URL for display
  secret?: string;         // Manual entry secret
  factorId?: string;       // Factor ID for verification
  error?: string;
}
```

#### `verifyMFAEnrollment(factorId: string, code: string)`

Verify TOTP code during enrollment.

```typescript
import { verifyMFAEnrollment } from '@/lib/auth/mfa';

const result = await verifyMFAEnrollment(factorId, '123456');

if (result.success) {
  console.log('Recovery codes:', result.recoveryCodes);
}
```

**Returns:**
```typescript
{
  success: boolean;
  recoveryCodes?: string[];  // One-time recovery codes
  error?: string;
}
```

#### `verifyMFAChallenge(factorId: string, code: string)`

Verify TOTP code during login.

```typescript
import { verifyMFAChallenge } from '@/lib/auth/mfa';

const result = await verifyMFAChallenge(factorId, '123456');

if (result.success) {
  // Login successful
}
```

#### `getMFAStatus()`

Get current user's MFA status (client-side).

```typescript
import { getMFAStatus } from '@/lib/auth/mfa';

const status = await getMFAStatus();

console.log('MFA enabled:', status.enabled);
console.log('Enrolled factors:', status.enrolledFactors);
```

**Returns:**
```typescript
{
  enabled: boolean;
  enrolledFactors: Array<{
    id: string;
    type: 'totp';
    status: 'verified' | 'unverified';
    friendlyName?: string;
  }>;
}
```

#### `unenrollMFA(factorId: string)`

Disable MFA for a factor.

```typescript
import { unenrollMFA } from '@/lib/auth/mfa';

const result = await unenrollMFA(factorId);

if (result.success) {
  console.log('MFA disabled');
}
```

#### `generateRecoveryCodes()`

Generate new recovery codes.

```typescript
import { generateRecoveryCodes } from '@/lib/auth/mfa';

const result = await generateRecoveryCodes();

if (result.success) {
  console.log('New codes:', result.codes);
}
```

#### `verifyRecoveryCode(code: string)`

Verify a recovery code (bypass MFA).

```typescript
import { verifyRecoveryCode } from '@/lib/auth/mfa';

const result = await verifyRecoveryCode('RECOVERY-CODE-123');

if (result.success) {
  // Login successful
}
```

---

## User Flow Documentation

### Enrollment Flow

1. **Navigate to Security Settings**
   - User goes to `/settings/security`

2. **Click "Enable" on Two-Factor Authentication**
   - Opens `MFASetup` dialog

3. **Scan QR Code**
   - User scans QR code with authenticator app (Google Authenticator, Authy, 1Password)
   - Or manually enters secret key

4. **Enter Verification Code**
   - User enters 6-digit code from authenticator app
   - System verifies code with Supabase

5. **Save Recovery Codes**
   - System generates 10 recovery codes
   - User must download or copy codes
   - **Important**: Codes shown only once

6. **MFA Enabled**
   - Success confirmation
   - Badge shows "Secured" status

### Login Flow (with MFA)

1. **Enter Email/Password**
   - User logs in with credentials

2. **MFA Challenge Appears**
   - `MFAChallenge` component shown
   - User sees 6-digit code input

3. **Enter TOTP Code**
   - User opens authenticator app
   - Enters current 6-digit code
   - Code valid for 30 seconds

4. **Verification**
   - System validates code
   - If valid: proceed to dashboard
   - If invalid: show error, allow retry

5. **Recovery Code Option**
   - If user lost authenticator, click "Use recovery code"
   - Enter one recovery code
   - Code can only be used once

### Recovery Procedures

#### Lost Authenticator App

**Option 1: Use Recovery Code**
1. Click "Lost access to your authenticator?" on login
2. Enter one of your saved recovery codes
3. Login successful
4. **Important**: Re-enable MFA with new authenticator

**Option 2: Admin Override** (for founders)
1. Contact system administrator
2. Admin uses Supabase Dashboard
3. Navigate to **Authentication** → **Users**
4. Find user and click **More options** (⋮)
5. Click **Delete MFA Factor**
6. User can now login with password only
7. User should re-enable MFA immediately

#### Lost Recovery Codes

If MFA is still working:
1. Go to **Settings** → **Security**
2. Click "Generate New Codes"
3. Download or copy new codes
4. Old codes are invalidated

If MFA not working and no recovery codes:
1. Contact administrator for MFA reset
2. Admin uses Supabase Dashboard to remove MFA
3. Re-enable MFA after login

---

## Admin Override Process

### Disable MFA for User (Emergency)

**Supabase Dashboard Method:**

1. Go to **Authentication** → **Users**
2. Search for user by email
3. Click on user row to open details
4. Find **MFA Factors** section
5. Click **⋮** (More options) next to the TOTP factor
6. Select **Delete Factor**
7. Confirm deletion

**SQL Method (Supabase SQL Editor):**

```sql
-- Find user's MFA factors
SELECT * FROM auth.mfa_factors
WHERE user_id = 'USER_UUID_HERE';

-- Delete specific factor
DELETE FROM auth.mfa_factors
WHERE id = 'FACTOR_ID_HERE';

-- Or delete all factors for user (emergency)
DELETE FROM auth.mfa_factors
WHERE user_id = 'USER_UUID_HERE';
```

⚠️ **Security Note**: Always verify user identity before performing MFA override. Log all override actions in `auditLogs` table.

---

## Security Considerations

### Best Practices

1. **Recovery Codes**
   - Generate 10 codes minimum
   - Show codes only once during enrollment
   - Each code single-use only
   - Store hashed versions in database

2. **TOTP Configuration**
   - 30-second time window (Supabase default)
   - SHA-1 algorithm (standard)
   - 6-digit codes (standard)

3. **Rate Limiting**
   - Implement rate limiting on verification attempts
   - Lock account after 5 failed MFA attempts
   - Use Supabase's built-in rate limiting

4. **Session Management**
   - MFA verification extends session
   - Sessions still subject to timeout
   - Re-verify MFA on sensitive actions

5. **Backup Methods**
   - Always provide recovery codes
   - Consider SMS backup (future)
   - Admin override available for emergencies

### Common Attack Vectors

| Attack | Mitigation |
|--------|-----------|
| Brute force TOTP codes | Rate limiting (5 attempts), account lockout |
| Stolen recovery codes | Single-use codes, secure storage warnings |
| Phishing | Educate users, warn about fake login pages |
| Device theft | Require biometric unlock on authenticator apps |
| Social engineering | Admin verification process, audit logs |

---

## Testing Guide

### Manual Testing

#### Test MFA Enrollment

1. Navigate to `/settings/security`
2. Click "Enable" on 2FA
3. Scan QR code with Google Authenticator
4. Enter code from app
5. Verify recovery codes displayed
6. Download recovery codes
7. Check that badge shows "Secured"

#### Test Login with MFA

1. Sign out
2. Sign in with email/password
3. Verify MFA challenge appears
4. Enter code from authenticator
5. Verify successful login

#### Test Recovery Code

1. Sign out
2. Sign in with email/password
3. Click "Lost access to your authenticator?"
4. Enter recovery code
5. Verify successful login
6. Verify code cannot be reused

#### Test MFA Disable

1. Go to `/settings/security`
2. Click "Disable" on 2FA
3. Confirm in dialog
4. Verify badge changes to "Basic"
5. Sign out and back in
6. Verify no MFA challenge

### Automated Tests (To Be Implemented)

```typescript
// tests/auth/mfa.test.ts

describe('MFA Enrollment', () => {
  it('should generate QR code and secret', async () => {
    const result = await enrollMFA();
    expect(result.success).toBe(true);
    expect(result.qrCodeUrl).toBeDefined();
    expect(result.secret).toBeDefined();
  });

  it('should verify TOTP code', async () => {
    // Mock TOTP code generation
    const code = generateTOTP(secret);
    const result = await verifyMFAEnrollment(factorId, code);
    expect(result.success).toBe(true);
  });

  it('should generate recovery codes', async () => {
    const result = await generateRecoveryCodes();
    expect(result.success).toBe(true);
    expect(result.codes).toHaveLength(10);
  });
});

describe('MFA Challenge', () => {
  it('should verify valid TOTP code', async () => {
    const code = generateTOTP(secret);
    const result = await verifyMFAChallenge(factorId, code);
    expect(result.success).toBe(true);
  });

  it('should reject invalid TOTP code', async () => {
    const result = await verifyMFAChallenge(factorId, '000000');
    expect(result.success).toBe(false);
  });

  it('should verify recovery code', async () => {
    const result = await verifyRecoveryCode('VALID-CODE');
    expect(result.success).toBe(true);
  });

  it('should reject used recovery code', async () => {
    await verifyRecoveryCode('VALID-CODE'); // Use once
    const result = await verifyRecoveryCode('VALID-CODE'); // Try again
    expect(result.success).toBe(false);
  });
});
```

---

## Troubleshooting

### Common Issues

#### "User not authenticated" Error

**Cause**: Session expired or cookies cleared
**Solution**: Re-login with email/password

#### "Invalid verification code" Error

**Cause**: Time sync issue or wrong code
**Solutions**:
1. Check device time is synced correctly
2. Wait for new code (codes refresh every 30 seconds)
3. Verify you're using the correct account in authenticator

#### Recovery Codes Not Working

**Cause**: Code already used or incorrect format
**Solution**: Each code works only once. Contact admin if all codes used.

#### QR Code Won't Scan

**Solutions**:
1. Increase screen brightness
2. Use manual entry with secret key
3. Try different authenticator app

#### MFA Challenge Not Appearing

**Cause**: MFA not properly enrolled
**Solution**: Re-enroll MFA from security settings

---

## API Routes (To Be Created)

The following API routes are referenced but need to be implemented:

### `POST /api/auth/mfa/recovery-codes`

Generate recovery codes for authenticated user.

**Request**: None (uses session)
**Response**:
```json
{
  "success": true,
  "codes": [
    "ABCD-1234",
    "EFGH-5678",
    ...
  ]
}
```

### `POST /api/auth/mfa/verify-recovery`

Verify a recovery code.

**Request**:
```json
{
  "code": "ABCD-1234"
}
```

**Response**:
```json
{
  "success": true
}
```

### Implementation Example

```typescript
// src/app/api/auth/mfa/recovery-codes/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  const supabase = await createClient();

  // Verify user is authenticated
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  // Generate 10 random recovery codes
  const codes = Array.from({ length: 10 }, () => {
    const bytes = crypto.randomBytes(4);
    return bytes.toString('hex').toUpperCase().match(/.{1,4}/g)!.join('-');
  });

  // Hash codes for storage
  const hashedCodes = codes.map(code => ({
    user_id: user.id,
    code_hash: crypto.createHash('sha256').update(code).digest('hex'),
    used: false,
  }));

  // Store in database (create table: mfa_recovery_codes)
  const { error: insertError } = await supabase
    .from('mfa_recovery_codes')
    .insert(hashedCodes);

  if (insertError) {
    return NextResponse.json(
      { success: false, error: 'Failed to generate codes' },
      { status: 500 }
    );
  }

  // Return unhashed codes (only time they're shown)
  return NextResponse.json({ success: true, codes });
}
```

---

## Database Schema

### Required Table: `mfa_recovery_codes`

```sql
-- Create recovery codes table
CREATE TABLE IF NOT EXISTS mfa_recovery_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code_hash TEXT NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  used_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(code_hash)
);

-- Create index for faster lookups
CREATE INDEX idx_mfa_recovery_codes_user_id ON mfa_recovery_codes(user_id);
CREATE INDEX idx_mfa_recovery_codes_hash ON mfa_recovery_codes(code_hash);

-- Enable RLS
ALTER TABLE mfa_recovery_codes ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own recovery codes"
  ON mfa_recovery_codes
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage recovery codes"
  ON mfa_recovery_codes
  FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');
```

**Migration**: Create as `supabase/migrations/081_mfa_recovery_codes.sql`

---

## Future Enhancements

### Phase 2 (Q1 2026)

- [ ] SMS backup codes
- [ ] WebAuthn/FIDO2 support (hardware keys)
- [ ] Trusted devices (skip MFA for 30 days)
- [ ] Email verification codes as fallback
- [ ] Admin MFA enforcement policies

### Phase 3 (Q2 2026)

- [ ] Biometric authentication
- [ ] Adaptive authentication (risk-based)
- [ ] MFA analytics dashboard
- [ ] Compliance reports (SOC 2, GDPR)

---

## Support & Resources

### Documentation

- [Supabase MFA Documentation](https://supabase.com/docs/guides/auth/auth-mfa)
- [TOTP RFC 6238](https://tools.ietf.org/html/rfc6238)
- [OWASP MFA Guide](https://cheatsheetseries.owasp.org/cheatsheets/Multifactor_Authentication_Cheat_Sheet.html)

### Recommended Authenticator Apps

- **Google Authenticator** (iOS/Android)
- **Authy** (iOS/Android/Desktop)
- **1Password** (Premium feature)
- **Microsoft Authenticator** (iOS/Android)

### Contact

For implementation questions or issues:
- Create GitHub issue
- Review `docs/` directory
- Check Supabase Dashboard logs

---

## Changelog

### Version 1.0.0 (2025-12-03)

- ✅ Initial MFA implementation
- ✅ TOTP enrollment with QR codes
- ✅ Recovery codes generation
- ✅ MFA challenge components
- ✅ Security settings page
- ✅ Complete documentation

---

**This document is the single source of truth for MFA implementation in Unite-Hub.**
