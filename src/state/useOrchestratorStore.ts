/**
 * Orchestrator State Store Hook
 *
 * Central state management for orchestrator tasks, steps, signals, and metrics.
 * Handles polling with exponential backoff and real-time sync.
 */

import React from 'react';
import { create } from 'zustand';
import { OrchestratorTrace } from '@/lib/orchestrator';

export interface OrchestratorState {
  // Active task
  currentTaskId: string | null;
  currentTask: OrchestratorTrace | null;

  // UI state
  activeTab: 'plan' | 'execution' | 'graph' | 'signals';
  isExecuting: boolean;
  isLoading: boolean;
  error: string | null;

  // Form state
  objectiveInput: string;
  descriptionInput: string;

  // History
  recentTasks: Array<{ taskId: string; objective: string; timestamp: string }>;

  // Actions
  setCurrentTask: (task: OrchestratorTrace | null) => void;
  setCurrentTaskId: (id: string | null) => void;
  setActiveTab: (tab: 'plan' | 'execution' | 'graph' | 'signals') => void;
  setIsExecuting: (isExecuting: boolean) => void;
  setIsLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  setObjectiveInput: (input: string) => void;
  setDescriptionInput: (input: string) => void;
  addRecentTask: (task: { taskId: string; objective: string; timestamp: string }) => void;
  clearError: () => void;
  reset: () => void;
}

export const useOrchestratorStore = create<OrchestratorState>((set) => ({
  currentTaskId: null,
  currentTask: null,
  activeTab: 'plan',
  isExecuting: false,
  isLoading: false,
  error: null,
  objectiveInput: '',
  descriptionInput: '',
  recentTasks: [],

  setCurrentTask: (task) => set({ currentTask: task }),
  setCurrentTaskId: (id) => set({ currentTaskId: id }),
  setActiveTab: (tab) => set({ activeTab: tab }),
  setIsExecuting: (isExecuting) => set({ isExecuting }),
  setIsLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  setObjectiveInput: (input) => set({ objectiveInput: input }),
  setDescriptionInput: (input) => set({ descriptionInput: input }),
  addRecentTask: (task) =>
    set((state) => ({
      recentTasks: [task, ...state.recentTasks].slice(0, 10), // Keep last 10
    })),
  clearError: () => set({ error: null }),
  reset: () =>
    set({
      currentTaskId: null,
      currentTask: null,
      isExecuting: false,
      error: null,
      objectiveInput: '',
      descriptionInput: '',
    }),
}));

/**
 * Hook for polling orchestrator status with exponential backoff
 */
export function useOrchestratorPolling(
  taskId: string | null,
  workspaceId: string | null,
  options: {
    enabled?: boolean;
    initialInterval?: number;
    maxInterval?: number;
  } = {}
) {
  const {
    enabled = true,
    initialInterval = 2000,
    maxInterval = 30000,
  } = options;

  const [pollingInterval, setPollingInterval] = React.useState(initialInterval);
  const [lastUpdate, setLastUpdate] = React.useState<Date | null>(null);

  React.useEffect(() => {
    if (!enabled || !taskId || !workspaceId) return;

    const pollStatus = async () => {
      try {
        const { data: { session } } = await (await import('@/lib/supabase')).supabase.auth.getSession();

        const response = await fetch(
          `/api/orchestrator/status?workspaceId=${workspaceId}&taskId=${taskId}`,
          {
            headers: session?.access_token
              ? { 'Authorization': `Bearer ${session.access_token}` }
              : {},
          }
        );

        if (response.ok) {
          const result = await response.json();
          useOrchestratorStore.setState({ currentTask: result });
          setLastUpdate(new Date());

          // Reset interval on successful update
          setPollingInterval(initialInterval);
        } else if (response.status === 429) {
          // Rate limited - exponential backoff
          setPollingInterval((prev) => Math.min(prev * 1.5, maxInterval));
        }
      } catch (error) {
        console.error('Polling error:', error);
        setPollingInterval((prev) => Math.min(prev * 1.5, maxInterval));
      }
    };

    const interval = setInterval(pollStatus, pollingInterval);
    return () => clearInterval(interval);
  }, [enabled, taskId, workspaceId, pollingInterval, initialInterval, maxInterval]);

  return { lastUpdate, pollingInterval };
}
