"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { Calendar, Network } from "lucide-react";
import { useRouter } from "next/navigation";

interface ProjectCardProps {
  id?: string;
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
    barColor: "bg-[#00FF88]",
    badgeClass: "border-[#00FF88]/30 text-[#00FF88]",
  },
  "at-risk": {
    label: "At Risk",
    barColor: "bg-[#FFB800]",
    badgeClass: "border-[#FFB800]/30 text-[#FFB800]",
  },
  delayed: {
    label: "Delayed",
    barColor: "bg-[#FF4444]",
    badgeClass: "border-[#FF4444]/30 text-[#FF4444]",
  },
  completed: {
    label: "Completed",
    barColor: "bg-[#00F5FF]",
    badgeClass: "border-[#00F5FF]/30 text-[#00F5FF]",
  },
};

const priorityConfig = {
  high: "border-[#FF4444]/30 text-[#FF4444]",
  medium: "border-[#FFB800]/30 text-[#FFB800]",
  low: "border-white/[0.06] text-white/40",
};

export function ProjectCard({
  id,
  title,
  client,
  status,
  progress,
  dueDate,
  assignees = [],
  priority,
  className,
}: ProjectCardProps) {
  const router = useRouter();
  const statusInfo = statusConfig[status];

  return (
    <div className={cn("bg-white/[0.02] border border-white/[0.06] rounded-sm hover:border-white/10 transition-colors", className)}>
      <div className="p-4 pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h4 className="font-mono text-sm font-bold text-white/90 mb-1">
              {title}
            </h4>
            <p className="text-xs font-mono text-white/30">{client}</p>
          </div>
          <div className="flex gap-2">
            {priority && (
              <span className={cn("px-1.5 py-0.5 border rounded-sm text-[10px] font-mono", priorityConfig[priority])}>
                {priority.charAt(0).toUpperCase() + priority.slice(1)}
              </span>
            )}
            <span className={cn("px-1.5 py-0.5 border rounded-sm text-[10px] font-mono", statusInfo.badgeClass)}>
              {statusInfo.label}
            </span>
          </div>
        </div>
      </div>

      <div className="px-4 pb-4 space-y-4">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-[10px] font-mono uppercase tracking-widest text-white/20">Progress</span>
            <span className="font-mono font-bold text-sm text-white/90">{progress}%</span>
          </div>
          <div className="h-1.5 bg-white/[0.06] rounded-sm overflow-hidden">
            <div
              className={cn("h-full rounded-sm transition-all duration-300", statusInfo.barColor)}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Due Date and Assignees */}
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-2 text-xs font-mono text-white/30">
            <Calendar className="h-4 w-4" />
            <span>Due {dueDate}</span>
          </div>

          {assignees.length > 0 && (
            <div className="flex -space-x-2">
              {assignees.slice(0, 3).map((assignee, index) => (
                <div
                  key={index}
                  className="h-8 w-8 border border-white/[0.06] bg-white/[0.04] rounded-sm flex items-center justify-center"
                  title={assignee.name}
                >
                  <span className="text-[10px] font-mono font-bold text-[#00F5FF]">{assignee.initials}</span>
                </div>
              ))}
              {assignees.length > 3 && (
                <div className="h-8 w-8 border border-white/[0.06] bg-white/[0.04] rounded-sm flex items-center justify-center text-[10px] font-mono text-white/40">
                  +{assignees.length - 3}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Mindmap Button */}
        {id && (
          <div className="pt-2 border-t border-white/[0.06]">
            <button
              className="w-full flex items-center justify-center gap-2 py-2 border border-white/[0.06] rounded-sm text-xs font-mono text-white/40 hover:text-white/90 hover:border-white/20 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                router.push(`/dashboard/projects/${id}/mindmap`);
              }}
            >
              <Network className="h-4 w-4" />
              View Mindmap
            </button>
          </div>
        )}
      </div>
    </div>
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
