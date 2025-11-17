"use client";

import React, { useState } from "react";
import {
  Sparkles,
  Brain,
  MessageSquare,
  Users,
  MapPin,
  Package,
  TrendingUp,
  CheckSquare,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
} from "lucide-react";

interface AIAnalysis {
  summary: string;
  key_points: string[];
  entities: {
    people: string[];
    organizations: string[];
    locations: string[];
    products: string[];
  };
  sentiment: {
    overall: "positive" | "neutral" | "negative";
    explanation: string;
  };
  topics: string[];
  action_items: string[];
  insights: string[];
}

interface AIInsightsPanelProps {
  analysis: AIAnalysis | null;
  loading?: boolean;
  modelUsed?: string;
  analyzedAt?: string;
}

export function AIInsightsPanel({
  analysis,
  loading = false,
  modelUsed,
  analyzedAt,
}: AIInsightsPanelProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(["summary", "key_points", "action_items"])
  );
  const [copied, setCopied] = useState(false);

  // Toggle section expansion
  const toggleSection = (section: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
  };

  // Copy to clipboard
  const copyToClipboard = () => {
    if (!analysis) return;

    const text = `
# AI Analysis

## Summary
${analysis.summary}

## Key Points
${analysis.key_points.map((p) => `- ${p}`).join("\n")}

## Sentiment
${analysis.sentiment.overall.toUpperCase()}: ${analysis.sentiment.explanation}

## Topics
${analysis.topics.join(", ")}

## Action Items
${analysis.action_items.map((item) => `- [ ] ${item}`).join("\n")}

## Entities
**People:** ${analysis.entities.people.join(", ") || "None"}
**Organizations:** ${analysis.entities.organizations.join(", ") || "None"}
**Locations:** ${analysis.entities.locations.join(", ") || "None"}
**Products:** ${analysis.entities.products.join(", ") || "None"}

## Insights
${analysis.insights.map((i) => `- ${i}`).join("\n")}
    `.trim();

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Get sentiment color
  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case "positive":
        return "text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900";
      case "negative":
        return "text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900";
      default:
        return "text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-900";
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center gap-3 mb-4">
          <Brain className="h-5 w-5 text-blue-500 animate-pulse" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            AI Analysis
          </h2>
        </div>
        <div className="space-y-3">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 animate-pulse" />
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6 animate-pulse" />
        </div>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center gap-3 mb-4">
          <Brain className="h-5 w-5 text-gray-400" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            AI Analysis
          </h2>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          No analysis available yet. Analysis will appear after processing completes.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Sparkles className="h-5 w-5 text-blue-500" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              AI Insights
            </h2>
          </div>
          <button
            onClick={copyToClipboard}
            className="p-2 hover:bg-white/50 dark:hover:bg-gray-800/50 rounded transition-colors"
            title="Copy to clipboard"
          >
            {copied ? (
              <Check className="h-4 w-4 text-green-500" />
            ) : (
              <Copy className="h-4 w-4 text-gray-500" />
            )}
          </button>
        </div>
        {modelUsed && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Analyzed by {modelUsed}
            {analyzedAt && ` on ${new Date(analyzedAt).toLocaleDateString()}`}
          </p>
        )}
      </div>

      {/* Content */}
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {/* Summary */}
        <Section
          icon={<MessageSquare className="h-4 w-4" />}
          title="Summary"
          isExpanded={expandedSections.has("summary")}
          onToggle={() => toggleSection("summary")}
        >
          <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
            {analysis.summary}
          </p>
        </Section>

        {/* Sentiment */}
        <Section
          icon={<TrendingUp className="h-4 w-4" />}
          title="Sentiment"
          isExpanded={expandedSections.has("sentiment")}
          onToggle={() => toggleSection("sentiment")}
        >
          <div className="space-y-2">
            <span
              className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getSentimentColor(
                analysis.sentiment.overall
              )}`}
            >
              {analysis.sentiment.overall.charAt(0).toUpperCase() +
                analysis.sentiment.overall.slice(1)}
            </span>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              {analysis.sentiment.explanation}
            </p>
          </div>
        </Section>

        {/* Key Points */}
        <Section
          icon={<CheckSquare className="h-4 w-4" />}
          title="Key Points"
          badge={analysis.key_points.length}
          isExpanded={expandedSections.has("key_points")}
          onToggle={() => toggleSection("key_points")}
        >
          <ul className="space-y-2">
            {analysis.key_points.map((point, index) => (
              <li
                key={index}
                className="flex gap-2 text-sm text-gray-700 dark:text-gray-300"
              >
                <span className="text-blue-500 font-medium">•</span>
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </Section>

        {/* Topics */}
        <Section
          icon={<Brain className="h-4 w-4" />}
          title="Topics"
          badge={analysis.topics.length}
          isExpanded={expandedSections.has("topics")}
          onToggle={() => toggleSection("topics")}
        >
          <div className="flex flex-wrap gap-2">
            {analysis.topics.map((topic, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm"
              >
                {topic}
              </span>
            ))}
          </div>
        </Section>

        {/* Action Items */}
        {analysis.action_items.length > 0 && (
          <Section
            icon={<CheckSquare className="h-4 w-4" />}
            title="Action Items"
            badge={analysis.action_items.length}
            isExpanded={expandedSections.has("action_items")}
            onToggle={() => toggleSection("action_items")}
          >
            <ul className="space-y-2">
              {analysis.action_items.map((item, index) => (
                <li
                  key={index}
                  className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300"
                >
                  <input
                    type="checkbox"
                    className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </Section>
        )}

        {/* Entities */}
        <Section
          icon={<Users className="h-4 w-4" />}
          title="Entities"
          isExpanded={expandedSections.has("entities")}
          onToggle={() => toggleSection("entities")}
        >
          <div className="space-y-3">
            {analysis.entities.people.length > 0 && (
              <EntityGroup icon={<Users />} label="People" items={analysis.entities.people} />
            )}
            {analysis.entities.organizations.length > 0 && (
              <EntityGroup
                icon={<Package />}
                label="Organizations"
                items={analysis.entities.organizations}
              />
            )}
            {analysis.entities.locations.length > 0 && (
              <EntityGroup
                icon={<MapPin />}
                label="Locations"
                items={analysis.entities.locations}
              />
            )}
            {analysis.entities.products.length > 0 && (
              <EntityGroup
                icon={<Package />}
                label="Products"
                items={analysis.entities.products}
              />
            )}
          </div>
        </Section>

        {/* Insights */}
        {analysis.insights.length > 0 && (
          <Section
            icon={<Sparkles className="h-4 w-4" />}
            title="Insights"
            badge={analysis.insights.length}
            isExpanded={expandedSections.has("insights")}
            onToggle={() => toggleSection("insights")}
          >
            <ul className="space-y-2">
              {analysis.insights.map((insight, index) => (
                <li
                  key={index}
                  className="flex gap-2 text-sm text-gray-700 dark:text-gray-300"
                >
                  <Sparkles className="h-4 w-4 text-purple-500 flex-shrink-0 mt-0.5" />
                  <span>{insight}</span>
                </li>
              ))}
            </ul>
          </Section>
        )}
      </div>
    </div>
  );
}

// Collapsible Section Component
function Section({
  icon,
  title,
  badge,
  isExpanded,
  onToggle,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  badge?: number;
  isExpanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div>
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-gray-500 dark:text-gray-400">{icon}</span>
          <span className="font-medium text-gray-900 dark:text-gray-100">{title}</span>
          {badge !== undefined && (
            <span className="px-2 py-0.5 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-xs">
              {badge}
            </span>
          )}
        </div>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4 text-gray-400" />
        ) : (
          <ChevronDown className="h-4 w-4 text-gray-400" />
        )}
      </button>
      {isExpanded && <div className="px-4 pb-4">{children}</div>}
    </div>
  );
}

// Entity Group Component
function EntityGroup({
  icon,
  label,
  items,
}: {
  icon: React.ReactNode;
  label: string;
  items: string[];
}) {
  return (
    <div>
      <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-2">
        <span className="h-3 w-3">{icon}</span>
        <span className="font-medium">{label}</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {items.map((item, index) => (
          <span
            key={index}
            className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-sm"
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
