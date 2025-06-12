/**
 * React hook for chunked operations to prevent overload
 */

import { useState, useCallback, useRef } from 'react';
import { TaskChunker, ChunkOptions } from '@/lib/utils/task-chunker';

export interface ChunkedOperationState<T, R> {
  isProcessing: boolean;
  progress: number;
  total: number;
  completed: number;
  failed: number;
  errors: Array<{ id: string; error: Error }>;
  results: R[];
  status: 'idle' | 'processing' | 'completed' | 'error';
}

export interface UseChunkedOperationOptions extends Partial<ChunkOptions> {
  onProgress?: (progress: number, total: number) => void;
  onComplete?: (results: any[], errors: any[]) => void;
  onError?: (error: Error) => void;
}

export function useChunkedOperation<T, R>(
  processor: (item: T) => Promise<R>,
  options: UseChunkedOperationOptions = {}
) {
  const [state, setState] = useState<ChunkedOperationState<T, R>>({
    isProcessing: false,
    progress: 0,
    total: 0,
    completed: 0,
    failed: 0,
    errors: [],
    results: [],
    status: 'idle'
  });

  const chunkerRef = useRef<TaskChunker<T> | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const process = useCallback(async (items: T[]) => {
    // Reset state
    setState({
      isProcessing: true,
      progress: 0,
      total: items.length,
      completed: 0,
      failed: 0,
      errors: [],
      results: [],
      status: 'processing'
    });

    // Create abort controller
    abortControllerRef.current = new AbortController();

    try {
      // Create new chunker with options
      chunkerRef.current = new TaskChunker<T>({
        maxChunkSize: options.maxChunkSize || 5,
        delayBetweenChunks: options.delayBetweenChunks || 200,
        maxConcurrent: options.maxConcurrent || 2,
        retryAttempts: options.retryAttempts || 2,
        progressCallback: (progress, total) => {
          setState(prev => ({
            ...prev,
            progress,
            total,
            completed: progress
          }));

          if (options.onProgress) {
            options.onProgress(progress, total);
          }
        }
      });

      // Add items to chunker
      chunkerRef.current.addTasks(items);

      // Process with abort signal check
      const wrappedProcessor = async (item: T): Promise<R> => {
        if (abortControllerRef.current?.signal.aborted) {
          throw new Error('Operation aborted');
        }
        return processor(item);
      };

      // Process all items
      const { results, errors } = await chunkerRef.current.processAll(wrappedProcessor);

      // Update final state
      setState(prev => ({
        ...prev,
        isProcessing: false,
        results,
        errors,
        failed: errors.length,
        status: errors.length > 0 ? 'error' : 'completed'
      }));

      // Call completion callback
      if (options.onComplete) {
        options.onComplete(results, errors);
      }

      return { results, errors };

    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      
      setState(prev => ({
        ...prev,
        isProcessing: false,
        status: 'error',
        errors: [...prev.errors, { id: 'general', error: err }]
      }));

      if (options.onError) {
        options.onError(err);
      }

      throw err;
    }
  }, [processor, options]);

  const abort = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    if (chunkerRef.current) {
      chunkerRef.current.reset();
    }

    setState(prev => ({
      ...prev,
      isProcessing: false,
      status: 'idle'
    }));
  }, []);

  const reset = useCallback(() => {
    if (chunkerRef.current) {
      chunkerRef.current.reset();
    }

    setState({
      isProcessing: false,
      progress: 0,
      total: 0,
      completed: 0,
      failed: 0,
      errors: [],
      results: [],
      status: 'idle'
    });
  }, []);

  const getStatus = useCallback(() => {
    if (chunkerRef.current) {
      return chunkerRef.current.getStatus();
    }
    return {
      queued: 0,
      processing: 0,
      completed: state.completed,
      failed: state.failed
    };
  }, [state.completed, state.failed]);

  return {
    process,
    abort,
    reset,
    getStatus,
    state
  };
}

/**
 * Hook for file upload with chunking
 */
export function useChunkedFileUpload(
  uploadFunction: (file: File) => Promise<string>,
  options: UseChunkedOperationOptions = {}
) {
  return useChunkedOperation(uploadFunction, {
    maxChunkSize: 3, // Upload 3 files at a time
    maxConcurrent: 2, // 2 concurrent uploads
    delayBetweenChunks: 500, // 500ms between chunks
    ...options
  });
}

/**
 * Hook for API calls with chunking
 */
export function useChunkedAPICall<T, R>(
  apiCall: (item: T) => Promise<R>,
  options: UseChunkedOperationOptions = {}
) {
  return useChunkedOperation(apiCall, {
    maxChunkSize: 10, // Process 10 items at a time
    maxConcurrent: 3, // 3 concurrent API calls
    delayBetweenChunks: 200, // 200ms between chunks
    retryAttempts: 3, // Retry failed calls 3 times
    ...options
  });
}

/**
 * Hook for data processing with chunking
 */
export function useChunkedDataProcessing<T, R>(
  processor: (item: T) => Promise<R>,
  options: UseChunkedOperationOptions = {}
) {
  return useChunkedOperation(processor, {
    maxChunkSize: 20, // Process 20 items at a time
    maxConcurrent: 4, // 4 concurrent processors
    delayBetweenChunks: 100, // 100ms between chunks
    ...options
  });
}
