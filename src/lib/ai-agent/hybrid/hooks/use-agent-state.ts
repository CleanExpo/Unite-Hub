/**
 * React Hook for managing AI Agent state
 * Provides reactive interface to the hybrid agent system
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { HybridAgentManager } from '../agent-manager';
import { AgentExecutor } from '../agent-executor';
import { TaskManager } from '../task-manager';
import {
  AgentState,
  AgentConfig,
  AgentResponse,
  AgentCommand,
  ExecutionContext,
  PhaseStatus,
  AgentStatus,
  TestResult,
  TaskDefinition
} from '../types';

export interface UseAgentStateOptions {
  config?: Partial<AgentConfig>;
  autoInitialize?: boolean;
  enableRealTimeUpdates?: boolean;
}

export interface UseAgentStateReturn {
  // State
  state: AgentState;
  isInitialized: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Managers
  agentManager: HybridAgentManager | null;
  executor: AgentExecutor | null;
  taskManager: TaskManager | null;
  
  // Agent Operations
  initialize: () => Promise<void>;
  shutdown: () => Promise<void>;
  executeCommand: (command: AgentCommand) => Promise<AgentResponse>;
  
  // Phase Operations
  initPhase: (phaseName: string) => Promise<AgentResponse>;
  generateTests: (testType?: string) => Promise<AgentResponse>;
  runDockerTests: () => Promise<AgentResponse>;
  completePhase: () => Promise<AgentResponse>;
  getStatusReport: () => Promise<AgentResponse>;
  
  // Task Operations
  createTask: (taskData: Omit<TaskDefinition, 'id' | 'created_at' | 'updated_at'>) => TaskDefinition;
  updateTask: (taskId: string, updates: Partial<TaskDefinition>) => TaskDefinition | null;
  deleteTask: (taskId: string) => boolean;
  getAllTasks: () => TaskDefinition[];
  getTasksByPhase: (phase: string) => TaskDefinition[];
  
  // Execution Management
  activeExecutions: ExecutionContext[];
  queuedCommands: number;
  cancelExecution: (executionId: string) => Promise<boolean>;
  clearQueue: () => number;
  pauseExecution: () => void;
  resumeExecution: () => void;
  
  // Utilities
  refresh: () => Promise<void>;
  isReady: boolean;
}

export function useAgentState(options: UseAgentStateOptions = {}): UseAgentStateReturn {
  const {
    config = {},
    autoInitialize = true,
    enableRealTimeUpdates = true
  } = options;

  // State
  const [state, setState] = useState<AgentState>({
    current_phase: undefined,
    phase_status: PhaseStatus.PENDING,
    completed_phases: [],
    test_results: [],
    last_update: new Date(),
    roadmap_version: '1.0.0',
    agent_status: AgentStatus.IDLE,
    error_message: undefined,
    execution_context: undefined
  });

  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeExecutions, setActiveExecutions] = useState<ExecutionContext[]>([]);
  const [queuedCommands, setQueuedCommands] = useState(0);

  // Managers
  const agentManagerRef = useRef<HybridAgentManager | null>(null);
  const executorRef = useRef<AgentExecutor | null>(null);
  const taskManagerRef = useRef<TaskManager | null>(null);

  // Initialize managers
  const initialize = useCallback(async () => {
    if (isInitialized) return;

    setIsLoading(true);
    setError(null);

    try {
      // Initialize Agent Manager
      agentManagerRef.current = new HybridAgentManager(config);
      await agentManagerRef.current.initialize();

      // Initialize Executor
      executorRef.current = new AgentExecutor(config.max_concurrent_executions || 3);

      // Initialize Task Manager
      taskManagerRef.current = new TaskManager();

      // Set up event listeners
      setupEventListeners();

      // Update state from agent manager
      const currentState = agentManagerRef.current.getState();
      setState(currentState);

      setIsInitialized(true);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to initialize agent';
      setError(errorMessage);
      console.error('Agent initialization failed:', err);
    } finally {
      setIsLoading(false);
    }
  }, [config, isInitialized]);

  // Shutdown managers
  const shutdown = useCallback(async () => {
    if (!isInitialized) return;

    try {
      await agentManagerRef.current?.shutdown();
      await executorRef.current?.shutdown();
      
      agentManagerRef.current = null;
      executorRef.current = null;
      taskManagerRef.current = null;

      setIsInitialized(false);
      setActiveExecutions([]);
      setQueuedCommands(0);
    } catch (err) {
      console.error('Agent shutdown failed:', err);
    }
  }, [isInitialized]);

  // Execute command
  const executeCommand = useCallback(async (command: AgentCommand): Promise<AgentResponse> => {
    if (!agentManagerRef.current) {
      throw new Error('Agent not initialized');
    }

    setIsLoading(true);
    try {
      const response = await agentManagerRef.current.executeCommand(command);
      
      // Update state if command was successful
      if (response.success) {
        const updatedState = agentManagerRef.current.getState();
        setState(updatedState);
      }

      return response;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Phase operations
  const initPhase = useCallback(async (phaseName: string) => {
    if (!agentManagerRef.current) {
      throw new Error('Agent not initialized');
    }
    return await agentManagerRef.current.initPhase(phaseName);
  }, []);

  const generateTests = useCallback(async (testType: string = 'unit') => {
    if (!agentManagerRef.current) {
      throw new Error('Agent not initialized');
    }
    return await agentManagerRef.current.generateTests(testType);
  }, []);

  const runDockerTests = useCallback(async () => {
    if (!agentManagerRef.current) {
      throw new Error('Agent not initialized');
    }
    return await agentManagerRef.current.runDockerTests();
  }, []);

  const completePhase = useCallback(async () => {
    if (!agentManagerRef.current) {
      throw new Error('Agent not initialized');
    }
    return await agentManagerRef.current.completePhase();
  }, []);

  const getStatusReport = useCallback(async () => {
    if (!agentManagerRef.current) {
      throw new Error('Agent not initialized');
    }
    return await agentManagerRef.current.getStatusReport();
  }, []);

  // Task operations
  const createTask = useCallback((taskData: Omit<TaskDefinition, 'id' | 'created_at' | 'updated_at'>) => {
    if (!taskManagerRef.current) {
      throw new Error('Task manager not initialized');
    }
    return taskManagerRef.current.createTask(taskData);
  }, []);

  const updateTask = useCallback((taskId: string, updates: Partial<TaskDefinition>) => {
    if (!taskManagerRef.current) {
      throw new Error('Task manager not initialized');
    }
    return taskManagerRef.current.updateTask(taskId, updates);
  }, []);

  const deleteTask = useCallback((taskId: string) => {
    if (!taskManagerRef.current) {
      throw new Error('Task manager not initialized');
    }
    return taskManagerRef.current.deleteTask(taskId);
  }, []);

  const getAllTasks = useCallback(() => {
    if (!taskManagerRef.current) {
      return [];
    }
    return taskManagerRef.current.getAllTasks();
  }, []);

  const getTasksByPhase = useCallback((phase: string) => {
    if (!taskManagerRef.current) {
      return [];
    }
    return taskManagerRef.current.getTasksByPhase(phase);
  }, []);

  // Execution management
  const cancelExecution = useCallback(async (executionId: string) => {
    if (!agentManagerRef.current) {
      return false;
    }
    return await agentManagerRef.current.cancelExecution(executionId);
  }, []);

  const clearQueue = useCallback(() => {
    if (!executorRef.current) {
      return 0;
    }
    return executorRef.current.clearQueue();
  }, []);

  const pauseExecution = useCallback(() => {
    executorRef.current?.pause();
  }, []);

  const resumeExecution = useCallback(() => {
    executorRef.current?.resume();
  }, []);

  // Refresh state
  const refresh = useCallback(async () => {
    if (!agentManagerRef.current) return;

    try {
      setIsLoading(true);
      const response = await agentManagerRef.current.getStatusReport();
      if (response.success) {
        const currentState = agentManagerRef.current.getState();
        setState(currentState);
      }
    } catch (err) {
      console.error('Failed to refresh agent state:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Set up event listeners
  const setupEventListeners = useCallback(() => {
    const agentManager = agentManagerRef.current;
    const executor = executorRef.current;

    if (!agentManager || !executor) return;

    // Agent Manager Events
    agentManager.on('state-changed', (newState: AgentState) => {
      setState(newState);
    });

    agentManager.on('response-received', (response: AgentResponse) => {
      // Could dispatch to a global state or analytics here
      console.log('Agent response:', response);
    });

    agentManager.on('error', (err: Error) => {
      setError(err.message);
      console.error('Agent error:', err);
    });

    // Executor Events
    executor.on('execution-started', (context: ExecutionContext) => {
      setActiveExecutions(prev => [...prev, context]);
    });

    executor.on('execution-completed', (context: ExecutionContext) => {
      setActiveExecutions(prev => prev.filter(exec => exec.execution_id !== context.execution_id));
    });

    executor.on('execution-failed', (context: ExecutionContext) => {
      setActiveExecutions(prev => prev.filter(exec => exec.execution_id !== context.execution_id));
    });

    executor.on('queue-updated', (queueLength: number) => {
      setQueuedCommands(queueLength);
    });

    return () => {
      agentManager.removeAllListeners();
      executor.removeAllListeners();
    };
  }, []);

  // Auto-initialize effect
  useEffect(() => {
    if (autoInitialize && !isInitialized && !isLoading) {
      initialize();
    }
  }, [autoInitialize, isInitialized, isLoading, initialize]);

  // Real-time updates effect
  useEffect(() => {
    if (!enableRealTimeUpdates || !isInitialized) return;

    const interval = setInterval(() => {
      // Update active executions
      if (agentManagerRef.current) {
        const executions = agentManagerRef.current.getActiveExecutions();
        setActiveExecutions(executions);
      }

      // Update queue status
      if (executorRef.current) {
        const queueStatus = executorRef.current.getQueueStatus();
        setQueuedCommands(queueStatus.queued);
      }
    }, 1000); // Update every second

    return () => clearInterval(interval);
  }, [enableRealTimeUpdates, isInitialized]);

  // Cleanup effect
  useEffect(() => {
    return () => {
      if (isInitialized) {
        shutdown();
      }
    };
  }, []);

  return {
    // State
    state,
    isInitialized,
    isLoading,
    error,
    
    // Managers
    agentManager: agentManagerRef.current,
    executor: executorRef.current,
    taskManager: taskManagerRef.current,
    
    // Agent Operations
    initialize,
    shutdown,
    executeCommand,
    
    // Phase Operations
    initPhase,
    generateTests,
    runDockerTests,
    completePhase,
    getStatusReport,
    
    // Task Operations
    createTask,
    updateTask,
    deleteTask,
    getAllTasks,
    getTasksByPhase,
    
    // Execution Management
    activeExecutions,
    queuedCommands,
    cancelExecution,
    clearQueue,
    pauseExecution,
    resumeExecution,
    
    // Utilities
    refresh,
    isReady: isInitialized && !isLoading && error === null
  };
}

export default useAgentState;
