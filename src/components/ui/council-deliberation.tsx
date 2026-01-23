"use client";

/**
 * Council of Logic Deliberation UI
 *
 * Visualises the mathematical first principles deliberation process
 * with four legendary mathematicians/scientists evaluating operations.
 */

import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import {
  Cpu,
  Network,
  Sparkles,
  Binary,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
} from "lucide-react";

// ============================================================================
// Types
// ============================================================================

export type CouncilMember =
  | "Alan_Turing"
  | "John_von_Neumann"
  | "Pierre_Bezier"
  | "Claude_Shannon";

export interface MemberVerdict {
  member: CouncilMember;
  approved: boolean;
  score: number;
  reasoning: string;
  recommendations: string[];
}

export interface CouncilDeliberationProps {
  operation: string;
  phase: "proof" | "solve" | "verify" | "complete";
  verdicts: MemberVerdict[];
  consensus: boolean;
  overallScore: number;
  finalVerdict: "approved" | "rejected" | "needs_revision";
  mathematicalModel?: string;
  complexityAnalysis?: {
    time: string;
    space: string;
    acceptable: boolean;
  };
  compact?: boolean;
  onClose?: () => void;
}

// ============================================================================
// Member Config
// ============================================================================

const MEMBER_CONFIG: Record<
  CouncilMember,
  {
    name: string;
    shortName: string;
    role: string;
    icon: React.ComponentType<{ className?: string }>;
    color: string;
    bgColor: string;
    borderColor: string;
  }
> = {
  Alan_Turing: {
    name: "Alan Turing",
    shortName: "Turing",
    role: "Algorithmic Efficiency",
    icon: Cpu,
    color: "text-blue-400",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/30",
  },
  John_von_Neumann: {
    name: "John von Neumann",
    shortName: "von Neumann",
    role: "Game Theory",
    icon: Network,
    color: "text-purple-400",
    bgColor: "bg-purple-500/10",
    borderColor: "border-purple-500/30",
  },
  Pierre_Bezier: {
    name: "Pierre Bézier",
    shortName: "Bézier",
    role: "Animation Physics",
    icon: Sparkles,
    color: "text-pink-400",
    bgColor: "bg-pink-500/10",
    borderColor: "border-pink-500/30",
  },
  Claude_Shannon: {
    name: "Claude Shannon",
    shortName: "Shannon",
    role: "Token Economy",
    icon: Binary,
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/10",
    borderColor: "border-emerald-500/30",
  },
};

// ============================================================================
// Phase Indicator
// ============================================================================

function PhaseIndicator({
  currentPhase,
}: {
  currentPhase: CouncilDeliberationProps["phase"];
}) {
  const phases = [
    { id: "proof", label: "THE PROOF", description: "Mathematical model" },
    { id: "solve", label: "THE SOLVE", description: "Complexity analysis" },
    { id: "verify", label: "THE VERIFY", description: "Council deliberation" },
    { id: "complete", label: "VERDICT", description: "Final decision" },
  ];

  const currentIndex = phases.findIndex((p) => p.id === currentPhase);

  return (
    <div className="flex items-center gap-2 mb-6">
      {phases.map((phase, idx) => {
        const isActive = phase.id === currentPhase;
        const isComplete = idx < currentIndex;

        return (
          <React.Fragment key={phase.id}>
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-500",
                  isComplete && "bg-emerald-500 text-white",
                  isActive && "bg-accent-500 text-white animate-pulse",
                  !isComplete && !isActive && "bg-bg-tertiary text-text-muted"
                )}
              >
                {isComplete ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : (
                  idx + 1
                )}
              </div>
              <span
                className={cn(
                  "text-[10px] mt-1 font-medium",
                  isActive ? "text-accent-400" : "text-text-muted"
                )}
              >
                {phase.label}
              </span>
            </div>
            {idx < phases.length - 1 && (
              <div
                className={cn(
                  "flex-1 h-0.5 transition-all duration-500",
                  idx < currentIndex ? "bg-emerald-500" : "bg-bg-tertiary"
                )}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ============================================================================
// Member Card
// ============================================================================

function MemberCard({
  member,
  verdict,
  isDeliberating,
  compact,
}: {
  member: CouncilMember;
  verdict?: MemberVerdict;
  isDeliberating: boolean;
  compact?: boolean;
}) {
  const config = MEMBER_CONFIG[member];
  const Icon = config.icon;

  const getScoreColor = (score: number) => {
    if (score >= 80) {
return "text-emerald-400";
}
    if (score >= 60) {
return "text-yellow-400";
}
    if (score >= 40) {
return "text-orange-400";
}
    return "text-red-400";
  };

  if (compact) {
    return (
      <div
        className={cn(
          "flex items-center gap-2 p-2 rounded-lg border transition-all duration-300",
          config.bgColor,
          config.borderColor,
          isDeliberating && "animate-pulse"
        )}
      >
        <Icon className={cn("w-4 h-4", config.color)} />
        <span className="text-xs font-medium text-text-primary">
          {config.shortName}
        </span>
        {verdict ? (
          <span className={cn("text-xs font-bold ml-auto", getScoreColor(verdict.score))}>
            {verdict.score}
          </span>
        ) : isDeliberating ? (
          <Loader2 className="w-3 h-3 ml-auto animate-spin text-text-muted" />
        ) : null}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-xl border p-4 transition-all duration-500",
        config.bgColor,
        config.borderColor,
        isDeliberating && "ring-2 ring-accent-500/50 animate-pulse"
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "w-10 h-10 rounded-lg flex items-center justify-center",
              config.bgColor,
              "border",
              config.borderColor
            )}
          >
            <Icon className={cn("w-5 h-5", config.color)} />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-text-primary">
              {config.name}
            </h4>
            <p className={cn("text-xs", config.color)}>{config.role}</p>
          </div>
        </div>

        {/* Status */}
        {verdict ? (
          <div className="flex items-center gap-2">
            {verdict.approved ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            ) : (
              <XCircle className="w-5 h-5 text-red-400" />
            )}
            <span className={cn("text-lg font-bold", getScoreColor(verdict.score))}>
              {verdict.score}
            </span>
          </div>
        ) : isDeliberating ? (
          <div className="flex items-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-accent-400" />
            <span className="text-xs text-text-muted">Evaluating...</span>
          </div>
        ) : (
          <span className="text-xs text-text-muted">Waiting</span>
        )}
      </div>

      {/* Verdict Details */}
      {verdict && (
        <div className="space-y-2">
          <p className="text-xs text-text-secondary leading-relaxed">
            {verdict.reasoning}
          </p>
          {verdict.recommendations.length > 0 && (
            <div className="mt-2">
              <p className="text-[10px] uppercase tracking-wide text-text-muted mb-1">
                Recommendations
              </p>
              <ul className="text-xs text-text-secondary space-y-0.5">
                {verdict.recommendations.slice(0, 2).map((rec, i) => (
                  <li key={i} className="flex items-start gap-1">
                    <span className={config.color}>•</span>
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function CouncilDeliberation({
  operation,
  phase,
  verdicts,
  consensus,
  overallScore,
  finalVerdict,
  mathematicalModel,
  complexityAnalysis,
  compact = false,
  onClose,
}: CouncilDeliberationProps) {
  const members: CouncilMember[] = [
    "Alan_Turing",
    "John_von_Neumann",
    "Pierre_Bezier",
    "Claude_Shannon",
  ];

  const getVerdictIcon = () => {
    switch (finalVerdict) {
      case "approved":
        return <CheckCircle2 className="w-6 h-6 text-emerald-400" />;
      case "rejected":
        return <XCircle className="w-6 h-6 text-red-400" />;
      default:
        return <AlertCircle className="w-6 h-6 text-yellow-400" />;
    }
  };

  const getVerdictText = () => {
    switch (finalVerdict) {
      case "approved":
        return "APPROVED";
      case "rejected":
        return "REJECTED";
      default:
        return "NEEDS REVISION";
    }
  };

  if (compact) {
    return (
      <div className="bg-bg-card rounded-lg border border-border-primary p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-accent-500 animate-pulse" />
            <span className="text-xs font-medium text-text-primary">
              Council of Logic
            </span>
          </div>
          {phase === "complete" && (
            <span
              className={cn(
                "text-xs font-bold",
                finalVerdict === "approved" && "text-emerald-400",
                finalVerdict === "rejected" && "text-red-400",
                finalVerdict === "needs_revision" && "text-yellow-400"
              )}
            >
              {overallScore}/100
            </span>
          )}
        </div>
        <div className="grid grid-cols-2 gap-2">
          {members.map((member) => {
            const verdict = verdicts.find((v) => v.member === member);
            const isDeliberating =
              phase === "verify" && !verdict;
            return (
              <MemberCard
                key={member}
                member={member}
                verdict={verdict}
                isDeliberating={isDeliberating}
                compact
              />
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-bg-elevated rounded-2xl border border-border-primary p-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-accent-500 animate-pulse" />
            <span className="text-xs font-medium text-accent-400 uppercase tracking-wide">
              Mathematical First Principles
            </span>
          </div>
          <h3 className="text-lg font-bold text-text-primary">
            Council of Logic
          </h3>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-text-muted hover:text-text-primary transition-colors"
          >
            ✕
          </button>
        )}
      </div>

      {/* Phase Progress */}
      <PhaseIndicator currentPhase={phase} />

      {/* Operation Info */}
      <div className="bg-bg-tertiary rounded-lg p-4 mb-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-text-muted uppercase tracking-wide mb-1">
              Operation
            </p>
            <p className="text-sm font-medium text-text-primary">{operation}</p>
          </div>
          {mathematicalModel && (
            <div className="text-right">
              <p className="text-xs text-text-muted uppercase tracking-wide mb-1">
                Model
              </p>
              <p className="text-sm font-mono text-accent-400">
                {mathematicalModel}
              </p>
            </div>
          )}
        </div>

        {complexityAnalysis && (
          <div className="flex gap-4 mt-3 pt-3 border-t border-border-primary">
            <div>
              <span className="text-xs text-text-muted">Time:</span>
              <span
                className={cn(
                  "ml-2 text-sm font-mono",
                  complexityAnalysis.acceptable
                    ? "text-emerald-400"
                    : "text-red-400"
                )}
              >
                {complexityAnalysis.time}
              </span>
            </div>
            <div>
              <span className="text-xs text-text-muted">Space:</span>
              <span className="ml-2 text-sm font-mono text-blue-400">
                {complexityAnalysis.space}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Council Members Grid */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {members.map((member) => {
          const verdict = verdicts.find((v) => v.member === member);
          const isDeliberating =
            phase === "verify" && !verdict;
          return (
            <MemberCard
              key={member}
              member={member}
              verdict={verdict}
              isDeliberating={isDeliberating}
            />
          );
        })}
      </div>

      {/* Final Verdict */}
      {phase === "complete" && (
        <div
          className={cn(
            "rounded-xl p-4 border-2 flex items-center justify-between",
            finalVerdict === "approved" &&
              "bg-emerald-500/10 border-emerald-500/30",
            finalVerdict === "rejected" && "bg-red-500/10 border-red-500/30",
            finalVerdict === "needs_revision" &&
              "bg-yellow-500/10 border-yellow-500/30"
          )}
        >
          <div className="flex items-center gap-3">
            {getVerdictIcon()}
            <div>
              <p className="text-sm font-bold text-text-primary">
                {getVerdictText()}
              </p>
              <p className="text-xs text-text-muted">
                {consensus ? "Consensus reached" : "No consensus"} • Score:{" "}
                {overallScore}/100
              </p>
            </div>
          </div>
          <div className="text-3xl font-bold text-text-primary">
            {overallScore}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Demo Component
// ============================================================================

export function CouncilDeliberationDemo() {
  const [phase, setPhase] = useState<CouncilDeliberationProps["phase"]>("proof");
  const [verdicts, setVerdicts] = useState<MemberVerdict[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const runDemo = async () => {
    setIsRunning(true);
    setPhase("proof");
    setVerdicts([]);

    await new Promise((r) => setTimeout(r, 1500));
    setPhase("solve");

    await new Promise((r) => setTimeout(r, 1500));
    setPhase("verify");

    const demoVerdicts: MemberVerdict[] = [
      {
        member: "Alan_Turing",
        approved: true,
        score: 85,
        reasoning:
          "The algorithm achieves O(n log n) complexity through efficient sorting. Deterministic behaviour confirmed.",
        recommendations: [
          "Consider memoisation for repeated calls",
          "Add early termination for sorted inputs",
        ],
      },
      {
        member: "John_von_Neumann",
        approved: true,
        score: 78,
        reasoning:
          "User flow follows dominant strategy. Expected value maximised through optimal CTA placement.",
        recommendations: [
          "A/B test button positioning",
          "Consider minimax for edge cases",
        ],
      },
      {
        member: "Pierre_Bezier",
        approved: true,
        score: 92,
        reasoning:
          "Excellent use of cubic-bezier(0.16, 1, 0.3, 1) for transitions. Physics-based springs maintain 60fps.",
        recommendations: ["Add micro-interactions on hover states"],
      },
      {
        member: "Claude_Shannon",
        approved: true,
        score: 88,
        reasoning:
          "Prompt compression achieved 40% token reduction. Signal-to-noise ratio optimal.",
        recommendations: [
          "Consider context caching for repeated queries",
        ],
      },
    ];

    for (const verdict of demoVerdicts) {
      await new Promise((r) => setTimeout(r, 1200));
      setVerdicts((prev) => [...prev, verdict]);
    }

    await new Promise((r) => setTimeout(r, 800));
    setPhase("complete");
    setIsRunning(false);
  };

  const avgScore = verdicts.length
    ? Math.round(verdicts.reduce((sum, v) => sum + v.score, 0) / verdicts.length)
    : 0;

  return (
    <div className="space-y-4">
      <button
        onClick={runDemo}
        disabled={isRunning}
        className={cn(
          "px-4 py-2 rounded-lg font-medium text-sm transition-all",
          isRunning
            ? "bg-bg-tertiary text-text-muted cursor-not-allowed"
            : "bg-accent-500 text-white hover:bg-accent-600"
        )}
      >
        {isRunning ? "Deliberating..." : "Run Council Demo"}
      </button>

      <CouncilDeliberation
        operation="Generate personalised email campaign"
        phase={phase}
        verdicts={verdicts}
        consensus={verdicts.filter((v) => v.approved).length >= 3}
        overallScore={avgScore}
        finalVerdict={
          phase === "complete"
            ? avgScore >= 70
              ? "approved"
              : avgScore >= 50
              ? "needs_revision"
              : "rejected"
            : "needs_revision"
        }
        mathematicalModel="Graph traversal (DFS) + Markov chain"
        complexityAnalysis={{
          time: "O(n log n)",
          space: "O(n)",
          acceptable: true,
        }}
      />
    </div>
  );
}

export default CouncilDeliberation;
