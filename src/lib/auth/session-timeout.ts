/**
 * Session Timeout Management
 *
 * Handles idle detection, automatic session refresh, and logout
 * for Supabase authentication with PKCE flow.
 *
 * Features:
 * - Idle detection via mouse/keyboard/scroll events
 * - Configurable timeout with warning modal
 * - Automatic session refresh
 * - "Remember me" support
 * - Server-side session validation
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';

// =====================================================
// CONFIGURATION
// =====================================================

export interface SessionTimeoutConfig {
  /** Idle timeout in milliseconds (default: 30 minutes) */
  idleTimeout: number;
  /** Warning time before logout in milliseconds (default: 2 minutes) */
  warningTime: number;
  /** Session check interval in milliseconds (default: 5 minutes) */
  sessionCheckInterval: number;
  /** Enable "Remember me" feature (extends session) */
  enableRememberMe: boolean;
  /** Extended session duration for "Remember me" (default: 30 days) */
  rememberMeDuration: number;
  /** Callback when user becomes idle */
  onIdle?: () => void;
  /** Callback when warning is shown */
  onWarning?: () => void;
  /** Callback when session expires */
  onExpire?: () => void;
  /** Callback when session is refreshed */
  onRefresh?: () => void;
}

export const DEFAULT_TIMEOUT_CONFIG: SessionTimeoutConfig = {
  idleTimeout: 30 * 60 * 1000, // 30 minutes
  warningTime: 2 * 60 * 1000, // 2 minutes
  sessionCheckInterval: 5 * 60 * 1000, // 5 minutes
  enableRememberMe: true,
  rememberMeDuration: 30 * 24 * 60 * 60 * 1000, // 30 days
};

// =====================================================
// IDLE DETECTION HOOK
// =====================================================

export interface IdleState {
  /** Is user currently idle? */
  isIdle: boolean;
  /** Is warning modal showing? */
  isWarning: boolean;
  /** Remaining time before logout (seconds) */
  remainingTime: number;
  /** Extend the session (reset idle timer) */
  extendSession: () => void;
  /** Force logout */
  logout: () => Promise<void>;
}

export function useIdleTimeout(
  config: Partial<SessionTimeoutConfig> = {}
): IdleState {
  const mergedConfig: SessionTimeoutConfig = {
    ...DEFAULT_TIMEOUT_CONFIG,
    ...config,
  };

  const [isIdle, setIsIdle] = useState(false);
  const [isWarning, setIsWarning] = useState(false);
  const [remainingTime, setRemainingTime] = useState(0);

  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const warningTimerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);
  const sessionCheckTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());

  const supabase = createClient();

  // =====================================================
  // CLEAR ALL TIMERS
  // =====================================================

  const clearAllTimers = useCallback(() => {
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
      idleTimerRef.current = null;
    }
    if (warningTimerRef.current) {
      clearTimeout(warningTimerRef.current);
      warningTimerRef.current = null;
    }
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
    if (sessionCheckTimerRef.current) {
      clearInterval(sessionCheckTimerRef.current);
      sessionCheckTimerRef.current = null;
    }
  }, []);

  // =====================================================
  // LOGOUT HANDLER
  // =====================================================

  const logout = useCallback(async () => {
    clearAllTimers();
    setIsIdle(true);
    setIsWarning(false);

    try {
      await supabase.auth.signOut();
      if (mergedConfig.onExpire) {
        mergedConfig.onExpire();
      }
      // Redirect to login
      window.location.href = '/login?reason=session_expired';
    } catch (error) {
      console.error('Error signing out:', error);
      // Force redirect even on error
      window.location.href = '/login?reason=session_expired';
    }
  }, [clearAllTimers, supabase, mergedConfig]);

  // =====================================================
  // WARNING COUNTDOWN
  // =====================================================

  const startWarningCountdown = useCallback(() => {
    setIsWarning(true);
    setRemainingTime(Math.floor(mergedConfig.warningTime / 1000));

    if (mergedConfig.onWarning) {
      mergedConfig.onWarning();
    }

    // Update countdown every second
    countdownTimerRef.current = setInterval(() => {
      setRemainingTime((prev) => {
        if (prev <= 1) {
          logout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Set timer to logout after warning time
    warningTimerRef.current = setTimeout(() => {
      logout();
    }, mergedConfig.warningTime);
  }, [mergedConfig, logout]);

  // =====================================================
  // RESET IDLE TIMER (USER ACTIVITY)
  // =====================================================

  const resetIdleTimer = useCallback(() => {
    // Clear existing timers
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
    }
    if (warningTimerRef.current) {
      clearTimeout(warningTimerRef.current);
    }
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
    }

    // Reset state
    setIsIdle(false);
    setIsWarning(false);
    setRemainingTime(0);
    lastActivityRef.current = Date.now();

    // Set new idle timer
    const timeUntilWarning = mergedConfig.idleTimeout - mergedConfig.warningTime;

    idleTimerRef.current = setTimeout(() => {
      setIsIdle(true);
      if (mergedConfig.onIdle) {
        mergedConfig.onIdle();
      }
      startWarningCountdown();
    }, timeUntilWarning);
  }, [mergedConfig, startWarningCountdown]);

  // =====================================================
  // EXTEND SESSION (MANUAL USER ACTION)
  // =====================================================

  const extendSession = useCallback(async () => {
    try {
      // Refresh the Supabase session
      const { data, error } = await supabase.auth.refreshSession();

      if (error) {
        console.error('Error refreshing session:', error);
        // If refresh fails, log out
        await logout();
        return;
      }

      if (mergedConfig.onRefresh) {
        mergedConfig.onRefresh();
      }

      // Reset idle timer
      resetIdleTimer();
    } catch (error) {
      console.error('Error extending session:', error);
      await logout();
    }
  }, [supabase, mergedConfig, resetIdleTimer, logout]);

  // =====================================================
  // SESSION VALIDATION
  // =====================================================

  const validateSession = useCallback(async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error || !session) {
        // Session is invalid or expired
        await logout();
        return;
      }

      // Check if session is about to expire (within 5 minutes)
      const expiresAt = session.expires_at;
      if (expiresAt) {
        const timeUntilExpiry = expiresAt * 1000 - Date.now();
        const fiveMinutes = 5 * 60 * 1000;

        if (timeUntilExpiry < fiveMinutes) {
          // Proactively refresh the session
          await extendSession();
        }
      }
    } catch (error) {
      console.error('Error validating session:', error);
      await logout();
    }
  }, [supabase, logout, extendSession]);

  // =====================================================
  // ACTIVITY EVENT HANDLERS
  // =====================================================

  const handleActivity = useCallback(() => {
    // Throttle activity updates (max once per second)
    const now = Date.now();
    if (now - lastActivityRef.current < 1000) {
      return;
    }

    resetIdleTimer();
  }, [resetIdleTimer]);

  // =====================================================
  // SETUP EVENT LISTENERS
  // =====================================================

  useEffect(() => {
    // Events to track for user activity
    const events = [
      'mousedown',
      'mousemove',
      'keypress',
      'scroll',
      'touchstart',
      'click',
    ];

    // Add event listeners
    events.forEach((event) => {
      document.addEventListener(event, handleActivity, { passive: true });
    });

    // Start idle timer
    resetIdleTimer();

    // Start session check interval
    sessionCheckTimerRef.current = setInterval(
      validateSession,
      mergedConfig.sessionCheckInterval
    );

    // Initial session validation
    validateSession();

    // Cleanup
    return () => {
      events.forEach((event) => {
        document.removeEventListener(event, handleActivity);
      });
      clearAllTimers();
    };
  }, [
    handleActivity,
    resetIdleTimer,
    validateSession,
    clearAllTimers,
    mergedConfig.sessionCheckInterval,
  ]);

  // =====================================================
  // VISIBILITY CHANGE (TAB SWITCHING)
  // =====================================================

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // User returned to tab, validate session
        validateSession();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [validateSession]);

  return {
    isIdle,
    isWarning,
    remainingTime,
    extendSession,
    logout,
  };
}

// =====================================================
// SERVER-SIDE SESSION UTILITIES
// =====================================================

/**
 * Check if a session is expired server-side
 * Use this in API routes to validate session age
 */
export function isSessionExpired(
  expiresAt: number | undefined,
  maxAge: number = DEFAULT_TIMEOUT_CONFIG.idleTimeout
): boolean {
  if (!expiresAt) {
    return true;
  }

  const now = Date.now() / 1000; // Convert to seconds
  return expiresAt < now;
}

/**
 * Check if session needs refresh
 * Returns true if session expires within the next 5 minutes
 */
export function needsSessionRefresh(expiresAt: number | undefined): boolean {
  if (!expiresAt) {
    return true;
  }

  const now = Date.now() / 1000; // Convert to seconds
  const fiveMinutes = 5 * 60; // 5 minutes in seconds
  return expiresAt - now < fiveMinutes;
}

/**
 * Get remaining session time in seconds
 */
export function getRemainingSessionTime(expiresAt: number | undefined): number {
  if (!expiresAt) {
    return 0;
  }

  const now = Date.now() / 1000; // Convert to seconds
  const remaining = expiresAt - now;
  return Math.max(0, Math.floor(remaining));
}

// =====================================================
// REMEMBER ME UTILITIES
// =====================================================

const REMEMBER_ME_KEY = 'unite_hub_remember_me';

/**
 * Set "Remember me" preference
 */
export function setRememberMe(remember: boolean): void {
  if (remember) {
    localStorage.setItem(REMEMBER_ME_KEY, 'true');
  } else {
    localStorage.removeItem(REMEMBER_ME_KEY);
  }
}

/**
 * Get "Remember me" preference
 */
export function getRememberMe(): boolean {
  return localStorage.getItem(REMEMBER_ME_KEY) === 'true';
}

/**
 * Clear "Remember me" preference
 */
export function clearRememberMe(): void {
  localStorage.removeItem(REMEMBER_ME_KEY);
}

// =====================================================
// SESSION REFRESH API
// =====================================================

/**
 * Refresh session via API route
 * Use this to extend session from client-side
 */
export async function refreshSessionAPI(): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const response = await fetch('/api/auth/refresh-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || 'Failed to refresh session',
      };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
