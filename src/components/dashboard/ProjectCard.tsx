"use client";

import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { Clock, Calendar } from "lucide-react";

interface ProjectCardProps {
  title: string;
  client: string;
  status: "on-track" | "at-risk" | "delayed" | "completed";
  progress: number;
  dueDate: string;
  assignees?: Array<{
    name: string;
    avatar?: string;
    initials: string;
  }>;
  priority?: "high" | "medium" | "low";
  className?: string;
}

const statusConfig = {
  "on-track": {
    label: "On Track",
    color: "bg-green-500",
    badgeClass: "bg-green-100 text-green-700 border-green-200",
  },
  "at-risk": {
    label: "At Risk",
    color: "bg-yellow-500",
    badgeClass: "bg-yellow-100 text-yellow-700 border-yellow-200",
  },
  delayed: {
    label: "Delayed",
    color: "bg-red-500",
    badgeClass: "bg-red-100 text-red-700 border-red-200",
  },
  completed: {
    label: "Completed",
    color: "bg-blue-500",
    badgeClass: "bg-blue-100 text-blue-700 border-blue-200",
  },
};

const priorityConfig = {
  high: "bg-red-100 text-red-700 border-red-200",
  medium: "bg-yellow-100 text-yellow-700 border-yellow-200",
  low: "bg-gray-100 text-gray-700 border-gray-200",
};

export function ProjectCard({
  title,
  client,
  status,
  progress,
  dueDate,
  assignees = [],
  priority,
  className,
}: ProjectCardProps) {
  const statusInfo = statusConfig[status];

  return (
    <Card className={cn("hover:shadow-lg transition-shadow duration-200", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg font-semibold text-unite-navy mb-1">
              {title}
            </CardTitle>
            <p className="text-sm text-gray-500">{client}</p>
          </div>
          <div className="flex gap-2">
            {priority && (
              <Badge variant="outline" className={cn("text-xs", priorityConfig[priority])}>
                {priority.charAt(0).toUpperCase() + priority.slice(1)}
              </Badge>
            )}
            <Badge variant="outline" className={cn("text-xs", statusInfo.badgeClass)}>
              {statusInfo.label}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Progress</span>
            <span className="font-semibold text-unite-navy">{progress}%</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-300",
                statusInfo.color
              )}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Due Date and Assignees */}
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Calendar className="h-4 w-4" />
            <span>Due {dueDate}</span>
          </div>

          {assignees.length > 0 && (
            <div className="flex -space-x-2">
              {assignees.slice(0, 3).map((assignee, index) => (
                <Avatar
                  key={index}
                  className="h-8 w-8 border-2 border-white ring-1 ring-gray-200"
                >
                  {assignee.avatar && <AvatarImage src={assignee.avatar} alt={assignee.name} />}
                  <AvatarFallback className="bg-gradient-to-br from-unite-teal to-unite-blue text-white text-xs">
                    {assignee.initials}
                  </AvatarFallback>
                </Avatar>
              ))}
              {assignees.length > 3 && (
                <div className="h-8 w-8 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center text-xs font-medium text-gray-600">
                  +{assignees.length - 3}
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Grid container for project cards
export function ProjectCardGrid({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6", className)}>
      {children}
    </div>
  );
}
