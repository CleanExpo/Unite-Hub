# Session Timeout - Quick Start Guide

**5-Minute Setup** for Unite-Hub session timeout management.

## Step 1: Wrap Your App (2 minutes)

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

Done! That's it for basic setup.

## Step 2: Test It (2 minutes)

1. Start your dev server: `npm run dev`
2. Log in to the dashboard
3. Stay idle for 28 minutes (or modify config for faster testing)
4. Warning modal should appear with 2-minute countdown
5. Click "Stay logged in" to extend session
6. Or wait 2 minutes to be auto-logged out

## Step 3: Customize (Optional, 1 minute)

### Faster Testing (15-second timeout)

```tsx
<SessionTimeoutProvider
  config={{
    idleTimeout: 15 * 1000,      // 15 seconds
    warningTime: 5 * 1000,       // 5 seconds warning
  }}
>
  {children}
</SessionTimeoutProvider>
```

### Use Toast Instead of Modal

```tsx
<SessionTimeoutProvider useToast>
  {children}
</SessionTimeoutProvider>
```

### Strict Security (10-minute timeout)

```tsx
<SessionTimeoutProvider
  config={{
    idleTimeout: 10 * 60 * 1000,      // 10 minutes
    warningTime: 1 * 60 * 1000,       // 1 minute
    enableRememberMe: false,           // Disable remember me
  }}
>
  {children}
</SessionTimeoutProvider>
```

## Common Configurations

### Default (Recommended)
- Idle timeout: 30 minutes
- Warning: 2 minutes before
- Session check: Every 5 minutes
- Remember me: Enabled (30 days)

### High Security
- Idle timeout: 10 minutes
- Warning: 1 minute before
- Session check: Every 2 minutes
- Remember me: Disabled

### Internal Tools
- Idle timeout: 60 minutes
- Warning: 5 minutes before
- Session check: Every 10 minutes
- Remember me: Enabled (90 days)

## Default Behavior

Without any configuration, you get:

- **30-minute idle timeout** - User inactive for 30 minutes
- **2-minute warning** - Warning shown at 28-minute mark
- **5-minute session checks** - Validates session every 5 minutes
- **Remember me enabled** - Sessions can be extended to 30 days
- **Auto-refresh** - Proactively refreshes expiring sessions
- **Modal warning** - Full-screen modal with countdown

## Tracked Activity Events

The following user actions reset the idle timer:

- Mouse clicks (`mousedown`)
- Mouse movement (`mousemove`)
- Keyboard input (`keypress`)
- Page scrolling (`scroll`)
- Touch events (`touchstart`)
- General clicks (`click`)

## API Routes Created

- `POST /api/auth/refresh-session` - Manually refresh session

## Files Created

```
src/
├── lib/auth/session-timeout.ts                      # Core hook & utilities
├── components/auth/SessionTimeoutWarning.tsx        # Modal component & provider
└── app/api/auth/refresh-session/route.ts           # Session refresh API

docs/
├── SESSION_TIMEOUT.md                               # Full documentation
└── SESSION_TIMEOUT_QUICK_START.md                   # This file

examples/
└── session-timeout-integration.tsx                  # 12 integration examples
```

## Integration Locations

### Recommended

```tsx
// app/layout.tsx - App-wide (all pages)
<SessionTimeoutProvider>{children}</SessionTimeoutProvider>
```

### Alternative

```tsx
// app/(dashboard)/layout.tsx - Dashboard only
<SessionTimeoutProvider>{children}</SessionTimeoutProvider>
```

### Not Recommended

Don't wrap individual pages - wrap at layout level for consistency.

## Troubleshooting

### Warning not showing?

```tsx
// Add callbacks to debug
<SessionTimeoutProvider
  config={{
    onIdle: () => console.log('User is idle'),
    onWarning: () => console.log('Warning shown!'),
    onExpire: () => console.log('Session expired'),
  }}
>
  {children}
</SessionTimeoutProvider>
```

### Testing too slow?

```tsx
// Use fast timeouts for testing
<SessionTimeoutProvider
  config={{
    idleTimeout: 10 * 1000,      // 10 seconds
    warningTime: 5 * 1000,       // 5 seconds
  }}
>
  {children}
</SessionTimeoutProvider>
```

### Session not refreshing?

Check browser console for errors. Make sure `/api/auth/refresh-session` is accessible.

## Next Steps

- Read full docs: `docs/SESSION_TIMEOUT.md`
- See examples: `examples/session-timeout-integration.tsx`
- Customize styling: Edit `src/components/auth/SessionTimeoutWarning.tsx`
- Add analytics: Use `onIdle`, `onWarning`, `onExpire` callbacks

## Support

- Full documentation: `docs/SESSION_TIMEOUT.md`
- Integration examples: `examples/session-timeout-integration.tsx`
- Security plan: `docs/SECURITY_FIX_PLAN.md`
- API docs: `docs/API_ROUTE_SECURITY_AUDIT.md`

---

**Setup Time**: 5 minutes
**Testing Time**: 2 minutes
**Production Ready**: Yes
