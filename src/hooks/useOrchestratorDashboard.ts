/**
 * Custom React Hooks for Orchestrator Dashboard
 *
 * Provides state management, auto-refresh, and caching for dashboard data
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  getTaskList,
  getTaskDetail,
  getFailureAnalysis,
  formatTaskForUI,
  getExecutionTimeline,
  type TaskListFilter,
  type TaskForUI,
} from '@/lib/orchestrator/dashboard-service';
import { createClient } from '@/lib/supabase/client';

// ============================================================================
// TASK LIST HOOK
// ============================================================================

export function useTaskList(filters: Partial<TaskListFilter>, autoRefresh = true) {
  const { currentOrganization } = useAuth();
  const [tasks, setTasks] = useState<TaskForUI[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [count, setCount] = useState(0);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const workspaceId = currentOrganization?.org_id;

  const fetchTasks = useCallback(async () => {
    if (!workspaceId) {
      setError('No workspace selected');
      setLoading(false);
      return;
    }

    try {
      setError(null);

      // Get session token
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      const result = await getTaskList(
        {
          workspaceId,
          ...filters,
        },
        session?.access_token
      );

      const formattedTasks = result.tasks.map((task: any) => formatTaskForUI(task));
      setTasks(formattedTasks);
      setCount(result.count);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch tasks');
    } finally {
      setLoading(false);
    }
  }, [workspaceId, JSON.stringify(filters)]);

  useEffect(() => {
    fetchTasks();

    // Auto-refresh every 30 seconds if enabled
    if (autoRefresh) {
      refreshIntervalRef.current = setInterval(fetchTasks, 30000);
    }

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [fetchTasks, autoRefresh]);

  return {
    tasks,
    loading,
    error,
    count,
    refresh: fetchTasks,
  };
}

// ============================================================================
// TASK DETAIL HOOK
// ============================================================================

export function useTaskDetail(taskId: string | null, autoRefresh = true) {
  const { currentOrganization } = useAuth();
  const [task, setTask] = useState<any>(null);
  const [steps, setSteps] = useState<any[]>([]);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [verificationResults, setVerificationResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const workspaceId = currentOrganization?.org_id;

  const fetchTaskDetail = useCallback(async () => {
    if (!taskId || !workspaceId) {
      setLoading(false);
      return;
    }

    try {
      setError(null);

      // Get session token
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      const result = await getTaskDetail(taskId, workspaceId, session?.access_token);

      setTask(result.task);
      setSteps(result.steps || []);
      setTimeline(result.timeline || []);
      setVerificationResults(result.verificationResults || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch task detail');
    } finally {
      setLoading(false);
    }
  }, [taskId, workspaceId]);

  useEffect(() => {
    fetchTaskDetail();

    // Auto-refresh every 10 seconds if enabled and task is running
    if (autoRefresh && task?.status === 'running') {
      refreshIntervalRef.current = setInterval(fetchTaskDetail, 10000);
    }

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [fetchTaskDetail, autoRefresh, task?.status]);

  return {
    task,
    steps,
    timeline,
    verificationResults,
    loading,
    error,
    refresh: fetchTaskDetail,
  };
}

// ============================================================================
// TASK STATUS HOOK (Real-time updates)
// ============================================================================

export function useTaskStatus(taskId: string | null) {
  const { currentOrganization } = useAuth();
  const [status, setStatus] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const workspaceId = currentOrganization?.org_id;

  const fetchStatus = useCallback(async () => {
    if (!taskId || !workspaceId) {
return;
}

    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      const response = await fetch(
        `/api/orchestrator/dashboard/tasks/${taskId}?workspaceId=${workspaceId}`,
        {
          headers: session?.access_token
            ? { Authorization: `Bearer ${session.access_token}` }
            : {},
        }
      );

      if (response.ok) {
        const data = await response.json();
        setStatus(data.task?.status || null);
        setLastUpdated(new Date());
      }
    } catch (err) {
      // Silent fail for status checks
    }
  }, [taskId, workspaceId]);

  useEffect(() => {
    fetchStatus();

    // Poll every 5 seconds for status updates
    refreshIntervalRef.current = setInterval(fetchStatus, 5000);

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [fetchStatus]);

  return {
    status,
    lastUpdated,
  };
}

// ============================================================================
// FAILURE ANALYSIS HOOK
// ============================================================================

export function useFailureAnalysis(taskId: string | null) {
  const { currentOrganization } = useAuth();
  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const workspaceId = currentOrganization?.org_id;

  useEffect(() => {
    const fetchAnalysis = async () => {
      if (!taskId || !workspaceId) {
        setLoading(false);
        return;
      }

      try {
        setError(null);

        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();

        const result = await getFailureAnalysis(
          taskId,
          workspaceId,
          session?.access_token
        );

        setAnalysis(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch failure analysis');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalysis();
  }, [taskId, workspaceId]);

  return {
    analysis,
    loading,
    error,
  };
}

// ============================================================================
// TASK RETRY HOOK
// ============================================================================

export function useTaskRetry() {
  const { currentOrganization } = useAuth();
  const [retrying, setRetrying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const workspaceId = currentOrganization?.org_id;

  const retryTask = useCallback(
    async (taskId: string) => {
      if (!workspaceId) {
        setError('No workspace selected');
        return null;
      }

      try {
        setRetrying(true);
        setError(null);

        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();

        const response = await fetch(
          `/api/orchestrator/dashboard/tasks/${taskId}/retry?workspaceId=${workspaceId}`,
          {
            method: 'POST',
            headers: session?.access_token
              ? { Authorization: `Bearer ${session.access_token}` }
              : {},
          }
        );

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to retry task');
        }

        const result = await response.json();
        return result.retryTaskId;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to retry task');
        return null;
      } finally {
        setRetrying(false);
      }
    },
    [workspaceId]
  );

  return {
    retryTask,
    retrying,
    error,
  };
}
