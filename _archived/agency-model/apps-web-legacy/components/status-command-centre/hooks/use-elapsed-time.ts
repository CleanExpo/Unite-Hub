'use client';

/**
 * useElapsedTime - Real-time elapsed timer hook
 * Elite Command Centre hook
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { formatElapsedAU, calculateDuration } from '../utils/format-duration';
import type { UseElapsedTimeResult } from '../types';
import { DEFAULTS } from '../constants';

export function useElapsedTime(
  startTime: string | null,
  endTime?: string | null
): UseElapsedTimeResult {
  const [elapsed, setElapsed] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Calculate elapsed time
  const calculateElapsed = useCallback(() => {
    if (!startTime) return 0;
    return calculateDuration(startTime, endTime ?? undefined);
  }, [startTime, endTime]);

  // Update elapsed time
  useEffect(() => {
    // Initial calculation
    setElapsed(calculateElapsed());

    // If there's an end time, don't start interval
    if (endTime || !startTime) {
      return;
    }

    // Start interval for live updates
    intervalRef.current = setInterval(() => {
      setElapsed(calculateElapsed());
    }, DEFAULTS.refreshInterval);

    // Cleanup
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [startTime, endTime, calculateElapsed]);

  return {
    elapsed,
    formatted: formatElapsedAU(elapsed),
    isRunning: Boolean(startTime && !endTime),
  };
}

/**
 * useCountdown - Countdown timer hook
 * For estimated time remaining display
 */
export function useCountdown(estimatedSeconds: number | null): UseElapsedTimeResult {
  const [remaining, setRemaining] = useState(estimatedSeconds ?? 0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (estimatedSeconds === null || estimatedSeconds <= 0) {
      setRemaining(0);
      return;
    }

    setRemaining(estimatedSeconds);

    intervalRef.current = setInterval(() => {
      setRemaining((prev) => Math.max(0, prev - 1));
    }, DEFAULTS.refreshInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [estimatedSeconds]);

  return {
    elapsed: remaining,
    formatted: formatElapsedAU(remaining),
    isRunning: remaining > 0,
  };
}
