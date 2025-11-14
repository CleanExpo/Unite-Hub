"use client";

import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Check, ArrowRight, Circle } from "lucide-react";

interface Milestone {
  id: string;
  title: string;
  status: "completed" | "in-progress" | "pending";
  date: string;
}

interface MilestoneTrackerProps {
  milestones: Milestone[];
  progress: number;
  className?: string;
}

const statusConfig = {
  completed: {
    icon: Check,
    iconClass: "bg-unite-teal text-white",
    textClass: "text-gray-500 line-through",
  },
  "in-progress": {
    icon: ArrowRight,
    iconClass: "bg-unite-teal text-white",
    textClass: "text-unite-navy font-medium",
  },
  pending: {
    icon: Circle,
    iconClass: "bg-gray-100 text-gray-500 border-2 border-gray-300",
    textClass: "text-gray-600",
  },
};

export function MilestoneTracker({ milestones, progress, className }: MilestoneTrackerProps) {
  return (
    <div className={className}>
      {/* Progress Section */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-semibold">Overall Progress</span>
          <span className="text-sm text-gray-600">{progress}%</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-unite-teal to-unite-blue rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Milestones */}
      <div className="space-y-3">
        {milestones.map((milestone) => {
          const config = statusConfig[milestone.status];
          const Icon = config.icon;

          return (
            <div key={milestone.id} className="flex items-center gap-3">
              <div className={cn(
                "w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0",
                config.iconClass
              )}>
                <Icon className="h-3 w-3" />
              </div>
              <div className={cn("flex-1 text-sm", config.textClass)}>
                {milestone.title}
              </div>
              <div className="text-xs text-gray-500">
                {milestone.date}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
