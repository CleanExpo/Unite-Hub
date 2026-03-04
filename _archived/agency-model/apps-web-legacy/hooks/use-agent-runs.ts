'use client';

import { useEffect, useState, useRef } from 'react';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

/**
 * Agent Run Status Types
 * Matches the backend TaskStatus enum
 */
export type AgentRunStatus =
  | 'pending'
  | 'in_progress'
  | 'awaiting_verification'
  | 'verification_in_progress'
  | 'verification_passed'
  | 'verification_failed'
  | 'completed'
  | 'failed'
  | 'blocked'
  | 'escalated_to_human';

/**
 * Agent Run Record
 * Matches the agent_runs table schema
 */
export interface AgentRun {
  id: string;
  task_id: string;
  user_id: string | null;
  agent_name: string;
  agent_id: string;
  status: AgentRunStatus;
  current_step: string | null;
  progress_percent: number;
  result: Record<string, unknown>;
  error: string | null;
  metadata: Record<string, unknown>;
  verification_attempts: number;
  verification_evidence: Record<string, unknown>[];
  started_at: string;
  completed_at: string | null;
  updated_at: string;
}

/**
 * Hook to subscribe to agent run updates via polling
 *
 * @param taskId - Optional task ID to filter runs
 * @param agentName - Optional agent name to filter runs
 */
export function useAgentRuns(taskId?: string, agentName?: string) {
  const [runs, setRuns] = useState<AgentRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const fetchRuns = async () => {
      try {
        const params = new URLSearchParams();
        if (taskId) params.set('task_id', taskId);
        if (agentName) params.set('agent_name', agentName);

        const url = `${BACKEND_URL}/api/agents/runs${params.toString() ? `?${params}` : ''}`;
        const response = await fetch(url, {
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
        });

        if (!response.ok) throw new Error(`Failed to fetch agent runs: ${response.statusText}`);

        const data: AgentRun[] = await response.json();
        setRuns(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch agent runs'));
      } finally {
        setLoading(false);
      }
    };

    fetchRuns();

    // Poll every 3 seconds for updates
    intervalRef.current = setInterval(fetchRuns, 3000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [taskId, agentName]);

  return { runs, loading, error };
}

/**
 * Hook to subscribe to a single agent run by ID
 */
export function useAgentRun(runId: string | null) {
  const [run, setRun] = useState<AgentRun | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!runId) {
      setRun(null);
      setLoading(false);
      return;
    }

    const fetchRun = async () => {
      try {
        const response = await fetch(`${BACKEND_URL}/api/agents/runs/${runId}`, {
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
        });

        if (!response.ok) throw new Error('Failed to fetch agent run');

        const data: AgentRun = await response.json();
        setRun(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch agent run'));
      } finally {
        setLoading(false);
      }
    };

    fetchRun();
    intervalRef.current = setInterval(fetchRun, 3000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [runId]);

  return { run, loading, error };
}

/**
 * Hook to get only active (in-progress) agent runs
 */
export function useActiveAgentRuns() {
  const { runs, loading, error } = useAgentRuns();

  const activeRuns = runs.filter((run) =>
    ['pending', 'in_progress', 'awaiting_verification', 'verification_in_progress'].includes(
      run.status
    )
  );

  return { activeRuns, loading, error };
}

/**
 * Utility function to trigger an agent run from the frontend
 */
export async function triggerAgentRun(
  taskDescription: string,
  backendUrl: string = BACKEND_URL
): Promise<string> {
  const response = await fetch(`${backendUrl}/api/agents/run`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ task_description: taskDescription }),
  });

  if (!response.ok) {
    throw new Error(`Failed to trigger agent run: ${response.statusText}`);
  }

  const data = await response.json();
  return data.run_id;
}
