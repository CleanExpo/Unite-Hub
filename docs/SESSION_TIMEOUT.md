# Session Timeout Management

**Status**: ✅ Implemented
**Security Priority**: P2-4
**Last Updated**: 2025-12-03

## Overview

Unite-Hub implements comprehensive session timeout handling to protect user accounts from unauthorized access when left idle. The system detects user inactivity, shows warnings before logout, and provides seamless session extension.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    User Activity                         │
│         (mouse, keyboard, scroll, touch)                │
└─────────────────────┬───────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────┐
│              useIdleTimeout Hook                         │
│  - Tracks activity events                               │
│  - Manages idle timer (30 min default)                  │
│  - Validates session periodically (5 min)               │
│  - Triggers warning at 28 min                           │
└─────────────────────┬───────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────┐
│          SessionTimeoutWarning Modal                     │
│  - Shows 2-minute countdown                             │
│  - "Stay logged in" button                              │
│  - "Log out now" button                                 │
└─────────────────────┬───────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────┐
│              User Decision                               │
│  ├─ Click "Stay logged in" → Refresh session            │
│  ├─ Click "Log out now" → Immediate logout              │
│  └─ No action (2 min) → Auto logout                     │
└─────────────────────────────────────────────────────────┘
```

## Key Features

### 1. Idle Detection

**Tracked Events**:
- `mousedown` - Mouse clicks
- `mousemove` - Mouse movement
- `keypress` - Keyboard input
- `scroll` - Page scrolling
- `touchstart` - Touch screen
- `click` - Click events

**Throttling**: Activity updates are throttled to max once per second to prevent performance issues.

### 2. Configurable Timeouts

```typescript
interface SessionTimeoutConfig {
  idleTimeout: number;           // 30 minutes (default)
  warningTime: number;           // 2 minutes (default)
  sessionCheckInterval: number;  // 5 minutes (default)
  enableRememberMe: boolean;     // true (default)
  rememberMeDuration: number;    // 30 days (default)
}
```

### 3. Warning Modal

**Shown at**: `idleTimeout - warningTime` (28 minutes by default)

**Features**:
- Real-time countdown display (MM:SS format)
- Color-coded urgency (yellow → orange → red)
- Two action buttons
- Cannot be dismissed by clicking outside

**Warning Levels**:
- **Critical** (≤30s): Red styling, urgent
- **High** (≤60s): Orange styling, important
- **Medium** (>60s): Yellow styling, informative

### 4. Automatic Session Refresh

**Server-side session validation**:
- Runs every 5 minutes (configurable)
- Checks session expiry
- Proactively refreshes if expiring within 5 minutes
- Handles session refresh failures gracefully

**Refresh triggers**:
- User clicks "Stay logged in"
- Session about to expire (auto)
- User returns to tab after absence

### 5. Remember Me Support

**Storage**: `localStorage` key: `unite_hub_remember_me`

**Behavior**:
- If enabled: Extended session duration (30 days)
- If disabled: Session-only (browser close = logout)
- Cleared on explicit logout

## File Structure

```
src/
├── lib/
│   └── auth/
│       └── session-timeout.ts           # Core timeout logic
├── components/
│   └── auth/
│       └── SessionTimeoutWarning.tsx    # Warning modal + provider
└── app/
    └── api/
        └── auth/
            └── refresh-session/
                └── route.ts             # Session refresh API
```

## Integration

### Basic Setup

```tsx
// app/layout.tsx or app/(dashboard)/layout.tsx
import { SessionTimeoutProvider } from '@/components/auth/SessionTimeoutWarning';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <SessionTimeoutProvider>
          {children}
        </SessionTimeoutProvider>
      </body>
    </html>
  );
}
```

### Custom Configuration

```tsx
import { SessionTimeoutProvider } from '@/components/auth/SessionTimeoutWarning';

<SessionTimeoutProvider
  config={{
    idleTimeout: 15 * 60 * 1000,      // 15 minutes
    warningTime: 1 * 60 * 1000,       // 1 minute
    sessionCheckInterval: 3 * 60 * 1000, // 3 minutes
    onWarning: () => {
      console.log('Warning shown');
    },
    onExpire: () => {
      console.log('Session expired');
    },
  }}
>
  {children}
</SessionTimeoutProvider>
```

### Toast Instead of Modal

```tsx
<SessionTimeoutProvider useToast>
  {children}
</SessionTimeoutProvider>
```

### Custom Warning Component

```tsx
import { SessionTimeoutWarning } from '@/components/auth/SessionTimeoutWarning';

function MyCustomWarning(props) {
  return (
    <SessionTimeoutWarning
      {...props}
      title="Custom Title"
      description="Custom description"
    />
  );
}

<SessionTimeoutProvider warningComponent={MyCustomWarning}>
  {children}
</SessionTimeoutProvider>
```

### Direct Hook Usage

```tsx
'use client';

import { useIdleTimeout } from '@/lib/auth/session-timeout';

export function MyComponent() {
  const { isIdle, isWarning, remainingTime, extendSession, logout } = useIdleTimeout({
    idleTimeout: 30 * 60 * 1000,
    warningTime: 2 * 60 * 1000,
    onIdle: () => console.log('User is idle'),
    onWarning: () => console.log('Warning shown'),
    onExpire: () => console.log('Session expired'),
  });

  return (
    <div>
      {isWarning && (
        <div>
          Warning! {remainingTime}s remaining
          <button onClick={extendSession}>Stay logged in</button>
          <button onClick={logout}>Log out</button>
        </div>
      )}
    </div>
  );
}
```

## API Routes

### POST /api/auth/refresh-session

Manually refresh the Supabase session.

**Request**:
```bash
POST /api/auth/refresh-session
Content-Type: application/json
```

**Response** (200):
```json
{
  "success": true,
  "expiresAt": 1234567890,
  "refreshedAt": "2025-12-03T10:30:00.000Z"
}
```

**Response** (401):
```json
{
  "success": false,
  "error": "No active session found"
}
```

**Response** (500):
```json
{
  "success": false,
  "error": "Session refresh failed"
}
```

## Utility Functions

### Server-side Utilities

```typescript
import {
  isSessionExpired,
  needsSessionRefresh,
  getRemainingSessionTime
} from '@/lib/auth/session-timeout';

// Check if session is expired
const expired = isSessionExpired(session.expires_at);

// Check if needs refresh
const needsRefresh = needsSessionRefresh(session.expires_at);

// Get remaining time
const remaining = getRemainingSessionTime(session.expires_at);
```

### Remember Me Utilities

```typescript
import {
  setRememberMe,
  getRememberMe,
  clearRememberMe
} from '@/lib/auth/session-timeout';

// Set preference
setRememberMe(true);

// Get preference
const remember = getRememberMe(); // boolean

// Clear preference
clearRememberMe();
```

### Client-side API Call

```typescript
import { refreshSessionAPI } from '@/lib/auth/session-timeout';

const result = await refreshSessionAPI();

if (result.success) {
  console.log('Session refreshed!');
} else {
  console.error('Failed:', result.error);
}
```

## Security Considerations

### ✅ Best Practices

1. **Session stored in HTTP-only cookies** (PKCE flow)
   - Not accessible to JavaScript
   - Protected from XSS attacks

2. **Automatic token refresh**
   - Supabase handles refresh token rotation
   - Old refresh tokens invalidated

3. **Server-side session validation**
   - Periodic checks every 5 minutes
   - Validates with Supabase auth server

4. **Proactive expiry handling**
   - Refreshes before expiration
   - Prevents sudden logouts during use

5. **Secure logout**
   - Calls `supabase.auth.signOut()`
   - Clears all session data
   - Redirects to login

### ⚠️ Security Notes

1. **Do not disable `autoRefreshToken`**
   - Required for session persistence
   - Handled automatically by Supabase

2. **Validate session server-side**
   - Never trust client-side session alone
   - Always verify with Supabase

3. **Use HTTPS in production**
   - Required for secure cookies
   - Protects session tokens

4. **Log security events**
   - Track session expirations
   - Monitor refresh failures
   - Alert on suspicious patterns

## Configuration Examples

### Strict Security (High-Security Apps)

```typescript
const strictConfig = {
  idleTimeout: 10 * 60 * 1000,      // 10 minutes
  warningTime: 1 * 60 * 1000,       // 1 minute
  sessionCheckInterval: 2 * 60 * 1000, // 2 minutes
  enableRememberMe: false,           // Disable remember me
};
```

### Relaxed (Internal Tools)

```typescript
const relaxedConfig = {
  idleTimeout: 60 * 60 * 1000,      // 60 minutes
  warningTime: 5 * 60 * 1000,       // 5 minutes
  sessionCheckInterval: 10 * 60 * 1000, // 10 minutes
  enableRememberMe: true,            // Allow remember me
  rememberMeDuration: 90 * 24 * 60 * 60 * 1000, // 90 days
};
```

### Default (Recommended)

```typescript
const defaultConfig = {
  idleTimeout: 30 * 60 * 1000,      // 30 minutes
  warningTime: 2 * 60 * 1000,       // 2 minutes
  sessionCheckInterval: 5 * 60 * 1000, // 5 minutes
  enableRememberMe: true,            // Allow remember me
  rememberMeDuration: 30 * 24 * 60 * 60 * 1000, // 30 days
};
```

## Testing

### Manual Testing

1. **Idle Detection**:
   - Open app and stay idle for 28 minutes
   - Warning modal should appear
   - Countdown should be accurate

2. **Session Extension**:
   - Click "Stay logged in"
   - Modal should close
   - Idle timer should reset

3. **Auto Logout**:
   - Don't click anything in warning modal
   - Should auto-logout after 2 minutes
   - Should redirect to `/login?reason=session_expired`

4. **Tab Switching**:
   - Open app in one tab
   - Switch to another tab for 20 minutes
   - Return to app tab
   - Session should be validated automatically

5. **Activity Reset**:
   - Move mouse or type
   - Idle timer should reset
   - No warning should appear

### Automated Testing

```typescript
// Example test (Jest + React Testing Library)
import { renderHook, act } from '@testing-library/react';
import { useIdleTimeout } from '@/lib/auth/session-timeout';

describe('useIdleTimeout', () => {
  it('should trigger warning after idle timeout', async () => {
    jest.useFakeTimers();

    const { result } = renderHook(() => useIdleTimeout({
      idleTimeout: 1000,
      warningTime: 500,
    }));

    expect(result.current.isWarning).toBe(false);

    // Fast-forward to trigger warning
    act(() => {
      jest.advanceTimersByTime(500);
    });

    expect(result.current.isWarning).toBe(true);

    jest.useRealTimers();
  });
});
```

## Troubleshooting

### Warning not appearing

**Check**:
1. Provider is wrapping your app
2. Config values are valid
3. No JavaScript errors in console
4. Activity events are being detected

**Debug**:
```typescript
const { isIdle, isWarning } = useIdleTimeout({
  onIdle: () => console.log('IDLE DETECTED'),
  onWarning: () => console.log('WARNING SHOWN'),
});
```

### Session refreshing too frequently

**Check**:
1. `sessionCheckInterval` not too low (<5 min)
2. No duplicate providers
3. No infinite loops in callbacks

### Session not refreshing

**Check**:
1. API route `/api/auth/refresh-session` is accessible
2. Supabase client configured correctly
3. Network tab shows successful requests
4. No CORS errors

### Logout not working

**Check**:
1. `supabase.auth.signOut()` is being called
2. Redirect to `/login` is happening
3. Cookies are being cleared
4. No errors in console

## Performance Considerations

### Event Throttling

Activity events are throttled to max **1 update per second**:

```typescript
const handleActivity = useCallback(() => {
  const now = Date.now();
  if (now - lastActivityRef.current < 1000) {
    return; // Skip if within 1 second
  }
  resetIdleTimer();
}, [resetIdleTimer]);
```

### Memory Management

All timers are properly cleaned up:

```typescript
useEffect(() => {
  // Setup timers
  return () => {
    clearAllTimers(); // Cleanup on unmount
  };
}, []);
```

### Passive Event Listeners

Uses passive listeners for better performance:

```typescript
document.addEventListener(event, handleActivity, { passive: true });
```

## Future Enhancements

### Planned Features

1. **Multi-tab synchronization**
   - Share session state across tabs
   - Sync logout across tabs

2. **Activity heatmap**
   - Track user activity patterns
   - Optimize timeout values

3. **Customizable warning stages**
   - Multiple warnings (10 min, 5 min, 2 min)
   - Different actions at each stage

4. **Analytics integration**
   - Track session durations
   - Monitor logout reasons
   - Identify idle patterns

5. **Background tab detection**
   - Pause timer when tab in background
   - Resume on tab focus

## References

- **Supabase Auth Docs**: https://supabase.com/docs/guides/auth
- **PKCE Flow**: https://supabase.com/docs/guides/auth/auth-helpers/nextjs
- **Session Management**: https://supabase.com/docs/guides/auth/sessions

## Related Documentation

- `docs/SECURITY_FIX_PLAN.md` - Overall security implementation plan
- `docs/WEBHOOK_REPLAY_PREVENTION.md` - Webhook security
- `docs/LOG_SANITIZATION.md` - Log security
- `docs/API_ROUTE_SECURITY_AUDIT.md` - API security audit

---

**Implementation Status**: ✅ Complete
**Last Reviewed**: 2025-12-03
**Next Review**: 2026-01-03
