/**
 * React Hook for Real-Time Threat Updates
 * useRealTimethreats(workspaceId, domain)
 *
 * Usage:
 * const { threats, loading, error, isConnected } = useRealTimethreats(workspaceId, domain);
 *
 * Features:
 * - Auto-connect to Ably on mount
 * - Auto-disconnect on unmount
 * - Handles token refresh
 * - Fallback to polling if WebSocket fails
 * - Multi-threat accumulation (shows all threats in session)
 */

'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import * as Ably from 'ably';

export interface RealtimeThreat {
  type: string;
  threat?: {
    id: string;
    type: string;
    severity: string;
    domain: string;
    title: string;
    description: string;
    detectedAt: string;
    impactEstimate: string;
    recommendedAction: string;
    data: Record<string, unknown>;
  };
  timestamp: string;
}

export interface useRealThreatsReturn {
  threats: RealtimeThreat[];
  summary: {
    total: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
  } | null;
  loading: boolean;
  error: Error | null;
  isConnected: boolean;
  reconnect: () => Promise<void>;
}

export function useRealTimethreats(
  workspaceId: string,
  domain?: string
): useRealThreatsReturn {
  const [threats, setThreats] = useState<RealtimeThreat[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const ablyClientRef = useRef<Ably.Realtime | null>(null);
  const channelRef = useRef<Ably.RealtimeChannel | null>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Fetch authentication token from API
   */
  const fetchToken = useCallback(async (): Promise<string> => {
    try {
      const response = await fetch(`/api/realtime/token?workspaceId=${workspaceId}`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to get authentication token');
      }

      const data = await response.json();
      return data.token;
    } catch (err) {
      throw new Error(`Token fetch failed: ${err instanceof Error ? err.message : 'unknown error'}`);
    }
  }, [workspaceId]);

  /**
   * Initialize Ably connection
   */
  const initializeAbly = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Get authentication token
      const tokenRequest = await fetchToken();

      // Initialize Ably client with token
      const client = new Ably.Realtime({
        authUrl: `/api/realtime/token?workspaceId=${workspaceId}`,
        useAuthUrl: true,
        logLevel: process.env.NODE_ENV === 'development' ? 2 : 0,
      });

      ablyClientRef.current = client;

      // Subscribe to workspace threat channel
      const channelName = `threats:workspace-${workspaceId}`;
      const channel = client.channels.get(channelName);
      channelRef.current = channel;

      // Handle threat events
      channel.subscribe('threat', (message) => {
        const threat = message.data as RealtimeThreat;
        setThreats((prev) => {
          // Avoid duplicates
          const isDuplicate = prev.some((t) => t.threat?.id === threat.threat?.id);
          return isDuplicate ? prev : [threat, ...prev];
        });
      });

      // Handle summary events
      channel.subscribe('summary', (message) => {
        setSummary(message.data.summary);
      });

      // Handle status events
      channel.subscribe('status', (message) => {
        console.log('[useRealTimethreats] Monitoring status:', message.data);
      });

      // Handle connection state changes
      client.connection.on('connected', () => {
        console.log('[useRealTimethreats] Connected to Ably');
        setIsConnected(true);
        setLoading(false);
      });

      client.connection.on('failed', (stateChange) => {
        console.error('[useRealTimethreats] Connection failed:', stateChange.reason);
        setError(new Error(`Connection failed: ${stateChange.reason}`));
        setIsConnected(false);
        // Fallback to polling
        startPolling();
      });

      client.connection.on('disconnected', () => {
        console.log('[useRealTimethreats] Disconnected from Ably');
        setIsConnected(false);
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error initializing Ably';
      setError(new Error(errorMessage));
      setLoading(false);
      // Fallback to polling
      startPolling();
    }
  }, [fetchToken, workspaceId]);

  /**
   * Fallback polling (if WebSocket fails)
   */
  const startPolling = useCallback(() => {
    console.log('[useRealTimethreats] Starting polling fallback');

    pollIntervalRef.current = setInterval(async () => {
      try {
        const queryParams = new URLSearchParams({
          workspaceId,
          ...(domain && { domain }),
        });

        const response = await fetch(`/api/health-check/monitor?${queryParams}`);

        if (!response.ok) {
          throw new Error('Polling failed');
        }

        const data = await response.json();

        // Convert threat data to real-time format
        const allThreats: RealtimeThreat[] = [];
        Object.entries(data.threats || {}).forEach(([severity, threatList]: any) => {
          threatList.forEach((threat: any) => {
            allThreats.push({
              type: 'threat_detected',
              threat: {
                id: threat.id,
                type: threat.type,
                severity: threat.severity,
                domain: threat.domain,
                title: threat.title,
                description: threat.description,
                detectedAt: threat.detectedAt,
                impactEstimate: threat.impact,
                recommendedAction: threat.action,
                data: threat.data || {},
              },
              timestamp: threat.detectedAt,
            });
          });
        });

        setThreats(allThreats);
        setSummary(data.stats);
      } catch (err) {
        console.error('[useRealTimethreats] Polling error:', err);
      }
    }, 30000); // Poll every 30 seconds
  }, [workspaceId, domain]);

  /**
   * Reconnect function
   */
  const reconnect = useCallback(async () => {
    console.log('[useRealTimethreats] Reconnecting...');
    setIsConnected(false);
    setLoading(true);

    // Close existing connection
    if (ablyClientRef.current) {
      await ablyClientRef.current.close();
    }

    // Clear polling
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
    }

    // Reinitialize
    await initializeAbly();
  }, [initializeAbly]);

  /**
   * Setup and cleanup
   */
  useEffect(() => {
    initializeAbly();

    return () => {
      // Cleanup on unmount
      if (ablyClientRef.current) {
        ablyClientRef.current.close();
      }

      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [workspaceId, initializeAbly]);

  // Calculate summary from threats
  const calculatedSummary = summary || {
    total: threats.filter((t) => t.threat).length,
    critical: threats.filter((t) => t.threat?.severity === 'critical').length,
    high: threats.filter((t) => t.threat?.severity === 'high').length,
    medium: threats.filter((t) => t.threat?.severity === 'medium').length,
    low: threats.filter((t) => t.threat?.severity === 'low').length,
  };

  return {
    threats,
    summary: calculatedSummary,
    loading,
    error,
    isConnected,
    reconnect,
  };
}
