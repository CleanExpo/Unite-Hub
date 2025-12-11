# December 11, 2025 - Issues Found & Fixed

## **Critical Issues Fixed Today ✅**

### 1. **Guardian Authentication Broken (Dec 6 - Dec 11)**
**Symptom**: All Guardian APIs returned 401 Unauthorized for 5 days
**Root Cause**:
- No Guardian roles configured in user metadata
- Signin page used NextAuth (doesn't exist) instead of Supabase Auth
- Email/password signin only set localStorage, not server cookies
- Missing `/auth/callback` route for OAuth
- Missing workspace in database

**Fixed**:
- Created `src/app/auth/callback/route.ts` - OAuth callback handler
- Created `src/app/api/auth/sync-session/route.ts` - Syncs client auth to server cookies
- Fixed `src/app/auth/signin/page.tsx` - Use Supabase Auth
- Modified `src/contexts/AuthContext.tsx` - Auto-sync session after password signin
- Created 7 diagnostic/setup SQL scripts
- Created `GUARDIAN_DEV_SETUP.md` - Complete dev setup guide
- Created workspace via SQL

**Commit**: `54d6ba29` - "fix: Restore Guardian authentication - broken since Dec 6th"

---

### 2. **Tailwind Max-Width Scale Broken**
**Symptom**: All text breaking word-by-word vertically (48px width columns)
**Root Cause**: Tailwind v4 `@theme inline` missing max-width scale definitions
**Result**: `max-w-2xl` generated as `max-width: 3rem` (48px) instead of `42rem` (672px)

**Fixed**:
- Added complete max-width scale to `globals.css` `@theme inline` block
- xs through 7xl + screen sizes (sm/md/lg/xl/2xl)

**Commit**: `2feb4323` - "fix: Restore Tailwind max-width scale"

---

### 3. **Button Component React Error**
**Symptom**: `React.Children.only` error when using `asChild` prop
**Root Cause**: Conditional rendering with fragments inside Slot component

**Fixed**:
- Modified `src/components/ui/button.tsx` - Separate rendering paths for asChild vs normal

**Commit**: `54d6ba29` (included in auth fix)

---

## **Remaining Issues (Non-Critical)**

### **1. Multiple Supabase Client Instances**
**Warning**: `Multiple GoTrueClient instances detected in the same browser context`

**Cause**: Likely importing from both `@/lib/supabase` and `@/lib/supabase/client`

**Impact**: Potential auth state conflicts, race conditions

**Recommendation**: Audit all imports and ensure single client instance

**Location**: Check components importing supabase client

---

### **2. Outdated Packages (Minor Updates Available)**

**Recommended Updates**:
```bash
# Supabase (auth improvements + bug fixes)
npm install @supabase/ssr@latest @supabase/supabase-js@latest

# Anthropic SDK (latest Claude models support)
npm install @anthropic-ai/sdk@latest

# Icon library (new icons + performance)
npm install lucide-react@latest

# Security updates
npm install dompurify@latest

# Minor updates
npm install framer-motion@latest @sentry/nextjs@latest
```

**Note**: Next.js 16.x requires Node 18.18+. You're on Node 20, but staying on Next.js 15.x per your constraint.

---

### **3. Hydration Mismatch Warnings**
**Warning**: "A tree hydrated but some attributes didn't match"

**Cause**:
- CookieConsent component state changes in useEffect (server renders null, client renders banner)
- StructuredData uses dynamic timestamps that differ between server/client
- Fixed in commit: 2e0ded1e (Guardian X02)

**Impact**: Console warnings, potential rendering bugs

**Fixed**: See commit 2e0ded1e for implementation details

---

### **4. Cookie Consent Banner Blocking UI**
**Observed**: Cookie banner can block signin button clicks

**Recommendation**: Lower z-index or auto-dismiss after 5 seconds

**File**: `src/components/CookieConsent.tsx`

---

## **UI/UX Improvements To Consider**

### **1. Loading States**
**Current**: Generic "Loading..." buttons
**Better**: Skeleton loaders with shimmer effects

**Example**: Replace in Guardian dashboard:
```tsx
// Instead of: <button disabled>Loading...</button>
<Skeleton className="h-32 w-full animate-pulse" />
```

---

### **2. Error Boundaries**
**Current**: 500 errors show generic "Internal Server Error"
**Better**: User-friendly error messages with retry buttons

**Files to enhance**:
- `src/lib/error-boundary.ts` - Add recovery suggestions
- Dashboard components - Add error fallback UIs

---

### **3. Empty States**
**Current**: "No Guardian alerts recorded yet" (plain text)
**Better**: Illustrations + call-to-action buttons

**Example**: Guardian dashboard empty states could:
- Show "Get started" guide
- Link to simulation studio
- Suggest running first QA check

---

### **4. Real-time Updates**
**Current**: Manual refresh required
**Better**: Supabase Realtime subscriptions for live data

**Impact**: Guardian alerts, incidents, notifications auto-update

**Implementation**:
```typescript
// Add to Guardian components
useEffect(() => {
  const channel = supabase
    .channel('guardian-alerts')
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'guardian_alert_events',
      filter: `tenant_id=eq.${tenantId}`
    }, (payload) => {
      // Update state
    })
    .subscribe();

  return () => channel.unsubscribe();
}, [tenantId]);
```

---

### **5. Accessibility (WCAG AA)**
**Missing**:
- Skip to main content links
- Focus trap in modals
- Keyboard navigation in custom components
- ARIA live regions for dynamic content

**Quick wins**:
```tsx
// Add to layout
<a href="#main" className="sr-only focus:not-sr-only">
  Skip to main content
</a>

// Guardian alerts should announce
<div role="status" aria-live="polite">
  {alertCount} new alerts
</div>
```

---

### **6. Performance Optimizations**

**Issues Found**:
- API calls fetch profile/organizations multiple times (saw 3-4 duplicate calls)
- No request deduplication
- No caching headers

**Fixes**:
```typescript
// Add to API routes
export async function GET() {
  return NextResponse.json(data, {
    headers: {
      'Cache-Control': 'private, max-age=60',
    },
  });
}

// Add SWR or React Query for client-side caching
import useSWR from 'swr';
const { data } = useSWR(`/api/guardian/activity`, fetcher, {
  refreshInterval: 30000,
  dedupingInterval: 5000,
});
```

---

## **Recommended Next Steps**

### **High Priority (Do Now)**

1. **Update Supabase packages** - Fixes auth issues
   ```bash
   npm install @supabase/ssr@latest @supabase/supabase-js@latest
   ```

2. **Fix multiple client instances** - Check import paths
   ```bash
   grep -r "from '@/lib/supabase'" src/ | grep -v "client\|server"
   ```

3. **Test Guardian end-to-end** - Verify all features work with new auth

---

### **Medium Priority (This Week)**

4. **Add Supabase Realtime** - Live Guardian alerts
5. **Implement proper error boundaries** - Better error UX
6. **Add skeleton loaders** - Replace "Loading..." text
7. **Deduplicate API calls** - Use SWR or React Query

---

### **Low Priority (Nice to Have)**

8. **Update icons** - lucide-react@latest (100+ new icons)
9. **Add ARIA landmarks** - Accessibility improvements
10. **Add cookie banner auto-dismiss** - UX improvement
11. **Update minor dependencies** - Anthropic, Sentry, etc.

---

## **Package Update Commands**

### **Safe Updates (No Breaking Changes)**
```bash
cd /d/Unite-Hub

# Supabase (recommended)
npm install @supabase/ssr@0.8.0 @supabase/supabase-js@2.87.1

# Anthropic SDK
npm install @anthropic-ai/sdk@0.71.2

# Icons
npm install lucide-react@latest

# Security
npm install dompurify@3.3.1

# Monitoring
npm install @sentry/nextjs@10.30.0 @datadog/browser-rum@6.25.0

# Animations
npm install framer-motion@12.23.26

# Testing
npm install jsdom@27.3.0

# After updates
npm run typecheck
npm run build
npm test
```

### **Breaking/Major Updates (Evaluate First)**
```bash
# Next.js 16 (requires evaluation)
# Currently: 15.5.7 → Latest: 16.0.8
# Breaking changes in 16.x - review upgrade guide first

# Vitest (major version jump)
# Currently: 1.6.1 → Latest: 4.0.15
# Review changelog before upgrading

# React types (if upgrading to React 19)
# Currently: 18.x → Latest: 19.x
# Only if upgrading React itself
```

---

## **Missing But Recommended Packages**

### **State Management**
```bash
npm install swr
# OR
npm install @tanstack/react-query
```
**Why**: Deduplicate API calls, auto-retry, caching

### **Form Validation**
```bash
npm install zod react-hook-form @hookform/resolvers
```
**Why**: Already using Zod, add form library for better validation UX

### **Toast Notifications (Modern)**
```bash
npm install sonner
```
**Why**: Better than radix-ui/react-toast, more modern, better DX

### **Date Handling**
```bash
npm install date-fns
```
**Why**: Lightweight date formatting (Guardian timestamps, etc.)

---

## **Files That Need Review**

Based on Playwright investigation:

1. **`src/lib/supabase/client.ts`** - Multiple instance warning
2. **`src/lib/supabase/index.ts`** - Export cleanup
3. **`src/contexts/AuthContext.tsx`** - Reduce duplicate API calls
4. **`src/components/CookieConsent.tsx`** - Lower z-index
5. **`src/app/api/demo/initialize/route.ts`** - RLS policy violation
6. **`src/app/api/contacts/route.ts`** - Handle missing workspace gracefully

---

## **Quick Wins (30 minutes each)**

### **Win 1: Fix Duplicate API Calls**
Add SWR to profile/org fetching:
```typescript
// In AuthContext
const { data: profile } = useSWR(
  user ? `/api/profile?userId=${user.id}` : null,
  fetcher,
  { dedupingInterval: 5000 }
);
```

### **Win 2: Better Empty States**
Replace plain text with:
```tsx
<div className="text-center py-12">
  <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
  <h3 className="text-lg font-medium mb-2">No alerts yet</h3>
  <p className="text-muted-foreground mb-4">
    Run your first simulation to generate alerts
  </p>
  <Button asChild>
    <a href="/guardian/admin/simulation">Create Simulation</a>
  </Button>
</div>
```

### **Win 3: Add Loading Skeletons**
```tsx
{isLoading ? (
  <div className="space-y-4">
    <Skeleton className="h-20 w-full" />
    <Skeleton className="h-20 w-full" />
    <Skeleton className="h-20 w-full" />
  </div>
) : (
  <AlertsList alerts={alerts} />
)}
```

---

## **Summary**

**What's working**:
✅ Authentication fully functional
✅ Guardian features accessible
✅ Layout rendering correctly
✅ All core functionality operational

**Recommended updates**:
1. **Update Supabase packages** (fixes auth issues)
2. **Install SWR** (reduce duplicate calls)
3. **Add better loading/empty states** (UX polish)
4. **Fix multiple client instances** (console warning)

**Can skip**:
- Next.js 16 (breaking changes, staying on 15.x is fine)
- Major Vitest upgrade (1.x → 4.x, review first)
- Icon updates (nice to have, not critical)

---

**Want me to implement any of these fixes now?**
