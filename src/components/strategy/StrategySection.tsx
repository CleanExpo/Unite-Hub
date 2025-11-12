"use client";

import React from "react";
import { LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface StrategySectionProps {
  icon: LucideIcon;
  title: string;
  content: string;
  color?: "blue" | "purple" | "green" | "orange" | "red";
  isProfessional?: boolean;
}

const colorMap = {
  blue: "from-blue-600 to-blue-700",
  purple: "from-purple-600 to-purple-700",
  green: "from-green-600 to-green-700",
  orange: "from-orange-600 to-orange-700",
  red: "from-red-600 to-red-700",
};

const bgColorMap = {
  blue: "bg-blue-50 border-blue-200",
  purple: "bg-purple-50 border-purple-200",
  green: "bg-green-50 border-green-200",
  orange: "bg-orange-50 border-orange-200",
  red: "bg-red-50 border-red-200",
};

export function StrategySection({
  icon: Icon,
  title,
  content,
  color = "blue",
  isProfessional,
}: StrategySectionProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
          <div
            className={cn(
              "p-2 rounded-lg bg-gradient-to-br",
              colorMap[color],
              "text-white"
            )}
          >
            <Icon className="h-5 w-5" />
          </div>
          {title}
        </h3>
        {isProfessional && (
          <Badge variant="secondary" className="bg-amber-100 text-amber-700">
            Professional Feature
          </Badge>
        )}
      </div>
      <div className={cn("p-4 rounded-lg border", bgColorMap[color])}>
        <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{content}</p>
      </div>
    </div>
  );
}
