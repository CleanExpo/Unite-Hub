"use client";

/**
 * Sequence List Component
 * Displays all email sequences for a client
 */

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Play, Pause, Archive, Copy, Trash2, BarChart3 } from "lucide-react";

interface Sequence {
  _id: string;
  name: string;
  description?: string;
  sequenceType: string;
  status: "draft" | "active" | "paused" | "archived";
  totalSteps: number;
  metrics: {
    sent: number;
    opened: number;
    clicked: number;
    replied: number;
    converted: number;
  };
  createdAt: number;
  updatedAt: number;
}

interface SequenceListProps {
  sequences: Sequence[];
  onSelect: (sequenceId: string) => void;
  onStatusChange: (sequenceId: string, status: string) => void;
  onDuplicate: (sequenceId: string) => void;
  onDelete: (sequenceId: string) => void;
  onAnalyze: (sequenceId: string) => void;
}

export function SequenceList({
  sequences,
  onSelect,
  onStatusChange,
  onDuplicate,
  onDelete,
  onAnalyze,
}: SequenceListProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "paused":
        return "bg-yellow-100 text-yellow-800";
      case "draft":
        return "bg-gray-100 text-gray-800";
      case "archived":
        return "bg-slate-100 text-slate-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "cold_outreach":
        return "bg-blue-100 text-blue-800";
      case "lead_nurture":
        return "bg-purple-100 text-purple-800";
      case "onboarding":
        return "bg-green-100 text-green-800";
      case "re_engagement":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const calculateOpenRate = (seq: Sequence) => {
    if (seq.metrics.sent === 0) {
return "0%";
}
    return ((seq.metrics.opened / seq.metrics.sent) * 100).toFixed(1) + "%";
  };

  const calculateReplyRate = (seq: Sequence) => {
    if (seq.metrics.sent === 0) {
return "0%";
}
    return ((seq.metrics.replied / seq.metrics.sent) * 100).toFixed(1) + "%";
  };

  if (sequences.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <p className="text-muted-foreground mb-4">No sequences yet</p>
          <p className="text-sm text-muted-foreground">
            Create your first email sequence to start nurturing leads
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {sequences.map((sequence) => (
        <Card
          key={sequence._id}
          className="hover:shadow-lg transition-shadow cursor-pointer"
          onClick={() => onSelect(sequence._id)}
        >
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-xl">{sequence.name}</CardTitle>
                  <Badge className={getStatusColor(sequence.status)}>
                    {sequence.status}
                  </Badge>
                  <Badge className={getTypeColor(sequence.sequenceType)}>
                    {sequence.sequenceType.replace("_", " ")}
                  </Badge>
                </div>
                {sequence.description && (
                  <CardDescription>{sequence.description}</CardDescription>
                )}
              </div>

              <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                {sequence.status === "active" ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onStatusChange(sequence._id, "paused")}
                  >
                    <Pause className="h-4 w-4" />
                  </Button>
                ) : sequence.status === "paused" || sequence.status === "draft" ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onStatusChange(sequence._id, "active")}
                  >
                    <Play className="h-4 w-4" />
                  </Button>
                ) : null}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onAnalyze(sequence._id)}
                >
                  <BarChart3 className="h-4 w-4" />
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onDuplicate(sequence._id)}
                >
                  <Copy className="h-4 w-4" />
                </Button>

                {sequence.status !== "active" && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onDelete(sequence._id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Steps</p>
                <p className="text-2xl font-bold">{sequence.totalSteps}</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Sent</p>
                <p className="text-2xl font-bold">{sequence.metrics.sent}</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Open Rate</p>
                <p className="text-2xl font-bold">{calculateOpenRate(sequence)}</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Reply Rate</p>
                <p className="text-2xl font-bold">{calculateReplyRate(sequence)}</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Converted</p>
                <p className="text-2xl font-bold text-green-600">
                  {sequence.metrics.converted}
                </p>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                Updated {new Date(sequence.updatedAt).toLocaleDateString()}
              </p>

              {sequence.status === "active" && (
                <Badge variant="outline" className="text-green-600">
                  Live
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
