"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  Clock,
  Zap,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Brain,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface StateTransition {
  id: string;
  from_state: string | null;
  to_state: string;
  transition_type: string;
  reason: string | null;
  confidence: number;
  created_at: string;
  duration_in_previous_state_seconds: number | null;
}

interface LeadState {
  id: string;
  lead_id: string;
  current_state: string;
  previous_state: string | null;
  engagement_level: string | null;
  activity_count: number;
  estimated_value: number | null;
  currency: string;
  probability: number | null;
  predicted_next_state: string | null;
  prediction_confidence: number | null;
  next_best_action: string | null;
  ai_reasoning: string | null;
  entered_at: string;
  time_in_state_seconds: number | null;
}

interface LeadStateTimelineProps {
  tenantId: string;
  leadId: string;
  currentState?: LeadState;
  transitions?: StateTransition[];
  onTransition?: (toState: string, reason: string) => void;
  onPredict?: () => void;
}

const STATE_CONFIG: Record<
  string,
  { color: string; icon: React.ReactNode; label: string }
> = {
  new: { color: "#6B7280", icon: <Clock className="w-4 h-4" />, label: "New" },
  contacted: {
    color: "#3B82F6",
    icon: <Zap className="w-4 h-4" />,
    label: "Contacted",
  },
  engaged: {
    color: "#8B5CF6",
    icon: <TrendingUp className="w-4 h-4" />,
    label: "Engaged",
  },
  qualified: {
    color: "#F59E0B",
    icon: <CheckCircle className="w-4 h-4" />,
    label: "Qualified",
  },
  proposal_sent: {
    color: "#EC4899",
    icon: <ArrowRight className="w-4 h-4" />,
    label: "Proposal Sent",
  },
  negotiating: {
    color: "#EF4444",
    icon: <RefreshCw className="w-4 h-4" />,
    label: "Negotiating",
  },
  won: {
    color: "#10B981",
    icon: <CheckCircle className="w-4 h-4" />,
    label: "Won",
  },
  lost: { color: "#6B7280", icon: <XCircle className="w-4 h-4" />, label: "Lost" },
  churned: {
    color: "#DC2626",
    icon: <XCircle className="w-4 h-4" />,
    label: "Churned",
  },
  reactivated: {
    color: "#14B8A6",
    icon: <RefreshCw className="w-4 h-4" />,
    label: "Reactivated",
  },
  dormant: {
    color: "#9CA3AF",
    icon: <Clock className="w-4 h-4" />,
    label: "Dormant",
  },
};

const ENGAGEMENT_COLORS: Record<string, string> = {
  cold: "#94A3B8",
  warming: "#3B82F6",
  warm: "#F59E0B",
  hot: "#EF4444",
  on_fire: "#DC2626",
};

function formatDuration(seconds: number | null): string {
  if (!seconds) {
return "—";
}
  if (seconds < 60) {
return `${seconds}s`;
}
  if (seconds < 3600) {
return `${Math.floor(seconds / 60)}m`;
}
  if (seconds < 86400) {
return `${Math.floor(seconds / 3600)}h`;
}
  return `${Math.floor(seconds / 86400)}d`;
}

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) {
return "just now";
}
  if (seconds < 3600) {
return `${Math.floor(seconds / 60)}m ago`;
}
  if (seconds < 86400) {
return `${Math.floor(seconds / 3600)}h ago`;
}
  return `${Math.floor(seconds / 86400)}d ago`;
}

export default function LeadStateTimeline({
  tenantId,
  leadId,
  currentState,
  transitions = [],
  onTransition,
  onPredict,
}: LeadStateTimelineProps) {
  const [expandedTransition, setExpandedTransition] = useState<string | null>(null);
  const [showPrediction, setShowPrediction] = useState(false);

  const stateConfig = currentState
    ? STATE_CONFIG[currentState.current_state] || STATE_CONFIG.new
    : STATE_CONFIG.new;

  return (
    <div className="bg-bg-card rounded-xl border border-border-default p-6">
      {/* Current State Header */}
      {currentState && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: `${stateConfig.color}20` }}
              >
                <div style={{ color: stateConfig.color }}>{stateConfig.icon}</div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-text-primary">
                  {stateConfig.label}
                </h3>
                <p className="text-sm text-text-secondary">
                  In state for {formatDuration(currentState.time_in_state_seconds)}
                </p>
              </div>
            </div>

            {/* Engagement Badge */}
            {currentState.engagement_level && (
              <div
                className="px-3 py-1 rounded-full text-sm font-medium"
                style={{
                  backgroundColor: `${ENGAGEMENT_COLORS[currentState.engagement_level]}20`,
                  color: ENGAGEMENT_COLORS[currentState.engagement_level],
                }}
              >
                {currentState.engagement_level.replace("_", " ").toUpperCase()}
              </div>
            )}
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-4 gap-4 p-4 bg-bg-surface rounded-lg">
            <div>
              <p className="text-xs text-text-tertiary">Probability</p>
              <p className="text-lg font-semibold text-text-primary">
                {currentState.probability
                  ? `${(currentState.probability * 100).toFixed(0)}%`
                  : "—"}
              </p>
            </div>
            <div>
              <p className="text-xs text-text-tertiary">Est. Value</p>
              <p className="text-lg font-semibold text-text-primary">
                {currentState.estimated_value
                  ? `${currentState.currency}${currentState.estimated_value.toLocaleString()}`
                  : "—"}
              </p>
            </div>
            <div>
              <p className="text-xs text-text-tertiary">Activities</p>
              <p className="text-lg font-semibold text-text-primary">
                {currentState.activity_count}
              </p>
            </div>
            <div>
              <p className="text-xs text-text-tertiary">Weighted Value</p>
              <p className="text-lg font-semibold text-accent-500">
                {currentState.estimated_value && currentState.probability
                  ? `${currentState.currency}${Math.round(currentState.estimated_value * currentState.probability).toLocaleString()}`
                  : "—"}
              </p>
            </div>
          </div>

          {/* AI Prediction Section */}
          {currentState.predicted_next_state && (
            <motion.div
              className="mt-4 p-4 rounded-lg border border-accent-500/30 bg-accent-500/5"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <button
                onClick={() => setShowPrediction(!showPrediction)}
                className="w-full flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <Brain className="w-5 h-5 text-accent-500" />
                  <span className="font-medium text-text-primary">
                    AI Prediction: Move to{" "}
                    <span className="text-accent-500">
                      {STATE_CONFIG[currentState.predicted_next_state]?.label ||
                        currentState.predicted_next_state}
                    </span>
                  </span>
                  <span className="text-sm text-text-secondary">
                    ({((currentState.prediction_confidence || 0) * 100).toFixed(0)}%
                    confidence)
                  </span>
                </div>
                {showPrediction ? (
                  <ChevronUp className="w-4 h-4 text-text-secondary" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-text-secondary" />
                )}
              </button>

              <AnimatePresence>
                {showPrediction && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-4 space-y-3">
                      {currentState.next_best_action && (
                        <div>
                          <p className="text-xs text-text-tertiary mb-1">
                            Next Best Action
                          </p>
                          <p className="text-sm text-text-primary">
                            {currentState.next_best_action}
                          </p>
                        </div>
                      )}
                      {currentState.ai_reasoning && (
                        <div>
                          <p className="text-xs text-text-tertiary mb-1">
                            AI Reasoning
                          </p>
                          <p className="text-sm text-text-secondary">
                            {currentState.ai_reasoning}
                          </p>
                        </div>
                      )}
                      {onTransition && (
                        <button
                          onClick={() =>
                            onTransition(
                              currentState.predicted_next_state!,
                              "AI Prediction accepted"
                            )
                          }
                          className="px-4 py-2 bg-accent-500 text-white rounded-lg hover:bg-accent-600 transition-colors text-sm font-medium"
                        >
                          Apply Transition
                        </button>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {/* Predict Button */}
          {onPredict && !currentState.predicted_next_state && (
            <button
              onClick={onPredict}
              className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2 border border-accent-500 text-accent-500 rounded-lg hover:bg-accent-500/10 transition-colors text-sm font-medium"
            >
              <Brain className="w-4 h-4" />
              Generate AI Prediction
            </button>
          )}
        </div>
      )}

      {/* Transition Timeline */}
      <div className="space-y-1">
        <h4 className="text-sm font-medium text-text-secondary mb-4">
          State History
        </h4>

        {transitions.length === 0 ? (
          <p className="text-sm text-text-tertiary py-4 text-center">
            No transitions yet
          </p>
        ) : (
          <div className="relative">
            {/* Timeline Line */}
            <div className="absolute left-5 top-0 bottom-0 w-px bg-border-default" />

            {transitions.map((transition, index) => {
              const toConfig =
                STATE_CONFIG[transition.to_state] || STATE_CONFIG.new;
              const fromConfig = transition.from_state
                ? STATE_CONFIG[transition.from_state] || STATE_CONFIG.new
                : null;
              const isExpanded = expandedTransition === transition.id;

              return (
                <motion.div
                  key={transition.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="relative pl-12 pb-4"
                >
                  {/* Timeline Node */}
                  <div
                    className="absolute left-3 w-5 h-5 rounded-full border-2 border-bg-card flex items-center justify-center"
                    style={{ backgroundColor: toConfig.color }}
                  >
                    <div className="w-2 h-2 rounded-full bg-white" />
                  </div>

                  {/* Transition Card */}
                  <div
                    className={`p-3 rounded-lg border transition-all cursor-pointer ${
                      isExpanded
                        ? "bg-bg-surface border-accent-500/30"
                        : "bg-bg-surface/50 border-transparent hover:border-border-default"
                    }`}
                    onClick={() =>
                      setExpandedTransition(isExpanded ? null : transition.id)
                    }
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {fromConfig && (
                          <>
                            <span
                              className="text-sm font-medium"
                              style={{ color: fromConfig.color }}
                            >
                              {fromConfig.label}
                            </span>
                            <ArrowRight className="w-4 h-4 text-text-tertiary" />
                          </>
                        )}
                        <span
                          className="text-sm font-medium"
                          style={{ color: toConfig.color }}
                        >
                          {toConfig.label}
                        </span>
                      </div>
                      <span className="text-xs text-text-tertiary">
                        {formatTimeAgo(transition.created_at)}
                      </span>
                    </div>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="mt-3 pt-3 border-t border-border-default space-y-2">
                            {transition.reason && (
                              <div>
                                <p className="text-xs text-text-tertiary">
                                  Reason
                                </p>
                                <p className="text-sm text-text-primary">
                                  {transition.reason}
                                </p>
                              </div>
                            )}
                            <div className="flex gap-4">
                              <div>
                                <p className="text-xs text-text-tertiary">Type</p>
                                <p className="text-sm text-text-primary capitalize">
                                  {transition.transition_type.replace("_", " ")}
                                </p>
                              </div>
                              {transition.confidence > 0 && (
                                <div>
                                  <p className="text-xs text-text-tertiary">
                                    Confidence
                                  </p>
                                  <p className="text-sm text-text-primary">
                                    {(transition.confidence * 100).toFixed(0)}%
                                  </p>
                                </div>
                              )}
                              {transition.duration_in_previous_state_seconds && (
                                <div>
                                  <p className="text-xs text-text-tertiary">
                                    Time in Previous
                                  </p>
                                  <p className="text-sm text-text-primary">
                                    {formatDuration(
                                      transition.duration_in_previous_state_seconds
                                    )}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
