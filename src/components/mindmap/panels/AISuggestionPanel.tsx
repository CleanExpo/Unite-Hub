"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Sparkles,
  Check,
  X,
  Lightbulb,
  AlertCircle,
  FileText,
  Link,
  Layers,
  DollarSign,
  GitBranch,
  Loader2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AISuggestion {
  id: string;
  suggestion_type: string;
  suggestion_text: string;
  reasoning: string;
  confidence_score: number;
  status: 'pending' | 'accepted' | 'dismissed' | 'applied';
  node_id?: string;
}

interface AISuggestionPanelProps {
  mindmapId: string;
  workspaceId: string;
  onSuggestionAccepted?: (suggestion: AISuggestion) => void;
}

const suggestionTypeIcons = {
  add_feature: Lightbulb,
  clarify_requirement: FileText,
  identify_dependency: Link,
  suggest_technology: Layers,
  warn_complexity: AlertCircle,
  estimate_cost: DollarSign,
  propose_alternative: GitBranch,
};

const suggestionTypeColors = {
  add_feature: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  clarify_requirement: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  identify_dependency: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  suggest_technology: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
  warn_complexity: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  estimate_cost: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  propose_alternative: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
};

export default function AISuggestionPanel({
  mindmapId,
  workspaceId,
  onSuggestionAccepted,
}: AISuggestionPanelProps) {
  const { toast } = useToast();
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);

  // Load suggestions
  const loadSuggestions = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/mindmap/${mindmapId}/suggestions?workspaceId=${workspaceId}`);

      if (!response.ok) {
        throw new Error('Failed to load suggestions');
      }

      const data = await response.json();
      setSuggestions(data.suggestions || []);
    } catch (error) {
      console.error('Error loading suggestions:', error);
      toast({
        title: 'Error',
        description: 'Failed to load AI suggestions',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (mindmapId) {
      loadSuggestions();
    }
  }, [mindmapId]);

  // Request AI analysis
  const handleAnalyze = async () => {
    setAnalyzing(true);
    try {
      const response = await fetch(`/api/mindmap/${mindmapId}/ai-analyze?workspaceId=${workspaceId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          context: 'Full project analysis',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to analyze mindmap');
      }

      const data = await response.json();

      toast({
        title: 'Success',
        description: `Generated ${data.suggestions_count} suggestions`,
      });

      // Reload suggestions
      await loadSuggestions();
    } catch (error) {
      console.error('Error analyzing mindmap:', error);
      toast({
        title: 'Error',
        description: 'Failed to analyze mindmap',
        variant: 'destructive',
      });
    } finally {
      setAnalyzing(false);
    }
  };

  // Accept suggestion
  const handleAccept = async (suggestion: AISuggestion) => {
    try {
      const response = await fetch(
        `/api/mindmap/suggestions/${suggestion.id}?workspaceId=${workspaceId}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'accepted' }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to accept suggestion');
      }

      // Update local state
      setSuggestions((prev) =>
        prev.map((s) =>
          s.id === suggestion.id ? { ...s, status: 'accepted' } : s
        )
      );

      if (onSuggestionAccepted) {
        onSuggestionAccepted(suggestion);
      }

      toast({
        title: 'Success',
        description: 'Suggestion accepted',
      });
    } catch (error) {
      console.error('Error accepting suggestion:', error);
      toast({
        title: 'Error',
        description: 'Failed to accept suggestion',
        variant: 'destructive',
      });
    }
  };

  // Dismiss suggestion
  const handleDismiss = async (suggestion: AISuggestion) => {
    try {
      const response = await fetch(
        `/api/mindmap/suggestions/${suggestion.id}?workspaceId=${workspaceId}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'dismissed' }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to dismiss suggestion');
      }

      // Update local state
      setSuggestions((prev) =>
        prev.map((s) =>
          s.id === suggestion.id ? { ...s, status: 'dismissed' } : s
        )
      );

      toast({
        title: 'Success',
        description: 'Suggestion dismissed',
      });
    } catch (error) {
      console.error('Error dismissing suggestion:', error);
      toast({
        title: 'Error',
        description: 'Failed to dismiss suggestion',
        variant: 'destructive',
      });
    }
  };

  const pendingSuggestions = suggestions.filter((s) => s.status === 'pending');

  return (
    <div className="w-80 h-full bg-bg-card border-l border-border-subtle flex flex-col">
      <div className="p-4 border-b border-border-subtle">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-500" />
            AI Suggestions
          </h2>
          <Badge variant="secondary">{pendingSuggestions.length}</Badge>
        </div>

        <Button
          onClick={handleAnalyze}
          disabled={analyzing}
          className="w-full"
          size="sm"
        >
          {analyzing ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 mr-2" />
              Analyze Project
            </>
          )}
        </Button>
      </div>

      <ScrollArea className="flex-1 p-4">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : pendingSuggestions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-center">
            <Sparkles className="h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
              No suggestions yet
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Click "Analyze Project" to get AI suggestions
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {pendingSuggestions.map((suggestion) => {
              const Icon = suggestionTypeIcons[suggestion.suggestion_type as keyof typeof suggestionTypeIcons] || Lightbulb;
              const colorClass = suggestionTypeColors[suggestion.suggestion_type as keyof typeof suggestionTypeColors] || suggestionTypeColors.add_feature;

              return (
                <div
                  key={suggestion.id}
                  className="p-3 border border-border-subtle rounded-lg space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <Badge className={colorClass}>
                      <Icon className="h-3 w-3 mr-1" />
                      {suggestion.suggestion_type.replace(/_/g, ' ')}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {Math.round(suggestion.confidence_score * 100)}%
                    </Badge>
                  </div>

                  <p className="text-sm font-medium">
                    {suggestion.suggestion_text}
                  </p>

                  {suggestion.reasoning && (
                    <p className="text-xs text-muted-foreground">
                      {suggestion.reasoning}
                    </p>
                  )}

                  <div className="flex gap-2 pt-2">
                    <Button
                      onClick={() => handleAccept(suggestion)}
                      size="sm"
                      variant="default"
                      className="flex-1"
                    >
                      <Check className="h-3 w-3 mr-1" />
                      Accept
                    </Button>
                    <Button
                      onClick={() => handleDismiss(suggestion)}
                      size="sm"
                      variant="outline"
                      className="flex-1"
                    >
                      <X className="h-3 w-3 mr-1" />
                      Dismiss
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
