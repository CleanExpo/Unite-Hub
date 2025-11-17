"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Lightbulb,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Sparkles,
  TrendingUp,
  Code,
  MessageSquare,
} from "lucide-react";

// =====================================================
// TYPES
// =====================================================

interface AISuggestion {
  id: string;
  suggestion_type: string;
  suggestion_text: string;
  reasoning: string;
  confidence_score: number;
  node_id?: string;
  status: string;
  created_at: string;
}

interface AISuggestionsPanelProps {
  suggestions: AISuggestion[];
  onAccept: (suggestionId: string) => Promise<void>;
  onDismiss: (suggestionId: string) => Promise<void>;
  onApply?: (suggestionId: string) => Promise<void>;
  isLoading?: boolean;
}

// =====================================================
// SUGGESTION TYPE ICONS & COLORS
// =====================================================

const SUGGESTION_CONFIG: Record<
  string,
  { icon: React.ElementType; color: string; label: string }
> = {
  add_feature: {
    icon: Sparkles,
    color: "text-purple-600",
    label: "Add Feature",
  },
  clarify_requirement: {
    icon: MessageSquare,
    color: "text-blue-600",
    label: "Clarify",
  },
  identify_dependency: {
    icon: TrendingUp,
    color: "text-green-600",
    label: "Dependency",
  },
  suggest_technology: {
    icon: Code,
    color: "text-indigo-600",
    label: "Technology",
  },
  warn_complexity: {
    icon: AlertTriangle,
    color: "text-yellow-600",
    label: "Warning",
  },
  estimate_cost: {
    icon: TrendingUp,
    color: "text-emerald-600",
    label: "Estimate",
  },
  propose_alternative: {
    icon: Lightbulb,
    color: "text-amber-600",
    label: "Alternative",
  },
};

// =====================================================
// CONFIDENCE BADGE
// =====================================================

function ConfidenceBadge({ score }: { score: number }) {
  const percentage = Math.round(score * 100);
  const variant =
    percentage >= 80
      ? "default"
      : percentage >= 60
        ? "secondary"
        : "outline";

  return (
    <Badge variant={variant} className="text-xs">
      {percentage}% confidence
    </Badge>
  );
}

// =====================================================
// SINGLE SUGGESTION CARD
// =====================================================

function SuggestionCard({
  suggestion,
  onAccept,
  onDismiss,
  onApply,
  isLoading,
}: {
  suggestion: AISuggestion;
  onAccept: (id: string) => Promise<void>;
  onDismiss: (id: string) => Promise<void>;
  onApply?: (id: string) => Promise<void>;
  isLoading?: boolean;
}) {
  const config =
    SUGGESTION_CONFIG[suggestion.suggestion_type] ||
    SUGGESTION_CONFIG.add_feature;
  const Icon = config.icon;

  const [isProcessing, setIsProcessing] = React.useState(false);

  const handleAccept = async () => {
    setIsProcessing(true);
    try {
      await onAccept(suggestion.id);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDismiss = async () => {
    setIsProcessing(true);
    try {
      await onDismiss(suggestion.id);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleApply = async () => {
    if (!onApply) return;
    setIsProcessing(true);
    try {
      await onApply(suggestion.id);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Icon className={`w-5 h-5 ${config.color}`} />
            <CardTitle className="text-sm font-semibold">
              {config.label}
            </CardTitle>
          </div>
          <ConfidenceBadge score={suggestion.confidence_score} />
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Suggestion Text */}
        <div className="text-sm text-gray-900 font-medium">
          {suggestion.suggestion_text}
        </div>

        {/* Reasoning */}
        <CardDescription className="text-xs text-gray-600">
          {suggestion.reasoning}
        </CardDescription>

        {/* Actions */}
        <div className="flex items-center gap-2 pt-2">
          {onApply && suggestion.suggestion_type === "add_feature" && (
            <Button
              size="sm"
              onClick={handleApply}
              disabled={isProcessing || isLoading}
              className="flex-1"
            >
              <Sparkles className="w-3 h-3 mr-1" />
              Apply
            </Button>
          )}

          <Button
            size="sm"
            variant="outline"
            onClick={handleAccept}
            disabled={isProcessing || isLoading}
            className={onApply ? "" : "flex-1"}
          >
            <CheckCircle className="w-3 h-3 mr-1" />
            Accept
          </Button>

          <Button
            size="sm"
            variant="ghost"
            onClick={handleDismiss}
            disabled={isProcessing || isLoading}
          >
            <XCircle className="w-3 h-3 mr-1" />
            Dismiss
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// =====================================================
// MAIN PANEL COMPONENT
// =====================================================

export function AISuggestionsPanel({
  suggestions,
  onAccept,
  onDismiss,
  onApply,
  isLoading = false,
}: AISuggestionsPanelProps) {
  // Filter only pending suggestions
  const pendingSuggestions = suggestions.filter((s) => s.status === "pending");

  // Sort by confidence score (highest first)
  const sortedSuggestions = [...pendingSuggestions].sort(
    (a, b) => b.confidence_score - a.confidence_score
  );

  if (sortedSuggestions.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <Lightbulb className="w-12 h-12 mx-auto text-gray-300 mb-3" />
          <p className="text-sm text-gray-500">
            No AI suggestions yet. Add more nodes or trigger AI analysis.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-600" />
          <h3 className="text-lg font-semibold">AI Suggestions</h3>
          <Badge variant="secondary">{sortedSuggestions.length}</Badge>
        </div>
      </div>

      {/* Suggestions List */}
      <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
        {sortedSuggestions.map((suggestion) => (
          <SuggestionCard
            key={suggestion.id}
            suggestion={suggestion}
            onAccept={onAccept}
            onDismiss={onDismiss}
            onApply={onApply}
            isLoading={isLoading}
          />
        ))}
      </div>
    </div>
  );
}
