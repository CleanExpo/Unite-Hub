"use client";

import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle } from "lucide-react";

interface CharacterCounterProps {
  text: string;
  platform: string;
}

const platformLimits: Record<string, { max: number; optimal: number }> = {
  facebook: { max: 63206, optimal: 250 },
  instagram: { max: 2200, optimal: 125 },
  tiktok: { max: 2200, optimal: 150 },
  linkedin: { max: 3000, optimal: 150 },
  twitter: { max: 280, optimal: 240 },
};

export function CharacterCounter({ text, platform }: CharacterCounterProps) {
  const count = text.length;
  const limits = platformLimits[platform] || platformLimits.facebook;

  const percentUsed = (count / limits.max) * 100;
  const isOptimal = count <= limits.optimal;
  const isOverLimit = count > limits.max;

  let colorClass = "text-green-600";
  let bgClass = "bg-green-50";
  let icon = <CheckCircle className="h-4 w-4" />;

  if (isOverLimit) {
    colorClass = "text-red-600";
    bgClass = "bg-red-50";
    icon = <AlertCircle className="h-4 w-4" />;
  } else if (!isOptimal) {
    colorClass = "text-yellow-600";
    bgClass = "bg-yellow-50";
  }

  return (
    <div className={`flex items-center gap-2 p-2 rounded ${bgClass}`}>
      <span className={colorClass}>{icon}</span>
      <span className={`text-sm font-medium ${colorClass}`}>
        {count} / {limits.max} characters
      </span>
      {!isOverLimit && (
        <Badge variant="outline" className="ml-auto">
          {isOptimal ? "Optimal" : "Good"} for {platform}
        </Badge>
      )}
      {isOverLimit && (
        <span className="text-xs text-red-600 ml-auto">
          {count - limits.max} over limit
        </span>
      )}
    </div>
  );
}
