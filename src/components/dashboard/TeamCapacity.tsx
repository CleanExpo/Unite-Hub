"use client";

import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
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
    color: "bg-green-500",
    badgeClass: "bg-green-100 text-green-700",
  },
  "near-capacity": {
    label: "Near Capacity",
    color: "bg-yellow-500",
    badgeClass: "bg-yellow-100 text-yellow-700",
  },
  "over-capacity": {
    label: "Over Capacity",
    color: "bg-red-500",
    badgeClass: "bg-red-100 text-red-700",
  },
};

export function TeamCapacity({ members, className }: TeamCapacityProps) {
  return (
    <Card className={className}>
      <CardHeader className="border-b">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-bold text-unite-navy">Team Capacity</CardTitle>
          <Badge variant="secondary" className="bg-unite-blue text-white">
            {members.length} members
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-4">
          {members.map((member) => {
            const statusInfo = statusConfig[member.status];
            return (
              <div key={member.id} className="space-y-3">
                {/* Member Info */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      {member.avatar && <AvatarImage src={member.avatar} alt={member.name} />}
                      <AvatarFallback className="bg-gradient-to-br from-unite-teal to-unite-blue text-white">
                        {member.initials}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold text-unite-navy">{member.name}</p>
                      <p className="text-sm text-gray-500">{member.role}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant="outline" className={cn("text-xs mb-1", statusInfo.badgeClass)}>
                      {statusInfo.label}
                    </Badge>
                    <p className="text-xs text-gray-500">
                      {member.currentProjects} {member.currentProjects === 1 ? "project" : "projects"}
                    </p>
                  </div>
                </div>

                {/* Capacity Bar */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">
                      {member.hoursAllocated}h / {member.hoursAvailable}h
                    </span>
                    <div className="flex items-center gap-1">
                      <span className="font-semibold text-unite-navy">{member.capacity}%</span>
                      {member.status === "over-capacity" && (
                        <AlertCircle className="h-4 w-4 text-red-500" />
                      )}
                    </div>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-300",
                        statusInfo.color
                      )}
                      style={{ width: `${Math.min(member.capacity, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Summary */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-green-600">
                {members.filter((m) => m.status === "available").length}
              </p>
              <p className="text-xs text-gray-600 mt-1">Available</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-yellow-600">
                {members.filter((m) => m.status === "near-capacity").length}
              </p>
              <p className="text-xs text-gray-600 mt-1">Near Capacity</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-red-600">
                {members.filter((m) => m.status === "over-capacity").length}
              </p>
              <p className="text-xs text-gray-600 mt-1">Over Capacity</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
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
        <span className="text-gray-600">{label}</span>
        <span className="font-semibold text-unite-navy">
          {current} / {total}
        </span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all duration-300", statusInfo.color)}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
    </div>
  );
}
