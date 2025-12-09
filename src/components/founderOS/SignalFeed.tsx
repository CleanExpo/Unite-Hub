"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Radio,
  Mail,
  Globe,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Loader2,
  RefreshCw,
} from "lucide-react";

interface Signal {
  id: string;
  type: "email" | "web" | "market" | "internal";
  source: string;
  message: string;
  sentiment: "positive" | "negative" | "neutral";
  priority: "high" | "medium" | "low";
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

interface SignalFeedProps {
  signals: Signal[];
  isLoading?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
  onRefresh?: () => void;
  maxHeight?: string;
}

export function SignalFeed({
  signals,
  isLoading = false,
  hasMore = false,
  onLoadMore,
  onRefresh,
  maxHeight = "500px",
}: SignalFeedProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const getSignalIcon = (type: string) => {
    switch (type) {
      case "email":
        return Mail;
      case "web":
        return Globe;
      case "market":
        return TrendingUp;
      case "internal":
        return Radio;
      default:
        return Radio;
    }
  };

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case "positive":
        return CheckCircle;
      case "negative":
        return XCircle;
      case "neutral":
        return AlertTriangle;
      default:
        return AlertTriangle;
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case "positive":
        return "text-green-600 dark:text-green-400";
      case "negative":
        return "text-red-600 dark:text-red-400";
      case "neutral":
        return "text-yellow-600 dark:text-yellow-400";
      default:
        return "text-muted-foreground";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
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

  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) {
return "Just now";
}
    if (minutes < 60) {
return `${minutes}m ago`;
}
    if (hours < 24) {
return `${hours}h ago`;
}
    if (days < 7) {
return `${days}d ago`;
}
    return date.toLocaleDateString();
  };

  const handleRefresh = async () => {
    if (!onRefresh) {
return;
}
    setIsRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Radio className="h-5 w-5" />
            Signal Feed
          </CardTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea style={{ height: maxHeight }}>
          {isLoading && signals.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin mb-2" />
              <p className="text-sm">Loading signals...</p>
            </div>
          ) : signals.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Radio className="h-12 w-12 mb-4 opacity-20" />
              <p className="text-sm">No signals yet</p>
              <p className="text-xs mt-1">Your signal feed will appear here</p>
            </div>
          ) : (
            <div className="space-y-3">
              {signals.map((signal, index) => {
                const SignalIcon = getSignalIcon(signal.type);
                const SentimentIcon = getSentimentIcon(signal.sentiment);

                return (
                  <div
                    key={signal.id}
                    className="group relative border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex gap-3">
                      {/* Icon */}
                      <div className="shrink-0 mt-1">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <SignalIcon className="h-4 w-4 text-primary" />
                        </div>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0 space-y-2">
                        {/* Header */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="secondary" className="text-xs">
                              {signal.type}
                            </Badge>
                            <Badge variant="outline" className={getPriorityColor(signal.priority)}>
                              {signal.priority}
                            </Badge>
                          </div>
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {formatTimestamp(signal.timestamp)}
                          </span>
                        </div>

                        {/* Source */}
                        <div className="text-xs text-muted-foreground">
                          From: <span className="font-medium">{signal.source}</span>
                        </div>

                        {/* Message */}
                        <p className="text-sm leading-relaxed">{signal.message}</p>

                        {/* Sentiment */}
                        <div className="flex items-center gap-2">
                          <SentimentIcon
                            className={`h-4 w-4 ${getSentimentColor(signal.sentiment)}`}
                          />
                          <span className={`text-xs font-medium ${getSentimentColor(signal.sentiment)}`}>
                            {signal.sentiment.charAt(0).toUpperCase() + signal.sentiment.slice(1)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Divider (except last item) */}
                    {index < signals.length - 1 && (
                      <div className="absolute bottom-0 left-4 right-4 h-px bg-border" />
                    )}
                  </div>
                );
              })}

              {/* Load More Button */}
              {hasMore && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={onLoadMore}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Loading more...
                    </>
                  ) : (
                    "Load More Signals"
                  )}
                </Button>
              )}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
