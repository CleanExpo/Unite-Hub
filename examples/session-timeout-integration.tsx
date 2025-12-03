/**
 * Session Timeout Integration Examples
 *
 * Examples showing how to integrate session timeout in different scenarios.
 */

import React from 'react';
import { SessionTimeoutProvider } from '@/components/auth/SessionTimeoutWarning';
import { useIdleTimeout } from '@/lib/auth/session-timeout';

// =====================================================
// EXAMPLE 1: Basic Integration (App-Wide)
// =====================================================

/**
 * Wrap your entire app with SessionTimeoutProvider
 * This is the recommended approach for most applications.
 */
export function Example1_BasicAppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SessionTimeoutProvider>
      {children}
    </SessionTimeoutProvider>
  );
}

// =====================================================
// EXAMPLE 2: Custom Timeout Configuration
// =====================================================

/**
 * Use custom timeout values for specific security requirements.
 * This example shows a strict 15-minute timeout.
 */
export function Example2_StrictTimeout({ children }: { children: React.ReactNode }) {
  return (
    <SessionTimeoutProvider
      config={{
        idleTimeout: 15 * 60 * 1000,      // 15 minutes
        warningTime: 1 * 60 * 1000,       // 1 minute warning
        sessionCheckInterval: 2 * 60 * 1000, // Check every 2 min
        enableRememberMe: false,           // Disable remember me
      }}
    >
      {children}
    </SessionTimeoutProvider>
  );
}

// =====================================================
// EXAMPLE 3: Toast Notification Style
// =====================================================

/**
 * Use a toast notification instead of modal for less intrusive UX.
 * Good for internal tools or apps where users need to stay focused.
 */
export function Example3_ToastNotification({ children }: { children: React.ReactNode }) {
  return (
    <SessionTimeoutProvider useToast>
      {children}
    </SessionTimeoutProvider>
  );
}

// =====================================================
// EXAMPLE 4: Custom Callbacks
// =====================================================

/**
 * Add custom callbacks to track session events.
 * Useful for analytics, logging, or triggering other actions.
 */
export function Example4_WithCallbacks({ children }: { children: React.ReactNode }) {
  const handleIdle = () => {
    console.log('User became idle at:', new Date().toISOString());
    // Track in analytics
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'user_idle', {
        event_category: 'session',
        event_label: 'idle_detected',
      });
    }
  };

  const handleWarning = () => {
    console.log('Session timeout warning shown');
    // Show custom notification
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        new Notification('Session Expiring', {
          body: 'Your session will expire soon. Click to stay logged in.',
          icon: '/favicon.ico',
        });
      }
    }
  };

  const handleExpire = () => {
    console.log('Session expired at:', new Date().toISOString());
    // Log to server
    fetch('/api/analytics/session-expired', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        timestamp: new Date().toISOString(),
        reason: 'idle_timeout',
      }),
    });
  };

  const handleRefresh = () => {
    console.log('Session refreshed at:', new Date().toISOString());
  };

  return (
    <SessionTimeoutProvider
      config={{
        onIdle: handleIdle,
        onWarning: handleWarning,
        onExpire: handleExpire,
        onRefresh: handleRefresh,
      }}
    >
      {children}
    </SessionTimeoutProvider>
  );
}

// =====================================================
// EXAMPLE 5: Direct Hook Usage
// =====================================================

/**
 * Use the hook directly for custom UI or behavior.
 * This gives you full control over the timeout logic.
 */
export function Example5_DirectHook() {
  const { isIdle, isWarning, remainingTime, extendSession, logout } = useIdleTimeout({
    idleTimeout: 30 * 60 * 1000,
    warningTime: 2 * 60 * 1000,
  });

  return (
    <div>
      {isWarning && (
        <div className="fixed bottom-4 right-4 bg-yellow-100 border border-yellow-300 rounded-lg p-4 shadow-lg">
          <h3 className="font-bold text-yellow-900">Session Expiring</h3>
          <p className="text-yellow-800">
            Your session will expire in {Math.floor(remainingTime / 60)}:{(remainingTime % 60).toString().padStart(2, '0')}
          </p>
          <div className="flex gap-2 mt-2">
            <button
              onClick={extendSession}
              className="px-4 py-2 bg-blue-600 text-white rounded"
            >
              Stay Logged In
            </button>
            <button
              onClick={logout}
              className="px-4 py-2 bg-red-600 text-white rounded"
            >
              Log Out
            </button>
          </div>
        </div>
      )}

      <div className="p-4">
        <h1>My App</h1>
        <p>Idle: {isIdle ? 'Yes' : 'No'}</p>
        <p>Warning: {isWarning ? 'Yes' : 'No'}</p>
      </div>
    </div>
  );
}

// =====================================================
// EXAMPLE 6: Dashboard-Only Timeout
// =====================================================

/**
 * Apply timeout only to dashboard routes.
 * This is useful if you want different behavior for public vs authenticated pages.
 */
export function Example6_DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <SessionTimeoutProvider
        config={{
          idleTimeout: 30 * 60 * 1000,
          warningTime: 2 * 60 * 1000,
        }}
      >
        <nav>Dashboard Navigation</nav>
        <main>{children}</main>
      </SessionTimeoutProvider>
    </div>
  );
}

// =====================================================
// EXAMPLE 7: Environment-Based Configuration
// =====================================================

/**
 * Different timeout settings based on environment.
 * Longer timeouts in development, strict in production.
 */
export function Example7_EnvironmentBased({ children }: { children: React.ReactNode }) {
  const isDevelopment = process.env.NODE_ENV === 'development';

  const config = isDevelopment
    ? {
        // Relaxed for development
        idleTimeout: 60 * 60 * 1000,      // 60 minutes
        warningTime: 5 * 60 * 1000,       // 5 minutes
      }
    : {
        // Strict for production
        idleTimeout: 15 * 60 * 1000,      // 15 minutes
        warningTime: 1 * 60 * 1000,       // 1 minute
      };

  return (
    <SessionTimeoutProvider config={config}>
      {children}
    </SessionTimeoutProvider>
  );
}

// =====================================================
// EXAMPLE 8: Role-Based Timeout
// =====================================================

/**
 * Different timeout settings based on user role.
 * Stricter timeout for admin users, relaxed for regular users.
 */
export function Example8_RoleBased({
  children,
  userRole,
}: {
  children: React.ReactNode;
  userRole: 'admin' | 'user';
}) {
  const config = userRole === 'admin'
    ? {
        // Strict for admins
        idleTimeout: 10 * 60 * 1000,      // 10 minutes
        warningTime: 1 * 60 * 1000,       // 1 minute
      }
    : {
        // Relaxed for regular users
        idleTimeout: 30 * 60 * 1000,      // 30 minutes
        warningTime: 2 * 60 * 1000,       // 2 minutes
      };

  return (
    <SessionTimeoutProvider config={config}>
      {children}
    </SessionTimeoutProvider>
  );
}

// =====================================================
// EXAMPLE 9: Multi-Tab Synchronization (Future)
// =====================================================

/**
 * This example shows the planned multi-tab sync feature.
 * NOT YET IMPLEMENTED - Coming in future release.
 */
export function Example9_MultiTabSync({ children }: { children: React.ReactNode }) {
  // Future: Use BroadcastChannel API to sync across tabs
  // React.useEffect(() => {
  //   const channel = new BroadcastChannel('session_timeout');
  //   channel.onmessage = (event) => {
  //     if (event.data.type === 'logout') {
  //       // Logout all tabs
  //     }
  //   };
  //   return () => channel.close();
  // }, []);

  return (
    <SessionTimeoutProvider>
      {children}
    </SessionTimeoutProvider>
  );
}

// =====================================================
// EXAMPLE 10: Server-Side Session Validation
// =====================================================

/**
 * Example of server-side session validation in API route.
 * Use this pattern in your API routes to validate session age.
 */

/*
// api/protected/route.ts
import { createClient } from '@/lib/supabase/server';
import { isSessionExpired, needsSessionRefresh } from '@/lib/auth/session-timeout';

export async function GET() {
  const supabase = await createClient();
  const { data: { session }, error } = await supabase.auth.getSession();

  if (error || !session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check if session is expired
  if (isSessionExpired(session.expires_at)) {
    return NextResponse.json({ error: 'Session expired' }, { status: 401 });
  }

  // Check if session needs refresh
  if (needsSessionRefresh(session.expires_at)) {
    // Trigger refresh warning to client
    return NextResponse.json(
      { warning: 'Session expiring soon' },
      {
        status: 200,
        headers: { 'X-Session-Expiring': 'true' }
      }
    );
  }

  // Session is valid
  return NextResponse.json({ message: 'Success' });
}
*/

// =====================================================
// EXAMPLE 11: Custom Warning Component
// =====================================================

/**
 * Create a custom warning component with your own styling.
 */

import { SessionTimeoutWarningProps } from '@/components/auth/SessionTimeoutWarning';

function CustomWarningModal({
  isOpen,
  remainingTime,
  onExtendSession,
  onLogout,
}: SessionTimeoutWarningProps) {
  if (!isOpen) {
    return null;
  }

  const minutes = Math.floor(remainingTime / 60);
  const seconds = remainingTime % 60;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md shadow-xl">
        <h2 className="text-2xl font-bold mb-4">
          Session Timeout Warning
        </h2>
        <p className="mb-4 text-gray-600 dark:text-gray-300">
          Your session will expire in{' '}
          <span className="font-mono font-bold text-2xl text-red-600">
            {minutes}:{seconds.toString().padStart(2, '0')}
          </span>
        </p>
        <div className="flex gap-3">
          <button
            onClick={onExtendSession}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded"
          >
            Continue Session
          </button>
          <button
            onClick={onLogout}
            className="bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 px-4 rounded"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}

export function Example11_CustomWarning({ children }: { children: React.ReactNode }) {
  return (
    <SessionTimeoutProvider warningComponent={CustomWarningModal}>
      {children}
    </SessionTimeoutProvider>
  );
}

// =====================================================
// EXAMPLE 12: Remember Me Integration
// =====================================================

/**
 * Integrate with login form to support "Remember Me" checkbox.
 */

import { setRememberMe, getRememberMe } from '@/lib/auth/session-timeout';

export function Example12_LoginForm() {
  const [rememberMe, setRememberMeState] = React.useState(getRememberMe());

  const handleLogin = async (email: string, password: string) => {
    // Perform login
    // ...

    // Save remember me preference
    setRememberMe(rememberMe);

    // If remember me is enabled, the session timeout will use
    // extended duration (30 days instead of session-only)
  };

  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      const formData = new FormData(e.currentTarget);
      handleLogin(
        formData.get('email') as string,
        formData.get('password') as string
      );
    }}>
      <input type="email" name="email" placeholder="Email" />
      <input type="password" name="password" placeholder="Password" />
      <label>
        <input
          type="checkbox"
          checked={rememberMe}
          onChange={(e) => setRememberMeState(e.target.checked)}
        />
        Remember me for 30 days
      </label>
      <button type="submit">Log In</button>
    </form>
  );
}
