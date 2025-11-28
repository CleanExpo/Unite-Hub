"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Camera,
  ChevronDown,
  ChevronRight,
  Calendar,
  TrendingUp,
  TrendingDown,
  Minus,
  GitCompare,
  Loader2,
} from "lucide-react";

interface Snapshot {
  id: string;
  timestamp: Date;
  healthScore: number;
  metrics: {
    revenue?: number;
    expenses?: number;
    activeContacts?: number;
    campaignsRunning?: number;
    [key: string]: number | undefined;
  };
  notes?: string;
  tags?: string[];
}

interface SnapshotTimelineProps {
  snapshots: Snapshot[];
  isLoading?: boolean;
  onCompare?: (snapshotIds: [string, string]) => void;
  maxHeight?: string;
}

export function SnapshotTimeline({
  snapshots,
  isLoading = false,
  onCompare,
  maxHeight = "600px",
}: SnapshotTimelineProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [selectedForCompare, setSelectedForCompare] = useState<[string | null, string | null]>([
    null,
    null,
  ]);

  const toggleExpanded = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleCompareSelection = (id: string) => {
    setSelectedForCompare((prev) => {
      if (prev[0] === id) return [null, prev[1]];
      if (prev[1] === id) return [prev[0], null];
      if (prev[0] === null) return [id, prev[1]];
      if (prev[1] === null) return [prev[0], id];
      return [prev[1], id];
    });
  };

  const handleCompare = () => {
    if (selectedForCompare[0] && selectedForCompare[1] && onCompare) {
      onCompare([selectedForCompare[0], selectedForCompare[1]]);
    }
  };

  const getHealthTrend = (current: number, previous?: number) => {
    if (!previous) return null;
    const diff = current - previous;
    if (diff > 5) return "up";
    if (diff < -5) return "down";
    return "stable";
  };

  const getTrendIcon = (trend: string | null) => {
    switch (trend) {
      case "up":
        return TrendingUp;
      case "down":
        return TrendingDown;
      default:
        return Minus;
    }
  };

  const getTrendColor = (trend: string | null) => {
    switch (trend) {
      case "up":
        return "text-green-600 dark:text-green-400";
      case "down":
        return "text-red-600 dark:text-red-400";
      default:
        return "text-muted-foreground";
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatMetricValue = (key: string, value: number) => {
    if (key.toLowerCase().includes("revenue") || key.toLowerCase().includes("expense")) {
      return `$${value.toLocaleString()}`;
    }
    return value.toLocaleString();
  };

  const isSelected = (id: string) => {
    return selectedForCompare[0] === id || selectedForCompare[1] === id;
  };

  const canCompare = selectedForCompare[0] !== null && selectedForCompare[1] !== null;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Snapshot Timeline
          </CardTitle>
          {canCompare && (
            <Button variant="outline" size="sm" onClick={handleCompare}>
              <GitCompare className="h-4 w-4 mr-2" />
              Compare Selected
            </Button>
          )}
        </div>
        {selectedForCompare[0] && selectedForCompare[1] && (
          <p className="text-xs text-muted-foreground">
            {selectedForCompare.filter(Boolean).length} snapshots selected for comparison
          </p>
        )}
      </CardHeader>
      <CardContent>
        <ScrollArea style={{ height: maxHeight }}>
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin mb-2" />
              <p className="text-sm">Loading snapshots...</p>
            </div>
          ) : snapshots.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Camera className="h-12 w-12 mb-4 opacity-20" />
              <p className="text-sm">No snapshots yet</p>
              <p className="text-xs mt-1">Your OS snapshots will appear here</p>
            </div>
          ) : (
            <div className="relative space-y-4">
              {/* Timeline Line */}
              <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-border" />

              {snapshots.map((snapshot, index) => {
                const isExpanded = expandedIds.has(snapshot.id);
                const previousSnapshot = snapshots[index + 1];
                const trend = getHealthTrend(snapshot.healthScore, previousSnapshot?.healthScore);
                const TrendIcon = getTrendIcon(trend);
                const selected = isSelected(snapshot.id);

                return (
                  <div key={snapshot.id} className="relative pl-12">
                    {/* Timeline Dot */}
                    <div
                      className={`absolute left-4 top-3 w-4 h-4 rounded-full border-2 transition-colors ${
                        selected
                          ? "bg-primary border-primary"
                          : "bg-background border-border"
                      }`}
                    />

                    <Collapsible
                      open={isExpanded}
                      onOpenChange={() => toggleExpanded(snapshot.id)}
                    >
                      <div
                        className={`border rounded-lg p-4 space-y-3 transition-colors ${
                          selected ? "border-primary bg-primary/5" : "hover:bg-muted/50"
                        }`}
                      >
                        {/* Header */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">{formatDate(snapshot.timestamp)}</span>
                              <span className="text-xs text-muted-foreground">
                                {formatTime(snapshot.timestamp)}
                              </span>
                            </div>

                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-2">
                                <span className="text-2xl font-bold">{snapshot.healthScore}</span>
                                <span className="text-sm text-muted-foreground">/100</span>
                              </div>
                              {trend && (
                                <TrendIcon className={`h-4 w-4 ${getTrendColor(trend)}`} />
                              )}
                            </div>

                            {snapshot.tags && snapshot.tags.length > 0 && (
                              <div className="flex gap-2 flex-wrap">
                                {snapshot.tags.map((tag) => (
                                  <Badge key={tag} variant="secondary" className="text-xs">
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>

                          <div className="flex gap-2">
                            <Button
                              variant={selected ? "default" : "outline"}
                              size="sm"
                              onClick={() => toggleCompareSelection(snapshot.id)}
                            >
                              {selected ? "Selected" : "Compare"}
                            </Button>
                            <CollapsibleTrigger asChild>
                              <Button variant="ghost" size="icon">
                                {isExpanded ? (
                                  <ChevronDown className="h-4 w-4" />
                                ) : (
                                  <ChevronRight className="h-4 w-4" />
                                )}
                              </Button>
                            </CollapsibleTrigger>
                          </div>
                        </div>

                        {/* Expandable Content */}
                        <CollapsibleContent className="space-y-3">
                          {/* Notes */}
                          {snapshot.notes && (
                            <div className="bg-muted rounded-lg p-3">
                              <p className="text-sm leading-relaxed">{snapshot.notes}</p>
                            </div>
                          )}

                          {/* Metrics */}
                          <div className="grid grid-cols-2 gap-3">
                            {Object.entries(snapshot.metrics)
                              .filter(([_, value]) => value !== undefined)
                              .map(([key, value]) => (
                                <div
                                  key={key}
                                  className="bg-muted/50 rounded-lg p-3 space-y-1"
                                >
                                  <p className="text-xs text-muted-foreground capitalize">
                                    {key.replace(/([A-Z])/g, " $1").trim()}
                                  </p>
                                  <p className="text-lg font-semibold">
                                    {formatMetricValue(key, value as number)}
                                  </p>
                                </div>
                              ))}
                          </div>
                        </CollapsibleContent>
                      </div>
                    </Collapsible>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
