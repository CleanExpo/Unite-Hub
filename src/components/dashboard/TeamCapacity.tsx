"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { AlertCircle } from "lucide-react";

interface TeamMember {
  id: string;
  name: string;
  role: string;
  avatar?: string;
  initials: string;
  capacity: number; // 0-100 percentage
  hoursAllocated: number;
  hoursAvailable: number;
  status: "available" | "near-capacity" | "over-capacity";
  currentProjects: number;
}

interface TeamCapacityProps {
  members: TeamMember[];
  className?: string;
}

const statusConfig = {
  available: {
    label: "Available",
    barColor: "bg-[#00FF88]",
    badgeClass: "border-[#00FF88]/30 text-[#00FF88]",
  },
  "near-capacity": {
    label: "Near Capacity",
    barColor: "bg-[#FFB800]",
    badgeClass: "border-[#FFB800]/30 text-[#FFB800]",
  },
  "over-capacity": {
    label: "Over Capacity",
    barColor: "bg-[#FF4444]",
    badgeClass: "border-[#FF4444]/30 text-[#FF4444]",
  },
};

export function TeamCapacity({ members, className }: TeamCapacityProps) {
  return (
    <div className={cn("bg-white/[0.02] border border-white/[0.06] rounded-sm", className)}>
      <div className="p-4 border-b border-white/[0.06] flex items-center justify-between">
        <h3 className="text-sm font-mono font-bold text-white/90">Team Capacity</h3>
        <span className="px-2 py-0.5 border border-white/[0.06] rounded-sm text-[10px] font-mono text-white/40">
          {members.length} members
        </span>
      </div>
      <div className="p-4">
        <div className="space-y-4">
          {members.map((member) => {
            const statusInfo = statusConfig[member.status];
            return (
              <div key={member.id} className="space-y-3">
                {/* Member Info */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-sm border border-white/[0.06] bg-white/[0.04] flex items-center justify-center">
                      <span className="text-xs font-mono font-bold text-[#00F5FF]">{member.initials}</span>
                    </div>
                    <div>
                      <p className="font-mono text-sm text-white/90">{member.name}</p>
                      <p className="text-xs font-mono text-white/30">{member.role}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={cn("px-1.5 py-0.5 border rounded-sm text-[10px] font-mono mb-1 inline-block", statusInfo.badgeClass)}>
                      {statusInfo.label}
                    </span>
                    <p className="text-xs font-mono text-white/20">
                      {member.currentProjects} {member.currentProjects === 1 ? "project" : "projects"}
                    </p>
                  </div>
                </div>

                {/* Capacity Bar */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-xs font-mono text-white/30">
                      {member.hoursAllocated}h / {member.hoursAvailable}h
                    </span>
                    <div className="flex items-center gap-1">
                      <span className="font-mono font-bold text-sm text-white/90">{member.capacity}%</span>
                      {member.status === "over-capacity" && (
                        <AlertCircle className="h-4 w-4 text-[#FF4444]" />
                      )}
                    </div>
                  </div>
                  <div className="h-1.5 bg-white/[0.06] rounded-sm overflow-hidden">
                    <div
                      className={cn("h-full rounded-sm transition-all duration-300", statusInfo.barColor)}
                      style={{ width: `${Math.min(member.capacity, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Summary */}
        <div className="mt-6 pt-6 border-t border-white/[0.06]">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold font-mono text-[#00FF88]">
                {members.filter((m) => m.status === "available").length}
              </p>
              <p className="text-[10px] font-mono uppercase tracking-widest text-white/20 mt-1">Available</p>
            </div>
            <div>
              <p className="text-2xl font-bold font-mono text-[#FFB800]">
                {members.filter((m) => m.status === "near-capacity").length}
              </p>
              <p className="text-[10px] font-mono uppercase tracking-widest text-white/20 mt-1">Near Capacity</p>
            </div>
            <div>
              <p className="text-2xl font-bold font-mono text-[#FF4444]">
                {members.filter((m) => m.status === "over-capacity").length}
              </p>
              <p className="text-[10px] font-mono uppercase tracking-widest text-white/20 mt-1">Over Capacity</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Individual capacity bar component for reuse
export function CapacityBar({
  label,
  current,
  total,
  className,
}: {
  label: string;
  current: number;
  total: number;
  className?: string;
}) {
  const percentage = Math.round((current / total) * 100);
  const status =
    percentage >= 100 ? "over-capacity" : percentage >= 80 ? "near-capacity" : "available";
  const statusInfo = statusConfig[status];

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between text-sm">
        <span className="text-xs font-mono text-white/30">{label}</span>
        <span className="font-mono font-bold text-sm text-white/90">
          {current} / {total}
        </span>
      </div>
      <div className="h-1.5 bg-white/[0.06] rounded-sm overflow-hidden">
        <div
          className={cn("h-full rounded-sm transition-all duration-300", statusInfo.barColor)}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
    </div>
  );
}
