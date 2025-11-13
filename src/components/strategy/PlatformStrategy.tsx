"use client";

import React from "react";
import { Facebook, Instagram, Linkedin } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface PlatformStrategyProps {
  strategy: {
    platform: "facebook" | "instagram" | "tiktok" | "linkedin";
    strategy: string;
    tactics: string[];
  };
}

const platformConfig = {
  facebook: {
    icon: Facebook,
    color: "from-blue-600 to-blue-700",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
  },
  instagram: {
    icon: Instagram,
    color: "from-pink-600 to-purple-700",
    bgColor: "bg-pink-50",
    borderColor: "border-pink-200",
  },
  tiktok: {
    icon: Instagram, // Using Instagram icon as placeholder
    color: "from-gray-900 to-gray-800",
    bgColor: "bg-gray-50",
    borderColor: "border-gray-200",
  },
  linkedin: {
    icon: Linkedin,
    color: "from-blue-700 to-blue-800",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
  },
};

export function PlatformStrategy({ strategy }: PlatformStrategyProps) {
  const config = platformConfig[strategy.platform];
  const Icon = config.icon;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center gap-3 mb-4">
        <div
          className={`p-3 rounded-lg bg-gradient-to-br ${config.color} text-white`}
        >
          <Icon className="h-6 w-6" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900 capitalize">
            {strategy.platform} Strategy
          </h3>
          <Badge variant="secondary" className="mt-1">
            {strategy.tactics.length} Tactics
          </Badge>
        </div>
      </div>

      <div className={`p-4 rounded-lg border ${config.bgColor} ${config.borderColor} mb-4`}>
        <p className="text-gray-700 leading-relaxed">{strategy.strategy}</p>
      </div>

      <div>
        <h4 className="font-medium text-gray-900 mb-3">Key Tactics:</h4>
        <ul className="space-y-2">
          {strategy.tactics.map((tactic, index) => (
            <li key={index} className="flex items-start gap-2 text-gray-700">
              <span className="text-blue-600 font-bold mt-1">→</span>
              <span>{tactic}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
