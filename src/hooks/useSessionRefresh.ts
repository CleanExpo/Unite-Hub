"use client";

import { useEffect } from "react";
import { supabaseBrowser } from "@/lib/supabase";

/**
 * Hook to automatically refresh Supabase session before it expires
 * Supabase tokens expire after 1 hour by default
 * This hook checks every 30 minutes and refreshes if needed
 */
export function useSessionRefresh() {
  useEffect(() => {
    // Check and refresh session every 30 minutes
    const REFRESH_INTERVAL = 30 * 60 * 1000; // 30 minutes in milliseconds

    const refreshSession = async () => {
      try {
        const { data: { session }, error } = await supabaseBrowser.auth.getSession();

        if (error) {
          console.error('Error checking session:', error);
          return;
        }

        if (!session) {
          console.log('No active session to refresh');
          return;
        }

        // Check if token is expiring soon (within next 10 minutes)
        const expiresAt = session.expires_at! * 1000; // Convert to milliseconds
        const now = Date.now();
        const timeUntilExpiry = expiresAt - now;
        const TEN_MINUTES = 10 * 60 * 1000;

        if (timeUntilExpiry < TEN_MINUTES) {
          console.log('Session expiring soon, refreshing...');

          const { data, error: refreshError } = await supabaseBrowser.auth.refreshSession();

          if (refreshError) {
            console.error('Error refreshing session:', refreshError);
            return;
          }

          if (data.session) {
            console.log('Session refreshed successfully, new expiry:', new Date(data.session.expires_at! * 1000).toLocaleString());
          }
        } else {
          console.log('Session still valid, expires at:', new Date(expiresAt).toLocaleString());
        }
      } catch (err) {
        console.error('Unexpected error refreshing session:', err);
      }
    };

    // Refresh on mount
    refreshSession();

    // Set up interval to check periodically
    const interval = setInterval(refreshSession, REFRESH_INTERVAL);

    // Also listen for visibility change to refresh when tab becomes active
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        refreshSession();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);
}
