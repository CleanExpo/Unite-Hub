/**
 * Hook for managing PRD generation with real-time progress tracking.
 */

import { useCallback, useEffect, useState } from 'react';
import { useAgentRun } from './use-agent-runs';

export interface PRDGenerationRequest {
  requirements: string;
  context?: {
    target_users?: string;
    timeline?: string;
    team_size?: number;
    existing_stack?: string;
    [key: string]: string | number | undefined;
  };
  output_dir?: string;
  user_id?: string;
}

export interface PRDGenerationResponse {
  prd_id: string;
  task_id: string;
  run_id: string;
  status: string;
  message: string;
}

export interface PRDResult {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- API response shapes vary
  prd_analysis: Record<string, any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  feature_decomposition: Record<string, any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  technical_spec: Record<string, any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  test_plan: Record<string, any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  roadmap: Record<string, any>;
  documents_generated: string[];
  total_user_stories: number;
  total_api_endpoints: number;
  total_test_scenarios: number;
  total_sprints: number;
  estimated_duration_weeks: number;
  generated_at: string;
}

export interface PRDGenerationState {
  isGenerating: boolean;
  progress: number;
  currentStep: string | null;
  error: string | null;
  result: PRDResult | null;
  runId: string | null;
  prdId: string | null;
}

export function usePRDGeneration() {
  const [state, setState] = useState<PRDGenerationState>({
    isGenerating: false,
    progress: 0,
    currentStep: null,
    error: null,
    result: null,
    runId: null,
    prdId: null,
  });

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

  /**
   * Start PRD generation
   */
  const generatePRD = async (request: PRDGenerationRequest): Promise<void> => {
    setState({
      isGenerating: true,
      progress: 0,
      currentStep: 'Starting PRD generation...',
      error: null,
      result: null,
      runId: null,
      prdId: null,
    });

    try {
      const response = await fetch(`${backendUrl}/api/prd/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP ${response.status}`);
      }

      const data: PRDGenerationResponse = await response.json();

      setState((prev) => ({
        ...prev,
        runId: data.run_id,
        prdId: data.prd_id,
        currentStep: 'PRD generation started',
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isGenerating: false,
        error: error instanceof Error ? error.message : 'Failed to start PRD generation',
      }));
    }
  };

  /**
   * Fetch PRD result when generation completes
   */
  const fetchResult = useCallback(
    async (prdId: string): Promise<void> => {
      try {
        const response = await fetch(`${backendUrl}/api/prd/result/${prdId}`);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const result: PRDResult = await response.json();

        setState((prev) => ({
          ...prev,
          result,
          isGenerating: false,
          progress: 100,
          currentStep: 'PRD generation complete',
        }));
      } catch (error) {
        setState((prev) => ({
          ...prev,
          error: error instanceof Error ? error.message : 'Failed to fetch PRD result',
          isGenerating: false,
        }));
      }
    },
    [backendUrl]
  );

  /**
   * Reset state
   */
  const reset = () => {
    setState({
      isGenerating: false,
      progress: 0,
      currentStep: null,
      error: null,
      result: null,
      runId: null,
      prdId: null,
    });
  };

  return {
    ...state,
    generatePRD,
    fetchResult,
    reset,
  };
}

/**
 * Hook that combines PRD generation with real-time progress tracking
 */
export function usePRDGenerationWithProgress() {
  const [state, setState] = useState<PRDGenerationState>({
    isGenerating: false,
    progress: 0,
    currentStep: null,
    error: null,
    result: null,
    runId: null,
    prdId: null,
  });

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
  const { run: agentRun } = useAgentRun(state.runId);

  /**
   * Start PRD generation
   */
  const generatePRD = async (request: PRDGenerationRequest): Promise<void> => {
    setState({
      isGenerating: true,
      progress: 0,
      currentStep: 'Starting PRD generation...',
      error: null,
      result: null,
      runId: null,
      prdId: null,
    });

    try {
      const response = await fetch(`${backendUrl}/api/prd/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP ${response.status}`);
      }

      const data: PRDGenerationResponse = await response.json();

      setState((prev) => ({
        ...prev,
        runId: data.run_id,
        prdId: data.prd_id,
        currentStep: 'PRD generation started',
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isGenerating: false,
        error: error instanceof Error ? error.message : 'Failed to start PRD generation',
      }));
    }
  };

  /**
   * Fetch PRD result when generation completes
   */
  const fetchResult = useCallback(
    async (prdId: string): Promise<void> => {
      try {
        const response = await fetch(`${backendUrl}/api/prd/result/${prdId}`);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const result: PRDResult = await response.json();

        setState((prev) => ({
          ...prev,
          result,
          isGenerating: false,
          progress: 100,
          currentStep: 'PRD generation complete',
        }));
      } catch (error) {
        setState((prev) => ({
          ...prev,
          error: error instanceof Error ? error.message : 'Failed to fetch PRD result',
          isGenerating: false,
        }));
      }
    },
    [backendUrl]
  );

  /**
   * Reset state
   */
  const reset = () => {
    setState({
      isGenerating: false,
      progress: 0,
      currentStep: null,
      error: null,
      result: null,
      runId: null,
      prdId: null,
    });
  };

  // Update progress from agent run real-time updates
  useEffect(() => {
    if (agentRun && state.runId) {
      const progress = agentRun.progress_percent || 0;
      const currentStep = agentRun.current_step || null;
      const status = agentRun.status;

      // Update state with real-time progress
      setState((prev) => ({
        ...prev,
        progress,
        currentStep,
      }));

      // Auto-fetch result when completed
      if (status === 'completed' && state.prdId && !state.result) {
        fetchResult(state.prdId);
      }

      // Handle failure
      if (status === 'failed') {
        const errorMsg =
          typeof agentRun.metadata?.error === 'string'
            ? agentRun.metadata.error
            : 'PRD generation failed';
        setState((prev) => ({
          ...prev,
          isGenerating: false,
          error: errorMsg,
        }));
      }
    }
  }, [agentRun, state.runId, state.prdId, state.result, fetchResult]);

  return {
    ...state,
    generatePRD,
    fetchResult,
    reset,
  };
}

/**
 * Hook for fetching and displaying existing PRD
 */
export function usePRDResult(prdId: string) {
  const [result, setResult] = useState<PRDResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

  useEffect(() => {
    if (!prdId) {
      setLoading(false);
      return;
    }

    const fetchPRD = async () => {
      try {
        const response = await fetch(`${backendUrl}/api/prd/result/${prdId}`);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data: PRDResult = await response.json();
        setResult(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load PRD');
        setResult(null);
      } finally {
        setLoading(false);
      }
    };

    fetchPRD();
  }, [prdId, backendUrl]);

  return { result, loading, error };
}
