'use client';

/**
 * Hook for workflow execution management.
 *
 * Triggers execution via API, polls for status updates,
 * and provides real-time execution state.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { apiClient } from '@/lib/api/client';

export type ExecutionStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';

export interface ExecutionLogEntry {
  id: string;
  execution_id: string;
  node_id: string;
  status: string;
  input_data: Record<string, unknown> | null;
  output_data: Record<string, unknown> | null;
  error_message: string | null;
  started_at: string;
  completed_at: string | null;
  duration_ms: number | null;
}

export interface ExecutionResponse {
  id: string;
  workflow_id: string;
  user_id: string;
  status: ExecutionStatus;
  current_node_id: string | null;
  input_data: Record<string, unknown>;
  output_data: Record<string, unknown> | null;
  error_message: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  duration_ms: number | null;
}

export interface ExecutionDetailResponse extends ExecutionResponse {
  logs: ExecutionLogEntry[];
}

interface UseWorkflowExecutionConfig {
  workflowId: string;
  pollIntervalMs?: number;
}

interface UseWorkflowExecutionReturn {
  /** Current execution state */
  execution: ExecutionDetailResponse | null;
  /** Whether an execution is currently running */
  isRunning: boolean;
  /** Whether we're polling for updates */
  isPolling: boolean;
  /** Error message if any */
  error: string | null;
  /** Map of node_id -> execution status */
  nodeStatuses: Map<string, ExecutionStatus>;
  /** Currently executing node ID */
  currentNodeId: string | null;
  /** Trigger a new execution */
  startExecution: (
    inputData?: Record<string, unknown>,
    variables?: Record<string, unknown>
  ) => Promise<void>;
  /** Stop polling (does not cancel execution) */
  stopPolling: () => void;
  /** Execution history */
  history: ExecutionResponse[];
  /** Load execution history */
  loadHistory: () => Promise<void>;
}

export function useWorkflowExecution({
  workflowId,
  pollIntervalMs = 1000,
}: UseWorkflowExecutionConfig): UseWorkflowExecutionReturn {
  const [execution, setExecution] = useState<ExecutionDetailResponse | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nodeStatuses, setNodeStatuses] = useState<Map<string, ExecutionStatus>>(new Map());
  const [currentNodeId, setCurrentNodeId] = useState<string | null>(null);
  const [history, setHistory] = useState<ExecutionResponse[]>([]);

  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const executionIdRef = useRef<string | null>(null);

  // Derive node statuses from execution logs
  const updateNodeStatuses = useCallback((detail: ExecutionDetailResponse) => {
    const statuses = new Map<string, ExecutionStatus>();

    for (const log of detail.logs) {
      statuses.set(log.node_id, log.status as ExecutionStatus);
    }

    setNodeStatuses(statuses);
    setCurrentNodeId(detail.current_node_id);
  }, []);

  // Poll for execution status
  const pollExecution = useCallback(async () => {
    if (!executionIdRef.current) return;

    try {
      const detail = await apiClient.get<ExecutionDetailResponse>(
        `/api/workflows/${workflowId}/executions/${executionIdRef.current}`
      );

      setExecution(detail);
      updateNodeStatuses(detail);

      // Check if execution is complete
      if (
        detail.status === 'completed' ||
        detail.status === 'failed' ||
        detail.status === 'cancelled'
      ) {
        setIsRunning(false);
        setIsPolling(false);

        if (pollTimerRef.current) {
          clearInterval(pollTimerRef.current);
          pollTimerRef.current = null;
        }

        if (detail.status === 'failed' && detail.error_message) {
          setError(detail.error_message);
        }
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to poll execution status';
      setError(msg);
    }
  }, [workflowId, updateNodeStatuses]);

  // Start a new execution
  const startExecution = useCallback(
    async (inputData: Record<string, unknown> = {}, variables: Record<string, unknown> = {}) => {
      setError(null);
      setIsRunning(true);
      setNodeStatuses(new Map());
      setCurrentNodeId(null);

      try {
        const response = await apiClient.post<ExecutionResponse>(
          `/api/workflows/${workflowId}/execute`,
          {
            body: JSON.stringify({
              input_data: inputData,
              variables,
            }),
          }
        );

        executionIdRef.current = response.id;

        // Start polling
        setIsPolling(true);
        pollTimerRef.current = setInterval(pollExecution, pollIntervalMs);

        // Immediate first poll
        await pollExecution();
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Failed to start execution';
        setError(msg);
        setIsRunning(false);
      }
    },
    [workflowId, pollIntervalMs, pollExecution]
  );

  // Stop polling
  const stopPolling = useCallback(() => {
    setIsPolling(false);
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  }, []);

  // Load execution history
  const loadHistory = useCallback(async () => {
    try {
      const executions = await apiClient.get<ExecutionResponse[]>(
        `/api/workflows/${workflowId}/executions?limit=20`
      );
      setHistory(executions);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to load execution history';
      setError(msg);
    }
  }, [workflowId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
      }
    };
  }, []);

  return {
    execution,
    isRunning,
    isPolling,
    error,
    nodeStatuses,
    currentNodeId,
    startExecution,
    stopPolling,
    history,
    loadHistory,
  };
}
