"use client";

/**
 * Elite Operation Status Demo
 *
 * Interactive demonstration of the AI operation status system.
 * Shows users what the progress indicators look like in action.
 */

import React, { useState, useEffect, useCallback } from "react";
import {
  EliteOperationStatus,
  useOperationStatus,
  type OperationPhase,
  type OperationStep
} from "./elite-operation-status";
import { cn } from "@/lib/utils";

// ============================================================================
// Demo Simulation
// ============================================================================

const DEMO_STEPS: OperationStep[] = [
  { id: "init", label: "Initialise environment", status: "pending" },
  { id: "analyze", label: "Analyse request context", status: "pending" },
  { id: "retrieve", label: "Retrieve relevant data", status: "pending" },
  { id: "process", label: "Process with AI model", status: "pending" },
  { id: "validate", label: "Validate output quality", status: "pending" },
  { id: "format", label: "Format response", status: "pending" },
];

const DEMO_MESSAGES: Record<OperationPhase, string> = {
  initializing: "Setting up the processing environment and loading required models...",
  analyzing: "Examining your request to understand the context and requirements...",
  thinking: "Processing your request through our advanced AI models...",
  generating: "Creating your content with attention to detail and accuracy...",
  validating: "Running quality checks to ensure the best possible output...",
  finalizing: "Preparing the final result and formatting the response...",
  complete: "Your request has been completed successfully!",
  error: "An error occurred while processing your request.",
};

// ============================================================================
// Demo Component
// ============================================================================

export function EliteOperationDemo() {
  const [isRunning, setIsRunning] = useState(false);
  const [showCompact, setShowCompact] = useState(false);
  const status = useOperationStatus({ initialPhase: "initializing" });

  const runDemo = useCallback(async () => {
    setIsRunning(true);
    status.reset();

    // Add steps
    DEMO_STEPS.forEach(step => status.addStep({ ...step, status: "pending" }));

    // Phase 1: Initializing
    status.setPhase("initializing");
    status.setMessage(DEMO_MESSAGES.initializing);
    status.setProgress(5);
    status.setActiveStep("init", "Loading models...");
    await delay(1200);
    status.completeStep("init", 1200);
    status.setProgress(15);

    // Phase 2: Analyzing
    status.setPhase("analyzing");
    status.setMessage(DEMO_MESSAGES.analyzing);
    status.setActiveStep("analyze", "Parsing request parameters...");
    await delay(1500);
    status.completeStep("analyze", 1500);
    status.setProgress(30);

    // Phase 3: Thinking
    status.setPhase("thinking");
    status.setMessage(DEMO_MESSAGES.thinking);
    status.setActiveStep("retrieve", "Querying knowledge base...");
    await delay(1000);
    status.completeStep("retrieve", 1000);
    status.setProgress(45);

    status.setActiveStep("process", "Running inference pipeline...");
    await delay(2000);
    status.completeStep("process", 2000);
    status.setProgress(65);

    // Phase 4: Generating
    status.setPhase("generating");
    status.setMessage(DEMO_MESSAGES.generating);
    await delay(1500);
    status.setProgress(80);

    // Phase 5: Validating
    status.setPhase("validating");
    status.setMessage(DEMO_MESSAGES.validating);
    status.setActiveStep("validate", "Checking output quality...");
    await delay(1000);
    status.completeStep("validate", 1000);
    status.setProgress(90);

    // Phase 6: Finalizing
    status.setPhase("finalizing");
    status.setMessage(DEMO_MESSAGES.finalizing);
    status.setActiveStep("format", "Formatting response...");
    await delay(800);
    status.completeStep("format", 800);
    status.setProgress(100);

    // Complete
    await delay(500);
    status.setPhase("complete");
    status.setMessage(DEMO_MESSAGES.complete);

    setIsRunning(false);
  }, [status]);

  return (
    <div className="space-y-8">
      {/* Controls */}
      <div className="flex items-center gap-4 p-4 bg-bg-secondary rounded-xl border">
        <button
          onClick={runDemo}
          disabled={isRunning}
          className={cn(
            "px-6 py-3 rounded-lg font-semibold transition-all",
            "bg-[#ff6b35] text-white shadow-lg",
            "hover:bg-[#ff5c1a] hover:shadow-xl hover:-translate-y-0.5",
            "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
          )}
        >
          {isRunning ? "Running Demo..." : "Run Demo"}
        </button>

        <label className="flex items-center gap-2 text-sm text-text-secondary cursor-pointer">
          <input
            type="checkbox"
            checked={showCompact}
            onChange={(e) => setShowCompact(e.target.checked)}
            className="w-4 h-4 rounded border-gray-300 text-[#ff6b35] focus:ring-[#ff6b35]"
          />
          Compact Mode
        </label>

        <button
          onClick={status.reset}
          disabled={isRunning}
          className="px-4 py-2 text-sm text-text-secondary hover:text-text-primary transition-colors"
        >
          Reset
        </button>
      </div>

      {/* Demo Display */}
      <div className="space-y-6">
        <EliteOperationStatus
          operationId="demo-op-001"
          title="Content Generation Pipeline"
          compact={showCompact}
          {...status.statusProps}
        />
      </div>

      {/* Usage Guide */}
      <div className="p-6 bg-bg-secondary rounded-xl border">
        <h3 className="text-lg font-semibold text-text-primary mb-4">
          Integration Guide
        </h3>
        <pre className="p-4 bg-gray-900 text-gray-100 rounded-lg text-sm overflow-x-auto">
{`// Usage in your component
import { EliteOperationStatus, useOperationStatus } from '@/components/ui/elite-operation-status';

function MyComponent() {
  const status = useOperationStatus();

  const handleOperation = async () => {
    status.setPhase("analyzing");
    status.setMessage("Processing your request...");
    status.addStep({ id: "step1", label: "Step 1", status: "active" });

    // ... your async operation

    status.completeStep("step1", 1500);
    status.setPhase("complete");
  };

  return (
    <EliteOperationStatus
      title="My Operation"
      {...status.statusProps}
    />
  );
}`}
        </pre>
      </div>
    </div>
  );
}

// ============================================================================
// Compact Demo Grid
// ============================================================================

export function EliteOperationDemoGrid() {
  const phases: OperationPhase[] = [
    "initializing",
    "analyzing",
    "thinking",
    "generating",
    "validating",
    "complete",
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {phases.map((phase, index) => (
        <EliteOperationStatus
          key={phase}
          title={`Sample ${phase}`}
          phase={phase}
          progress={((index + 1) / phases.length) * 100}
          message={DEMO_MESSAGES[phase]}
          compact
        />
      ))}
    </div>
  );
}

// ============================================================================
// Helper
// ============================================================================

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export default EliteOperationDemo;
