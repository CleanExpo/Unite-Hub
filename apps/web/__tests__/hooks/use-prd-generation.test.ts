/**
 * Unit tests for PRD generation hooks
 */

import { vi, type Mock } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { usePRDGeneration, usePRDResult } from '@/hooks/use-prd-generation';

// Mock fetch
global.fetch = vi.fn();

describe('usePRDGeneration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with correct default state', () => {
    const { result } = renderHook(() => usePRDGeneration());

    expect(result.current.isGenerating).toBe(false);
    expect(result.current.progress).toBe(0);
    expect(result.current.currentStep).toBeNull();
    expect(result.current.error).toBeNull();
    expect(result.current.result).toBeNull();
    expect(result.current.runId).toBeNull();
    expect(result.current.prdId).toBeNull();
  });

  it('should handle successful PRD generation request', async () => {
    const mockResponse = {
      prd_id: 'prd_123',
      task_id: 'task_123',
      run_id: 'run_123',
      status: 'pending',
      message: 'PRD generation started',
    };

    (global.fetch as Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const { result } = renderHook(() => usePRDGeneration());

    await act(async () => {
      await result.current.generatePRD({
        requirements: 'Build a todo app',
        context: { target_users: 'Students' },
      });
    });

    await waitFor(() => {
      expect(result.current.runId).toBe('run_123');
      expect(result.current.prdId).toBe('prd_123');
      expect(result.current.isGenerating).toBe(true);
    });

    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:8000/api/prd/generate',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
    );
  });

  it('should handle API error during generation', async () => {
    (global.fetch as Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({ detail: 'Server error' }),
    });

    const { result } = renderHook(() => usePRDGeneration());

    await act(async () => {
      await result.current.generatePRD({
        requirements: 'Build a todo app',
      });
    });

    await waitFor(() => {
      expect(result.current.error).toContain('Server error');
      expect(result.current.isGenerating).toBe(false);
    });
  });

  it('should handle network error during generation', async () => {
    (global.fetch as Mock).mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => usePRDGeneration());

    await act(async () => {
      await result.current.generatePRD({
        requirements: 'Build a todo app',
      });
    });

    await waitFor(() => {
      expect(result.current.error).toContain('Network error');
      expect(result.current.isGenerating).toBe(false);
    });
  });

  it('should fetch PRD result successfully', async () => {
    const mockResult = {
      total_user_stories: 15,
      total_api_endpoints: 25,
      total_test_scenarios: 30,
      total_sprints: 6,
      estimated_duration_weeks: 12,
      prd_analysis: {},
      feature_decomposition: {},
      technical_spec: {},
      test_plan: {},
      roadmap: {},
      documents_generated: [],
      generated_at: '2025-01-01T00:00:00',
    };

    (global.fetch as Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResult,
    });

    const { result } = renderHook(() => usePRDGeneration());

    await act(async () => {
      await result.current.fetchResult('prd_123');
    });

    await waitFor(() => {
      expect(result.current.result).toEqual(mockResult);
      expect(result.current.isGenerating).toBe(false);
      expect(result.current.progress).toBe(100);
    });
  });

  it('should reset state after generation', async () => {
    const mockResponse = {
      prd_id: 'prd_123',
      task_id: 'task_123',
      run_id: 'run_123',
      status: 'pending',
      message: 'PRD generation started',
    };

    (global.fetch as Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const { result } = renderHook(() => usePRDGeneration());

    // Start generation to set some state
    await act(async () => {
      await result.current.generatePRD({
        requirements: 'Build a todo app',
      });
    });

    await waitFor(() => {
      expect(result.current.runId).toBe('run_123');
    });

    // Reset
    act(() => {
      result.current.reset();
    });

    expect(result.current.isGenerating).toBe(false);
    expect(result.current.progress).toBe(0);
    expect(result.current.currentStep).toBeNull();
    expect(result.current.runId).toBeNull();
    expect(result.current.prdId).toBeNull();
  });
});

describe('usePRDResult', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch PRD result on mount', async () => {
    const mockResult = {
      total_user_stories: 15,
      total_api_endpoints: 25,
      total_test_scenarios: 30,
      total_sprints: 6,
      estimated_duration_weeks: 12,
      prd_analysis: { executive_summary: 'Test' },
      feature_decomposition: { epics: [] },
      technical_spec: { database_schema: [] },
      test_plan: { unit_tests: [] },
      roadmap: { sprints: [] },
      documents_generated: [],
      generated_at: '2025-01-01T00:00:00',
    };

    (global.fetch as Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResult,
    });

    const { result } = renderHook(() => usePRDResult('prd_123'));

    await waitFor(() => {
      expect(result.current.result).toEqual(mockResult);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    expect(global.fetch).toHaveBeenCalledWith('http://localhost:8000/api/prd/result/prd_123');
  });

  it('should handle fetch error', async () => {
    (global.fetch as Mock).mockResolvedValueOnce({
      ok: false,
      status: 404,
    });

    const { result } = renderHook(() => usePRDResult('prd_123'));

    await waitFor(() => {
      expect(result.current.error).toBeTruthy();
      expect(result.current.loading).toBe(false);
      expect(result.current.result).toBeNull();
    });
  });

  it('should handle network error', async () => {
    (global.fetch as Mock).mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => usePRDResult('prd_123'));

    await waitFor(() => {
      expect(result.current.error).toContain('Network error');
      expect(result.current.loading).toBe(false);
    });
  });

  it('should not fetch if prdId is empty', () => {
    const { result } = renderHook(() => usePRDResult(''));

    expect(result.current.loading).toBe(false);
    expect(global.fetch).not.toHaveBeenCalled();
  });
});
