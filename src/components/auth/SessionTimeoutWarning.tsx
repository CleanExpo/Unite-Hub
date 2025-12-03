/**
 * Session Timeout Warning Modal
 *
 * Shows a warning modal when user is about to be logged out due to inactivity.
 * Displays countdown and allows user to extend session.
 */

'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertCircle, LogOut, RefreshCw } from 'lucide-react';

export interface SessionTimeoutWarningProps {
  /** Is warning modal visible? */
  isOpen: boolean;
  /** Remaining time in seconds before logout */
  remainingTime: number;
  /** Callback to extend session */
  onExtendSession: () => void;
  /** Callback to logout immediately */
  onLogout: () => void;
  /** Optional custom title */
  title?: string;
  /** Optional custom description */
  description?: string;
}

export function SessionTimeoutWarning({
  isOpen,
  remainingTime,
  onExtendSession,
  onLogout,
  title = 'Your session is about to expire',
  description = 'You will be automatically logged out due to inactivity.',
}: SessionTimeoutWarningProps) {
  // Format remaining time as MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Determine warning level based on remaining time
  const getWarningLevel = () => {
    if (remainingTime <= 30) {
      return 'critical'; // Red
    } else if (remainingTime <= 60) {
      return 'high'; // Orange
    } else {
      return 'medium'; // Yellow
    }
  };

  const warningLevel = getWarningLevel();

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md [&>button]:hidden">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div
              className={`flex-shrink-0 rounded-full p-2 ${
                warningLevel === 'critical'
                  ? 'bg-red-100 dark:bg-red-900/20'
                  : warningLevel === 'high'
                  ? 'bg-orange-100 dark:bg-orange-900/20'
                  : 'bg-yellow-100 dark:bg-yellow-900/20'
              }`}
            >
              <AlertCircle
                className={`h-6 w-6 ${
                  warningLevel === 'critical'
                    ? 'text-red-600 dark:text-red-400'
                    : warningLevel === 'high'
                    ? 'text-orange-600 dark:text-orange-400'
                    : 'text-yellow-600 dark:text-yellow-400'
                }`}
              />
            </div>
            <DialogTitle className="text-left">{title}</DialogTitle>
          </div>
          <DialogDescription className="text-left pt-2">
            {description}
          </DialogDescription>
        </DialogHeader>

        <div className="py-6">
          <div className="text-center">
            <div className="mb-2 text-sm text-muted-foreground">
              Time remaining
            </div>
            <div
              className={`text-5xl font-bold tabular-nums ${
                warningLevel === 'critical'
                  ? 'text-red-600 dark:text-red-400'
                  : warningLevel === 'high'
                  ? 'text-orange-600 dark:text-orange-400'
                  : 'text-yellow-600 dark:text-yellow-400'
              }`}
            >
              {formatTime(remainingTime)}
            </div>
          </div>

          <div className="mt-6 space-y-2 text-sm text-muted-foreground">
            <p>Click "Stay logged in" to continue your session.</p>
            <p>
              For security reasons, we automatically log you out after a period
              of inactivity.
            </p>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={onLogout}
            className="w-full sm:w-auto"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Log out now
          </Button>
          <Button
            onClick={onExtendSession}
            className="w-full sm:w-auto"
            autoFocus
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Stay logged in
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// =====================================================
// COMPACT WARNING TOAST
// =====================================================

export interface SessionTimeoutToastProps {
  /** Remaining time in seconds before logout */
  remainingTime: number;
  /** Callback to extend session */
  onExtendSession: () => void;
  /** Is toast visible? */
  isVisible: boolean;
}

/**
 * Alternative compact warning as a toast notification
 * Can be used instead of modal for less intrusive UX
 */
export function SessionTimeoutToast({
  remainingTime,
  onExtendSession,
  isVisible,
}: SessionTimeoutToastProps) {
  if (!isVisible) {
    return null;
  }

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-5">
      <div className="flex items-center gap-4 rounded-lg border border-yellow-200 bg-yellow-50 p-4 shadow-lg dark:border-yellow-900 dark:bg-yellow-900/20">
        <div className="flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
          <div>
            <div className="font-medium text-sm text-yellow-900 dark:text-yellow-100">
              Session expiring in {formatTime(remainingTime)}
            </div>
            <div className="text-xs text-yellow-700 dark:text-yellow-300">
              You will be logged out due to inactivity
            </div>
          </div>
        </div>
        <Button
          size="sm"
          variant="default"
          onClick={onExtendSession}
          className="ml-2"
        >
          <RefreshCw className="h-3 w-3 mr-1" />
          Stay logged in
        </Button>
      </div>
    </div>
  );
}

// =====================================================
// PROVIDER COMPONENT
// =====================================================

import { useIdleTimeout, type SessionTimeoutConfig } from '@/lib/auth/session-timeout';

export interface SessionTimeoutProviderProps {
  children: React.ReactNode;
  /** Session timeout configuration */
  config?: Partial<SessionTimeoutConfig>;
  /** Use toast instead of modal? */
  useToast?: boolean;
  /** Custom warning component */
  warningComponent?: React.ComponentType<SessionTimeoutWarningProps>;
}

/**
 * Session Timeout Provider
 *
 * Wrap your app with this component to enable automatic session timeout.
 * Handles idle detection, warning, and logout.
 *
 * @example
 * ```tsx
 * <SessionTimeoutProvider>
 *   <YourApp />
 * </SessionTimeoutProvider>
 * ```
 */
export function SessionTimeoutProvider({
  children,
  config,
  useToast = false,
  warningComponent: CustomWarning,
}: SessionTimeoutProviderProps) {
  const { isWarning, remainingTime, extendSession, logout } = useIdleTimeout(config);

  const WarningComponent = CustomWarning || SessionTimeoutWarning;

  return (
    <>
      {children}
      {useToast ? (
        <SessionTimeoutToast
          isVisible={isWarning}
          remainingTime={remainingTime}
          onExtendSession={extendSession}
        />
      ) : (
        <WarningComponent
          isOpen={isWarning}
          remainingTime={remainingTime}
          onExtendSession={extendSession}
          onLogout={logout}
        />
      )}
    </>
  );
}
