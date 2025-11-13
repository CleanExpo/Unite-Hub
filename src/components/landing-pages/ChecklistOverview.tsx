"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  FileText,
  CheckCircle2,
  Clock,
  Trash2,
  Eye,
  Copy
} from "lucide-react";
import Link from "next/link";

interface ChecklistOverviewProps {
  checklists: any[];
  onDelete?: (id: string) => void;
  onDuplicate?: (id: string) => void;
}

const PAGE_TYPE_LABELS: Record<string, string> = {
  homepage: "Homepage",
  product: "Product Page",
  service: "Service Page",
  lead_capture: "Lead Capture",
  sales: "Sales Page",
  event: "Event Page",
};

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-gray-500",
  in_progress: "bg-yellow-500",
  completed: "bg-green-500",
};

export function ChecklistOverview({
  checklists,
  onDelete,
  onDuplicate,
}: ChecklistOverviewProps) {
  if (checklists.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">No landing pages yet</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Create your first landing page checklist to get started
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {checklists.map((checklist) => (
        <Card key={checklist._id} className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <Badge variant="outline" className="mb-2">
                  {PAGE_TYPE_LABELS[checklist.pageType]}
                </Badge>
                <CardTitle className="text-lg">{checklist.title}</CardTitle>
              </div>
              <div className={`h-3 w-3 rounded-full ${STATUS_COLORS[checklist.status]}`} />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Progress */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-medium">{checklist.completionPercentage}%</span>
              </div>
              <Progress value={checklist.completionPercentage} />
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Sections</p>
                <p className="font-medium">{checklist.sections.length}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Completed</p>
                <p className="font-medium">
                  {checklist.sections.filter((s: any) => s.completed).length}
                </p>
              </div>
            </div>

            {/* Last updated */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>
                Updated {new Date(checklist.updatedAt).toLocaleDateString()}
              </span>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button asChild className="flex-1" size="sm">
                <Link href={`/dashboard/resources/landing-pages/${checklist._id}`}>
                  <Eye className="mr-2 h-4 w-4" />
                  View
                </Link>
              </Button>
              {onDuplicate && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onDuplicate(checklist._id)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              )}
              {onDelete && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => onDelete(checklist._id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
