/**
 * Digest Viewer - Cognitive Twin
 *
 * Display periodic digest with markdown rendering,
 * key metrics sidebar, action items checklist, and export functionality.
 */

"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Button from "@/components/ui/button";
import Badge from "@/components/ui/badge";
import {
  Calendar,
  Clock,
  CheckCircle2,
  Circle,
  Download,
  Share2,
  Mail,
  Printer,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  Sparkles
} from "lucide-react";
import { cn } from "@/lib/utils";

interface DigestData {
  digest_id: string;
  period_start: string;
  period_end: string;
  digest_md: string;
  key_metrics: {
    total_insights: number;
    avg_health_score: number;
    health_change: number;
    domains_improved: number;
    domains_declined: number;
    critical_alerts: number;
  };
  action_items: {
    id: string;
    title: string;
    priority: "high" | "medium" | "low";
    domain: string;
    completed?: boolean;
  }[];
  created_at: string;
}

interface DigestViewerProps {
  digest: DigestData;
  onActionToggle?: (actionId: string, completed: boolean) => void;
  onExport?: (format: "pdf" | "md") => void;
  onShare?: () => void;
  isLoading?: boolean;
  error?: string;
}

export default function DigestViewer({
  digest,
  onActionToggle,
  onExport,
  onShare,
  isLoading = false,
  error,
}: DigestViewerProps) {
  const [completedActions, setCompletedActions] = useState<Set<string>>(
    new Set(digest.action_items.filter(a => a.completed).map(a => a.id))
  );

  // Calculate completion percentage
  const completionPercentage = useMemo(() => {
    if (digest.action_items.length === 0) return 0;
    return (completedActions.size / digest.action_items.length) * 100;
  }, [completedActions, digest.action_items]);

  // Handle action item toggle
  const handleActionToggle = (actionId: string) => {
    const newCompleted = new Set(completedActions);
    const isCompleted = newCompleted.has(actionId);

    if (isCompleted) {
      newCompleted.delete(actionId);
    } else {
      newCompleted.add(actionId);
    }

    setCompletedActions(newCompleted);
    onActionToggle?.(actionId, !isCompleted);
  };

  // Format date range
  const dateRange = useMemo(() => {
    const start = new Date(digest.period_start);
    const end = new Date(digest.period_end);
    return `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`;
  }, [digest.period_start, digest.period_end]);

  // Simple markdown renderer (basic support)
  const renderMarkdown = (md: string) => {
    const lines = md.split("\n");
    return lines.map((line, i) => {
      // Headers
      if (line.startsWith("### ")) {
        return <h3 key={i} className="text-lg font-semibold mt-6 mb-3">{line.slice(4)}</h3>;
      }
      if (line.startsWith("## ")) {
        return <h2 key={i} className="text-xl font-bold mt-8 mb-4">{line.slice(3)}</h2>;
      }
      if (line.startsWith("# ")) {
        return <h1 key={i} className="text-2xl font-bold mt-8 mb-4">{line.slice(2)}</h1>;
      }

      // Lists
      if (line.startsWith("- ") || line.startsWith("* ")) {
        return (
          <li key={i} className="ml-4 mb-1 list-disc list-inside">
            {line.slice(2)}
          </li>
        );
      }

      // Bold
      const boldRegex = /\*\*(.*?)\*\*/g;
      if (boldRegex.test(line)) {
        const parts = line.split(boldRegex);
        return (
          <p key={i} className="mb-2">
            {parts.map((part, j) => (
              j % 2 === 1 ? <strong key={j}>{part}</strong> : part
            ))}
          </p>
        );
      }

      // Empty line
      if (line.trim() === "") {
        return <div key={i} className="h-2" />;
      }

      // Regular paragraph
      return <p key={i} className="mb-2">{line}</p>;
    });
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="animate-pulse">
            <CardHeader>
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-4/6"></div>
              </div>
            </CardContent>
          </Card>
        </div>
        <div>
          <Card className="animate-pulse">
            <CardHeader>
              <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <Card variant="bordered" className="border-red-200 dark:border-red-800">
        <CardContent className="p-6">
          <div className="flex items-start gap-3 text-red-600 dark:text-red-400">
            <AlertCircle className="w-5 h-5 mt-0.5" />
            <div>
              <p className="font-semibold">Error Loading Digest</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">{error}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Main Content */}
      <div className="lg:col-span-2 space-y-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                  <Calendar className="w-4 h-4" />
                  <span>{dateRange}</span>
                </div>
                <CardTitle className="text-2xl">Weekly Digest</CardTitle>
                <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Generated {new Date(digest.created_at).toLocaleString()}
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onExport?.("md")}
                  leftIcon={<Download className="w-4 h-4" />}
                >
                  Export
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onShare}
                  leftIcon={<Share2 className="w-4 h-4" />}
                >
                  Share
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Digest Content */}
        <Card>
          <CardContent className="p-6 prose dark:prose-invert max-w-none">
            {renderMarkdown(digest.digest_md)}
          </CardContent>
        </Card>

        {/* Action Items */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Action Items</CardTitle>
              <Badge variant={completionPercentage === 100 ? "success" : "default"}>
                {completedActions.size}/{digest.action_items.length} completed
              </Badge>
            </div>

            {/* Progress Bar */}
            <div className="mt-3">
              <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 transition-all duration-300"
                  style={{ width: `${completionPercentage}%` }}
                />
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <div className="space-y-2">
              {digest.action_items.map((action) => {
                const isCompleted = completedActions.has(action.id);
                const priorityColors = {
                  high: "text-red-500",
                  medium: "text-yellow-500",
                  low: "text-blue-500",
                };

                return (
                  <div
                    key={action.id}
                    className={cn(
                      "flex items-start gap-3 p-3 rounded-lg border transition-all cursor-pointer",
                      isCompleted
                        ? "bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800"
                        : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700"
                    )}
                    onClick={() => handleActionToggle(action.id)}
                  >
                    {/* Checkbox */}
                    <button className="flex-shrink-0 mt-0.5">
                      {isCompleted ? (
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                      ) : (
                        <Circle className="w-5 h-5 text-gray-400" />
                      )}
                    </button>

                    {/* Content */}
                    <div className="flex-1">
                      <p
                        className={cn(
                          "font-medium",
                          isCompleted && "line-through text-gray-500"
                        )}
                      >
                        {action.title}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge size="sm" variant="outline">
                          {action.domain}
                        </Badge>
                        <span className={cn("text-xs font-medium", priorityColors[action.priority])}>
                          {action.priority.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sidebar */}
      <div className="space-y-6">
        {/* Key Metrics */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              Key Metrics
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Total Insights */}
            <div>
              <div className="text-sm text-gray-500 mb-1">Total Insights</div>
              <div className="text-2xl font-bold">{digest.key_metrics.total_insights}</div>
            </div>

            {/* Avg Health Score */}
            <div>
              <div className="text-sm text-gray-500 mb-1">Average Health Score</div>
              <div className="flex items-center gap-2">
                <div className="text-2xl font-bold">{digest.key_metrics.avg_health_score}</div>
                <div className={cn(
                  "flex items-center gap-1 text-sm font-medium",
                  digest.key_metrics.health_change >= 0 ? "text-green-500" : "text-red-500"
                )}>
                  {digest.key_metrics.health_change >= 0 ? (
                    <TrendingUp className="w-4 h-4" />
                  ) : (
                    <TrendingDown className="w-4 h-4" />
                  )}
                  {Math.abs(digest.key_metrics.health_change)}
                </div>
              </div>
            </div>

            {/* Domains Improved/Declined */}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div>
                <div className="text-xs text-gray-500 mb-1">Improved</div>
                <div className="text-lg font-bold text-green-500">
                  +{digest.key_metrics.domains_improved}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">Declined</div>
                <div className="text-lg font-bold text-red-500">
                  -{digest.key_metrics.domains_declined}
                </div>
              </div>
            </div>

            {/* Critical Alerts */}
            {digest.key_metrics.critical_alerts > 0 && (
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-sm font-medium">
                    {digest.key_metrics.critical_alerts} Critical Alerts
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Export Options */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Export & Share</CardTitle>
          </CardHeader>

          <CardContent className="space-y-2">
            <Button
              variant="outline"
              fullWidth
              leftIcon={<Download className="w-4 h-4" />}
              onClick={() => onExport?.("pdf")}
            >
              Export as PDF
            </Button>
            <Button
              variant="outline"
              fullWidth
              leftIcon={<Mail className="w-4 h-4" />}
              onClick={onShare}
            >
              Email Digest
            </Button>
            <Button
              variant="outline"
              fullWidth
              leftIcon={<Printer className="w-4 h-4" />}
              onClick={() => window.print()}
            >
              Print
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
