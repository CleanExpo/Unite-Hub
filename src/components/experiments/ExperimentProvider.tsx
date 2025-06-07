'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { ExperimentService } from '@/lib/services/experiments';
import type { AssignmentResult, ExperimentContext as IExperimentContext } from '@/types/experiments';

// Create context
const ExperimentContext = createContext<IExperimentContext | undefined>(undefined);

// Session ID generator
const generateSessionId = () => {
  if (typeof window === 'undefined') return '';
  
  let sessionId = sessionStorage.getItem('experiment_session_id');
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('experiment_session_id', sessionId);
  }
  return sessionId;
};

interface ExperimentProviderProps {
  children: React.ReactNode;
}

/**
 * Provider component for A/B testing experiments
 */
export function ExperimentProvider({ children }: ExperimentProviderProps) {
  const [experiments, setExperiments] = useState<Map<string, AssignmentResult>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [sessionId, setSessionId] = useState<string>('');
  const [userId, setUserId] = useState<string | undefined>(undefined);

  // Initialize session ID
  useEffect(() => {
    setSessionId(generateSessionId());
  }, []);

  // Get user ID from localStorage or Supabase auth
  useEffect(() => {
    const getUserId = async () => {
      try {
        // Try to get from localStorage first
        const storedUserId = localStorage.getItem('experiment_user_id');
        if (storedUserId) {
          setUserId(storedUserId);
          return;
        }

        // Try to get from Supabase auth if available
        if (typeof window !== 'undefined') {
          const { createClient } = await import('@supabase/supabase-js');
          const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL || '',
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
          );
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            setUserId(user.id);
            localStorage.setItem('experiment_user_id', user.id);
          }
        }
      } catch (error) {
        console.log('Could not get user ID:', error);
      }
    };

    getUserId();
  }, []);

  // Load active experiments for user
  useEffect(() => {
    if (!sessionId) return;

    const loadExperiments = async () => {
      try {
        setIsLoading(true);
        const assignments = await ExperimentService.getActiveExperimentsForUser(
          userId,
          sessionId
        );
        setExperiments(assignments);
      } catch (error) {
        console.error('Error loading experiments:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadExperiments();
  }, [userId, sessionId]);

  /**
   * Get variant for an experiment
   */
  const getVariant = useCallback((experimentName: string): string => {
    const assignment = experiments.get(experimentName);
    return assignment?.variant_name || 'control';
  }, [experiments]);

  /**
   * Track event for an experiment
   */
  const trackEvent = useCallback(async (
    experimentName: string,
    eventName: string,
    value?: any
  ) => {
    const assignment = experiments.get(experimentName);
    if (!assignment) {
      console.warn(`No assignment found for experiment: ${experimentName}`);
      return;
    }

    try {
      // Find experiment ID by name
      const experiment = await ExperimentService.getExperimentByName(experimentName);
      if (!experiment) {
        console.warn(`Experiment not found: ${experimentName}`);
        return;
      }

      await ExperimentService.trackEvent({
        experiment_id: experiment.id,
        event_name: eventName,
        event_value: value,
        user_id: userId,
        session_id: sessionId,
      });
    } catch (error) {
      console.error('Error tracking event:', error);
    }
  }, [experiments, userId, sessionId]);

  const contextValue: IExperimentContext = {
    experiments,
    getVariant,
    trackEvent,
    isLoading,
  };

  return (
    <ExperimentContext.Provider value={contextValue}>
      {children}
    </ExperimentContext.Provider>
  );
}

/**
 * Hook to use experiment context
 */
export function useExperimentContext() {
  const context = useContext(ExperimentContext);
  if (!context) {
    throw new Error('useExperimentContext must be used within ExperimentProvider');
  }
  return context;
}
