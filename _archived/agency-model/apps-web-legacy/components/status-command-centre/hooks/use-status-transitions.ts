'use client';

/**
 * useStatusTransitions - Animation state machine for status changes
 * Elite Command Centre hook
 */

import { useState, useEffect, useRef } from 'react';
import type { AgentRunStatus, UseStatusTransitionsResult } from '../types';
import { ANIMATION_DURATIONS, isSuccessStatus, isErrorStatus } from '../constants';

export function useStatusTransitions(currentStatus: AgentRunStatus): UseStatusTransitionsResult {
  const [previousStatus, setPreviousStatus] = useState<AgentRunStatus | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastStatusRef = useRef<AgentRunStatus>(currentStatus);

  useEffect(() => {
    // Check if status actually changed
    if (currentStatus === lastStatusRef.current) {
      return;
    }

    // Store previous status
    setPreviousStatus(lastStatusRef.current);
    lastStatusRef.current = currentStatus;

    // Start transition
    setIsTransitioning(true);

    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // End transition after animation duration
    timeoutRef.current = setTimeout(() => {
      setIsTransitioning(false);
    }, ANIMATION_DURATIONS.transition);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [currentStatus]);

  // Determine transition class based on status change
  const getTransitionClass = (): string => {
    if (!isTransitioning) return '';

    // Success transitions get ripple effect
    if (isSuccessStatus(currentStatus)) {
      return 'animate-success-ripple';
    }

    // Error transitions get shake effect (if we had one)
    if (isErrorStatus(currentStatus)) {
      return 'animate-badge-pulse';
    }

    // Default scale animation
    return 'animate-scale-in';
  };

  return {
    previousStatus,
    isTransitioning,
    transitionClass: getTransitionClass(),
  };
}

/**
 * useStatusColourTransition - Smooth colour interpolation between statuses
 * For advanced visual effects
 */
export function useStatusColourTransition(
  currentStatus: AgentRunStatus,
  // TODO: transitionDuration will be used for actual colour interpolation timing
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  transitionDuration: number = ANIMATION_DURATIONS.transition
): {
  interpolatedColour: string;
  isInterpolating: boolean;
} {
  // This is a simplified version - full implementation would use
  // colour interpolation library for smooth HSL transitions
  const { isTransitioning } = useStatusTransitions(currentStatus);

  return {
    interpolatedColour: '', // Would be computed HSL value
    isInterpolating: isTransitioning,
  };
}
