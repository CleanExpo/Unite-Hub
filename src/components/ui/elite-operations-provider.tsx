"use client";

/**
 * Elite Operations Provider
 *
 * Global context for managing AI operations across the application.
 * Provides a floating panel to display active operations.
 *
 * Usage:
 * 1. Wrap app with <EliteOperationsProvider>
 * 2. Use useEliteOperations() hook to start/update/complete operations
 * 3. Operations automatically appear in the floating panel
 */

import React, {
  createContext,
  useContext,
  useReducer,
  useCallback,
  ReactNode,
} from "react";
import {
  EliteOperationStatus,
  type OperationPhase,
  type OperationStep,
} from "./elite-operation-status";
import { cn } from "@/lib/utils";

// ============================================================================
// Types
// ============================================================================

export interface Operation {
  id: string;
  title: string;
  phase: OperationPhase;
  progress: number;
  message?: string;
  steps: OperationStep[];
  startTime: Date;
  compact?: boolean;
}

interface OperationsState {
  operations: Map<string, Operation>;
  minimized: boolean;
  position: "bottom-right" | "bottom-left" | "top-right" | "top-left";
}

type OperationsAction =
  | { type: "START_OPERATION"; payload: { id: string; title: string } }
  | { type: "UPDATE_OPERATION"; payload: { id: string; update: Partial<Operation> } }
  | { type: "SET_PHASE"; payload: { id: string; phase: OperationPhase } }
  | { type: "SET_PROGRESS"; payload: { id: string; progress: number } }
  | { type: "SET_MESSAGE"; payload: { id: string; message: string } }
  | { type: "ADD_STEP"; payload: { id: string; step: OperationStep } }
  | { type: "UPDATE_STEP"; payload: { id: string; stepId: string; update: Partial<OperationStep> } }
  | { type: "COMPLETE_OPERATION"; payload: { id: string } }
  | { type: "REMOVE_OPERATION"; payload: { id: string } }
  | { type: "TOGGLE_MINIMIZED" }
  | { type: "SET_POSITION"; payload: OperationsState["position"] };

interface OperationsContextValue {
  state: OperationsState;
  operations: Operation[];
  startOperation: (id: string, title: string) => void;
  updateOperation: (id: string, update: Partial<Operation>) => void;
  setPhase: (id: string, phase: OperationPhase) => void;
  setProgress: (id: string, progress: number) => void;
  setMessage: (id: string, message: string) => void;
  addStep: (id: string, step: OperationStep) => void;
  updateStep: (id: string, stepId: string, update: Partial<OperationStep>) => void;
  completeOperation: (id: string) => void;
  removeOperation: (id: string) => void;
  toggleMinimized: () => void;
}

// ============================================================================
// Context
// ============================================================================

const OperationsContext = createContext<OperationsContextValue | null>(null);

// ============================================================================
// Reducer
// ============================================================================

function operationsReducer(
  state: OperationsState,
  action: OperationsAction
): OperationsState {
  switch (action.type) {
    case "START_OPERATION": {
      const newOperations = new Map(state.operations);
      newOperations.set(action.payload.id, {
        id: action.payload.id,
        title: action.payload.title,
        phase: "initializing",
        progress: 0,
        steps: [],
        startTime: new Date(),
      });
      return { ...state, operations: newOperations };
    }

    case "UPDATE_OPERATION": {
      const newOperations = new Map(state.operations);
      const existing = newOperations.get(action.payload.id);
      if (existing) {
        newOperations.set(action.payload.id, {
          ...existing,
          ...action.payload.update,
        });
      }
      return { ...state, operations: newOperations };
    }

    case "SET_PHASE": {
      const newOperations = new Map(state.operations);
      const existing = newOperations.get(action.payload.id);
      if (existing) {
        newOperations.set(action.payload.id, {
          ...existing,
          phase: action.payload.phase,
        });
      }
      return { ...state, operations: newOperations };
    }

    case "SET_PROGRESS": {
      const newOperations = new Map(state.operations);
      const existing = newOperations.get(action.payload.id);
      if (existing) {
        newOperations.set(action.payload.id, {
          ...existing,
          progress: action.payload.progress,
        });
      }
      return { ...state, operations: newOperations };
    }

    case "SET_MESSAGE": {
      const newOperations = new Map(state.operations);
      const existing = newOperations.get(action.payload.id);
      if (existing) {
        newOperations.set(action.payload.id, {
          ...existing,
          message: action.payload.message,
        });
      }
      return { ...state, operations: newOperations };
    }

    case "ADD_STEP": {
      const newOperations = new Map(state.operations);
      const existing = newOperations.get(action.payload.id);
      if (existing) {
        newOperations.set(action.payload.id, {
          ...existing,
          steps: [...existing.steps, action.payload.step],
        });
      }
      return { ...state, operations: newOperations };
    }

    case "UPDATE_STEP": {
      const newOperations = new Map(state.operations);
      const existing = newOperations.get(action.payload.id);
      if (existing) {
        newOperations.set(action.payload.id, {
          ...existing,
          steps: existing.steps.map((step) =>
            step.id === action.payload.stepId
              ? { ...step, ...action.payload.update }
              : step
          ),
        });
      }
      return { ...state, operations: newOperations };
    }

    case "COMPLETE_OPERATION": {
      const newOperations = new Map(state.operations);
      const existing = newOperations.get(action.payload.id);
      if (existing) {
        newOperations.set(action.payload.id, {
          ...existing,
          phase: "complete",
          progress: 100,
        });
      }
      return { ...state, operations: newOperations };
    }

    case "REMOVE_OPERATION": {
      const newOperations = new Map(state.operations);
      newOperations.delete(action.payload.id);
      return { ...state, operations: newOperations };
    }

    case "TOGGLE_MINIMIZED": {
      return { ...state, minimized: !state.minimized };
    }

    case "SET_POSITION": {
      return { ...state, position: action.payload };
    }

    default:
      return state;
  }
}

// ============================================================================
// Provider Component
// ============================================================================

interface EliteOperationsProviderProps {
  children: ReactNode;
  /** Initial position of the floating panel */
  position?: OperationsState["position"];
  /** Auto-dismiss completed operations after this duration (ms) */
  autoDismissDelay?: number;
}

export function EliteOperationsProvider({
  children,
  position = "bottom-right",
  autoDismissDelay = 5000,
}: EliteOperationsProviderProps) {
  const [state, dispatch] = useReducer(operationsReducer, {
    operations: new Map(),
    minimized: false,
    position,
  });

  const startOperation = useCallback((id: string, title: string) => {
    dispatch({ type: "START_OPERATION", payload: { id, title } });
  }, []);

  const updateOperation = useCallback((id: string, update: Partial<Operation>) => {
    dispatch({ type: "UPDATE_OPERATION", payload: { id, update } });
  }, []);

  const setPhase = useCallback((id: string, phase: OperationPhase) => {
    dispatch({ type: "SET_PHASE", payload: { id, phase } });
  }, []);

  const setProgress = useCallback((id: string, progress: number) => {
    dispatch({ type: "SET_PROGRESS", payload: { id, progress } });
  }, []);

  const setMessage = useCallback((id: string, message: string) => {
    dispatch({ type: "SET_MESSAGE", payload: { id, message } });
  }, []);

  const addStep = useCallback((id: string, step: OperationStep) => {
    dispatch({ type: "ADD_STEP", payload: { id, step } });
  }, []);

  const updateStep = useCallback(
    (id: string, stepId: string, update: Partial<OperationStep>) => {
      dispatch({ type: "UPDATE_STEP", payload: { id, stepId, update } });
    },
    []
  );

  const completeOperation = useCallback(
    (id: string) => {
      dispatch({ type: "COMPLETE_OPERATION", payload: { id } });

      // Auto-dismiss after delay
      if (autoDismissDelay > 0) {
        setTimeout(() => {
          dispatch({ type: "REMOVE_OPERATION", payload: { id } });
        }, autoDismissDelay);
      }
    },
    [autoDismissDelay]
  );

  const removeOperation = useCallback((id: string) => {
    dispatch({ type: "REMOVE_OPERATION", payload: { id } });
  }, []);

  const toggleMinimized = useCallback(() => {
    dispatch({ type: "TOGGLE_MINIMIZED" });
  }, []);

  const operations = Array.from(state.operations.values());

  const value: OperationsContextValue = {
    state,
    operations,
    startOperation,
    updateOperation,
    setPhase,
    setProgress,
    setMessage,
    addStep,
    updateStep,
    completeOperation,
    removeOperation,
    toggleMinimized,
  };

  return (
    <OperationsContext.Provider value={value}>
      {children}
      {operations.length > 0 && (
        <FloatingOperationsPanel
          operations={operations}
          minimized={state.minimized}
          position={state.position}
          onToggleMinimized={toggleMinimized}
          onDismiss={removeOperation}
        />
      )}
    </OperationsContext.Provider>
  );
}

// ============================================================================
// Hook
// ============================================================================

export function useEliteOperations() {
  const context = useContext(OperationsContext);
  if (!context) {
    throw new Error(
      "useEliteOperations must be used within an EliteOperationsProvider"
    );
  }
  return context;
}

// ============================================================================
// Floating Panel
// ============================================================================

interface FloatingOperationsPanelProps {
  operations: Operation[];
  minimized: boolean;
  position: OperationsState["position"];
  onToggleMinimized: () => void;
  onDismiss: (id: string) => void;
}

function FloatingOperationsPanel({
  operations,
  minimized,
  position,
  onToggleMinimized,
  onDismiss,
}: FloatingOperationsPanelProps) {
  const positionClasses: Record<OperationsState["position"], string> = {
    "bottom-right": "bottom-4 right-4",
    "bottom-left": "bottom-4 left-4",
    "top-right": "top-4 right-4",
    "top-left": "top-4 left-4",
  };

  const activeOps = operations.filter((op) => op.phase !== "complete");
  const completedOps = operations.filter((op) => op.phase === "complete");

  return (
    <div
      className={cn(
        "fixed z-50 transition-all duration-300",
        positionClasses[position],
        minimized ? "w-auto" : "w-96"
      )}
    >
      {minimized ? (
        /* Minimized View */
        <button
          onClick={onToggleMinimized}
          className={cn(
            "flex items-center gap-3 px-4 py-3 rounded-full",
            "bg-bg-card border shadow-lg",
            "hover:shadow-xl transition-all",
            "animate-pulse"
          )}
        >
          <div className="relative">
            <span className="text-lg">⚡</span>
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#ff6b35] text-white text-xs rounded-full flex items-center justify-center">
              {activeOps.length}
            </span>
          </div>
          <span className="text-sm font-medium text-text-primary">
            {activeOps.length} active operation{activeOps.length !== 1 ? "s" : ""}
          </span>
        </button>
      ) : (
        /* Expanded View */
        <div className="bg-bg-card border rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b bg-bg-secondary/50">
            <div className="flex items-center gap-2">
              <span className="text-lg">⚡</span>
              <span className="font-semibold text-text-primary text-sm">
                Active Operations
              </span>
              {activeOps.length > 0 && (
                <span className="px-2 py-0.5 bg-[#ff6b35] text-white text-xs rounded-full">
                  {activeOps.length}
                </span>
              )}
            </div>
            <button
              onClick={onToggleMinimized}
              className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              title="Minimise"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>

          {/* Operations List */}
          <div className="max-h-[60vh] overflow-y-auto">
            {operations.length === 0 ? (
              <div className="p-8 text-center text-text-secondary text-sm">
                No active operations
              </div>
            ) : (
              <div className="divide-y">
                {operations.map((op) => (
                  <div key={op.id} className="p-3 hover:bg-bg-secondary/30 transition-colors">
                    <EliteOperationStatus
                      operationId={op.id}
                      title={op.title}
                      phase={op.phase}
                      progress={op.progress}
                      message={op.message}
                      steps={op.steps}
                      startTime={op.startTime}
                      compact
                      onComplete={() => {
                        // Auto-handled by provider
                      }}
                    />
                    {op.phase === "complete" && (
                      <button
                        onClick={() => onDismiss(op.id)}
                        className="mt-2 text-xs text-text-tertiary hover:text-text-secondary"
                      >
                        Dismiss
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default EliteOperationsProvider;
