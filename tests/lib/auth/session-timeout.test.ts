/**
 * Session Timeout Tests
 *
 * Unit tests for session timeout functionality.
 * Run with: npm test -- session-timeout.test.ts
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { useIdleTimeout } from '@/lib/auth/session-timeout';
import {
  isSessionExpired,
  needsSessionRefresh,
  getRemainingSessionTime,
  setRememberMe,
  getRememberMe,
  clearRememberMe,
} from '@/lib/auth/session-timeout';

// Mock Supabase client
jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(() => ({
    auth: {
      getSession: jest.fn().mockResolvedValue({
        data: {
          session: {
            expires_at: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
          },
        },
        error: null,
      }),
      refreshSession: jest.fn().mockResolvedValue({
        data: {
          session: {
            expires_at: Math.floor(Date.now() / 1000) + 7200, // 2 hours from now
          },
        },
        error: null,
      }),
      signOut: jest.fn().mockResolvedValue({ error: null }),
    },
  })),
}));

// Mock window.location
delete (window as any).location;
(window as any).location = { href: '' };

describe('useIdleTimeout', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should initialize with correct default state', () => {
    const { result } = renderHook(() => useIdleTimeout());

    expect(result.current.isIdle).toBe(false);
    expect(result.current.isWarning).toBe(false);
    expect(result.current.remainingTime).toBe(0);
    expect(typeof result.current.extendSession).toBe('function');
    expect(typeof result.current.logout).toBe('function');
  });

  it('should trigger warning after idle timeout', async () => {
    const onWarning = jest.fn();

    const { result } = renderHook(() =>
      useIdleTimeout({
        idleTimeout: 1000, // 1 second
        warningTime: 500, // 0.5 seconds
        sessionCheckInterval: 10000,
        onWarning,
      })
    );

    // Fast-forward to trigger warning (idle timeout - warning time)
    act(() => {
      jest.advanceTimersByTime(500);
    });

    await waitFor(() => {
      expect(result.current.isWarning).toBe(true);
      expect(result.current.isIdle).toBe(true);
      expect(onWarning).toHaveBeenCalledTimes(1);
    });
  });

  it('should show correct remaining time', async () => {
    const { result } = renderHook(() =>
      useIdleTimeout({
        idleTimeout: 1000,
        warningTime: 500,
        sessionCheckInterval: 10000,
      })
    );

    // Trigger warning
    act(() => {
      jest.advanceTimersByTime(500);
    });

    await waitFor(() => {
      expect(result.current.isWarning).toBe(true);
    });

    // Check initial remaining time (should be ~500ms = 0.5s)
    expect(result.current.remainingTime).toBeGreaterThan(0);

    // Advance 1 second
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    // Remaining time should decrease
    await waitFor(() => {
      expect(result.current.remainingTime).toBeLessThan(500);
    });
  });

  it('should reset idle timer on activity', () => {
    const onIdle = jest.fn();

    const { result } = renderHook(() =>
      useIdleTimeout({
        idleTimeout: 1000,
        warningTime: 500,
        sessionCheckInterval: 10000,
        onIdle,
      })
    );

    // Advance time but not enough to trigger
    act(() => {
      jest.advanceTimersByTime(400);
    });

    // Simulate user activity
    act(() => {
      const event = new MouseEvent('mousedown');
      document.dispatchEvent(event);
    });

    // Advance past original timeout
    act(() => {
      jest.advanceTimersByTime(600);
    });

    // Should not be idle because activity reset timer
    expect(result.current.isIdle).toBe(false);
    expect(onIdle).not.toHaveBeenCalled();
  });

  it('should extend session when extendSession is called', async () => {
    const onRefresh = jest.fn();

    const { result } = renderHook(() =>
      useIdleTimeout({
        idleTimeout: 1000,
        warningTime: 500,
        sessionCheckInterval: 10000,
        onRefresh,
      })
    );

    // Trigger warning
    act(() => {
      jest.advanceTimersByTime(500);
    });

    await waitFor(() => {
      expect(result.current.isWarning).toBe(true);
    });

    // Extend session
    await act(async () => {
      await result.current.extendSession();
    });

    // Warning should be dismissed
    await waitFor(() => {
      expect(result.current.isWarning).toBe(false);
      expect(result.current.isIdle).toBe(false);
      expect(onRefresh).toHaveBeenCalledTimes(1);
    });
  });

  it('should logout after warning time expires', async () => {
    const onExpire = jest.fn();

    const { result } = renderHook(() =>
      useIdleTimeout({
        idleTimeout: 1000,
        warningTime: 500,
        sessionCheckInterval: 10000,
        onExpire,
      })
    );

    // Trigger warning
    act(() => {
      jest.advanceTimersByTime(500);
    });

    await waitFor(() => {
      expect(result.current.isWarning).toBe(true);
    });

    // Wait for warning time to expire
    act(() => {
      jest.advanceTimersByTime(500);
    });

    await waitFor(() => {
      expect(onExpire).toHaveBeenCalledTimes(1);
      expect(window.location.href).toContain('/login?reason=session_expired');
    });
  });

  it('should handle manual logout', async () => {
    const { result } = renderHook(() => useIdleTimeout());

    await act(async () => {
      await result.current.logout();
    });

    expect(window.location.href).toContain('/login?reason=session_expired');
  });

  it('should throttle activity events', () => {
    const onIdle = jest.fn();

    renderHook(() =>
      useIdleTimeout({
        idleTimeout: 1000,
        warningTime: 500,
        sessionCheckInterval: 10000,
        onIdle,
      })
    );

    // Dispatch multiple events rapidly
    act(() => {
      for (let i = 0; i < 10; i++) {
        const event = new MouseEvent('mousedown');
        document.dispatchEvent(event);
      }
    });

    // Fast-forward less than throttle time (1 second)
    act(() => {
      jest.advanceTimersByTime(500);
    });

    // Only first event should have reset timer
    expect(onIdle).not.toHaveBeenCalled();
  });
});

// =====================================================
// SERVER-SIDE UTILITIES TESTS
// =====================================================

describe('Session utilities', () => {
  describe('isSessionExpired', () => {
    it('should return true for expired session', () => {
      const pastTime = Math.floor(Date.now() / 1000) - 3600; // 1 hour ago
      expect(isSessionExpired(pastTime)).toBe(true);
    });

    it('should return false for valid session', () => {
      const futureTime = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
      expect(isSessionExpired(futureTime)).toBe(false);
    });

    it('should return true for undefined expiry', () => {
      expect(isSessionExpired(undefined)).toBe(true);
    });
  });

  describe('needsSessionRefresh', () => {
    it('should return true if session expires within 5 minutes', () => {
      const soonTime = Math.floor(Date.now() / 1000) + 240; // 4 minutes from now
      expect(needsSessionRefresh(soonTime)).toBe(true);
    });

    it('should return false if session has more than 5 minutes', () => {
      const laterTime = Math.floor(Date.now() / 1000) + 600; // 10 minutes from now
      expect(needsSessionRefresh(laterTime)).toBe(false);
    });

    it('should return true for undefined expiry', () => {
      expect(needsSessionRefresh(undefined)).toBe(true);
    });
  });

  describe('getRemainingSessionTime', () => {
    it('should return correct remaining seconds', () => {
      const futureTime = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
      const remaining = getRemainingSessionTime(futureTime);
      expect(remaining).toBeGreaterThan(3590);
      expect(remaining).toBeLessThanOrEqual(3600);
    });

    it('should return 0 for expired session', () => {
      const pastTime = Math.floor(Date.now() / 1000) - 3600; // 1 hour ago
      expect(getRemainingSessionTime(pastTime)).toBe(0);
    });

    it('should return 0 for undefined expiry', () => {
      expect(getRemainingSessionTime(undefined)).toBe(0);
    });
  });
});

// =====================================================
// REMEMBER ME UTILITIES TESTS
// =====================================================

describe('Remember me utilities', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should set remember me preference', () => {
    setRememberMe(true);
    expect(localStorage.getItem('unite_hub_remember_me')).toBe('true');
  });

  it('should clear remember me preference', () => {
    setRememberMe(true);
    setRememberMe(false);
    expect(localStorage.getItem('unite_hub_remember_me')).toBeNull();
  });

  it('should get remember me preference', () => {
    expect(getRememberMe()).toBe(false);

    setRememberMe(true);
    expect(getRememberMe()).toBe(true);
  });

  it('should clear remember me', () => {
    setRememberMe(true);
    clearRememberMe();
    expect(getRememberMe()).toBe(false);
    expect(localStorage.getItem('unite_hub_remember_me')).toBeNull();
  });
});

// =====================================================
// INTEGRATION TESTS
// =====================================================

describe('Session timeout integration', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should complete full idle → warning → logout flow', async () => {
    const onIdle = jest.fn();
    const onWarning = jest.fn();
    const onExpire = jest.fn();

    const { result } = renderHook(() =>
      useIdleTimeout({
        idleTimeout: 1000,
        warningTime: 500,
        sessionCheckInterval: 10000,
        onIdle,
        onWarning,
        onExpire,
      })
    );

    // Initial state
    expect(result.current.isIdle).toBe(false);
    expect(result.current.isWarning).toBe(false);

    // Become idle
    act(() => {
      jest.advanceTimersByTime(500); // idle timeout - warning time
    });

    await waitFor(() => {
      expect(result.current.isIdle).toBe(true);
      expect(result.current.isWarning).toBe(true);
      expect(onIdle).toHaveBeenCalledTimes(1);
      expect(onWarning).toHaveBeenCalledTimes(1);
    });

    // Warning countdown
    expect(result.current.remainingTime).toBeGreaterThan(0);

    // Auto logout
    act(() => {
      jest.advanceTimersByTime(500); // warning time
    });

    await waitFor(() => {
      expect(onExpire).toHaveBeenCalledTimes(1);
    });
  });

  it('should handle activity → idle → activity → reset flow', async () => {
    const onIdle = jest.fn();

    const { result } = renderHook(() =>
      useIdleTimeout({
        idleTimeout: 1000,
        warningTime: 500,
        sessionCheckInterval: 10000,
        onIdle,
      })
    );

    // Simulate activity
    act(() => {
      const event = new MouseEvent('mousedown');
      document.dispatchEvent(event);
    });

    // Advance time but not enough to trigger
    act(() => {
      jest.advanceTimersByTime(400);
    });

    expect(result.current.isIdle).toBe(false);

    // Become idle
    act(() => {
      jest.advanceTimersByTime(200); // Total 600ms > 500ms threshold
    });

    await waitFor(() => {
      expect(result.current.isIdle).toBe(true);
      expect(onIdle).toHaveBeenCalledTimes(1);
    });

    // Activity resets
    act(() => {
      const event = new KeyboardEvent('keypress');
      document.dispatchEvent(event);
    });

    // Need to advance time slightly for throttle to clear
    act(() => {
      jest.advanceTimersByTime(1100);
    });

    await waitFor(() => {
      expect(result.current.isIdle).toBe(false);
      expect(result.current.isWarning).toBe(false);
    });
  });
});
