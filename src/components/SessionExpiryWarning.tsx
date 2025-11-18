"use client";

import React, { useEffect, useState } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { supabaseBrowser } from "@/lib/supabase";

/**
 * SessionExpiryWarning Component
 *
 * Displays a warning banner when the user's session is about to expire.
 * Provides a button to refresh the session manually.
 */
export function SessionExpiryWarning() {
  const [showWarning, setShowWarning] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const checkSessionExpiry = async () => {
      const { data: { session } } = await supabaseBrowser.auth.getSession();

      if (session) {
        const expiresAt = session.expires_at;
        const now = Math.floor(Date.now() / 1000);
        const timeUntilExpiry = (expiresAt || 0) - now;

        setTimeRemaining(timeUntilExpiry);

        // Show warning if session expires in less than 10 minutes but more than 2 minutes
        if (timeUntilExpiry < 600 && timeUntilExpiry > 120) {
          setShowWarning(true);
        } else {
          setShowWarning(false);
        }

        // If session has expired, redirect to login
        if (timeUntilExpiry <= 0) {
          console.warn('[SessionExpiryWarning] Session expired, redirecting to login');
          window.location.href = '/login';
        }
      }
    };

    // Check every 30 seconds
    const intervalId = setInterval(checkSessionExpiry, 30 * 1000);

    // Check immediately on mount
    checkSessionExpiry();

    return () => clearInterval(intervalId);
  }, []);

  const handleRefreshSession = async () => {
    setRefreshing(true);
    try {
      const { data, error } = await supabaseBrowser.auth.refreshSession();

      if (error) {
        console.error('[SessionExpiryWarning] Failed to refresh session:', error);
        // Redirect to login on error
        window.location.href = '/login';
      } else {
        console.log('[SessionExpiryWarning] Session refreshed successfully');
        setShowWarning(false);
      }
    } catch (error) {
      console.error('[SessionExpiryWarning] Error refreshing session:', error);
      window.location.href = '/login';
    } finally {
      setRefreshing(false);
    }
  };

  if (!showWarning) {
    return null;
  }

  const minutesRemaining = Math.floor(timeRemaining / 60);

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-2xl px-4">
      <Alert variant="destructive" className="bg-yellow-900/90 border-yellow-700 backdrop-blur-sm">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle className="text-yellow-100 font-semibold">
          Session Expiring Soon
        </AlertTitle>
        <AlertDescription className="text-yellow-200">
          <div className="flex items-center justify-between gap-4 mt-2">
            <span>
              Your session will expire in {minutesRemaining} minute{minutesRemaining !== 1 ? 's' : ''}.
              Please refresh to continue working.
            </span>
            <Button
              onClick={handleRefreshSession}
              disabled={refreshing}
              size="sm"
              className="bg-yellow-600 hover:bg-yellow-700 text-white font-semibold shrink-0"
            >
              {refreshing ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Refreshing...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh Now
                </>
              )}
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    </div>
  );
}
