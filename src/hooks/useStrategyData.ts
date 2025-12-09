/**
 * Custom hooks for loading and managing strategy data from Supabase
 * Handles polling, caching, error handling, and real-time updates
 * Includes smart interval management, deduplication, and adaptive polling
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import { useStrategyStore } from '@/state/useStrategyStore';
import {
  fetchStrategyStatus,
  fetchStrategyHistory,
  type StrategyStatusResponse,
  type StrategyHistoryResponse,
} from '@/lib/strategy/strategyClient';
import {
  AdaptivePollingManager,
  DeduplicationTracker,
  PollingStatistics,
  POLLING_CONFIG,
} from '@/lib/strategy/pollingConfig';

/**
 * Hook to load and manage active strategy status
 * Handles polling with exponential backoff, deduplication, and smart interval management
 */
export function useActiveStrategy(
  workspaceId: string,
  strategyId: string | null,
  enabled: boolean = true
) {
  const {
    activeStrategy,
    setActiveStrategy,
    setValidation,
    setDecompositionMetrics,
    isLoadingStrategy,
    setIsLoadingStrategy,
    setErrorMessage,
    pollingActive,
    pollingInterval,
  } = useStrategyStore();

  const pollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastFetchRef = useRef<number>(0);
  const pollCountRef = useRef<number>(0);
  const deduplicatorRef = useRef<DeduplicationTracker>(new DeduplicationTracker());
  const pollingManagerRef = useRef<AdaptivePollingManager | null>(null);
  const statsRef = useRef<PollingStatistics>(new PollingStatistics());

  const loadStrategy = useCallback(
    async (isPolling: boolean = false) => {
      if (!strategyId || !workspaceId) {
return;
}

      // Initialize polling manager on first call
      if (!pollingManagerRef.current) {
        const config = POLLING_CONFIG.activeStrategy;
        pollingManagerRef.current = new AdaptivePollingManager(
          pollingInterval || config.minInterval,
          config.minInterval,
          config.maxInterval,
          config.backoffMultiplier
        );
      }

      const deduplicationKey = `strategy-status-${workspaceId}-${strategyId}`;

      try {
        if (!isPolling) {
          setIsLoadingStrategy(true);
        }

        // Use deduplicator to prevent concurrent requests for same resource
        const response = await deduplicatorRef.current.execute(deduplicationKey, () =>
          fetchStrategyStatus(workspaceId, strategyId)
        );

        // Record timing stats
        const endTiming = statsRef.current.startRequest();

        if (response.success && response.strategy) {
          const previousStrategy = activeStrategy;
          const hasDataChanged =
            !previousStrategy ||
            previousStrategy.hierarchyScore !== response.strategy.hierarchyScore ||
            previousStrategy.validatedAt !== response.strategy.validatedAt;

          // Update active strategy in store
          setActiveStrategy({
            id: response.strategy.id,
            objectiveId: response.strategy.id,
            L1_Strategic_Objective: {
              level: 1,
              title: 'Strategic Objective',
              description: response.objective?.description || '',
              items: [],
            },
            L2_Strategic_Pillars: {
              level: 2,
              title: 'Strategic Pillars',
              description: '',
              items: [],
            },
            L3_Strategic_Tactics: {
              level: 3,
              title: 'Strategic Tactics',
              description: '',
              items: [],
            },
            L4_Operational_Tasks: {
              level: 4,
              title: 'Operational Tasks',
              description: '',
              items: [],
            },
            hierarchyScore: response.strategy.hierarchyScore,
            status: response.strategy.status as any,
            createdAt: response.strategy.createdAt,
            validatedAt: response.strategy.validatedAt,
          });

          // Update validation if available
          if (response.validation) {
            setValidation({
              validationScore: response.validation.validationScore || 0,
              overallStatus: response.validation.overallStatus as any,
              consensusLevel: response.validation.consensusLevel || 0,
              agentValidations: [],
              conflictingViews: response.validation.recommendations || [],
              recommendations: response.validation.recommendations || [],
              conflicts: response.validation.conflicts.details || [],
            });
          }

          // Record success and update adaptive polling
          statsRef.current.recordSuccess();
          pollingManagerRef.current.recordSuccess(hasDataChanged);
          lastFetchRef.current = Date.now();
          pollCountRef.current += 1;
        }

        endTiming();
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to load strategy status';
        setErrorMessage(message);
        console.error('Error loading strategy status:', error);

        // Record failure and apply backoff
        statsRef.current.recordFailure();
        if (pollingManagerRef.current) {
          pollingManagerRef.current.recordFailure();
        }
      } finally {
        setIsLoadingStrategy(false);
      }
    },
    [workspaceId, strategyId, setActiveStrategy, setValidation, setIsLoadingStrategy, setErrorMessage, activeStrategy, pollingInterval]
  );

  // Initial load
  useEffect(() => {
    if (enabled && strategyId && workspaceId) {
      loadStrategy(false);
    }
  }, [strategyId, workspaceId, enabled, loadStrategy]);

  // Polling with adaptive interval management
  useEffect(() => {
    if (!enabled || !pollingActive || !strategyId) {
      if (pollTimeoutRef.current) {
        clearTimeout(pollTimeoutRef.current);
        pollTimeoutRef.current = null;
      }
      return;
    }

    const startPolling = () => {
      const now = Date.now();
      const timeSinceLastFetch = now - lastFetchRef.current;

      // Use adaptive polling interval (defaults to pollingInterval from store)
      const effectiveInterval = pollingManagerRef.current
        ? pollingManagerRef.current.getInterval()
        : pollingInterval;

      // Only poll if enough time has passed since last fetch
      if (timeSinceLastFetch >= effectiveInterval) {
        loadStrategy(true);
      }

      // Schedule next poll using adaptive interval
      pollTimeoutRef.current = setTimeout(() => {
        startPolling();
      }, effectiveInterval);
    };

    startPolling();

    return () => {
      if (pollTimeoutRef.current) {
        clearTimeout(pollTimeoutRef.current);
        pollTimeoutRef.current = null;
      }
    };
  }, [strategyId, enabled, pollingActive, pollingInterval, loadStrategy]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pollTimeoutRef.current) {
        clearTimeout(pollTimeoutRef.current);
      }
    };
  }, []);

  return {
    activeStrategy,
    isLoading: isLoadingStrategy,
    refetch: () => loadStrategy(false),
    pollCount: pollCountRef.current,
    // Polling statistics for monitoring
    pollingStats: statsRef.current.getStats(),
    adaptiveInterval: pollingManagerRef.current?.getInterval() || pollingInterval,
  };
}

/**
 * Hook to load strategy history with filtering and pagination
 */
export function useStrategyHistory(
  workspaceId: string,
  coalitionId?: string,
  enabled: boolean = true
) {
  const {
    historicalStrategies,
    setHistoricalStrategies,
    isLoadingHistory,
    setIsLoadingHistory,
    setErrorMessage,
  } = useStrategyStore();

  const [patterns, setPatterns] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);

  const loadHistory = useCallback(async () => {
    if (!workspaceId) {
return;
}

    try {
      setIsLoadingHistory(true);

      const response = await fetchStrategyHistory(
        workspaceId,
        {
          limit: 50,
          coalitionId,
        }
      );

      if (response.success) {
        // Update historical strategies
        setHistoricalStrategies(
          response.completedStrategies.map((s) => ({
            id: s.id,
            outcome: s.outcome as 'successful' | 'partial_success' | 'failed',
            completionRate: s.completionRate,
            timeEfficiency: s.timeEfficiency,
            costEfficiency: s.costEfficiency,
            patterns: s.patterns,
            archivedAt: s.archivedAt,
          }))
        );

        // Store patterns separately
        setPatterns(response.patterns);

        // Store analytics
        setAnalytics(response.analytics);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load strategy history';
      setErrorMessage(message);
      console.error('Error loading strategy history:', error);
    } finally {
      setIsLoadingHistory(false);
    }
  }, [workspaceId, coalitionId, setHistoricalStrategies, setIsLoadingHistory, setErrorMessage]);

  useEffect(() => {
    if (enabled && workspaceId) {
      loadHistory();
    }
  }, [workspaceId, enabled, loadHistory]);

  return {
    strategies: historicalStrategies,
    patterns,
    analytics,
    isLoading: isLoadingHistory,
    refetch: loadHistory,
  };
}

/**
 * Hook for refresh on window focus
 * Auto-refreshes strategy data when user returns to the tab
 */
export function useRefreshOnFocus(
  refetchFn: () => Promise<void>,
  enabled: boolean = true
) {
  useEffect(() => {
    if (!enabled) {
return;
}

    const handleFocus = () => {
      refetchFn();
    };

    window.addEventListener('focus', handleFocus);

    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [refetchFn, enabled]);
}

/**
 * Hook for periodic refresh with backoff
 * Automatically refreshes at increasing intervals
 */
export function usePeriodicRefresh(
  refetchFn: () => Promise<void>,
  {
    initialInterval = 5000,
    maxInterval = 60000,
    backoffMultiplier = 1.5,
    enabled = true,
  }: {
    initialInterval?: number;
    maxInterval?: number;
    backoffMultiplier?: number;
    enabled?: boolean;
  } = {}
) {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const currentIntervalRef = useRef<number>(initialInterval);
  const failureCountRef = useRef<number>(0);

  const resetBackoff = useCallback(() => {
    currentIntervalRef.current = initialInterval;
    failureCountRef.current = 0;
  }, [initialInterval]);

  const startRefreshTimer = useCallback(() => {
    if (!enabled) {
return;
}

    intervalRef.current = setInterval(async () => {
      try {
        await refetchFn();
        resetBackoff();
      } catch (error) {
        failureCountRef.current += 1;
        // Increase interval on failure, cap at maxInterval
        currentIntervalRef.current = Math.min(
          currentIntervalRef.current * backoffMultiplier,
          maxInterval
        );
      }
    }, currentIntervalRef.current);
  }, [refetchFn, enabled, resetBackoff, backoffMultiplier, maxInterval]);

  useEffect(() => {
    startRefreshTimer();

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [startRefreshTimer]);

  return {
    currentInterval: currentIntervalRef.current,
    failureCount: failureCountRef.current,
    resetBackoff,
  };
}

/**
 * Hook for synchronized polling across multiple resources
 * Ensures all data is fetched together in a single interval
 */
export function useSynchronizedPolling(
  workspaceId: string,
  strategyId: string | null,
  {
    interval = 5000,
    enabled = true,
  }: {
    interval?: number;
    enabled?: boolean;
  } = {}
) {
  const { setIsLoadingStrategy, setIsLoadingHistory, setIsLoadingValidation } =
    useStrategyStore();

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isPollingRef = useRef<boolean>(false);

  const pollAll = useCallback(async () => {
    if (isPollingRef.current) {
return;
} // Prevent overlapping polls
    if (!strategyId || !workspaceId) {
return;
}

    isPollingRef.current = true;
    setIsLoadingStrategy(true);
    setIsLoadingValidation(true);
    setIsLoadingHistory(true);

    try {
      // Fetch strategy status and history in parallel
      const [statusResult, historyResult] = await Promise.allSettled([
        fetchStrategyStatus(workspaceId, strategyId),
        fetchStrategyHistory(workspaceId, {}),
      ]);

      // Handle results (errors are caught by Promise.allSettled)
      if (statusResult.status === 'fulfilled') {
        // Update store with strategy data
      }

      if (historyResult.status === 'fulfilled') {
        // Update store with history data
      }
    } catch (error) {
      console.error('Error in synchronized polling:', error);
    } finally {
      setIsLoadingStrategy(false);
      setIsLoadingValidation(false);
      setIsLoadingHistory(false);
      isPollingRef.current = false;
    }
  }, [workspaceId, strategyId, setIsLoadingStrategy, setIsLoadingValidation, setIsLoadingHistory]);

  useEffect(() => {
    if (!enabled || !strategyId) {
return;
}

    // Initial poll
    pollAll();

    // Set up interval
    timerRef.current = setInterval(pollAll, interval);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [strategyId, enabled, interval, pollAll]);

  return {
    pollAll,
    isPolling: isPollingRef.current,
  };
}
