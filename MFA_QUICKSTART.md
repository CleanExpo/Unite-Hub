# MFA Quick Start Guide

**Quick reference for enabling MFA in Unite-Hub**

---

## Files Created ✅

All files have been created and are ready to use:

```
✅ src/lib/auth/mfa.ts                      # Core MFA functions
✅ src/components/auth/MFASetup.tsx         # Setup wizard
✅ src/components/auth/MFAChallenge.tsx     # Login challenge
✅ src/app/settings/security/page.tsx       # Security settings
✅ supabase/migrations/404_mfa_recovery_codes.sql  # Database migration
✅ docs/MFA_IMPLEMENTATION.md               # Full documentation
✅ MFA_IMPLEMENTATION_SUMMARY.md            # Summary
```

---

## Quick Enable (5 Steps)

### 1. Run Database Migration

```bash
# Copy migration to Supabase SQL Editor
# File: supabase/migrations/404_mfa_recovery_codes.sql
```

**OR** run via Supabase CLI:

```bash
supabase migration up
```

### 2. Add Security Settings to Navigation

```tsx
// In your settings navigation menu
import { Shield } from 'lucide-react';

<Link href="/settings/security">
  <Shield className="mr-2 h-4 w-4" />
  Security
</Link>
```

### 3. Test Security Settings Page

Navigate to: `http://localhost:3008/settings/security`

Should see:
- Account Security card
- Two-Factor Authentication section
- "Enable" button

### 4. Test MFA Setup Flow

1. Click "Enable" button
2. Scan QR code with Google Authenticator
3. Enter 6-digit code
4. Download recovery codes
5. Verify "Secured" badge appears

### 5. (Optional) Add to Login Flow

```tsx
// In your login page
import { MFAChallenge } from '@/components/auth/MFAChallenge';
import { getMFAStatus } from '@/lib/auth/mfa';

const [showMFA, setShowMFA] = useState(false);
const [factorId, setFactorId] = useState('');

async function handleLogin(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) return;

  const mfaStatus = await getMFAStatus();
  if (mfaStatus.enabled) {
    setFactorId(mfaStatus.enrolledFactors[0].id);
    setShowMFA(true);
  } else {
    router.push('/dashboard');
  }
}

// Render
{showMFA && (
  <MFAChallenge
    isOpen={showMFA}
    factorId={factorId}
    onSuccess={() => router.push('/dashboard')}
    onCancel={() => setShowMFA(false)}
  />
)}
```

---

## Optional API Routes (Recovery Codes)

If you want full recovery code functionality, create these API routes:

### Create: `src/app/api/auth/mfa/recovery-codes/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  const supabase = await createClient();

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  // Generate 10 recovery codes
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

  // Store in database
  const { error: insertError } = await supabase
    .from('mfa_recovery_codes')
    .insert(hashedCodes);

  if (insertError) {
    return NextResponse.json({ success: false, error: 'Failed to generate codes' }, { status: 500 });
  }

  return NextResponse.json({ success: true, codes });
}
```

### Create: `src/app/api/auth/mfa/verify-recovery/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { code } = await req.json();

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  // Hash the code
  const codeHash = crypto.createHash('sha256').update(code).digest('hex');

  // Find unused code
  const { data: recoveryCode, error: findError } = await supabase
    .from('mfa_recovery_codes')
    .select('*')
    .eq('user_id', user.id)
    .eq('code_hash', codeHash)
    .eq('used', false)
    .maybeSingle();

  if (findError || !recoveryCode) {
    return NextResponse.json({ success: false, error: 'Invalid recovery code' }, { status: 400 });
  }

  // Mark as used
  const { error: updateError } = await supabase
    .from('mfa_recovery_codes')
    .update({ used: true })
    .eq('id', recoveryCode.id);

  if (updateError) {
    return NextResponse.json({ success: false, error: 'Failed to verify code' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
```

---

## Verification Checklist

### Basic Setup

- [ ] Run migration `404_mfa_recovery_codes.sql`
- [ ] Navigate to `/settings/security`
- [ ] See "Two-Factor Authentication" section
- [ ] Click "Enable" button
- [ ] See setup wizard

### Full Flow

- [ ] Scan QR code with Google Authenticator
- [ ] Enter 6-digit code
- [ ] See recovery codes
- [ ] Download recovery codes
- [ ] See "Secured" badge
- [ ] Sign out
- [ ] Sign in (verify MFA challenge appears if integrated)
- [ ] Enter code from app
- [ ] Login successful

### Admin Functions

- [ ] Can disable MFA from settings
- [ ] Can generate new recovery codes
- [ ] Can view enrolled factors

---

## Troubleshooting

### "Table mfa_recovery_codes does not exist"

**Fix**: Run migration `404_mfa_recovery_codes.sql` in Supabase SQL Editor

### "Cannot read properties of undefined (reading 'mfa')"

**Fix**: Ensure Supabase packages are up to date:
```bash
npm install @supabase/ssr@latest @supabase/supabase-js@latest
```

### QR Code Not Showing

**Fix**: Check that `enrollMFA()` returned success and `qrCodeUrl` is defined

### Recovery Codes Not Working

**Fix**: Create API routes `/api/auth/mfa/recovery-codes` and `/api/auth/mfa/verify-recovery`

---

## Support

- **Full docs**: `docs/MFA_IMPLEMENTATION.md`
- **Summary**: `MFA_IMPLEMENTATION_SUMMARY.md`
- **Supabase docs**: https://supabase.com/docs/guides/auth/auth-mfa

---

**MFA is ready to use! Start at `/settings/security`**
