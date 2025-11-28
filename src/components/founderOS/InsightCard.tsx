"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Lightbulb,
  CheckCircle,
  XCircle,
  TrendingUp,
  AlertTriangle,
  Target,
  Loader2,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface ActionItem {
  id: string;
  title: string;
  priority: "high" | "medium" | "low";
  completed?: boolean;
}

interface InsightCardProps {
  id: string;
  domain: "financial" | "operational" | "strategic" | "marketing" | "product";
  title: string;
  insight: string;
  confidence: number;
  actionItems?: ActionItem[];
  impact?: "high" | "medium" | "low";
  timestamp: Date;
  acknowledged?: boolean;
  onAcknowledge?: (id: string) => Promise<void>;
  onDismiss?: (id: string) => Promise<void>;
  onToggleAction?: (insightId: string, actionId: string) => void;
}

export function InsightCard({
  id,
  domain,
  title,
  insight,
  confidence,
  actionItems = [],
  impact = "medium",
  timestamp,
  acknowledged = false,
  onAcknowledge,
  onDismiss,
  onToggleAction,
}: InsightCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isAcknowledging, setIsAcknowledging] = useState(false);
  const [isDismissing, setIsDismissing] = useState(false);
  const [localAcknowledged, setLocalAcknowledged] = useState(acknowledged);

  const getDomainColor = (domain: string) => {
    switch (domain) {
      case "financial":
        return "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20";
      case "operational":
        return "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20";
      case "strategic":
        return "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20";
      case "marketing":
        return "bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20";
      case "product":
        return "bg-pink-500/10 text-pink-700 dark:text-pink-400 border-pink-500/20";
      default:
        return "bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-500/20";
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case "high":
        return "bg-red-500/10 text-red-700 dark:text-red-400";
      case "medium":
        return "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400";
      case "low":
        return "bg-blue-500/10 text-blue-700 dark:text-blue-400";
      default:
        return "bg-gray-500/10 text-gray-700 dark:text-gray-400";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-500/10 text-red-700 dark:text-red-400";
      case "medium":
        return "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400";
      case "low":
        return "bg-green-500/10 text-green-700 dark:text-green-400";
      default:
        return "bg-gray-500/10 text-gray-700 dark:text-gray-400";
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return "text-green-600 dark:text-green-400";
    if (confidence >= 60) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (hours < 1) return "Just now";
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  const handleAcknowledge = async () => {
    if (!onAcknowledge) return;
    setIsAcknowledging(true);
    try {
      await onAcknowledge(id);
      setLocalAcknowledged(true);
    } finally {
      setIsAcknowledging(false);
    }
  };

  const handleDismiss = async () => {
    if (!onDismiss) return;
    setIsDismissing(true);
    try {
      await onDismiss(id);
    } finally {
      setIsDismissing(false);
    }
  };

  const completedActions = actionItems.filter((item) => item.completed).length;
  const totalActions = actionItems.length;
  const progressPercent = totalActions > 0 ? (completedActions / totalActions) * 100 : 0;

  return (
    <Card
      className={`transition-all duration-200 ${
        localAcknowledged
          ? "opacity-60 border-dashed"
          : "hover:shadow-lg border-solid"
      }`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="p-2 rounded-lg bg-primary/10 shrink-0">
              <Lightbulb className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0 space-y-2">
              <h3 className="font-semibold leading-tight">{title}</h3>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline" className={getDomainColor(domain)}>
                  {domain}
                </Badge>
                <Badge variant="secondary" className={getImpactColor(impact)}>
                  {impact} impact
                </Badge>
                <span className={`text-xs font-medium ${getConfidenceColor(confidence)}`}>
                  {confidence}% confident
                </span>
              </div>
            </div>
          </div>
          {localAcknowledged && (
            <Badge variant="secondary" className="shrink-0">
              <CheckCircle className="h-3 w-3 mr-1" />
              Acknowledged
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Insight Text */}
        <p className="text-sm leading-relaxed text-muted-foreground">{insight}</p>

        {/* Action Items */}
        {actionItems.length > 0 && (
          <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">
                    Action Items ({completedActions}/{totalActions})
                  </span>
                </div>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm">
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </Button>
                </CollapsibleTrigger>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              {/* Expanded Action Items */}
              <CollapsibleContent className="space-y-2">
                {actionItems.map((item) => (
                  <div
                    key={item.id}
                    className={`flex items-start gap-3 p-3 rounded-lg border ${
                      item.completed ? "bg-muted/50" : "bg-background"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={item.completed}
                      onChange={() => onToggleAction?.(id, item.id)}
                      className="mt-0.5 h-4 w-4 rounded border-gray-300"
                    />
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-sm ${
                          item.completed
                            ? "line-through text-muted-foreground"
                            : ""
                        }`}
                      >
                        {item.title}
                      </p>
                      <Badge
                        variant="outline"
                        className={`mt-1 text-xs ${getPriorityColor(item.priority)}`}
                      >
                        {item.priority}
                      </Badge>
                    </div>
                  </div>
                ))}
              </CollapsibleContent>
            </div>
          </Collapsible>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t">
          <span className="text-xs text-muted-foreground">
            {formatTimestamp(timestamp)}
          </span>

          <div className="flex gap-2">
            {!localAcknowledged && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDismiss}
                  disabled={isDismissing || isAcknowledging}
                >
                  {isDismissing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <XCircle className="h-4 w-4 mr-2" />
                      Dismiss
                    </>
                  )}
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleAcknowledge}
                  disabled={isAcknowledging || isDismissing}
                >
                  {isAcknowledging ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Acknowledge
                    </>
                  )}
                </Button>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
