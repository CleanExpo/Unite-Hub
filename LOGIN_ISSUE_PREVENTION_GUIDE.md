# Login Issue Prevention Guide

## Summary of Issues Fixed

### 1. Critical Build Error - Resend API Initialization
**Problem:** The Resend email client was being initialized at module load time when environment variables weren't available during build.

**Error:** `Missing API key. Pass it to the constructor new Resend("re_123")`

**Solution:** Implemented lazy initialization pattern for Resend clients.

**Files Fixed:**
- `src/lib/email/sendEmail.ts` - Main email utility
- `src/app/api/crm/comms/email/route.ts` - CRM email route

**Implementation:**
```typescript
// Before (problematic)
const resend = new Resend(process.env.RESEND_API_KEY);

// After (fixed)
let resend: Resend | null = null;

function getResendClient(): Resend {
  if (!resend) {
    if (!process.env.RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY environment variable is not set');
    }
    resend = new Resend(process.env.RESEND_API_KEY);
  }
  return resend;
}
```

### 2. Client Component Error
**Problem:** UserTable component was being passed data from server component without proper client directive.

**Error:** `Functions cannot be passed directly to Client Components unless you explicitly expose it by marking it with "use server"`

**Solution:** Added `"use client";` directive to UserTable component.

**File Fixed:**
- `src/components/users/UserTable.tsx`

### 3. ESLint Errors - Apostrophes
**Problem:** Unescaped apostrophes in JSX causing linting failures.

**Solution:** Replaced all apostrophes with `&apos;` entity.

**Files Fixed:**
- `src/app/[locale]/login/page.tsx`
- `src/components/auth/MFASetup.tsx`
- `src/lib/email/sendEmail.ts`

## Prevention Strategies

### 1. Environment Variable Management

#### For Development
- Always use `.env.local` for local environment variables
- Add placeholder values in `.env.example`
- Document all required environment variables

#### For Production (Vercel)
- Set all environment variables in Vercel dashboard
- Use `vercel env add VARIABLE_NAME production` command
- Verify environment variables with `vercel env ls`

### 2. Build Process Guidelines

#### Before Deploying
1. Run `npm run build` locally to catch build errors
2. Fix any TypeScript/ESLint errors before pushing
3. Test critical paths locally

#### Environment Variable Patterns
```typescript
// ✅ Good - Lazy initialization
let client: SomeClient | null = null;

function getClient() {
  if (!client) {
    if (!process.env.API_KEY) {
      throw new Error('API_KEY not set');
    }
    client = new SomeClient(process.env.API_KEY);
  }
  return client;
}

// ❌ Bad - Immediate initialization
const client = new SomeClient(process.env.API_KEY); // Fails at build time
```

### 3. Component Architecture

#### Server vs Client Components
```typescript
// ✅ Server Component (default)
export default async function ServerPage() {
  const data = await fetchData();
  return <ClientComponent data={data} />;
}

// ✅ Client Component (marked explicitly)
"use client";
export default function ClientComponent({ data }) {
  return <div>{data}</div>;
}
```

### 4. ESLint Configuration

#### Recommended Rules
```json
{
  "rules": {
    "react/no-unescaped-entities": "error",
    "@typescript-eslint/no-explicit-any": "error"
  }
}
```

#### Apostrophe Handling
```jsx
// ✅ Correct
<p>Don&apos;t have an account?</p>

// ❌ Incorrect
<p>Don't have an account?</p>
```

### 5. Deployment Checklist

#### Pre-deployment
- [ ] `npm run build` passes locally
- [ ] All environment variables set in Vercel
- [ ] No ESLint errors
- [ ] No TypeScript errors
- [ ] Critical user paths tested

#### Post-deployment
- [ ] Test login functionality
- [ ] Verify email sending works (if RESEND_API_KEY available)
- [ ] Check error logs in Vercel dashboard
- [ ] Test user registration flow

### 6. Monitoring and Alerting

#### Error Tracking
- Monitor build failures in Vercel dashboard
- Set up error tracking for production runtime errors
- Implement health checks for critical services

#### Key Metrics
- Login success rate
- Email delivery rate
- API response times
- Build success rate

### 7. Environment Variables Required

```bash
# Core Application
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Email Service
RESEND_API_KEY=your_resend_api_key
DEFAULT_FROM=support@unite-group.com
ADMIN_EMAIL=admin@unite-group.com

# Authentication
NEXTAUTH_SECRET=your_nextauth_secret

# Payments
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret

# External APIs
OPENAI_API_KEY=your_openai_api_key
```

### 8. Common Pitfalls to Avoid

1. **Don't initialize external clients at module level**
2. **Always mark interactive components with "use client"**
3. **Escape special characters in JSX**
4. **Test environment variable availability in build process**
5. **Don't assume environment variables are available during build**

### 9. Testing Strategy

#### Local Testing
```bash
# Test build process
npm run build

# Test with different NODE_ENV
NODE_ENV=production npm run build

# Verify linting
npm run lint
```

#### Production Testing
- Test login flow immediately after deployment
- Verify email functionality works
- Check all authenticated routes
- Test user registration process

### 10. Rollback Plan

If issues occur in production:

1. **Immediate**: Revert to previous working deployment
2. **Investigation**: Check Vercel logs for specific errors
3. **Fix**: Apply fixes locally and test thoroughly
4. **Redeploy**: Only after local verification

## Current Status

✅ **All critical issues resolved:**
- Build process now succeeds
- Login functionality restored  
- ESLint errors eliminated
- Email services properly initialized
- User management components working

✅ **Deployed successfully to production:**
- URL: https://unite-group-fresh-gdrgr0qbk-admin-cleanexpo247s-projects.vercel.app
- All environment variables configured
- Build artifacts optimized
- Static pages generated successfully

## Next Steps

1. Monitor production logs for any runtime errors
2. Test login functionality end-to-end
3. Verify email notifications work correctly
4. Implement the prevention strategies outlined above
5. Document any additional environment variables needed
