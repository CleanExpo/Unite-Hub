"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  MessageSquare,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Zap,
  Target,
  ThumbsUp,
  ThumbsDown,
  RefreshCw,
  Loader2,
  ChevronDown,
  ChevronRight,
  Send,
  Bell,
  ShieldAlert,
  Heart,
  DollarSign,
} from "lucide-react";

// =====================================================
// Types
// =====================================================

interface ContactIntent {
  id: string;
  intent: string;
  intent_category: string;
  intent_strength: string;
  sentiment?: string;
  sentiment_score?: number;
  confidence: number;
  source: string;
  raw_text?: string;
  key_phrases: string[];
  urgency_level: string;
  requires_response: boolean;
  is_resolved: boolean;
  suggested_actions: Array<{
    action: string;
    priority: string;
    reason: string;
  }>;
  analyzed_at: string;
}

interface IntentSignal {
  id: string;
  signal_type: string;
  signal_strength: number;
  evidence: Array<{
    type: string;
    description: string;
    weight: number;
  }>;
  is_active: boolean;
  detected_at: string;
}

interface SentimentSummary {
  total_intents: number;
  avg_sentiment: number;
  dominant_sentiment: string;
  top_intent: string;
  recent_trend: string;
}

interface IntentStats {
  total_intents: number;
  unresolved_intents: number;
  avg_sentiment_score: number;
  intent_distribution: Record<string, number>;
  sentiment_distribution: Record<string, number>;
  active_signals: number;
}

interface ContactIntentPanelProps {
  contactId: string;
  tenantId: string;
  onIntentAnalyzed?: (intent: ContactIntent) => void;
}

// =====================================================
// Component
// =====================================================

export default function ContactIntentPanel({
  contactId,
  tenantId,
  onIntentAnalyzed,
}: ContactIntentPanelProps) {
  const [intents, setIntents] = useState<ContactIntent[]>([]);
  const [signals, setSignals] = useState<IntentSignal[]>([]);
  const [summary, setSummary] = useState<SentimentSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Analysis state
  const [analyzeText, setAnalyzeText] = useState("");
  const [analyzeSource, setAnalyzeSource] = useState<string>("email");
  const [analyzing, setAnalyzing] = useState(false);

  // Expanded items
  const [expandedIntent, setExpandedIntent] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch intents for contact
      const intentsRes = await fetch(
        `/api/synthex/contacts/intent?tenantId=${tenantId}&type=intents&contact_id=${contactId}&limit=10`
      );
      const intentsData = await intentsRes.json();
      if (intentsData.success) {
setIntents(intentsData.intents);
}

      // Fetch active signals
      const signalsRes = await fetch(
        `/api/synthex/contacts/intent?tenantId=${tenantId}&type=signals&contact_id=${contactId}&is_active=true`
      );
      const signalsData = await signalsRes.json();
      if (signalsData.success) {
setSignals(signalsData.signals);
}

      // Fetch sentiment summary
      const summaryRes = await fetch(
        `/api/synthex/contacts/intent?tenantId=${tenantId}&type=sentiment_summary&contact_id=${contactId}`
      );
      const summaryData = await summaryRes.json();
      if (summaryData.success) {
setSummary(summaryData.summary);
}
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch data");
    } finally {
      setLoading(false);
    }
  }, [contactId, tenantId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const analyzeNewText = async () => {
    if (!analyzeText.trim()) {
return;
}
    setAnalyzing(true);
    try {
      const res = await fetch("/api/synthex/contacts/intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantId,
          action: "analyze",
          contact_id: contactId,
          text: analyzeText,
          source: analyzeSource,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setAnalyzeText("");
        fetchData();
        if (onIntentAnalyzed && data.intent) {
          onIntentAnalyzed(data.intent);
        }
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analysis failed");
    } finally {
      setAnalyzing(false);
    }
  };

  const resolveIntent = async (intentId: string) => {
    try {
      await fetch("/api/synthex/contacts/intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantId,
          action: "resolve_intent",
          intent_id: intentId,
        }),
      });
      fetchData();
    } catch (err) {
      console.error("Failed to resolve intent:", err);
    }
  };

  const dismissSignal = async (signalId: string) => {
    try {
      await fetch("/api/synthex/contacts/intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantId,
          action: "dismiss_signal",
          signal_id: signalId,
        }),
      });
      fetchData();
    } catch (err) {
      console.error("Failed to dismiss signal:", err);
    }
  };

  const getSentimentColor = (sentiment?: string) => {
    switch (sentiment) {
      case "very_positive":
        return "text-green-400";
      case "positive":
        return "text-green-300";
      case "neutral":
        return "text-zinc-400";
      case "negative":
        return "text-orange-400";
      case "very_negative":
        return "text-red-400";
      default:
        return "text-zinc-400";
    }
  };

  const getSentimentIcon = (sentiment?: string) => {
    switch (sentiment) {
      case "very_positive":
      case "positive":
        return <ThumbsUp className="w-4 h-4" />;
      case "negative":
      case "very_negative":
        return <ThumbsDown className="w-4 h-4" />;
      default:
        return <Minus className="w-4 h-4" />;
    }
  };

  const getIntentCategoryColor = (category: string) => {
    switch (category) {
      case "transactional":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "support":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "feedback":
        return "bg-purple-500/20 text-purple-400 border-purple-500/30";
      case "informational":
        return "bg-cyan-500/20 text-cyan-400 border-cyan-500/30";
      case "engagement":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      default:
        return "bg-zinc-500/20 text-zinc-400 border-zinc-500/30";
    }
  };

  const getUrgencyColor = (level: string) => {
    switch (level) {
      case "critical":
        return "bg-red-500 text-white";
      case "high":
        return "bg-orange-500 text-white";
      case "medium":
        return "bg-yellow-500 text-black";
      default:
        return "bg-zinc-600 text-white";
    }
  };

  const getSignalIcon = (type: string) => {
    switch (type) {
      case "buying_signal":
        return <DollarSign className="w-4 h-4" />;
      case "churn_risk":
        return <ShieldAlert className="w-4 h-4" />;
      case "support_escalation":
        return <AlertTriangle className="w-4 h-4" />;
      case "advocacy_potential":
        return <Heart className="w-4 h-4" />;
      default:
        return <Bell className="w-4 h-4" />;
    }
  };

  const getSignalColor = (type: string) => {
    switch (type) {
      case "buying_signal":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "churn_risk":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      case "support_escalation":
        return "bg-orange-500/20 text-orange-400 border-orange-500/30";
      case "advocacy_potential":
        return "bg-pink-500/20 text-pink-400 border-pink-500/30";
      default:
        return "bg-zinc-500/20 text-zinc-400 border-zinc-500/30";
    }
  };

  const getTrendIcon = (trend?: string) => {
    switch (trend) {
      case "improving":
        return <TrendingUp className="w-4 h-4 text-green-400" />;
      case "declining":
        return <TrendingDown className="w-4 h-4 text-red-400" />;
      default:
        return <Minus className="w-4 h-4 text-zinc-400" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-accent-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Sentiment Summary */}
      {summary && (
        <div className="p-4 bg-zinc-900/50 rounded-xl border border-zinc-800">
          <h3 className="text-sm font-medium text-zinc-400 mb-3 flex items-center gap-2">
            <Target className="w-4 h-4" />
            Sentiment Overview
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-2xl font-bold">
                {summary.total_intents}
              </div>
              <div className="text-xs text-zinc-500">Total Intents</div>
            </div>
            <div>
              <div className={`text-2xl font-bold ${getSentimentColor(summary.dominant_sentiment)}`}>
                {summary.avg_sentiment?.toFixed(2) || "N/A"}
              </div>
              <div className="text-xs text-zinc-500">Avg Sentiment</div>
            </div>
            <div>
              <div className="text-lg font-medium capitalize">
                {summary.top_intent || "N/A"}
              </div>
              <div className="text-xs text-zinc-500">Top Intent</div>
            </div>
            <div className="flex items-center gap-2">
              {getTrendIcon(summary.recent_trend)}
              <div>
                <div className="text-sm font-medium capitalize">
                  {summary.recent_trend || "N/A"}
                </div>
                <div className="text-xs text-zinc-500">Trend</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Active Signals */}
      {signals.length > 0 && (
        <div className="p-4 bg-zinc-900/50 rounded-xl border border-zinc-800">
          <h3 className="text-sm font-medium text-zinc-400 mb-3 flex items-center gap-2">
            <Zap className="w-4 h-4" />
            Active Signals
          </h3>
          <div className="space-y-2">
            {signals.map((signal) => (
              <div
                key={signal.id}
                className={`flex items-center justify-between p-3 rounded-lg border ${getSignalColor(
                  signal.signal_type
                )}`}
              >
                <div className="flex items-center gap-3">
                  {getSignalIcon(signal.signal_type)}
                  <div>
                    <div className="font-medium capitalize">
                      {signal.signal_type.replace(/_/g, " ")}
                    </div>
                    <div className="text-xs opacity-70">
                      Strength: {(signal.signal_strength * 100).toFixed(0)}%
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => dismissSignal(signal.id)}
                  className="p-1 hover:bg-white/10 rounded"
                  title="Dismiss signal"
                >
                  <XCircle className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Analyze New Text */}
      <div className="p-4 bg-zinc-900/50 rounded-xl border border-zinc-800">
        <h3 className="text-sm font-medium text-zinc-400 mb-3 flex items-center gap-2">
          <MessageSquare className="w-4 h-4" />
          Analyze Communication
        </h3>
        <div className="space-y-3">
          <textarea
            value={analyzeText}
            onChange={(e) => setAnalyzeText(e.target.value)}
            placeholder="Paste email, chat message, or other communication to analyze..."
            className="w-full p-3 bg-zinc-800 rounded-lg border border-zinc-700 focus:border-accent-500 focus:outline-none resize-none text-sm"
            rows={3}
          />
          <div className="flex items-center gap-3">
            <select
              value={analyzeSource}
              onChange={(e) => setAnalyzeSource(e.target.value)}
              className="px-3 py-2 bg-zinc-800 rounded-lg border border-zinc-700 text-sm"
            >
              <option value="email">Email</option>
              <option value="chat">Chat</option>
              <option value="call_transcript">Call Transcript</option>
              <option value="form_submission">Form Submission</option>
              <option value="social_media">Social Media</option>
              <option value="support_ticket">Support Ticket</option>
            </select>
            <button
              onClick={analyzeNewText}
              disabled={analyzing || !analyzeText.trim()}
              className="px-4 py-2 bg-accent-500 hover:bg-accent-600 disabled:bg-zinc-700 disabled:cursor-not-allowed rounded-lg text-sm font-medium flex items-center gap-2"
            >
              {analyzing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              Analyze
            </button>
          </div>
        </div>
      </div>

      {/* Intent History */}
      <div className="p-4 bg-zinc-900/50 rounded-xl border border-zinc-800">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-zinc-400 flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Intent History
          </h3>
          <button
            onClick={fetchData}
            className="p-1 hover:bg-zinc-700 rounded"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
        <div className="space-y-2">
          {intents.map((intent) => (
            <div
              key={intent.id}
              className="bg-zinc-800 rounded-lg border border-zinc-700 overflow-hidden"
            >
              <button
                onClick={() =>
                  setExpandedIntent(expandedIntent === intent.id ? null : intent.id)
                }
                className="w-full p-3 flex items-center justify-between text-left hover:bg-zinc-700/50"
              >
                <div className="flex items-center gap-3">
                  {expandedIntent === intent.id ? (
                    <ChevronDown className="w-4 h-4 text-zinc-400" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-zinc-400" />
                  )}
                  <div className={`${getSentimentColor(intent.sentiment)}`}>
                    {getSentimentIcon(intent.sentiment)}
                  </div>
                  <div>
                    <div className="font-medium capitalize">{intent.intent}</div>
                    <div className="text-xs text-zinc-500">
                      {new Date(intent.analyzed_at).toLocaleString()}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 text-xs rounded border ${getIntentCategoryColor(
                      intent.intent_category
                    )}`}
                  >
                    {intent.intent_category}
                  </span>
                  {intent.requires_response && !intent.is_resolved && (
                    <span
                      className={`px-2 py-0.5 text-xs rounded ${getUrgencyColor(
                        intent.urgency_level
                      )}`}
                    >
                      {intent.urgency_level}
                    </span>
                  )}
                  {intent.is_resolved ? (
                    <CheckCircle className="w-4 h-4 text-green-400" />
                  ) : intent.requires_response ? (
                    <AlertTriangle className="w-4 h-4 text-yellow-400" />
                  ) : null}
                </div>
              </button>
              {expandedIntent === intent.id && (
                <div className="p-3 border-t border-zinc-700 bg-zinc-800/50 space-y-3">
                  {/* Sentiment Score */}
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-zinc-500">Sentiment Score:</span>
                    <span className={getSentimentColor(intent.sentiment)}>
                      {intent.sentiment_score?.toFixed(2) || "N/A"}
                    </span>
                    <span className="text-zinc-500">Confidence:</span>
                    <span>{(intent.confidence * 100).toFixed(0)}%</span>
                    <span className="text-zinc-500">Source:</span>
                    <span className="capitalize">{intent.source}</span>
                  </div>

                  {/* Key Phrases */}
                  {intent.key_phrases.length > 0 && (
                    <div>
                      <div className="text-xs text-zinc-500 mb-1">Key Phrases:</div>
                      <div className="flex flex-wrap gap-1">
                        {intent.key_phrases.map((phrase, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 text-xs bg-zinc-700 rounded"
                          >
                            {phrase}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Raw Text */}
                  {intent.raw_text && (
                    <div>
                      <div className="text-xs text-zinc-500 mb-1">Original Text:</div>
                      <div className="text-sm text-zinc-300 bg-zinc-900 p-2 rounded max-h-24 overflow-y-auto">
                        {intent.raw_text}
                      </div>
                    </div>
                  )}

                  {/* Suggested Actions */}
                  {intent.suggested_actions.length > 0 && (
                    <div>
                      <div className="text-xs text-zinc-500 mb-1">
                        Suggested Actions:
                      </div>
                      <div className="space-y-1">
                        {intent.suggested_actions.map((action, idx) => (
                          <div
                            key={idx}
                            className="flex items-center gap-2 text-sm"
                          >
                            <span
                              className={`w-2 h-2 rounded-full ${
                                action.priority === "high"
                                  ? "bg-red-400"
                                  : action.priority === "medium"
                                    ? "bg-yellow-400"
                                    : "bg-green-400"
                              }`}
                            />
                            <span>{action.action}</span>
                            <span className="text-xs text-zinc-500">
                              ({action.reason})
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  {!intent.is_resolved && intent.requires_response && (
                    <div className="pt-2 border-t border-zinc-700">
                      <button
                        onClick={() => resolveIntent(intent.id)}
                        className="px-3 py-1.5 text-xs bg-green-500/20 text-green-400 hover:bg-green-500/30 rounded flex items-center gap-1"
                      >
                        <CheckCircle className="w-3 h-3" />
                        Mark Resolved
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
          {intents.length === 0 && (
            <p className="text-zinc-500 text-sm text-center py-4">
              No intents analyzed yet for this contact.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
