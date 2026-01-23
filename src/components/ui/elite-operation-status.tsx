"use client";

/**
 * Elite Operation Status - Premium AI Work Visualization
 *
 * Shows users exactly what the AI system is doing in real-time:
 * - Current operation stage
 * - Animated progress indicators
 * - Time elapsed
 * - Sub-step details
 * - Visual "thinking" feedback
 *
 * Design: Bespoke luxury aesthetic with micro-interactions
 * @see DESIGN-SYSTEM.md for token usage
 */

import React, { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";

// ============================================================================
// Types
// ============================================================================

export type OperationPhase =
  | "initializing"
  | "analyzing"
  | "thinking"
  | "generating"
  | "validating"
  | "finalizing"
  | "complete"
  | "error";

export interface OperationStep {
  id: string;
  label: string;
  status: "pending" | "active" | "complete" | "error";
  detail?: string;
  duration?: number;
}

export interface EliteOperationStatusProps {
  /** Operation identifier */
  operationId?: string;
  /** Display title */
  title: string;
  /** Current phase */
  phase: OperationPhase;
  /** Overall progress 0-100 */
  progress?: number;
  /** Current status message */
  message?: string;
  /** Sub-steps of the operation */
  steps?: OperationStep[];
  /** Operation start time */
  startTime?: Date;
  /** Show compact mode */
  compact?: boolean;
  /** Custom className */
  className?: string;
  /** Callback when complete */
  onComplete?: () => void;
}

// ============================================================================
// Phase Configuration
// ============================================================================

const PHASE_CONFIG: Record<OperationPhase, {
  label: string;
  icon: string;
  color: string;
  bgColor: string;
  pulseColor: string;
}> = {
  initializing: {
    label: "Initialising",
    icon: "⚡",
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
    pulseColor: "bg-blue-400",
  },
  analyzing: {
    label: "Analysing",
    icon: "🔍",
    color: "text-purple-500",
    bgColor: "bg-purple-500/10",
    pulseColor: "bg-purple-400",
  },
  thinking: {
    label: "Processing",
    icon: "🧠",
    color: "text-amber-500",
    bgColor: "bg-amber-500/10",
    pulseColor: "bg-amber-400",
  },
  generating: {
    label: "Generating",
    icon: "✨",
    color: "text-[#ff6b35]",
    bgColor: "bg-[#ff6b35]/10",
    pulseColor: "bg-[#ff6b35]",
  },
  validating: {
    label: "Validating",
    icon: "✓",
    color: "text-cyan-500",
    bgColor: "bg-cyan-500/10",
    pulseColor: "bg-cyan-400",
  },
  finalizing: {
    label: "Finalising",
    icon: "📦",
    color: "text-indigo-500",
    bgColor: "bg-indigo-500/10",
    pulseColor: "bg-indigo-400",
  },
  complete: {
    label: "Complete",
    icon: "✅",
    color: "text-emerald-500",
    bgColor: "bg-emerald-500/10",
    pulseColor: "bg-emerald-400",
  },
  error: {
    label: "Error",
    icon: "❌",
    color: "text-red-500",
    bgColor: "bg-red-500/10",
    pulseColor: "bg-red-400",
  },
};

// ============================================================================
// Animated Neural Pulse
// ============================================================================

function NeuralPulse({ color, active }: { color: string; active: boolean }) {
  if (!active) {
return null;
}

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      {[...Array(3)].map((_, i) => (
        <div
          key={i}
          className={cn(
            "absolute rounded-full opacity-0",
            color
          )}
          style={{
            width: `${100 + i * 40}%`,
            height: `${100 + i * 40}%`,
            animation: `pulse-ring 2s ease-out ${i * 0.4}s infinite`,
          }}
        />
      ))}
    </div>
  );
}

// ============================================================================
// Thinking Dots Animation
// ============================================================================

function ThinkingDots({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex gap-1", className)}>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-current animate-bounce"
          style={{ animationDelay: `${i * 150}ms` }}
        />
      ))}
    </span>
  );
}

// ============================================================================
// Progress Ring
// ============================================================================

function ProgressRing({
  progress,
  size = 64,
  strokeWidth = 4,
  className
}: {
  progress: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <svg
      width={size}
      height={size}
      className={cn("transform -rotate-90", className)}
    >
      {/* Background ring */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        strokeWidth={strokeWidth}
        className="fill-none stroke-current opacity-10"
      />
      {/* Progress ring */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        className="fill-none stroke-current transition-all duration-500 ease-out"
        style={{
          strokeDasharray: circumference,
          strokeDashoffset: offset,
        }}
      />
    </svg>
  );
}

// ============================================================================
// Elapsed Time Display
// ============================================================================

function ElapsedTime({ startTime }: { startTime: Date }) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime.getTime()) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [startTime]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins > 0) {
      return `${mins}m ${secs}s`;
    }
    return `${secs}s`;
  };

  return (
    <span className="text-xs text-text-secondary font-mono tabular-nums">
      {formatTime(elapsed)}
    </span>
  );
}

// ============================================================================
// Step Item
// ============================================================================

function StepItem({ step, index }: { step: OperationStep; index: number }) {
  const statusStyles = {
    pending: "text-text-tertiary",
    active: "text-[#ff6b35]",
    complete: "text-emerald-500",
    error: "text-red-500",
  };

  const iconStyles = {
    pending: "border-gray-300 dark:border-gray-600",
    active: "border-[#ff6b35] bg-[#ff6b35]/10",
    complete: "border-emerald-500 bg-emerald-500 text-white",
    error: "border-red-500 bg-red-500 text-white",
  };

  return (
    <div
      className={cn(
        "flex items-start gap-3 py-2 transition-all duration-300",
        step.status === "active" && "scale-[1.02]"
      )}
      style={{ animationDelay: `${index * 100}ms` }}
    >
      {/* Step indicator */}
      <div className={cn(
        "relative w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-semibold shrink-0 transition-all",
        iconStyles[step.status]
      )}>
        {step.status === "complete" ? (
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        ) : step.status === "error" ? (
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : step.status === "active" ? (
          <div className="w-2 h-2 rounded-full bg-[#ff6b35] animate-pulse" />
        ) : (
          <span>{index + 1}</span>
        )}
        {/* Active pulse */}
        {step.status === "active" && (
          <span className="absolute inset-0 rounded-full border-2 border-[#ff6b35] animate-ping opacity-50" />
        )}
      </div>

      {/* Step content */}
      <div className="flex-1 min-w-0">
        <div className={cn(
          "text-sm font-medium transition-colors",
          statusStyles[step.status]
        )}>
          {step.label}
          {step.status === "active" && <ThinkingDots className="ml-2" />}
        </div>
        {step.detail && (
          <p className="text-xs text-text-tertiary mt-0.5 truncate">
            {step.detail}
          </p>
        )}
        {step.status === "complete" && step.duration && (
          <p className="text-xs text-emerald-500 mt-0.5 font-mono">
            {(step.duration / 1000).toFixed(1)}s
          </p>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function EliteOperationStatus({
  operationId,
  title,
  phase,
  progress = 0,
  message,
  steps = [],
  startTime = new Date(),
  compact = false,
  className,
  onComplete,
}: EliteOperationStatusProps) {
  const config = PHASE_CONFIG[phase];
  const isActive = phase !== "complete" && phase !== "error";

  useEffect(() => {
    if (phase === "complete" && onComplete) {
      onComplete();
    }
  }, [phase, onComplete]);

  if (compact) {
    return (
      <div className={cn(
        "flex items-center gap-3 p-3 rounded-lg border transition-all",
        config.bgColor,
        "border-current/10",
        className
      )}>
        <div className={cn("relative", config.color)}>
          <ProgressRing progress={progress} size={32} strokeWidth={3} />
          <span className="absolute inset-0 flex items-center justify-center text-sm">
            {config.icon}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-text-primary truncate">{title}</div>
          <div className={cn("text-xs", config.color)}>
            {config.label}
            {isActive && <ThinkingDots className="ml-1" />}
          </div>
        </div>
        <ElapsedTime startTime={startTime} />
      </div>
    );
  }

  return (
    <div className={cn(
      "relative overflow-hidden rounded-2xl border bg-bg-card shadow-lg",
      "transition-all duration-500",
      className
    )}>
      {/* Neural pulse background for active states */}
      <NeuralPulse color={config.pulseColor} active={isActive} />

      {/* Header */}
      <div className={cn(
        "relative px-6 py-5 border-b",
        config.bgColor
      )}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Animated icon container */}
            <div className={cn(
              "relative w-14 h-14 rounded-xl flex items-center justify-center text-2xl",
              "bg-white/80 dark:bg-gray-900/80 shadow-sm backdrop-blur-sm",
              "transition-transform duration-300",
              isActive && "animate-pulse"
            )}>
              {config.icon}
              {isActive && (
                <div className={cn(
                  "absolute inset-0 rounded-xl",
                  config.color
                )}>
                  <ProgressRing
                    progress={progress}
                    size={56}
                    strokeWidth={3}
                    className="absolute inset-0"
                  />
                </div>
              )}
            </div>

            {/* Title and status */}
            <div>
              <h3 className="text-lg font-semibold text-text-primary">{title}</h3>
              <div className="flex items-center gap-2 mt-1">
                <span className={cn(
                  "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium",
                  config.bgColor, config.color
                )}>
                  {config.label}
                  {isActive && <ThinkingDots className="ml-0.5" />}
                </span>
                {progress > 0 && phase !== "complete" && (
                  <span className="text-xs text-text-secondary font-mono">
                    {Math.round(progress)}%
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Elapsed time */}
          <div className="text-right">
            <div className="text-xs text-text-tertiary uppercase tracking-wide mb-1">Elapsed</div>
            <ElapsedTime startTime={startTime} />
          </div>
        </div>

        {/* Current message */}
        {message && (
          <p className="mt-4 text-sm text-text-secondary leading-relaxed">
            {message}
          </p>
        )}
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-gray-100 dark:bg-gray-800">
        <div
          className={cn(
            "h-full transition-all duration-700 ease-out",
            phase === "complete" ? "bg-emerald-500" : "bg-[#ff6b35]"
          )}
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Steps */}
      {steps.length > 0 && (
        <div className="px-6 py-4 divide-y divide-gray-100 dark:divide-gray-800">
          {steps.map((step, index) => (
            <StepItem key={step.id} step={step} index={index} />
          ))}
        </div>
      )}

      {/* Footer with operation ID */}
      {operationId && (
        <div className="px-6 py-3 bg-gray-50 dark:bg-gray-900/50 border-t">
          <div className="flex items-center justify-between text-xs text-text-tertiary">
            <span>Operation ID</span>
            <code className="font-mono">{operationId}</code>
          </div>
        </div>
      )}

      {/* Animated gradient border on active */}
      {isActive && (
        <div
          className="absolute inset-0 pointer-events-none rounded-2xl"
          style={{
            background: `linear-gradient(90deg, transparent, ${config.color.replace('text-', '')}20, transparent)`,
            backgroundSize: '200% 100%',
            animation: 'shimmer 2s infinite linear',
          }}
        />
      )}
    </div>
  );
}

// ============================================================================
// CSS Keyframes (add to globals.css)
// ============================================================================

/*
Add these keyframes to globals.css:

@keyframes pulse-ring {
  0% {
    transform: scale(0.8);
    opacity: 0.5;
  }
  100% {
    transform: scale(1.5);
    opacity: 0;
  }
}

@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
*/

// ============================================================================
// Export Hook for Easy State Management
// ============================================================================

export interface UseOperationStatusOptions {
  initialPhase?: OperationPhase;
  autoProgress?: boolean;
}

export function useOperationStatus(options: UseOperationStatusOptions = {}) {
  const { initialPhase = "initializing", autoProgress = false } = options;

  const [phase, setPhase] = useState<OperationPhase>(initialPhase);
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState("");
  const [steps, setSteps] = useState<OperationStep[]>([]);
  const [startTime] = useState(new Date());

  const updateStep = useCallback((stepId: string, update: Partial<OperationStep>) => {
    setSteps(prev => prev.map(step =>
      step.id === stepId ? { ...step, ...update } : step
    ));
  }, []);

  const addStep = useCallback((step: OperationStep) => {
    setSteps(prev => [...prev, step]);
  }, []);

  const completeStep = useCallback((stepId: string, duration?: number) => {
    updateStep(stepId, { status: "complete", duration });
  }, [updateStep]);

  const setActiveStep = useCallback((stepId: string, detail?: string) => {
    setSteps(prev => prev.map(step => ({
      ...step,
      status: step.id === stepId ? "active" :
              step.status === "active" ? "complete" : step.status,
      detail: step.id === stepId ? detail : step.detail,
    })));
  }, []);

  const complete = useCallback(() => {
    setPhase("complete");
    setProgress(100);
    setSteps(prev => prev.map(step => ({ ...step, status: "complete" as const })));
  }, []);

  const error = useCallback((errorMessage?: string) => {
    setPhase("error");
    if (errorMessage) {
setMessage(errorMessage);
}
  }, []);

  const reset = useCallback(() => {
    setPhase(initialPhase);
    setProgress(0);
    setMessage("");
    setSteps([]);
  }, [initialPhase]);

  return {
    // State
    phase,
    progress,
    message,
    steps,
    startTime,

    // Actions
    setPhase,
    setProgress,
    setMessage,
    addStep,
    updateStep,
    completeStep,
    setActiveStep,
    complete,
    error,
    reset,

    // Props for component
    statusProps: {
      phase,
      progress,
      message,
      steps,
      startTime,
    },
  };
}

export default EliteOperationStatus;
