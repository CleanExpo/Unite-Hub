"use client";

/**
 * Enhancements Dashboard
 * Phase 36: MVP Client Truth Layer
 *
 * AI-powered suggestions - proposals only, not auto-execution
 */

import { useState } from "react";
import { Lightbulb, RefreshCw, Send, AlertTriangle } from "lucide-react";
import AIModelBadge from "@/components/ui/visual/AIModelBadge";
import type { AIModel } from "@/components/ui/visual/AIModelBadge";

interface Suggestion {
  id: string;
  title: string;
  description: string;
  impact: string;
  source: string;
  model_used: string;
}

const IMPACT_STYLES: Record<string, { label: string; className: string }> = {
  low_effort_high_impact: {
    label: "Low effort / High impact",
    className: "text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400",
  },
  medium_effort_medium_impact: {
    label: "Medium effort / Medium impact",
    className: "text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20 dark:text-yellow-400",
  },
  high_effort_high_impact: {
    label: "High effort / High impact",
    className: "text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400",
  },
};

export default function EnhancementsPage() {
  const [scanning, setScanning] = useState(false);
  const [lastScanned, setLastScanned] = useState<string | null>(null);

  // Mock suggestions
  const [suggestions] = useState<Suggestion[]>([
    {
      id: "1",
      title: "Add schema markup to service pages",
      description: "Technical audit detected missing LocalBusiness schema on service pages. This may improve local search visibility.",
      impact: "low_effort_high_impact",
      source: "website_audits",
      model_used: "openai",
    },
    {
      id: "2",
      title: "Create FAQ content for top keywords",
      description: "Keyword analysis shows opportunity for FAQ-style content targeting common questions in your industry.",
      impact: "medium_effort_medium_impact",
      source: "usage_metrics",
      model_used: "gemini",
    },
  ]);

  const handleScan = async () => {
    setScanning(true);
    await new Promise((r) => setTimeout(r, 2000));
    setLastScanned(new Date().toISOString());
    setScanning(false);
  };

  const handleRequestImplementation = (id: string) => {
    // Would create approval request
    alert(`Implementation request created for suggestion ${id}. Check your Approvals inbox.`);
  };

  return (
    <div className="min-h-screen bg-bg-raised">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <Lightbulb className="w-8 h-8 text-teal-600" />
              <h1 className="text-2xl font-bold text-text-primary">
                Enhancement Suggestions
              </h1>
            </div>
            <button
              onClick={handleScan}
              disabled={scanning}
              className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${scanning ? "animate-spin" : ""}`} />
              {scanning ? "Scanning..." : "Run Scan"}
            </button>
          </div>
          <p className="text-text-secondary">
            AI-powered suggestions based on your audits and activity
          </p>
          {lastScanned && (
            <p className="text-xs text-gray-400 mt-1">
              Last scanned: {new Date(lastScanned).toLocaleString()}
            </p>
          )}
        </div>

        {/* Disclaimer */}
        <div className="mb-6 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                These are <strong>suggestions only</strong>, not guaranteed results. You control what gets implemented. Nothing changes without your approval.
              </p>
            </div>
          </div>
        </div>

        {/* Suggestions */}
        <div className="space-y-4">
          {suggestions.map((suggestion) => {
            const impactStyle = IMPACT_STYLES[suggestion.impact] || IMPACT_STYLES.medium_effort_medium_impact;

            return (
              <div
                key={suggestion.id}
                className="bg-bg-card rounded-lg border border-border-subtle p-4"
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-medium text-text-primary">
                    {suggestion.title}
                  </h3>
                  <AIModelBadge model={suggestion.model_used as AIModel} />
                </div>

                <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                  {suggestion.description}
                </p>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-1 rounded ${impactStyle.className}`}>
                      {impactStyle.label}
                    </span>
                    <span className="text-xs text-gray-400">
                      Source: {suggestion.source}
                    </span>
                  </div>

                  <button
                    onClick={() => handleRequestImplementation(suggestion.id)}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-900/20 rounded-lg"
                  >
                    <Send className="w-3 h-3" />
                    Request Implementation
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {suggestions.length === 0 && (
          <div className="text-center py-12 bg-bg-card rounded-lg border border-border-subtle">
            <Lightbulb className="w-12 h-12 text-text-muted mx-auto mb-4" />
            <p className="text-text-secondary">
              No suggestions yet. Click &quot;Run Scan&quot; to analyze your data.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
