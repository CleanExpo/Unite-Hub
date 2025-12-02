# Session Timeout - Integration Checklist

**Task**: P2-4 Session Timeout Configuration
**Status**: Ready for Integration
**Estimated Integration Time**: 15 minutes

## Pre-Integration Checklist

- [ ] All files created and in correct locations
- [ ] Documentation reviewed
- [ ] Example code reviewed
- [ ] TypeScript types verified
- [ ] Dependencies available (react, next, supabase)

## Integration Steps

### Step 1: Add Provider to Layout (5 minutes)

**File**: `src/app/layout.tsx` or `src/app/(dashboard)/layout.tsx`

**Option A**: App-wide (Recommended)

```tsx
// src/app/layout.tsx
import { SessionTimeoutProvider } from '@/components/auth/SessionTimeoutWarning';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <SessionTimeoutProvider>
          {children}
        </SessionTimeoutProvider>
      </body>
    </html>
  );
}
```

**Option B**: Dashboard-only

```tsx
// src/app/(dashboard)/layout.tsx
import { SessionTimeoutProvider } from '@/components/auth/SessionTimeoutWarning';

export default function DashboardLayout({ children }) {
  return (
    <SessionTimeoutProvider>
      {children}
    </SessionTimeoutProvider>
  );
}
```

**Status**: ⬜ Not started | ⏳ In progress | ✅ Complete

---

### Step 2: Configure Timeout Settings (2 minutes)

**Choose Configuration**:

- [ ] **Default** (30 min idle, 2 min warning) - Recommended
- [ ] **Strict** (10 min idle, 1 min warning) - High security
- [ ] **Relaxed** (60 min idle, 5 min warning) - Internal tools

**For testing** (use fast timeouts):

```tsx
<SessionTimeoutProvider
  config={{
    idleTimeout: 10 * 1000,      // 10 seconds
    warningTime: 5 * 1000,       // 5 seconds
  }}
>
  {children}
</SessionTimeoutProvider>
```

**Status**: ⬜ Not started | ⏳ In progress | ✅ Complete

---

### Step 3: Test Basic Functionality (5 minutes)

**Manual Tests**:

1. [ ] Start dev server: `npm run dev`
2. [ ] Login to application
3. [ ] Stay idle for configured time
4. [ ] Verify warning modal appears
5. [ ] Verify countdown is accurate
6. [ ] Click "Stay logged in" button
7. [ ] Verify modal closes and timer resets
8. [ ] Stay idle again until warning
9. [ ] Wait for auto-logout (don't click)
10. [ ] Verify redirect to `/login?reason=session_expired`

**Expected Results**:
- ✅ Warning appears after (idle timeout - warning time)
- ✅ Countdown starts from warning time
- ✅ "Stay logged in" extends session
- ✅ Auto-logout after warning time expires
- ✅ Redirect to login page

**Status**: ⬜ Not started | ⏳ In progress | ✅ Complete

---

### Step 4: Test Activity Reset (2 minutes)

**Tests**:

1. [ ] Login to application
2. [ ] Wait 20 seconds (with 30-second timeout)
3. [ ] Move mouse or type something
4. [ ] Wait another 20 seconds
5. [ ] Verify NO warning appears (timer reset)

**Expected Results**:
- ✅ Activity resets idle timer
- ✅ No warning if active within timeout

**Status**: ⬜ Not started | ⏳ In progress | ✅ Complete

---

### Step 5: Test Tab Switching (1 minute)

**Tests**:

1. [ ] Login to application
2. [ ] Switch to another browser tab
3. [ ] Wait 5+ minutes
4. [ ] Switch back to app tab
5. [ ] Verify session is still valid (no errors)

**Expected Results**:
- ✅ Session validated on tab focus
- ✅ No errors in console

**Status**: ⬜ Not started | ⏳ In progress | ✅ Complete

---

## Optional Enhancements

### Add Analytics Tracking (Optional)

```tsx
<SessionTimeoutProvider
  config={{
    onWarning: () => {
      // Track warning event
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'session_timeout_warning', {
          event_category: 'security',
        });
      }
    },
    onExpire: () => {
      // Track expiration
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'session_expired', {
          event_category: 'security',
          event_label: 'idle_timeout',
        });
      }
    },
  }}
>
  {children}
</SessionTimeoutProvider>
```

**Status**: ⬜ Not needed | ⏳ In progress | ✅ Complete

---

### Use Toast Instead of Modal (Optional)

```tsx
<SessionTimeoutProvider useToast>
  {children}
</SessionTimeoutProvider>
```

**Status**: ⬜ Not needed | ⏳ In progress | ✅ Complete

---

### Add Custom Callbacks (Optional)

```tsx
<SessionTimeoutProvider
  config={{
    onIdle: () => console.log('User idle'),
    onWarning: () => console.log('Warning shown'),
    onExpire: () => console.log('Session expired'),
    onRefresh: () => console.log('Session refreshed'),
  }}
>
  {children}
</SessionTimeoutProvider>
```

**Status**: ⬜ Not needed | ⏳ In progress | ✅ Complete

---

## Deployment Checklist

### Before Staging Deployment

- [ ] Remove test configurations (fast timeouts)
- [ ] Set production timeout values (30 min default)
- [ ] Test with real user workflow
- [ ] Verify all activity events trigger reset
- [ ] Check mobile browser compatibility
- [ ] Test on different screen sizes

### Before Production Deployment

- [ ] Staging tests passed for 24+ hours
- [ ] No console errors
- [ ] Analytics tracking verified (if added)
- [ ] User feedback collected (if possible)
- [ ] Documentation reviewed by team
- [ ] Timeout values approved by security team

---

## Troubleshooting

### Warning not appearing?

**Debug**:
```tsx
<SessionTimeoutProvider
  config={{
    onIdle: () => console.log('IDLE at', new Date()),
    onWarning: () => console.log('WARNING at', new Date()),
  }}
>
  {children}
</SessionTimeoutProvider>
```

**Check**:
- [ ] Provider is wrapping your app
- [ ] No JavaScript errors in console
- [ ] Timeouts are configured correctly
- [ ] Activity events are being detected

---

### Session not refreshing?

**Check**:
- [ ] `/api/auth/refresh-session` route exists
- [ ] No network errors in browser DevTools
- [ ] Supabase client configured correctly
- [ ] No CORS errors

**Test API directly**:
```bash
curl -X POST http://localhost:3008/api/auth/refresh-session \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie"
```

---

### Auto-logout not working?

**Check**:
- [ ] `supabase.auth.signOut()` is being called
- [ ] No errors in console
- [ ] Redirect to `/login` is happening
- [ ] Cookies are being cleared

---

## Performance Verification

### Check Performance

- [ ] No memory leaks (Chrome DevTools → Memory)
- [ ] Event listeners cleaned up on unmount
- [ ] Activity events throttled (max 1/sec)
- [ ] No excessive re-renders

### Monitor Console

**Should NOT see**:
- ❌ Memory leak warnings
- ❌ Excessive event listener registrations
- ❌ React key warnings
- ❌ Hydration errors

**Should see**:
- ✅ Session validated on tab focus
- ✅ Session refreshed proactively
- ✅ Clean logout on timeout

---

## Rollback Plan

If issues occur after deployment:

### Immediate Rollback

1. Remove `<SessionTimeoutProvider>` from layout
2. Deploy immediately
3. Session timeout will be disabled
4. Investigate issues

### Files to Revert

- `src/app/layout.tsx` or `src/app/(dashboard)/layout.tsx`

**Note**: Core files can stay in place, just remove provider usage.

---

## Success Criteria

**Integration is successful when**:

✅ Warning modal appears after configured idle time
✅ Countdown is accurate
✅ "Stay logged in" extends session correctly
✅ Auto-logout works after warning expires
✅ Activity resets idle timer
✅ Tab switching validates session
✅ No console errors
✅ No memory leaks
✅ Mobile browsers work correctly
✅ All manual tests pass

---

## Timeline

**Estimated Time**: 15 minutes
- Step 1 (Add provider): 5 min
- Step 2 (Configure): 2 min
- Step 3 (Test basic): 5 min
- Step 4 (Test activity): 2 min
- Step 5 (Test tabs): 1 min

**Testing Time**: 30 minutes
- Manual testing: 15 min
- Browser compatibility: 10 min
- Performance check: 5 min

**Total Time**: ~45 minutes

---

## Support Resources

- **Full Documentation**: `docs/SESSION_TIMEOUT.md`
- **Quick Start**: `docs/SESSION_TIMEOUT_QUICK_START.md`
- **Examples**: `examples/session-timeout-integration.tsx`
- **Tests**: `tests/lib/auth/session-timeout.test.ts`
- **Task Summary**: `TASK_P2-4_SESSION_TIMEOUT_COMPLETE.md`

---

## Sign-off

**Integration Completed by**: _________________

**Date**: _________________

**Tested by**: _________________

**Approved by**: _________________

**Notes**:
_________________________________________________________________
_________________________________________________________________
_________________________________________________________________

---

**Status**: Ready for integration ✅
**Last Updated**: 2025-12-03
